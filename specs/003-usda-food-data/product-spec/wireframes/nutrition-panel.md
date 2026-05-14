# Wireframe: Nutrition Panel (Recipe Context)

**Branch**: `003-usda-food-data` | **Date**: 2026-05-09
**FRs**: FR-002, FR-028, SC-008

---

## ASCII Wireframe

```
+--------------------------------------------------------------------------+
| Nutrition Panel                                                            |
+--------------------------------------------------------------------------+
| Serving basis: [per 100g ▼] [per serving ▼]                               |
|                                                                            |
| Total (resolved ingredients only):                                         |
| Calories  412 kcal   Protein  26g   Carbs  34g   Fat  18g                |
|                                                                            |
| Ingredient contribution                                                    |
| - Chicken breast (FDC 171077): 120 kcal / 100g                            |
| - Olive oil (FDC 4053): 884 kcal / 100g                                   |
| - Gochujang: pending (not yet included)                                    |
|                                                                            |
| Status legend:                                                             |
| [Fetched ✅] [Pending ⏳] [Not Found ⚠️] [Failed ❌]                         |
+--------------------------------------------------------------------------+
```

## Notes

- Panel reflects persisted nutrient values without ingest-time transformation.
- Unit-display controls are UX aids; explicit conversion FR is currently warning-tracked.
