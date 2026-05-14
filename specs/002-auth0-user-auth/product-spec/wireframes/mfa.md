# Wireframe: MFA Enrollment and Challenge

**Date**: 2026-05-09
**Key FRs**: FR-029, FR-030, FR-031

---

```text
+--------------------------------------------------------------------------------+
| Account Security                                                               |
|--------------------------------------------------------------------------------|
| Multi-Factor Authentication (TOTP)                                              |
|                                                                                 |
| 1) Scan QR Code with authenticator app                                          |
|    [ QR CODE AREA ]                                                             |
|                                                                                 |
| 2) Enter 6-digit code                                                           |
|    [ _ _ _ _ _ _ ]                                                              |
|                                                                                 |
| [ Verify and Enable MFA ]                                                       |
| [ Cancel ]                                                                      |
|                                                                                 |
| Status region:                                                                  |
| - MFA enabled successfully.                                                     |
| - Invalid code. Try again.                                                      |
|                                                                                 |
| Note: Once enabled, Auth0 requires second factor on future logins.             |
+--------------------------------------------------------------------------------+
```

---

## Interaction Notes

- Enrollment entry point is account settings (FR-029).
- Supported baseline method is TOTP (FR-030).
- Successful enrollment enforces MFA on subsequent sign-in attempts (FR-031).
