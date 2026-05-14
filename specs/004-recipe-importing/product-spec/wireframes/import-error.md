# Wireframe: Import Error & Recovery (Web)

**Branch**: `004-recipe-importing` | **Date**: 2026-05-09
**FRs**: [FR-009](../../spec.md#fr-009), [FR-014](../../spec.md#fr-014), [NFR-003](../../spec.md#non-functional-requirements-constitution-derived), [NFR-004](../../spec.md#non-functional-requirements-constitution-derived)

---

## ASCII Wireframe

```
+--------------------------------------------------------------------------+
|  Import Failed                                                           |
+--------------------------------------------------------------------------+
|                                                                          |
|  Error Type: [🛑 Paywalled Source]                                       |
|                                                                          |
|  Message: This source requires subscription access and cannot be imported.|
|                                                                          |
|  Recovery Actions                                                         |
|  [ Try Different URL ] [ Paste Manually ] [ Upload File ] [ Policy Info ] |
|                                                                          |
|  ----------------------------------------------------------------------  |
|  Other typed failures                                                     |
|   - [⚠] Unsupported Instagram post (no recipe caption text)              |
|   - [⚠] Parse incomplete (missing required fields)                        |
|   - [⚠] Timeout fetching source                                            |
|                                                                          |
|  All statuses include icon + text label for accessibility.               |
|                                                                          |
+--------------------------------------------------------------------------+
```
