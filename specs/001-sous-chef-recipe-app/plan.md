# Implementation Plan: Sous Chef Recipe App

**Branch**: `001-sous-chef-recipe-app` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sous-chef-recipe-app/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Core recipe management application — CRUD operations, full-text search (PostgreSQL FTS with tsvector/tsquery + GIN indexes), recipe versioning (snapshot pattern with optimistic concurrency), sharing/cloning with visibility controls (private/unlisted/public), and photo management (S3 presigned uploads + Lambda Sharp processing + CloudFront CDN). NestJS 11 on AWS Fargate (ECS) backend, RDS PostgreSQL 16, Drizzle ORM, Turborepo monorepo with npm workspaces.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 24.x (per `.nvmrc` + `package.json` engines)
**Primary Dependencies**: NestJS 11, Drizzle ORM, `pg` (node-postgres), `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, Sharp (Lambda photo processor), `class-validator` + `class-transformer` (DTO validation), `@nestjs/config` (Zod env), `@auth0/nextjs-auth0` v4.x (web), `react-native-auth0` v5.5 (mobile)
**Storage**: RDS PostgreSQL 16 (`db.t4g.small`, ~$25/mo) — pg_trgm, JSONB, tsvector FTS; S3 (photo objects) + CloudFront (CDN)
**Testing**: Vitest (unit + integration), Playwright (web E2E), Maestro (mobile E2E); TDD red-green-refactor; LocalStack for AWS emulation; pyramid target ≥70% unit / ≤20% integration / ≤10% E2E
**Target Platform**: AWS Fargate (ECS) for NestJS API, Lambda for photo processor, CloudFront CDN, RDS PostgreSQL
**Project Type**: web-service (NestJS REST API) + serverless function (photo processor Lambda) + web app (Next.js) + mobile app (Expo/React Native)
**Performance Goals**: p95 ≤ 500 ms API response for 10k concurrent users; search latency < 2 s (PostgreSQL FTS at launch, Typesense fallback if p95 > 400 ms)
**Constraints**: 5 MB max photo upload, 10 photos per recipe, < 200 ms cold start (Fargate eliminates Lambda cold start for API; Lambda photo processor is async so cold start is non-blocking)
**Scale/Scope**: 10k concurrent users, < 5M recipes initially; connection pool 50–100 (RDS `db.t4g.small`)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with each KitchenSink Constitution principle before proceeding:

| #   | Principle                                                                                                                          | Status  | Notes                                                                                                                                                                                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I   | **Correctness & Type Safety** — strict TS, no `any`, proper error types, ISO dates                                                 | ☑️ Pass | Strict TS enforced via `@kitchensink/typescript` base config (`strict: true`). Drizzle schema provides end-to-end type safety. ISO 8601 timestamps in all date columns (`created_at`, `updated_at`).                                                            |
| II  | **Readability & JSDoc** — JSDoc on all exports, braces, blank-line rules, named exports                                            | ☑️ Pass | All exported functions, classes, interfaces, and type aliases will carry JSDoc. Named exports only (no default exports). ESLint rules enforced via `@kitchensink/eslint`.                                                                                       |
| III | **Code Organization & Imports** — aliased imports, `.js` extensions, `utils/`/`lib/`/`dal/` layout, no `helpers/`                  | ☑️ Pass | Monorepo workspace imports via `@kitchensink/*` aliases. NestJS modules follow `dal/`/`lib/`/`utils/` convention. No `helpers/` directories. `.js` extensions in ESM imports.                                                                                   |
| IV  | **Testing Discipline** — pyramid ratios, `getByRole`/`getByLabel` only, no `waitForTimeout`, test-plan comments                    | ☑️ Pass | Vitest for unit + integration; Playwright for E2E. `getByRole`/`getByLabel` selectors only — `data-testid` prohibited. Test-plan comments in each test file. Pyramid: ≥70% unit / ≤20% integration / ≤10% E2E.                                                  |
| V   | **Monorepo & Workspace Governance** — workspace registered, shared tooling extended, Turbo tasks declared, per-PR schema isolation | ☑️ Pass | All workspaces registered in root `package.json`. Shared `tsconfig`, ESLint, Prettier configs extended from `packages/tools/`. Turbo tasks declared in `turbo.json`. Per-PR database schema isolation via Drizzle migrations + Docker Compose local PostgreSQL. |
| VI  | **Formatting & Tooling** — Prettier/ESLint shared configs, git hooks active, CI gates passing, `generate:types` runs first         | ☑️ Pass | Prettier + ESLint configs in `packages/tools/`. Git hooks (lint-staged) active. CI gates enforce lint + typecheck + test. Drizzle `generate:types` in Turbo dependency graph before build.                                                                      |
| VII | **Accessibility & UX Consistency** — accessible names, design tokens, design-token–driven components, platform parity              | ☑️ Pass | Spec requires FR-044 platform parity (web + mobile). Accessible names on all interactive elements. Design tokens from `packages/ui/`. Domain-grouped components.                                                                                                |

Any justified deviation MUST be documented in the **Complexity Tracking** table below.

## Project Structure

### Documentation (this feature)

```text
specs/001-sous-chef-recipe-app/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output — complete (456 lines)
├── data-model.md        # Phase 1 output — complete (477 lines, full DDL)
├── quickstart.md        # Phase 1 output — complete (329 lines, local dev guide)
├── contracts/           # Phase 1 output — API contract stubs
└── tasks.md             # Phase 2 output — complete (167 lines, 60+ tasks)
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
│       │   │   └── lib/                # Client-side utilities
│       │   └── tests/
│       │       ├── unit/
│       │       └── e2e/                # Playwright E2E tests
│       └── mobile/                     # Expo 53 + React Native (Auth0 native SDK)
│           ├── src/
│           │   ├── screens/            # Screen components
│           │   ├── components/         # Domain-grouped UI components
│           │   └── lib/                # Mobile utilities
│           └── tests/
│               ├── unit/
│               └── e2e/                # Maestro E2E flow files (*.yaml)
├── api/
│   ├── recipe/                            # NestJS 11 REST API (Fargate deployment)
│   │   ├── src/
│   │   │   ├── recipes/                 # Recipe module (controller, service, dal)
│   │   │   │   ├── recipes.controller.ts
│   │   │   │   ├── recipes.service.ts
│   │   │   │   └── dal/               # Data access layer (Drizzle queries)
│   │   │   ├── ingredients/             # Ingredient module (USDA lookup, freeform)
│   │   │   ├── versions/               # Version module (snapshots, retention)
│   │   │   ├── photos/                  # Photo module (presigned URLs, metadata)
│   │   │   ├── collections/             # Collection module (CRUD, membership)
│   │   │   ├── search/                 # Search module (PostgreSQL FTS)
│   │   │   ├── auth/                   # Auth module (Auth0 JWT guard)
│   │   │   ├── health/                 # Health check endpoint
│   │   │   └── common/                 # Shared utilities (filters, pagination, errors)
│   │   └── tests/
│   │       ├── unit/
│   │       └── integration/            # Vitest + Docker PostgreSQL
│   └── photo-processor/                # Lambda function (Sharp image resize)
│       ├── src/
│       │   └── handler.ts
│       └── tests/
│           └── unit/
├── shared/
│   ├── db/                             # Drizzle schema + migrations
│   │   └── src/
│   │       ├── schema/                 # Table definitions (TypeScript)
│   │       ├── migrations/             # SQL migration files
│   │       └── seed/                   # Seed data for local dev
│   ├── recipe-core/                    # Pure TS types + validation (no runtime deps)
│   │   └── src/
│   │       ├── types/                  # Recipe, Ingredient, Step interfaces
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

**Structure Decision**: Monorepo with domain-grouped workspaces. API services live in `packages/api/<service-name>/` — each service (recipe, photo-processor, future user/meal-plan/etc.) gets its own workspace. Frontend apps in `packages/apps/sous-chef/{web,mobile}/`. Shared packages (`db`, `recipe-core`, `config`) in `packages/shared/` for cross-workspace consumption.

## Testing Strategy

### TDD Workflow (NFR-005)

All implementation follows **red-green-refactor**:

1. **Red**: Write a failing test that captures the requirement (unit for business logic, integration for DAL/API boundaries).
2. **Green**: Write the minimum implementation to pass the test.
3. **Refactor**: Clean up while keeping tests green.

Every implementation task in `tasks.md` is paired with a corresponding test task (suffixed `-test`). Test tasks execute first. No implementation task is marked complete without passing tests.

### Test Infrastructure

| Layer       | Tool           | File Pattern            | Location                                    |
| ----------- | -------------- | ----------------------- | ------------------------------------------- |
| Unit        | Vitest         | `*.test.ts`             | `__tests__/` co-located with source         |
| Integration | Vitest         | `*.integration.test.ts` | `__tests__/integration/`                    |
| Web E2E     | Playwright     | `*.spec.ts`             | `packages/apps/sous-chef/web/tests/e2e/`    |
| Mobile E2E  | Maestro        | `*.yaml`                | `packages/apps/sous-chef/mobile/tests/e2e/` |
| Load        | k6 / Artillery | `*.load.ts`             | `packages/api/recipe/tests/load/`           |

### LocalStack in Tests (NFR-007)

- **Local dev**: Docker Compose (`docker-compose.yml`) runs PostgreSQL 16 + LocalStack S3.
- **CI**: GitHub Actions service containers mirror the same setup. LocalStack provisions S3 buckets in a `globalSetup.ts` before integration/E2E test suites run.
- **Test isolation**: Each integration test suite gets a fresh database schema (Drizzle migrations applied in `globalSetup`). S3 buckets are cleared between test suites.

### Maestro Mobile E2E (NFR-006)

Maestro flows test native mobile interactions on iOS Simulator and Android Emulator:

- Flow files in `packages/apps/sous-chef/mobile/tests/e2e/*.yaml`
- CI runs via `maestro test` with Maestro Cloud or self-hosted runners
- Covers: recipe CRUD, collection management, clone/visibility, navigation, accessibility

### Fixture Factories (NFR-011)

All unit and component tests use `make*` factories (constitution Principle IV):

- **Backend**: `packages/api/recipe/src/__fixtures__/index.ts` — `makeRecipe()`, `makeIngredient()`, `makeCollection()`, `makeUser()`, etc.
- **Frontend**: `packages/apps/sous-chef/web/src/__fixtures__/index.ts` and `mobile/src/__fixtures__/index.ts`
- Factories return typed objects with sensible defaults; all fields overridable via partial argument.

### E2E Database Seeding (NFR-010)

- Seed script: `packages/shared/db/src/seed.ts` — idempotent, deterministic IDs.
- Playwright `globalSetup.ts` runs migrations + seed before E2E suite.
- Maestro flows expect seeded data (stable user IDs, recipe IDs for assertions).

### Frontend API Configuration (NFR-009)

Frontend apps connect to local or remote API servers via environment variables:

- **Next.js (web)**: `NEXT_PUBLIC_API_URL` — defaults to `http://localhost:3000` in `.env.local`
- **Expo (mobile)**: `EXPO_PUBLIC_API_URL` — defaults to `http://localhost:3000` in `.env`
- Shared API client (`packages/shared/recipe-core/src/hooks/`) reads the base URL from the environment at initialization.
- E2E tests configure this to point at the local test server.

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
        services: [postgres, localstack]
        steps:
            - run migrations + seed
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
- **LocalStack 3**: `localstack/localstack:3` with `SERVICES=s3`, provisions buckets in job setup step.
- **Playwright**: Browser binaries cached by `playwright-version + runner-os` key. Traces/reports uploaded on failure only.
- **Maestro**: Installed via `maestro-cli` action; flows run against Expo dev build on emulator/simulator.

## Complexity Tracking

> No constitution violations identified. All 7 principles pass without deviation.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _(none)_  | —          | —                                    |
