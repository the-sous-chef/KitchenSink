# Wireframe: ai-error-fallback

**Feature**: `005-ai-integration` | **Date**: 2026-05-09
**Key FRs**: FR-016, FR-017

---

```
+--------------------------------------------------------------------------------+
| We couldn't complete that generation request                                   |
|--------------------------------------------------------------------------------|
| Reason: Provider timeout (15s threshold exceeded)                              |
|                                                                                |
| Your prompt and constraints are saved below:                                   |
| [ low-carb italian dinner for 4 ... ]                                          |
|                                                                                |
| Next actions:                                                                  |
| [Retry Same Provider]   [Try Different Provider]   [Create Manually]           |
+--------------------------------------------------------------------------------+
```

**Interaction notes**:

- Error copy avoids technical jargon where possible.
- Recovery options are mutually clear and preserve user input state.
