# Wireframe: Plan Templates (Web)

**Branch**: `006-meal-planning` | **Date**: 2026-05-09
**Traceability**: Inferred from domain brief, `research.md`, and `plan.md` open question (no explicit FR ID yet)

---

## ASCII Wireframe

```
+-------------------------------------------------------------------------------------------+
| Plan Templates                                                                            |
+-------------------------------------------------------------------------------------------+
| [Search templates...]                                                        [Create New] |
|                                                                                           |
| +---------------------------+  +---------------------------+  +--------------------------+ |
| | Weeknight Family Basics   |  | High-Protein Workweek     |  | Leftover-Friendly Week   | |
| | 7 days • 28 slots         |  | 7 days • 28 slots         |  | 7 days • 28 slots        | |
| | Last used: 2 weeks ago    |  | Last used: never          |  | Last used: yesterday     | |
| | [Preview] [Apply]         |  | [Preview] [Apply]         |  | [Preview] [Apply]        | |
| +---------------------------+  +---------------------------+  +--------------------------+ |
|                                                                                           |
| Apply Template Modal                                                                      |
| Start date: [ 2026-06-01 ]   Repeat rule: [ None ▼ | Weekly | Biweekly ]                |
| Overwrite existing assigned slots? [No ▼]                                                 |
| [Cancel] [Apply Template]                                                                  |
+-------------------------------------------------------------------------------------------+
```

## Interaction Notes

- Template apply should be review-first; avoid silent overwrites.
- Recurrence shown here is inferred UX and not currently a canonical FR requirement.

## WARNING

Template and recurring support must remain conditional until promoted to explicit FRs during revalidation.
