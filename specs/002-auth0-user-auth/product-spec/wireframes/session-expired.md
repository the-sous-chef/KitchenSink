# Wireframe: Session Expired

**Date**: 2026-05-09
**Key FRs**: FR-008, FR-012

---

```text
+--------------------------------------------------------------------------------+
| Session Status                                                                 |
|--------------------------------------------------------------------------------|
|                                                                                 |
|                        Your session has expired                                 |
|                                                                                 |
|         For your security, please sign in again to continue.                    |
|                                                                                 |
|                       [ Sign In Again ]                                         |
|                                                                                 |
|                       [ Back to Home ] (public only)                            |
|                                                                                 |
| Details (collapsible):                                                          |
| - Refresh token expired or revoked                                              |
| - Local credentials cleared                                                     |
+--------------------------------------------------------------------------------+
```

---

## Interaction Notes

- Triggered when silent refresh fails due to expired/revoked refresh token (FR-008).
- Re-entry action routes user to auth flow; stale session is not retained (FR-012).
