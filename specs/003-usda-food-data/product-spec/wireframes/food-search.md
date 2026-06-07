# Wireframe: Food Search (Web)

**Branch**: `003-usda-food-data` | **Date**: 2026-05-09
**FRs**: FR-008, FR-009, FR-010

---

## ASCII Wireframe

```
+--------------------------------------------------------------------------+
|  Commise Food Search                              [User ▼] [Settings]  |
+--------------------------------------------------------------------------+
|  Q Search foods... (local store only)                                      |
|                                                                            |
|  Filters: [Data Type ▼] [Brand ▼] [Has Macros ▼] [Clear]                  |
|                                                                            |
|  Showing 24 local matches for "chicken"                                   |
|                                                                            |
|  +--------------------------------------------------------------------+   |
|  | Chicken, broilers or fryers, breast, meat only, raw               |   |
|  | Foundation | 120 kcal | P 22g | C 0g | F 2.6g                     |   |
|  | Source: USDA FDC 171077                     [Select] [View detail] |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|  +--------------------------------------------------------------------+   |
|  | Chicken breast deli slices                                           |   |
|  | Branded (Brand: Example Foods) | 90 kcal | P 18g | C 2g | F 1g     |   |
|  | Source: USDA FDC 203445                     [Select] [View detail] |   |
|  +--------------------------------------------------------------------+   |
|                                                                            |
|  [No USDA network call in this search flow]                               |
+--------------------------------------------------------------------------+
```

## Notes

- Search is local-only; no USDA pass-through (FR-009).
- Results are relevance-ranked and typo tolerant (FR-010).
- Data-type + brand cues support disambiguation quality.
