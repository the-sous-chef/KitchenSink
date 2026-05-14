# Tech Stack Rationale: Meal Planning

**Branch**: `006-meal-planning` | **Date**: 2026-05-09
**Status**: Complete | **Sources**: [research.md](../research.md), [plan.md](../plan.md), [tasks.md](../tasks.md)

---

## Overview

Feature 006 stack choices emphasize planner interactivity, deterministic nutrition aggregation, and premium AI workflows while preserving compatibility with existing Sous Chef architecture.

---

## Frontend Planner: React + `@dnd-kit`

### Choice

`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for drag-drop scheduling.

### Rationale

- Explicitly selected in `research.md` RQ-4.
- Explicitly planned and tasked in `tasks.md` Phase 4.
- Good control for keyboard accessibility and custom sensors.

### Trade-offs

| Trade-off                                       | Mitigation                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| More assembly work vs turnkey scheduler widgets | Keep domain-specific composition (`MealPlanCalendar`, slots, sidebar) from `plan.md` |
| Keyboard/a11y complexity                        | Enforce NFR-003 test queries and interaction tests                                   |

---

## Calendar View Strategy

### Choice

Domain-driven planner components over heavy monolithic calendar framework.

### Rationale

- `plan.md` already defines slot-centric component architecture.
- Weekly/monthly behavior can share slot primitives.
- Keeps meal semantics explicit (meal-type slots, lock state, orphan state).

### Trade-offs

| Trade-off                                | Mitigation                                   |
| ---------------------------------------- | -------------------------------------------- |
| Custom rendering effort                  | Reuse slot/card primitives across week/month |
| Recurrence/templates need extra modeling | Stage behind revalidation if not FR-promoted |

---

## Backend and Persistence

### Choice

PostgreSQL tables and Drizzle models for `meal_plans`, `meal_plan_entries`, `meal_plan_nutrition`.

### Rationale

- Directly specified in `plan.md` and decomposed in `tasks.md` Phase 1.
- Strong relational fit for date + meal-slot assignments.
- Supports indexed date-range queries and deterministic summaries.

### Trade-offs

| Trade-off                        | Mitigation                                                       |
| -------------------------------- | ---------------------------------------------------------------- |
| Aggregation costs on large plans | Snapshot/denormalized nutrition strategy from `research.md` RQ-7 |
| Recipe deletion integrity        | `orphaned` marker behavior in tasks                              |

---

## Nutrition Aggregation Pipeline

### Choice

Hybrid strategy: per-entry nutrition snapshots + daily/weekly rollups.

### Rationale

- Backed by `research.md` RQ-7 recommendation.
- Needed for FR-024 and SC-008 responsiveness.
- Reduces expensive joins during planner rendering.

### Trade-offs

| Trade-off                              | Mitigation                                        |
| -------------------------------------- | ------------------------------------------------- |
| Snapshot staleness when recipes change | async recalculation tasks; stale marker if needed |
| Additional write complexity            | isolate in nutrition service + queued jobs        |

---

## Async/Resilience Layer

### Choice

SQS-style asynchronous recalculation and AI workflows (as allowed by existing stack).

### Rationale

- `plan.md` resilience section calls for async retries for external dependencies.
- Keeps entry mutation latency low while updating nutrition eventually.

### Trade-offs

| Trade-off            | Mitigation                                                    |
| -------------------- | ------------------------------------------------------------- |
| Eventual consistency | explicit UI “updating nutrition” state                        |
| Operational overhead | bounded retries + DLQ conventions inherited from 001 patterns |

---

## AI Integration (Premium)

### Choice

Use feature 005 AI integration as external service boundary for:

- FR-025 suggestions
- FR-026 full plan generation
- FR-027 waste optimization

### Rationale

- Maintains separation of concerns and provider abstraction.
- Premium gating can be enforced before AI call path.

### Trade-offs

| Trade-off                | Mitigation                                   |
| ------------------------ | -------------------------------------------- |
| Latency/timeout variance | async patterns + user-visible pending states |
| Non-deterministic output | review-and-apply UX, never silent overwrites |

---

## Stack Mapping to Research Questions

| RQ   | Decision                                        |
| ---- | ----------------------------------------------- |
| RQ-4 | `@dnd-kit` for drag-drop                        |
| RQ-5 | Calendar components with domain composition     |
| RQ-6 | 3-table meal-planning relational model          |
| RQ-7 | Snapshot + rollup nutrition strategy            |
| RQ-8 | 001 recipe consumption + 007 grocery handoff    |
| RQ-9 | 003 USDA nutrition + 009 nutrition-plan linkage |

## WARNING: Explicit Requirement Gaps

- Recurring meals, templates, and family-sizing controls are present in research/domain expectations, but `spec.md` defines FRs only for 022..027.
- These items are represented as implementation/UX patterns, not asserted as mandatory requirements.
