# Tasks: Auth0 User Authentication

**Feature**: `002-auth0-user-auth`  
**Updated**: 2026-05-13  
**Source**: `spec.md`, `plan.md`, `v-model/requirements.md`, `v-model/architecture-design.md`, `v-model/module-design.md`

---

## Dependency Graph (topology-aligned)

```text
[P0 Shared Contracts]
T-001 -> T-002
   |
   +--> [P0 Infra Foundation]
        T-010 -> T-011 -> T-012 -> T-013 -> T-014 -> T-015
             |        |        |        |
             |        |        |        +--> T-020..T-024 (identity-webhooks lambdas)
             |        |        +------------> T-030..T-041 (identity service modules)
             |        +---------------------> T-050..T-056 (web integration)
             +------------------------------> T-060..T-066 (mobile integration)

[P1 Local Runtime + E2E]
T-070 -> T-071 -> T-072 -> T-073 -> T-074 -> T-075

[P2 Hardening + Traceability Closure]
T-080 -> T-081 -> T-082 -> T-083
```

---

## Phase 0 — `packages/shared/auth-types/`

### T-001 · Create shared auth contracts package [P]

**Depends on**: —  
**Implements**: REQ-001, REQ-005, REQ-006, REQ-009, REQ-039, REQ-040, REQ-CN-008, FR-001, FR-005, FR-006, FR-009, FR-039, FR-040, ARCH-001, ARCH-003, ARCH-024, MOD-001, MOD-003, MOD-024

- Scaffold `packages/shared/auth-types/` workspace with strict TS config and exports map.
- Add **thin cross-cutting contracts only** (per CODING_STANDARDS.md §2 — dedicated type packages are an antipattern):
    - JWT claims (including custom `userId` claim), authorizer context, session payload contracts.
    - SQS deletion queue message shape, reconciliation diff payload shape.
- Domain DTOs (`User`, `Account`, `Profile`) are NOT placed here — they live in `packages/services/identity/src/dto/` (see T-002).
- Add versioned contract barrels to avoid cross-package circular imports.

**Acceptance**: `@.../auth-types` exports only cross-cutting contracts; no domain schemas or Drizzle types reside in this package.

---

### T-002 · Define Drizzle schema and DTOs in identity service [P]

**Depends on**: T-001  
**Implements**: REQ-013, REQ-014, REQ-015, REQ-017, REQ-018, REQ-019, REQ-025, REQ-CN-003, FR-013, FR-014, FR-015, FR-017, FR-018, FR-019, FR-025, ARCH-011, ARCH-012, ARCH-015, MOD-011, MOD-012, MOD-015

- Define Drizzle table definitions for `users`, `accounts`, `profiles` in `packages/services/identity/src/schema/` — indexes, FK cascade semantics, status enums (`active`/`suspended`).
- Define `class-validator`-decorated DTOs in `packages/services/identity/src/dto/` for all identity service endpoints.
- Add `packages/services/identity/` as a workspace dependency of `packages/services/identity-webhooks/` so Lambda handlers import Drizzle schema types directly from the owning service, not from `auth-types`.

**Acceptance**: Drizzle schema and domain DTOs live exclusively in `packages/services/identity/src/{schema,dto}/`; identity-webhooks compiles against the same schema via workspace dependency.

---

## Phase 1 — `packages/infra/identity/` (CDK + Serverless, self-contained)

### T-010 · Bootstrap infra package and workspace wiring [P]

**Depends on**: T-001  
**Implements**: REQ-049, REQ-050, REQ-CN-008, FR-045, ARCH-027, ARCH-031, ARCH-032, MOD-027, MOD-031, MOD-032

- Initialize `packages/infra/identity/` with CDK app entrypoint + `serverless.yml` skeleton.
- Register npm workspace scripts and Turbo tasks for synth/deploy/dev-local flows.
- Add environment contract docs for dev/staging/prod Auth0 tenants and AWS accounts.

**Acceptance**: `npm run turbo -- filter infra/identity` targets resolve; package is self-contained in this repo.

---

### T-011 · Implement NetworkStack (VPC, subnets, SGs, routing)

**Depends on**: T-010  
**Implements**: REQ-050, REQ-IF-007, REQ-CN-007, FR-038, ARCH-031, MOD-031

- CDK `NetworkStack` with VPC/subnets/security groups for ECS service + DB connectivity.
- Define ingress path ALB -> ECS and controlled egress for Auth0 Management API calls.
- Export stack outputs consumed by `IdentityServiceStack` and `DataStack`.

**Acceptance**: `cdk synth` emits NetworkStack resources and cross-stack exports with no unresolved refs.

---

### T-012 · Implement DataStack (RDS, SQS+DLQ, S3, secrets)

**Depends on**: T-011  
**Implements**: REQ-013, REQ-014, REQ-017, REQ-025, REQ-026, REQ-050, REQ-IF-007, REQ-CN-007, FR-013, FR-014, FR-017, FR-025, FR-026, ARCH-017, ARCH-031, MOD-017, MOD-031

- CDK `DataStack` resources:
    - RDS PostgreSQL 16 (`db.t4g.small`)
    - SQS deletion queue + DLQ (`maxReceiveCount=5`)
    - S3 bucket(s) required by feature boundary
    - Secrets Manager entries for DB/Auth0 credentials
- Enable `pg_trgm` extension bootstrap migration hooks in deployment plan.

**Acceptance**: Synth shows RDS/SQS/DLQ/S3/secrets defined; queue redrive policy correct.

---

### T-013 · Implement IdentityServiceStack (ECR, ECS/Fargate, ALB, IAM)

**Depends on**: T-011, T-012  
**Implements**: REQ-018, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-035, REQ-036, REQ-037, REQ-038, REQ-050, FR-018..FR-024, FR-035..FR-038, ARCH-015, ARCH-016, ARCH-026, ARCH-031, MOD-015, MOD-016, MOD-026, MOD-031

- CDK `IdentityServiceStack`:
    - ECR repo and image deployment pipeline hooks
    - ECS task/service (Fargate) for NestJS identity API (Node 24)
    - ALB + target group + health checks
    - IAM role policies for DB/SQS/secrets access
    - CloudWatch log groups and alarms baseline

**Acceptance**: Synth includes ECS service reachable through ALB; IAM least-privilege policies in place.

---

### T-014 · Implement WebhooksStack boundary (Serverless owns Lambda + REST API + authorizer)

**Depends on**: T-012, T-013  
**Implements**: REQ-039, REQ-040, REQ-042, REQ-050, REQ-IF-007, REQ-IF-009, FR-038, FR-039, FR-040, FR-042, ARCH-024, ARCH-031, MOD-024, MOD-031

- In `serverless.yml`, define Lambda functions and API Gateway REST resources.
- Wire REQUEST authorizer Lambda to protected routes.
- Ensure ALB-backed identity API routes are integrated through API Gateway mapping.
- Keep CDK as owner of shared infra resources; serverless references exported ARNs/IDs.

**Acceptance**: `serverless print` resolves all references; REQUEST authorizer attached to protected endpoints.

---

### T-015 · LocalStack local infrastructure plan (docker-compose + health checks)

**Depends on**: T-010, T-012, T-014  
**Implements**: REQ-049, REQ-050, REQ-017, REQ-025, REQ-026, FR-017, FR-025, FR-026, ARCH-012, ARCH-017, ARCH-031, MOD-012, MOD-017, MOD-031

- Add `docker-compose.yml` plan in `packages/infra/identity/` with:
    - LocalStack Community service (SQS, S3, EventBridge)
    - sibling Postgres container
- Add LocalStack readiness and Postgres health check scripts.
- Add local seed/migration script wiring for test bootstrap.
- Add `npm run dev:local` turbo target orchestrating local infra + service + lambdas.

**Acceptance**: Local runtime bootstrap sequence documented and executable end-to-end.

---

## Phase 2 — `packages/services/identity-webhooks/` (raw Lambda handlers)

### T-020 · Implement REQUEST authorizer Lambda [P]

**Depends on**: T-002, T-014  
**Implements**: REQ-038, REQ-039, REQ-040, REQ-041, REQ-042, REQ-IF-004, REQ-CN-001, FR-038, FR-039, FR-040, FR-041, FR-042, ARCH-024, ARCH-025, MOD-024, MOD-025

- Build Node 22 raw handler (no NestJS) for API Gateway REQUEST authorizer.
- Validate JWT signature/issuer/audience/expiry via JWKS.
- Inject canonical `userId` into authorizer context.
- Enforce suspension by returning deny policy for blocked/suspended users.

**Acceptance**: Valid token => allow+context; invalid/missing token => 401; suspended => 403.

---

### T-021 · Implement post-registration sync Lambda (reuse existing Actions/Triggers)

**Depends on**: T-002, T-012  
**Implements**: REQ-013, REQ-014, REQ-015, REQ-016, REQ-IF-008, REQ-CN-003, FR-013, FR-014, FR-015, FR-016, ARCH-010, ARCH-011, MOD-010, MOD-011

- Implement raw Lambda invoked by existing Auth0 post-registration trigger chain.
- Idempotently upsert `users + accounts + profiles` transaction, keyed on `users.id` (which stores the Auth0 sub value).
- No writeback to Auth0 Management API per FR-015.
- Explicitly document: **reuse existing Auth0 Actions/Triggers; do not create new Actions**.

**Acceptance**: Signup creates canonical DB rows; `users.id` is the upsert key; no Auth0 Management API calls are made.

---

### T-022 · Implement async deletion-worker Lambda (SQS consumer)

**Depends on**: T-012  
**Implements**: REQ-025, REQ-026, REQ-IF-005, REQ-CN-001, FR-025, FR-026, ARCH-017, MOD-017

- Consume deletion messages from SQS queue.
- Retry Auth0 delete with exponential backoff policy; move to DLQ after 5 receives.
- Emit structured logs and retry metrics.

**Acceptance**: transient Auth0 failures retry correctly; permanent failures land in DLQ.

---

### T-023 · Implement nightly reconciliation Lambda (EventBridge Scheduler)

**Depends on**: T-002, T-012, T-014  
**Implements**: REQ-017, REQ-IF-010, FR-017, ARCH-012, MOD-012

- Build scheduled raw Lambda to diff Auth0 users vs DB users (`auth0_id` key).
- Create missing rows (users/accounts/profiles) via shared schema.
- Emit reconciliation counters (scanned/repaired/skipped/errors).

**Acceptance**: Nightly run creates only missing rows and is idempotent on repeated runs.

---

### T-024 · Implement webhook package observability and error envelope [P]

**Depends on**: T-020, T-021, T-022, T-023  
**Implements**: REQ-IF-006, NFR-012, NFR-013, NFR-014, NFR-016, NFR-017, ARCH-027, ARCH-028, ARCH-029, MOD-027, MOD-028, MOD-029

- Standardize structured logging and correlation IDs across all lambdas.
- Add Sentry integration and CloudWatch custom metric emission.
- Ensure trace headers propagate from API Gateway through handlers.

**Acceptance**: All lambdas emit structured logs/metrics/traces and surface unhandled errors to Sentry.

---

## Phase 3 — `packages/services/identity/` (NestJS ECS service)

### T-030 · Scaffold NestJS identity service and module boundaries [P]

**Depends on**: T-001, T-002, T-013  
**Implements**: REQ-018..REQ-024, REQ-035..REQ-038, REQ-CN-002, FR-018..FR-024, FR-035..FR-038, ARCH-015, ARCH-016, ARCH-026, MOD-015, MOD-016, MOD-026

- Create `AuthModule`, `UsersModule`, `AccountsModule`, `ProfileModule`, `AdminModule`.
- Wire DB layer via Drizzle + `pg` using shared schema contracts.
- Add REST controller scaffolds with request validation pipeline.

**Acceptance**: Service boots locally and exposes versioned API routes with module isolation.

---

### T-031 · Implement `GET /v1/users/me` profile read path

**Depends on**: T-030, T-020  
**Implements**: REQ-018, FR-018, ARCH-013, ARCH-015, MOD-013, MOD-015

- Resolve caller identity from authorizer context (`userId`).
- Fetch and return profile/account read model.

**Acceptance**: Authenticated user gets own profile payload; no anonymous access.

---

### T-032 · Implement `PATCH /v1/users/me` account/profile update path

**Depends on**: T-031  
**Implements**: REQ-019, REQ-020, REQ-021, REQ-CN-005, FR-019, FR-020, FR-021, ARCH-014, ARCH-015, MOD-014, MOD-015

- Support display name and avatar updates with strict input validation per FR-021:
    - **Display name**: 1–50 characters, non-empty, non-whitespace-only. Reject blank strings and strings that exceed 50 characters.
    - **Avatar**: JPEG, PNG, or WebP format only; maximum file size 5 MB. Reject unsupported MIME types and oversized uploads.
- Return updated representation with consistent timestamps.
- Return HTTP 400 with a structured error body for any validation failure; do not partially apply updates when any field is invalid.

**Acceptance**:
- Valid display name and avatar updates persist and are reflected in the response.
- `PATCH` with a display name that is empty, whitespace-only, or exceeds 50 characters returns 400.
- `PATCH` with an avatar that is not JPEG/PNG/WebP, or exceeds 5 MB, returns 400.
- Invalid payloads return deterministic 4xx errors with a machine-readable error code.

---

### T-033 · Implement `DELETE /v1/users/me` with cascade + async delete enqueue

**Depends on**: T-030, T-022  
**Implements**: REQ-025, REQ-026, REQ-CN-004, REQ-IF-005, FR-025, FR-026, ARCH-016, ARCH-017, MOD-016, MOD-017

- Execute DB deletion transaction (user-owned cascades).
- Publish deletion job to SQS for Auth0 delete worker.
- Return safe completion response and revoke local session contract.

**Acceptance**: DB rows removed immediately; Auth0 deletion happens async with retry semantics.

---

### T-034 · Implement password reset integration endpoints/links support

**Depends on**: T-030  
**Implements**: REQ-027, REQ-028, FR-027, FR-028, ARCH-018, MOD-018

- Provide backend contract(s) needed by web/mobile for reset initiation links and responses.
- Keep actual reset execution in Auth0-hosted flow.

**Acceptance**: Clients can trigger Auth0 password reset journey from supported entry points.

---

### T-035 · Implement MFA enrollment/management support endpoints

**Depends on**: T-030  
**Implements**: REQ-029, REQ-030, REQ-031, FR-029, FR-030, FR-031, ARCH-019, MOD-019

- Expose service endpoints/contracts for MFA enrollment and management links.
- Validate access rules and response semantics.

**Acceptance**: Clients can route users into Auth0 MFA journey and observe state transitions.

---

### T-036 · Implement social account linking/unlinking APIs

**Depends on**: T-030  
**Implements**: REQ-032, REQ-033, REQ-034, FR-032, FR-033, FR-034, ARCH-020, ARCH-021, MOD-020, MOD-021

- Integrate with Auth0 Management API for link/unlink operations.
- Enforce invariant: never create duplicate User/Account rows during linking changes.

**Acceptance**: link/unlink operations succeed with canonical local user ID preserved.

---

### T-037 · Implement impersonation guardrails and audit logging

**Depends on**: T-030, T-020  
**Implements**: REQ-035, REQ-036, REQ-037, FR-035, FR-036, FR-037, ARCH-022, ARCH-023, MOD-022, MOD-023

- Accept impersonation context for authorized roles only.
- Emit audit fields (`impersonatorId`, `impersonatedUserId`, flags) on all impersonated requests.
- Block restricted operations during impersonation sessions.

**Acceptance**: impersonation requests are auditable and restricted per requirement.

---

### T-038 · Implement admin suspension/reactivation APIs

**Depends on**: T-030, T-020  
**Implements**: REQ-041, REQ-042, REQ-043, REQ-044, REQ-CN-006, FR-041, FR-042, FR-043, FR-044, ARCH-025, ARCH-026, MOD-025, MOD-026

- Admin endpoints to set user suspended/active status.
- Sync Auth0 block/unblock state with DB status changes.

**Acceptance**: suspended users are denied by authorizer; reactivated users regain access.

---

### T-039 · Service-level observability baseline [P]

**Depends on**: T-030  
**Implements**: NFR-012, NFR-013, NFR-014, NFR-015, NFR-016, NFR-017, ARCH-027, ARCH-028, ARCH-029, ARCH-030, MOD-027, MOD-028, MOD-029, MOD-030

- Structured logs, metrics, tracing, and Sentry in NestJS service.
- Ensure request correlation from API Gateway through ECS handlers.

**Acceptance**: dashboards/alerts can correlate API traffic, auth failures, and downstream errors.

---

### T-040 · Integration tests for service modules [P]

**Depends on**: T-031..T-039  
**Implements**: REQ-018..REQ-044, FR-018..FR-044, ARCH-013..ARCH-030, MOD-013..MOD-030

- Add module integration tests for users/accounts/profile/admin/impersonation flows.
- Include suspension and deletion edge cases.

**Acceptance**: integration suite passes against local Postgres and mocked external dependencies.

---

### T-041 · Align API contracts with downstream specs (001/003/005/010)

**Depends on**: T-031..T-038  
**Implements**: REQ-045, REQ-046, REQ-047, REQ-048, FR-045

- Verify auth layer contract compatibility with dependent features:
    - 001 authentication gate and account tier linkage
    - 003 shared authorizer expectations
    - 005 OAuth integration dependency
    - 010 account tier storage assumptions

**Acceptance**: no contract drift for downstream feature assumptions.

---

## Phase 4 — Web integration (`@auth0/nextjs-auth0` v4.x)

### T-050 · Implement web protected-route middleware and login redirect [P]

**Depends on**: T-030  
**Implements**: REQ-001, REQ-003, REQ-005, REQ-IF-001, FR-001, FR-003, FR-005, ARCH-001, ARCH-002, MOD-001, MOD-002

- Configure Next.js Auth0 handlers and middleware for protected routes.
- Redirect unauthenticated requests to Auth0 login.

**Acceptance**: protected web routes always gate through Auth0 session.

---

### T-051 · Implement secure web session persistence and refresh

**Depends on**: T-050  
**Implements**: REQ-006, REQ-007, REQ-008, REQ-009, FR-006, FR-007, FR-008, FR-009, ARCH-003, ARCH-008, MOD-003, MOD-008

- Enforce httpOnly/Secure/SameSite cookies.
- Implement silent refresh behavior and expired-session fallback to login.

**Acceptance**: valid refresh token keeps user signed in without UX interruption.

---

### T-052 · Implement web logout and refresh token revocation

**Depends on**: T-051  
**Implements**: REQ-010, REQ-011, REQ-012, FR-010, FR-011, FR-012, ARCH-001, MOD-001

- Clear session cookies and trigger Auth0 token revocation/logout flow.

**Acceptance**: post-logout requests require re-authentication.

---

### T-053 · Build web profile page integration

**Depends on**: T-031, T-051  
**Implements**: REQ-018, FR-018, ARCH-013, MOD-013

- Wire UI route to `GET /v1/users/me`.

**Acceptance**: profile page renders canonical API response.

---

### T-054 · Build web account edit + deletion integration

**Depends on**: T-032, T-033  
**Implements**: REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, FR-019..FR-026, ARCH-014, ARCH-016, MOD-014, MOD-016

- Integrate account edit form and deletion confirmation UX to identity API.

**Acceptance**: edit and delete flows complete with expected API outcomes.

---

### T-055 · Build web password reset / MFA / social-link UI hooks [P]

**Depends on**: T-034, T-035, T-036  
**Implements**: REQ-027..REQ-034, FR-027..FR-034, ARCH-018, ARCH-019, ARCH-021, MOD-018, MOD-019, MOD-021

- Add account settings actions for reset password, MFA enrollment, social link/unlink.

**Acceptance**: all auth account-management links and callbacks work from web UX.

---

### T-056 · Web integration tests and accessibility assertions

**Depends on**: T-050..T-055  
**Implements**: REQ-001..REQ-034, FR-001..FR-034, NFR-004, NFR-005, NFR-008, NFR-011

- Add Playwright/Vitest coverage for login/session/logout/profile/account scenarios.
- Enforce role/label selectors (no `data-testid`) for auth UIs.

**Acceptance**: web auth integration tests pass and satisfy accessibility selector constraints.

---

## Phase 5 — Mobile integration (`react-native-auth0` v5.5)

### T-060 · Implement mobile auto-auth gate and callback [P]

**Depends on**: T-030  
**Implements**: REQ-001, REQ-002, REQ-005, REQ-IF-002, FR-001, FR-002, FR-005, ARCH-004, ARCH-006, MOD-004, MOD-006

- Show auth screen automatically when no valid mobile session exists.
- Handle callback/deeplink token exchange path.

**Acceptance**: unauthenticated mobile launch always goes through Auth0 login.

---

### T-061 · Implement secure mobile token storage and refresh

**Depends on**: T-060  
**Implements**: REQ-006, REQ-007, REQ-008, REQ-009, REQ-IF-003, FR-006, FR-007, FR-008, FR-009, ARCH-005, ARCH-009, MOD-005, MOD-009

- Persist tokens in platform secure storage (Keychain/Keystore).
- Implement silent refresh and invalid-refresh fallback.

**Acceptance**: tokens persist securely across app restarts; expired refresh forces login.

---

### T-062 · Implement mobile logout and revocation

**Depends on**: T-061  
**Implements**: REQ-010, REQ-011, REQ-012, FR-010, FR-011, FR-012, ARCH-004, MOD-004

- Clear secure storage and trigger Auth0 revocation/logout semantics.

**Acceptance**: logout ends session and shows auth screen again.

---

### T-063 · Build mobile profile/account integration

**Depends on**: T-031, T-032, T-033, T-061  
**Implements**: REQ-018..REQ-026, FR-018..FR-026, ARCH-013, ARCH-014, ARCH-016, MOD-013, MOD-014, MOD-016

- Bind mobile screens to profile read/update/delete endpoints.

**Acceptance**: mobile profile/account flows match API behavior.

---

### T-064 · Build mobile password reset / MFA / social-link entry points [P]

**Depends on**: T-034, T-035, T-036  
**Implements**: REQ-027..REQ-034, FR-027..FR-034, ARCH-018, ARCH-019, ARCH-021, MOD-018, MOD-019, MOD-021

- Add mobile account actions for reset password, MFA enrollment, social linking.

**Acceptance**: supported account-management journeys are reachable from mobile UI.

---

### T-065 · Mobile integration tests and secure-storage assertions

**Depends on**: T-060..T-064  
**Implements**: REQ-001..REQ-034, FR-001..FR-034, NFR-004, NFR-005, NFR-008

- Add mobile auth flow test coverage including launch/login/logout/refresh behavior.

**Acceptance**: mobile integration suite passes with secure storage and redirect invariants proven.

---

### T-066 · Validate impersonation/suspension UX messaging on mobile

**Depends on**: T-037, T-038, T-064  
**Implements**: REQ-036, REQ-037, REQ-042, REQ-043, FR-036, FR-037, FR-042, FR-043, ARCH-023, ARCH-025, MOD-023, MOD-025

- Ensure suspended and impersonated states produce explicit, user-safe messaging.

**Acceptance**: blocked/suspended scenarios are handled with clear UX states.

---

## Phase 6 — LocalStack + E2E integration runtime

### T-070 · Author `docker-compose.yml` for LocalStack Community + Postgres [P]

**Depends on**: T-015  
**Implements**: REQ-049, FR-017, FR-025, FR-026, ARCH-031, MOD-031

- Define compose services, networks, and startup ordering for LocalStack + Postgres.

**Acceptance**: single compose command starts both services deterministically.

---

### T-071 · Implement LocalStack bootstrap + health checks

**Depends on**: T-070  
**Implements**: REQ-049, REQ-050, ARCH-031, MOD-031

- Provision local SQS/S3/EventBridge resources and verify readiness.

**Acceptance**: health script fails fast on missing local resources.

---

### T-072 · Implement Postgres seed/migration local scripts

**Depends on**: T-070, T-002  
**Implements**: REQ-013, REQ-014, REQ-018, REQ-019, REQ-049, FR-013, FR-014, FR-018, FR-019, ARCH-015, MOD-015

- Add migration + seed scripts for local DB reset and baseline fixtures.

**Acceptance**: local DB can be reset and seeded repeatedly for e2e runs.

---

### T-073 · Implement `npm run dev:local` turbo target

**Depends on**: T-071, T-072  
**Implements**: REQ-049, REQ-050, ARCH-032, MOD-032

- Orchestrate LocalStack, Postgres, NestJS service, and lambda local invocation workflows.

**Acceptance**: one command starts complete local development topology.

---

### T-074 · E2E: local API + authorizer + ECS-local service path

**Depends on**: T-073, T-056, T-065  
**Implements**: REQ-001..REQ-044, FR-001..FR-044, ARCH-024, ARCH-015, MOD-024, MOD-015

- Execute end-to-end tests against LocalStack API Gateway/authorizer path and local identity service.

**Acceptance**: auth-protected route tests pass against local emulated infrastructure.

---

### T-075 · E2E: local deletion-worker + reconciliation scheduled flows

**Depends on**: T-073, T-022, T-023  
**Implements**: REQ-017, REQ-025, REQ-026, FR-017, FR-025, FR-026, ARCH-012, ARCH-017, MOD-012, MOD-017

- Verify local queue-driven deletion retries and scheduled reconciliation behavior.

**Acceptance**: local e2e confirms deletion retry/DLQ and reconciliation repair workflows.

---

## Phase 7 — Hardening and closure

### T-080 · Auth0 tenant rollout plan (dev/staging/prod) + existing Actions reuse ✅

**Depends on**: T-021, T-014  
**Implements**: REQ-001, REQ-004, REQ-013..REQ-017, FR-001, FR-004, FR-013..FR-017, ARCH-010, MOD-010

- Document and apply tenant strategy (`kitchensink-dev/staging/prod`).
- Confirm existing Actions/Triggers reused from tenant-template and no new Actions authored.
- Status: Complete — see `packages/infra/identity/docs/auth0-tenant-rollout.md`.

**Acceptance**: tenant config checklist passes for all environments.

---

### T-081 · Performance + reliability checks for authorizer and async workers [P] ✅

**Depends on**: T-020, T-022, T-023, T-039  
**Implements**: SC-003, SC-004, SC-006, REQ-039, REQ-042, REQ-025, REQ-026, FR-039, FR-042, FR-025, FR-026, ARCH-024, ARCH-017, MOD-024, MOD-017

- Validate authorizer latency/error targets and deletion worker retry behavior under failure injection.
- Status: Complete — see `packages/infra/identity/docs/perf-reliability.md`.

**Acceptance**: observed metrics remain within target thresholds.

---

### T-082 · Traceability pass: requirements-to-implementation matrix refresh ✅

**Depends on**: T-041, T-074, T-075  
**Implements**: REQ-001..REQ-050, FR-001..FR-045, ARCH-001..ARCH-033, MOD-001..MOD-033

- Update feature trace matrix to ensure no dropped REQ/FR/ARCH/MOD IDs.
- Status: Complete — refreshed `specs/002-auth0-user-auth/v-model/requirements.md` traceability table.

**Acceptance**: every requirement/module ID has at least one implementing task and test reference.

---

### T-083 · CI gates for lint/typecheck/tests on updated topology ✅

**Depends on**: T-056, T-065, T-074, T-075  
**Implements**: NFR-001, NFR-002, NFR-003, NFR-006, NFR-007, NFR-008, FR-045, ARCH-032, MOD-032

- Wire CI jobs for all new workspaces and localstack-backed e2e stage.
- Status: Complete — added `.github/workflows/identity-ci.yml` with parallel identity workspace jobs.
- **Test split (added 2026-05-14)**: `@kitchensink/identity-service` exposes `npm test` (unit/integration; vitest excludes `tests/e2e/**`) and `npm run test:e2e` (separate `vitest.e2e.config.ts`, requires LocalStack + Postgres via `packages/infra/identity` `local:up`). CI runs only `npm test`; `test:e2e` is run locally or in a future `services:up`-gated CI job.

**Acceptance**: CI validates strict typing/lint/tests across shared, infra, webhook, service, web, and mobile packages.

---

## Parallelization markers

Tasks marked **[P]** are safe to run in parallel after dependencies are met:

- T-001, T-010, T-020, T-024, T-030, T-039, T-050, T-055, T-060, T-064, T-070, T-081

---

## Coverage summary

- **REQ coverage**: REQ-001..REQ-050 addressed across phases.
- **FR coverage**: FR-001..FR-045 addressed across phases.
- **Architecture coverage**: ARCH-001..ARCH-033 referenced.
- **Module coverage**: MOD-001..MOD-033 referenced.

No task introduces Terraform, Pulumi, SAM, hand-written CloudFormation templates, Aurora DSQL, or new Auth0 Action authoring.
