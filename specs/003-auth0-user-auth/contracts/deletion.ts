/**
 * @module contracts/deletion
 * @description Types for the async Auth0 user deletion queue (SQS).
 * When account deletion succeeds in the Sous Chef database but the Auth0
 * Management API call fails, the Auth0 deletion is queued for async retry.
 *
 * Source spec: specs/003-auth0-user-auth/spec.md FR-024
 * Research: specs/003-auth0-user-auth/research.md §2
 */

/**
 * Message body enqueued to the SQS Auth0 deletion queue when an Auth0 user
 * deletion fails after the database records have been deleted.
 *
 * Serialized to JSON when publishing to SQS.
 */
export interface Auth0DeletionMessage {
  /** Auth0 `sub` claim of the user to delete (e.g., `auth0|abc123`). */
  readonly auth0Id: string;
  /**
   * Canonical Sous Chef user ID. Included for audit logging only —
   * the database record has already been deleted when this message is processed.
   */
  readonly userId: string;
  /** ISO 8601 timestamp when the deletion was first attempted. */
  readonly enqueuedAt: string;
  /**
   * Human-readable reason why the first deletion attempt failed.
   * Used for DLQ investigation.
   */
  readonly failureReason: string;
}

/**
 * Result of processing a single Auth0DeletionMessage from the SQS queue.
 * Returned by the deletion worker handler for logging and metrics.
 */
export interface DeletionWorkerResult {
  /** The Auth0 ID that was processed. */
  auth0Id: string;
  /** Whether the Auth0 deletion succeeded in this attempt. */
  success: boolean;
  /** The SQS ApproximateReceiveCount at the time of this attempt (1-indexed). */
  attemptNumber: number;
  /**
   * If `success` is false, the next visibility timeout delay in seconds
   * (exponential backoff: 30, 60, 120, 240, 480).
   */
  nextRetryDelaySeconds?: number;
}
