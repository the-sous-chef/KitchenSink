# Wireframe: Duplicate Import Conflict (Web)

**Branch**: `004-recipe-importing` | **Date**: 2026-05-09
**FRs**: [FR-008](../../spec.md#fr-008), [FR-011](../../spec.md#fr-011)

---

## ASCII Wireframe

```
+--------------------------------------------------------------------------+
|  Import Conflict: Source Already Imported                                |
+--------------------------------------------------------------------------+
|                                                                          |
|  [⚠] This source URL already exists in Sous Chef.                        |
|                                                                          |
|  Existing Recipe                                                         |
|  +--------------------------------------------------------------------+  |
|  | Title: Chicken Teriyaki                                             |  |
|  | Source: https://www.allrecipes.com/recipe/...                       |  |
|  | Visibility: Public                                                   |  |
|  | Attribution: Locked                                                  |  |
|  +--------------------------------------------------------------------+  |
|                                                                          |
|  Actions                                                                  |
|  [ Clone Existing Recipe ]   [ View Existing ]   [ Cancel ]              |
|                                                                          |
|  Note: Duplicate creation is blocked to preserve canonical attribution.  |
|                                                                          |
+--------------------------------------------------------------------------+
```
