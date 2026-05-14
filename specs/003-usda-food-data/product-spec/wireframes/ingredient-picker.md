# Wireframe: Ingredient Picker (Recipe Editor)

**Branch**: `003-usda-food-data` | **Date**: 2026-05-09
**FRs**: FR-003, FR-004, FR-011, FR-013, FR-033

---

## ASCII Wireframe

```
+--------------------------------------------------------------------------+
| Recipe Editor — Ingredients                                               |
+--------------------------------------------------------------------------+
| 1) [200] [g] [ chicken breast________________ ] [Search] [Matched ✅]     |
|    -> Chicken, broilers breast raw (Foundation, FDC 171077)             |
|                                                                            |
| 2) [1] [tbsp] [ gochujang____________________ ] [Search] [Pending ⏳]      |
|    -> status: pending (ETA ~25s) [Check status]                           |
|                                                                            |
| 3) [10] [g] [ custom spice blend_____________ ] [Search] [Unmatched ⚠️]    |
|    -> no local match yet; keep as freeform ingredient                     |
|                                                                            |
| [Add ingredient row]                                                       |
+--------------------------------------------------------------------------+
```

## Notes

- Misses return pending and trigger queue event path.
- Duplicate pending requests are suppressed.
- Polling control updates status per row without blocking recipe save.
