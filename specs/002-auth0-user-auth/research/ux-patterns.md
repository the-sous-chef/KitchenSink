# UX Patterns: Authentication and Account Lifecycle

**Branch**: `002-auth0-user-auth` | **Date**: 2026-05-09
**Status**: Complete | **Source**: [spec.md](../spec.md), [plan.md](../plan.md)

---

## 1. Signup and Login Entry

### 1.1 Platform-Specific Auth Entry Gate

Authentication entry uses explicit platform behavior parity:

- **Mobile (Expo)**: auth screen is shown automatically when no valid session exists.
- **Web (Next.js)**: protected routes redirect unauthenticated users to Auth0 login.

**References**: FR-002, FR-003, FR-038.

---

### 1.2 Universal Login with Social Option

Signup/login UI is delegated to Auth0 Universal Login with at least Google + email/password options.

**Pattern constraints**:

- Do not present application content before auth state is valid.
- Keep copy explicit for social-only vs password users where reset semantics differ.

**References**: FR-001, FR-004, FR-027, User Story 1/2 acceptance scenarios.

---

## 2. Callback and Session Establishment

### 2.1 Auth Callback Completion Pattern

After authorization code exchange:

1. Validate callback and token exchange success.
2. Persist tokens in platform-appropriate secure storage.
3. Route user to authenticated home/profile entry.
4. On callback failure, show explicit recoverable error with retry/login action.

**References**: FR-005, FR-006.

---

### 2.2 Silent Refresh and Session Continuity

Use silent refresh when access token expires. UX should remain uninterrupted unless refresh token is invalid/revoked.

**Failure mode UX**:

- On refresh failure: clear local session and force re-auth.
- Show explicit session-expired state with primary CTA “Sign in again”.

**References**: FR-007, FR-008, SC-002, SC-003.

---

## 3. Logout and Session Termination

### 3.1 Confirmed Logout with Server Revocation

Logout action should:

1. Revoke refresh token server-side.
2. Clear local secure storage/cookies.
3. Return to login surface per platform.

**UX behavior**:

- Immediate visual confirmation (“You have been signed out”).
- No stale authenticated UI after logout completion.

**References**: FR-010, FR-011, FR-012.

---

## 4. Profile and Account Editing

### 4.1 Profile Read Pattern

Authenticated user profile view should present display name, email, avatar, creation date from local DB-backed user context.

**References**: FR-018, SC-005.

---

### 4.2 Account Edit with Immutable Email

Edit screen supports mutable display name and avatar with validation; email is visible but read-only with redirect note to Auth0 flow.

**Validation UX**:

- Inline errors for empty display name.
- File format/size constraints surfaced before upload/submit.

**References**: FR-019, FR-020, FR-021.

---

## 5. Account Deletion and Irreversible Actions

### 5.1 Destructive Confirmation Pattern

Account deletion must require explicit typed confirmation (`DELETE`) and present irreversible impact notice.

**Flow requirements**:

- Confirm intent explicitly.
- Complete local deletion synchronously.
- Do not block user on downstream Auth0 API retry path.
- End with forced logout and auth screen return.

**References**: FR-022..FR-026, User Story 6 acceptance scenarios.

---

## 6. Password Reset and MFA

### 6.1 Password Reset Delegation Pattern

Expose “Forgot Password” entry on login. Delegate full reset UX to Auth0 hosted flow.

**References**: FR-027, FR-028, SC-008.

---

### 6.2 MFA Enrollment and Challenge Pattern

Expose MFA enrollment from account settings; Auth0 handles second-factor challenge on subsequent logins.

**UX constraints**:

- Enrollment should be discoverable but not forced for all users (unless policy changes).
- Challenge failure path should provide retry and fallback recovery guidance.

**References**: FR-029, FR-030, FR-031.

---

## 7. Social Linking and Impersonation Surfaces

### 7.1 Social Link/Unlink Safety Pattern

Settings UI for provider linking must preserve account continuity and block unlink if it would remove the last login method.

**References**: FR-032, FR-033, FR-034.

---

### 7.2 Impersonation Visibility Pattern

When impersonation is active, visibly distinguish session state and block destructive account-security actions.

**References**: FR-035, FR-036, FR-037.

---

## 8. Suspension and Access Denial UX

### 8.1 Suspended Account Message Pattern

Suspended users should receive explicit, non-ambiguous denial messaging and contact/support guidance.

**Expected behavior**:

- Authorizer returns 403 for suspended/blocked identities.
- Client renders suspended-account view, not generic auth failure.

**References**: FR-041, FR-042, FR-043, FR-044.

---

## 9. Mobile Deep-Link Callback Pattern

### 9.1 Expo Auth Redirect Handling

Mobile auth callback must safely round-trip through deep link URI handling:

1. Launch Auth0 browser session.
2. Receive app scheme callback.
3. Validate callback state/nonce.
4. Store tokens in secure storage.
5. Navigate to authenticated app shell.

**Failure states**:

- User cancels browser auth.
- Callback scheme mismatch.
- Exchange succeeds but secure-store write fails.

Each failure state should map to explicit user-facing recovery actions.

**References**: FR-001..FR-007, mobile acceptance scenarios in User Story 1/2.
