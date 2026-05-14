# Wireframes: Auth0 User Authentication

**Branch**: `002-auth0-user-auth`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](../product-spec.md), [spec.md](../../spec.md)

---

## Index

| File                                                 | Description                                                                             | Key FRs                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------- |
| [login.md](./login.md)                               | Web login entry with social/email options, forgot-password, and session-state messaging | FR-001, FR-003, FR-004, FR-027         |
| [signup.md](./signup.md)                             | Signup screen with social/email entry and post-signup handoff expectations              | FR-001, FR-004, FR-013, FR-014, FR-015 |
| [mfa.md](./mfa.md)                                   | MFA enrollment/challenge screen concept for TOTP setup and verification                 | FR-029, FR-030, FR-031                 |
| [session-expired.md](./session-expired.md)           | Session-expired recovery state after refresh token expiry/revocation                    | FR-008, FR-012                         |
| [mobile-auth-callback.md](./mobile-auth-callback.md) | Mobile deep-link callback handling flow and failure recovery states                     | FR-002, FR-005, FR-006, FR-007         |

---

## FR Reference Key

- **FR-001**: Cross-platform Auth0 authorization code + PKCE authentication
- **FR-002**: Mobile auto-auth screen when unauthenticated
- **FR-003**: Web redirect to login for protected routes
- **FR-004**: Social login support (minimum Google)
- **FR-005**: Callback handling + code exchange for tokens
- **FR-006**: Secure token storage per platform
- **FR-007**: Silent token refresh
- **FR-008**: Re-auth redirect on refresh expiry/revocation
- **FR-012**: Return to auth surface after logout/session termination
- **FR-013**: Post-registration User creation in DB
- **FR-014**: Post-registration Account creation in DB
- **FR-015**: Canonical user ID in Auth0 app metadata
- **FR-027**: Forgot-password entry to Auth0 reset flow
- **FR-029**: Access to MFA enrollment flow
- **FR-030**: TOTP MFA support
- **FR-031**: MFA required on subsequent logins post-enrollment

---

## Usage Notes

- Wireframes are conceptual ASCII layouts for scope and behavior alignment.
- They are not pixel-accurate visual design mocks.
- Accessibility constraints (NFR-004/NFR-005) apply to all interactive elements shown.
