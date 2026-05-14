# Product Specification: Sous Chef - Meal Planning

**Branch**: `006-meal-planning`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [spec.md](../spec.md)

---

## Vision

Meal Planning turns Sous Chef from a recipe repository into a repeatable planning system for real households. Users should be able to build plans quickly, adapt them easily, and carry them through to shopping with clear nutritional context.

**Tagline**: "Plan fast, eat well, waste less."

**Core principles**:

- Planning should feel tactile and editable (calendar + drag-drop).
- Nutrition summaries should be visible without leaving the planner.
- Premium AI should assist, not replace user control.
- Grocery handoff should be a first-class completion step.

---

## Personas

### Primary — P3 Riley (Family Meal Planner)

**Archetype**: Family Meal Planner
**Core motivation**: Quick, kid-friendly, weekly rotation, household scale

**Goals**:

- See the full week at a glance on a single calendar view without switching screens.
- Reuse proven weekly structures (templates) so Monday-through-Sunday planning takes minutes, not an hour.
- Adjust servings with family-size presets rather than recalculating every recipe manually.
- Hand off the completed plan to the grocery workflow in one tap.
- Avoid re-entering the same rotation every week through recurring plan support.

**Pain points**:

- Re-entering near-identical plans week after week with no template or recurrence option.
- Losing the thread between planning and shopping when the two workflows feel disconnected.
- Serving-size math that doesn't account for household headcount automatically.

**Fits**: FR-022, FR-023, SC-008, US-006-008, US-006-009

---

### Secondary — P4 Sam (Nutrition & Diet Planner)

**Archetype**: Nutrition & Diet Planner
**Core motivation**: Macros, diet protocols, goal tracking

**Goals**:

- See per-day and per-week macro totals (calories, protein, carbs, fat) update live as meals are assigned.
- Validate that a full week's plan stays within a diet protocol (e.g., calorie ceiling, protein floor) before committing.
- Swap a single meal slot and immediately see how the nutrition summary shifts.
- Avoid maintaining a parallel spreadsheet by keeping all tracking inside the planner.
- Surface nutrition gaps (e.g., low protein on Thursday) as actionable warnings, not buried data.

**Pain points**:

- Nutritional data that's visible on individual recipe pages but disconnected from plan-level decisions.
- No way to see cumulative weekly impact without exporting data and doing math elsewhere.

**Fits**: FR-024, US-006-003

---

### Tertiary — P6 Avery (Waste Optimizer)

**Archetype**: Waste Optimizer
**Core motivation**: Use-the-fridge, ingredient chaining, cost reduction

**Goals**:

- Route leftover ingredients from one meal into another later in the week automatically.
- Get AI-generated optimization suggestions that reduce the number of unique ingredients across the plan.
- See a "waste risk" signal when a perishable ingredient appears only once in the week.
- Reduce grocery spend by maximizing ingredient overlap across planned meals.
- Accept or reject optimization proposals without losing manual control of the plan.

**Pain points**:

- Manual planning produces high ingredient variance, leading to fridge waste by the weekend.
- No visibility into which ingredients are stranded (bought for one recipe, unused elsewhere).

**Fits**: FR-025, FR-026, FR-027, US-006-007

---

## Epics

### Epic 1: Plan Creation and Scheduling (P2)

Users create plans over configurable date ranges and assign recipes to meal slots.

### Epic 2: Nutrition Visibility (P2)

Users monitor daily and weekly nutrition summaries directly within planning workflows.

### Epic 3: Premium AI Assistance (P2)

Premium users get suggestions, complete plan generation, and waste optimization proposals.

### Epic 4: Plan Completion and Handoff (P2)

Users complete planner-to-grocery flow quickly enough to meet SC-008.

---

## Stories (MoSCoW)

### Must Have

1. **US-006-001 — Create Plan**: As an authenticated user, I can create a meal plan for a configurable date range with meal slots.
   **FRs**: FR-022
2. **US-006-002 — Assign Meals**: As a planner, I can assign recipes to day/meal slots manually.
   **FRs**: FR-023
3. **US-006-003 — View Nutrition Summary**: As a planner, I can view daily and weekly nutrition summaries for my plan.
   **FRs**: FR-024
4. **US-006-004 — Complete Planning Workflow**: As a planner, I can complete planning through grocery handoff in under 10 minutes for a 7-day plan.
   **FRs/SC**: SC-008

### Should Have

5. **US-006-005 — AI Suggestions (Premium)**: As a premium user, I can request recipe suggestions for specific slots.
   **FRs**: FR-025
6. **US-006-006 — AI Auto-Generate Plan (Premium)**: As a premium user, I can auto-generate a complete draft plan and then edit it.
   **FRs**: FR-026

### Could Have

7. **US-006-007 — Waste Optimization (Premium)**: As a premium user, I can request optimization suggestions that improve ingredient reuse.
   **FRs**: FR-027
8. **US-006-008 — Template/Recurring Workflow (Inferred)**: As a frequent planner, I can reuse prior planning structures for speed.
   **Traceability**: Inferred from domain brief/research/plan open question; no explicit FR currently.
9. **US-006-009 — Family Size Presets (Inferred)**: As a household planner, I can adjust servings with family-size presets.
   **Traceability**: Inferred from domain brief and `servings` field; no explicit FR currently.

### Won't Have (current explicit scope)

- Full autonomous plan execution without user review.
- Non-authenticated planning workflows (contradicts dependency on 002 auth).

---

## Out of Scope

- New nutrition-plan authoring rules (owned by feature 009).
- Grocery list ownership logic and retailer integration internals (owned by feature 007).
- AI provider management and model orchestration internals (owned by feature 005).

## WARNING

- US-006-008 and US-006-009 are marked inferred because `spec.md` does not include dedicated FR IDs for templates/recurrence/family-sizing controls. Keep as revalidation candidates; do not treat as committed implementation requirements until promoted upstream.
