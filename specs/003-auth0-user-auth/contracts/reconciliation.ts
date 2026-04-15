/**
 * @module contracts/reconciliation
 * @description Types for the nightly Auth0 reconciliation job.
 * The reconciliation job detects Auth0 users without a corresponding Sous Chef
 * database record and creates the missing User + Account records.
 *
 * Source spec: specs/003-auth0-user-auth/spec.md FR-017
 * Research: specs/003-auth0-user-auth/research.md §3
 */

/**
 * A minimal Auth0 user record as returned by the Management API's
 * `GET /api/v2/users?fields=user_id,email,app_metadata` endpoint.
 * Only the fields needed for reconciliation are included.
 */
export interface Auth0UserRecord {
  /** Auth0 user ID (e.g., `auth0|abc123`). */
  readonly user_id: string;
  /** User's email address. */
  readonly email: string;
  /** Auth0 app_metadata. Contains our `userId` if post-registration ran successfully. */
  readonly app_metadata: {
    /** Canonical Sous Chef user ID (UUIDv4). Undefined if post-registration never ran. */
    userId?: string;
    /** User account status stored in Auth0 metadata. */
    status?: string;
  } | null;
  /** ISO 8601 timestamp when the Auth0 user was created. */
  readonly created_at: string;
}

/**
 * Describes a single Auth0 user that has no matching record in the Sous Chef database.
 * These are "orphaned" users that the reconciliation job will create records for.
 */
export interface OrphanedAuth0User {
  /** Auth0 user ID. */
  readonly auth0Id: string;
  /** User's email address. */
  readonly email: string;
  /**
   * Existing canonical user ID from Auth0 `app_metadata.userId`, if present.
   * If null, the reconciliation job generates a new UUIDv4 and patches Auth0 app_metadata.
   */
  readonly existingUserId: string | null;
  /** ISO 8601 timestamp when the Auth0 user was created. */
  readonly auth0CreatedAt: string;
}

/**
 * Result of a single reconciliation job run.
 * Emitted as a structured log and CloudWatch custom metric.
 */
export interface ReconciliationResult {
  /** ISO 8601 timestamp when the reconciliation run started. */
  readonly startedAt: string;
  /** ISO 8601 timestamp when the reconciliation run completed. */
  readonly completedAt: string;
  /** Number of Auth0 users scanned in the reconciliation window. */
  readonly auth0UsersScanned: number;
  /** Number of database users scanned in the reconciliation window. */
  readonly dbUsersScanned: number;
  /** Number of orphaned Auth0 users detected (in Auth0 but not in DB). */
  readonly orphanedUsersDetected: number;
  /** Number of orphaned users for which User + Account records were successfully created. */
  readonly usersRepaired: number;
  /** Number of orphaned users for which repair failed. These require manual investigation. */
  readonly repairFailures: number;
  /**
   * The Auth0 IDs that failed to be repaired.
   * Included only if `repairFailures > 0`.
   */
  readonly failedAuth0Ids?: string[];
}
