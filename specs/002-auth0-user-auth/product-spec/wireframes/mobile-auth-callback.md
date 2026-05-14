# Wireframe: Mobile Auth Callback Handling

**Date**: 2026-05-09
**Key FRs**: FR-002, FR-005, FR-006, FR-007

---

```text
+--------------------------------------------------------------------------------+
| Sous Chef Mobile                                                               |
|--------------------------------------------------------------------------------|
| [Auth Browser Returned via Deep Link]                                           |
|                                                                                 |
| Processing sign-in...                                                           |
| [ spinner ]                                                                     |
|                                                                                 |
| Step indicators:                                                                |
| 1. Validate callback state/nonce     [✓]                                        |
| 2. Exchange code for tokens          [✓]                                        |
| 3. Store tokens in secure storage    [✓]                                        |
| 4. Navigate to authenticated app     [→]                                        |
|                                                                                 |
| Error state panel (if needed):                                                  |
| - Callback invalid. [ Retry Login ]                                             |
| - Secure storage failed. [ Try Again ]                                          |
| - Network timeout. [ Retry ]                                                    |
+--------------------------------------------------------------------------------+
```

---

## Interaction Notes

- Mobile unauthenticated launch should open auth surface immediately (FR-002).
- Callback exchange is explicit and recoverable on failure (FR-005).
- Tokens are written to secure platform storage before app-shell navigation (FR-006).
- Subsequent token renewals happen silently when possible (FR-007).
