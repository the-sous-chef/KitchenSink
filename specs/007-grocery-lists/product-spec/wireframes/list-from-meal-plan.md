# Wireframe: Generate List from Meal Plan + Order Handoff (Web)

**Branch**: `007-grocery-lists` | **Date**: 2026-05-09
**FRs**: [FR-028](../../spec.md#feature-requirements), [FR-030](../../spec.md#feature-requirements), [FR-031](../../spec.md#feature-requirements)

---

## ASCII Wireframe

```
+--------------------------------------------------------------------------+
|  Meal Plan: Week of May 11                                [Regenerate]    |
+--------------------------------------------------------------------------+
|  Planned recipes: 14   Servings adjusted: 6   [View meal plan]            |
+--------------------------------------------------------------------------+
|  +------------------------------+  +------------------------------------+ |
|  |  GENERATION SUMMARY          |  |  STORE & ORDERING                  | |
|  |  Total items: 28             |  |  Store connection: Not configured  | |
|  |  Aggregated merges: 11       |  |  [Connect Store]                    | |
|  |  Pantry exclusions: 4        |  |                                      | |
|  |  Estimated total: $47.82     |  |  Premium status: Free               | |
|  |                              |  |  [Upgrade to order groceries]        | |
|  +------------------------------+  +------------------------------------+ |
|                                                                          |
|  +--------------------------------------------------------------------+  |
|  |  ORDER PREFLIGHT                                                   |  |
|  |  Mapped items: 22                                                   |  |
|  |  Unmapped items: 2   [Review]                                       |  |
|  |  Already-have excluded: 4                                           |  |
|  +--------------------------------------------------------------------+  |
|                                                                          |
|  [Back]                 [View Grouped List]       [Order Groceries]      |
+--------------------------------------------------------------------------+
```

---

## Interaction Notes

- If no store is configured, `Order Groceries` routes into setup guidance (FR-030).
- For non-premium users, order CTA presents upgrade flow while preserving list utility (FR-031).
- Preflight panel makes mapped/unmapped quality explicit before handoff.
