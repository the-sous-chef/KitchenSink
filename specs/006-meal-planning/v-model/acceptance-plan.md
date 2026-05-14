# Acceptance Test Plan: Meal Planning

**Feature Branch**: `006-meal-planning`
**Created**: 2026-05-09
**Status**: Draft
**Source**: `specs/006-meal-planning/v-model/requirements.md`, `specs/006-meal-planning/v-model/system-test.md`

## Overview

This document defines the Acceptance Test Plan for the Meal Planning feature. It maps every functional and non-functional requirement from `requirements.md` to BDD-style acceptance test scenarios (AT-NNN-X), each with pass criteria. The feature has two tiers: free-tier (meal plan creation, manual recipe assignment, nutritional summaries) and premium-tier (AI suggestions, auto-generation, waste optimization).

**ID Schema:**

- **Acceptance Test Case**: `AT-NNN-X` — NNN = feature number (006), X = sequential letter
- **Acceptance Test Scenario**: `ATS-NNN-X#` — nested under parent AT, numeric suffix

---

## Acceptance Test Cases (Tier 1–3 Structure)

### Tier 1: Feature Epic

### Tier 2: User Story / Requirement

### Tier 3: BDD Scenario (Given / When / Then)

---

### AT-006-A — Meal Plan CRUD

**Requirement**: REQ-001, REQ-010, REQ-CN-001

| ATS ID     | Scenario                    | Given                                                  | When                                                                                                       | Then                                                                                           |
| ---------- | --------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| ATS-006-A1 | Create plan for 1 week      | Authenticated user with no existing plan for this week | User submits `POST /meal-plans` with `startDate: '2026-05-11', endDate: '2026-05-17', name: 'Weekly Plan'` | System returns 201 with plan object; plan has 7 daily slots (breakfast, lunch, dinner, snacks) |
| ATS-006-A2 | Create plan for 30+ days    | Authenticated user                                     | User submits plan with `startDate: '2026-05-11', endDate: '2026-06-10'`                                    | System returns 201; plan has 31 daily slot sets                                                |
| ATS-006-A3 | Create plan unauthenticated | No session token                                       | User calls `POST /meal-plans`                                                                              | System returns 401                                                                             |
| ATS-006-A4 | View own meal plan          | User has a saved plan with ID `plan-uuid`              | User calls `GET /meal-plans/plan-uuid`                                                                     | System returns 200 with plan including all meal slots and assigned recipes                     |
| ATS-006-A5 | View another user's plan    | User does not own plan `other-plan-uuid`               | User calls `GET /meal-plans/other-plan-uuid`                                                               | System returns 404                                                                             |
| ATS-006-A6 | Delete meal plan            | User owns plan `plan-uuid`                             | User calls `DELETE /meal-plans/plan-uuid`                                                                  | System returns 204; plan no longer returned in list                                            |

---

### AT-006-B — Recipe Assignment to Meal Slots

**Requirement**: REQ-002, REQ-003

| ATS ID     | Scenario                                  | Given                                                      | When                                                                                               | Then                                                                       |
| ---------- | ----------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| ATS-006-B1 | Assign recipe to breakfast slot on Monday | User has a plan with Monday slot; owns recipe `recipe-123` | User calls `PUT /meal-plans/plan-uuid/slots/monday-breakfast` with `recipeId: 'recipe-123'`        | Slot updated; `GET /meal-plans/plan-uuid` shows recipe in Monday breakfast |
| ATS-006-B2 | Remove recipe from slot                   | Monday breakfast currently has `recipe-123` assigned       | User calls `DELETE /meal-plans/plan-uuid/slots/monday-breakfast`                                   | Slot cleared; recipe removed from slot                                     |
| ATS-006-B3 | Assign recipe user doesn't own            | User attempts to assign `recipe-owned-by-other`            | User calls `PUT /meal-plans/plan-uuid/slots/monday-lunch` with `recipeId: 'recipe-owned-by-other'` | System returns 404                                                         |
| ATS-006-B4 | Assign to slot outside plan date range    | Plan covers May 11–17; user assigns to May 25 slot         | User calls `PUT /meal-plans/plan-uuid/slots/may-25-dinner`                                         | System returns 400                                                         |

---

### AT-006-C — Nutritional Summaries

**Requirement**: REQ-004, REQ-005

| ATS ID     | Scenario                            | Given                                                        | When                                                       | Then                                                                                                                 |
| ---------- | ----------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| ATS-006-C1 | Daily summary with assigned recipes | Monday has 3 recipes assigned with known calories and macros | User calls `GET /meal-plans/plan-uuid/days/monday/summary` | System returns `{ calories: 1850, protein: 90, carbs: 200, fat: 75 }` computed from recipe ingredients via USDA data |
| ATS-006-C2 | Daily summary with no recipes       | Monday has no recipes assigned                               | User calls `GET /meal-plans/plan-uuid/days/monday/summary` | System returns `{ calories: 0, protein: 0, carbs: 0, fat: 0 }`                                                       |
| ATS-006-C3 | Weekly summary                      | Plan has 7 days with assigned recipes                        | User calls `GET /meal-plans/plan-uuid/summary/weekly`      | System returns aggregated totals across all 7 days; `dailyAverageCalories` computed                                  |
| ATS-006-C4 | Weekly summary partial week         | Plan has only 3 days populated                               | User calls `GET /meal-plans/plan-uuid/summary/weekly`      | System returns totals for 3 populated days; note indicates partial week                                              |

---

### AT-006-D — AI Meal Suggestions (Premium)

**Requirement**: REQ-006, REQ-CN-003

| ATS ID     | Scenario                             | Given                                                             | When                                                                                 | Then                                                                                     |
| ---------- | ------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| ATS-006-D1 | Premium user requests suggestions    | User has premium subscription; plan has 5 empty slots for Tuesday | User calls `POST /meal-plans/plan-uuid/suggestions/tuesday` with `mealType: 'lunch'` | System returns up to 3 suggested recipes from user's collection that fit calorie targets |
| ATS-006-D2 | Free-tier user requests suggestions  | User does not have premium subscription                           | User calls `POST /meal-plans/plan-uuid/suggestions/tuesday`                          | System returns 402 `Upgrade required`                                                    |
| ATS-006-D3 | Premium user accepts suggestion      | Suggestions returned with `suggestionId: 'sug-1'`                 | User calls `POST /meal-plans/plan-uuid/suggestions/sug-1/accept`                     | System assigns suggested recipe to slot; returns 200                                     |
| ATS-006-D4 | Premium user rejects all suggestions | Suggestions displayed                                             | User calls `POST /meal-plans/plan-uuid/suggestions/reject-all`                       | No slots modified; suggestions discarded                                                 |

---

### AT-006-E — Auto-Generation (Premium)

**Requirement**: REQ-007, REQ-CN-003

| ATS ID     | Scenario                                   | Given                                                | When                                                                                                           | Then                                                                                                                 |
| ---------- | ------------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| ATS-006-E1 | Auto-generate complete plan                | Premium user; plan has all 14 slots empty for 7 days | User calls `POST /meal-plans/plan-uuid/generate` with `{ calorieTarget: 2000, dietaryPreference: 'low-carb' }` | System fills all slots with recipes from collection matching criteria; returns 200 with plan showing all assignments |
| ATS-006-E2 | Auto-generate with conflicting constraints | Premium user; no recipes in collection meet criteria | User calls `POST /meal-plans/plan-uuid/generate` with impossible targets                                       | System returns partial plan with 0 slots filled; notes which constraints could not be satisfied                      |

---

### AT-006-F — Food Waste Optimization (Premium)

**Requirement**: REQ-008, REQ-CN-003

| ATS ID     | Scenario                                | Given                                                                | When                                                   | Then                                                                                                                                       |
| ---------- | --------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| ATS-006-F1 | Waste optimization identifies overlap   | Plan has chicken in Monday lunch and chicken again in Tuesday dinner | User calls `POST /meal-plans/plan-uuid/optimize-waste` | System returns suggestion to swap Tuesday dinner to a vegetable dish using leftover chicken from Monday; `wasteScoreImprovedBy` calculated |
| ATS-006-F2 | No waste found (all unique ingredients) | Plan has fully diverse ingredient lists                              | User calls `POST /meal-plans/plan-uuid/optimize-waste` | System returns `{ suggestions: [], wasteScore: 0 }`                                                                                        |

---

## Acceptance Criteria per REQ

| REQ ID     | Pre-condition                              | Success Condition                                                                      | Technique                                      |
| ---------- | ------------------------------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------- |
| REQ-001    | Authenticated user                         | Plan created with correct date range; 201 returned                                     | Statement Coverage                             |
| REQ-002    | Plan exists                                | Custom meal slot types supported (breakfast/lunch/dinner/snacks plus any user-defined) | Equivalence Partitioning                       |
| REQ-003    | User owns recipe and plan                  | Recipe assigned to correct slot; visible in plan view                                  | Statement Coverage                             |
| REQ-004    | Plan has recipes with USDA ingredient data | Daily summary calculated; matches sum of assigned recipe macros                        | Boundary Value Analysis                        |
| REQ-005    | Plan has 7 days with varying completeness  | Weekly totals aggregate correctly; partial days handled                                | Statement Coverage                             |
| REQ-006    | User is premium                            | Suggestions returned matching calorie targets; 402 for free-tier                       | Branch Coverage + Equivalence Partitioning     |
| REQ-007    | Premium user                               | Auto-generated plan has all/most slots filled; user can edit result                    | State Transition Testing                       |
| REQ-008    | Premium user with plan                     | Waste optimization identifies overlapping ingredients; suggestions returned            | Statement Coverage                             |
| REQ-009    | Plan exists                                | Full plan displayed with all slots, recipes, and nutritional summaries                 | Statement Coverage                             |
| REQ-010    | Authenticated user                         | Plans up to 30+ days supported; 201 returned for any range ≤ 90 days                   | Boundary Value Analysis (30, 60, 90 day plans) |
| REQ-CN-001 | Recipe from 001 collection                 | AI-suggested recipes stored as Recipe entities (existing data model)                   | Inspection                                     |
| REQ-CN-003 | Free-tier user                             | AI features (suggestions, auto-gen, waste optimization) return 402                     | Fault Injection                                |

---

## Feature Test Summary Matrix

| REQ        | AT Count | Scenarios | Test Method                          | Pass Criteria                                            |
| ---------- | -------- | --------- | ------------------------------------ | -------------------------------------------------------- |
| REQ-001    | 1        | 3         | Statement + Equivalence Partitioning | 201, correct slot count for date range                   |
| REQ-002    | 1        | 1         | Equivalence Partitioning             | Custom slots accepted without error                      |
| REQ-003    | 1        | 4         | Statement + Branch Coverage          | Correct recipe in correct slot; 404 for non-owned recipe |
| REQ-004    | 1        | 2         | Boundary Value Analysis              | Daily totals match sum of assigned recipe macros         |
| REQ-005    | 1        | 2         | Statement Coverage                   | Weekly totals = sum of daily; partial handled            |
| REQ-006    | 1        | 2         | Branch + Equivalence Partitioning    | Premium: suggestions returned; Free-tier: 402            |
| REQ-007    | 1        | 2         | State Transition Testing             | Slots filled; partial plan if constraints impossible     |
| REQ-008    | 1        | 2         | Statement Coverage                   | Overlap detected; suggestions or 0 waste                 |
| REQ-009    | 1        | 1         | Statement Coverage                   | Full plan with recipes, slots, summaries returned        |
| REQ-010    | 1        | 3         | Boundary Value Analysis              | 30-day plan created; >90 days → 400                      |
| REQ-CN-001 | 1        | 1         | Inspection                           | Recipes stored in existing 001 data model                |
| REQ-CN-003 | 3        | 3         | Fault Injection                      | 402 for free-tier on all premium AI features             |

---

## Exit Criteria

For feature 006 to be considered shippable, ALL gates below must be green:

**Gate 1 — Functional Completeness**

- [ ] REQ-001 through REQ-010 all have passing acceptance test scenarios
- [ ] Manual plan creation, recipe assignment, and nutritional summaries work end-to-end

**Gate 2 — Premium Gating**

- [ ] Free-tier users receive 402 on AI suggestions (REQ-006), auto-generation (REQ-007), and waste optimization (REQ-008)
- [ ] Premium users access all three AI features without restriction

**Gate 3 — Nutritional Accuracy**

- [ ] Daily summary = arithmetic sum of assigned recipe macros from USDA data
- [ ] Weekly summary = sum of all daily summaries
- [ ] Empty day shows all zeros, not error

**Gate 4 — Authorization**

- [ ] Users can only view and edit their own meal plans
- [ ] Attempting to view another user's plan returns 404

**Gate 5 — Date Range Flexibility**

- [ ] Plans from 1 day to 30+ days supported
- [ ] Date range outside plan bounds (e.g., assigning to non-existent day) returns 400

---

### AT-PARITY — Cross-platform parity for Meal Planning

**Requirement**: REQ-IF-007

| ATS ID       | Scenario                     | Given                                                                 | When                                                                          | Then                                                                                                                                                                               |
| ------------ | ---------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ATS-PARITY-1 | Web/mobile capability parity | A user-facing Meal Planning workflow is implemented on web and mobile | Product QA compares the web and mobile flows against the same requirement set | Both platforms expose the same core capabilities, entitlement behavior, error states, accessibility semantics, and recovery paths, or a documented V-Model parity exception exists |
| ATS-PARITY-2 | Parity regression gate       | A change modifies a Meal Planning user-facing workflow                | The feature test plan is reviewed                                             | The change includes paired web and mobile acceptance coverage or a documented exception approved by product governance                                                             |
