# Wireframe: Cook Ingredients Panel

**Branch**: `008-cooking-mode` | **Date**: 2026-05-09
**FRs**: [FR-032](../../spec.md#fr-032)

---

## Scope Warning

Ingredient checkoff is requested domain scope but not an explicit canonical FR in `spec.md`. This wireframe is documented for revalidation review.

---

## ASCII Wireframe

```
+--------------------------------------------------+
| Step 4 of 8                        [Ingredients] |
+--------------------------------------------------+
|                                                  |
| "Add chopped basil and parmesan, then stir."    |
|                                                  |
|                     [Open panel ▶]               |
|                                                  |
+------------------ Ingredients Panel -------------+
| [X] Basil leaves (2 tbsp)                        |
| [ ] Parmesan (50 g)                              |
| [ ] Olive oil (1 tbsp)                           |
| [ ] Salt (pinch)                                 |
|                                                  |
| [Mark all for this step] [Reset]                 |
+--------------------------------------------------+
```

---

## Interaction Notes

- Panel is collapsible and must not obscure navigation controls.
- Checked state uses checkbox icon + label for accessibility.
- Designed for one-handed/knuckle taps with large hit targets.
