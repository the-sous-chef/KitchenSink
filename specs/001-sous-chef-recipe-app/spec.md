# Feature Specification: Sous Chef - Recipe Management Core

**Feature Branch**: `001-sous-chef-recipe-app`
**Created**: 2026-04-14
**Status**: Draft
**Input**: User description: "Core recipe management for the Sous Chef app — CRUD, search, versioning, sharing/cloning, collections, and platform parity across web and mobile."

## Dependencies

This is the **foundational spec** for the Sous Chef product. All other specs depend on it.

| Spec                                                        | Relationship                                                          |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| [003-usda-food-data](../003-usda-food-data/spec.md)         | Provides the food/nutrition database backing FR-007 (ingredient data) |
| [002-auth0-user-auth](../002-auth0-user-auth/spec.md)       | Provides authentication required by FR-045                            |
| [004-recipe-importing](../004-recipe-importing/spec.md)     | Extends recipe creation with external source import                   |
| [005-ai-integration](../005-ai-integration/spec.md)         | Extends recipe creation with AI generation                            |
| [006-meal-planning](../006-meal-planning/spec.md)           | Consumes recipes for meal plan assignment                             |
| [007-grocery-lists](../007-grocery-lists/spec.md)           | Consumes recipe ingredients via meal plans                            |
| [008-cooking-mode](../008-cooking-mode/spec.md)             | Consumes recipe instructions for step-by-step display                 |
| [009-nutrition-planning](../009-nutrition-planning/spec.md) | Consumes recipe nutritional data via meal plans                       |
| [010-subscriptions](../010-subscriptions/spec.md)           | Gates premium features (private visibility, etc.)                     |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create and Manage Personal Recipes (Priority: P1)

A user opens Sous Chef, creates an account, and begins building their personal recipe collection. They can create new recipes from scratch by entering a title, description, ingredients (backed by real food data with nutritional information), step-by-step instructions, prep/cook times, servings, tags, and photos. They can edit or delete recipes they own. They can view their recipes in a searchable, filterable list. They can organize recipes into collections (folders/groups) for personal categorization.

**Why this priority**: Recipe management is the core data model that every other feature depends on. Without recipes, there is no meal planning, no grocery lists, no cooking mode. This is the foundation of the entire product.

**Independent Test**: Can be fully tested by creating an account, adding 5+ recipes with full details, editing one, deleting one, and searching/filtering the collection. Delivers immediate personal value as a digital recipe box.

**Acceptance Scenarios**:

1. **Given** a logged-in user with no recipes, **When** they create a new recipe with title, ingredients, and instructions, **Then** the recipe appears in their collection and is marked as public by default.
2. **Given** a user owns a recipe, **When** they edit the title, ingredients, or instructions, **Then** the changes are saved and reflected immediately.
3. **Given** a user owns a recipe, **When** they delete it, **Then** it is removed from their collection and no longer accessible.
4. **Given** a user does NOT own a recipe, **When** they attempt to edit or delete it, **Then** the system prevents the action and displays an appropriate message.
5. **Given** a user with 20+ recipes, **When** they search by keyword or filter by tag/category, **Then** matching recipes are returned within 2 seconds.
6. **Given** a user is entering ingredients, **When** they type an ingredient name, **Then** the system suggests matches from the real food database with associated nutritional data.

---

### User Story 2 - Share, Copy, and Clone Recipes (Priority: P1)

A user wants to share a recipe they own with the community. They can make a recipe public so any authenticated user can view it. Other users can copy or clone a public recipe into their own collection. A cloned recipe becomes a private copy that the new user owns and can edit freely, independent of the original. Per-user sharing (sharing with specific named users) is out of scope for v1 and deferred to a future spec.

**Why this priority**: Sharing and cloning are essential social features that drive user engagement and content growth. They also establish the public/private recipe model that underpins imported recipe attribution.

**Independent Test**: Can be tested by User A sharing a recipe publicly, User B finding and cloning it, then User B editing their clone without affecting User A's original.

**Acceptance Scenarios**:

1. **Given** a user owns a private recipe (premium), **When** they set it to public, **Then** it becomes discoverable and viewable by all users.
2. **Given** a public recipe (user-created, not imported), **When** any user copies/clones it, **Then** a new recipe is created in their collection that they fully own. Visibility follows default rules (public for free users, configurable for premium).
3. **Given** a cloned recipe, **When** the new owner edits it, **Then** the original recipe remains unchanged.
4. **Given** a user does NOT own a recipe, **When** they attempt to share or modify sharing settings, **Then** the system prevents the action.
5. **Given** a public recipe with attribution (imported from public source), **When** a user clones it, **Then** the clone retains source attribution, remains public, and can only be made private by a premium user after making a substantive edit.

---

### Edge Cases

- How does the system handle recipes with ingredients not found in the real food database? _(Resolved: see C-006 — freeform ingredients with user-entered nutrition data)_
- How does the system handle concurrent edits if a user edits the same recipe from two devices? _(Resolved: see C-005 — full version history with conflict detection)_
- How does the system handle recipe deletion and GDPR erasure? _(Resolved: see C-007 — soft delete tombstone is the default; hard purge requires explicit user-initiated "Erase my data" action.)_
- How does the system handle photo upload failures (network drop, S3 unavailable, oversized/malformed files)? _(Resolved: see FR-001a — recipe metadata persists atomically; photo uploads are independent, validated client+server side, and individually retryable.)_
- How does the system handle S3 version-archive failures during a recipe save? _(Resolved: see FR-007b-i — user save succeeds; failed archive payloads are persisted locally in the DB as pending-archive records and replayed via async retry/DLQ until S3 confirms.)_

## Requirements _(mandatory)_

### Functional Requirements

**Recipe Management (Core)**

- **FR-001**: System MUST allow authenticated users to create recipes with title, description, ingredients (linked to real food data), step-by-step instructions, prep time, cook time, total time, servings, tags/categories, and photos (maximum 10 per recipe, 5MB per image).
- **FR-001a**: System MUST persist a recipe atomically and independently of its photo uploads. Recipe metadata (title, ingredients, instructions, etc.) MUST save successfully even if one or more photo uploads fail. Each photo upload MUST be validated client-side (size ≤ 5MB; MIME type in allowlist `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`) before transmission and re-validated server-side on receipt by inspecting the file's magic bytes (not the client-supplied Content-Type); rejected files MUST surface a per-file error to the user. Failed uploads MUST be retryable per file without re-saving the recipe. Photos that fail validation or upload MUST NOT be persisted as broken references on the recipe.
- **FR-002**: System MUST restrict editing and deleting of recipes to the recipe owner only. Deletion MUST be a soft delete (tombstoned): the recipe is hidden from all listings, search, collections, and clones immediately and is no longer accessible via normal APIs, but DB rows and S3 version archives are retained indefinitely by default. Hard purge of a tombstoned recipe (DB rows + all S3 version archives) MUST occur only via an explicit user-initiated "Erase my data" action (GDPR right-to-erasure), which is irreversible.
- **FR-003**: System MUST default new user-created recipes to public visibility. Premium users MAY set their own original recipes to private. Free-tier users' recipes are always public.
- **FR-004**: System MUST allow any authenticated user to view public recipes.
- **FR-005**: System MUST allow any authenticated user to copy/clone a public recipe into their own collection. A clone of a public-source imported recipe (website/Instagram) remains public and retains source attribution; the clone can only be made private by a premium user AND only after making a substantive edit (defined as any modification to ingredients or instructions — changes to title, description, tags, or photos alone do not qualify). Cloning alone is not sufficient to change visibility.
- **FR-006**: System MUST provide search and filtering of recipes by keyword, tags, cuisine, dietary category, ingredient, and prep/cook time.
- **FR-007**: System MUST back ingredient data with a real food/nutrition database that provides caloric and macronutrient information per ingredient.
- **FR-007a**: System MUST allow users to add freeform ingredients not found in the food database. Users MAY manually enter nutrition values (calories, protein, carbs, fat) for freeform ingredients. Such ingredients MUST be flagged as "user-entered" to distinguish them from database-backed items. Recipes containing user-entered ingredients MUST indicate partial/user-supplied nutrition data.
- **FR-007b**: System MUST maintain a version history for every recipe. Each save creates a new version. The last 10 versions MUST be stored in the database and available for users to view and restore. All versions MUST be archived to S3 indefinitely for compliance and recovery purposes.
- **FR-007b-i**: A user-facing recipe save MUST succeed independently of the S3 version-archive write. The S3 archive MUST be performed asynchronously with retry and a dead-letter queue (DLQ); archive failures MUST raise an operational alert but MUST NOT block or fail the user's save. When an S3 archive attempt fails, the full version payload MUST be persisted locally (in the database) as a pending-archive record so that retries — automatic or operator-initiated — can replay the exact failed payload until the S3 write succeeds. Pending-archive records MUST only be deleted after a successful S3 confirmation. The pending-archive backlog (count of `recipe_version_pending_archives` rows) MUST stay below 100 under normal operating conditions; a CloudWatch alarm MUST fire when the backlog exceeds 100 rows for more than 15 minutes, and again when the oldest pending row is older than 1 hour.
- **FR-007c**: System MUST detect concurrent edit conflicts (e.g., same recipe edited on two devices) via optimistic concurrency on a monotonically increasing `version` field. When the client submits a save with a stale `version`, the server MUST reject the write with HTTP 409 and a payload containing both the server's current version and the client's attempted version. The client MUST then present a side-by-side view of both versions and let the user (a) keep the server version, (b) overwrite with the local version, or (c) merge field-by-field; the user's chosen result is then re-submitted as a fresh write with the latest server `version`. The system MUST NOT silently drop, auto-merge, or last-write-wins concurrent edits.

**Recipe Collections**

- **FR-008**: System MUST allow authenticated users to create, rename, and delete recipe collections.
- **FR-009**: System MUST allow users to add or remove recipes from their own collections. A recipe MAY belong to multiple collections.
- **FR-010**: System MUST allow users to set collection visibility (public/private, subject to subscription tier rules). Public collections are viewable by any authenticated user.
- **FR-011**: System MUST allow any authenticated user to clone a public collection into their own account. Cloning a collection excludes any private recipes the cloner cannot access. The clone is a snapshot at clone time and is fully owned by the cloner; future changes to the source collection MUST NOT propagate automatically. The system MUST retain a reference to the source collection on the clone and MUST expose a user-initiated "Pull updates from source" action that, when invoked, reconciles the clone with the source's current state (adding new public recipes, removing recipes the cloner can no longer access). The pull action MUST be opt-in per invocation and MUST NOT overwrite recipes the cloner has added directly to the cloned collection.
- **FR-012**: System MUST NOT cascade-delete recipes when a collection is deleted, or cascade-delete collections when a recipe is deleted.

**Platform**

- **FR-044**: System MUST be available as both a mobile application and a web application with feature parity.
- **FR-045**: System MUST require user authentication for all features. There is no unauthenticated/anonymous access.

### Non-Functional Requirements _(constitution-derived)_

- **NFR-001**: All TypeScript MUST compile with `strict: true`; no `any` used outside explicitly marked test doubles. (Constitution Principle I)
- **NFR-002**: All exported functions and interfaces MUST carry JSDoc documentation. (Principle II)
- **NFR-003**: Any UI component MUST expose an accessible name queryable via `getByRole`/`getByLabel` in Playwright tests. (Principles IV & VII)
- **NFR-004**: Color MUST NOT be the sole conveyor of state; icon or text label pairing required. (Principle VII)

### Non-Functional Requirements _(testing & CI)_

- **NFR-005**: Development MUST follow TDD (red-green-refactor). Test files MUST be written before or co-committed with the implementation they cover. No implementation task is complete without its corresponding test.
- **NFR-006**: Browser E2E tests MUST use Playwright (`*.spec.ts`). Mobile E2E tests MUST use Maestro (`*.yaml` flow files). Platform selection is determined by target: web → Playwright, mobile (iOS/Android) → Maestro.
- **NFR-007**: All backend service tests (unit + integration) MUST run against LocalStack for AWS service emulation (S3, SQS). LocalStack MUST be available as a Docker Compose service for local development and as a GitHub Actions service container in CI.
- **NFR-008**: CI pipeline (GitHub Actions) MUST run `typecheck`, `lint`, `format:check`, `test` (unit + integration), and `test:e2e` (Playwright + Maestro) for every PR. All checks MUST pass before merge. (Constitution Principle VI)
- **NFR-009**: Frontend applications MUST support configurable API base URLs via environment variables. Default: local development server (`http://localhost:4000`). Configurable to remote endpoints for staging/production. Web: `NEXT_PUBLIC_API_URL`. Mobile: `EXPO_PUBLIC_API_URL`. Local port assignments MUST avoid collisions: API `:4000`, Next.js web `:3000`, Expo Metro `:8081`, Postgres `:5432`, LocalStack `:4566` (see plan.md NFR-009 section for the canonical port table).
- **NFR-010**: E2E tests MUST run against a database seeded with deterministic test data. Seed scripts MUST be idempotent and produce stable IDs for fixture-based assertions.
- **NFR-011**: Unit and component tests MUST use mocks and fixture factories (`make*` pattern per constitution Principle IV) — never live services or databases.

### Key Entities

- **User**: Represents a registered account holder. Has a subscription tier (free or premium), owns recipes, meal plans, nutrition plans, and grocery lists. Can configure AI provider credentials and manage external agent authorizations. _(Auth details: see [002-auth0-user-auth](../002-auth0-user-auth/spec.md))_
- **Recipe**: The core data object. Has a title, description, ingredients, instructions (ordered steps), prep/cook/total time, servings, tags, photos, visibility (public/private), owner, and optional source attribution. Backed by real food data for nutritional information.
- **Collection**: A user-owned grouping of recipes. Has a name, visibility (public/private), an ordered list of recipe memberships, and an optional `sourceCollectionId` reference set when the collection was cloned from another user's public collection. A recipe can belong to multiple collections. Deletion of a collection does not cascade to its recipes, and vice versa.
- **Ingredient**: A reference to a real food item with nutritional data (calories, protein, carbs, fat per unit). Linked to recipes with a specific quantity and unit. May be database-backed (from [003-usda-food-data](../003-usda-food-data/spec.md)) or user-entered (freeform name with optional manually-supplied nutrition values, flagged as "user-entered").

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create a complete recipe (with ingredients, instructions, and photo) in under 5 minutes.
- **SC-005**: 80% of free-tier users engage with at least 3 core features (recipe creation, search, sharing) within their first week.
- **SC-009**: The system supports 10,000 concurrent users with p95 API response time ≤ 500ms.

## Assumptions

- Users have internet connectivity for core features.
- The real food/nutrition database will be sourced from a publicly available or licensable dataset (e.g., USDA FoodData Central or equivalent).
- The mobile application will target iOS and Android platforms.

## Clarifications

- **C-004 (Visibility Model)**: No unauthenticated/anonymous access — all users must sign up. Visibility rules by recipe origin:
    - **User-created recipes**: Public by default. Premium users can set to private. Free-tier users' recipes are always public.
    - **Imported from public source (website/Instagram)**: Always public with source attribution. Clones of these recipes also remain public with attribution until a premium user makes a substantive edit (modification to ingredients or instructions — title/description/tag/photo changes alone do not qualify), at which point they may set the clone to private.
    - **Imported from physical copy (photo/OCR)**: Private (no public source to attribute).
    - **Recipes from paid sources (cookbooks, subscription sites)**: MUST NEVER be made public. _(Legal review required — see FR-014a in [004-recipe-importing](../004-recipe-importing/spec.md))_
    - **On premium lapse**: Previously private user-created recipes stay private; no new recipes can be set to private until renewal. Paid-source recipes remain private regardless.
- **C-005 (Concurrent Edit Conflict Resolution)**: Every recipe save creates a new version. The last 10 versions are stored in the database for user access; all versions are archived to S3 indefinitely. On concurrent edit conflict (same recipe edited from two devices), the system detects the conflict, warns the user, and presents both versions for the user to choose or manually merge.
- **C-006 (Freeform Ingredients)**: When a user adds an ingredient not found in the food database, they may enter it as freeform text and optionally supply nutrition values manually. Such ingredients are flagged as "user-entered" to distinguish from database-backed data. Recipes with user-entered ingredients display a notice that nutrition data is partially user-supplied.
- **C-007 (Recipe Deletion & GDPR Erasure)**: Recipe deletion (FR-002) is a soft delete (tombstone). Tombstoned recipes are immediately removed from all listings, search, collections, and clone targets, but DB rows and S3 version archives are retained indefinitely. Hard purge (DB + all S3 version archives) is irreversible and only occurs via an explicit user-initiated "Erase my data" action satisfying GDPR right-to-erasure. This overrides FR-007b's indefinite-retention guarantee only for recipes the user explicitly chooses to erase. The `POST /api/account/erasure` endpoint MUST be idempotent: a duplicate request while a job is already `queued` or `running` for the user MUST return HTTP 202 with the existing job's id (not enqueue a second job); a request after a `completed` job MUST return HTTP 410 (account already erased); a request after a `failed` job MUST enqueue a fresh retry and return HTTP 202 with the new job id.

### Session 2026-04-30

- Q: When a user deletes a recipe (FR-002), what is the deletion semantic? → A: Soft delete permanently (tombstoned, never auto-purged); explicit user-initiated "Erase my data" action triggers hard purge for GDPR.
- Q: After a user clones a public collection (FR-011), how do later updates to the source collection affect the clone? → A: Snapshot at clone time with an opt-in user-initiated "Pull updates from source" action; no automatic propagation; pull never overwrites recipes the cloner added directly.
- Q: What is the v1 scope for sharing collections with specific named users? → A: Out of scope for v1; v1 supports public/private only. Per-user collection sharing is deferred to a future spec.
- Q: How should the system handle photo upload failures (network drop, S3 unavailable, oversized/malformed files)? → A: Atomic recipe save; photo uploads are independent, validated client-side AND server-side for size/format, with per-file errors and individual retry; failed photos are never persisted as broken references.
- Q: If the S3 version-archive write fails during a recipe save, what is the required behavior? → A: User save succeeds; S3 archive is async with retry + DLQ and ops alerting on failure; failed-archive payloads are persisted locally in the DB as pending-archive records so retries can replay the exact payload until S3 confirms.

### Session 2026-04-18

- Q: How should the system handle ingredients not found in the food database? → A: Allow freeform ingredients with user-manually-entered nutrition values; flag as "user-entered" to distinguish from database-backed data.
- Q: What constitutes a "substantive edit" for visibility unlock on cloned imported recipes? → A: Any modification to ingredients or instructions. Title, description, tags, and photo changes alone do not qualify.
- Q: What is the concrete latency target for SC-009? → A: p95 API response time ≤ 500ms under 10,000 concurrent users.
- Q: What are the photo storage constraints per recipe? → A: Max 10 photos per recipe, 5MB per image.
- Q: What is the version history retention policy? → A: Last 10 versions in the database (queryable/restorable); all versions archived to S3 indefinitely.
- Q: What is the scope of recipe organization/collections and friends features? → A: **Collections are in scope for this spec** with public/private visibility only. Recipes can belong to multiple collections; deleting a recipe/collection doesn't cascade; cloning a public collection excludes private recipes the cloner can't access. Per-user sharing of collections (sharing with specific named users) and the friends system (QR codes, friend codes, friend requests, cross-platform) are both deferred to a separate spec.
