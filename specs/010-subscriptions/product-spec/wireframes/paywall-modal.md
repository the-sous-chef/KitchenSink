# Wireframe: Paywall Modal (Contextual Upgrade Prompt)

**Branch**: `010-subscriptions` | **Date**: 2026-05-09
**FRs**: [FR-041](../../spec.md#functional-requirements), [FR-042](../../spec.md#functional-requirements), [NFR-003](../../spec.md#non-functional-requirements-constitution-derived), [NFR-004](../../spec.md#non-functional-requirements-constitution-derived)

---

## ASCII Wireframe

```
                          +---------------------------------------+
                          |   Premium Feature                     |
                          |---------------------------------------|
                          |  Private recipe visibility is a       |
                          |  Premium feature.                     |
                          |                                       |
                          |  Why upgrade?                         |
                          |  • Keep personal recipes private      |
                          |  • Unlock AI meal planning            |
                          |  • Access online ordering workflows   |
                          |                                       |
                          |  [Trial badge + text] 14-day trial    |
                          |                                       |
                          |  [Start Free Trial] [View Plans]      |
                          |  [Not now]                            |
                          +---------------------------------------+
```

---

## Interaction Notes

- Triggered by `403 PREMIUM_REQUIRED` response when user attempts a gated action.
- `Not now` returns user to previous context without destructive state changes.
- Modal conveys state with explicit text + iconography; color is supplementary only.
