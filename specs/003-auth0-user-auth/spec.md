# Feature Specification: Auth0 User Authentication

**Feature Branch**: `003-auth0-user-auth`
**Created**: 2026-04-14
**Status**: Draft
**Input**: User description: "Implement Auth0-based user authentication for the Sous Chef app across web (Next.js) and mobile (Expo) platforms. Users must log in via Auth0, with platform-specific flows (mobile shows auth screen automatically, web redirects to login page). Session persistence via refresh tokens. Users identified by auto-generated IDs synced to our database on signup. Profile page, account edit page, account deletion (cascading to Auth0), password reset, and MFA assignment via Auth0."

## Dependencies

| Spec                                                            | Relationship                                                                             |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [001-sous-chef-recipe-app](../001-sous-chef-recipe-app/spec.md) | **Downstream** — 001 FR-045 requires authentication provided by this spec                |
| [002-usda-food-data](../002-usda-food-data/spec.md)             | **Downstream** — 002 FR-035 uses the shared API Gateway authorizer provided by this spec |
| [005-ai-integration](../005-ai-integration/spec.md)             | **Downstream** — external agent OAuth (FR-018) builds on the auth layer                  |
| [010-subscriptions](../010-subscriptions/spec.md)               | **Downstream** — subscription tier is stored on the Account entity (FR-040–043)          |

## User Scenarios & Testing _(mandatory)_

<!--
  Integration references:
  - specs/001-sous-chef-recipe-app/spec.md (FR-045: authentication required, FR-040/FR-041: subscription tiers)
  - specs/002-usda-food-data/spec.md (FR-035: shared API Gateway authorizer)

  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
-->

### Out of Scope

The following are explicitly **not** part of this feature and will be addressed as separate features if needed:

- **Email change flow**: Users cannot change their email address through Sous Chef. Email changes require a separate feature that coordinates with Auth0's email verification.
- **Admin dashboard for user management**: No admin UI for viewing, searching, editing, or bulk-managing users. Suspension/reactivation (FR-035/FR-038) and impersonation (FR-042) are backend/API operations only; admin UI is a separate feature.

### User Story 1 - Sign Up and Database Synchronization (Priority: P1)

A new user opens Sous Chef on mobile or web and is presented with the Auth0 authentication interface. They create an account using email/password or a social provider. On successful signup, Auth0 triggers a post-registration action that generates a unique user ID, creates a User record in the Sous Chef database, and associates an Account record with the user. The user is then redirected into the app with an active session.

**Why this priority**: User creation is the foundational flow — no other feature in Sous Chef works without an authenticated user (FR-045 from Sous Chef spec). The dual-write to Auth0 and our database must be reliable from day one, as every downstream feature depends on the User entity existing in both systems.

**Independent Test**: Can be fully tested by signing up with a new email, verifying the user exists in both Auth0 and the Sous Chef database, confirming the auto-generated user ID matches across systems, and verifying an Account record was created. The user should land inside the app with an active session.

**Acceptance Scenarios**:

1. **Given** a new visitor on the mobile app, **When** the app launches, **Then** the Auth0 authentication screen is displayed automatically before any app content is accessible.
2. **Given** a new visitor on the web app, **When** they navigate to any protected route, **Then** they are redirected to the Auth0 login page.
3. **Given** a user completes signup via Auth0, **When** the post-registration action fires, **Then** the system generates a unique user ID (UUIDv4), creates a User record in the Sous Chef database, and creates an associated Account record.
4. **Given** signup succeeds in Auth0 but the database write fails, **When** the post-registration action encounters the error, **Then** the system retries the database write (up to 3 attempts with exponential backoff). If all retries fail, the user is informed that account setup is incomplete and directed to contact support.
5. **Given** a user signs up with a social provider (e.g., Google), **When** the post-registration action fires, **Then** the same User and Account creation flow applies — the social identity is linked within Auth0, and our database stores the same auto-generated user ID.

---

### User Story 2 - Login and Session Persistence (Priority: P1)

A returning user opens Sous Chef and is either already logged in (valid refresh token) or presented with the Auth0 login screen. On the mobile app, the auth screen appears automatically. On the web app, the user is redirected to the Auth0 login page. After successful authentication, the user receives an access token and a refresh token. The session persists as long as the refresh token is valid — the user does not need to re-authenticate on every app open.

**Why this priority**: Login and session persistence are the gateway to the entire app. Without a working login flow with persistent sessions, users would need to re-authenticate on every visit, making the app unusable. This satisfies Sous Chef FR-045 (authentication required for all features).

**Independent Test**: Can be fully tested by logging in, closing the app, reopening it, and verifying the user is still authenticated without seeing the login screen. Then force-expire the refresh token and verify the user is prompted to re-authenticate.

**Acceptance Scenarios**:

1. **Given** a registered user on the mobile app with no active session, **When** the app launches, **Then** the Auth0 login screen is displayed automatically.
2. **Given** a registered user on the web app with no active session, **When** they navigate to any route, **Then** they are redirected to the Auth0 login page.
3. **Given** a user successfully authenticates, **When** the Auth0 callback completes, **Then** the system stores an access token and a refresh token securely (Keychain/Keystore on mobile, httpOnly cookie on web).
4. **Given** a user has a valid refresh token, **When** they reopen the app after closing it, **Then** the system silently refreshes the access token and the user enters the app without seeing the login screen.
5. **Given** a user's access token has expired but the refresh token is still valid, **When** the user makes an API request, **Then** the system transparently refreshes the access token and retries the request without user intervention.
6. **Given** a user's refresh token has expired or been revoked, **When** the user attempts any action, **Then** the system redirects them to the Auth0 login screen to re-authenticate.

---

### User Story 3 - Logout (Priority: P1)

A logged-in user chooses to log out from the app. The system clears the local session (access token, refresh token), revokes the refresh token in Auth0, and returns the user to the authentication screen (mobile) or login page (web). The user must explicitly re-authenticate to access the app again.

**Why this priority**: Logout is a security-critical companion to login. Users must be able to terminate their session intentionally, especially on shared devices. This is a P1 because without it, there is no way to switch accounts or secure a session on a shared device.

**Independent Test**: Can be fully tested by logging in, triggering logout, verifying all local tokens are cleared, and confirming the user cannot access protected routes without re-authenticating.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they tap/click the logout button, **Then** the local access token and refresh token are cleared from secure storage.
2. **Given** a logged-in user, **When** they log out, **Then** the refresh token is revoked in Auth0 so it cannot be reused.
3. **Given** a user has logged out on the mobile app, **When** the app state updates, **Then** the Auth0 authentication screen is displayed automatically.
4. **Given** a user has logged out on the web app, **When** the logout completes, **Then** the user is redirected to the Auth0 login page.
5. **Given** a user has logged out, **When** they attempt to access any protected API endpoint with the old access token, **Then** the system returns `401 Unauthorized`.

---

### User Story 4 - View Profile Page (Priority: P1)

A logged-in user navigates to their profile page, which displays information stored in the Sous Chef User database — not Auth0 directly. The profile shows the user's display name, email, avatar (if set), account creation date, and any other user-level metadata. This page is read-only; edits happen on the separate account edit page.

**Why this priority**: The profile page is the user's identity within Sous Chef. It validates that the User entity in our database is correctly populated and accessible, which is a prerequisite for all user-facing features (recipe ownership, meal plans, subscriptions).

**Independent Test**: Can be fully tested by logging in, navigating to the profile page, and verifying all displayed fields match the User record in the database.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they navigate to the profile page, **Then** the system displays their display name, email, avatar, and account creation date sourced from the Sous Chef database.
2. **Given** a user whose database record has no avatar set, **When** they view the profile page, **Then** a default avatar placeholder is displayed.
3. **Given** an unauthenticated request to the profile page, **When** the system receives the request, **Then** it redirects to the login flow (mobile: auth screen; web: Auth0 login page).

---

### User Story 5 - Edit Account Details (Priority: P2)

A logged-in user navigates to the account edit page where they can modify their account details — display name, avatar, and any other editable account fields. Changes are saved to the Sous Chef database. Fields managed by Auth0 (email, password) are not editable from this page — those use dedicated Auth0 flows (password reset, email change via Auth0).

**Why this priority**: Account editing extends the profile experience and allows users to personalize their identity. It is P2 because the app is fully functional with the default account created at signup; personalization enhances but does not gate core functionality.

**Independent Test**: Can be fully tested by navigating to the account edit page, changing the display name and avatar, saving, and verifying the profile page reflects the updated values.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the account edit page, **When** they update their display name and save, **Then** the change is persisted to the Sous Chef database and reflected on the profile page.
2. **Given** a logged-in user on the account edit page, **When** they upload a new avatar image, **Then** the image is stored and displayed on the profile page.
3. **Given** a logged-in user on the account edit page, **When** they attempt to submit with an empty display name, **Then** the system prevents the save and displays a validation error.
4. **Given** a logged-in user on the account edit page, **When** they view the email field, **Then** it is displayed as read-only with a note directing them to Auth0 for email changes.

---

### User Story 6 - Delete Account and User (Priority: P2)

A logged-in user decides to delete their account. They initiate deletion from the account settings page. The system requires explicit confirmation (e.g., type "DELETE" to confirm). On confirmation, the system deletes the User and Account records from the Sous Chef database AND deletes the user from Auth0. This is a permanent, irreversible action. The user is logged out and returned to the authentication screen.

**Why this priority**: Account deletion is a regulatory and trust requirement (GDPR right to erasure, app store policies). It is P2 because it does not block core functionality but must be available before any public launch.

**Independent Test**: Can be fully tested by creating a user, initiating account deletion, confirming the action, and verifying the user no longer exists in both the Sous Chef database and Auth0. Attempting to log in with the deleted credentials should fail.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the account settings page, **When** they initiate account deletion, **Then** the system displays a confirmation dialog requiring them to type "DELETE" to proceed.
2. **Given** a user confirms account deletion, **When** the system processes the request, **Then** it deletes the User record and the associated Account record from the Sous Chef database.
3. **Given** a user confirms account deletion, **When** the system processes the request, **Then** it deletes the user from Auth0 via the Management API.
4. **Given** the Sous Chef database deletion succeeds but the Auth0 deletion fails, **When** the system encounters the error, **Then** it proceeds with the local deletion, queues the Auth0 deletion for automatic async retry (exponential backoff, max 5 attempts), and logs the failure. The user is logged out and returned to the authentication screen without being blocked.
5. **Given** account deletion completes, **When** the user is returned to the authentication screen, **Then** attempting to log in with the deleted credentials fails with an appropriate message.
6. **Given** a user has recipes, meal plans, or other data, **When** they delete their account, **Then** all user-owned data is cascade-deleted from the Sous Chef database.

---

### User Story 7 - Password Reset via Auth0 (Priority: P2)

A user who has forgotten their password or wants to change it triggers the Auth0 password reset flow. On the login screen, they click "Forgot Password" which directs them to Auth0's password reset page. Auth0 sends a reset email; the user follows the link to set a new password. The entire flow is handled by Auth0 — the Sous Chef backend is not involved in password management.

**Why this priority**: Password reset is a standard security feature expected by users. It is P2 because it does not block initial usage (users can still log in if they remember their password) but is essential for a production-ready authentication system.

**Independent Test**: Can be fully tested by clicking "Forgot Password" on the login screen, verifying the Auth0 reset email is received, following the reset link, setting a new password, and logging in with the new password.

**Acceptance Scenarios**:

1. **Given** a user on the Auth0 login screen, **When** they click "Forgot Password", **Then** Auth0 displays the password reset request form.
2. **Given** a user submits their email for password reset, **When** Auth0 processes the request, **Then** a password reset email is sent to the user's registered email address.
3. **Given** a user follows the reset link in the email, **When** they set a new password that meets Auth0's password policy, **Then** the password is updated and they can log in with the new password.
4. **Given** a user submits an email that does not exist in Auth0, **When** the reset request is processed, **Then** Auth0 displays a generic confirmation message (to prevent email enumeration).

---

### User Story 8 - MFA Assignment via Auth0 (Priority: P3)

A security-conscious user wants to enable Multi-Factor Authentication on their account. From the account settings page in Sous Chef, they are directed to Auth0's MFA enrollment flow where they can set up an authenticator app (TOTP), SMS, or other supported second factor. Once enrolled, subsequent logins require the second factor.

**Why this priority**: MFA is a security enhancement that protects high-value accounts. It is P3 because the app is fully functional and secure with password-only authentication at launch; MFA adds a layer of defense for users who opt in.

**Independent Test**: Can be fully tested by navigating to account settings, initiating MFA setup, enrolling an authenticator app, logging out, and verifying that the next login requires both password and the second factor.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the account settings page, **When** they click "Enable MFA", **Then** the system redirects them to Auth0's MFA enrollment flow.
2. **Given** a user is in the Auth0 MFA enrollment flow, **When** they scan the QR code with an authenticator app and enter the verification code, **Then** MFA is successfully enrolled on their Auth0 account.
3. **Given** a user has MFA enrolled, **When** they log in with their password, **Then** Auth0 prompts for the second factor before completing authentication.
4. **Given** a user has MFA enrolled, **When** they want to disable it, **Then** they can do so through the Auth0 MFA management flow from account settings.

---

### Edge Cases

- What happens when Auth0 is unavailable or experiencing an outage? (Users cannot authenticate; the app displays a clear error message indicating the authentication service is temporarily unavailable.)
- What happens when the post-signup database write fails after Auth0 user creation succeeds? (The system retries; if all retries fail, the Auth0 user exists but the Sous Chef User record does not. A reconciliation job detects orphaned Auth0 users and creates missing database records.)
- What happens when a user tries to sign up with an email already registered in Auth0? (Auth0 handles this natively — displays an error that the email is already in use.)
- What happens when a user's refresh token is revoked server-side (e.g., by an admin) while they are actively using the app? (The next API call fails with 401; the user is redirected to re-authenticate.)
- What happens when a user attempts to delete their account but the Auth0 Management API rate limit is hit? (The local database deletion proceeds immediately; the Auth0 deletion is queued for async retry with exponential backoff. The user is logged out normally.)
- What happens when a user signs up with a social provider and later tries to use "Forgot Password"? (Auth0 handles this — social-only users are informed that password reset is not applicable for their login method.)
- How does the system handle concurrent login sessions across multiple devices? (All sessions remain valid independently; logging out on one device does not log out other devices unless the refresh token is revoked globally.)
- What happens when the Auth0 post-registration action times out? (Auth0 retries the action. If retries are exhausted, the reconciliation job detects the missing database record and creates it.)
- What happens when a user is suspended while they have an active session? (The Auth0 block takes effect immediately on the next token validation. The existing access token is rejected by the authorizer with 403; the user cannot refresh. The client redirects to a "suspended account" screen.)

## Requirements _(mandatory)_

<!--
  Constitution reminders (Principles I-VII):
  - All interfaces/types MUST use strict TypeScript; no `any` outside test doubles (Principle I)
  - All exported symbols MUST carry JSDoc; braces required on all control structures (Principle II)
  - New code MUST use aliased imports with .js extensions; no `helpers/` directories (Principle III)
  - New UI elements MUST be queryable by role/label; no `data-testid` (Principles IV & VII)
  - Any new workspace MUST extend shared tooling configs and be declared in Turbo (Principle V)
  - Formatting and lint gates MUST remain green (Principle VI)
  - Interactive elements MUST have accessible names; design tokens MUST be used for color (Principle VII)
-->

### Functional Requirements

**Authentication Flows**

- **FR-001**: System MUST authenticate users via Auth0 using the Authorization Code Flow with PKCE for both web (Next.js) and mobile (Expo) platforms.
- **FR-002**: On the mobile app, the system MUST display the Auth0 authentication screen automatically when no valid session exists, before any app content is accessible.
- **FR-003**: On the web app, the system MUST redirect unauthenticated users to the Auth0 login page when they attempt to access any protected route.
- **FR-004**: System MUST support Auth0 social login providers (at minimum: Google) in addition to email/password authentication.
- **FR-005**: System MUST handle the Auth0 callback (redirect URI) on both platforms, exchanging the authorization code for access and refresh tokens.

**Session Management**

- **FR-006**: System MUST store access tokens and refresh tokens securely: Keychain (iOS) / Keystore (Android) on mobile; httpOnly, Secure, SameSite cookies on web.
- **FR-007**: System MUST silently refresh the access token using the refresh token when the access token expires, without requiring user interaction.
- **FR-008**: System MUST redirect the user to the Auth0 login screen when the refresh token expires or is revoked.
- **FR-009**: System MUST attach a valid access token to all API requests as a Bearer token in the Authorization header.

**Logout**

- **FR-010**: System MUST provide a logout action that clears all local tokens (access token, refresh token) from secure storage.
- **FR-011**: System MUST revoke the refresh token in Auth0 on logout via the Auth0 revocation endpoint.
- **FR-012**: After logout, the system MUST return the user to the authentication screen (mobile) or redirect to the Auth0 login page (web).

**User Registration and Database Sync**

- **FR-013**: On user signup, Auth0 MUST trigger a post-registration action (Auth0 Action) that generates a unique auto-generated user ID (UUIDv4) and creates a User record in the Sous Chef database.
- **FR-014**: The post-registration action MUST also create an Account record associated with the new User.
- **FR-015**: The auto-generated user ID MUST be stored in the Auth0 user's `app_metadata` so it is available in all subsequent tokens and API calls.
- **FR-016**: The post-registration action MUST retry database writes on transient failures (up to 3 attempts with exponential backoff).
- **FR-017**: A reconciliation mechanism MUST exist to detect Auth0 users without corresponding Sous Chef database records and create the missing records.

**Profile and Account Management**

- **FR-018**: System MUST provide a profile page that displays the authenticated user's information (display name, email, avatar, account creation date) sourced from the Sous Chef database.
- **FR-019**: System MUST provide an account edit page where users can update their display name and avatar. Changes MUST be persisted to the Sous Chef database.
- **FR-020**: The account edit page MUST display email as read-only. Email changes MUST be handled through Auth0's email change flow.
- **FR-021**: System MUST validate account edit inputs: display name MUST NOT be empty; avatar uploads MUST be limited to supported image formats and a maximum file size.

**Account Deletion**

- **FR-022**: System MUST provide an account deletion flow that requires explicit user confirmation (typing "DELETE" to confirm).
- **FR-023**: On confirmed deletion, the system MUST delete the User record and associated Account record from the Sous Chef database.
- **FR-024**: On confirmed deletion, the system MUST delete the user from Auth0 via the Auth0 Management API. If the Auth0 deletion fails, the system MUST proceed with the local database deletion and queue the Auth0 deletion for automatic async retry (exponential backoff, maximum 5 attempts). The user MUST NOT be blocked by Auth0 API failures.
- **FR-025**: Account deletion MUST cascade to all user-owned data in the Sous Chef database (recipes, meal plans, grocery lists, nutrition plans, AI provider configs, agent authorizations).
- **FR-026**: After successful deletion, the system MUST clear all local tokens and return the user to the authentication screen.

**Password Reset**

- **FR-027**: System MUST provide access to Auth0's password reset flow from the login screen via a "Forgot Password" link.
- **FR-028**: The password reset flow MUST be handled entirely by Auth0 — the Sous Chef backend MUST NOT store, process, or have access to user passwords.

**Multi-Factor Authentication**

- **FR-029**: System MUST provide access to Auth0's MFA enrollment flow from the account settings page.
- **FR-030**: System MUST support at minimum TOTP (authenticator app) as an MFA method via Auth0.
- **FR-031**: When MFA is enrolled, Auth0 MUST require the second factor on all subsequent login attempts.

**Social Account Linking**

- **FR-032**: System MUST allow a logged-in user to link additional social provider accounts (e.g., Google) to their existing Auth0 identity from the account settings page via the Auth0 Management API.
- **FR-033**: System MUST allow a logged-in user to unlink a social provider account from their Auth0 identity, provided at least one login method (email/password or another social provider) remains active.
- **FR-034**: When a user links or unlinks a social provider, the system MUST NOT create a new User or Account record in the Sous Chef database — the existing canonical user ID is preserved.

**User Impersonation**

- **FR-035**: System MUST support user impersonation for authorized support/engineering personnel via Auth0's impersonation or token exchange mechanism.
- **FR-036**: Impersonation sessions MUST be clearly distinguishable from normal sessions — all API requests made during impersonation MUST include an impersonation flag and the impersonator's identity in audit logs.
- **FR-037**: Impersonation MUST NOT allow password changes, account deletion, or MFA modifications on behalf of the impersonated user.

**API Authorization**

- **FR-038**: All Sous Chef API endpoints MUST require a valid Auth0 access token. Requests without a valid token MUST receive `401 Unauthorized`.
- **FR-039**: The API Gateway authorizer MUST validate Auth0 JWT tokens (signature, expiration, audience, issuer) on every request.
- **FR-040**: The access token MUST include the Sous Chef user ID (from `app_metadata`) as a custom claim, enabling the API to identify the requesting user without an additional database lookup.

**User Suspension**

- **FR-041**: The system MUST support suspending a user by both blocking the user in Auth0 (via the Management API "block" flag) and setting the User entity `status` to `suspended` in the Sous Chef database.
- **FR-042**: The API Gateway authorizer MUST deny access (return `403 Forbidden`) to users whose Auth0 account is blocked, even if the access token is otherwise valid.
- **FR-043**: A suspended user who attempts to log in MUST be shown a clear message indicating their account has been suspended.
- **FR-044**: The system MUST support reactivating a suspended user by unblocking them in Auth0 and setting the User entity `status` back to `active`.

### Non-Functional Requirements _(constitution-derived)_

- **NFR-001**: All TypeScript code in auth-related workspaces MUST compile with `strict: true`; no `any` used outside explicitly marked test doubles. Auth0 SDK types, token interfaces, and API response types MUST use strict typing with `interface` for data shapes and `type` for unions/aliases. (Constitution Principle I)
- **NFR-002**: All exported functions, classes, interfaces, type aliases, and interface fields in auth-related code MUST carry JSDoc block comments. Auth middleware, token refresh handlers, and post-registration actions MUST include `@param`, `@returns`, and `@throws` tags. (Principle II)
- **NFR-003**: All imports within auth-related workspaces MUST use aliased paths (`@shared/*`, `@web/*`, `@armoury/<pkg>`) with `.js`/`.jsx` extensions. No `helpers/` directories. (Principle III)
- **NFR-004**: All auth-related UI components (login screens, profile page, account edit page, deletion confirmation dialog) MUST expose accessible names queryable via `getByRole`/`getByLabel` in Playwright tests. `data-testid` is prohibited. (Principles IV & VII)
- **NFR-005**: Auth status indicators (logged in, logged out, session expired, MFA required) MUST NOT rely on color alone. Each status MUST be paired with a text label or icon. (Principle VII)
- **NFR-006**: Any new auth-related workspace MUST be registered in the root `package.json` workspaces array and MUST extend `@armoury/typescript`, `@armoury/eslint`, `@armoury/prettier`, and `@armoury/vitest` shared configs. Turbo task dependencies MUST be declared. (Principle V)
- **NFR-007**: All auth-related code MUST pass `turbo run typecheck`, `turbo run lint`, and `turbo run format:check` with zero errors before merge. (Principle VI)
- **NFR-008**: Tests MUST conform to the testing pyramid: >= 70% unit, <= 20% integration, <= 10% E2E. Each test file MUST open with a block comment mapping requirement IDs (FR-xxx) to test case descriptions. (Principle IV)
- **NFR-009**: Custom errors (e.g., `AuthSessionExpiredError`, `UserNotFoundError`, `AccountDeletionFailedError`) MUST extend `Error` and MUST expose a type guard (`isXxxError(e: unknown): e is XxxError`). (Principle I)
- **NFR-010**: All date fields in auth-related interfaces (e.g., `createdAt`, `lastLoginAt`, `tokenExpiresAt`) MUST be ISO 8601 strings, never `Date` objects. (Principle I)
- **NFR-011**: The login/signup UI MUST consume design system tokens (`--accent-primary`, `--accent-secondary`, semantic status colors) from the shared token set. Hard-coded color values in component styles are prohibited. (Principle VII)

**Observability**

- **NFR-012**: All auth-related backend functions (login callback, token refresh, post-registration action, account deletion, reconciliation job) MUST emit structured logs following standard AWS logging patterns (JSON format, correlation IDs, ISO 8601 timestamps). CloudWatch Logs MUST be configured as the log sink.
- **NFR-013**: CloudWatch Logs MUST drain to Sentry for centralized error tracking and alerting. All unhandled exceptions and explicit error events in auth flows MUST surface as Sentry issues with full stack traces and request context.
- **NFR-014**: Auth flows MUST emit CloudWatch custom metrics: login success/failure count, token refresh success/failure count, signup success/failure count, account deletion success/failure count, reconciliation job runs/repairs/failures. Metrics MUST use standard CloudWatch namespaces and dimensions (per-environment, per-platform).
- **NFR-015**: Client-side auth errors (failed login attempts, token refresh failures, session expiry events) MUST be captured by the Sentry client SDK with breadcrumbs for the preceding auth state transitions.
- **NFR-016**: Distributed tracing MUST be enabled across auth flows — from client request through API Gateway authorizer to backend handlers. Trace IDs MUST propagate via standard AWS X-Ray or OpenTelemetry headers.
- **NFR-017**: The observability architecture MUST allow future integration of LogRocket (session replay) and NewRelic (or equivalent APM) without requiring changes to application logging or metrics instrumentation.

### Key Entities

- **User**: Represents a registered Sous Chef user stored in our database. Key attributes: `id` (UUIDv4, auto-generated at signup — the canonical identifier across all Sous Chef systems), `auth0Id` (Auth0's `sub` claim — used only for Auth0 API calls, never as the primary identifier), `email` (synced from Auth0 at registration), `displayName`, `avatarUrl` (nullable), `status` (enum: `active` | `suspended` — default: `active`; suspended users are blocked in Auth0 and denied API access; status is managed by backend admin operations), `createdAt` (ISO 8601), `updatedAt` (ISO 8601). The User entity is the owner of all user-generated content (recipes, meal plans, etc.) and is the target of the cascade delete on account deletion. This entity fulfills Sous Chef FR-045 ("System MUST require user authentication for all features").

- **Account**: Represents the account/profile details associated with a User. Key attributes: `id` (UUIDv4), `userId` (foreign key to User), `subscriptionTier` (free | premium — default: free, managed by subscription feature), `createdAt` (ISO 8601), `updatedAt` (ISO 8601). The Account entity is created alongside the User during signup and deleted alongside the User during account deletion. It provides the extension point for subscription management (Sous Chef FR-040/FR-041) without overloading the User entity.

- **AuthSession**: Represents the client-side authentication state (not a database entity). Key attributes: `accessToken` (JWT), `refreshToken` (opaque string), `expiresAt` (ISO 8601 — when the access token expires), `userId` (extracted from the access token's custom claim). Stored in platform-specific secure storage (Keychain/Keystore on mobile, httpOnly cookies on web). Lifecycle: created on login, refreshed transparently on access token expiry, destroyed on logout or refresh token expiry.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete the signup flow (from app launch to authenticated home screen) in under 60 seconds on both mobile and web.
- **SC-002**: Returning users with a valid refresh token are authenticated and see app content within 3 seconds of app launch (no login screen displayed).
- **SC-003**: Token refresh succeeds transparently (no user-visible interruption) for 99.9% of refresh attempts when the refresh token is valid.
- **SC-004**: Account deletion completes (both Sous Chef database and Auth0) within 30 seconds of user confirmation.
- **SC-005**: The profile page loads and displays all user data within 2 seconds of navigation.
- **SC-006**: 100% of API requests without a valid access token receive `401 Unauthorized` — zero unauthenticated access to protected endpoints.
- **SC-007**: The authentication system supports 10,000 concurrent authenticated users without performance degradation (aligns with Sous Chef SC-009).
- **SC-008**: Password reset emails are delivered by Auth0 within 60 seconds of the user's request.

## Assumptions

- **A-001**: Auth0 is the sole identity provider. All credential management (password storage, social identity linking, MFA enrollment) is handled by Auth0. The Sous Chef backend never stores or processes passwords.
- **A-002**: The Auth0 tenant is pre-configured with the required application (SPA for web, Native for mobile), API audience, social connections (Google at minimum), and MFA policies before this feature is implemented.
- **A-003**: The mobile app uses `expo-auth-session` (or a compatible Auth0 Expo SDK) for the native auth flow. The web app uses `@auth0/nextjs-auth0` (or the Auth0 Next.js SDK) for server-side session management.
- **A-004**: The auto-generated user ID (UUIDv4) stored in Auth0 `app_metadata` is the canonical identifier used across all Sous Chef systems. The Auth0 `sub` claim (`auth0|...`) is used only for Auth0 Management API calls.
- **A-005**: Auth0's free or Developer tier provides sufficient capacity for initial development and launch. Rate limits on the Management API (e.g., for account deletion) are handled with retry logic.
- **A-006**: The Sous Chef database (PostgreSQL, per the USDA spec's architecture) stores User and Account records. No separate auth database is required.
- **A-007**: Auth0 post-registration actions execute synchronously during the signup flow. If the action times out (Auth0's 20-second limit), the reconciliation job (FR-017) serves as a safety net.
- **A-008**: Session persistence relies entirely on Auth0 refresh tokens. The Sous Chef backend does not maintain its own session store.
- **A-009**: The shared API Gateway authorizer referenced in USDA spec FR-035 is the Auth0 JWT authorizer implemented by this feature. This feature provides the authentication layer that both Sous Chef and USDA food data endpoints depend on.
- **A-010**: Account deletion is a hard delete, not a soft delete. All user data is permanently removed from the Sous Chef database. Auth0 user deletion is permanent and irreversible.

## Clarifications

### Session 2026-04-14

- Q: When DB deletion succeeds but Auth0 deletion fails, what should happen? → A: Proceed with local deletion, queue Auth0 deletion for automatic async retry (Option B — eventual consistency).
- Q: What level of observability should auth flows have? → A: Full — structured logging + CloudWatch metrics + distributed tracing + Sentry (error tracking via CloudWatch log drain + client SDK). Future LogRocket/NewRelic integration must be supported without app changes. Follow standard AWS logging/monitoring patterns.
- Q: Should the user lifecycle support a "suspended" state? → A: Yes, dual mechanism — Auth0 native "block user" for immediate enforcement + custom `status` field (active/suspended) on User entity for backend tracking and admin tooling.
- Q: What should be explicitly out of scope? → A: Email change flow and admin dashboard for user management. Social account linking/unlinking and user impersonation are IN scope.
