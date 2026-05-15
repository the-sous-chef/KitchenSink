# System Design: Auth0 User Authentication

**Feature Branch**: `002-auth0-user-auth`
**Created**: 2026-05-09
**Status**: Draft
**Source**: `specs/002-auth0-user-auth/v-model/requirements.md`

## Overview

The Auth0 User Authentication system decomposes into platform-specific authentication clients (web/mobile), a shared API Gateway authorizer Lambda, an Auth0 post-registration Action, backend account management handlers, and cross-cutting observability/infrastructure components. The system bridges Auth0 as the identity provider with the Sous Chef PostgreSQL database, ensuring every Auth0 user has a corresponding User and Account record.

**Dual-runtime note (added 2026-05-14, T18 doc-sync):** Backend components are split across two runtimes. SYS-005, SYS-006, SYS-007, and SYS-015 run as raw **AWS Lambda** functions (Node 22, `packages/services/identity-webhooks/`). SYS-009 (backend), SYS-010 (backend), SYS-013 (backend), SYS-014, and SYS-016 run inside the **NestJS 11 ECS service** (Node 24, `packages/services/identity/`). SYS-019 (`packages/shared/auth-types/`) is imported by both runtimes. SYS-015 (Lambda authorizer) is the sole JWT verification point; the ECS service trusts only the `AuthorizerContext` it receives from API Gateway.

## ID Schema

- **System Component**: `SYS-NNN` — sequential identifier for each component
- **Parent Requirements**: Comma-separated `REQ-NNN` list per component (many-to-many)
- Example: `SYS-003` with Parent Requirements `REQ-001, REQ-005` — component satisfies both requirements

## Decomposition View (IEEE 1016 §5.1)

| SYS ID  | Name                              | Description                                                                                                                                                                                                                                                                                                                        | Parent Requirements                                                                      | Type      |
| ------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------- |
| SYS-001 | Web Auth Client (Next.js)         | Implements Auth0 Authorization Code Flow with PKCE for the Next.js web app using `@auth0/nextjs-auth0` v4.x. Handles login redirect, callback, session cookies, and logout.                                                                                                                                                        | REQ-001, REQ-003, REQ-005, REQ-006, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012          | Subsystem |
| SYS-002 | Mobile Auth Client (Expo)         | Implements Auth0 Authorization Code Flow with PKCE for the Expo mobile app using `react-native-auth0` v5.5 and `expo-secure-store`. Handles auto-display of auth screen, callback, secure token storage, and logout.                                                                                                               | REQ-001, REQ-002, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012 | Subsystem |
| SYS-003 | Social Login Provider             | Configures and surfaces Auth0 social login connections (Google, etc.) on both platforms. Delegates to Auth0 for the actual OAuth flow.                                                                                                                                                                                             | REQ-004                                                                                  | Module    |
| SYS-004 | Token Refresh Handler             | Silently refreshes access tokens using refresh tokens on both platforms. Triggers re-authentication when refresh token is expired or revoked.                                                                                                                                                                                      | REQ-007, REQ-008                                                                         | Module    |
| SYS-005 | Post-Registration Auth0 Action    | Auth0 Action that fires after user registration. Generates UUIDv4 user ID, writes it to `app_metadata`, and calls the Sous Chef backend to create User and Account records. Implements retry with exponential backoff.                                                                                                             | REQ-013, REQ-014, REQ-015, REQ-016, REQ-IF-008                                           | Service   |
| SYS-006 | User/Account Provisioning Service | **[Lambda — `identity-webhooks`]** Raw Lambda handler (Node 22) that receives calls from the post-registration action and creates User + Account records in the Sous Chef PostgreSQL database.                                                                                                                                     | REQ-013, REQ-014, REQ-016, REQ-IF-008                                                    | Service   |
| SYS-007 | Reconciliation Job                | **[Lambda — `identity-webhooks`]** EventBridge-scheduled Lambda (Node 22) that compares Auth0 user list with Sous Chef database records and creates any missing User/Account records.                                                                                                                                              | REQ-017, REQ-IF-010                                                                      | Service   |
| SYS-008 | Profile View                      | UI component (web + mobile) that displays authenticated user's display name, email, avatar, and account creation date sourced from the Sous Chef database.                                                                                                                                                                         | REQ-018                                                                                  | Module    |
| SYS-009 | Account Edit Handler              | UI + **[ECS — `identity`]** NestJS REST handler (`PATCH /v1/users/me`, `PATCH /v1/users/me/profile`) for editing display name and avatar. Persists changes to the Sous Chef database. Validates display name is non-empty. Email field is read-only.                                                                               | REQ-019, REQ-020, REQ-021, REQ-022                                                       | Module    |
| SYS-010 | Account Deletion Handler          | UI + **[ECS — `identity`]** NestJS REST handler (`DELETE /v1/users/me`) for account deletion. Requires explicit confirmation ("DELETE"). Deletes User/Account records from Sous Chef DB, cascades to user-owned data, enqueues Auth0 deletion via SQS, then logs out.                                                              | REQ-023, REQ-024, REQ-025, REQ-026                                                       | Module    |
| SYS-011 | Password Reset Flow               | Surfaces Auth0's hosted password reset flow via a "Forgot Password" link. All password management delegated to Auth0; backend never handles passwords.                                                                                                                                                                             | REQ-027, REQ-028, REQ-CN-002                                                             | Module    |
| SYS-012 | MFA Enrollment Flow               | Surfaces Auth0's MFA enrollment (TOTP) from account settings. Auth0 enforces second factor on subsequent logins when enrolled.                                                                                                                                                                                                     | REQ-029, REQ-030, REQ-031                                                                | Module    |
| SYS-013 | Social Account Linking            | UI + **[ECS — `identity`]** NestJS REST handler (`POST/DELETE /v1/users/me/social-link`) for linking/unlinking social provider accounts via Auth0 Management API. Preserves canonical Sous Chef user ID; no new User/Account records created.                                                                                      | REQ-032, REQ-033, REQ-034                                                                | Module    |
| SYS-014 | User Impersonation                | **[ECS — `identity`]** NestJS admin endpoints for impersonation token exchange and audit logging. Supports authorized personnel impersonating users via Auth0 token exchange. Impersonation sessions are flagged; destructive actions are blocked.                                                                                 | REQ-035, REQ-036, REQ-037                                                                | Service   |
| SYS-015 | API Gateway JWT Authorizer        | **[Lambda — `identity-webhooks`]** Raw Lambda authorizer (Node 22) that validates Auth0 JWT tokens (signature, expiry, audience, issuer) using `jwks-rsa` and `jose`. Enforces `RS256` only. Returns IAM policy. Denies suspended users (403). Injects `AuthorizerContext` for downstream ECS service.                             | REQ-038, REQ-039, REQ-040, REQ-042, REQ-IF-004, REQ-IF-009                               | Service   |
| SYS-016 | User Suspension/Reactivation      | **[ECS — `identity`]** NestJS admin endpoints (`POST /v1/admin/users/:id/suspend`, `POST /v1/admin/users/:id/unsuspend`) that block/unblock users in Auth0 (Management API) and set `status` field in Sous Chef database. Suspended users see a clear message on login attempt.                                                    | REQ-041, REQ-043, REQ-044                                                                | Service   |
| SYS-017 | Observability & Logging           | Cross-cutting: structured JSON logging with correlation IDs (`@aws-lambda-powertools/logger` in Lambda; NestJS logger in ECS), CloudWatch metrics for auth flows, Sentry integration (`@sentry/aws-serverless` in Lambda; `@sentry/node` in ECS), distributed tracing (X-Ray/OpenTelemetry). Used by both Lambda and ECS runtimes. | REQ-NF-012, REQ-NF-013, REQ-NF-014, REQ-NF-015, REQ-NF-016, REQ-NF-017                   | Utility   |
| SYS-018 | CDK Infrastructure Stack          | **CDK v2** (`packages/infra/identity/`) defines VPC, RDS PostgreSQL 16, SQS queues, S3, ECS cluster/service/ALB, ECR, Secrets Manager, CloudWatch alarms. **Serverless Framework** (`serverless.yml`) wires Lambda functions and API Gateway (including REQUEST authorizer). Both tools live in the same infra package.            | REQ-IF-007, REQ-NF-006                                                                   | Subsystem |
| SYS-019 | Shared Auth Types & Error Classes | Cross-cutting: TypeScript strict-mode interfaces, type aliases, custom error classes (`AuthSessionExpiredError`, `UserNotFoundError`, etc.) with type guards. Shared across all auth workspaces.                                                                                                                                   | REQ-NF-001, REQ-NF-009, REQ-NF-010                                                       | Library   |
| SYS-020 | Auth UI Design System Integration | Cross-cutting: login/signup UI components consuming design system tokens. Accessible names for all auth UI elements. Status indicators with text labels (not color-only).                                                                                                                                                          | REQ-NF-004, REQ-NF-005, REQ-NF-011                                                       | Library   |

## Dependency View (IEEE 1016 §5.2)

| Source  | Target  | Relationship | Failure Impact                                                         |
| ------- | ------- | ------------ | ---------------------------------------------------------------------- |
| SYS-001 | SYS-004 | Uses         | Web sessions cannot be silently refreshed; users forced to re-login    |
| SYS-001 | SYS-019 | Uses         | Type safety lost; runtime errors possible in web auth flows            |
| SYS-001 | SYS-020 | Uses         | Auth UI loses design system styling and accessibility                  |
| SYS-002 | SYS-004 | Uses         | Mobile sessions cannot be silently refreshed; users forced to re-login |
| SYS-002 | SYS-019 | Uses         | Type safety lost; runtime errors possible in mobile auth flows         |
| SYS-002 | SYS-020 | Uses         | Auth UI loses design system styling and accessibility                  |
| SYS-003 | SYS-001 | Calls        | Social login unavailable on web                                        |
| SYS-003 | SYS-002 | Calls        | Social login unavailable on mobile                                     |
| SYS-004 | SYS-019 | Uses         | Token refresh type safety lost                                         |
| SYS-005 | SYS-006 | Calls        | User/Account records not created; orphaned Auth0 users                 |
| SYS-005 | SYS-019 | Uses         | Type safety lost in post-registration action                           |
| SYS-006 | SYS-017 | Uses         | Provisioning failures not logged or tracked                            |
| SYS-006 | SYS-019 | Uses         | Type safety lost in provisioning service                               |
| SYS-007 | SYS-006 | Calls        | Reconciliation cannot create missing records                           |
| SYS-007 | SYS-017 | Uses         | Reconciliation runs not observable                                     |
| SYS-008 | SYS-015 | Reads        | Profile data inaccessible (API calls unauthorized)                     |
| SYS-009 | SYS-015 | Calls        | Account edits cannot be persisted (API calls unauthorized)             |
| SYS-009 | SYS-019 | Uses         | Validation type safety lost                                            |
| SYS-010 | SYS-015 | Calls        | Account deletion cannot proceed (API calls unauthorized)               |
| SYS-010 | SYS-017 | Uses         | Deletion failures not logged                                           |
| SYS-013 | SYS-015 | Calls        | Social linking/unlinking cannot be authorized                          |
| SYS-014 | SYS-015 | Uses         | Impersonation tokens cannot be validated                               |
| SYS-014 | SYS-017 | Uses         | Impersonation audit trail lost                                         |
| SYS-015 | SYS-017 | Uses         | Authorizer failures not observable                                     |
| SYS-015 | SYS-019 | Uses         | JWT type safety lost                                                   |
| SYS-016 | SYS-015 | Calls        | Suspension status cannot be enforced at API level                      |
| SYS-016 | SYS-017 | Uses         | Suspension operations not logged                                       |
| SYS-018 | SYS-015 | Deploys      | Authorizer Lambda not deployed                                         |
| SYS-018 | SYS-005 | Deploys      | Post-registration action infrastructure not provisioned                |
| SYS-018 | SYS-006 | Deploys      | Provisioning service not deployed                                      |
| SYS-018 | SYS-007 | Deploys      | Reconciliation job not deployed                                        |

### Dependency Diagram

```text
Auth0 (External IdP)
  │
  ├──► SYS-001 (Web Auth Client)
  │       └── SYS-004 (Token Refresh)
  │       └── SYS-003 (Social Login)
  │       └── SYS-020 (UI Design)
  │       └── SYS-019 (Types/Errors)
  │
  ├──► SYS-002 (Mobile Auth Client)
  │       └── SYS-004 (Token Refresh)
  │       └── SYS-003 (Social Login)
  │       └── SYS-020 (UI Design)
  │       └── SYS-019 (Types/Errors)
  │
  ├──► SYS-005 (Post-Registration Action)
  │       └──► SYS-006 (Provisioning Service) ──► PostgreSQL DB
  │
  └──► SYS-015 (API Gateway JWT Authorizer)
          └── SYS-017 (Observability)
          └── SYS-019 (Types/Errors)

Client Requests ──► API Gateway ──► SYS-015 ──► Backend Handlers
                                                  ├── SYS-008 (Profile View)
                                                  ├── SYS-009 (Account Edit)
                                                  ├── SYS-010 (Account Deletion)
                                                  ├── SYS-013 (Social Linking)
                                                  ├── SYS-014 (Impersonation)
                                                  └── SYS-016 (Suspension)

SYS-018 (CDK Stack) ──► Deploys all Lambda/API Gateway/SQS resources
SYS-007 (Reconciliation) ──► Scheduled/on-demand ──► SYS-006
```

## Interface View (IEEE 1016 §5.3)

### External Interfaces

| Component | Interface Name                  | Protocol                  | Input                                                                                         | Output                                             | Error Handling                                   |
| --------- | ------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| SYS-001   | Auth0 Login Redirect            | HTTPS redirect            | Derived — supports cross-cutting implementation constraints for traced parent system behavior | 302 redirect to Auth0 login page (Derived)         | Redirect to error page on Auth0 failure          |
| SYS-001   | Auth0 Callback Handler          | HTTPS POST                | Derived — supports cross-cutting implementation constraints for traced parent system behavior | httpOnly session cookie; redirect to app (Derived) | 400/500 with error message                       |
| SYS-002   | Auth0 Mobile Auth Screen        | react-native-auth0 SDK    | Derived — supports cross-cutting implementation constraints for traced parent system behavior | Auth0 login UI presented; tokens stored (Derived)  | Error state shown; retry available               |
| SYS-005   | Auth0 Post-Registration Webhook | HTTPS POST (Auth0 Action) | Derived — supports cross-cutting implementation constraints for traced parent system behavior | `app_metadata.userId` set; 200 OK (Derived)        | Retry up to 3x; log failure; return 500 to Auth0 |
| SYS-007   | Reconciliation API Endpoint     | HTTPS GET/POST            | Derived — supports cross-cutting implementation constraints for traced parent system behavior | JSON: `{repaired: N, failed: N}` (Derived)         | 500 with error details; Sentry alert             |
| SYS-015   | API Gateway Lambda Authorizer   | Lambda invocation         | Derived — supports cross-cutting implementation constraints for traced parent system behavior | IAM policy document (Allow/Deny) (Derived)         | Deny policy on any validation failure            |

### Internal Interfaces

| Source  | Target  | Interface Name              | Protocol                                                                                      | Data Format                                                  | Error Handling                                    |
| ------- | ------- | --------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------- |
| SYS-005 | SYS-006 | Provision User              | Derived — supports cross-cutting implementation constraints for traced parent system behavior | `{auth0Id: string, userId: string, email: string}` (Derived) | Retry 3x exponential backoff; throw on exhaustion |
| SYS-007 | SYS-006 | Reconcile User              | Derived — supports cross-cutting implementation constraints for traced parent system behavior | `{auth0Id: string, email: string}` (Derived)                 | Log error; continue to next user                  |
| SYS-009 | SYS-015 | Update Account              | Derived — supports cross-cutting implementation constraints for traced parent system behavior | `{displayName: string, avatarUrl?: string}` (Derived)        | 400 validation error; 401/403 from authorizer     |
| SYS-010 | SYS-015 | Delete Account              | Derived — supports cross-cutting implementation constraints for traced parent system behavior | `{confirmation: "DELETE"}` (Derived)                         | 400 if confirmation missing; 401/403 from auth    |
| SYS-013 | SYS-015 | Link/Unlink Social Provider | Derived — supports cross-cutting implementation constraints for traced parent system behavior | `{provider: string, connection: string}` (Derived)           | 400 if last provider; 401/403 from authorizer     |
| SYS-016 | SYS-015 | Suspend/Reactivate User     | Derived — supports cross-cutting implementation constraints for traced parent system behavior | `{userId: string, action: "suspend" \ (Derived)              | "reactivate"}`                                    | 404 if user not found; 401/403 from authorizer |

## Data Design View (IEEE 1016 §5.4)

| Entity          | Component | Storage            | Protection at Rest               | Protection in Transit | Retention                                   |
| --------------- | --------- | ------------------ | -------------------------------- | --------------------- | ------------------------------------------- |
| Access Token    | SYS-001   | httpOnly cookie    | SameSite=Strict; Secure flag     | TLS 1.2+              | Expires per Auth0 token lifetime            |
| Access Token    | SYS-002   | expo-secure-store  | iOS Keychain / Android Keystore  | TLS 1.2+              | Cleared on logout or expiry                 |
| Refresh Token   | SYS-001   | httpOnly cookie    | SameSite=Strict; Secure flag     | TLS 1.2+              | Revoked on logout; expires per Auth0 config |
| Refresh Token   | SYS-002   | expo-secure-store  | iOS Keychain / Android Keystore  | TLS 1.2+              | Revoked on logout; expires per Auth0 config |
| User Record     | SYS-006   | PostgreSQL (RDS)   | RDS encryption at rest (AES-256) | TLS 1.2+ (pg SSL)     | Deleted on account deletion (cascade)       |
| Account Record  | SYS-006   | PostgreSQL (RDS)   | RDS encryption at rest (AES-256) | TLS 1.2+ (pg SSL)     | Deleted on account deletion (cascade)       |
| Auth0 User      | SYS-005   | Auth0 tenant       | Auth0 managed                    | TLS 1.2+              | Deleted on account deletion                 |
| app_metadata    | SYS-005   | Auth0 user profile | Auth0 managed                    | TLS 1.2+              | Deleted with Auth0 user                     |
| JWT Claims      | SYS-015   | In-memory (Lambda) | Not persisted                    | TLS 1.2+              | Discarded after request                     |
| Audit Log       | SYS-014   | CloudWatch Logs    | CloudWatch encryption            | TLS 1.2+              | 90-day retention (CloudWatch log group)     |
| Structured Logs | SYS-017   | CloudWatch Logs    | CloudWatch encryption            | TLS 1.2+              | 30-day retention (configurable)             |

---

## Coverage Summary

| Metric                        | Count                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Total System Components (SYS) | 20                                                                                                                       |
| Total Requirements Covered    | 44 functional + 17 non-functional + 10 interface + 5 constraint = 76                                                     |
| Requirements with SYS mapping | All REQ-001 through REQ-044, REQ-NF-001 through REQ-NF-017, REQ-IF-001 through REQ-IF-010, REQ-CN-001 through REQ-CN-005 |
| Derived Requirements          | 0                                                                                                                        |
