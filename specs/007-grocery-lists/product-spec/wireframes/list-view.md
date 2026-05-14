# Wireframe: Grocery List View (Mobile)

**Branch**: `007-grocery-lists` | **Date**: 2026-05-09
**FRs**: [FR-028](../../spec.md#feature-requirements), [FR-029](../../spec.md#feature-requirements), [NFR-003](../../spec.md#non-functional-requirements), [NFR-004](../../spec.md#non-functional-requirements)

---

## ASCII Wireframe

```
+--------------------------------------------------+
|  [< Meal Plan]   Grocery List: Week of May 11    |
+--------------------------------------------------+
|  Progress: 8 / 24 picked   [Grouped View] [Sort] |
|  To buy: 16   Already have: 4   Picked: 8         |
+--------------------------------------------------+
|  Q  Search list items...               [+ Add]    |
+--------------------------------------------------+
|                                                  |
|  [ ] Yellow onion                3 cups          |
|      [Pantry toggle] Already have  (off)         | <- FR-029
|      [Swipe right: Picked] [Swipe left: Pantry]  |
|                                                  |
|  [x] Garlic cloves               6 cloves        |
|      Picked ✓                                     |
|                                                  |
|  [ ] Olive oil                   500 ml          |
|      [Pantry toggle] Already have  (on)          |
|      Icon: 🏠  Label: "Already have"              | <- NFR-004
|                                                  |
|  [ ] Chicken breast              1.2 kg          |
|      From 3 recipes  [Details]                  | <- FR-028 aggregation transparency
|                                                  |
+--------------------------------------------------+
|  [Generate again] [Share] [Order Groceries]      |
+--------------------------------------------------+
```

---

## Interaction Notes

- Every swipe action has equivalent accessible button/toggle control (NFR-003).
- Pantry state uses text + icon + style (NFR-004).
- Aggregated items expose contribution details to explain summed quantities (FR-028).
