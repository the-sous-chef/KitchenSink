# Codebase Analysis: Recipe Importing (Feature 004)

**Branch**: `004-recipe-importing` | **Date**: 2026-05-09
**Status**: Complete | **Sources**: root `AGENTS.md`, root `package.json`, [plan.md](../plan.md), [tasks.md](../tasks.md)

---

## Monorepo Layout Relevance

KitchenSink uses npm workspaces + Turborepo with active app workspaces:

- `packages/apps/sous-chef/web`
- `packages/apps/sous-chef/mobile`
- `packages/ui`
- `packages/tools/*`

Feature 004 introduces import-specific backend and UI work that must attach to the existing architecture from feature 001.

---

## Expected Implementation Surfaces for 004

### Backend/API Surface

`plan.md` and `tasks.md` define controller/service implementation around endpoints:

- `POST /v1/recipes/import/url`
- `POST /v1/recipes/import/file`
- `POST /v1/recipes/import/instagram`
- `POST /v1/recipes/{id}/clone`

Expected module zones:

- Import controllers + DTOs
- Extractor chain (`SchemaOrg`, `Microdata`, `RDFa`, `Heuristic`)
- Dedupe/paywall utilities
- Optional OCR service boundary

### Frontend Surface (Web/Mobile)

Tasks define dedicated import flow UI:

- Web import tabs + preview + attribution components
- Mobile parity flow with camera/upload/paste entry
- Conflict and error-state components must satisfy accessibility NFRs

---

## Data and Schema Touchpoints

004 plan introduces import metadata fields and unique source URL handling. Existing 001 schema already has overlapping source-related fields per research baseline, so implementation must reconcile migration strategy with current schema reality instead of blindly adding duplicate columns.

Artifacts intentionally do not modify schema docs; this is flagged for implementation review.

---

## Test and Tooling Integration

Root scripts available:

- `npm run build`
- `npm run test`
- `npm run lint`
- `npm run typecheck`

004 tasks include unit/integration/E2E coverage. This aligns with existing turbo pipelines and constitution-derived NFR testability requirements.

---

## Integration Risks

1. **Schema drift risk**: 004 migration plan may overlap with existing 001 columns.
2. **Parser fixture coverage risk**: extractor chain reliability depends on broad HTML fixture corpus.
3. **Cross-platform parity risk**: web/mobile import UX divergence can break `FR-044` parity expectations inherited from 001 conventions.
4. **Legal-policy wiring risk**: unclear operational rule for `FR-014a` can stall implementation acceptance criteria.

---

## Recommendations for Implementation Readiness

1. Run a schema-diff checkpoint before implementing T-001 to avoid duplicate migration columns.
2. Create shared parser fixtures used by both unit and integration tests.
3. Define a shared error-code enum for import failures to keep web/mobile behavior aligned.
4. Add explicit policy stub points for `FR-014a` so legal decisions can be injected without refactoring controller contracts.
