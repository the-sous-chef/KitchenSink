# Tasks: Feature 004 — Recipe Importing

**Feature**: `004-recipe-importing`
**Updated**: 2026-06-02
**Source**: `spec.md`, `plan.md`, `product-spec/product-spec.md`

---

## User Story Reference

| ID     | Title                                              | Priority    | FRs                        |
| ------ | -------------------------------------------------- | ----------- | -------------------------- |
| US-401 | Import Recipe from Public URL                      | Must Have   | FR-008, SC-002             |
| US-402 | Import from Instagram Caption                        | Must Have   | FR-009                     |
| US-403 | Prominent Attribution for Imported Public Recipes  | Must Have   | FR-010                     |
| US-404 | Visibility Rules for Imported Public Recipes       | Must Have   | FR-011                     |
| US-405 | Physical Copy Import Path (Phased)                 | Must Have   | FR-012, FR-013             |
| US-406 | Reject Paywalled Source Imports                     | Must Have   | FR-014                     |
| US-407 | Duplicate Source URL Conflict Handling              | Should Have | FR-008, FR-011             |
| US-408 | Parse-and-Confirm Editing Before Save               | Should Have | FR-008, FR-009, FR-010     |
| US-409 | Actionable Error Recovery                           | Should Have | FR-008, FR-009, FR-014     |
| US-410 | Paid-Source Manual Paste Policy Guardrail           | Could Have  | FR-014a (legal review req) |

---

## Dependency Graph

```
T-001 (DB migration)
  └─► T-002 (Recipe entity extension)
        ├─► T-003 (URL import endpoint)
        │     ├─► T-004 (Schema.org extractor)
        │     │     └─► T-005 (Fallback extractors)
        │     ├─► T-006 (Deduplication logic)
        │     └─► T-007 (Paywall detection)
        │           └─► T-016 (GET /v1/recipes/import/sources)
        ├─► T-008 (File import endpoint)
        └─► T-010 (Clone endpoint)
T-003, T-004
  └─► T-009 (Instagram import endpoint)
T-003, T-004
  └─► T-011 (Attribution display — web)
T-003, T-008, T-009, T-010
  └─► T-012 (Import UI — web)
T-012
  └─► T-013 (Import UI — mobile)
T-003..T-013
  └─► T-014 (Integration tests)
T-002, T-013
  └─► T-015 (OCR import — P3)
```

---

## User Story 1 — Import Recipes from External Sources (P1)

> A user can import a recipe from a public website URL, Instagram post, or physical copy. Web/Instagram imports are public with attribution; physical copy imports are private.

- [ ] **T-001** [P1] [US-401] DB Migration: Add import columns to `recipes` table — `packages/shared/db/src/migrations/004_recipe_importing.sql`, `packages/shared/db/src/schema/recipes.ts`
- [ ] **T-002** [P1] [US-401] Recipe Entity Extension: `ImportedRecipe` interface + Drizzle mapping — `packages/shared/recipe-core/src/import.types.ts`, `packages/shared/db/src/schema/recipes.ts`
- [ ] **T-003** [P1] [US-401] API Endpoint: `POST /v1/recipes/import/url` — `packages/api/recipe/src/recipes/import/import.controller.ts`, `packages/api/recipe/src/recipes/import/import.service.ts`, `packages/api/recipe/src/recipes/import/dto/import-url.dto.ts`
- [ ] **T-004** [P1] [US-401] Schema.org Extractor: JSON-LD Recipe extraction — `packages/api/recipe/src/recipes/import/extractors/schema-org.extractor.ts`, `packages/api/recipe/tests/unit/extractors/schema-org.extractor.spec.ts`
- [ ] **T-005** [P1] [US-401] Fallback Extractors: Microdata → RDFa → Heuristic HTML — `packages/api/recipe/src/recipes/import/extractors/microdata.extractor.ts`, `packages/api/recipe/src/recipes/import/extractors/rdfa.extractor.ts`, `packages/api/recipe/src/recipes/import/extractors/heuristic.extractor.ts`, `packages/api/recipe/src/recipes/import/extractors/extractor.interface.ts`
- [ ] **T-006** [P1] [US-407] Deduplication Logic: Source URL uniqueness enforcement — `packages/api/recipe/src/recipes/import/import.service.ts`
- [ ] **T-007** [P1] [US-406] Paywall Detection: Blocklist enforcement — `packages/api/recipe/src/recipes/import/paywall.config.ts`, `packages/api/recipe/src/recipes/import/import.service.ts`
- [ ] **T-008** [P1] [US-401] API Endpoint: `POST /v1/recipes/import/file` — `packages/api/recipe/src/recipes/import/import.controller.ts`, `packages/api/recipe/src/recipes/import/parsers/json.parser.ts`, `packages/api/recipe/src/recipes/import/parsers/yaml.parser.ts`, `packages/api/recipe/src/recipes/import/parsers/markdown.parser.ts`
- [ ] **T-009** [P2] [US-402] API Endpoint: `POST /v1/recipes/import/instagram` — `packages/api/recipe/src/recipes/import/instagram.service.ts`, `packages/api/recipe/src/recipes/import/dto/import-instagram.dto.ts`
- [ ] **T-010** [P1] [US-404] API Endpoint: `POST /v1/recipes/{id}/clone` — `packages/api/recipe/src/recipes/clone/clone.controller.ts`, `packages/api/recipe/src/recipes/clone/clone.service.ts`
- [ ] **T-011** [P1] [US-403] Attribution Display: Web UI component — `packages/apps/sous-chef/web/src/components/RecipeAttribution/RecipeAttribution.tsx`, `packages/apps/sous-chef/web/src/components/RecipeAttribution/RecipeAttribution.test.tsx`
- [ ] **T-012** [P1] [US-401, US-402, US-408, US-409] Import UI: Web import flow — `packages/apps/sous-chef/web/src/features/import/ImportModal.tsx`, `packages/apps/sous-chef/web/src/features/import/ImportModal.test.tsx`, `packages/apps/sous-chef/web/tests/e2e/import-url.spec.ts`
- [ ] **T-013** [P2] [US-401, US-402] Import UI: Mobile import flow (React Native / Expo) — `packages/apps/sous-chef/mobile/src/screens/ImportScreen.tsx`, `packages/apps/sous-chef/mobile/src/screens/ImportScreen.test.tsx`
- [ ] **T-014** [P1] [(all FRs)] Integration Tests: Import pipeline end-to-end — `packages/api/recipe/tests/integration/import/`, `packages/apps/sous-chef/web/tests/e2e/import-url.spec.ts`

---

### T-001 · DB Migration: Add import columns to `recipes` table

**Priority**: P1 | **Effort**: S | **Depends on**: none | **Implements**: FR-008, FR-010, FR-011, FR-012, FR-013

**What**: Run the migration defined in plan.md §7 to extend the `recipes` table with import-related columns.

**Acceptance**:

- [ ] `import_source TEXT` column added
- [ ] `source_url TEXT` column added
- [ ] `source_platform TEXT` column added
- [ ] `attribution_html TEXT` column added
- [ ] `is_attribution_locked BOOLEAN DEFAULT false` column added
- [ ] `cloned_from_id UUID REFERENCES recipes(id)` column added
- [ ] Partial unique index on `source_url WHERE source_url IS NOT NULL` created
- [ ] Index on `import_source` created
- [ ] Migration is idempotent (safe to re-run)
- [ ] Drizzle schema updated to reflect new columns

**Files**: `packages/shared/db/src/migrations/004_recipe_importing.sql`, `packages/shared/db/src/schema/recipes.ts`

---

### T-002 · Recipe Entity Extension: `ImportedRecipe` interface + Drizzle mapping

**Priority**: P1 | **Effort**: S | **Depends on**: T-001 | **Implements**: FR-008, FR-010, FR-011

**What**: Extend the 001 `Recipe` entity with the new import fields defined in plan.md §2.

**Acceptance**:

- [ ] `ImportedRecipe` interface exported from `packages/shared/recipe-core/src/import.types.ts` (extends `Recipe` from `@kitchensink/shared-recipe-core`)
- [ ] Fields: `importSource`, `sourceUrl`, `sourcePlatform`, `attributionHtml`, `clonedFromId`, `isAttributionLocked`
- [ ] Drizzle select/insert types updated in `packages/shared/db/src/schema/recipes.ts`
- [ ] `importSource` typed as `'url' | 'instagram' | 'file' | 'ocr'`
- [ ] All fields carry JSDoc (NFR-002)
- [ ] TypeScript strict mode passes (NFR-001)

**Files**: `packages/shared/recipe-core/src/import.types.ts`, `packages/shared/db/src/schema/recipes.ts`

---

### T-003 · API Endpoint: `POST /v1/recipes/import/url`

**Priority**: P1 | **Effort**: M | **Depends on**: T-002 | **Implements**: FR-008, US-401

**What**: NestJS controller + service for URL-based recipe import. Accepts a URL, fetches HTML, delegates to extractor chain, persists recipe.

**Acceptance**:

- [ ] Endpoint exists at `POST /v1/recipes/import/url`
- [ ] Auth guard applied (002 JWT authorizer)
- [ ] Request DTO: `{ url: string }` validated with `class-validator` (`IsUrl`)
- [ ] Returns `202 Accepted` with `{ importId, status: 'processing', estimatedSeconds }` for async path
- [ ] Returns `200 OK` with `{ recipeId, status: 'imported', sourceAttribution }` for sync path
- [ ] Returns `400` with `{ error, reason: 'paywalled_source', message }` for blocked domains
- [ ] HTTP fetch uses `User-Agent: SousChef/1.0 (+https://souschef.io/bot)`
- [ ] Timeout: 10s; max 5 redirects
- [ ] Rate limit: 30 requests/minute per user
- [ ] Circuit breaker: open after 10 consecutive failures, half-open after 60s
- [ ] JSDoc on all exported functions (NFR-002)

**Files**: `packages/api/recipe/src/recipes/import/import.controller.ts`, `packages/api/recipe/src/recipes/import/import.service.ts`, `packages/api/recipe/src/recipes/import/dto/import-url.dto.ts`

---

### T-004 · Schema.org Extractor: JSON-LD Recipe extraction

**Priority**: P1 | **Effort**: M | **Depends on**: T-003 | **Implements**: FR-008, SC-002, US-401

**What**: Primary extractor that parses `application/ld+json` Schema.org `Recipe` objects from fetched HTML.

**Acceptance**:

- [ ] `SchemaOrgExtractor` class implements `IRecipeExtractor` interface
- [ ] Extracts all fields from plan.md §4: `name`, `description`, `image`, `author`, `publishDate`, `prepTime`, `cookTime`, `totalTime`, `servings`, `ingredients`, `instructions`
- [ ] ISO 8601 duration strings preserved for `prepTime`/`cookTime`/`totalTime`
- [ ] `HowToStep` and `HowToSection` instruction types handled
- [ ] Returns `null` (not throws) when no Schema.org Recipe found
- [ ] Unit tests cover: valid JSON-LD, malformed JSON-LD, missing Recipe type, multiple `@graph` entries
- [ ] ≥85% extraction accuracy on test fixture set (SC-002)

**Files**: `packages/api/recipe/src/recipes/import/extractors/schema-org.extractor.ts`, `packages/api/recipe/tests/unit/extractors/schema-org.extractor.spec.ts`

---

### T-005 · Fallback Extractors: Microdata → RDFa → Heuristic HTML

**Priority**: P1 | **Effort**: L | **Depends on**: T-004 | **Implements**: FR-008, SC-002, US-401

**What**: Three fallback extractors invoked in order when Schema.org JSON-LD extraction fails.

**Acceptance**:

- [ ] `MicrodataExtractor` parses HTML microdata `itemtype="http://schema.org/Recipe"`
- [ ] `RDFaExtractor` parses RDFa `typeof="schema:Recipe"` attributes
- [ ] `HeuristicHTMLExtractor` uses structural heuristics (heading + list patterns) to extract title, ingredients, instructions
- [ ] All three implement `IRecipeExtractor` interface
- [ ] Extractor chain in `import.service.ts` tries each in order, stops at first non-null result
- [ ] Unit tests for each extractor with fixture HTML files
- [ ] Graceful degradation: partial extraction preferred over total failure

**Files**: `packages/api/recipe/src/recipes/import/extractors/microdata.extractor.ts`, `packages/api/recipe/src/recipes/import/extractors/rdfa.extractor.ts`, `packages/api/recipe/src/recipes/import/extractors/heuristic.extractor.ts`, `packages/api/recipe/src/recipes/import/extractors/extractor.interface.ts`

---

### T-006 · Deduplication Logic: Source URL uniqueness enforcement

**Priority**: P1 | **Effort**: S | **Depends on**: T-003 | **Implements**: FR-008, US-407

**What**: Before persisting an imported recipe, check if a recipe with the same `source_url` already exists. Return the existing recipe rather than creating a duplicate.

**Acceptance**:

- [ ] `ImportService.findBySourceUrl(url: string)` method implemented
- [ ] On duplicate: returns `{ recipeId, status: 'already_imported' }` with `200 OK`
- [ ] DB unique constraint (from T-001) acts as safety net; constraint violation caught and handled gracefully
- [ ] URL normalization: strip trailing slash, lowercase scheme+host, remove fragments
- [ ] Unit tests: new URL, duplicate URL, URL with trailing slash normalization

**Files**: `packages/api/recipe/src/recipes/import/import.service.ts`

---

### T-007 · Paywall Detection: Blocklist enforcement

**Priority**: P1 | **Effort**: S | **Depends on**: T-003 | **Implements**: FR-014, US-406

**What**: Before fetching a URL, check the domain against the `PAYWALLED_DOMAINS` blocklist. Also check `X-Robots-Tag` response header post-fetch.

**Acceptance**:

- [ ] `PAYWALLED_DOMAINS` list defined in `packages/api/recipe/src/recipes/import/paywall.config.ts` (includes `cooking.nytimes.com`, `epicurious.com` per plan.md)
- [ ] Domain extracted and normalized (lowercase, strip `www.`) before blocklist check
- [ ] Pre-fetch blocklist check returns `400` immediately without making HTTP request
- [ ] Post-fetch `X-Robots-Tag: noindex` / `noarchive` triggers paywall warning
- [ ] Error response shape matches plan.md §3: `{ error, reason: 'paywalled_source', message }`
- [ ] Config is externally overridable (env var or config file) for easy expansion
- [ ] Unit tests: blocked domain, allowed domain, header-based detection

**Files**: `packages/api/recipe/src/recipes/import/paywall.config.ts`, `packages/api/recipe/src/recipes/import/import.service.ts`

---

### T-008 · API Endpoint: `POST /v1/recipes/import/file`

**Priority**: P1 | **Effort**: M | **Depends on**: T-002 | **Implements**: FR-008, US-401

**What**: Import recipes from uploaded files: JSON, YAML, or Markdown with YAML frontmatter.

**Acceptance**:

- [ ] Endpoint exists at `POST /v1/recipes/import/file`
- [ ] Auth guard applied
- [ ] Accepts `multipart/form-data` with file field `recipeFile`
- [ ] JSON parser validates against recipe JSON schema
- [ ] YAML parser handles `recipe.yaml` structure
- [ ] Markdown parser extracts YAML frontmatter + markdown body
- [ ] Created recipe has `importSource: 'file'`, `isAttributionLocked: false`, visibility: private
- [ ] Returns `200 OK` with `{ recipeId, status: 'imported' }`
- [ ] Returns `400` for unsupported format or schema validation failure with field-level errors
- [ ] Max file size: 1MB
- [ ] Unit tests: valid JSON, valid YAML, valid Markdown, invalid schema, oversized file

**Files**: `packages/api/recipe/src/recipes/import/import.controller.ts`, `packages/api/recipe/src/recipes/import/parsers/json.parser.ts`, `packages/api/recipe/src/recipes/import/parsers/yaml.parser.ts`, `packages/api/recipe/src/recipes/import/parsers/markdown.parser.ts`

---

### T-009 · API Endpoint: `POST /v1/recipes/import/instagram`

**Priority**: P2 | **Effort**: M | **Depends on**: T-003, T-004 | **Implements**: FR-009, US-402

**What**: Import a recipe from an Instagram post URL using the public oEmbed API to fetch caption text, then run through the URL import extraction pipeline.

**Acceptance**:

- [ ] Endpoint exists at `POST /v1/recipes/import/instagram`
- [ ] Auth guard applied
- [ ] Request DTO: `{ url: string }` — must be `instagram.com` or `instagr.am` domain
- [ ] Calls Instagram oEmbed API (`https://api.instagram.com/oembed?url=...`) to fetch post metadata
- [ ] Extracts recipe from caption text via heuristic extractor (T-005)
- [ ] Sets `importSource: 'instagram'`, `sourceUrl` to Instagram post URL, `sourcePlatform: 'instagram'`
- [ ] Recipe marked public with attribution
- [ ] Graceful degradation if oEmbed returns no caption: returns `422` with `{ reason: 'no_recipe_in_caption' }`
- [ ] Unit tests: valid Instagram URL with recipe caption, URL without recipe content, non-Instagram URL rejected

**Files**: `packages/api/recipe/src/recipes/import/instagram.service.ts`, `packages/api/recipe/src/recipes/import/dto/import-instagram.dto.ts`

---

### T-010 · API Endpoint: `POST /v1/recipes/{id}/clone`

**Priority**: P1 | **Effort**: M | **Depends on**: T-002 | **Implements**: FR-011, US-404

**What**: Clone an imported (or any) recipe to create a user-owned editable copy. The clone retains attribution and remains public until substantively edited by a premium user.

**Acceptance**:

- [ ] Endpoint exists at `POST /v1/recipes/{id}/clone`
- [ ] Auth guard applied
- [ ] Cloned recipe has `clonedFromId` set to source recipe ID
- [ ] `isAttributionLocked: true` on clone (attribution cannot be removed)
- [ ] Clone is public by default (inherits visibility from source for attributed recipes)
- [ ] Returns `201 Created` with `{ recipeId, status: 'cloned' }`
- [ ] Returns `404` if source recipe not found
- [ ] Returns `403` if source recipe is private and user is not owner
- [ ] Unit tests: clone public attributed recipe, clone own private recipe, clone non-existent recipe

**Files**: `packages/api/recipe/src/recipes/clone/clone.controller.ts`, `packages/api/recipe/src/recipes/clone/clone.service.ts`

---

### T-011 · Attribution Display: Web UI component

**Priority**: P1 | **Effort**: S | **Depends on**: T-003, T-004 | **Implements**: FR-010, US-403

**What**: React component that renders the source attribution block on recipe detail pages for imported recipes.

**Acceptance**:

- [ ] `RecipeAttribution` component renders when `recipe.sourceUrl` is set
- [ ] Displays: platform name, original author (if available), link to source URL
- [ ] Link opens in new tab with `rel="noopener noreferrer"`
- [ ] Attribution block is visually distinct (per design system)
- [ ] Accessible: has ARIA label, link text is descriptive (not "click here") (NFR-003)
- [ ] Color is not the sole conveyor of attribution state (NFR-004)
- [ ] Storybook story or equivalent snapshot test

**Files**: `packages/apps/sous-chef/web/src/components/RecipeAttribution/RecipeAttribution.tsx`, `packages/apps/sous-chef/web/src/components/RecipeAttribution/RecipeAttribution.test.tsx`

---

### T-012 · Import UI: Web import flow

**Priority**: P1 | **Effort**: M | **Depends on**: T-003, T-008, T-009, T-010 | **Implements**: FR-008, FR-009, FR-010, FR-014, US-401, US-402, US-408, US-409

**What**: Web UI for the recipe import flow — URL input, file upload, Instagram URL, and clone action.

**Acceptance**:

- [ ] Import modal/page with tabs: "From URL", "From File", "From Instagram"
- [ ] URL tab: text input + submit; shows loading state during import; shows success/error
- [ ] File tab: file picker (JSON/YAML/MD); validates format client-side before upload
- [ ] Instagram tab: URL input; shows extracted recipe preview before saving
- [ ] "Clone" button on recipe detail page for imported recipes
- [ ] All interactive elements accessible via keyboard (NFR-003)
- [ ] Error states displayed with icon + text (not color alone) (NFR-004)
- [ ] Paywalled source error shown with clear explanation message
- [ ] Playwright E2E test: import from URL happy path

**Files**: `packages/apps/sous-chef/web/src/features/import/ImportModal.tsx`, `packages/apps/sous-chef/web/src/features/import/ImportModal.test.tsx`, `packages/apps/sous-chef/web/tests/e2e/import-url.spec.ts`

---

### T-013 · Import UI: Mobile import flow (React Native / Expo)

**Priority**: P2 | **Effort**: M | **Depends on**: T-012 | **Implements**: FR-008, FR-009, US-401, US-402

**What**: Mobile equivalent of the web import flow using React Native / Expo 53.

**Acceptance**:

- [ ] Import screen with URL input and file picker
- [ ] Camera capture option for physical copy (OCR path — wired to T-015 when available, shows "coming soon" otherwise)
- [ ] Instagram URL import supported
- [ ] Accessible labels on all inputs (NFR-003)
- [ ] Uses `expo-secure-store` for any cached import state
- [ ] Matches web import flow behavior for success/error states

**Files**: `packages/apps/sous-chef/mobile/src/screens/ImportScreen.tsx`, `packages/apps/sous-chef/mobile/src/screens/ImportScreen.test.tsx`

---

### T-014 · Integration Tests: Import pipeline end-to-end

**Priority**: P1 | **Effort**: M | **Depends on**: T-003–T-013 | **Implements**: (tests all FRs)

**What**: Integration and E2E tests covering the full import pipeline against a test database.

**Acceptance**:

- [ ] URL import: happy path with Schema.org fixture HTML
- [ ] URL import: fallback extractor chain (microdata, RDFa, heuristic fixtures)
- [ ] URL import: duplicate URL returns existing recipe
- [ ] URL import: paywalled domain returns 400
- [ ] File import: JSON, YAML, Markdown happy paths
- [ ] Instagram import: caption with recipe extracted
- [ ] Clone: public attributed recipe cloned with attribution preserved
- [ ] All tests pass with `npm test`
- [ ] `npm run lint` passes with no errors

**Files**: `packages/api/recipe/tests/integration/import/`, `packages/apps/sous-chef/web/tests/e2e/import-url.spec.ts`

---

## User Story 2 — Physical Copy Import via OCR (P3)

> A user can photograph a physical recipe (cookbook, handwritten card) and the system extracts the text and creates a private recipe.

- [ ] **T-015** [P3] [US-405] OCR Import: Physical copy scanning — `packages/api/recipe/src/recipes/import/ocr/ocr.controller.ts`, `packages/api/recipe/src/recipes/import/ocr/ocr.service.ts`, `packages/api/recipe/src/recipes/import/ocr/providers/textract.provider.ts`, `packages/api/recipe/src/recipes/import/ocr/ocr.interface.ts`

---

### T-015 · OCR Import: Physical copy scanning (P3)

**Priority**: P3 | **Effort**: L | **Depends on**: T-002, T-013 | **Implements**: FR-012, FR-013, US-405

**What**: Implement photo-to-recipe import using OCR. Decision on OCR provider (AWS Textract vs Tesseract vs Google Cloud Vision) is an open question (plan.md §8) — implement with a provider abstraction.

**Acceptance**:

- [ ] `POST /v1/recipes/import/ocr` endpoint accepts image upload (JPEG/PNG, max 10MB)
- [ ] `IOcrProvider` interface defined; initial implementation uses AWS Textract (or chosen provider)
- [ ] Extracted text passed through `HeuristicHTMLExtractor` (T-005) for recipe parsing
- [ ] Created recipe has `importSource: 'ocr'`, visibility: private, `isAttributionLocked: false`
- [ ] Mobile camera capture in T-013 wired to this endpoint
- [ ] Unit tests with fixture images (clear printed recipe, handwritten recipe)
- [ ] OCR provider selection documented in `packages/api/recipe/src/recipes/import/ocr/README.md`

**Files**: `packages/api/recipe/src/recipes/import/ocr/ocr.controller.ts`, `packages/api/recipe/src/recipes/import/ocr/ocr.service.ts`, `packages/api/recipe/src/recipes/import/ocr/providers/textract.provider.ts`, `packages/api/recipe/src/recipes/import/ocr/ocr.interface.ts`

---

## Utility / Infrastructure Tasks

- [ ] **T-016** [P2] [US-406] `GET /v1/recipes/import/sources` endpoint — `packages/api/recipe/src/recipes/import/import.controller.ts`

---

### T-016 · `GET /v1/recipes/import/sources` endpoint

**Priority**: P2 | **Effort**: XS | **Depends on**: T-007 | **Implements**: US-406

**What**: Returns the list of supported import sources and known paywalled domains.

**Acceptance**:

- [ ] Endpoint exists at `GET /v1/recipes/import/sources`
- [ ] Auth guard applied
- [ ] Returns `{ supported: ['url', 'file', 'instagram'], paywalled: [...PAYWALLED_DOMAINS] }`
- [ ] Used by UI to show/hide import options and display paywall warnings proactively

**Files**: `packages/api/recipe/src/recipes/import/import.controller.ts`

---

## Task Summary

| ID    | Title                                          | Priority | Effort | Depends On                 | Implements |
| ----- | ---------------------------------------------- | -------- | ------ | -------------------------- | ---------- |
| T-001 | DB Migration: import columns                     | P1       | S      | —                          | FR-008, FR-010, FR-011, FR-012, FR-013 |
| T-002 | Recipe entity extension                        | P1       | S      | T-001                      | FR-008, FR-010, FR-011 |
| T-003 | POST /v1/recipes/import/url                    | P1       | M      | T-002                      | FR-008, US-401 |
| T-004 | Schema.org extractor                           | P1       | M      | T-003                      | FR-008, SC-002, US-401 |
| T-005 | Fallback extractors (microdata/RDFa/heuristic) | P1       | L      | T-004                      | FR-008, SC-002, US-401 |
| T-006 | Deduplication logic                            | P1       | S      | T-003                      | FR-008, US-407 |
| T-007 | Paywall detection                              | P1       | S      | T-003                      | FR-014, US-406 |
| T-008 | POST /v1/recipes/import/file                   | P1       | M      | T-002                      | FR-008, US-401 |
| T-009 | POST /v1/recipes/import/instagram              | P2       | M      | T-003, T-004               | FR-009, US-402 |
| T-010 | POST /v1/recipes/{id}/clone                    | P1       | M      | T-002                      | FR-011, US-404 |
| T-011 | Attribution display component (web)            | P1       | S      | T-003, T-004               | FR-010, US-403 |
| T-012 | Import UI — web                                | P1       | M      | T-003, T-008, T-009, T-010 | FR-008, FR-009, FR-010, FR-014, US-401, US-402, US-408, US-409 |
| T-013 | Import UI — mobile                             | P2       | M      | T-012                      | FR-008, FR-009, US-401, US-402 |
| T-014 | Integration tests                              | P1       | M      | T-003–T-013                | (tests all FRs) |
| T-015 | OCR import (physical copy)                     | P3       | L      | T-002, T-013               | FR-012, FR-013, US-405 |
| T-016 | GET /v1/recipes/import/sources                 | P2       | XS     | T-007                      | US-406 |
