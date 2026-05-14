# Tasks: Feature 009 — Nutrition Planning

**Feature**: `009-nutrition-planning`
**Generated**: 2026-05-09
**Source artifacts**: plan.md, spec.md, research.md

---

## Dependency Graph

```
T-001 (DB migration)
  └─► T-002 (Drizzle schema)
        └─► T-003 (Macro calculator service)
              └─► T-004 (Nutrition plan CRUD API)
                    └─► T-005 (Meal plan link API)
                          └─► T-006 (Compliance calculation service)
                                └─► T-007 (Compliance API endpoint)
                                      └─► T-008 (Trainer-client model)
                                            └─► T-009 (Trainer CRUD APIs)
                                                  └─► T-010 (Frontend: plan creation UI)
                                                        └─► T-011 (Frontend: compliance dashboard)
                                                              └─► T-012 (Frontend: trainer-client UI)
                                                                    └─► T-013 (AI recipe swap suggestions — premium)
T-014 (GDPR consent middleware) — parallel, gates T-004 and T-008
T-015 (Unit tests: macro calculator)
T-016 (Integration tests: compliance API)
T-017 (E2E tests: nutrition plan flow)
```

---

## User Story Coverage

| User Story                                                         | Priority | Tasks                                 |
| ------------------------------------------------------------------ | -------- | ------------------------------------- |
| US-1: Nutrition Planning (create plan, link meal plan, compliance) | P3       | T-001–T-007, T-010–T-011, T-014–T-017 |
| US-2: Trainer-Client Model (premium)                               | P3       | T-008, T-009, T-012                   |
| US-3: AI Recipe Swap Suggestions (premium)                         | P3       | T-013                                 |

---

## Tasks

### Phase 1 — Database & Schema

---

#### T-001 · DB Migration: Create nutrition planning tables

**User Story**: US-1 (Nutrition Planning)
**Priority**: P3
**Depends on**: 006-meal-planning migration (meal_plans table must exist)
**Estimated effort**: S

**Description**:
Write and apply the Drizzle migration for the four new tables defined in plan.md §6.

**Acceptance criteria**:

- [ ] `nutrition_plans` table created with all columns from plan.md §2
- [ ] `meal_plan_nutrition_link` join table created
- [ ] `nutrition_compliance` table created
- [ ] `trainer_clients` table created
- [ ] All five indexes created (`idx_nutrition_plans_user_id`, `idx_nutrition_plans_trainer_id`, `idx_nutrition_compliance_plan_date`, `idx_trainer_clients_trainer`, `idx_trainer_clients_client`)
- [ ] Migration is reversible (down migration included)
- [ ] `npm run db:migrate` passes in CI

**Files to create/modify**:

- `src/db/migrations/009_nutrition_planning.ts`

---

#### T-002 · Drizzle ORM schema definitions

**User Story**: US-1 (Nutrition Planning)
**Priority**: P3
**Depends on**: T-001
**Estimated effort**: S

**Description**:
Define Drizzle table schemas and TypeScript types for all four tables.

**Acceptance criteria**:

- [ ] `nutritionPlans` schema exported from `src/db/schema/nutrition-plans.ts`
- [ ] `mealPlanNutritionLink` schema exported
- [ ] `nutritionCompliance` schema exported
- [ ] `trainerClients` schema exported
- [ ] All enums typed: `ActivityLevel`, `Goal`, `ComplianceStatus`
- [ ] Inferred TypeScript types exported (`NutritionPlan`, `NutritionCompliance`, etc.)
- [ ] `strict: true` — no `any`

**Files to create/modify**:

- `src/db/schema/nutrition-plans.ts`
- `src/db/schema/index.ts` (re-export)

---

### Phase 2 — Core Services

---

#### T-003 · Macro calculator service (BMR/TDEE/Macros)

**User Story**: US-1 (Nutrition Planning)
**Priority**: P3
**Depends on**: T-002
**Estimated effort**: M

**Description**:
Implement the `MacroCalculator` interface from plan.md §2 using the Mifflin-St Jeor formula for BMR and Harris-Benedict activity multipliers for TDEE.

**Acceptance criteria**:

- [ ] `calculateBMR(weightKg, heightCm, age, sex)` returns correct value (±1 cal tolerance)
- [ ] `calculateTDEE(bmr, activityLevel)` applies correct multipliers for all 5 activity levels
- [ ] `calculateMacros(tdee, goal)` returns `MacroTargets` for `lose` / `maintain` / `gain`
- [ ] `calculateFromRecipe(recipe)` aggregates USDA ingredient data (integrates with 003)
- [ ] `calculateFromMealPlan(planId)` aggregates across all meal plan entries (integrates with 006)
- [ ] All functions carry JSDoc (NFR-002)
- [ ] Unit tests cover BMR/TDEE formula accuracy (SC-010: within 5% of reference values)
- [ ] `strict: true` — no `any`

**Files to create/modify**:

- `src/nutrition/macro-calculator.service.ts`
- `src/nutrition/macro-calculator.service.spec.ts`

---

#### T-004 · Nutrition plan CRUD API

**User Story**: US-1 (Nutrition Planning — FR-035)
**Priority**: P3
**Depends on**: T-002, T-003, T-014
**Estimated effort**: M

**Description**:
Implement the five core CRUD endpoints from plan.md §3:
`GET /v1/nutrition-plans`, `POST /v1/nutrition-plans`, `GET /v1/nutrition-plans/{id}`, `PUT /v1/nutrition-plans/{id}`, `DELETE /v1/nutrition-plans/{id}`.

**Acceptance criteria**:

- [ ] `POST /v1/nutrition-plans` creates plan and returns shape from plan.md §3
- [ ] `GET /v1/nutrition-plans` returns own plans + plans shared with user
- [ ] `GET /v1/nutrition-plans/{id}` returns plan with `linkedMealPlans`
- [ ] `PUT /v1/nutrition-plans/{id}` updates plan; 403 if not owner
- [ ] `DELETE /v1/nutrition-plans/{id}` deletes plan and cascades compliance rows; 403 if not owner
- [ ] Auth0 JWT required on all endpoints (002 integration)
- [ ] `class-validator` DTOs for request bodies
- [ ] GDPR consent check middleware applied (T-014)
- [ ] JSDoc on all exported functions/classes (NFR-002)

**Files to create/modify**:

- `src/nutrition/nutrition-plans.controller.ts`
- `src/nutrition/nutrition-plans.service.ts`
- `src/nutrition/dto/create-nutrition-plan.dto.ts`
- `src/nutrition/dto/update-nutrition-plan.dto.ts`
- `src/nutrition/nutrition.module.ts`

---

#### T-005 · Meal plan link API

**User Story**: US-1 (Nutrition Planning — FR-036)
**Priority**: P3
**Depends on**: T-004
**Estimated effort**: S

**Description**:
Implement `POST /v1/nutrition-plans/{id}/link` to associate a meal plan with a nutrition plan.

**Acceptance criteria**:

- [ ] Links `meal_plan_nutrition_link` row; idempotent (no duplicate error on re-link)
- [ ] Validates that the meal plan belongs to the requesting user
- [ ] Returns updated plan with `linkedMealPlans` array
- [ ] 404 if nutrition plan or meal plan not found
- [ ] 403 if user does not own the nutrition plan

**Files to create/modify**:

- `src/nutrition/nutrition-plans.controller.ts` (add route)
- `src/nutrition/nutrition-plans.service.ts` (add `linkMealPlan` method)

---

#### T-006 · Compliance calculation service

**User Story**: US-1 (Nutrition Planning — FR-037)
**Priority**: P3
**Depends on**: T-003, T-005
**Estimated effort**: M

**Description**:
Implement the compliance aggregation logic that reads actual nutrition from linked meal plan entries (006) and computes `ComplianceStatus` per day.

**Acceptance criteria**:

- [ ] `calculateDailyCompliance(planId, date)` returns `NutritionCompliance` row
- [ ] `ComplianceStatus.ON_TRACK` when all macros within ±5% of target
- [ ] `ComplianceStatus.OVER` when any macro >105% of target
- [ ] `ComplianceStatus.UNDER` when any macro <95% of target
- [ ] Upserts `nutrition_compliance` table (idempotent recalculation)
- [ ] Handles missing meal plan data gracefully (returns `null` actuals, no crash)
- [ ] Accuracy within 5% of source food database values (SC-010)

**Files to create/modify**:

- `src/nutrition/compliance.service.ts`
- `src/nutrition/compliance.service.spec.ts`

---

#### T-007 · Compliance API endpoint

**User Story**: US-1 (Nutrition Planning — FR-037)
**Priority**: P3
**Depends on**: T-006
**Estimated effort**: S

**Description**:
Implement `GET /v1/nutrition-plans/{id}/compliance` returning daily + weekly compliance report as defined in plan.md §3.

**Acceptance criteria**:

- [ ] Returns `dateRange`, `daily[]`, and `weeklyAverage` in response shape from plan.md §3
- [ ] Accepts optional `?start=` and `?end=` query params (ISO date)
- [ ] Defaults to current week if no date range provided
- [ ] 403 if user does not own or have shared access to the plan
- [ ] Color-coded status indicators: `on_track` / `over` / `under` (NFR-004: not color-only — status text included)

**Files to create/modify**:

- `src/nutrition/nutrition-plans.controller.ts` (add route)
- `src/nutrition/nutrition-plans.service.ts` (add `getCompliance` method)

---

### Phase 3 — Trainer-Client Model (Premium)

---

#### T-008 · Trainer-client relationship service

**User Story**: US-2 (Trainer-Client Model)
**Priority**: P3
**Depends on**: T-002, T-014
**Estimated effort**: M

**Description**:
Implement the `trainer_clients` relationship management: invite, accept, revoke. Gated by 010-subscriptions premium check.

**Acceptance criteria**:

- [ ] `POST /v1/trainer/invite` sends invite; creates `trainer_clients` row with `status: 'pending'`
- [ ] Client can accept invite → status becomes `'active'`
- [ ] Client can revoke access at any time → status becomes `'revoked'`
- [ ] Trainer cannot access client data unless status is `'active'`
- [ ] Premium subscription check (010) applied before invite creation
- [ ] GDPR Article 9 explicit consent recorded at acceptance (T-014)

**Files to create/modify**:

- `src/nutrition/trainer-clients.service.ts`
- `src/nutrition/trainer.controller.ts`

---

#### T-009 · Trainer CRUD APIs for client nutrition plans

**User Story**: US-2 (Trainer-Client Model)
**Priority**: P3
**Depends on**: T-008, T-004
**Estimated effort**: M

**Description**:
Implement trainer-specific endpoints from plan.md §3:
`POST /v1/trainer/clients/{clientId}/nutrition-plan` and `GET /v1/trainer/clients/{clientId}/compliance`.

**Acceptance criteria**:

- [ ] Trainer can create a nutrition plan for a client (`trainer_id` set, `is_public: false`)
- [ ] Client receives notification (or flag) that a plan was shared
- [ ] `POST /v1/nutrition-plans/{id}/accept` allows client to link plan to their account
- [ ] `GET /v1/trainer/clients/{clientId}/compliance` returns compliance data only for plans the trainer created
- [ ] Trainer cannot see compliance data for plans they did not create
- [ ] `GET /v1/nutrition-plans?include=shared` returns trainer-created plans visible to client

**Files to create/modify**:

- `src/nutrition/trainer.controller.ts` (add routes)
- `src/nutrition/trainer-clients.service.ts` (add methods)

---

### Phase 4 — Frontend

---

#### T-010 · Frontend: Nutrition plan creation UI

**User Story**: US-1 (Nutrition Planning — FR-035)
**Priority**: P3
**Depends on**: T-004
**Estimated effort**: M

**Description**:
Build the nutrition plan creation form and plan list page. Includes macro target inputs and optional TDEE calculator.

**Acceptance criteria**:

- [ ] Form fields: name, daily calories, protein (g), carbs (g), fat (g), activity level, goal
- [ ] Optional TDEE calculator (weight, height, age, sex → auto-fill targets)
- [ ] Form validates required fields before submit
- [ ] On success, plan appears in plan list
- [ ] Plan list shows own plans + shared plans (with trainer badge)
- [ ] All inputs have accessible labels queryable via `getByRole`/`getByLabel` (NFR-003)
- [ ] Status/state conveyed with text + icon, not color alone (NFR-004)

**Files to create/modify**:

- `src/web/nutrition/NutritionPlanForm.tsx`
- `src/web/nutrition/NutritionPlanList.tsx`
- `src/web/nutrition/NutritionPlanPage.tsx`

---

#### T-011 · Frontend: Compliance dashboard

**User Story**: US-1 (Nutrition Planning — FR-037)
**Priority**: P3
**Depends on**: T-007, T-010
**Estimated effort**: M

**Description**:
Build the compliance dashboard showing planned vs. actual macros per day with visual indicators.

**Acceptance criteria**:

- [ ] Daily macro breakdown: calories, protein, carbs, fat (planned vs. actual)
- [ ] Weekly summary view
- [ ] `on_track` / `over` / `under` status shown with icon + text label (NFR-004)
- [ ] Date range picker (defaults to current week)
- [ ] Handles no-data state gracefully (no meal plan linked or no actuals yet)
- [ ] Accessible: all chart data available as table fallback (NFR-003)

**Files to create/modify**:

- `src/web/nutrition/ComplianceDashboard.tsx`
- `src/web/nutrition/MacroBreakdownChart.tsx`

---

#### T-012 · Frontend: Trainer-client UI (premium)

**User Story**: US-2 (Trainer-Client Model)
**Priority**: P3
**Depends on**: T-009, T-011
**Estimated effort**: M

**Description**:
Build trainer-side client management UI and client-side shared plan acceptance flow.

**Acceptance criteria**:

- [ ] Trainer can invite a client by email/user ID
- [ ] Trainer sees list of active clients with compliance summary
- [ ] Trainer can create a nutrition plan for a specific client
- [ ] Client sees pending plan invitations with accept/decline actions
- [ ] Client can revoke trainer access from settings
- [ ] Premium gate: non-premium trainers see upgrade prompt

**Files to create/modify**:

- `src/web/nutrition/TrainerClientList.tsx`
- `src/web/nutrition/ClientInviteForm.tsx`
- `src/web/nutrition/SharedPlanInbox.tsx`

---

### Phase 5 — AI Suggestions (Premium)

---

#### T-013 · AI recipe swap suggestions (premium, 005 integration)

**User Story**: US-3 (AI Recipe Swap — FR-039)
**Priority**: P3
**Depends on**: T-007, T-011
**Estimated effort**: L

**Description**:
Integrate with feature 005 (AI suggestions) to recommend recipe swaps that better align meal plans with nutrition targets. Premium-gated.

**Acceptance criteria**:

- [ ] When compliance shows a macro gap/excess, system surfaces "swap suggestions"
- [ ] Suggestions call 005 AI service with current macro delta as context
- [ ] Each suggestion shows: recipe name, macro improvement, confidence
- [ ] Premium subscription check (010) applied before calling AI service
- [ ] Non-premium users see teaser with upgrade prompt
- [ ] Suggestions are non-blocking (async, shown after compliance loads)

**Files to create/modify**:

- `src/nutrition/swap-suggestions.service.ts`
- `src/web/nutrition/SwapSuggestions.tsx`

---

### Phase 6 — Cross-Cutting

---

#### T-014 · GDPR Article 9 consent middleware

**User Story**: US-1 & US-2 (all nutrition data)
**Priority**: P3
**Depends on**: T-002
**Estimated effort**: S

**Description**:
Implement consent recording and enforcement middleware for GDPR Article 9 (special category health data). Applied to all nutrition plan endpoints.

**Acceptance criteria**:

- [ ] `nutrition_consent` record created (or verified) before any nutrition data is written
- [ ] Consent captured at first plan creation (checkbox in T-010 form)
- [ ] Trainer-client consent captured at invite acceptance (T-008)
- [ ] `DELETE /v1/nutrition-plans/{id}` triggers right-to-erasure cascade (all compliance rows deleted)
- [ ] No nutrition data returned if consent is revoked
- [ ] Consent status logged for audit trail

**Files to create/modify**:

- `src/nutrition/gdpr-consent.middleware.ts`
- `src/db/migrations/009b_nutrition_consent.ts` (consent table if not in T-001)

---

#### T-015 · Unit tests: macro calculator

**User Story**: US-1 (SC-010 accuracy requirement)
**Priority**: P3
**Depends on**: T-003
**Estimated effort**: S

**Description**:
Comprehensive unit tests for the macro calculator service verifying formula accuracy.

**Acceptance criteria**:

- [ ] BMR formula tested against 3+ reference cases (male/female, different weights/heights)
- [ ] TDEE multipliers tested for all 5 activity levels
- [ ] Macro split tested for all 3 goals (lose/maintain/gain)
- [ ] Edge cases: minimum calorie floor, zero-weight guard
- [ ] All tests pass with `npm test`
- [ ] Coverage ≥ 90% for `macro-calculator.service.ts`

**Files to create/modify**:

- `src/nutrition/macro-calculator.service.spec.ts` (expand from T-003)

---

#### T-016 · Integration tests: compliance API

**User Story**: US-1 (FR-037, SC-010)
**Priority**: P3
**Depends on**: T-007
**Estimated effort**: M

**Description**:
Integration tests for the compliance calculation pipeline end-to-end (DB → service → API response).

**Acceptance criteria**:

- [ ] Test: create plan → link meal plan → verify compliance response shape
- [ ] Test: `on_track` / `over` / `under` status computed correctly
- [ ] Test: date range filtering works
- [ ] Test: 403 returned for unauthorized access
- [ ] Test: accuracy within 5% of reference values (SC-010)
- [ ] Uses test database (not production)

**Files to create/modify**:

- `tests/integration/nutrition-compliance.spec.ts`

---

#### T-017 · E2E tests: nutrition plan flow

**User Story**: US-1 (acceptance scenarios from spec.md)
**Priority**: P3
**Depends on**: T-011
**Estimated effort**: M

**Description**:
Playwright E2E tests covering the three acceptance scenarios from spec.md.

**Acceptance criteria**:

- [ ] Scenario 1: Create plan with macro targets → plan visible on dashboard
- [ ] Scenario 2: Link meal plan → compliance view shows planned vs. actual with status indicators
- [ ] Scenario 3 (premium): Trainer creates plan for client → client can view it
- [ ] All interactive elements queryable via `getByRole`/`getByLabel` (NFR-003)
- [ ] Tests run in CI (`npm test`)

**Files to create/modify**:

- `tests/e2e/nutrition-planning.spec.ts`

---

## Summary

| #     | Task                                | Phase             | Effort | Depends on          |
| ----- | ----------------------------------- | ----------------- | ------ | ------------------- |
| T-001 | DB migration                        | 1 — DB            | S      | 006 migration       |
| T-002 | Drizzle schema                      | 1 — DB            | S      | T-001               |
| T-003 | Macro calculator service            | 2 — Services      | M      | T-002               |
| T-004 | Nutrition plan CRUD API             | 2 — Services      | M      | T-002, T-003, T-014 |
| T-005 | Meal plan link API                  | 2 — Services      | S      | T-004               |
| T-006 | Compliance calculation service      | 2 — Services      | M      | T-003, T-005        |
| T-007 | Compliance API endpoint             | 2 — Services      | S      | T-006               |
| T-008 | Trainer-client relationship service | 3 — Trainer       | M      | T-002, T-014        |
| T-009 | Trainer CRUD APIs                   | 3 — Trainer       | M      | T-008, T-004        |
| T-010 | Frontend: plan creation UI          | 4 — Frontend      | M      | T-004               |
| T-011 | Frontend: compliance dashboard      | 4 — Frontend      | M      | T-007, T-010        |
| T-012 | Frontend: trainer-client UI         | 4 — Frontend      | M      | T-009, T-011        |
| T-013 | AI recipe swap suggestions          | 5 — AI            | L      | T-007, T-011        |
| T-014 | GDPR Article 9 consent middleware   | 6 — Cross-cutting | S      | T-002               |
| T-015 | Unit tests: macro calculator        | 6 — Cross-cutting | S      | T-003               |
| T-016 | Integration tests: compliance API   | 6 — Cross-cutting | M      | T-007               |
| T-017 | E2E tests: nutrition plan flow      | 6 — Cross-cutting | M      | T-011               |

**Total tasks**: 17
**Effort breakdown**: S×6, M×10, L×1
