# Wireframe: Cook Voice Control

**Branch**: `008-cooking-mode` | **Date**: 2026-05-09
**FRs**: [FR-033](../../spec.md#fr-033), [FR-034](../../spec.md#fr-034)

---

## Scope Warning

Voice control is represented in feature narrative/research/tasks as phased scope but not as a standalone canonical FR. This wireframe documents the intended interaction shape for revalidation.

---

## ASCII Wireframe

```
+--------------------------------------------------+
| Voice Control                               [X]  |
+--------------------------------------------------+
|                                                  |
|            🎤 Listening...                       |
|                                                  |
|      Say: "next", "back", "start timer"         |
|                                                  |
| Confidence: High                                 |
| Last command: "next" ✅                          |
|                                                  |
| [Stop Listening]                                 |
|                                                  |
| Command history:                                 |
| - next (applied)                                 |
| - start timer (applied)                          |
| - move forward (not recognized)                  |
|                                                  |
| Tip: Use short command phrases                   |
+--------------------------------------------------+
```

---

## Interaction Notes

- Voice panel must clearly indicate listening on/off state.
- Unrecognized commands must provide explicit retry guidance.
- Manual controls remain primary fallback at all times.
