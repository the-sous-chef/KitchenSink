# Wireframe: Conflict Resolution UI (HTTP 409 — Web)

**Branch**: `001-commise-recipe-app` | **Date**: 2026-05-09
**FRs**: [FR-007c](../../spec.md#fr-007c), [C-005](../../spec.md#c-005), [FR-044](../../spec.md#fr-044)

---

## Context

When a user submits a recipe save with a stale `version` field (optimistic concurrency), the server rejects the write with HTTP 409 Conflict and a payload containing both the server's current version and the client's attempted version. The client presents this side-by-side resolution UI.

**API response shape**:

```json
{
  "error": "CONFLICT",
  "message": "Recipe was modified. Please review both versions.",
  "server_version": 6,
  "client_version": 5,
  "server_recipe": { "...full recipe object..." },
  "client_recipe": { "...submitted payload..." }
}
```

---

## ASCII Wireframe

```
+--------------------------------------------------------------------------+
|  Commise                                          [Morgan ▼] [Settings]|
+--------------------------------------------------------------------------+
|                                                                          |
|  [< Discard and close]              Conflict Detected — Recipe Save     |
|                                                                          |
|  +----------------------------------------------------------------------+ |
|  |                                                                      | |
|  |  Your save was rejected because this recipe was modified on         | |
|  |  another device while you were editing.                            | |
|  |                                                                      | |
|  |  Server version (v6):  Saved 2 minutes ago on your iPhone          | |
|  |  Your version (v5):     Your local unsaved changes                  | |
|  |                                                                      | |
|  +----------------------------------------------------------------------+ |
|                                                                          |
|  +-----------------------+      +------------------------------------+   |
|  |  SERVER VERSION (v6)  |      |  YOUR VERSION (v5)                  |   |
|  |  Saved: 2026-05-09    |      |  Saved locally: 2026-05-09         |   |
|  |  Device: iPhone       |      |  Device: Web browser               |   |
|  +-----------------------+      +------------------------------------+   |
|                                                                          |
|  +-----------------------+      +------------------------------------+   |
|  |  Title                |      |  Title                             |   |
|  |  Grandma's Pasta      |  ->  |  Grandma's Pasta (Updated)         |   |  <- changed
|  +-----------------------+      +------------------------------------+   |
|                                                                          |
|  +-----------------------+      +------------------------------------+   |
|  |  Description          |      |  Description                       |   |
|  |  A family recipe...   |  =   |  A family recipe passed down...    |   |  <- unchanged
|  +-----------------------+      +------------------------------------+   |
|                                                                          |
|  +-----------------------+      +------------------------------------+   |
|  |  Servings             |      |  Servings                          |   |
|  |  4                    |  ->  |  6                                 |   |  <- changed
|  +-----------------------+      +------------------------------------+   |
|                                                                          |
|  +-----------------------+      +------------------------------------+   |
|  |  Ingredients          |      |  Ingredients                       |   |
|  |  8 items              |  =   |  8 items                          |   |  <- unchanged
|  +-----------------------+      +------------------------------------+   |
|                                                                          |
|  +-----------------------+      +------------------------------------+   |
|  |  Instructions         |      |  Instructions                     |   |
|  |  5 steps              |  ->  |  6 steps                          |   |  <- changed
|  |  Step 3: Add kale... |  |   |  Step 3: Add spinach...          |   |
|  |  (kale added)        |  |   |  (spinach instead of kale)        |   |
|  +-----------------------+      +------------------------------------+   |
|                                                                          |
|  +-----------------------+      +------------------------------------+   |
|  |  Tags                 |      |  Tags                              |   |
|  |  italian, family     |  =   |  italian, family                   |   |  <- unchanged
|  +-----------------------+      +------------------------------------+   |
|                                                                          |
|  Legend:  [ = unchanged ]  [ ->  changed ]  [ !!  conflict ]             |
|                                                                          |
|  +----------------------------------------------------------------------+ |
|  |                                                                      | |
|  |  Choose how to resolve:                                              | |
|  |                                                                      | |
|  |  [A]  Keep server version  (discard your local changes)             | |
|  |       v6 from iPhone — 2026-05-09 14:32                            | |
|  |                                                                      | |
|  |  [B]  Overwrite with your version  (your changes win — v7)         | |
|  |       All your local changes applied as a new version               | |
|  |                                                                      | |
|  |  [C]  Merge manually  (field-by-field review)                      | |
|  |       For each changed field, choose server or your version         | |
|  |                                                                      | |
|  +----------------------------------------------------------------------+ |
|                                                                          |
|  [Cancel]                                                     [Resolve]  |
|                                                                          |
+--------------------------------------------------------------------------+
```

## Merge Mode (Option C — Field-by-Field)

```
+--------------------------------------------------------------------------+
|  Merge: Grandma's Pasta                              [x] Cancel merge    |
+--------------------------------------------------------------------------+
|                                                                          |
|  For each changed field, select the value you want to keep.            |
|                                                                          |
|  +-- Title ------------------------------------------------------------+ |
|  |  [B] Your version: Grandma's Pasta (Updated)                      | |
|  |  [A] Server version:  Grandma's Pasta                             | |
|  |                                                                      | |
|  |  Select:  (A) Server    (B) Your version    [Use B]               | |
|  +----------------------------------------------------------------------+ |
|                                                                          |
|  +-- Servings ----------------------------------------------------------+ |
|  |  [A] Server version:  4                                             | |
|  |  [B] Your version:    6                                             | |
|  |                                                                      | |
|  |  Select:  (A) Server    (B) Your version    [Use A]               | |
|  +----------------------------------------------------------------------+ |
|                                                                          |
|  +-- Instructions ------------------------------------------------------+ |
|  |  [A] Server step 3:  "Add kale and cook until wilted"             | |
|  |  [B] Your step 3:     "Add spinach and cook until wilted"          | |
|  |                                                                      | |
|  |  Select:  (A) Server    (B) Your version    [Use B]               | |
|  +----------------------------------------------------------------------+ |
|                                                                          |
|  Summary of choices:  Title=B, Servings=A, Instructions=B               |
|                                                                          |
|  [Cancel]                                          [Save merged version] |
|                                                                          |
+--------------------------------------------------------------------------+
```

## Layout Notes

| Zone               | Description                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Conflict banner    | Top explanation; shows both versions with device/timestamp                                                                   |
| Side-by-side diff  | Two-column layout; unchanged fields shown with [=]; changed fields shown with [->]; only changed fields rendered for clarity |
| Resolution options | Three cards: Keep server / Overwrite / Merge manually                                                                        |
| Merge mode         | Only changed fields shown; per-field radio selection; running summary of choices                                             |
| Resolve button     | Active only when a selection has been made; submits with the latest server `version`                                         |

## Error Handling

| Scenario                                | UI behavior                                              |
| --------------------------------------- | -------------------------------------------------------- |
| Network failure during resolve          | Retry button; error toast; keep resolve modal open       |
| Version too stale (>10 versions behind) | Warning that many changes may be lost; user must confirm |
| Merge with no selections                | Resolve button disabled; inline hint per field           |

## FR Annotation Summary

| Element                              | FR             |
| ------------------------------------ | -------------- |
| HTTP 409 display                     | FR-007c        |
| Side-by-side version comparison      | FR-007c        |
| Three resolution options             | FR-007c        |
| Option A: Keep server version        | FR-007c        |
| Option B: Overwrite with local       | FR-007c        |
| Option C: Field-by-field merge       | FR-007c        |
| Merge UI (changed fields only)       | FR-007c        |
| Re-submit with latest server version | FR-007c        |
| No silent merge or last-write-wins   | FR-007c, C-005 |
| Web layout                           | FR-044         |
