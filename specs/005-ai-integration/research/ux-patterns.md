# UX Patterns: AI Integration

**Branch**: `005-ai-integration` | **Date**: 2026-05-09
**Status**: Complete | **Source**: [spec.md](../spec.md), [plan.md](../plan.md), [research.md](../research.md)

---

## 1. AI Generation Entry and Setup

### 1.1 Opt-in AI Entry

- AI appears as an explicit user action (“Generate with AI”), not an automatic replacement of manual recipe flows.
- First invocation without configured provider routes user to BYOK setup assistant.
- FR mapping: `FR-015`, `FR-016`, `FR-017`.

### 1.2 Provider Setup Interrupt Pattern

When generation is requested without credentials:

1. Preserve prompt draft.
2. Display modal explaining BYOK requirement.
3. Navigate to provider setup.
4. Return to generation flow with prompt restored.

Prevents dead-end errors and supports fast recovery.

---

## 2. Streaming and Progressive Disclosure

### 2.1 SSE Streaming Response Pattern

- Show incremental content (title → ingredients → steps) as events stream.
- Keep partial output visually differentiated from finalized blocks.
- Final event flips status to “Ready to review”.
- FR mapping: `FR-016`, `FR-017`.

### 2.2 Stage-Based Generation Flow

Use deterministic states:

`queued` → `validating` → `generating` → `confidence-check` → `ready` or `fallback`.

Each state includes explicit copy and next action.

---

## 3. Suggestion Card and Confidence Pattern

### 3.1 AI Suggestion Card

Card includes:

- dish name + short rationale,
- key constraints satisfied (dietary/cuisine/calorie),
- confidence badge,
- actions: `Preview`, `Regenerate`, `Save`.

Supports quick comparison without forcing full-page commitment.

### 3.2 Confidence Indicator Pattern

- Multi-signal display (label + icon + short text rationale), not color-only.
- Values: High / Medium / Low confidence.
- Low confidence disables direct save until preview acknowledgment.

This aligns with NFR accessibility expectations (`NFR-003`, `NFR-004`) while reducing blind acceptance risk.

---

## 4. Hallucination Guardrails and Fallback

### 4.1 Hallucination Guard Pattern

Guard checks before save:

- malformed or impossible ingredient quantities,
- contradictory dietary claims,
- missing mandatory recipe sections.

On guard trigger, show specific issue summary and force user confirmation/regeneration.

### 4.2 Error + Recovery Pattern

If generation fails or times out:

- preserve user inputs,
- show cause category (provider auth, rate limit, timeout, generic),
- offer deterministic fallback actions:
    - retry same provider,
    - switch provider,
    - continue with manual recipe creation.

FR mapping: `FR-016`, `FR-017`.

---

## 5. External Agent Consent UX

### 5.1 OAuth Consent Visibility

- Consent screen clearly identifies requesting agent, scopes, and expiry/revocation behavior.
- Post-consent settings show active grants and revocation action.

FR mapping: `FR-018`, `FR-021`.

### 5.2 Revocation Pattern

- One-click revoke in account settings.
- Immediate state update in UI and backend token denial path.
- Optional activity timeline entry (“Access revoked for Agent X”).

---

## 6. Pattern Cross-Reference

| Pattern                           | FRs            | Wireframe                               |
| --------------------------------- | -------------- | --------------------------------------- |
| Opt-in AI entry + setup interrupt | FR-015, FR-016 | `wireframes/ai-chat.md`                 |
| Streaming generation flow         | FR-016, FR-017 | `wireframes/ai-generation-flow.md`      |
| Suggestion card                   | FR-017, FR-020 | `wireframes/ai-suggestion-card.md`      |
| Confidence indicator              | FR-017, FR-020 | `wireframes/ai-confidence-indicator.md` |
| Error fallback                    | FR-016, FR-017 | `wireframes/ai-error-fallback.md`       |
| OAuth consent and revoke          | FR-018, FR-021 | `product-spec/user-journey.md`          |
