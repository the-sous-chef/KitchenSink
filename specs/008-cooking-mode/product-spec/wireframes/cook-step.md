# Wireframe: Cook Step (Mobile)

**Branch**: `008-cooking-mode` | **Date**: 2026-05-09
**FRs**: [FR-032](../../spec.md#fr-032), [FR-033](../../spec.md#fr-033), [FR-035](../../spec.md#fr-035)

---

## ASCII Wireframe

```
+--------------------------------------------------+
| [< Exit]            Cooking Mode            [⋯] |
+--------------------------------------------------+
| Screen awake: ON                                 | <- FR-035
|                                                  |
| Step 3 of 8                                      | <- FR-033 progress context
| ━━━━━━━━━━━━━━━━░░░░░░░░░░                       |
|                                                  |
|  "Add diced onion and cook for 3 minutes until  |
|   translucent. Stir continuously."              | <- FR-032 large readable step text
|                                                  |
| [Optional step image thumbnail]                  |
|                                                  |
| [🕐 Start 3:00 timer]                            | <- FR-034 entry point shown from step
|                                                  |
|  ◀ Prev                      Next ▶              |
| (56x56 min target)      (56x56 min target)      | <- FR-033 + large touch targets
|                                                  |
|              ● ○ ● ○ ○ ○ ○ ○                     |
+--------------------------------------------------+
```

---

## Interaction Notes

- Left/right tap zones and swipe gestures both move steps.
- Previous disabled on first step; Next disabled on last step.
- Step text scales with dynamic type while preserving layout.
