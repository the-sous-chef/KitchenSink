# User Journeys: Meal Planning

**Branch**: `006-meal-planning`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](./product-spec.md), [spec.md](../spec.md)

---

## Journey Notation

Steps reference FR/SC IDs in brackets. Premium-only actions are marked accordingly.

---

## Journey A: Weekly Planning and Assignment (Core)

**Persona**: Household Planner (Riley)

**Scenario**: Riley creates a new weekly plan, drags recipes into slots, checks nutrition, and prepares for grocery handoff.

```mermaid
sequenceDiagram
    participant U as Riley (Web)
    participant API as Meal Planning API
    participant DB as PostgreSQL
    participant NUT as Nutrition Aggregator

    U->>API: POST /v1/meal-plans {startDate,endDate,planType}
    Note right: FR-022
    API->>DB: INSERT meal_plan
    API-->>U: 201 Created {planId}

    U->>API: POST /v1/meal-plans/{id}/entries {date,mealType,recipeId,servings}
    Note right: FR-023
    API->>DB: INSERT meal_plan_entry
    API->>NUT: enqueue recalc
    API-->>U: 201 Created

    U->>API: GET /v1/meal-plans/{id}/nutrition
    Note right: FR-024
    API-->>U: dailyNutrition + weekTotals
```

---

## Journey B: Premium AI-Assisted Planning

**Persona**: Premium Optimizer (Taylor)

**Scenario**: Taylor requests slot-level suggestions, then auto-generates a plan draft and applies selected options.

```mermaid
sequenceDiagram
    participant U as Taylor (Premium)
    participant API as Meal Planning API
    participant AI as 005 AI Integration

    U->>API: POST /v1/meal-plans/{id}/recipes/suggestions
    Note right: FR-025 (Premium)
    API->>AI: Suggest recipes by preferences/constraints
    AI-->>API: ranked suggestions
    API-->>U: candidate recipes

    U->>API: POST /v1/meal-plans/{id}/generate
    Note right: FR-026 (Premium)
    API->>AI: Generate complete draft plan
    AI-->>API: proposed entries
    API-->>U: reviewable draft plan

    U->>API: POST /v1/meal-plans/{id}/optimize-waste
    Note right: FR-027 (Premium)
    API->>AI: propose swaps/reordering for shared ingredients
    API-->>U: optimization proposal (review/apply)
```

---

## Journey C: Plan-to-Grocery Handoff

**Persona**: Household Planner (Riley)

**Scenario**: Riley finalizes a 7-day plan and hands off ingredient manifest to grocery workflow.

```mermaid
sequenceDiagram
    participant U as Riley
    participant API as Meal Planning API
    participant GL as 007 Grocery Lists

    U->>API: POST /v1/meal-plans/{id}/grocery-list
    API-->>U: grocery manifest preview

    U->>API: POST /v1/meal-plans/{id}/lock
    Note right: lock/finalize behavior from plan/tasks
    API-->>U: plan locked

    U->>GL: Continue with grocery list creation flow
    Note right: SC-008 end-to-end objective
```

---

## Cross-Journey Edge Flows

### Edge X1: Large Date-Range Plan (30+ days)

- User creates extended plan date range.
- System maintains planner responsiveness and correct aggregation.
- Traceability: spec edge case + REQ-010.

### Edge X2: Orphaned Recipe Entry

- A referenced recipe is deleted in upstream feature 001.
- Entry remains, marked unavailable/orphaned.
- User can replace/remove without losing surrounding plan structure.

### Edge X3: External Service Degradation

- USDA or AI endpoint delayed/unavailable.
- Core assignment path remains available; async updates/retries recover ancillary features.

---

## Journey Coverage Matrix

| Requirement | Journey Coverage |
| ----------- | ---------------- |
| FR-022      | Journey A        |
| FR-023      | Journey A        |
| FR-024      | Journey A        |
| FR-025      | Journey B        |
| FR-026      | Journey B        |
| FR-027      | Journey B        |
| SC-008      | Journey C        |

## WARNING

- Templates/recurrence/family-sizing/leftovers are represented in wireframes and UX patterns but are not all explicit FRs in `spec.md`; they are treated as inferred behaviors pending revalidation.
