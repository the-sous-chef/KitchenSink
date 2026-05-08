# Implementation Plan: Sous Chef Recipe App

**Branch**: `001-sous-chef-recipe-app` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sous-chef-recipe-app/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Core recipe management application — CRUD operations, full-text search (PostgreSQL FTS with tsvector/tsquery + GIN indexes), recipe versioning (snapshot pattern with optimistic concurrency), sharing/cloning with visibility controls (private/public), collection cloning with opt-in source-pull, and photo management (S3 presigned uploads + Lambda Sharp processing + CloudFront CDN). NestJS 11 on AWS Fargate (ECS) backend, RDS PostgreSQL 16, Drizzle ORM, Turborepo monorepo with npm workspaces.

Cross-cutting reliability behaviors driven by the 2026-04-30 spec clarifications:

- **Atomic recipe save with independent photo uploads (FR-001a)**: recipe metadata persists in a single DB transaction; photos use the existing presigned-URL flow per-file with client + server validation and per-file retry; failed photos are never persisted as broken references on the recipe.
- **Resilient version archive to S3 (FR-007b-i)**: user save succeeds independent of the S3 archive write. The version snapshot row in the DB is the source of truth; the S3 archive is enqueued asynchronously via SQS with retry + DLQ. Failed archive payloads are persisted as `recipe_version_pending_archives` rows so retries replay the exact payload until S3 confirms; only then is the pending row deleted.
- **Soft-delete tombstone with GDPR hard purge (C-007)**: recipe deletion sets `deleted_at` and removes the recipe from listings, search, collections, and clone targets. DB rows + S3 version archives are retained indefinitely. An explicit user-initiated "Erase my data" action triggers an irreversible hard purge of the user's tombstoned recipes (DB rows + every S3 version object).
- **Collection cloning as snapshot with opt-in pull (FR-011)**: a clone records `source_collection_id`. A user-initiated "Pull updates from source" action reconciles the clone against the source's current public membership without overwriting recipes the cloner added directly.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 24.x (per `.nvmrc` + `package.json` engines)
**Primary Dependencies**: NestJS 11, Drizzle ORM, `pg` (node-postgres), `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/client-sqs` (version-archive queue), Sharp (Lambda photo processor), `class-validator` + `class-transformer` (DTO validation), `@nestjs/config` (Zod env), `@auth0/nextjs-auth0` v4.x (web), `react-native-auth0` v5.5 (mobile)
**Storage**: RDS PostgreSQL 16 (`db.t4g.small`, ~$25/mo) — pg_trgm, JSONB, tsvector FTS; S3 (photo objects + version archives) + CloudFront (CDN); SQS (version-archive queue + DLQ)
**Testing**: Vitest (unit + integration), Playwright (web E2E), Maestro (mobile E2E); TDD red-green-refactor; LocalStack for AWS emulation (S3 + SQS); pyramid target ≥70% unit / ≤20% integration / ≤10% E2E
**Target Platform**: AWS Fargate (ECS) for NestJS API, Lambda for photo processor, Lambda for version-archive worker (SQS-triggered), CloudFront CDN, RDS PostgreSQL
**Project Type**: web-service (NestJS REST API) + serverless functions (photo processor + version-archive worker) + web app (Next.js) + mobile app (Expo/React Native)
**Performance Goals**: p95 ≤ 500 ms API response for 10k concurrent users; search latency < 2 s (PostgreSQL FTS at launch, Typesense fallback if p95 > 400 ms); recipe save p95 must remain ≤ 500 ms even when S3 version archive is queued (FR-007b-i)
**Constraints**: 5 MB max photo upload, 10 photos per recipe, < 200 ms cold start (Fargate eliminates Lambda cold start for API; Lambda photo processor and version-archive worker are async so cold start is non-blocking); recipe save MUST NOT block on S3 archive (FR-007b-i); photo uploads MUST NOT block recipe metadata save (FR-001a); soft-deleted recipes MUST be filtered from every read path
**Scale/Scope**: 10k concurrent users, < 5M recipes initially; connection pool 50–100 (RDS `db.t4g.small`); pending-archive backlog target ≤ 100 rows steady state with operator alert above threshold

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with each KitchenSink Constitution principle (v1.1.0) before proceeding:

| #   | Principle                                                                                                                          | Status  | Notes                                                                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I   | **Correctness & Type Safety** — strict TS, no `any`, proper error types, ISO dates                                                 | ☑️ Pass | Strict TS via shared `typescript` base config (`strict: true`). Drizzle schema provides end-to-end type safety. ISO 8601 timestamps in all date columns (`created_at`, `updated_at`, `deleted_at`). New error codes (`RECIPE_DELETED`, `ARCHIVE_PENDING`) extend `Error`. |
| II  | **Readability & JSDoc** — JSDoc on all exports, braces, blank-line rules, named exports                                            | ☑️ Pass | All new exported functions/types (pending-archive worker, erasure service, collection-pull service) carry JSDoc. Named exports only. ESLint rules enforced via shared config.                                                                                             |
| III | **Code Organization & Imports** — aliased imports, `.js` extensions, `utils/`/`lib/`/`dal/` layout, no `helpers/`                  | ☑️ Pass | Monorepo workspace imports via `@kitchensink/*` aliases. NestJS modules follow `dal/`/`lib/`/`utils/` convention. New `versions/archive/` and `users/erasure/` modules follow same structure. No `helpers/`. `.js` extensions in ESM imports.                             |
| IV  | **Testing Discipline** — pyramid ratios, `getByRole`/`getByLabel` only, no `waitForTimeout`, test-plan comments                    | ☑️ Pass | Vitest for unit + integration; Playwright for E2E. New flows (per-photo retry, pending-archive replay, erase-my-data, pull-from-source) get unit + integration coverage. `getByRole`/`getByLabel` selectors only. Pyramid: ≥70% unit / ≤20% integration / ≤10% E2E.       |
| V   | **Monorepo & Workspace Governance** — workspace registered, shared tooling extended, Turbo tasks declared, per-PR schema isolation | ☑️ Pass | All workspaces registered in root `package.json`. Shared `tsconfig`, ESLint, Prettier configs extended from `packages/tools/`. Turbo tasks declared in `turbo.json`. Per-PR schema isolation via Drizzle migrations + Docker Compose local PostgreSQL.                    |
| VI  | **Formatting & Tooling** — Prettier/ESLint shared configs, git hooks active, CI gates passing, `generate:types` runs first         | ☑️ Pass | Prettier + ESLint shared. Git hooks (lint-staged) active. CI gates enforce lint + typecheck + test. Drizzle `generate:types` in Turbo dependency graph before build. New SQS/LocalStack service container in CI for archive-worker integration tests.                     |
| VII | **Accessibility & UX Consistency** — accessible names, design tokens, design-token–driven components, platform parity              | ☑️ Pass | FR-044 platform parity (web + mobile). New UX surfaces — per-photo error/retry control, "Erase my data" confirmation, "Pull updates from source" action — carry accessible names and pair color status with icon/text. Design tokens from `packages/ui/`.                 |

Any justified deviation MUST be documented in the **Complexity Tracking** table below.

## Project Structure

### Documentation (this feature)

```text
specs/001-sous-chef-recipe-app/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output — complete (487 lines)
├── data-model.md        # Phase 1 output — complete (full DDL + tombstone + pending-archive)
├── quickstart.md        # Phase 1 output — complete (local dev guide)
├── contracts/           # Phase 1 output — API contract stubs (OpenAPI + TS types)
└── tasks.md             # Phase 2 output — pending update for FR-001a / FR-007b-i / C-007 / FR-011 pull
```

### Source Code (repository root)

```text
packages/
├── apps/
│   └── sous-chef/
│       ├── web/                        # Next.js 15 App Router (Auth0 web SDK)
│       │   ├── src/
│       │   │   ├── app/                # Next.js app directory (routes)
│       │   │   ├── components/         # Domain-grouped UI components
│       │   │   │   ├── recipe-form/    # Recipe create/edit + per-photo retry UI (FR-001a)
│       │   │   │   ├── account/        # "Erase my data" confirmation flow (C-007)
│       │   │   │   └── collections/    # Pull-from-source action (FR-011)
│       │   │   └── lib/                # Client-side utilities
│       │   └── tests/
│       │       ├── unit/
│       │       └── e2e/                # Playwright E2E tests
│       └── mobile/                     # Expo 53 + React Native (Auth0 native SDK)
│           ├── src/
│           │   ├── screens/            # Screen components
│           │   ├── components/         # Domain-grouped UI components (recipe-form, account, collections)
│           │   └── lib/                # Mobile utilities
│           └── tests/
│               ├── unit/
│               └── e2e/                # Maestro E2E flow files (*.yaml)
├── api/
│   ├── recipe/                            # NestJS 11 REST API (Fargate deployment)
│   │   ├── src/
│   │   │   ├── recipes/                 # Recipe module (controller, service, dal)
│   │   │   │   ├── recipes.controller.ts
│   │   │   │   ├── recipes.service.ts   # Atomic save (FR-001a), tombstone delete (C-007)
│   │   │   │   └── dal/                 # Drizzle queries (filters out deleted_at IS NOT NULL on every read path)
│   │   │   ├── ingredients/             # Ingredient module (USDA lookup, freeform)
│   │   │   ├── versions/                # Version module (snapshots, retention)
│   │   │   │   ├── versions.service.ts  # DB write + SQS enqueue (FR-007b-i)
│   │   │   │   └── archive/             # Pending-archive read/replay/delete logic
│   │   │   ├── photos/                  # Photo module (presigned URLs, per-file confirm/retry)
│   │   │   ├── collections/             # Collection module (CRUD, membership, clone, pull-from-source)
│   │   │   ├── search/                  # Search module (PostgreSQL FTS, deleted_at filter)
│   │   │   ├── users/                   # User module
│   │   │   │   └── erasure/             # GDPR "Erase my data" service (C-007)
│   │   │   ├── auth/                    # Auth module (Auth0 JWT guard)
│   │   │   ├── health/                  # Health check endpoint
│   │   │   └── common/                  # Shared utilities (filters, pagination, errors)
│   │   └── tests/
│   │       ├── unit/
│   │       └── integration/             # Vitest + Docker PostgreSQL + LocalStack S3/SQS
│   ├── photo-processor/                # Lambda (Sharp image resize)
│   │   ├── src/
│   │   │   └── handler.ts
│   │   └── tests/
│   │       └── unit/
│   └── version-archive-worker/          # Lambda (SQS-triggered, FR-007b-i)
│       ├── src/
│       │   └── handler.ts               # Reads pending payload, PUTs to S3, deletes pending row on success
│       └── tests/
│           └── unit/
├── shared/
│   ├── db/                             # Drizzle schema + migrations
│   │   └── src/
│   │       ├── schema/                 # Table definitions (TypeScript)
│   │       ├── migrations/             # SQL migration files (incl. deleted_at, pending_archive, source_collection_id)
│   │       └── seed/                   # Seed data for local dev
│   ├── recipe-core/                    # Pure TS types + validation (no runtime deps)
│   │   └── src/
│   │       ├── types/                  # Recipe (with deletedAt), Ingredient, Step, Collection (with sourceCollectionId), PendingArchive interfaces
│   │       └── utils/                  # Validation helpers, slug generation
│   └── config/                         # Zod-based env config loader
│       └── src/
│           └── index.ts
├── ui/                                 # Shared UI components + design tokens
│   └── src/
│       ├── tokens/                     # Design tokens (colors, spacing, typography)
│       └── components/                 # Cross-platform shared components
└── tools/                              # Shared tooling configs (existing)
    ├── typescript/
    ├── eslint/
    └── prettier/
```

**Structure Decision**: Monorepo with domain-grouped workspaces. API services live in `packages/api/<service-name>/` — each service (recipe, photo-processor, version-archive-worker, future user/meal-plan/etc.) gets its own workspace. Frontend apps in `packages/apps/sous-chef/{web,mobile}/`. Shared packages (`db`, `recipe-core`, `config`) in `packages/shared/` for cross-workspace consumption. The version-archive worker is a new workspace introduced by FR-007b-i; it is intentionally separated from the synchronous `recipes` API path so DB-side commits and user responses are never blocked on S3 latency or failure.

## Reliability Architecture (FR-001a, FR-007b-i, C-007, FR-011)

### Atomic Recipe Save with Independent Photo Uploads (FR-001a)

```
Client                       NestJS RecipesService                   PostgreSQL
  │  POST /api/recipes          │                                      │
  │ ───────────────────────────►│                                      │
  │                             │  BEGIN TX                            │
  │                             │  INSERT recipes + recipe_steps +     │
  │                             │         recipe_ingredients           │
  │                             │  INSERT recipe_versions v1           │
  │                             │  Enqueue archive job (best-effort,   │
  │                             │   inside TX commit hook — see below) │
  │                             │  COMMIT                              │
  │ ◄─── 201 { recipe }         │                                      │
  │                             │                                      │
  │  (per photo, in parallel:)                                         │
  │  POST /photos/upload-url    │  ContentLengthRange [1, 5MB]         │
  │ ◄─── { uploadUrl, key }     │                                      │
  │  PUT (direct to S3) ────────────────────────────────────► S3       │
  │  POST /photos/confirm       │  validate size+MIME server-side      │
  │ ───────────────────────────►│  INSERT recipe_photos (status=pending)│
  │ ◄─── 201 { photo }          │                                      │
  │                             │  S3 event → photo-processor Lambda   │
  │                             │  → UPDATE recipe_photos SET ...      │
  │                             │           processing_status='complete'│
```

- Recipe metadata commit is one DB transaction. Photos are never part of that transaction.
- Per-photo client-side validation (size ≤ 5 MB, MIME image/\*) before requesting the presigned URL.
- Per-photo server-side re-validation on `/photos/confirm` (presigned URL `ContentLengthRange` is the hard cap; confirm checks MIME + S3 HEAD size).
- Failed photo uploads return a per-file error to the client with a `retryable: true` flag. The client may re-request a presigned URL and retry without re-saving the recipe.
- Photos that never reach `processing_status='complete'` are surfaced to the user but never linked as broken references on the recipe (the `recipe_photos` row exists in `pending` or `failed` state and is filterable/discardable; the `recipes` row never holds a direct image foreign key beyond `recipe_photos`).

### Resilient Version Archive to S3 (FR-007b-i)

```
RecipesService.save()
  │
  ├── DB TX:
  │     INSERT recipe_versions  (snapshot JSONB, s3_key NULL initially)
  │     INSERT recipe_version_pending_archives (version_id, payload JSONB, attempts=0)
  │     COMMIT
  │
  └── after-commit hook:
        sqs.sendMessage(VERSION_ARCHIVE_QUEUE, { version_id })   // best-effort

VERSION_ARCHIVE_QUEUE  ──► version-archive-worker (Lambda, SQS-triggered)
                              │
                              ├── SELECT pending row by version_id
                              ├── PUT s3://versions-bucket/{recipe_id}/v{n}.json (payload)
                              ├── On success:
                              │     UPDATE recipe_versions SET s3_key = ...
                              │     DELETE recipe_version_pending_archives WHERE id = ...
                              ├── On failure:
                              │     UPDATE recipe_version_pending_archives SET attempts = attempts + 1, last_error
                              │     SQS retry policy → DLQ after N attempts
                              │
                              └── DLQ landing → CloudWatch alarm → operator alert
```

Key invariants:

- The user-facing recipe save **never** awaits S3. The DB commit alone determines save success.
- The pending row is created in the same TX as the version row, guaranteeing every unarchived version has a replayable payload on disk in the DB.
- The SQS enqueue is best-effort after commit: if SQS enqueue itself fails, a periodic sweeper Lambda (cron, every 5 min) selects pending rows older than 5 min and re-enqueues them. This makes the system tolerant of SQS outages.
- Operator-initiated replay is supported via an admin endpoint that re-enqueues an arbitrary `version_id` from the pending table.
- Pending rows are **only** deleted after S3 confirms the PUT. No TTL.

### Soft-Delete Tombstone & GDPR Hard Purge (C-007)

```
Recipe deletion (FR-002):
  DELETE /api/recipes/{id}
    UPDATE recipes SET deleted_at = now() WHERE id = $1 AND owner_id = $user
  Side effects:
    DELETE FROM recipe_collections WHERE recipe_id = $1     -- remove from collections
    (search/list/clone APIs filter `deleted_at IS NULL` on every read path)
  No DB rows or S3 archives removed.

GDPR hard purge ("Erase my data"):
  POST /api/users/me/erase
    For each recipe owned by user where deleted_at IS NOT NULL:
      LIST s3://versions-bucket/{recipe_id}/   → DELETE all objects
      DELETE FROM recipe_versions WHERE recipe_id = $r
      DELETE FROM recipe_version_pending_archives WHERE version_id IN (...)
      DELETE FROM recipe_photos WHERE recipe_id = $r
      DELETE FROM recipes WHERE id = $r
    Audit-log the erasure event (separate immutable audit table).
  Irreversible. Confirmation step in UI (typed confirmation + Auth0 step-up).
```

- Every recipe read path (`GET /recipes`, `GET /recipes/:id`, `GET /search/recipes`, `POST /recipes/:id/clone`, collection membership reads) MUST add `WHERE deleted_at IS NULL` (enforced at DAL layer, not in callers).
- Tombstoned recipes remain available to the owner via a future `GET /api/users/me/erasure-preview` endpoint (read-only listing of what hard-purge would remove). This endpoint is the only read path permitted to return rows where `deleted_at IS NOT NULL`.
- The hard-purge transaction must be idempotent (safe to retry on partial failure). S3 deletes are issued per object; failures are logged and re-tried; the DB rows are deleted only after S3 reports success on every object.

### Collection Snapshot Clone with Opt-In Pull (FR-011)

```
POST /api/collections/{id}/clone
  INSERT collections (..., source_collection_id = $id)
  Copy current accessible recipe memberships at clone time

POST /api/collections/{id}/pull-from-source     ← user-initiated, opt-in
  IF collections.source_collection_id IS NULL  → 409 NOT_CLONED
  Compute diff:
    add    = source.public_membership − clone.membership − clone.user_added_recipe_ids
    remove = clone.membership − source.public_membership − clone.user_added_recipe_ids
  Apply add/remove. Return summary.

# `clone.user_added_recipe_ids` is the set of recipe_ids added to the clone
# AFTER the original snapshot — tracked via `recipe_collections.added_via`
# ('clone' | 'manual' | 'pull').
```

- A clone never auto-pulls. Pull is per invocation.
- Pull MUST NOT remove any recipe whose `added_via = 'manual'` membership row.
- Pull MUST skip any source recipes the cloner cannot access (private, soft-deleted).

## Testing Strategy

### TDD Workflow (NFR-005)

All implementation follows **red-green-refactor**:

1. **Red**: Write a failing test that captures the requirement (unit for business logic, integration for DAL/API/queue boundaries).
2. **Green**: Write the minimum implementation to pass the test.
3. **Refactor**: Clean up while keeping tests green.

Every implementation task in `tasks.md` is paired with a corresponding test task (suffixed `-test`). Test tasks execute first. No implementation task is marked complete without passing tests. New required test groups for the 2026-04-30 clarifications:

- Atomic recipe save: integration tests covering "DB commits, photo upload fails → recipe persists, no broken photo refs."
- Pending archive: integration tests covering "S3 PUT fails → pending row remains, DLQ triggered, replay succeeds → pending row deleted, `s3_key` populated."
- Tombstone filtering: DAL-layer unit tests asserting every read query includes `deleted_at IS NULL`.
- GDPR purge: integration test covering "tombstoned recipe → erase-my-data → DB rows + S3 objects gone, audit row written."
- Pull from source: integration tests for add/remove diffing including the user-added-recipe protection.

### Test Infrastructure

| Layer       | Tool           | File Pattern            | Location                                    |
| ----------- | -------------- | ----------------------- | ------------------------------------------- |
| Unit        | Vitest         | `*.test.ts`             | `__tests__/` co-located with source         |
| Integration | Vitest         | `*.integration.test.ts` | `__tests__/integration/`                    |
| Web E2E     | Playwright     | `*.spec.ts`             | `packages/apps/sous-chef/web/tests/e2e/`    |
| Mobile E2E  | Maestro        | `*.yaml`                | `packages/apps/sous-chef/mobile/tests/e2e/` |
| Load        | k6 / Artillery | `*.load.ts`             | `packages/api/recipe/tests/load/`           |

### LocalStack in Tests (NFR-007)

- **Local dev**: Docker Compose (`docker-compose.yml`) runs PostgreSQL 16 + LocalStack (S3 + SQS).
- **CI**: GitHub Actions service containers mirror the same setup. LocalStack provisions S3 buckets **and** the version-archive SQS queue + DLQ in a `globalSetup.ts` before integration/E2E test suites run.
- **Test isolation**: Each integration test suite gets a fresh database schema (Drizzle migrations applied in `globalSetup`). S3 buckets and SQS queues are purged between test suites.

### Maestro Mobile E2E (NFR-006)

Maestro flows test native mobile interactions on iOS Simulator and Android Emulator:

- Flow files in `packages/apps/sous-chef/mobile/tests/e2e/*.yaml`
- CI runs via `maestro test` with Maestro Cloud or self-hosted runners
- Covers: recipe CRUD (incl. soft delete behavior visible to owner), collection management, clone + pull-from-source, navigation, accessibility, "Erase my data" confirmation flow.

### Fixture Factories (NFR-011)

All unit and component tests use `make*` factories (constitution Principle IV):

- **Backend**: `packages/api/recipe/src/__fixtures__/index.ts` — `makeRecipe()`, `makeIngredient()`, `makeCollection()`, `makeUser()`, `makePendingArchive()`, etc.
- **Frontend**: `packages/apps/sous-chef/web/src/__fixtures__/index.ts` and `mobile/src/__fixtures__/index.ts`
- Factories return typed objects with sensible defaults; all fields overridable via partial argument.

### E2E Database Seeding (NFR-010)

- Seed script: `packages/shared/db/src/seed.ts` — idempotent, deterministic IDs.
- Playwright `globalSetup.ts` runs migrations + seed before E2E suite.
- Maestro flows expect seeded data (stable user IDs, recipe IDs for assertions).

### Frontend API Configuration (NFR-009)

Frontend apps connect to local or remote API servers via environment variables.

**Local port assignments** (avoid collisions):

| Service                | Port   | Notes                                           |
| ---------------------- | ------ | ----------------------------------------------- |
| Recipe API (NestJS)    | `4000` | `PORT=4000` in `packages/api/recipe/.env.local` |
| Next.js web app        | `3000` | Next.js default                                 |
| Expo mobile dev server | `8081` | Metro default                                   |
| PostgreSQL (docker)    | `5432` | `docker-compose.yml`                            |
| LocalStack (S3, SQS)   | `4566` | `docker-compose.yml`                            |

Frontend env defaults:

- **Next.js (web)**: `NEXT_PUBLIC_API_URL` — defaults to `http://localhost:4000` in `.env.local`
- **Expo (mobile)**: `EXPO_PUBLIC_API_URL` — defaults to `http://localhost:4000` in `.env` (use `http://10.0.2.2:4000` for Android emulator, `http://<host-lan-ip>:4000` for physical devices)
- Shared API client (`packages/shared/recipe-core/src/hooks/`) reads the base URL from the environment at initialization.
- E2E tests configure this to point at the local test server.

### Async Archive Worker — Deployment Ordering Note

The version-archive worker (T131/T132) and its CloudWatch alarms (T138) depend on the `recipe_version_pending_archives` table (T121, now in Phase 2). Deploy order: schema migration → API change to enqueue (T130) → worker Lambda + SQS (T131/T132) → alarms (T138). Reversing this order causes pending rows to accumulate without a drainer.

## CI Pipeline (NFR-008)

### GitHub Actions Workflow (`.github/workflows/ci.yml`)

> **Existing CI**: The repo already has a CI workflow with install (npm cache), lint, format, typecheck, and test jobs. Tasks T090–T092 **extend** this existing workflow — they do NOT recreate it. Preserve existing job structure, cache strategy, and concurrency settings.

```yaml
# Conceptual structure — existing jobs (preserve) + new jobs (add)
triggers: [pull_request, push to main] # existing
services: [postgres:16-alpine, localstack/localstack:3] # NEW — for integration + E2E jobs only
existing_jobs: # DO NOT MODIFY (except cache path glob fix)
    - install (npm ci + cache/save)
    - lint (turbo run lint)
    - format (format:check)
    - typecheck (turbo run typecheck)
    - test (turbo run test — unit only)
new_jobs: # ADD these
    test-integration:
        needs: [install]
        services: [postgres, localstack] # localstack runs s3 + sqs
        steps:
            - run migrations + seed
            - provision SQS queue (souschef-version-archive) + DLQ
            - turbo run test:integration
    test-e2e-web:
        needs: [test]
        services: [postgres, localstack]
        steps:
            - build apps
            - start API server
            - npx playwright test
    test-e2e-mobile:
        needs: [test]
        steps:
            - maestro test (Maestro Cloud or self-hosted)
```

### CI Service Containers

- **PostgreSQL 16**: `postgres:16-alpine` with `pg_trgm` extension, health check.
- **LocalStack 3**: `localstack/localstack:3` with `SERVICES=s3,sqs`, provisions buckets and the `souschef-version-archive` queue + DLQ in job setup step.
- **Playwright**: Browser binaries cached by `playwright-version + runner-os` key. Traces/reports uploaded on failure only.
- **Maestro**: Installed via `maestro-cli` action; flows run against Expo dev build on emulator/simulator.

## Complexity Tracking

> No constitution violations identified. All 7 principles pass without deviation. The version-archive worker adds one new workspace — justified below.

| Violation                                            | Why Needed                                                                                                                                                               | Simpler Alternative Rejected Because                                                                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New workspace `packages/api/version-archive-worker/` | FR-007b-i requires S3 archive to be async and not block user save. SQS-triggered Lambda is the standard AWS pattern for at-least-once async processing with DLQ + retry. | Inlining the archive write in the Fargate API process would violate "save MUST succeed independently of S3" and would couple recipe-save p95 to S3 latency/availability. |
