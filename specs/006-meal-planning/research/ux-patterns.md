# UX Patterns: Meal Planning

**Branch**: `006-meal-planning` | **Date**: 2026-05-09
**Status**: Complete | **Source**: [spec.md](../spec.md), [plan.md](../plan.md), [research.md](../research.md)

---

## 1. Planner Views

### 1.1 Weekly Calendar Grid (Primary)

Primary planning surface should be a 7-column week grid with meal-type slots per day:

- Columns: Mon → Sun
- Rows/sections per column: breakfast, lunch, dinner, snack
- Slot states: empty, assigned, locked, orphaned recipe

**Why**: aligns with FR-022/023 core planning loop and fastest comprehension for drag-drop scheduling.

---

### 1.2 Monthly Overview (Secondary)

Monthly view provides density and planning horizon visibility:

- Day cells show count badges and key anchors (e.g., dinner title)
- Click/day-open reveals same slot model as weekly detail

**Why**: supports “what’s coming” planning and aligns with requested `planner-month` wireframe.

---

## 2. Drag-and-Drop Scheduling

### 2.1 Library and Interaction Model

Use `@dnd-kit/core` + `@dnd-kit/sortable` (already selected in `tasks.md`):

1. Drag recipe card from sidebar/search
2. Drop into day/meal slot
3. Persist assignment via POST `/v1/meal-plans/{id}/entries`
4. Optimistically render card; reconcile failures with inline retry

**Accessibility guardrails (NFR-003/NFR-004)**:

- Keyboard alternatives for move operations
- Clear aria labels for slots/cards
- State never color-only

---

### 2.2 Conflict and Lock Behaviors

- Locked plan: slots visually disabled + explicit text/icon indicator
- Deleted/orphaned recipe: preserve card shell with “Recipe unavailable” label

**Why**: preserves plan integrity while communicating mutation constraints.

---

## 3. Plan Creation Pattern

### 3.1 Progressive Setup (Wizard-lite)

Recommended setup sequence for `plan-create`:

1. Date range + plan name
2. Meal slot defaults
3. Optional preferences/goals
4. Create empty plan

This supports both quick manual setup and premium AI seeding.

---

### 3.2 Family Sizing Control

At assignment or slot level, support serving multipliers and household-size presets.

**Traceability note**: family sizing is implied by `servings` in `plan.md` and domain brief, but not a dedicated FR in `spec.md`.

---

## 4. Templates and Recurrence

### 4.1 Plan Templates

Template UX for `plan-templates` should include:

- Save current plan as template
- Apply template from a chosen start date
- Preview before apply

**Traceability note**: templates appear as open question in `plan.md`; include as conditional UX pending explicit scope confirmation.

---

### 4.2 Recurring Meals

Recurring rules (e.g., “every Monday lunch”) reduce repetitive planning.

Pattern suggestion:

- Slot action: “Repeat...”
- Frequency options: weekly/biweekly/custom
- Conflict handling for occupied slots

**Traceability note**: no explicit FR currently; treat as candidate enhancement unless promoted during revalidation.

---

## 5. Nutrition and Goal Feedback

### 5.1 Daily/Weekly Nutrition Panels

Nutrition summary panel should show:

- Daily totals by macro
- Weekly aggregates
- Optional goal progress bars (if goal data available)

Maps directly to FR-024 and 003/009 dependencies.

---

### 5.2 Goal-Aware Warnings

When targets are present, show neutral guidance:

- “High carb vs goal” indicator
- “Low protein day” hint

No blocking; maintain planner flow.

---

## 6. Leftovers and Waste Optimization

### 6.1 Leftover-Aware Scheduling

UI affordances:

- “Use leftovers” quick action when similar recipe exists previous day
- Serving carry-forward hints

---

### 6.2 Waste Optimization Review

For FR-027 premium flow, pattern should be review-first:

1. User requests optimization
2. System suggests swaps/reorder
3. User approves per suggestion or bulk apply

Avoid silent plan rewrites.

---

## 7. Shopping Handoff

### 7.1 Explicit Manifest Review

Before handing off to 007 grocery-list flow, show:

- Date range included
- Estimated line-item count
- Dedupe note
- Lock/finalize option

Maps to SC-008 end-to-end workflow target.

---

## Pattern Cross-Reference

| Pattern                              | Primary FR/SC  | Supporting Source                |
| ------------------------------------ | -------------- | -------------------------------- |
| Weekly/monthly planner views         | FR-022         | `spec.md`, `plan.md`             |
| Drag-drop assignment                 | FR-023         | `plan.md` §4, `tasks.md` Phase 4 |
| Nutrition panel                      | FR-024         | `plan.md` §5                     |
| AI suggestion/auto-plan/waste review | FR-025/026/027 | `spec.md` premium scenarios      |
| Shopping handoff + finalize          | SC-008         | `spec.md`, `tasks.md` Phase 5/7  |

## WARNING: Explicit Scope Gaps

- Recurring meals and templates have strong UX value but are not explicit FRs in `spec.md`.
- Family sizing and leftovers UX are modeled through existing fields and FR-027 intent; dedicated FRs may be needed for deterministic traceability.
