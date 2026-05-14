# Product Spec: Meal Planning

**Branch**: `006-meal-planning`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [spec.md](../spec.md)

---

## Index

This directory contains Product Forge v1.3.0 product-spec artifacts for feature 006.

| Artifact      | File                                  | Description                                                                                                              |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Product Spec  | [product-spec.md](./product-spec.md)  | Vision, personas, epics, MoSCoW story map with FR traceability, and out-of-scope list for meal planning.                 |
| User Journeys | [user-journey.md](./user-journey.md)  | End-to-end user flows for planner setup, scheduling, premium AI assist, and grocery handoff, with FR references.         |
| Wireframes    | [wireframes/](./wireframes/README.md) | ASCII wireframes for requested screens: planner-week, planner-month, plan-create, plan-templates, plan-shopping-handoff. |
| Metrics       | [metrics.md](./metrics.md)            | Story-level product metrics tied to FR-022..027 and SC-008.                                                              |

---

## Quick Links

- [product-spec.md](./product-spec.md) — scope and story prioritization
- [user-journey.md](./user-journey.md) — user flow behavior and edge handling
- [wireframes/](./wireframes/README.md) — key UI structures
- [metrics.md](./metrics.md) — per-story measurement model
- [../spec.md](../spec.md) — canonical FR/NFR/SC IDs
- [../plan.md](../plan.md) — architecture and API details
- [../v-model/requirements.md](../v-model/requirements.md) — REQ-NNN decomposition

---

## Artifact Cross-Reference

```
product-spec.md
    |
    +-- MoSCoW stories (US-006-001..)
    |       Each story references FR-022..027
    |
    +-- Personas (Household Planner / Goal-Focused Planner / Premium Optimizer)
    |
    v
user-journey.md
    |
    +-- Core journey (manual planning)
    +-- Premium AI journey
    +-- Handoff journey (to grocery)
    |
    v
wireframes/
    |
    +-- planner-week.md
    +-- planner-month.md
    +-- plan-create.md
    +-- plan-templates.md
    +-- plan-shopping-handoff.md
```

---

## Traceability Summary

- Functional coverage target: FR-022, FR-023, FR-024, FR-025, FR-026, FR-027.
- Quality constraints reflected: NFR-001, NFR-002, NFR-003, NFR-004.
- Outcome target reflected: SC-008.

## WARNING

Templates/recurring meals/family sizing/leftovers appear in domain goals and this product-spec layer, but only FR-022..027 are canonical in `spec.md`. Items beyond explicit FR text are marked as inferred and require revalidation decision if they should become net-new FRs.
