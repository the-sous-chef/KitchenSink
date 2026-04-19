# Tasks: Sous Chef Recipe Management Core

**Input**: Design documents from `/specs/001-sous-chef-recipe-app/`
**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `contracts/`

## Format: `- [ ] T001 [P?] [Story?] Description with exact file path`

**TDD Convention**: Tasks suffixed with `-test` are test-first tasks. They MUST be completed before their corresponding implementation task. Implementation is not complete until tests pass (red-green-refactor per NFR-005).

---

## Phase 1: Setup

**Purpose**: Scaffold required workspaces, test infrastructure, and CI pipeline.

### Workspace Scaffolding

> **Scaffolding method**: Use the `bootstrap` agent skill (`load_skills=["bootstrap"]`) with workspace mode. Each task specifies the bootstrap parameters: `--name`, `--location`, `--type`, `--scope kitchensink`. The skill handles `package.json`, `tsconfig.json`, shared tooling extension, and CDK infra overlay per workspace type.

- [ ] T001 Scaffold recipe API workspace via bootstrap skill: `--name recipe --location packages/api/recipe --type nestjs --scope kitchensink` — produces NestJS skeleton + `infra/` CDK Fargate stack
- [ ] T001a Configure existing Next.js web app workspace via bootstrap skill: `--name sous-chef-web --location packages/apps/sous-chef/web --type nextjs --scope kitchensink` — bare `package.json` stub already exists, bootstrap populates full Next.js 15 App Router structure + `infra/` CDK stack
- [ ] T001b Configure existing Expo mobile app workspace via bootstrap skill: `--name sous-chef-mobile --location packages/apps/sous-chef/mobile --type react-native --scope kitchensink` — bare `package.json` stub already exists, bootstrap populates full Expo 53 structure
- [ ] T002 Scaffold serverless photo processor workspace via bootstrap skill: `--name photo-processor --location packages/api/photo-processor --type serverless --scope kitchensink` — produces Lambda handler skeleton + `infra/` CDK S3 event + IAM stack
- [ ] T003 Scaffold shared recipe-core workspace via bootstrap skill: `--name recipe-core --location packages/shared/recipe-core --type library --scope kitchensink`
- [ ] T004 Scaffold shared config workspace via bootstrap skill: `--name config --location packages/shared/config --type library --scope kitchensink`
- [ ] T005 Scaffold shared db workspace via bootstrap skill: `--name db --location packages/shared/db --type library --scope kitchensink`
- [ ] T006 [P] Register new workspaces in root `package.json` by adding `"packages/api/*"` and `"packages/shared/*"` to the `workspaces` array (existing entries: `packages/tools/*`, `packages/apps/sous-chef/web`, `packages/apps/sous-chef/mobile`, `packages/ui`). Add `test:integration` task to `turbo.json` (`{ "outputs": [] }`) alongside existing `test` task. Verify all workspaces resolve with `npm ls --workspaces`
- [ ] T006a [P] Create `infra/docker/postgres-init.sql` with `CREATE EXTENSION IF NOT EXISTS pg_trgm;` and `CREATE EXTENSION IF NOT EXISTS pgcrypto;` — referenced by `docker-compose.yml` init volume mount
- [ ] T006b [P] Create local dev `docker-compose.yml` at monorepo root (PostgreSQL 16 + LocalStack S3) per quickstart.md specification — distinct from `docker-compose.test.yml` (T088) which is CI-specific
- [ ] T007 [P] Add NestJS API module skeleton files in `packages/api/recipe/src/app.module.ts` and `packages/api/recipe/src/{auth,recipes,ingredients,versions,photos,collections,search}/` — use plural module directory names per NestJS convention
- [ ] T008 [P] Copy contract types into shared package and create barrel exports in `packages/shared/recipe-core/src/recipe.types.ts`, `packages/shared/recipe-core/src/config.types.ts`, and `packages/shared/recipe-core/src/index.ts` — source from `specs/001-sous-chef-recipe-app/contracts/{recipe.types.ts,config.types.ts}`
- [ ] T009 Remove `@ts-expect-error` on zod import in `packages/shared/recipe-core/src/recipe.types.ts` (depends on T008 — file does not exist until contracts are copied)
- [ ] T010 [P] Add shared config package barrel and loader entrypoint in `packages/shared/config/src/index.ts` and `packages/shared/config/src/load-config.ts`

### Test Infrastructure

- [ ] T082 [P] Create backend fixture factories (`makeRecipe`, `makeIngredient`, `makeCollection`, `makeUser`, `makeVersion`, `makePhoto`) in `packages/api/recipe/src/__fixtures__/index.ts` — typed, overridable defaults, `make*` naming per constitution
- [ ] T083 [P] Create web frontend fixture factories (`makeRecipeViewModel`, `makeCollectionViewModel`) in `packages/apps/sous-chef/web/src/__fixtures__/index.ts`
- [ ] T084 [P] Create mobile frontend fixture factories in `packages/apps/sous-chef/mobile/src/__fixtures__/index.ts`
- [ ] T085 [P] Configure Vitest base config for API workspace with unit/integration/e2e splits in `packages/api/recipe/vitest.config.ts`, `packages/api/recipe/vitest.integration.config.ts`
- [ ] T086 [P] Configure Playwright project with `globalSetup.ts` (run migrations + seed, start API server) in `packages/apps/sous-chef/web/playwright.config.ts` and `packages/apps/sous-chef/web/tests/e2e/global-setup.ts`
- [ ] T087 [P] Create Maestro E2E flow directory structure and base config in `packages/apps/sous-chef/mobile/tests/e2e/.maestro/config.yaml`
- [ ] T088 [P] Create `docker-compose.test.yml` for CI test infrastructure (PostgreSQL 16 + LocalStack S3 with bucket auto-provisioning) at monorepo root
- [ ] T089 [P] Implement test `globalSetup.ts` for integration tests: start LocalStack, provision S3 buckets, run Drizzle migrations, seed test data in `packages/api/recipe/tests/global-setup.ts`

### CI Pipeline

> **Note**: `.github/workflows/ci.yml` already exists with install, lint, format, typecheck, and test jobs using npm cache. Tasks below extend it — do NOT recreate from scratch. Preserve existing job structure and cache strategy.

- [ ] T090 [P] Extend existing `.github/workflows/ci.yml` with new jobs: `test-integration` (postgres:16-alpine + localstack/localstack:3 service containers, run migrations + seed, `turbo run test:integration`), `test-e2e-web` (Playwright), `test-e2e-mobile` (Maestro). Fix cache path globs to include deeply nested workspaces (`packages/*/*/*/node_modules`, `packages/*/*/*/*/node_modules`). Preserve existing install/lint/format/typecheck/test jobs
- [ ] T091 [P] Add Playwright browser binary caching (version + OS key) and failure-only trace/report artifact upload to `test-e2e-web` job in `.github/workflows/ci.yml`
- [ ] T092 [P] Add Maestro CLI installation and mobile E2E job (`test-e2e-mobile`) with Maestro Cloud or self-hosted emulator in `.github/workflows/ci.yml`

### Frontend API Configuration

- [ ] T093 [P] Configure `NEXT_PUBLIC_API_URL` env variable with local default in `packages/apps/sous-chef/web/.env.local` and wire into shared API client
- [ ] T094 [P] Configure `EXPO_PUBLIC_API_URL` env variable with local default in `packages/apps/sous-chef/mobile/.env` and wire into shared API client
- [ ] T095 [P] Update shared API client (`packages/shared/recipe-core/src/hooks/`) to read base URL from platform-appropriate env variable at initialization

---

## Phase 2: Foundational (Blocking)

**Purpose**: Complete core infrastructure that blocks all user stories. TDD: write tests for each module before implementation.

### Tests First (TDD Red)

- [ ] T011-test Write unit tests for Drizzle schema type inference (verify exported types compile and match data-model.md contracts) in `packages/shared/db/src/__tests__/schema.test.ts`
- [ ] T017-test Write unit tests for environment loader (valid env, missing required vars, SSM fallback) in `packages/shared/config/src/__tests__/load-config.test.ts`
- [ ] T019-test Write unit tests for Auth0 JWT guard (valid token, expired token, missing token, dev bypass) in `packages/api/recipe/src/auth/__tests__/auth.guard.test.ts`
- [ ] T020-test Write unit tests for API exception filter (RecipeError mapping, unknown error fallback, HTTP status codes) in `packages/api/recipe/src/common/filters/__tests__/api-exception.filter.test.ts`
- [ ] T021-test Write unit tests for `isRecipeError` type guard in `packages/shared/recipe-core/src/__tests__/recipe.types.test.ts`
- [ ] T022-test Write unit tests for throttling configuration (verify rate limits applied to correct route groups) in `packages/api/recipe/src/__tests__/throttle.test.ts`

### Implementation (TDD Green)

- [ ] T011 Define users and recipes Drizzle tables in `packages/shared/db/src/schema/users.ts` and `packages/shared/db/src/schema/recipes.ts`
- [ ] T012 [P] Define ingredient-related Drizzle tables in `packages/shared/db/src/schema/ingredients.ts`
- [ ] T013 [P] Define versions and photos Drizzle tables in `packages/shared/db/src/schema/versions.ts` and `packages/shared/db/src/schema/photos.ts`
- [ ] T014 [P] Define collections Drizzle tables in `packages/shared/db/src/schema/collections.ts`
- [ ] T015 Create schema barrel and Drizzle client proxy in `packages/shared/db/src/schema/index.ts` and `packages/shared/db/src/client.ts`
- [ ] T016 Add initial drizzle migration with extensions, indexes, and FTS trigger SQL in `packages/shared/db/src/migrations/0001_initial.sql`
- [ ] T017 Implement environment loader with Zod validation and optional SSM fallback in `packages/shared/config/src/load-config.ts`
- [ ] T018 Wire global DB provider module and injection token in `packages/api/recipe/src/db/db.module.ts`
- [ ] T019 Implement Auth0 JWT validation guard stub for spec-002 integration in `packages/api/recipe/src/auth/auth.guard.ts`
- [ ] T020 Implement shared API exception filter and recipe-domain error mapping in `packages/api/recipe/src/common/filters/api-exception.filter.ts`
- [ ] T021 Add `isRecipeError(e: unknown): e is RecipeError` type guard in `packages/shared/recipe-core/src/recipe.types.ts`
- [ ] T022 Configure API throttling defaults (writes 30/min, photos 10/min, search 60/min) in `packages/api/recipe/src/app.module.ts`

### E2E Seed Data

- [ ] T096 Implement deterministic E2E seed script with stable IDs for 2 users (free + pro), 5 recipes, 1 collection in `packages/shared/db/src/seed.ts` — idempotent via `ON CONFLICT DO NOTHING`
- [ ] T097 Add `npm run seed` script to `packages/shared/db/package.json` and wire into Playwright/integration `globalSetup.ts`

**Checkpoint**: Foundation complete; user story phases can start.

---

## Phase 3: User Story 1 - Create and Manage Personal Recipes (P1) 🎯 MVP

**Goal**: Deliver recipe CRUD, ingredient handling, versioning, photos, collections, and search for owned/public recipes.

**Independent Test**: Create, edit, delete, search/filter recipes with ingredients/photos/collections and verify version/conflict behavior.

### Tests First (TDD Red) — Backend Unit Tests

- [ ] T024-test Write unit tests for recipe DAL (create, findById, findAll with pagination, update, delete, ownership check) using fixtures in `packages/api/recipe/src/recipes/dal/__tests__/recipes.dal.test.ts`
- [ ] T025-test Write unit tests for recipe service (CRUD orchestration, authorization, validation) using mocked DAL in `packages/api/recipe/src/recipes/__tests__/recipes.service.test.ts`
- [ ] T027-test Write unit tests for ingredient DAL (pg_trgm search, tsvector search, freeform creation) in `packages/api/recipe/src/ingredients/dal/__tests__/ingredients.dal.test.ts`
- [ ] T028-test Write unit tests for ingredient service (USDA lookup, freeform + nutrition, dedup) in `packages/api/recipe/src/ingredients/__tests__/ingredients.service.test.ts`
- [ ] T030-test Write unit tests for version DAL (snapshot create, list by recipe, retention query) in `packages/api/recipe/src/versions/dal/__tests__/versions.dal.test.ts`
- [ ] T031-test Write unit tests for version service (snapshot write, DB retention pruning, S3 archive call) using mocked S3 in `packages/api/recipe/src/versions/__tests__/versions.service.test.ts`
- [ ] T033-test Write unit tests for optimistic concurrency (version mismatch detection, 409 payload) in `packages/api/recipe/src/recipes/__tests__/conflict.service.test.ts`
- [ ] T034-test Write unit tests for photo DAL (metadata CRUD, 10-photo limit enforcement) in `packages/api/recipe/src/photos/dal/__tests__/photos.dal.test.ts`
- [ ] T035-test Write unit tests for photo service (presigned URL generation with mocked S3, confirmation, deletion) in `packages/api/recipe/src/photos/__tests__/photos.service.test.ts`
- [ ] T037-test Write unit tests for photo processor handler (S3 event parsing, Sharp invocation, output key generation) in `packages/api/photo-processor/src/__tests__/process.handler.test.ts`
- [ ] T038-test Write unit tests for Sharp resize utility (WebP conversion, variant dimensions) in `packages/api/photo-processor/src/lib/__tests__/sharp.lib.test.ts`
- [ ] T039-test Write unit tests for collections DAL (CRUD, membership add/remove, multi-membership) in `packages/api/recipe/src/collections/dal/__tests__/collections.dal.test.ts`
- [ ] T040-test Write unit tests for collections service (CRUD, membership, no-cascade delete) in `packages/api/recipe/src/collections/__tests__/collections.service.test.ts`
- [ ] T042-test Write unit tests for search DAL (FTS rank query, facet aggregation, empty result) in `packages/api/recipe/src/search/dal/__tests__/search.dal.test.ts`

### Implementation (TDD Green)

- [ ] T023 [P] [US1] Define create/update/list recipe DTOs in `packages/api/recipe/src/recipes/dto/{create-recipe.dto.ts,update-recipe.dto.ts,list-recipes.query.dto.ts}`
- [ ] T024 [P] [US1] Implement recipe DAL queries in `packages/api/recipe/src/recipes/dal/recipes.dal.ts`
- [ ] T025 [US1] Implement recipe create/list/get/update/delete service logic in `packages/api/recipe/src/recipes/recipes.service.ts`
- [ ] T026 [US1] Implement recipes controller endpoints for `/api/recipes` and `/api/recipes/{id}` in `packages/api/recipe/src/recipes/recipes.controller.ts`
- [ ] T027 [P] [US1] Implement ingredient search DAL with pg_trgm + tsvector strategy in `packages/api/recipe/src/ingredients/dal/ingredients.dal.ts`
- [ ] T028 [US1] Implement ingredient service for USDA-backed lookup and freeform creation in `packages/api/recipe/src/ingredients/ingredients.service.ts`
- [ ] T029 [US1] Implement ingredients controller endpoints for `/api/ingredients/search` and `/api/ingredients` in `packages/api/recipe/src/ingredients/ingredients.controller.ts`
- [ ] T030 [P] [US1] Implement recipe version snapshot DAL in `packages/api/recipe/src/versions/dal/versions.dal.ts`
- [ ] T031 [US1] Implement versioning service for snapshot writes, DB retention (last 10), and S3 archive writes in `packages/api/recipe/src/versions/versions.service.ts`
- [ ] T032 [US1] Implement versions controller endpoints for list/get/restore in `packages/api/recipe/src/versions/versions.controller.ts`
- [ ] T033 [US1] Implement optimistic concurrency conflict handling with HTTP 409 payload in `packages/api/recipe/src/recipes/recipes.service.ts`
- [ ] T034 [P] [US1] Implement photo metadata DAL with 10-photo limit checks in `packages/api/recipe/src/photos/dal/photos.dal.ts`
- [ ] T035 [US1] Implement photo upload URL and confirmation service logic in `packages/api/recipe/src/photos/photos.service.ts`
- [ ] T036 [US1] Implement photos controller endpoints for upload-url/confirm/list/delete/reorder in `packages/api/recipe/src/photos/photos.controller.ts`
- [ ] T037 [P] [US1] Implement S3 event handler for Sharp resize pipeline in `packages/api/photo-processor/src/handlers/process.handler.ts`
- [ ] T038 [P] [US1] Implement Sharp resize utility for thumb/card/full WebP variants in `packages/api/photo-processor/src/lib/sharp.lib.ts`
- [ ] T039 [P] [US1] Implement collections DAL queries in `packages/api/recipe/src/collections/dal/collections.dal.ts`
- [ ] T040 [US1] Implement collections service for CRUD and recipe membership in `packages/api/recipe/src/collections/collections.service.ts`
- [ ] T041 [US1] Implement collections controller endpoints in `packages/api/recipe/src/collections/collections.controller.ts`
- [ ] T042 [P] [US1] Implement search DAL with FTS rank sampling CTE and facet aggregation in `packages/api/recipe/src/search/dal/search.dal.ts`
- [ ] T043 [US1] Implement search service/controller for `/api/search/recipes` in `packages/api/recipe/src/search/{search.service.ts,search.controller.ts}`

### Integration Tests (TDD — against real DB + LocalStack)

- [ ] T044 [US1] Add integration test for version retention (keep last 10 in DB, archive all to S3 via LocalStack) in `packages/api/recipe/__tests__/integration/versions/retention.integration.spec.ts`
- [ ] T045 [US1] Add integration test for optimistic conflict detection returning HTTP 409 with version metadata in `packages/api/recipe/__tests__/integration/recipes/conflict.integration.spec.ts`
- [ ] T098 [US1] Add integration test for recipe CRUD lifecycle (create → get → update → list → delete) against real PostgreSQL in `packages/api/recipe/__tests__/integration/recipes/crud.integration.spec.ts`
- [ ] T099 [US1] Add integration test for ingredient search (pg_trgm fuzzy + FTS exact) against real PostgreSQL in `packages/api/recipe/__tests__/integration/ingredients/search.integration.spec.ts`
- [ ] T100 [US1] Add integration test for photo upload flow (presigned URL → S3 upload via LocalStack → confirm) in `packages/api/recipe/__tests__/integration/photos/upload.integration.spec.ts`
- [ ] T101 [US1] Add integration test for collections CRUD + membership (add/remove recipes, no-cascade delete) in `packages/api/recipe/__tests__/integration/collections/crud.integration.spec.ts`
- [ ] T102 [US1] Add integration test for search endpoint (FTS + facets + pagination) in `packages/api/recipe/__tests__/integration/search/search.integration.spec.ts`

**Checkpoint**: US1 delivers complete personal recipe management MVP with full test coverage.

---

## Phase 4: User Story 2 - Share, Copy, and Clone Recipes (P1)

**Goal**: Deliver sharing and cloning with C-004 visibility policy, attribution retention, and substantive edit tracking.

**Independent Test**: User A shares public recipe, User B clones, edits clone, original unchanged, and visibility transitions enforce C-004.

### Tests First (TDD Red)

- [ ] T048-test Write unit tests for visibility policy evaluator (all C-004 scenarios: user-created, imported-public, imported-physical, paid-source, tier transitions, substantive edit unlock) in `packages/api/recipe/src/recipes/domain/__tests__/visibility-policy.test.ts`
- [ ] T047-test Write unit tests for clone service (attribution copy, owner reassignment, visibility inheritance) in `packages/api/recipe/src/recipes/__tests__/clone.service.test.ts`
- [ ] T049-test Write unit tests for substantive edit detection (ingredient change = substantive, title change = not substantive) in `packages/api/recipe/src/recipes/__tests__/substantive-edit.service.test.ts`

### Implementation (TDD Green)

- [ ] T046 [P] [US2] Add clone and visibility DTOs in `packages/api/recipe/src/recipes/dto/{clone-recipe.dto.ts,set-visibility.dto.ts}`
- [ ] T047 [US2] Implement clone workflow with attribution copy and owner reassignment in `packages/api/recipe/src/recipes/recipes.service.ts`
- [ ] T048 [US2] Implement C-004 visibility policy evaluator for source type, tier, and substantive edit state in `packages/api/recipe/src/recipes/domain/visibility-policy.ts`
- [ ] T049 [US2] Implement substantive edit detection for ingredient/step mutations updating `hasSubstantiveEdit` in `packages/api/recipe/src/recipes/recipes.service.ts`
- [ ] T050 [US2] Implement `/api/recipes/{id}/clone` and `/api/recipes/{id}/visibility` endpoints in `packages/api/recipe/src/recipes/recipes.controller.ts`

### Integration Tests

- [ ] T051 [US2] Add integration test for clone visibility + attribution + substantive-edit unlock rules in `packages/api/recipe/__tests__/integration/recipes/clone-visibility.integration.spec.ts`
- [ ] T103 [US2] Add integration test for collection cloning (public collection clone excludes private recipes) in `packages/api/recipe/__tests__/integration/collections/clone-collection.integration.spec.ts`

**Checkpoint**: US2 sharing and cloning behavior is independently functional and policy-compliant.

---

## Phase 5: Frontend — Web (Next.js 15) & Mobile (Expo 53)

**Purpose**: Deliver platform-parity UI for recipe CRUD, search, collections, sharing/cloning, and photo management.

### Setup & Shared

- [ ] T061 [P] Configure Next.js 15 App Router with Auth0 web SDK (`@auth0/nextjs-auth0` v4.x) in `packages/apps/sous-chef/web/src/app/layout.tsx`
- [ ] T062 [P] Configure Expo 53 with Auth0 native SDK (`react-native-auth0` v5.5) in `packages/apps/sous-chef/mobile/src/app/_layout.tsx`
- [ ] T063 [P] Set up shared design tokens (colors, spacing, typography) in `packages/ui/src/tokens/` consumable by both web (Tailwind v4) and mobile (Tamagui)
- [ ] T064 [P] Create shared API client (TanStack Query v5) with typed hooks for recipe endpoints in `packages/shared/recipe-core/src/hooks/` — reads `NEXT_PUBLIC_API_URL` / `EXPO_PUBLIC_API_URL` for base URL (NFR-009)

### Frontend Unit/Component Tests (TDD Red — mocks + fixtures only)

- [ ] T104 Write unit tests for shared API client hooks (useRecipes, useRecipe, useCreateRecipe, etc.) using MSW mocks in `packages/shared/recipe-core/src/hooks/__tests__/`
- [ ] T105 Write component tests for recipe list (loading, empty, populated, search filter) in `packages/apps/sous-chef/web/src/app/recipes/__tests__/page.test.tsx`
- [ ] T106 Write component tests for recipe create/edit form (validation, ingredient autocomplete, photo upload) in `packages/apps/sous-chef/web/src/app/recipes/__tests__/form.test.tsx`
- [ ] T107 Write component tests for collection views (list, detail, add/remove) in `packages/apps/sous-chef/web/src/app/collections/__tests__/`
- [ ] T108 Write component tests for clone/visibility flow (attribution display, tier restrictions) in `packages/apps/sous-chef/web/src/app/recipes/__tests__/clone.test.tsx`

### Recipe CRUD (US1)

- [ ] T065 [US1] Implement recipe list screen with search/filter bar — web: `packages/apps/sous-chef/web/src/app/recipes/page.tsx`, mobile: `packages/apps/sous-chef/mobile/src/screens/RecipeListScreen.tsx`
- [ ] T066 [US1] Implement recipe detail view with ingredients, instructions, photos, and nutrition summary — web + mobile
- [ ] T067 [US1] Implement recipe create/edit form with ingredient autocomplete (USDA + freeform), step editor, photo upload, and tag picker — web + mobile
- [ ] T068 [US1] Implement recipe delete confirmation flow — web + mobile
- [ ] T069 [US1] Implement version history view with restore action — web + mobile
- [ ] T070 [US1] Implement concurrent edit conflict resolution UI (present both versions, choose/merge) — web + mobile

### Collections (US1)

- [ ] T071 [US1] Implement collection list and detail views — web + mobile
- [ ] T072 [US1] Implement add/remove recipe from collection flow — web + mobile
- [ ] T073 [US1] Implement collection create/rename/delete — web + mobile

### Sharing & Cloning (US2)

- [ ] T074 [US2] Implement recipe visibility toggle (public/private) with tier restrictions — web + mobile
- [ ] T075 [US2] Implement clone recipe flow with attribution display — web + mobile
- [ ] T076 [US2] Implement public recipe discovery/browse view — web + mobile

### Web E2E Tests (Playwright)

- [ ] T077 Verify all interactive elements have accessible names (`getByRole`/`getByLabel`) — web Playwright E2E tests in `packages/apps/sous-chef/web/tests/e2e/`
- [ ] T078 Verify color is never sole state conveyor (icon/text pairing) across all screens — web + mobile
- [ ] T079 Add Playwright E2E tests for recipe CRUD happy path (create → view → edit → delete) in `packages/apps/sous-chef/web/tests/e2e/recipe-crud.spec.ts`
- [ ] T080 Add Playwright E2E tests for clone/visibility flow in `packages/apps/sous-chef/web/tests/e2e/clone-visibility.spec.ts`
- [ ] T109 Add Playwright E2E tests for collections (create → add recipe → view → remove → delete) in `packages/apps/sous-chef/web/tests/e2e/collections.spec.ts`
- [ ] T110 Add Playwright E2E tests for search and filter in `packages/apps/sous-chef/web/tests/e2e/search.spec.ts`

### Mobile E2E Tests (Maestro)

- [ ] T111 Add Maestro E2E flow for recipe CRUD (create → view → edit → delete) in `packages/apps/sous-chef/mobile/tests/e2e/recipe-crud.yaml`
- [ ] T112 Add Maestro E2E flow for collections management in `packages/apps/sous-chef/mobile/tests/e2e/collections.yaml`
- [ ] T113 Add Maestro E2E flow for clone/visibility in `packages/apps/sous-chef/mobile/tests/e2e/clone-visibility.yaml`
- [ ] T114 Add Maestro E2E flow for search and navigation in `packages/apps/sous-chef/mobile/tests/e2e/search-nav.yaml`
- [ ] T115 Add Maestro E2E accessibility flow (screen reader labels, tap targets) in `packages/apps/sous-chef/mobile/tests/e2e/accessibility.yaml`

**Checkpoint**: Frontend delivers platform-parity UI for all in-scope user stories with full Playwright + Maestro E2E coverage.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Final compliance, validation, CI verification, and documentation updates.

- [ ] T052 Update backend quickstart runbook for API, DB migrations, photo processor flow, CI setup, and test commands in `specs/001-sous-chef-recipe-app/quickstart.md`
- [ ] T053 Align OpenAPI examples and response/error payloads with implemented API behavior in `specs/001-sous-chef-recipe-app/contracts/api.openapi.yaml`

### Success Criteria Validation

- [ ] T081 Add k6 or Artillery load test script targeting p95 ≤ 500ms under 10k concurrent users (SC-009) in `packages/api/recipe/tests/load/`
- SC-001 (recipe creation < 5 min) — validated via manual QA / usability testing (no buildable task)
- SC-005 (80% engagement in first week) — validated post-launch via analytics (no buildable task)

### CI Verification

- [ ] T116 Run full GitHub Actions CI pipeline end-to-end and verify all jobs pass (quality, test-unit, test-integration, test-e2e-web, test-e2e-mobile)
- [ ] T117 Verify test pyramid ratios: ≥70% unit / ≤20% integration / ≤10% E2E across all workspaces

### Constitution Compliance Checklist (I–VII)

- [ ] T054 Verify strict TypeScript, no `any`, and typed custom errors/type guards across `packages/api/recipe/src/**/*.ts` and `packages/shared/**/src/**/*.ts` (Principle I)
- [ ] T055 Verify module-level and exported-symbol JSDoc coverage in `packages/api/recipe/src/**/*.ts` and `packages/shared/**/src/**/*.ts` (Principle II)
- [ ] T056 Verify aliased imports with `.js` extensions and no forbidden cross-workspace relative imports in `packages/api/recipe/src/**/*.ts` and `packages/shared/**/src/**/*.ts` (Principle III)
- [ ] T057 Verify integration tests include requirement traceability comments and avoid prohibited test patterns in `packages/api/recipe/__tests__/integration/**/*.spec.ts` (Principle IV)
- [ ] T058 Verify workspace governance entries and task pipelines remain correct in `/home/brandon/Development/KitchenSink/package.json` and `/home/brandon/Development/KitchenSink/turbo.json` (Principle V)
- [ ] T059 Run and validate `turbo run typecheck lint format:check test` from `/home/brandon/Development/KitchenSink` with all exit codes 0 (Principle VI)
- [ ] T060 Verify platform parity and accessibility constraints in API contracts and shared models via `specs/001-sous-chef-recipe-app/contracts/{api.openapi.yaml,recipe.types.ts}` (Principle VII)

---

## Dependencies & Execution Order

### Phase Dependency Graph

- Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1 Backend) → Phase 4 (US2 Backend) → Phase 5 (Frontend) → Phase 6 (Polish)
- Phase 1 includes test infrastructure + CI pipeline setup — these MUST complete before any test tasks run.
- Phase 2 blocks all story work.
- Phase 5 (Frontend) can start after Phase 3 (US1 Backend) delivers stable API endpoints. Phase 4 (US2) and Phase 5 can run in parallel.
- Phase 6 starts only after all prior phases are complete.

### TDD Ordering (Within Each Phase)

- `T0XX-test` tasks execute BEFORE their corresponding `T0XX` implementation tasks.
- Test tasks may run in parallel with other test tasks.
- Implementation begins only after the relevant test task is complete (red → green).

### User Story Dependencies

- **US1**: Starts after Phase 2; no dependency on US2.
- **US2**: Depends on US1 recipe model and recipe CRUD/version primitives; must remain independently testable via clone/visibility flows.

### Within-Story Ordering

- Order each story as: **unit tests → models/DTO/DAL → services/domain policies → controllers/endpoints → integration tests**.
- For US1, implement recipes core before versions/photos/collections/search controllers that depend on recipe ownership checks.
- For US2, implement policy evaluator before visibility endpoint wiring.

### Parallel Opportunities

- Setup: T006, T007, T008, T010 can run in parallel after workspace scaffolding tasks. T082–T092 (test infra + CI) can run in parallel with module skeleton work.
- Foundational: schema split tasks T012–T014 parallelize; config/auth/error tasks T017–T020 parallelize after baseline packages exist. Test tasks (T011-test through T022-test) parallelize.
- US1: DAL test tasks parallelize. DAL implementation tasks (T024, T027, T030, T034, T039, T042) and photo-processor tasks (T037, T038) are parallelizable.
- US2: T046 and policy/service prep can run in parallel before controller/test tasks.
- Frontend: Component test tasks (T104–T108) can run in parallel. Playwright E2E and Maestro E2E run independently.

---

## Implementation Strategy

### TDD-First (NFR-005)

All phases follow red-green-refactor:

1. Write failing tests that encode the requirement.
2. Implement minimum code to pass.
3. Refactor while green.
4. Run `turbo run test` to confirm no regressions.

### MVP-First (US1 First)

1. Complete Phase 1 Setup (including test infra + CI pipeline).
2. Deliver US1 end-to-end (unit tests → implementation → integration tests).
3. Validate US1 independently with full test suite passing in CI.
4. Only then proceed to US2.

### Incremental Delivery

1. Foundation complete and stable with CI green.
2. Ship US1 as first production increment with test coverage verified.
3. Add US2 clone/visibility rules as second increment without regressing US1.
4. Finish with Phase 5 frontend + E2E (Playwright + Maestro) + compliance pass.

### Parallel Team Approach

1. Team aligns on Setup + Foundational baseline (including test infra).
2. Parallelize US1 by module verticals (recipes, ingredients/search, versions, photos, collections) — each vertical writes tests first.
3. Start US2 after recipes domain model and ownership/visibility primitives stabilize.
4. Frontend team starts after US1 backend API is stable; web E2E (Playwright) and mobile E2E (Maestro) run in parallel.
5. Reserve final pass for CI verification, constitution checks, and quickstart/API contract sync.

---

## Task Count Summary

| Phase                 | Implementation | Unit Tests | Integration Tests | E2E Tests | Infrastructure | Total   |
| --------------------- | -------------- | ---------- | ----------------- | --------- | -------------- | ------- |
| Phase 1: Setup        | 14             | 0          | 0                 | 0         | 14             | 28      |
| Phase 2: Foundational | 12             | 6          | 0                 | 0         | 2              | 20      |
| Phase 3: US1          | 21             | 14         | 7                 | 0         | 0              | 42      |
| Phase 4: US2          | 5              | 3          | 2                 | 0         | 0              | 10      |
| Phase 5: Frontend     | 16             | 5          | 0                 | 11        | 0              | 32      |
| Phase 6: Polish       | 11             | 0          | 0                 | 0         | 2              | 13      |
| **Total**             | **79**         | **28**     | **9**             | **11**    | **18**         | **145** |
