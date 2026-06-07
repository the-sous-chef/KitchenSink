# Codebase Analysis: Meal Planning

**Branch**: `006-meal-planning` | **Date**: 2026-05-09
**Status**: Complete | **Sources**: [plan.md](../plan.md), [tasks.md](../tasks.md), root `package.json`, [AGENTS.md](../../../AGENTS.md)

---

## Monorepo Layout Fit

KitchenSink root workspace configuration (from `package.json`):

```json
"workspaces": [
  "packages/tools/*",
  "packages/apps/commise/web",
  "packages/apps/commise/mobile",
  "packages/ui"
]
```

Likely impact for feature 006:

- `packages/apps/commise/web`: planner UI, drag-drop, monthly/weekly views
- `packages/apps/commise/mobile`: mobile planner parity (FR-044 inherited dependency context)
- API/backend workspace(s): meal plan endpoints and nutrition aggregation (location depends on existing 001 implementation layout)
- shared models/types: meal plan DTOs and response contracts

---

## Existing Constraints from Feature Artifacts

### API Surface (from `plan.md`)

Required endpoints include:

- CRUD for `/v1/meal-plans`
- Entry mutation endpoints (`/entries`)
- Nutrition summary endpoint
- Suggestion endpoint and grocery handoff endpoint
- Lock/finalize endpoint

### Data Model (from `plan.md` + `tasks.md`)

Core entities:

- `meal_plans`
- `meal_plan_entries`
- `meal_plan_nutrition`

Tasks additionally imply:

- `orphaned` behavior on entries when recipes are deleted
- async nutrition recalculation path

---

## Cross-Feature Dependency Graph

Feature 006 sits in the middle of multiple dependencies:

- **Consumes 001**: recipe IDs and recipe nutrition context
- **Consumes 003**: USDA-backed nutrient values
- **Consumes 005**: AI suggestion and generation calls
- **Feeds 007**: grocery list manifests from plan scope
- **Feeds 009**: meal plan compliance and nutrition-plan linkage
- **Uses 002**: authenticated APIs

This is a high-coupling orchestration feature; contract stability and integration tests are critical.

---

## Implementation Surface by Phase (from `tasks.md`)

1. Schema/migration
2. Backend CRUD
3. Nutrition computation
4. Frontend planner + DnD
5. Grocery handoff
6. AI premium features
7. Lock/finalize
8. Test and quality gates

This decomposition is strong for incremental delivery and dependency isolation.

---

## Tooling and Quality Baseline

From root scripts:

- `npm run build`
- `npm run test`
- `npm run lint` (includes `format:check`)
- `npm run typecheck`

From `spec.md` and `tasks.md`:

- strict TypeScript (NFR-001)
- JSDoc requirement (NFR-002)
- accessibility and non-color-only state requirements (NFR-003/NFR-004)

---

## Risks and Gaps

1. **Template model ambiguity**: `plan.md` lists templates as an open question while research recommends them strongly.
2. **Recurring meals explicitness**: UX/domain expectation exists; no standalone FR.
3. **Family sizing explicitness**: implied by servings; no explicit FR statement.
4. **Monthly planner parity**: requested in this bootstrap set; acceptance scenarios focus primarily on generic date range.

None of these are blockers for artifact synthesis, but they should be raised as WARNINGs in verification.

---

## Source File References

- `specs/006-meal-planning/spec.md`
- `specs/006-meal-planning/plan.md`
- `specs/006-meal-planning/research.md`
- `specs/006-meal-planning/tasks.md`
- `specs/006-meal-planning/v-model/requirements.md`
- `AGENTS.md`
- `package.json`
