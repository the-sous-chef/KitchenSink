# Wireframe: Add Item to Grocery List (Mobile Bottom Sheet)

**Branch**: `007-grocery-lists` | **Date**: 2026-05-09
**FRs**: [FR-028](../../spec.md#feature-requirements), [FR-029](../../spec.md#feature-requirements), [NFR-003](../../spec.md#non-functional-requirements)

---

## ASCII Wireframe

```
+--------------------------------------------------+
|  Add Item                                        |
+--------------------------------------------------+
|  Item text                                       |
|  _____________________________________________   |
|  e.g., "2 avocados"                             |
|                                                  |
|  [Mic] Voice add                                |
|                                                  |
|  Parsed preview                                  |
|  Quantity: 2                                     |
|  Unit: each                                      |
|  Name: avocado                                   |
|  Category: Produce [v]                           |
|                                                  |
|  [ ] Mark as already have                        |
|                                                  |
|  Suggestions                                     |
|  [Avocado] [Avocado oil] [Mini avocados]         |
|                                                  |
+--------------------------------------------------+
|  [Cancel]                          [Add to List] |
+--------------------------------------------------+
```

---

## Interaction Notes

- Input and action controls are explicitly labeled for assistive queries (NFR-003).
- Parser uncertainty should never block add; user can submit as raw text if needed.
- "Mark as already have" supports immediate pantry semantics (FR-029).
