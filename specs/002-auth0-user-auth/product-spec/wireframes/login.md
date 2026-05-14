# Wireframe: Login (Web)

**Date**: 2026-05-09
**Key FRs**: FR-001, FR-003, FR-004, FR-027

---

```text
+--------------------------------------------------------------------------------+
| Sous Chef                                                                      |
|--------------------------------------------------------------------------------|
| [Logo]                                                                          |
|                                                                                 |
|                          Welcome back                                           |
|              Sign in to continue to your recipes                                |
|                                                                                 |
|              [ Continue with Google ]   (social provider)                       |
|                                                                                 |
|              ------------------- or -------------------                          |
|                                                                                 |
|              [ Email Address _________________________ ]                         |
|              [ Password ______________________________ ]                         |
|              [ Sign In ]                                                        |
|                                                                                 |
|              [ Forgot Password? ] -> Auth0 reset flow                           |
|                                                                                 |
|              New here? [ Create account ]                                       |
|                                                                                 |
|  Status message region:                                                         |
|  - Session expired. Please sign in again.                                       |
|  - Account suspended. Contact support.                                          |
+--------------------------------------------------------------------------------+
```

---

## Interaction Notes

- Protected route access without session redirects to this screen (FR-003).
- Google social sign-in is first-class option (FR-004).
- Forgot-password routes to Auth0-managed reset flow (FR-027).
