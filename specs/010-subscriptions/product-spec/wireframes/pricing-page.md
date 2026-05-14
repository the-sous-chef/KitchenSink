# Wireframe: Pricing Page (Web)

**Branch**: `010-subscriptions` | **Date**: 2026-05-09
**FRs**: [FR-040](../../spec.md#functional-requirements), [FR-041](../../spec.md#functional-requirements), [FR-042](../../spec.md#functional-requirements)

---

## ASCII Wireframe

```
+----------------------------------------------------------------------------+
| Sous Chef                                              [Account ▼] [Help]  |
+----------------------------------------------------------------------------+
|                                                                            |
|                     Choose the plan that fits your kitchen                |
|                                                                            |
|   +-------------------------------+   +--------------------------------+   |
|   | FREE                          |   | PREMIUM                        |   |
|   | $0                            |   | $9.99/mo  or  $89/yr          |   |
|   |                               |   |                                |   |
|   | ✅ Recipe CRUD                |   | ✅ Everything in Free          |   |
|   | ✅ Sharing & cloning          |   | ✅ Private recipe visibility   |   |
|   | ✅ Basic importing            |   | ✅ AI generation/optimization  |   |
|   | ✅ Manual meal planning       |   | ✅ Auto meal plans + waste AI |   |
|   | ✅ Grocery list generation    |   | ✅ Online grocery ordering    |   |
|   | ✅ Cooking mode               |   | ✅ Trainer nutrition planning |   |
|   |                               |   |                                |   |
|   | [Current Plan]                |   | [Start Free Trial] [Upgrade]  |   |
|   +-------------------------------+   +--------------------------------+   |
|                                                                            |
|  Feature details                                                           |
|  - Private recipe controls        [lock icon + text label]                |
|  - AI workflows                   [lock icon + text label]                |
|  - Ordering and trainer tools     [lock icon + text label]                |
|                                                                            |
|  FAQ: cancellation, billing, and data retention                            |
|  "Cancel anytime. Your data remains retained on downgrade."               |
|                                                                            |
+----------------------------------------------------------------------------+
```

---

## Interaction Notes

- `Start Free Trial` and `Upgrade` trigger checkout session creation.
- Locked features are represented with icon + text for accessibility (`NFR-004`).
- All CTA buttons include accessible names (`NFR-003`).
