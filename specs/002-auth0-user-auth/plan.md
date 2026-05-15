# Implementation Plan: Auth0 User Authentication

**Branch**: `002-auth0-user-auth` | **Date**: 2026-05-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-auth0-user-auth/spec.md`

---

## Summary

This feature delivers Auth0-based authentication and user lifecycle management for Sous Chef web (Next.js) and mobile (Expo), with a locked split architecture:

- **Identity Service**: NestJS 11 on **AWS ECS/Fargate** (Node 24) exposing REST endpoints consumed by web/mobile
- **Auth0 Webhooks + Auth Pipeline**: raw **AWS Lambda** functions (Node 22.x, no NestJS) for:
    - post-registration sync
    - async Auth0 deletion worker (SQS + DLQ)
    - nightly reconciliation
    - API Gateway REQUEST authorizer
- **Data storage**: **RDS PostgreSQL 16** (`db.t4g.small`) using Drizzle ORM + `pg`
- **IaC split (same repo only)**:
    - CDK v2 (`aws-cdk-lib`) for network/data/compute foundations
    - Serverless Framework (`serverless.yml`) for Lambda + API Gateway wiring (including REQUEST authorizer)

This preserves all functional scope in `spec.md` and `v-model/requirements.md`: signup sync, login/session, logout, profile, account edit, account deletion, password reset, MFA assignment, social linking, suspension/reactivation, impersonation controls, and API authorization (REQ-001..REQ-050; FR-001..FR-045).

---

## Technical Context

**Language/Version**:

- TypeScript 5.x
- Node.js 24.x (NestJS ECS service)
- Node.js 22.x (raw Lambda runtime)

**Primary Dependencies**:

- Web: `@auth0/nextjs-auth0` v4.x
- Mobile: `react-native-auth0` v5.5 (Expo 53+)
- Backend service: NestJS 11, Drizzle ORM, `pg`, `class-validator`, `class-transformer`, `@nestjs/config`
- Lambda/auth: `jwks-rsa`, `jose`, `@aws-sdk/client-sqs`, `@aws-sdk/client-s3`, `@aws-sdk/client-scheduler`, `@aws-sdk/client-secrets-manager`, `@aws-lambda-powertools/logger`, `@sentry/aws-serverless`
- Infra: CDK v2 (`aws-cdk-lib`), Serverless Framework

**Storage**:

- Primary: RDS PostgreSQL 16 (`db.t4g.small`), `pg_trgm`, JSONB
- Async: SQS queue + DLQ for deletion retries
- Artifacts/media: S3 buckets (owned by CDK stacks)

**Project Layout (locked)**:

- `packages/services/identity/` (NestJS ECS service)
- `packages/services/identity-webhooks/` (raw Lambda handlers: authorizer, post-registration, deletion worker, reconciliation)
- `packages/infra/identity/` (CDK app + `serverless.yml`)
- `packages/shared/auth-types/` (shared TS contracts)

**Package/Build Tooling**:

- npm workspaces + Turbo (already configured at root)

**Testing Strategy**:

- Unit/integration: Vitest
- End-to-end: Playwright (web/mobile flows) + API/e2e against LocalStack endpoints

---

## Service topology

```text
Web (Next.js) / Mobile (Expo)
            |
            v
  API Gateway (REST API)
            |
            v
REQUEST Authorizer Lambda (Node 22, JWKS + suspension)
            |
            v
          ALB
            |
            v
Identity Service (NestJS 11 on ECS Fargate, Node 24)
            |
            v
      RDS PostgreSQL 16

Auth0 (Universal Login + existing Actions/Triggers)
            |
            v
Post-registration Lambda (Node 22) ---> RDS PostgreSQL 16
            |
            +--> PATCH app_metadata.userId in Auth0

Identity Service ---> SQS deletion queue ---> deletion-worker Lambda ---> Auth0 Management API
                                  |
                                  v
                                 DLQ (max 5 receives)

EventBridge Scheduler ---> reconciliation Lambda ---> (Auth0 vs DB diff) ---> RDS repair writes
```

---

## Auth0 tenant strategy

Auth0 tenancy is locked to new KitchenSink-owned tenants:

- `kitchensink-dev`
- `kitchensink-staging`
- `kitchensink-prod`

Rules:

1. **Do not reuse Armoury tenants**.
2. **Reuse existing Auth0 Actions/Triggers from tenant-template** (post-registration and related trigger chain already configured).
3. **Do not author new Auth0 Actions** in this feature unless the source-of-truth spec is amended.
4. Environment-specific Auth0 credentials/domains are injected through secrets/config in infra.

Requirements impacted: REQ-001, REQ-004, REQ-005, REQ-013..REQ-017, REQ-027..REQ-031, REQ-041..REQ-044.

---

## Architectural Decisions (locked)

| Decision                     | Choice                                                                                       | Rationale                                                                                                | Traceability                              |
| ---------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Identity API compute         | NestJS 11 on ECS/Fargate (Node 24)                                                           | Keeps REST business logic in a long-lived service with clear module boundaries and predictable DB access | REQ-018..REQ-026, REQ-032..REQ-038        |
| Auth0 control-plane handlers | Raw Lambda (Node 22), no NestJS                                                              | Small, isolated handlers for auth edge-cases and scheduled/async tasks                                   | REQ-013..REQ-017, REQ-039..REQ-044        |
| Authorizer model             | API Gateway REST + Lambda REQUEST authorizer                                                 | Needed for custom JWT claim validation, context injection, and suspension enforcement                    | REQ-039, REQ-040, REQ-042, FR-038..FR-043 |
| ECS trust boundary           | ECS service trusts `AuthorizerContext` headers only; never decodes client JWT                | Prevents client-supplied claim spoofing; authorizer is the sole JWT verification point                   | REQ-039, REQ-040, decisions.md T9/T11     |
| Data store                   | RDS PostgreSQL 16 (`db.t4g.small`) with Drizzle + `pg`                                       | Explicit replacement of obsolete Aurora DSQL assumption; aligns with broader repo standards              | REQ-013..REQ-026                          |
| Shared schema contract       | Single Drizzle schema in `packages/shared/auth-types/schema/`; both ECS and Lambda import it | Prevents column-set divergence between runtimes hitting the same RDS instance                            | REQ-013..REQ-026, T8 evidence             |
| Deletion resiliency          | SQS + exponential backoff + DLQ after 5 attempts                                             | Guarantees eventual Auth0 delete and failure visibility under rate limits/transients                     | REQ-025, REQ-026                          |
| Reconciliation               | EventBridge Scheduler nightly Lambda diff                                                    | Safety net when signup action path partially fails                                                       | REQ-017                                   |
| Infrastructure ownership     | 100% self-contained in this repo, CDK + Serverless only                                      | Eliminates cross-repo ambiguity and external dependency drift                                            | REQ-050                                   |
| Local integration runtime    | LocalStack Community + sibling Postgres container                                            | Enables queue/event/storage testing without paid emulators                                               | REQ-049                                   |

---

## Local development

Local integration test environment is locked to:

- **LocalStack Community**: SQS, S3, EventBridge/Scheduler emulation
- **PostgreSQL Docker container**: sibling service in same `docker-compose.yml` network
- **Identity Service (NestJS)**: runs locally via workspace dev target, connected to local Postgres
- **Lambdas**: run via `serverless invoke local` / `serverless offline` against LocalStack endpoints

Planned local workflow:

1. `docker compose up` starts LocalStack + Postgres
2. Health checks verify LocalStack readiness and Postgres connectivity
3. Migrations/seed scripts initialize local DB state
4. `turbo run dev:local` starts identity service + local webhook/lambda workflow
5. E2E tests target local API Gateway/Lambda endpoints and local DB side effects

This is mandatory for REQ-049 (LocalStack-backed local testing) and supports REQ-013..REQ-017 and REQ-025..REQ-026 verification.

---

## Package-level responsibilities

### `packages/shared/auth-types/`

- Shared contracts for JWT claims, authorizer context, user/account/profile DTOs, admin actions, webhook payloads
- Canonical types consumed by service, lambdas, and clients
- Traceability: REQ-001..REQ-012, REQ-039..REQ-044, NFR-001, NFR-010

### `packages/infra/identity/`

- CDK app: NetworkStack, DataStack, IdentityServiceStack, observability/secrets wiring
- `serverless.yml`: Lambda functions + API Gateway REST routes + REQUEST authorizer wiring
- No Terraform/Pulumi/SAM/raw CloudFormation templates
- Traceability: REQ-049, REQ-050, REQ-039..REQ-044

### `packages/services/identity-webhooks/`

- `authorizer` Lambda: JWT validation, claim extraction, suspension check, context injection
- `post-registration` Lambda: idempotent user/account/profile create + `app_metadata.userId` writeback
- `deletion-worker` Lambda: retries Auth0 delete via SQS receive count/backoff and DLQ threshold
- `reconciliation` Lambda: periodic Auth0-vs-DB diff and repair
- Traceability: REQ-013..REQ-017, REQ-025..REQ-026, REQ-039..REQ-044

### `packages/services/identity/`

- NestJS modules: `AuthModule`, `UsersModule`, `AccountsModule`, `ProfileModule`, `AdminModule`
- REST endpoints for profile/account/admin lifecycle
- Produces deletion jobs to SQS; consumes authorizer-injected identity context
- Traceability: REQ-018..REQ-038, FR-018..FR-037

---

## Security and reliability notes

- JWT verification via JWKS with in-process cache; enforce `iss`, `aud`, signature, expiration (REQ-039)
- Authorizer denies suspended users with `403` and injects `userId` context (REQ-040, REQ-042)
- Logout/revocation and secure token storage remain platform-specific per spec (REQ-006..REQ-012)
- Async deletion path must not block DB deletion completion; failed Auth0 deletions surface to DLQ/alarms (REQ-025, REQ-026)
- Reconciliation produces deterministic repair actions and audit logs (REQ-017, NFR-012..NFR-017)

---

## Requirement coverage map (high-level)

- **Auth flows + sessions**: REQ-001..REQ-012 (FR-001..FR-012)
- **Signup sync + reconciliation**: REQ-013..REQ-017 (FR-013..FR-017)
- **User/account/profile lifecycle**: REQ-018..REQ-026 (FR-018..FR-026)
- **Password/MFA/social**: REQ-027..REQ-034 (FR-027..FR-034)
- **Impersonation + authorization + suspension**: REQ-035..REQ-044 (FR-035..FR-044)
- **Cross-feature and infra constraints**: REQ-045..REQ-050 (FR-045, NFR-001..NFR-017)

---

## Constraints and non-goals

- No new Auth0 Actions authored in this feature (reuse existing tenant-template Actions/Triggers)
- No Aurora DSQL references or implementation
- No Terraform/Pulumi/SAM adoption
- No external IaC repository dependencies
- No changes to source-of-truth requirements documents in this rewrite
