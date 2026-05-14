# Wireframe: Cook Timer (Active Timers Panel)

**Branch**: `008-cooking-mode` | **Date**: 2026-05-09
**FRs**: [FR-034](../../spec.md#fr-034), [FR-033](../../spec.md#fr-033)

---

## ASCII Wireframe

```
+--------------------------------------------------+
| Active Timers                               [X]  |
+--------------------------------------------------+
|                                                  |
| +--------------------------------------------+   |
| | Simmer sauce (Step 3)            02:14     |   |
| | [Pause] [Cancel]                             |  |
| +--------------------------------------------+   |
|                                                  |
| +--------------------------------------------+   |
| | Roast vegetables (Step 5)       14:42      |   |
| | [Pause] [Cancel]                             |  |
| +--------------------------------------------+   |
|                                                  |
| +--------------------------------------------+   |
| | Dough rest (Step 2)             COMPLETE    |   |
| | 🔔 Timer finished                           |   |
| | [Dismiss] [Repeat 5m]                       |   |
| +--------------------------------------------+   |
|                                                  |
| [ + Start custom timer ]                         |
+--------------------------------------------------+

Timer completion banner (top overlay):

+--------------------------------------------------+
| 🔔 "Dough rest" complete — Step 2               |
+--------------------------------------------------+
```

---

## Interaction Notes

- Supports multiple concurrent timers.
- Completion state uses icon + text (not color-only).
- Timer panel can be opened from step screen and closed without losing active countdowns.
