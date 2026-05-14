# Competitor Analysis: Meal Planning Apps

**Branch**: `006-meal-planning` | **Date**: 2026-05-09
**Status**: Complete | **Source**: [research.md](../research.md), requested competitor set

---

## Competitive Landscape Overview

Feature 006 competes in a mature meal-planning market where differentiation comes less from basic planning and more from execution quality across: drag-drop scheduling, adaptive templates, leftovers economics, nutrition constraints, and grocery handoff.

Requested comparison set:

1. Plan To Eat
2. Mealime
3. PlateJoy
4. eMeals

---

## Competitor Profiles

### 1. Plan To Eat

| Attribute               | Detail                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------ |
| **Positioning**         | Planning-first digital meal calendar with recipe import and shopping list generation |
| **Core strengths**      | Weekly planning workflow, schedule-to-list handoff, calendar mental model            |
| **Core weaknesses**     | Limited automation and weaker AI personalization compared to modern assistants       |
| **Templates/recurring** | Strong recurring planning behavior via copy/repeat workflows                         |
| **Nutrition depth**     | Moderate; less optimization-focused than macro-driven tools                          |
| **Leftovers handling**  | User-managed through manual slot duplication/notes                                   |
| **Takeaway for 006**    | Baseline expectation for calendar UX + shopping linkage                              |

---

### 2. Mealime

| Attribute               | Detail                                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| **Positioning**         | Simplicity-first meal planning with guided recipe selection                |
| **Core strengths**      | Fast onboarding, low-friction week planning, grocery generation            |
| **Core weaknesses**     | Lower customization ceiling for advanced planners                          |
| **Templates/recurring** | Lightweight compared to schedule-heavy planners                            |
| **Nutrition depth**     | Good visibility, moderate goal customization                               |
| **Leftovers handling**  | Mostly implicit via recipe sizing and repeat inclusion                     |
| **Takeaway for 006**    | Keep first-week UX simple; avoid feature-rich but cumbersome creation flow |

---

### 3. PlateJoy

| Attribute               | Detail                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------ |
| **Positioning**         | Personalized nutrition + meal planning program                                       |
| **Core strengths**      | Goal-driven planning, profile constraints, plan adaptation                           |
| **Core weaknesses**     | More rigid feel for users wanting manual scheduling control                          |
| **Templates/recurring** | Programmatic plan generation over direct calendar crafting                           |
| **Nutrition depth**     | High, explicitly tied to goals                                                       |
| **Leftovers handling**  | Optimization often implicit through generated recommendations                        |
| **Takeaway for 006**    | Nutrition-goal overlays should be first-class, but manual control must remain strong |

---

### 4. eMeals

| Attribute               | Detail                                                                  |
| ----------------------- | ----------------------------------------------------------------------- |
| **Positioning**         | Subscription meal plans with retailer shopping integration              |
| **Core strengths**      | Curated plans + purchase handoff convenience                            |
| **Core weaknesses**     | Less flexible for fully custom personal recipe libraries                |
| **Templates/recurring** | Strong curated template model                                           |
| **Nutrition depth**     | Plan-level visibility; depends on selected plan types                   |
| **Leftovers handling**  | Plan dependent; not typically user-tuned optimization                   |
| **Takeaway for 006**    | Template-driven speed and shopping handoff are critical adoption levers |

---

## Feature Parity Matrix (Requested Domain)

| Capability                 | Plan To Eat | Mealime           | PlateJoy          | eMeals                | 006 Target                                               |
| -------------------------- | ----------- | ----------------- | ----------------- | --------------------- | -------------------------------------------------------- |
| Weekly planner             | ✅          | ✅                | ✅                | ✅                    | ✅                                                       |
| Monthly planner            | ⚠️ Partial  | ⚠️ Partial        | ⚠️ Programmatic   | ⚠️ Plan-list style    | ✅ (`planner-month`)                                     |
| Drag-drop scheduling       | ✅          | ⚠️ Simplified     | ⚠️ Limited direct | ⚠️ Minimal            | ✅ (`@dnd-kit`)                                          |
| Plan templates             | ✅          | ⚠️ Lightweight    | ✅ Programmatic   | ✅ Curated            | ✅ (`plan-templates`)                                    |
| Recurring meals            | ✅          | ⚠️ Partial        | ⚠️ Engine-driven  | ⚠️ Plan dependent     | ⚠️ UX included; FR-level explicitness pending            |
| Nutrition goals in planner | ⚠️ Moderate | ⚠️ Moderate       | ✅ Strong         | ⚠️ Variable           | ✅ via 003/009 integration                               |
| Family sizing controls     | ⚠️ Manual   | ✅ Recipe scaling | ✅ Programmatic   | ✅ household-oriented | ⚠️ UX expectation present; FR-level explicitness pending |
| Leftovers optimization     | ⚠️ Manual   | ⚠️ Partial        | ⚠️ Programmatic   | ⚠️ Plan dependent     | ✅ premium intent (FR-027)                               |
| Shopping handoff           | ✅          | ✅                | ✅                | ✅                    | ✅ (`plan-shopping-handoff`)                             |

---

## Market Gaps 006 Can Exploit

1. **Manual + AI blend**: Keep planner tactile (drag-drop) while adding premium optimization (FR-025..027).
2. **Cross-feature continuity**: Tight flow from recipes (001) → planner (006) → grocery (007) → nutrition compliance (009).
3. **Template reuse with nutrition awareness**: Reusable plans that respect macro constraints and leftovers economics.

---

## Differentiation Thesis

Feature 006 should differentiate on **planner ergonomics + optimization intelligence**:

- Ergonomics: fast weekly/monthly calendar planning with low-friction drag-drop and clear visual states.
- Intelligence: premium suggestions/auto-generation/waste optimization tied to real recipe inventory and nutrition data.
- Continuity: one coherent system rather than disconnected “meal planning” and “shopping list” islands.

---

## WARNING: Requirement Explicitness Gaps

- Templates, recurring meals, family sizing, and leftovers are in user intent + domain brief, but not all are explicit standalone FRs in `spec.md`.
- Current mapping uses FR-022/023/027 transitive coverage. Revalidation should confirm whether explicit FRs are needed.
