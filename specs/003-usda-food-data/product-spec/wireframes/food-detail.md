# Wireframe: Food Detail (Mobile)

**Branch**: `003-usda-food-data` | **Date**: 2026-05-09
**FRs**: FR-002, FR-007, FR-028

---

## ASCII Wireframe

```
+--------------------------------------------------+
| [< Back]  Food Detail                 [Add]      |
+--------------------------------------------------+
| Chicken, broilers or fryers, breast, raw         |
| Foundation | FDC ID: 171077                      |
| Fetch status: fetched                            |
| Last synced: 2026-05-09T09:44:12Z                |
|                                                  |
| +-- Nutrition (per 100g) ----------------------+ |
| | Calories: 120 kcal                           | |
| | Protein: 22.5 g                              | |
| | Carbs: 0.0 g                                 | |
| | Fat: 2.6 g                                   | |
| | Fiber: 0.0 g                                 | |
| | Sodium: 45 mg                                | |
| +----------------------------------------------+ |
|                                                  |
| Data source: USDA FoodData Central               |
| Data type: Foundation                             |
|                                                  |
| [Use this food in ingredient row]                |
+--------------------------------------------------+
```

## Notes

- Detail data is served from local store and status endpoint semantics.
- Nutrients shown are persisted source values (SC-008 alignment).
