# Wireframes: Nutrition Planning

**Branch**: `009-nutrition-planning`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](../product-spec.md), [spec.md](../../spec.md)

---

## Index

| File                                                             | Description                                                        | Key FRs                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------- |
| [nutrition-dashboard.md](./nutrition-dashboard.md)               | Daily overview with calorie ring, macro bars, and compliance cards | FR-036, FR-037             |
| [nutrition-goal-setup.md](./nutrition-goal-setup.md)             | Multi-step target setup and adjustment flow                        | FR-036                     |
| [nutrition-meal-breakdown.md](./nutrition-meal-breakdown.md)     | Meal-level rollup with planned vs actual deltas                    | FR-037                     |
| [nutrition-weekly.md](./nutrition-weekly.md)                     | Weekly trend and adherence visualization                           | FR-037                     |
| [nutrition-deficiency-alert.md](./nutrition-deficiency-alert.md) | Informational deficiency alert surface                             | Warning-level augmentation |

---

## FR Reference Key

- **FR-036**: Create nutrition plans with daily caloric and macronutrient targets.
- **FR-037**: Link meal plans and display compliance analysis.
- **FR-038**: Trainer-client nutrition plan creation (premium).
- **FR-039**: Recipe swap suggestions for target alignment (premium).
- **NFR-003**: Accessible names queryable by role/label.
- **NFR-004**: Color is not sole state signal.
- **SC-010**: Nutritional calculation accuracy within 5%.

---

## Notes

- Requested wireframe set from task brief is implemented exactly as five screens.
- Deficiency alert wireframe is retained as augmentation candidate and explicitly marked warning-level because no direct FR exists in canonical spec.
