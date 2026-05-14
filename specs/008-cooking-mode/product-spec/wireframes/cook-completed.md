# Wireframe: Cook Completed

**Branch**: `008-cooking-mode` | **Date**: 2026-05-09
**FRs**: [FR-033](../../spec.md#fr-033), [FR-035](../../spec.md#fr-035)

---

## ASCII Wireframe

```
+--------------------------------------------------+
|                ✅ Recipe Complete                |
+--------------------------------------------------+
|                                                  |
| You finished all 8 steps.                        |
| Total active cooking session: 42m                |
| Timers completed: 3                              |
|                                                  |
| [View recipe summary]                             |
| [Cook again]                                      |
| [Exit cooking mode]                               |
|                                                  |
| Screen wake lock released                         | <- FR-035 cleanup behavior
|                                                  |
+--------------------------------------------------+
```

---

## Interaction Notes

- Exiting completion screen should always release wake-lock state.
- Completion UI should provide clear next actions without forcing immediate navigation.
