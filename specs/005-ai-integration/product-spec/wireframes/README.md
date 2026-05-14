# Wireframes: AI Integration

**Branch**: `005-ai-integration`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](../product-spec.md), [spec.md](../../spec.md)

---

## Index

| File                                                       | Description                                                                            | Key FRs        |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------- |
| [ai-chat.md](./ai-chat.md)                                 | Conversational AI entry surface with prompt composer and provider/setup state handling | FR-015, FR-016 |
| [ai-suggestion-card.md](./ai-suggestion-card.md)           | Generated suggestion card with quick comparison actions and save intent                | FR-017, FR-020 |
| [ai-generation-flow.md](./ai-generation-flow.md)           | End-to-end state flow for queued/streaming/ready fallback transitions                  | FR-016, FR-017 |
| [ai-confidence-indicator.md](./ai-confidence-indicator.md) | Confidence + guardrail indicator component with non-color-only state communication     | FR-017, FR-020 |
| [ai-error-fallback.md](./ai-error-fallback.md)             | Error and recovery UX for provider failure, timeout, and low-confidence outputs        | FR-016, FR-017 |

---

## FR Reference Key

- **FR-015**: Configure preferred AI provider with secure BYOK credentials.
- **FR-016**: Generate recipe in app using configured provider.
- **FR-017**: Preview generated recipe before optional save.
- **FR-018**: OAuth-protected external agent API with explicit consent.
- **FR-019**: Premium instruction optimization.
- **FR-020**: Generated recipes are private, user-owned.
- **FR-021**: Revoke external agent authorization anytime.
