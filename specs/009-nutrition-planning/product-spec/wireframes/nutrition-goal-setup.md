# Wireframe: Nutrition Goal Setup

**Branch**: `009-nutrition-planning` | **Date**: 2026-05-09
**FRs**: `FR-036`, `NFR-003`, `NFR-004`

---

## ASCII Wireframe

```
+------------------------------------------------------+
| Step 2 of 4: Target Setup                             |
+------------------------------------------------------+
| Goal Type:  ( ) Lose   (x) Maintain   ( ) Gain        |
| Activity:   [Moderate v]                               |
|                                                        |
| Daily Calories: [2200]                                 |
| Protein (g):   [165]                                   |
| Carbs (g):     [220]                                   |
| Fat (g):       [73 ]                                   |
|                                                        |
| Optional Diet Profile                                  |
| [ ] Keto  [ ] Vegan  [ ] Allergy-Aware  [ ] Medical   |
|                                                        |
| Preview:                                              |
|  Protein 30%  | Carbs 40% | Fat 30%                   |
|  [Info] Macro split within standard range             |
|                                                        |
| [Back]                              [Save Targets]     |
+------------------------------------------------------+
```

---

## Interaction Notes

- Save action persists FR-036 target values.
- Optional diet profile chips are augmentation-friendly metadata and should not imply new FR unless promoted upstream.
- Fields require explicit labels for accessibility selectors.
