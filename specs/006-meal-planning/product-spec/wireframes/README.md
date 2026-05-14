# Wireframes: Meal Planning

**Branch**: `006-meal-planning`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](../product-spec.md), [spec.md](../../spec.md)

---

## Index

| File                                                   | Description                                                          | Key FRs/SC             |
| ------------------------------------------------------ | -------------------------------------------------------------------- | ---------------------- |
| [planner-week.md](./planner-week.md)                   | Weekly drag-drop planner grid with nutrition side panel              | FR-022, FR-023, FR-024 |
| [planner-month.md](./planner-month.md)                 | Monthly planner overview with day-level drill-in and load indicators | FR-022, FR-023         |
| [plan-create.md](./plan-create.md)                     | Plan creation flow with date range, slots, and optional goal setup   | FR-022                 |
| [plan-templates.md](./plan-templates.md)               | Template and recurring-plan selection/apply surface                  | Inferred (see WARNING) |
| [plan-shopping-handoff.md](./plan-shopping-handoff.md) | Plan finalization and grocery handoff flow                           | SC-008                 |

---

## FR Reference Key

- **FR-022**: Create meal plans over configurable date ranges with customizable meal slots
- **FR-023**: Assign recipes from collection to meal slots
- **FR-024**: Display daily and weekly nutrition summaries
- **FR-025**: AI meal suggestions (premium)
- **FR-026**: Auto-generate complete meal plans (premium)
- **FR-027**: Waste optimization suggestions (premium)
- **SC-008**: Full meal-plan-to-grocery workflow under 10 minutes for 7-day plan
- **NFR-003**: Accessible names for UI controls
- **NFR-004**: State is not color-only

## WARNING

`plan-templates.md` includes template and recurring patterns from domain requirements and research augmentation. `spec.md` does not currently define explicit FR IDs for template persistence/recurrence, so this wireframe is marked inferred until revalidation confirms promotion to canonical requirements.
