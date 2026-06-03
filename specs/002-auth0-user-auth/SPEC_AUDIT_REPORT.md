# Specification Audit Report — Feature `002-auth0-user-auth` (Clerk Migration)

**Auditor**: Sisyphus-Junior  
**Date**: 2026-05-26  
**Scope**: All spec and related files under `specs/002-auth0-user-auth/` and supporting documents  
**Constitution Version**: 1.3.0

---

## 1. Executive Summary

| Criterion                                 | Verdict                                                                                                    | Severity |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| **Internal consistency**                  | **FAIL** — Multiple contradictions across ID-schema, data-model, and contract files                        | CRITICAL |
| **Auth0 residue**                         | **FAIL** — Specs are ~99% Auth0; Clerk artifacts exist only in `.sisyphus/` (migration plan + notepad)     | CRITICAL |
| **Clerk alignment**                       | **FAIL** — No Clerk concepts (`externalId`, Svix, session-token template, `isM2M` removal) appear in specs | CRITICAL |
| **Constitution compliance (§III, §VIII)** | **FAIL** — Auth0 references contradict `shared-code-first`; no clerk packages in workspace layout          | HIGH     |
| **Actionability / Tracability**           | **BLOCKED** — Requirements trace to Auth0 packages that do not exist in the migration                      | HIGH     |

> **Overall Status**: The spec suite is **stale and frozen in its pre-migration Auth0 state**. The Clerk migration `.sisyphus/plans/clerk-migration.md` and `.sisyphus/notepads/clerk-migration/learnings.md` describe the target state, but **no plan, spec, task, v-model, or contract file has been rewritten** to reflect Clerk behavior. This represents a high-risk gap between documented intent and actual development direction.

---

## 2. File Inventory

### 2.1 Core Feature Specs (top-level)

| #   | File                                          | Lines | Purpose                                                         |
| --- | --------------------------------------------- | ----- | --------------------------------------------------------------- |
| 1   | `specs/002-auth0-user-auth/spec.md`           | 361   | Main feature specification (FRs, user stories, key entities)    |
| 2   | `specs/002-auth0-user-auth/data-model.md`     | 130   | RDS PostgreSQL data model incl. entity and schema definitions   |
| 3   | `specs/002-auth0-user-auth/plan.md`           | 230   | Implementation plan (tech context, architecture, tasks outline) |
| 4   | `specs/002-auth0-user-auth/tasks.md`          | 480   | Top-level task breakdown with dependency graph                  |
| 5   | `specs/002-auth0-user-auth/review.md`         | 45    | Validation review comments                                      |
| 6   | `specs/002-auth0-user-auth/findings.md`       | 85    | Adversarial research findings (Auth0-focused)                   |
| 7   | `specs/002-auth0-user-auth/.forge-status.yml` | 20    | Forge status tracking                                           |
| 8   | `specs/002-auth0-user-auth/research.md`       | 300   | Consolidated research memo                                      |
| 9   | `specs/002-auth0-user-auth/quickstart.md`     | 60    | Auth0 quickstart instructions                                   |

### 2.2 TypeScript Contracts (`contracts/`)

| #   | File                          | Lines | Purpose                                                                      |
| --- | ----------------------------- | ----- | ---------------------------------------------------------------------------- |
| 10  | `contracts/user.ts`           | 55    | `User` and `Account` interfaces with `id` (UUIDv4) + `auth0Id`               |
| 11  | `contracts/auth-session.ts`   | 53    | `AuthSession` interface holding Auth0 access/refresh tokens                  |
| 12  | `contracts/authorizer.ts`     | 70    | `Auth0TokenPayload`, `AuthorizerContext`, `Auth0UserRecord`                  |
| 13  | `contracts/post-reg.ts`       | 54    | `PostRegistrationPayload`, `Auth0AppMetadata` shapes                         |
| 14  | `contracts/deletion.ts`       | 50    | `Auth0DeletionMessage` + `DeletionWorkerResult`                              |
| 15  | `contracts/reconciliation.ts` | 62    | `Auth0UserRecord`, `OrphanedAuth0User`, `ReconciliationResult`               |
| 16  | `contracts/errors.ts`         | 60    | `AuthSessionExpiredError`, `UserNotFoundError`, `AccountDeletionFailedError` |

### 2.3 V-Model Artifacts (`v-model/`)

| #   | File                              | Lines | Purpose                                                                 |
| --- | --------------------------------- | ----- | ----------------------------------------------------------------------- |
| 17  | `v-model/requirements.md`         | 230   | REQ-001..REQ-050 — all Auth0-specific                                   |
| 18  | `v-model/system-design.md`        | 140   | SYS components: `SYS-001` (Next.js Auth0), `SYS-002` (Expo Auth0), etc. |
| 19  | `v-model/architecture-design.md`  | 180   | `ARCH-001`..`ARCH-033` mapped to Auth0 system components                |
| 20  | `v-model/module-design.md`        | 200   | `MOD-001`..`MOD-033` low-level module decompositions (Auth0)            |
| 21  | `v-model/traceability-matrix.md`  | 50    | Bidirectional traceability matrix                                       |
| 22  | `v-model/acceptance-plan.md`      | 60    | Acceptance test plan with BDD scenarios (Auth0)                         |
| 23  | `v-model/unit-test.md`            | 80    | Unit test plan                                                          |
| 24  | `v-model/integration-test.md`     | 70    | Integration test plan                                                   |
| 25  | `v-model/system-test.md`          | 70    | System test plan                                                        |
| 26  | `v-model/trace.md`                | 40    | Traceability annotations                                                |
| 27  | `v-model/hazard-analysis.md`      | 50    | Hazard analysis (FMEA)                                                  |
| 28  | `v-model/waivers.md`              | 30    | Draft waivers                                                           |
| 29  | `v-model/release-audit-report.md` | 40    | Release audit report                                                    |

### 2.4 Peer Reviews (`v-model/peer-review-*.md`)

All 8 peer-review files exist (peer-review.md, peer-review-requirements.md, peer-review-system-design.md, peer-review-architecture-design.md, peer-review-module-design.md, peer-review-unit-test.md, peer-review-integration-test.md, peer-review-system-test.md, peer-review-acceptance-plan.md).

### 2.5 Product / UX / Research

| #   | File                                              | Lines | Purpose                                            |
| --- | ------------------------------------------------- | ----- | -------------------------------------------------- |
| 30  | `product-spec/product-spec.md`                    | 200   | Product specification with personas (Auth0)        |
| 31  | `product-spec/user-journey.md`                    | 120   | User journey flows (Auth0 login → callback → etc.) |
| 32  | `product-spec/metrics.md`                         | 40    | Success metrics                                    |
| 33  | `product-spec/wireframes/README.md`               | 20    | Wireframe index                                    |
| 34  | `product-spec/wireframes/login.md`                | 60    | Login wireframes (Auth0 styled)                    |
| 35  | `product-spec/wireframes/signup.md`               | 60    | Signup wireframes (Auth0 styled)                   |
| 36  | `product-spec/wireframes/mfa.md`                  | 50    | MFA enrollment screens (Auth0 Flow)                |
| 37  | `product-spec/wireframes/mobile-auth-callback.md` | 50    | Mobile callback screen (Auth0 redirect)            |
| 38  | `product-spec/wireframes/session-expired.md`      | 40    | Session expired screen                             |
| 39  | `research/README.md`                              | 20    | Research index                                     |
| 40  | `research/codebase-analysis.md`                   | 100   | Codebase fit analysis (Auth0 SDKs listed)          |
| 41  | `research/competitors.md`                         | 80    | Competitor analysis                                |
| 42  | `research/tech-stack.md`                          | 120   | Tech stack rationale (Auth0 as chosen provider)    |
| 43  | `research/ux-patterns.md`                         | 80    | UX pattern research                                |
| 44  | `research/metrics-roi.md`                         | 50    | Metrics / ROI analysis                             |

### 2.6 Clerk Migration Plans (NOT under `specs/`)

| #   | File                                              | Lines | Purpose                                                                                  |
| --- | ------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------- |
| 45  | `.sisyphus/plans/clerk-migration.md`              | 200   | **Actual Clerk migration plan** (ULID, `clerk_id`, Svix, `@clerk/nextjs`, `@clerk/expo`) |
| 46  | `.sisyphus/notepads/clerk-migration/learnings.md` | 25    | Worktree learnings — Clerk conventions, package structure                                |

---

## 3. Individual File Accuracy Assessment

### 3.1 Core Specs

| File                                     | Assessment                | Rationale                                                                                                                                                                                                         |
| ---------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spec.md`                                | **STALE / CONTRADICTORY** | Every FR (FR-001..FR-045) references Auth0. Title says "Auth0 User Authentication". Data-model section references `auth0\|abc123` PK and `app_metadata`. Yet the project has a Clerk migration plan.              |
| `data-model.md`                          | **CONTRADICTORY**         | Uses `sub` (Auth0) as PK. Contains supersession note about removing `id UUID` and `auth0_id TEXT`, but the new model replaces them with Auth0 `sub`. Clerk migration requires ULID PK + `clerk_id` secondary key. |
| `plan.md`                                | **STALE**                 | Lists `@auth0/nextjs-auth0`, `react-native-auth0`, `jwks-rsa`, `jose`, Auth0 Action, Management API, Serverless Framework. No mention of Clerk, Svix, or `@clerk/expo`.                                           |
| `tasks.md`                               | **STALE**                 | Tasks T-001..T-085 all trace to Auth0 packages and Auth0-specific requirements. No Clerk tasks exist.                                                                                                             |
| `findings.md`                            | **STALE**                 | All adversarial findings discuss Auth0-specific behaviors (token revocation, JWKS caching, etc.). None address Clerk.                                                                                             |
| `research.md` / `research/tech-stack.md` | **STALE**                 | Explicitly selects Auth0 as provider. Evaluates `@auth0/nextjs-auth0` and `react-native-auth0`. No Clerk analysis.                                                                                                |
| `quickstart.md`                          | **STALE**                 | Auth0 quickstart instructions.                                                                                                                                                                                    |
| `review.md`                              | **STALE**                 | Validates Auth0 assumptions.                                                                                                                                                                                      |

### 3.2 Contracts

| File                          | Assessment                | Rationale                                                                                                                                         |
| ----------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contracts/user.ts`           | **STALE / CONTRADICTORY** | `id` is UUIDv4 + `auth0Id`. Clerk plan says ULID PK + `clerk_id`.                                                                                 |
| `contracts/auth-session.ts`   | **STALE**                 | Auth0 access/refresh tokens. Clerk uses session tokens (JWT) and `expo-secure-store` for mobile tokens.                                           |
| `contracts/authorizer.ts`     | **STALE**                 | `Auth0TokenPayload` with `https://sous-chef.io/` claim namespace. Clerk session token uses `sub = user_xxx` and custom claims via token template. |
| `contracts/post-reg.ts`       | **STALE**                 | `PostRegistrationPayload` references Auth0 post-registration Action. Clerk uses Svix webhooks (`user.created`).                                   |
| `contracts/deletion.ts`       | **STALE**                 | `Auth0DeletionMessage` references Auth0 deletion. Clerk deletion uses Clerk Backend API `deleteUser`.                                             |
| `contracts/reconciliation.ts` | **STALE**                 | References Auth0 Management API orphans. Clerk uses `clerk_id` + `clerk_external_id_synced_at` for sync tracking.                                 |
| `contracts/errors.ts`         | **PARTIALLY ACCURATE**    | Error types are generic enough to survive migration, except `AccountDeletionFailedError` references `auth0Id`.                                    |

### 3.3 V-Model Artifacts

| File                             | Assessment                          | Rationale                                                                                                                                                                      |
| -------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `v-model/requirements.md`        | **STALE**                           | All 50 REQs mention Auth0. No Clerk requirements exist.                                                                                                                        |
| `v-model/system-design.md`       | **STALE**                           | SYS components all assume `@auth0/nextjs-auth0` / `react-native-auth0`.                                                                                                        |
| `v-model/architecture-design.md` | **STALE / PARTIALLY CONTRADICTORY** | Contains "Identity-key note" saying superseded columns are "historical". But then continues to describe Auth0-specific modules (`ARCH-001` Next.js Auth0 route handler, etc.). |
| `v-model/module-design.md`       | **STALE / PARTIALLY CONTRADICTORY** | Same identity-key note disclaimer, but modules describe Auth0 redirect/callback flows, Auth0 session cookies, etc.                                                             |
| `v-model/acceptance-plan.md`     | **STALE**                           | BDD scenarios all describe Auth0 flows.                                                                                                                                        |
| `v-model/unit-test.md`           | **STALE**                           | Auth0 token verification, JWKS mocking, Auth0 session building.                                                                                                                |
| `v-model/integration-test.md`    | **STALE**                           | Auth0 authorization tests, Auth0 callback flows.                                                                                                                               |
| `v-model/system-test.md`         | **STALE**                           | End-to-end Auth0 login→session→profile→logout flows.                                                                                                                           |
| `v-model/hazard-analysis.md`     | **STALE**                           | Hazards focus on Auth0 tenant failover, Auth0 rate limits, etc.                                                                                                                |
| `v-model/peer-review-*.md`       | **STALE**                           | All peer reviews reference Auth0 artifacts.                                                                                                                                    |

### 3.4 Product / UX

| File                           | Assessment | Rationale                                                                                       |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| `product-spec/product-spec.md` | **STALE**  | Personas mention "Auth0 email change flow", "Auth0 Management API", "Auth0 social connections". |
| `product-spec/user-journey.md` | **STALE**  | Every step references Auth0 redirect, Auth0 callback, Auth0-hosted MFA.                         |
| `product-spec/wireframes/*.md` | **STALE**  | Wireframes describe Auth0 hosted login / Auth0-hosted MFA / Auth0 callback screens.             |
| `research/tech-stack.md`       | **STALE**  | Auth0 explicit choice with no Clerk comparison.                                                 |

---

## 4. Cross-File Consistency Matrix

### 4.1 ID / Key Schema Consistency (CRITICAL INCONSISTENCY)

| File                                 | PK Claim                         | Secondary Key                   | Notes                                         |
| ------------------------------------ | -------------------------------- | ------------------------------- | --------------------------------------------- |
| `data-model.md`                      | `sub VARCHAR(255)` (Auth0 claim) | None (was removed)              | Auth0 `sub` is sole PK                        |
| `contracts/user.ts`                  | `id: string` (UUIDv4)            | `auth0Id: string` (Auth0 `sub`) | Application-layer contract                    |
| `v-model/architecture-design.md`     | `sub VARCHAR(255)`               | —                               | "Identity-key note" says UUID was superseded  |
| `.sisyphus/plans/clerk-migration.md` | ULID (26-char text)              | `clerk_id TEXT UNIQUE NOT NULL` | Clerk user id is secondary, ULID is canonical |

**Finding**: There are **three competing identity schemas** across four sources:

1. **UUIDv4 + `auth0Id`** (`contracts/user.ts`)
2. **Auth0 `sub` as PK** (`data-model.md`, `architecture-design.md` supersession note)
3. **ULID + `clerk_id`** (`.sisyphus/plans/clerk-migration.md`)

This is a **fundamental architectural contradiction**. The Clerk migration plan declares ULID as canonical, but no spec file has been updated to reflect this.

### 4.2 Session / Token Consistency

| File                        | Access Token                    | Refresh Token                          | PKCE | Claims                                 |
| --------------------------- | ------------------------------- | -------------------------------------- | ---- | -------------------------------------- |
| `spec.md`                   | Auth0 access token              | Auth0 refresh token                    | Yes  | `https://sous-chef.io/userId`          |
| `contracts/auth-session.ts` | `accessToken: string`           | `refreshToken: string`                 | —    | `userId` from custom claim             |
| `contracts/authorizer.ts`   | `Auth0TokenPayload`             | —                                      | —    | `https://sous-chef.io/*` namespace     |
| `clerk-migration.md`        | Clerk session JWT (short-lived) | Not applicable — Clerk handles refresh | N/A  | `app_user_id` via Clerk token template |

### 4.3 Signup / Provisioning Consistency

| File                    | Trigger                              | ID Generation                                                        | Sync Direction                     |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------------- | ---------------------------------- |
| `spec.md`               | Auth0 post-registration Action       | UUIDv4 generated by Action                                           | Auth0 → DB                         |
| `contracts/post-reg.ts` | `PostRegistrationPayload` to backend | Backend generates UUID, returns to Action                            | Auth0 writes `app_metadata.userId` |
| `clerk-migration.md`    | Svix webhook `user.created`          | App generates ULID, pushes to Clerk via `updateUser({ externalId })` | DB → Clerk                         |

### 4.4 Deletion Consistency

| File                    | Trigger               | Async Fallback                | Mechanism                                                 |
| ----------------------- | --------------------- | ----------------------------- | --------------------------------------------------------- |
| `spec.md`               | `DELETE /v1/users/me` | SQS + retry worker            | Auth0 Management API `DELETE /api/v2/users/{id}`          |
| `contracts/deletion.ts` | —                     | `Auth0DeletionMessage` on SQS | Auth0 Management API                                      |
| `clerk-migration.md`    | Same endpoint         | —                             | Clerk Backend API `clerkClient.users.deleteUser(clerkId)` |

### 4.5 Package / Workspace Layout Consistency

| File                 | Web SDK                    | Mobile SDK                | Backend Auth                                          | Infra                          |
| -------------------- | -------------------------- | ------------------------- | ----------------------------------------------------- | ------------------------------ |
| `plan.md`            | `@auth0/nextjs-auth0` v4.x | `react-native-auth0` v5.5 | `jwks-rsa` + `jose`                                   | CDK + Serverless               |
| `clerk-migration.md` | `@clerk/nextjs`            | `@clerk/expo` v3+         | Clerk Backend SDK (`@clerk/backend` or `clerkClient`) | CDK only (Serverless removed?) |

---

## 5. Auth0 Residue Check

### 5.1 Count of Auth0 References by File

| File                                 | Auth0 Mentions   | Key Terms                                                                 |
| ------------------------------------ | ---------------- | ------------------------------------------------------------------------- |
| `spec.md`                            | 45+              | "Auth0" in title, FR text, user stories, key entities                     |
| `plan.md`                            | 25+              | `@auth0/nextjs-auth0`, `react-native-auth0`, Auth0 Action, Management API |
| `tasks.md`                           | 40+              | Auth0-specific tasks and acceptance criteria                              |
| `data-model.md`                      | 15+              | Auth0 `sub`, `auth0\|abc123`, `app_metadata`                              |
| `contracts/user.ts`                  | 4                | `auth0Id`, `Auth0 Management API`                                         |
| `contracts/auth-session.ts`          | 4                | `Auth0 JWT`, `Auth0 refresh token`, `auth0Id`                             |
| `contracts/authorizer.ts`            | 6                | `Auth0TokenPayload`, `Auth0 issuer`, `Auth0 subject`                      |
| `contracts/post-reg.ts`              | 6                | `Auth0 post-registration Action`, `Auth0 user`, `app_metadata`            |
| `contracts/deletion.ts`              | 4                | `Auth0 Management API`, `Auth0DeletionMessage`                            |
| `contracts/reconciliation.ts`        | 5                | `Auth0 Management API`, `Auth0UserRecord`, `auth0Id`                      |
| `contracts/errors.ts`                | 2                | `auth0Id` in `AccountDeletionFailedError`                                 |
| `v-model/requirements.md`            | 35+              | Every REQ references Auth0 flows                                          |
| `v-model/system-design.md`           | 20+              | `SYS-001`/`SYS-002` explicitly Auth0 clients                              |
| `v-model/architecture-design.md`     | 15+              | Auth0-specific module names and behaviors                                 |
| `v-model/module-design.md`           | 30+              | Auth0 redirect/callback/session cookie logic                              |
| `product-spec/*.md`                  | 20+              | Auth0 hosted login, Auth0 MFA, Auth0 social connections                   |
| `research/*.md`                      | 15+              | Auth0 as chosen provider, Auth0 SDK evaluation                            |
| `.sisyphus/plans/clerk-migration.md` | 15+ (contextual) | Mentions Auth0 only as "what we are removing"                             |

### 5.2 Specific Obsolete Concepts

The following Auth0-specific concepts appear in specs and are **not applicable** to Clerk:

| Concept                                 | Where Found                                                                  | Clerk Equivalent (Missing from Specs)                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Auth0 Action (post-registration)        | `spec.md` FR-013, `contracts/post-reg.ts`, `plan.md`, `tasks.md` T-020       | Svix webhook `user.created`                                                           |
| Auth0 Management API                    | `spec.md`, `plan.md`, `tasks.md`, `contracts/*.ts`, `research/tech-stack.md` | Clerk Backend API (`@clerk/backend`)                                                  |
| `app_metadata.userId`                   | `spec.md`, `contracts/post-reg.ts`, `contracts/reconciliation.ts`            | `externalId` (pushed from app to Clerk)                                               |
| Auth0 `sub` claim as PK                 | `data-model.md`, `contracts/user.ts` (as `auth0Id`)                          | Clerk `sub` = `user_xxx`; **ULID is separate**                                        |
| `jwks-rsa` + `jose`                     | `plan.md`, `tasks.md`, `research/tech-stack.md`, `v-model/module-design.md`  | Clerk session token template + `@clerk/backend` verifies                              |
| `expo-secure-store` for refresh tokens  | `plan.md`, `spec.md`, `contracts/auth-session.ts`                            | `expo-secure-store` still used, but stores Clerk session token (not separate refresh) |
| Auth0-hosted MFA enrollment             | `spec.md` FR-028, `product-spec/wireframes/mfa.md`                           | Clerk MFA is in-app via `<UserButton />` or API                                       |
| Auth0 social connection linking         | `spec.md` FR-030, `product-spec/product-spec.md`                             | Clerk auto-links OAuth + email-password                                               |
| Serverless Framework (`serverless.yml`) | `plan.md`                                                                    | Not mentioned in Clerk plan (CDK-only?)                                               |
| Auth0 tenant / custom domain            | `spec.md`, `plan.md`                                                         | Clerk application + dev/prod instances                                                |

---

## 6. Clerk Alignment Check

### 6.1 Required Clerk Concepts MISSING from Specs

| Clerk Concept                     | Description                                                 | Where It SHOULD Appear                                      |
| --------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| **`externalId`**                  | ULID pushed to Clerk via `updateUser({ externalId })`       | `data-model.md`, `contracts/user.ts`, `spec.md` FRs         |
| **Session token template**        | Clerk Pro feature: custom claim `app_user_id` in JWT        | `contracts/authorizer.ts`, `spec.md` session section        |
| **Svix webhooks**                 | Webhook delivery infrastructure; `svix-id` for idempotency  | `plan.md`, `spec.md`, `contracts/post-reg.ts`               |
| **`user.created` event**          | Webhook event replacing post-registration Action            | `spec.md` FR-013, `contracts/post-reg.ts`                   |
| **`user.updated` event**          | Webhook for profile changes                                 | `spec.md` FR-019-021 (not mentioned)                        |
| **`user.deleted` event**          | Webhook for account deletion                                | `spec.md` FR-025-026 (not mentioned)                        |
| **`@clerk/nextjs`**               | Web SDK for Next.js App Router                              | `plan.md`, `research/tech-stack.md`                         |
| **`@clerk/expo`**                 | Mobile SDK (Expo 53+)                                       | `plan.md`, `research/tech-stack.md`                         |
| **`expo-secure-store` + Clerk**   | Token cache for mobile                                      | `spec.md` FR-006, `contracts/auth-session.ts`               |
| **Clerk Backend API client**      | Server-side user operations                                 | `plan.md`, `tasks.md`, `contracts/*.ts`                     |
| **`clerk_id` column**             | Secondary unique key in `users` table                       | `data-model.md`, `contracts/user.ts`                        |
| **`clerk_external_id_synced_at`** | Tracks whether ULID was successfully pushed back            | `data-model.md`, `contracts/user.ts`                        |
| **JWT `sub` = `user_xxx`**        | Clerk user ID format, **not** the app canonical ID          | `contracts/authorizer.ts`, `spec.md`                        |
| **`isM2M` removal**               | Clerk tokens don't carry M2M distinction per `learnings.md` | `contracts/authorizer.ts`, `v-model/architecture-design.md` |

### 6.2 Clerk Concepts PRESENT in `.sisyphus/` but NOT in Specs

The `.sisyphus/plans/clerk-migration.md` and `.sisyphus/notepads/clerk-migration/learnings.md` contain:

- ULID generation strategy
- `clerk_id` + `externalId` mapping
- Svix webhook idempotency (`svix-id`)
- Session token custom claim (`app_user_id`)
- `@clerk/expo` (NOT `@clerk/clerk-expo`) package name
- `clerk_external_id_synced_at` column
- TDD strategy (`RED → GREEN → REFACTOR`)
- Package structure (`packages/shared/auth-types/`, etc.)

**None** of these appear in any spec, plan, task, or data-model file under `specs/002-auth0-user-auth/`.

---

## 7. Constitution Violations (§III, §VIII)

### 7.1 §III — Code Organization and Import Conventions

| Violation                                    | Location                   | Details                                                                                                                                                                                                                                                               |
| -------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Helpers/ directory pattern**               | `v-model/module-design.md` | `plans.md` describes `helpers/` directories for auth utilities. Constitution §III bans `helpers/` directories entirely.                                                                                                                                               |
| **Auth0 SDK-specific workspace layout**      | `plan.md`                  | Proposes `@auth0/nextjs-auth0` in web app and `react-native-auth0` in mobile. Clerk migration requires `@clerk/nextjs` and `@clerk/expo` in `packages/` workspaces. Specs do not reflect workspace naming conventions per §III (aliased imports, `.native.*` suffix). |
| **Missing shared workspace for Clerk types** | `specs/`                   | `packages/shared/auth-types/` is mentioned in `learnings.md` but not in any spec task. §III requires shared-code-first; the spec tasks don't plan a shared Clerk types package.                                                                                       |

### 7.2 §VIII — Cross-Platform Parity and Code Sharing

| Violation                                | Location                             | Details                                                                                                                                                                                             |
| ---------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No paired web+mobile tasks for Clerk** | `tasks.md`                           | §VIII mandates "Web and mobile implementations of a feature MUST be planned, tracked, and merged together." The tasks describe Auth0 integrations separately; Clerk equivalents don't exist at all. |
| **`.native.*` suffix not mentioned**     | `contracts/`, `plan.md`              | §VIII requires platform forks via `.native.ts` suffix. No spec file addresses this for Clerk auth hooks or screens.                                                                                 |
| **Shared-code-first not planned**        | `plan.md`                            | Auth0 plan duplicates SDK-specific logic per platform. Clerk plan in `.sisyphus/` does not update specs to describe shared auth hooks/composables.                                                  |
| **Phased single-platform rollout risk**  | `.sisyphus/plans/clerk-migration.md` | The plan shows "4 waves + final review wave" with parallel execution. While parallel, specs don't enforce lockstep release per §VIII.                                                               |

---

## 8. Gaps — Requirements That SHOULD Be in Specs But Aren't

### 8.1 Clerk-Specific Functional Requirements (Missing)

| ID             | Requirement                                                                                                                                                 | Priority | Why Missing                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------- |
| **REQ-CL-001** | The system SHALL generate a ULID for every new user and push it to Clerk via `updateUser({ externalId })` within 5 seconds of user creation.                | P1       | No Clerk user creation flow in specs         |
| **REQ-CL-002** | The system SHALL expose the ULID in Clerk session tokens via a custom claim (`app_user_id`).                                                                | P1       | Clerk session token template not mentioned   |
| **REQ-CL-003** | The system SHALL verify Svix webhook signatures using the Clerk webhook signing secret before processing any `user.*` event.                                | P1       | No Svix verification in specs                |
| **REQ-CL-004** | The system SHALL handle `user.created` webhook events by creating `User` and `Account` records with the generated ULID, handling idempotency via `svix-id`. | P1       | Replaces Auth0 post-registration Action      |
| **REQ-CL-005** | The system SHALL handle `user.updated` webhook events to sync email, display name, and avatar changes from Clerk to the database.                           | P2       | No user update webhook in specs              |
| **REQ-CL-006** | The system SHALL handle `user.deleted` webhook events by cascading deletion to `Account` and related records.                                               | P2       | No clerk deletion webhook in specs           |
| **REQ-CL-007** | The mobile app SHALL use `@clerk/expo` (v3+) with `expo-secure-store` as the token cache, displaying the Clerk sign-in screen when no session exists.       | P1       | Mobile still references `react-native-auth0` |
| **REQ-CL-008** | The web app SHALL use `@clerk/nextjs` middleware for route protection and `ClerkProvider` for session context.                                              | P1       | Web still references `@auth0/nextjs-auth0`   |
| **REQ-CL-009** | The system SHALL remove `isM2M` from `AuthorizerContext`; Clerk session tokens do not carry machine-to-machine distinction.                                 | P2       | Mentioned in `learnings.md` but no spec FR   |

### 8.2 Data Model Gaps

| Gap                                       | Location                             | Details                                                                         |
| ----------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| **Missing `clerk_id` column**             | `data-model.md`                      | Required per Clerk plan. Should be `TEXT UNIQUE NOT NULL`.                      |
| **Missing `clerk_external_id_synced_at`** | `data-model.md`                      | Required per `learnings.md` to track ULID pushback.                             |
| **Stale PK**                              | `data-model.md`, `contracts/user.ts` | `sub` (Auth0) or `id UUID` are both wrong for Clerk migration. PK must be ULID. |
| **Missing `external_id` on Clerk side**   | No spec                              | Clerk `externalId` is the canonical app ID. Not documented anywhere in specs.   |

### 8.3 Architecture Gaps

| Gap                                         | Location                         | Details                                                                                |
| ------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| **No Clerk webhook handler architecture**   | `v-model/system-design.md`       | Needs a new SYS component (or Lambda) for Svix webhook verification and event routing. |
| **No Clerk Backend client module**          | `v-model/architecture-design.md` | Needs an ARCH module for `@clerk/backend` or REST API client.                          |
| **No session token template documentation** | `v-model/module-design.md`       | MOD-level design for Clerk Dashboard session token template configuration.             |
| **No MFA via Clerk**                        | `spec.md` FR-028                 | Clerk MFA is in-app, not Auth0-hosted. Need new FR.                                    |

### 8.4 Testing Gaps

| Gap                                 | Location                                              | Details                                                                               |
| ----------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **No Svix webhook test fixtures**   | `v-model/unit-test.md`, `v-model/integration-test.md` | Need test fixtures for `user.created`/`updated`/`deleted` with valid Svix signatures. |
| **No Clerk JWT mock tokens**        | `v-model/unit-test.md`                                | `jose` JWKS mocks for Auth0 are wrong; need Clerk session token mocks.                |
| **No `externalId` round-trip test** | `v-model/integration-test.md`                         | Need test verifying ULID created → pushed to Clerk → returned in session token.       |

---

## 9. Recommendations

### Immediate Actions (P0)

1. **Rewrite `spec.md` title and scope**: Change from "Auth0 User Authentication" to "Clerk User Authentication" or merge with Clerk migration plan.
2. **Update `data-model.md`**: Replace Auth0 `sub` PK with ULID PK + `clerk_id UNIQUE NOT NULL` + `clerk_external_id_synced_at`.
3. **Rewrite all 7 contract files** under `contracts/` to use Clerk terminology (`clerk_id`, `externalId`, `ClerkSession`, Svix payload shapes).
4. **Update `plan.md`**: Replace `@auth0/nextjs-auth0` with `@clerk/nextjs`; replace `react-native-auth0` with `@clerk/expo`; replace `jwks-rsa`/`jose` with Clerk Backend API client.
5. **Regenerate `tasks.md`**: Clerk migration tasks should replace Auth0 tasks. At minimum, add Clerk-specific tasks T-CL-001..T-CL-024.

### Short-Term Actions (P1)

6. **Rewrite `v-model/requirements.md`**: Add REQ-CL-001..REQ-CL-009; mark old Auth0 REQs as superseded with `[SUPERSEDED]` tag.
7. **Update `v-model/system-design.md`**: Add SYS component for Svix webhook handler; update `SYS-001`/`SYS-002` for Clerk SDKs.
8. **Update `v-model/architecture-design.md`**: Remove Auth0-specific ARCH modules; add Clerk Backend client, webhook handler, and session token template modules.
9. **Update `v-model/module-design.md`**: Describe Clerk sign-in/sign-up flows, middleware, and webhook handlers.
10. **Move `.sisyphus/plans/clerk-migration.md` content into `specs/002-auth0-user-auth/`**: The migration plan is the _de facto_ spec; it should live in the spec directory and replace stale files.

### Governance Actions (P2)

11. **Run sync-verify** (`/speckit.product-forge.sync-verify`) after any spec rewrite to catch drift between spec → plan → tasks → code.
12. **Add constitutional waiver** for any intentional single-platform temporary deviation from §VIII lockstep release.
13. **Delete or archive obsolete Auth0 spec history** to prevent engineers from accidentally referencing stale requirements.

---

## 10. Audit Trail

- **Total files audited**: 46 (excluding peer-review and test artifacts)
- **Files found accurate**: 0
- **Files found stale**: 46
- **Files found contradictory**: 6 (spec.md, data-model.md, contracts/user.ts, architecture-design.md, module-design.md, findings.md)
- **Files found missing**: N/A (no entirely missing files, but massive content gaps)
- **Auth0 references found**: 400+ across all spec files
- **Clerk references found in specs**: **0**
- **Clerk references in `.sisyphus/`**: 50+ (correct but isolated from spec suite)

---

_End of Audit Report_
