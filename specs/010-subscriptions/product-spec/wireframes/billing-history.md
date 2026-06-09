# Wireframe: Billing History

**Branch**: `010-subscriptions` | **Date**: 2026-05-09
**FRs**: [FR-043](../../spec.md#functional-requirements)

---

## ASCII Wireframe

```
+----------------------------------------------------------------------------+
| Commise > Billing History                                                |
+----------------------------------------------------------------------------+
|                                                                            |
|  [Status banner if needed: Payment failed — update method to avoid lapse] |
|                                                                            |
|  +----------------------------------------------------------------------+  |
|  | Date       | Description                | Amount  | Status   | Action | |
|  |------------|----------------------------|---------|----------|--------| |
|  | 2026-05-09 | Premium monthly renewal    | $9.99   | Paid     | View   | |
|  | 2026-04-09 | Premium monthly renewal    | $9.99   | Paid     | View   | |
|  | 2026-03-09 | Premium monthly renewal    | $9.99   | Failed   | Retry  | |
|  +----------------------------------------------------------------------+  |
|                                                                            |
|  [Download all invoices]                                                   |
|                                                                            |
|  Data retention note:                                                      |
|  "If your subscription lapses, your data remains retained."               |
|                                                                            |
+----------------------------------------------------------------------------+
```

---

## Interaction Notes

- Failed invoice rows expose recovery action (`Retry` / `Update payment`).
- History view supports transparency and support deflection.
