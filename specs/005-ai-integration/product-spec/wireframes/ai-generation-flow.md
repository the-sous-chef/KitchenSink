# Wireframe: ai-generation-flow

**Feature**: `005-ai-integration` | **Date**: 2026-05-09
**Key FRs**: FR-016, FR-017

---

```
[Queued] -> [Validating Input] -> [Generating (streaming)] -> [Confidence Check] -> [Ready]
                                              \-> [Fallback Required]

Queued
  - "Request accepted"

Validating Input
  - Checks constraints, provider availability

Generating (streaming)
  - Partial title
  - Partial ingredients
  - Partial steps

Confidence Check
  - High / Medium / Low decision

Ready
  - Show suggestion card + preview + save action

Fallback Required
  - Retry provider
  - Switch provider
  - Continue manually
```

**Interaction notes**:

- State transitions are visible to reduce uncertainty during longer requests.
- Fallback path preserves user prompt and constraints.
