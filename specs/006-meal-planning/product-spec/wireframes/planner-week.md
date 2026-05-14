# Wireframe: Planner Week (Web)

**Branch**: `006-meal-planning` | **Date**: 2026-05-09
**FRs**: [FR-022](../../spec.md#functional-requirements), [FR-023](../../spec.md#functional-requirements), [FR-024](../../spec.md#functional-requirements), [NFR-003](../../spec.md#non-functional-requirements-constitution-derived), [NFR-004](../../spec.md#non-functional-requirements-constitution-derived)

---

## ASCII Wireframe

```
+------------------------------------------------------------------------------------------------+
| Sous Chef Planner                                           [Week View] [Month View] [Profile] |
+------------------------------------------------------------------------------------------------+
| Plan: Family Week 19 (May 11 - May 17)   [AI Suggest] [Auto-Generate] [Optimize Waste]         |
| [Status: Editable ●]  [Lock Plan]                                                                |
+------------------------------------------------------------------------------------------------+
| Recipe Sidebar                          | Mon        Tue        Wed        Thu        Fri ...   |
| +------------------------------------+  | +--------+ +--------+ +--------+ +--------+          |
| | Search recipes...                  |  | | Bfast  | | Bfast  | | Bfast  | | Bfast  |          |
| +------------------------------------+  | | [drop]  | | [card]  | | [drop]  | | [card]  |       |
| | [Drag] Veggie Burrito              |  | +--------+ +--------+ +--------+ +--------+          |
| | [Drag] Lemon Chicken Tray Bake     |  | | Lunch  | | Lunch  | | Lunch  | | Lunch  |          |
| | [Drag] Leftover Chili Bowls        |  | | [card]  | | [drop]  | | [card]  | | [drop]  |       |
| | [Drag] Pasta Primavera             |  | +--------+ +--------+ +--------+ +--------+          |
| +------------------------------------+  | | Dinner | | Dinner | | Dinner | | Dinner |          |
|                                        | | [card]  | | [card]  | | [drop]  | | [card]  |       |
|                                        | +--------+ +--------+ +--------+ +--------+          |
|                                        | | Snack  | | Snack  | | Snack  | | Snack  |          |
|                                        | | [drop]  | | [drop]  | | [card]  | | [drop]  |       |
|                                        | +--------+ +--------+ +--------+ +--------+          |
+----------------------------------------+--------------------------------------------------------+
| Nutrition Summary (aria-label="Nutrition Summary")                                            |
| Daily: 2,150 kcal | 132g P | 210g C | 79g F     Weekly: 14,600 kcal                           |
| Goal delta: Protein +8g ▲ (icon + text), Carbs -12g ▼ (icon + text)                           |
+------------------------------------------------------------------------------------------------+
```

## Interaction Notes

- Empty slots expose accessible labels: `Add recipe to {mealType} on {date}`.
- Drag cards expose accessible label: `Drag {recipeName} to meal slot`.
- Slot state uses icon + text (not color-only) for lock/orphan/complete states.
