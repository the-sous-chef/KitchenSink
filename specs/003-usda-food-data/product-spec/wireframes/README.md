# Wireframes: USDA Food Data Integration

**Branch**: `003-usda-food-data`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](../product-spec.md), [spec.md](../../spec.md)

---

## Index

| File                                           | Description                                                                 | Key FRs                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [food-search.md](./food-search.md)             | Search-as-you-type UI with filters, data-type badges, and relevance ranking | FR-008, FR-009, FR-010                                                       |
| [food-detail.md](./food-detail.md)             | Detailed food record view with nutrient panel and source metadata           | FR-002, FR-007, FR-028                                                       |
| [ingredient-picker.md](./ingredient-picker.md) | Recipe ingredient row picker with matched/pending/unmatched state handling  | FR-003, FR-004, FR-011, FR-013, FR-033                                       |
| [nutrition-panel.md](./nutrition-panel.md)     | Nutritional breakdown panel with per-food values and aggregate cues         | FR-002, FR-028, SC-008                                                       |
| [food-substitution.md](./food-substitution.md) | Side-by-side substitute chooser for selecting alternate food records        | FR-008, FR-010, FR-033 (warning-tracked for explicit substitution semantics) |

---

## FR Reference Key

- **FR-001**: Local-store-only request path (no direct USDA API call)
- **FR-002**: 200 responses with complete food data when fetched
- **FR-003**: 202 pending response on miss
- **FR-004**: Pending deduplication behavior
- **FR-007**: Food status endpoint semantics
- **FR-008**: Local search endpoint
- **FR-009**: No USDA call for search
- **FR-010**: Search relevance + performance
- **FR-011**: FoodRequested event on miss
- **FR-013**: Pending dedupe mechanism
- **FR-028**: Foods table schema and nutrient persistence
- **FR-033**: Polling as primary notification mechanism
- **SC-008**: Nutrient fidelity against source values
