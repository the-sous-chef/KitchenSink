# Wireframe: Grocery List Grouped by Aisle (Mobile)

**Branch**: `007-grocery-lists` | **Date**: 2026-05-09
**FRs**: [FR-028](../../spec.md#feature-requirements), [FR-029](../../spec.md#feature-requirements)

---

## ASCII Wireframe

```
+--------------------------------------------------+
|  Grocery List (Grouped)       Store: Walmart v   |
+--------------------------------------------------+
|  Optimized for store layout   [Change store]     |
+--------------------------------------------------+
|  PRODUCE                                  4 / 9   |
|  [ ] Bananas                     8                |
|  [ ] Yellow onion                3 cups           |
|  [x] Lettuce                     1 head           |
|  [ ] Avocado                     4                |
|  ...                                              |
+--------------------------------------------------+
|  DAIRY & EGGS                              2 / 5  |
|  [ ] Milk                         2 L             |
|  [x] Eggs                         12              |
|  [ ] Greek yogurt                 500 g           |
+--------------------------------------------------+
|  PANTRY                                    1 / 6  |
|  [ ] Olive oil                    500 ml          |
|  [ ] Pasta                        1 kg            |
|  [ ] Salt                         1 pack          |
+--------------------------------------------------+
|  ALREADY HAVE (collapsed)                 4 items |
|  [Show]                                          | <- FR-029 exclusion visibility
+--------------------------------------------------+
|  [Flat View] [Add Item] [Order Groceries]        |
+--------------------------------------------------+
```

---

## Interaction Notes

- Section headers show per-aisle completion ratios.
- Collapsible "Already have" section keeps exclusions visible without clutter.
- Store-optimized ordering is advisory and falls back to category grouping when mapping confidence is low.
