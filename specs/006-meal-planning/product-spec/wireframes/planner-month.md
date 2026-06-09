# Wireframe: Planner Month (Web)

**Branch**: `006-meal-planning` | **Date**: 2026-05-09
**FRs**: [FR-022](../../spec.md#functional-requirements), [FR-023](../../spec.md#functional-requirements), [NFR-003](../../spec.md#non-functional-requirements-constitution-derived), [NFR-004](../../spec.md#non-functional-requirements-constitution-derived)

---

## ASCII Wireframe

```
+-----------------------------------------------------------------------------------------------+
| Commise Planner                                        [Week View] [Month View ✓] [Profile] |
+-----------------------------------------------------------------------------------------------+
| Plan: June Family Plan (Jun 1 - Jun 30)   [Filter meal type] [Jump to Today]                 |
+-----------------------------------------------------------------------------------------------+
| Sun            Mon            Tue            Wed            Thu            Fri            Sat |
| +------------+ +------------+ +------------+ +------------+ +------------+ +------------+ +--+
| | 1          | | 2          | | 3          | | 4          | | 5          | | 6          | |7 |
| | B:1 L:1    | | B:1 L:1    | | B:0 L:1    | | B:1 L:1    | | B:1 L:0    | | B:1 L:1    | |..|
| | D:1 S:0    | | D:1 S:1    | | D:1 S:0    | | D:0 S:1    | | D:1 S:1    | | D:1 S:0    | |  |
| | [Open Day] | | [Open Day] | | [Open Day] | | [Open Day] | | [Open Day] | | [Open Day] | |  |
| +------------+ +------------+ +------------+ +------------+ +------------+ +------------+ +--+
| ... month grid continues ...                                                                  |
+-----------------------------------------------------------------------------------------------+
| Day Detail Drawer (for selected date)                                                         |
| Breakfast [drop]  Lunch [card: Lemon Chicken]  Dinner [card: Pasta Primavera]  Snack [drop] |
| [Apply AI suggestions] [Mark leftovers] [Copy to next week]                                   |
+-----------------------------------------------------------------------------------------------+
```

## Interaction Notes

- Monthly cells prioritize density and quick status scanning.
- Each day remains drillable into slot-level actions consistent with weekly planner model.
- Any status badge includes icon+text for accessibility/non-color-only compliance.
