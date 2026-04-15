/**
 * @module contracts/authorizer
 * @description Types for the API Gateway Lambda REQUEST authorizer.
 * The authorizer validates Auth0 JWTs and injects user context into the
 * API Gateway request context for downstream Lambda functions.
 *
 * Source spec: specs/003-auth0-user-auth/spec.md FR-038, FR-039, FR-040, FR-042
 * Research: specs/003-auth0-user-auth/research.md §1
 */

import type { UserStatus } from "./user.js";

/**
 * Custom claims namespace used in Auth0 access tokens.
 * All Sous Chef custom claims are namespaced to comply with OIDC spec.
 */
export const CLAIM_NAMESPACE = "https://sous-chef.io/" as const;

/**
 * The decoded payload of an Auth0 access token with Sous Chef custom claims.
 * Validated by the Lambda REQUEST authorizer on every API request.
 */
export interface Auth0TokenPayload {
  /** Auth0 issuer. Must match `https://<tenant>.auth0.com/`. */
  readonly iss: string;
  /** Auth0 subject (Auth0 user ID, e.g., `auth0|abc123`). */
  readonly sub: string;
  /** Token audience. Must include `https://api.sous-chef.io`. */
  readonly aud: string | string[];
  /** Token expiration (Unix timestamp). */
  readonly exp: number;
  /** Token issued-at (Unix timestamp). */
  readonly iat: number;
  /** Canonical Sous Chef user ID (UUIDv4). */
  readonly "https://sous-chef.io/userId": string;
  /** Auth0 user ID — same as `sub`. Included for explicitness. */
  readonly "https://sous-chef.io/auth0Id": string;
  /** User's email address. */
  readonly "https://sous-chef.io/email": string;
  /** User's account status. Suspended users receive 403. */
  readonly "https://sous-chef.io/status": UserStatus;
}

/**
 * Context injected by the Lambda REQUEST authorizer into the API Gateway
 * request context. Downstream Lambda functions access this via
 * `event.requestContext.authorizer.<key>`.
 *
 * IMPORTANT: All values must be `string | number | boolean` — API Gateway
 * silently drops nested objects. JSON-serialize complex values if needed.
 *
 * @see research.md §1 — Context Injection
 */
export interface AuthorizerContext {
  /** Canonical Sous Chef user ID (UUIDv4). Primary identifier for all downstream operations. */
  userId: string;
  /** Auth0 `sub` claim. For Auth0 Management API calls only. */
  auth0Id: string;
  /** User's email address. */
  email: string;
  /** User's account status as a string. Check for `'active'` before proceeding. */
  status: string;
  /**
   * Whether this request is an impersonation session.
   * Stored as a string `'true'` or `'false'` due to API Gateway context scalar constraint.
   */
  isImpersonating: string;
}

/**
 * The IAM policy document returned by the Lambda REQUEST authorizer.
 * API Gateway caches this policy (keyed on the Authorization header) for
 * `resultsCacheTtl` seconds (default: 300s).
 */
export interface AuthorizerResponse {
  /** The principal identifier (use Auth0 `sub` for traceability). */
  principalId: string;
  /** IAM policy document. Effect: Allow or Deny. */
  policyDocument: {
    Version: "2012-10-17";
    Statement: Array<{
      Action: "execute-api:Invoke";
      Effect: "Allow" | "Deny";
      Resource: string;
    }>;
  };
  /** Key-value context passed to downstream Lambda functions. All values are scalars. */
  context: AuthorizerContext;
}
