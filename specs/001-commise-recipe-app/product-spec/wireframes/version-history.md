# Wireframe: Version History (Web)

**Branch**: `001-commise-recipe-app` | **Date**: 2026-05-09
**FRs**: [FR-007b](../../spec.md#fr-007b), [FR-007c](../../spec.md#fr-007c), [FR-002](../../spec.md#fr-002)

---

## ASCII Wireframe

```
+--------------------------------------------------------------------------+
|  Commise                                          [Morgan ▼] [Settings]|
+--------------------------------------------------------------------------+
|                                                                          |
|  [< Back to Recipe]    Version History: Grandma's Pasta                  |
|                                                                          |
|  +--------------------------------------------+  +----------------------+ |
|  |                                            |  |                      | |
|  |  v12 (current)        2026-05-09 14:32 UTC |  |  COMPARE VERSIONS     | |
|  |  You                                    |  |  [ Compare v12 vs v8 ] | |
|  |  Changed: description, tags              |  |                      | |
|  |  [Preview this version] [Restore]       |  |  DIFF SUMMARY         | |
|  |                                            |  |  Added: 1 tag         | |
|  +--------------------------------------------+  |  Removed: 1 tag      | |
|  |                                            |  |  Modified: 2 fields  | |
|  |  v11                  2026-05-08 09:14 UTC|  |                      | |
|  |  You                                    |  |  [ Show full diff ]   | |
|  |  Changed: ingredients (added kale)        |  |                      | |
|  |  [Preview this version] [Restore]        |  +----------------------+ |
|  +--------------------------------------------+                          |
|  |                                            |                          |
|  |  v10                  2026-05-07 18:55 UTC |                          |
|  |  You (from iPhone)                         |                          |
|  |  Changed: photos (replaced hero)           |                          |
|  |  [Preview this version] [Restore]         |                          |
|  +--------------------------------------------+                          |
|  |                                            |                          |
|  |  v9                   2026-05-06 11:20 UTC |                          |
|  |  You                                    |                          |
|  |  Changed: instructions (step 3 edited)     |                          |
|  |  [Preview this version] [Restore]         |                          |
|  +--------------------------------------------+                          |
|  |                                            |                          |
|  |  v8                   2026-05-05 08:00 UTC |                          |
|  |  You                                    |                          |
|  |  Changed: title, description             |                          |
|  |  [Preview this version] [Restore]        |                          |
|  +--------------------------------------------+                          |
|  |                                            |                          |
|  |  v7                   2026-05-04 16:44 UTC |                          |
|  |  You                                    |                          |
|  |  Changed: ingredients (quantities adj.)   |                          |
|  |  [Preview this version] [Restore]         |                          |
|  +--------------------------------------------+                          |
|  |                                            |                          |
|  |  ... (3 older versions in DB)             |                          |
|  |  S3 ARCHIVE: All versions available       |                          |  <- FR-007b
|  |  [View in S3 archive]                    |                          |
|  +--------------------------------------------+                          |
|                                                                          |
+--------------------------------------------------------------------------+
```

## Layout Notes

| Zone             | Description                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| Timeline list    | Chronological (newest first); each entry shows version number, timestamp, editor, changed-fields summary |
| Current version  | Marked "(current)"; cannot be deleted or overwritten                                                     |
| Preview action   | Loads that version's content in a side-by-side or overlay view                                           |
| Restore action   | Creates a new version with the restored content (non-destructive; creates v13)                           |
| Compare versions | Select two versions for field-by-field diff; shown in right sidebar                                      |
| S3 archive note  | All versions archived to S3; link provided for operator access (FR-007b)                                 |
| Older versions   | v7-v1 still in DB; older versions queryable from S3 archive if needed                                    |

## Version Preview Modal (FR-007b)

```
+--------------------------------------------------------------------------+
|  Version 10 Preview: Grandma's Pasta                 [x] Close           |
+--------------------------------------------------------------------------+
|                                                                          |
|  Title:        Grandma's Pasta (Original)                                |
|  Description:  A family recipe passed down through three generations...  |
|  Servings:     4                                                         |
|  Prep: 15m  Cook: 30m  Total: 45m                                      |
|                                                                          |
|  +-- Ingredients at v10 ---------------------------------------------+ |
|  |  200g  Pasta (Barilla, penne)  |  420 cal                        | |
|  |  150g  Chicken breast, diced   |  165 cal                        | |
|  |  2tbsp  Olive oil              |  120 cal                        | |
|  |  4clv   Garlic, minced         |    4 cal                        | |
|  |  1 cup  Cherry tomatoes        |   25 cal                        | |
|  +----------------------------------------------------------------------+ |
|                                                                          |
|  Changed from current: 2 ingredients (quantities), 1 step               |
|                                                                          |
|  [ Keep current version ]          [ Restore this version ]             |
|                                                                          |
+--------------------------------------------------------------------------+
```

## FR Annotation Summary

| Element                          | FR               |
| -------------------------------- | ---------------- |
| Version timeline (last 10 in DB) | FR-007b          |
| All versions in S3 archive       | FR-007b          |
| Current version indicator        | FR-007b          |
| Preview action                   | FR-007b          |
| Restore as new version           | FR-007b          |
| Compare two versions             | FR-007b, FR-007c |
| Changed-fields summary           | FR-007b          |
| Owner-only view/edit             | FR-002           |
| Web layout                       | FR-044           |
