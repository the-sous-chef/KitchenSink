# Wireframe: Subscription Management (Web)

**Branch**: `010-subscriptions` | **Date**: 2026-05-09
**FRs**: [FR-041](../../spec.md#functional-requirements), [FR-043](../../spec.md#functional-requirements)

---

## ASCII Wireframe

```
+----------------------------------------------------------------------------+
| Sous Chef > Settings > Billing                                             |
+----------------------------------------------------------------------------+
|                                                                            |
|  Current Plan: PREMIUM                                                     |
|  Status: Active                                                            |
|  Renewal Date: 2026-07-09                                                  |
|  Trial Ends: —                                                             |
|                                                                            |
|  +-------------------------+   +----------------------------------------+  |
|  | Plan Actions            |   | Payment Method                         |  |
|  |-------------------------|   |----------------------------------------|  |
|  | [Manage in Portal]      |   | Visa **** 4242                         |  |
|  | [Switch Monthly/Annual] |   | [Update payment method]                |  |
|  | [Cancel at period end]  |   | [Download latest invoice]              |  |
|  +-------------------------+   +----------------------------------------+  |
|                                                                            |
|  If canceled:                                                              |
|  "You will keep your data and free-tier access after period end."         |
|                                                                            |
+----------------------------------------------------------------------------+
```

---

## Interaction Notes

- `Manage in Portal` opens Stripe customer portal session.
- Cancellation flow includes explicit data-retention reminder (`FR-043`).
- Status badges include text labels (`Active`, `Past due`, `Canceled`).
