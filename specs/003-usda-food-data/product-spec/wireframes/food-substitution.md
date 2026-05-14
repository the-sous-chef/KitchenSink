# Wireframe: Food Substitution (Disambiguation Helper)

**Branch**: `003-usda-food-data` | **Date**: 2026-05-09
**FRs**: FR-008, FR-010, FR-033

---

## ASCII Wireframe

```
+--------------------------------------------------------------------------+
| Choose a Better Match for Ingredient: "milk"                              |
+--------------------------------------------------------------------------+
| Current selection                                                         |
| [ ] Whole milk, generic (Foundation) | 61 kcal/100g | FDC 173421         |
|                                                                          |
| Suggested alternatives (local results)                                   |
| [ ] Milk, low fat 1% (Foundation)   | 42 kcal/100g | FDC 173430          |
| [ ] Milk, nonfat (Foundation)        | 34 kcal/100g | FDC 173432          |
| [ ] Almond milk unsweetened (Branded)| 13 kcal/100g | FDC 210333          |
|                                                                          |
| [Preview nutrition impact] [Apply substitution] [Cancel]                 |
|                                                                          |
| If selected food is pending/not_found:                                   |
| status shown inline and resolved via polling endpoint                    |
+--------------------------------------------------------------------------+
```

## Notes

- Uses local search and ranking behavior for alternatives.
- No standalone substitution FR exists; this screen is documented as a UX helper and tracked as warning-level gap for explicit requirement promotion.
