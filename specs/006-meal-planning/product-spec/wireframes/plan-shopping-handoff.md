# Wireframe: Plan Shopping Handoff (Web)

**Branch**: `006-meal-planning` | **Date**: 2026-05-09
**FRs/SC**: [SC-008](../../spec.md#measurable-outcomes), [FR-022](../../spec.md#functional-requirements), [FR-023](../../spec.md#functional-requirements), [NFR-003](../../spec.md#non-functional-requirements-constitution-derived)

---

## ASCII Wireframe

```
+-------------------------------------------------------------------------------------------+
| Finalize Plan and Send to Grocery                                                         |
+-------------------------------------------------------------------------------------------+
| Plan: Family Week 19 (May 11 - May 17)                                                    |
| Completion estimate: 8m 35s total workflow (target < 10m)                                 |
|                                                                                           |
| Included slots: 24 assigned / 28 total                                                    |
| Missing slots: 4 (Tue snack, Thu breakfast, Fri snack, Sun lunch)                         |
|                                                                                           |
| Ingredient Manifest Preview                                                                |
| - Chicken breast ............ 1.8 kg                                                       |
| - Tomatoes .................. 10                                                           |
| - Olive oil ................. 350 ml                                                       |
| - Garlic .................... 22 cloves                                                    |
| [View full deduped list]                                                                   |
|                                                                                           |
| [ ] Lock plan after handoff (prevents accidental edits)                                   |
| [ ] Include leftover carry-forward notes                                                   |
|                                                                                           |
| [Back to Planner]                                           [Send to Grocery Flow]        |
+-------------------------------------------------------------------------------------------+
```

## Interaction Notes

- Handoff entrypoint should be explicit and fast to satisfy SC-008.
- Lock action should show icon+text state in planner after completion.
- If required fields are missing, show actionable warning with direct navigation back to planner slots.
