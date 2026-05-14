# Wireframe: Plan Create (Web)

**Branch**: `006-meal-planning` | **Date**: 2026-05-09
**FRs**: [FR-022](../../spec.md#functional-requirements), [NFR-003](../../spec.md#non-functional-requirements-constitution-derived)

---

## ASCII Wireframe

```
+-----------------------------------------------------------------------------------------+
| Create Meal Plan                                                                        |
+-----------------------------------------------------------------------------------------+
| Step 1: Basics                                                                          |
| Plan name *                              [ Family Week 19                              ] |
| Start date *                             [ 2026-05-11 ]                                  |
| End date *                               [ 2026-05-17 ]                                  |
| Plan type                                [ Weekly ▼ ]                                    |
|                                                                                          |
| Step 2: Meal Slots                                                                       |
| [x] Breakfast   [x] Lunch   [x] Dinner   [x] Snack                                      |
|                                                                                          |
| Step 3: Optional Preferences                                                             |
| Nutrition goals (optional)             [ Use linked nutrition plan ▼ ]                  |
| Family size preset (inferred)          [ 4 people ▼ ]                                   |
|                                                                                          |
| [Cancel]                                                     [Create Plan]              |
+-----------------------------------------------------------------------------------------+
```

## Interaction Notes

- Required fields are explicit and validated before plan creation.
- “Family size preset” is shown as inferred domain behavior and may map to serving defaults.
