# Wireframe: Restore Purchase (Mobile)

**Branch**: `010-subscriptions` | **Date**: 2026-05-09
**FRs**: [FR-043](../../spec.md#functional-requirements)

---

## ASCII Wireframe

```
+----------------------------------------------+
| Billing Settings                             |
+----------------------------------------------+
| Current tier: Free                           |
|                                              |
| [Restore Purchase]                           |
|                                              |
| -------------------------------------------- |
| Last sync: 2026-05-09 12:30 UTC             |
|                                              |
| If you previously subscribed, restore will   |
| resync your entitlement status to this       |
| account.                                     |
|                                              |
| [Need help? Contact support]                 |
+----------------------------------------------+

After tap:

+----------------------------------------------+
| Restoring purchase...                         |
| [spinner]                                    |
+----------------------------------------------+

Success:

+----------------------------------------------+
| Success!                                     |
| Premium access restored.                     |
| [Go to premium features]                     |
+----------------------------------------------+
```

---

## Interaction Notes

- Restore action should be non-destructive and idempotent.
- Failures must present clear support path and retry button.
