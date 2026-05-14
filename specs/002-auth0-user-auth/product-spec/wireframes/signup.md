# Wireframe: Signup

**Date**: 2026-05-09
**Key FRs**: FR-001, FR-004, FR-013, FR-014, FR-015

---

```text
+--------------------------------------------------------------------------------+
| Sous Chef                                                                      |
|--------------------------------------------------------------------------------|
| [Logo]                                                                          |
|                                                                                 |
|                          Create your account                                    |
|                                                                                 |
|              [ Continue with Google ]                                           |
|                                                                                 |
|              ------------------- or -------------------                          |
|                                                                                 |
|              [ Email Address _________________________ ]                         |
|              [ Password ______________________________ ]                         |
|              [ Confirm Password ______________________ ]                         |
|              [ Create Account ]                                                 |
|                                                                                 |
|              Already have an account? [ Sign In ]                               |
|                                                                                 |
|  Post-signup status:
|  - Creating your Sous Chef profile...                                           |
|  - Setting up your account...                                                   |
|  - Done. Redirecting to app...                                                  |
+--------------------------------------------------------------------------------+
```

---

## Interaction Notes

- After Auth0 signup success, backend creates User + Account records (FR-013, FR-014).
- Canonical UUID is persisted to Auth0 metadata for downstream API identity mapping (FR-015).
