# Wireframes: Grocery Lists & Online Ordering

**Branch**: `007-grocery-lists`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](../product-spec.md), [spec.md](../../spec.md)

---

## Index

| File                                                   | Description                                                                  | Key FRs                        |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------ |
| [list-view.md](./list-view.md)                         | Main grocery list with progress, pantry toggles, and manual add entry points | FR-028, FR-029                 |
| [list-grouped-by-aisle.md](./list-grouped-by-aisle.md) | Grouped shopping mode optimized for in-store movement                        | FR-028, FR-029                 |
| [list-share.md](./list-share.md)                       | Collaboration/share surface for household sync (domain-requested pattern)    | Warning-level (no explicit FR) |
| [list-add-item.md](./list-add-item.md)                 | Fast add-item bottom sheet with parser feedback and voice shortcut           | FR-028 support pattern         |
| [list-from-meal-plan.md](./list-from-meal-plan.md)     | Generation flow from meal plan + store setup/order CTA                       | FR-028, FR-030, FR-031         |

---

## FR Reference Key

- **FR-028**: Generate consolidated grocery list from meal plan with aggregation + deduplication
- **FR-029**: Mark items as "already have" to exclude from shopping list
- **FR-030**: Configure supported grocery store integrations
- **FR-031**: Map ingredients to store products and facilitate order creation (premium)
- **NFR-003**: Interactive elements accessible via role/label
- **NFR-004**: State not conveyed by color alone

---

## Notes

- Required wireframes for this bootstrap are exactly: `list-view`, `list-grouped-by-aisle`, `list-share`, `list-add-item`, `list-from-meal-plan`.
- Sharing appears in wireframes due to requested domain context; current `spec.md` lacks explicit sharing FR and is tracked as warning-level in verification.
