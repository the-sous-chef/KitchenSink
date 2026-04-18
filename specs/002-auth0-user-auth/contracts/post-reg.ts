/**
 * @module contracts/post-reg
 * @description Types for the Auth0 post-registration Action.
 * The Action runs synchronously during signup in Auth0's runtime (not on AWS).
 * It creates User + Account records in the Sous Chef database and patches
 * the Auth0 user's app_metadata with the generated canonical user ID.
 *
 * Source spec: specs/002-auth0-user-auth/spec.md FR-013, FR-014, FR-015, FR-016
 * Research: specs/002-auth0-user-auth/research.md §3 (reconciliation as safety net)
 */

/**
 * The payload the post-registration Action sends to the Sous Chef backend API
 * to create a User + Account record.
 */
export interface PostRegistrationPayload {
  /** Auth0 `sub` claim (e.g., `auth0|abc123`). */
  readonly auth0Id: string;
  /** User's email address as provided to Auth0 during signup. */
  readonly email: string;
  /**
   * Display name derived from signup.
   * For email/password signups: derived from the email local part.
   * For social signups: from the provider's `name` claim if available.
   */
  readonly displayName: string;
  /** ISO 8601 timestamp — Auth0 user creation time. */
  readonly auth0CreatedAt: string;
}

/**
 * The response returned by the Sous Chef backend to the post-registration Action.
 * Contains the generated canonical user ID that the Action stores in app_metadata.
 */
export interface PostRegistrationResponse {
  /**
   * The generated canonical Sous Chef user ID (UUIDv4).
   * The Action stores this in `app_metadata.userId` so it appears in all subsequent tokens.
   */
  readonly userId: string;
  /** Confirmation that the Account record was also created. */
  readonly accountCreated: boolean;
}

/**
 * The app_metadata shape written to Auth0 after successful post-registration.
 * Stored in `user.app_metadata` in Auth0 and surfaced as a custom claim in access tokens.
 */
export interface Auth0AppMetadata {
  /** Canonical Sous Chef user ID (UUIDv4). The primary identifier. */
  userId: string;
  /** User account status. Kept in sync with the database `users.status` field. */
  status: "active" | "suspended";
}
