# Wireframe: Nutrition Deficiency Alert

**Branch**: `009-nutrition-planning` | **Date**: 2026-05-09
**Scope**: Warning-level augmentation (no direct FR in canonical spec)

---

## ASCII Wireframe

```
+--------------------------------------------------------------+
| Deficiency Insight                                            |
+--------------------------------------------------------------+
| [! ] Potential low iron intake trend detected                |
| Confidence: Medium (4 of last 7 days below target band)      |
|                                                              |
| Contributing signals:                                        |
| - Repeated low iron-source meals                             |
| - Protein target missed on 3 days                            |
|                                                              |
| Suggested actions (informational):                           |
| [View iron-rich recipe swaps]   [Review weekly breakdown]    |
| [Adjust nutrition goal]                                      |
|                                                              |
| Note: This is informational guidance, not medical diagnosis. |
+--------------------------------------------------------------+
```

---

## Interaction Notes

- Must avoid prescriptive medical advice.
- Must provide explainability (“why this alert”).
- Should remain feature-flagged until explicit FR promotion.
