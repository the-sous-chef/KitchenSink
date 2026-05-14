# Wireframe: Nutrition Meal Breakdown

**Branch**: `009-nutrition-planning` | **Date**: 2026-05-09
**FRs**: `FR-037`, `FR-039`, `SC-010`

---

## ASCII Wireframe

```
+--------------------------------------------------------------+
| Meal Breakdown — Tue 2026-06-09                               |
+--------------------------------------------------------------+
| Targets: 2200 kcal | P 165g | C 220g | F 73g                  |
| Actual : 2100 kcal | P 150g | C 235g | F 62g                  |
| Delta  : -100 kcal | -15g   | +15g   | -11g                   |
+--------------------------------------------------------------+
| Meals                                                         |
| Breakfast  480 kcal  P30 C55 F18   [On Track]                |
| Lunch      620 kcal  P38 C70 F20   [Carb High]               |
| Dinner     700 kcal  P52 C80 F17   [Protein Low]             |
| Snacks     300 kcal  P30 C30 F7    [On Track]                |
+--------------------------------------------------------------+
| Suggested Adjustments (Premium)                               |
| 1) Swap Lunch side → lower-carb alternative   ΔC -12g         |
| 2) Add high-protein snack                      ΔP +14g         |
| [Apply Swap] [Dismiss]                                         |
+--------------------------------------------------------------+
```

---

## Interaction Notes

- Breakdown rows are sourced from linked meal-plan nutrition rollups.
- Adjustment cards are the primary inline expression of `FR-039`.
- Status labels and icons must remain explicit and not color-only.
