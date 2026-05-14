# Wireframe: Nutrition Dashboard

**Branch**: `009-nutrition-planning` | **Date**: 2026-05-09
**FRs**: `FR-036`, `FR-037`, `NFR-004`

---

## ASCII Wireframe

```
+------------------------------------------------------+
| [User: Riley]                      [Week Toggle v]   |
+------------------------------------------------------+
|   Daily Target Progress                                |
|                                                        |
|        ( Calorie Ring  1,980 / 2,200 )               |
|             Status: [● On Track]                      |
|                                                        |
|  Protein  [███████████░░] 150g / 165g   [Under]       |
|  Carbs    [█████████████░] 210g / 220g  [Near]        |
|  Fat      [██████████░░░░] 60g / 73g    [Under]       |
|                                                        |
|  [Link Meal Plan]  [Adjust Goal]  [View Breakdown]    |
+------------------------------------------------------+
| Compliance Cards                                       |
|  +----------------+  +----------------+               |
|  | Planned vs Act |  | Swap Guidance  |               |
|  | Δ -15g protein |  | 2 suggestions  |               |
|  +----------------+  +----------------+               |
+------------------------------------------------------+
```

---

## Interaction Notes

- Ring is calories; bars are macro components.
- Every status has text labels (“On Track”, “Under”, “Over”) to satisfy non-color-only guidance.
- “Swap Guidance” card appears only when premium entitlement and deviation threshold are met (`FR-039`).
