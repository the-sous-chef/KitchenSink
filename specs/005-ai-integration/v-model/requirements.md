# V-Model Requirements Specification: AI Integration

**Feature Branch**: `005-ai-integration`
**Created**: 2026-05-09
**Status**: Draft
**Source**: `specs/005-ai-integration/spec.md`

## Overview

AI Integration for Sous Chef operates in two directions: **(1) BYOK in-app** — users configure their preferred AI provider (OpenAI, Gemini, Anthropic, etc.) by storing their own API credentials; Sous Chef calls the provider to generate recipes within the app. **(2) External agent platform** — Sous Chef exposes an OAuth 2.0 API so custom agents on ChatGPT, Gemini, etc. can read the user's recipe collection and create recipes on their behalf. Users must explicitly authorize agents via OAuth consent and can revoke access at any time. Both directions produce private, user-owned recipes.

## Requirements

### Functional Requirements

| ID      | Description                                                                                                                                                                       | Priority | Rationale                                                                                                | Verification Method |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- | ------------------- |
| REQ-001 | The system MUST allow users to configure their preferred AI provider (e.g., OpenAI, Gemini, Anthropic) by using encrypted storage storing their own API credentials (BYOK model). | P2       | Enables in-app AI generation without Sous Chef managing provider costs; users bring their own keys.      | Test                |
| REQ-002 | The system MUST call the user configured AI provider to generate recipes from specified ingredients, dietary restriction values, cuisine value,, calorie target value.            | P2       | Core in-app AI generation capability; drives product differentiation.                                    | Test                |
| REQ-003 | The system MUST return AI-generated recipe results to the user within 15 seconds of the request.                                                                                  | P2       | Defined success criterion SC-003; ensures acceptable UX for AI generation latency.                       | Test                |
| REQ-004 | The system MUST allow users to preview AI-generated recipes before saving a selected recipe to their collection.                                                                  | P2       | Users must be able to review and accept or reject AI output before it is persisted.                      | Test                |
| REQ-005 | The system MUST save AI-generated recipes accepted by the user as private, user-owned recipes in their collection.                                                                | P2       | AI-generated content must be owned by the user who generated it, consistent with recipe ownership model. | Test                |
| REQ-006 | The system MUST NOT store any recipe when the user declines to save an AI-generated recipe.                                                                                       | P2       | Ensures no unintended data persistence; user has full control over what enters their collection.         | Test                |
| REQ-007 | The system MUST guide users through AI provider setup when they attempt to generate a recipe in-app without having configured any AI provider credentials.                        | P2       | Prevents silent failures; provides a clear onboarding path for BYOK configuration.                       | Test                |
| REQ-008 | The system MUST expose an OAuth 2.0-protected API that allows authorized external agents (e.g., ChatGPT GPT Actions, Gemini Extensions) to read the user's recipe collection.     | P2       | Enables Sous Chef to act as an agent tool on external platforms, extending reach.                        | Test                |
| REQ-009 | The system MUST expose an OAuth 2.0-protected API that allows authorized external agents to create recipes on behalf of the user.                                                 | P2       | Enables external agents to save recipes directly into the user's Sous Chef collection.                   | Test                |
| REQ-010 | The system MUST require users to explicitly grant consent via an OAuth authorization flow before any external agent can access their account.                                     | P2       | Protects user data; no agent access without explicit user authorization.                                 | Test                |
| REQ-011 | The system MUST reject requests from external agents that have not been authorized by the user, return an authorization error.                                                    | P2       | Security requirement; unauthorized access must be denied.                                                | Test                |
| REQ-012 | The system MUST treat all AI-generated recipes saved by users (whether via in-app generation / external agent) as private, user-owned recipes.                                    | P2       | Consistent ownership model regardless of generation path.                                                | Test                |
| REQ-013 | The system MUST allow users to revoke external agent authorizations at any time from their account settings.                                                                      | P2       | Users must retain control over which agents can access their account.                                    | Test                |
| REQ-014 | The system MUST allow recipe owners to request AI-powered optimization of recipe instructions (simplify language / streamline cooking steps). _(Premium feature)_                 | P2       | Adds premium value; instruction optimization is a differentiating AI capability.                         | Test                |
| REQ-015 | The system MUST allow users to accept / reject AI-optimized recipe instructions before any changes are applied.                                                                   | P2       | Users retain editorial control; AI suggestions are non-destructive until accepted.                       | Test                |

### Non-Functional Requirements

| ID         | Description                                                                                                                            | Priority | Rationale                                                                     | Verification Method |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- | ------------------- |
| REQ-NF-001 | All TypeScript code in this feature MUST compile with `strict: true`; no `any` used outside explicitly marked test doubles.            | P1       | Constitution Principle I; type safety is non-negotiable across the codebase.  | Inspection          |
| REQ-NF-002 | All exported functions, interfaces in this feature MUST carry JSDoc documentation.                                                     | P1       | Constitution Principle II; ensures maintainability and discoverability.       | Inspection          |
| REQ-NF-003 | Any UI component introduced by this feature MUST expose an accessible name queryable via `getByRole`/`getByLabel` in Playwright tests. | P1       | Constitution Principles IV & VII; accessibility is a first-class requirement. | Test                |
| REQ-NF-004 | Color MUST NOT be the sole conveyor of state in any UI component introduced by this feature; icon / text label pairing is required.    | P1       | Constitution Principle VII; ensures accessibility for color-blind users.      | Inspection          |
| REQ-NF-005 | AI provider credentials (BYOK API keys) MUST be encrypted at rest.                                                                     | P1       | Security requirement; user credentials must never be stored in plaintext.     | Inspection          |

### Interface Requirements

| ID         | Description                                                                                                                                                                                   | Priority | Rationale                                                                                                    | Verification Method |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ | ------------------- |
| REQ-IF-001 | The system SHALL expose an OAuth 2.0 authorization code flow endpoint for external agent platforms (ChatGPT GPT Actions, Gemini Extensions) conforming to each platform's required auth flow. | P2       | External agent platforms require standard OAuth 2.0 authorization code flow for integration.                 | Test                |
| REQ-IF-002 | The OAuth 2.0 API SHALL support at minimum the scopes `recipes:read`, `recipes:create` for external agent authorization grants.                                                               | P2       | Granular scopes allow users to control what agents can do; minimum viable scope set for agent functionality. | Test                |
| REQ-IF-003 | The system SHALL return the user's recipe collection in a structured format when queried by an authorized external agent.                                                                     | P2       | External agents require machine-readable structured data to process recipe collections.                      | Test                |

| REQ-IF-004 | The system SHALL provide equivalent web and mobile user-facing workflows for AI Integration, including the same core capabilities, entitlement behavior, error states, accessibility semantics, and recovery paths unless an explicit V-Model parity exception is recorded. | P1 | KitchenSink Constitution Principle VIII requires web/mobile lockstep for every user-facing capability. | Test |

### Constraint Requirements

| ID         | Description                                                                                                                                                                               | Priority | Rationale                                                                         | Verification Method |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------- | ------------------- |
| REQ-CN-001 | The AI Integration feature MUST depend on the Recipe entities, storage model defined in spec `001-sous-chef-recipe-app`; AI-generated recipes are stored as Recipe entities.              | P1       | Hard dependency; AI-generated recipes reuse the existing Recipe data model.       | Inspection          |
| REQ-CN-002 | All AI features MUST require user authentication as defined in spec `002-auth0-user-auth`; unauthenticated users MUST NOT access any AI generation / agent authorization endpoints.       | P1       | Hard dependency; authentication is a prerequisite for all AI features.            | Test                |
| REQ-CN-003 | AI recipe generation (in-app), AI instruction optimization MUST be restricted to users with an active premium subscription as defined in spec `010-subscriptions`. _(Premium constraint)_ | P2       | Business model constraint; premium features must be gated by subscription status. | Test                |

## Assumptions

- AI integration operates in two directions: (1) **BYOK in-app** — users store their own AI provider API keys (OpenAI, Gemini, Anthropic, etc.) and Sous Chef calls the provider on their behalf; (2) **External agent platform** — Sous Chef exposes an OAuth 2.0 API that custom agents on platforms like ChatGPT and Gemini use to read/write recipes on behalf of authorized users.
- External agent platform integrations (ChatGPT GPT Actions, Gemini Extensions, etc.) will conform to each platform's required auth flow, which is typically OAuth 2.0 authorization code.
- The system does not manage or pay for AI provider API costs; users supply their own credentials (BYOK model).

## Dependencies

| Spec                                                               | Relationship                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [001-sous-chef-recipe-app](../../001-sous-chef-recipe-app/spec.md) | **Required** — AI-generated recipes are stored as Recipe entities defined in 001                 |
| [002-auth0-user-auth](../../002-auth0-user-auth/spec.md)           | **Required** — all AI features require authentication; external agent OAuth builds on auth layer |
| [010-subscriptions](../../010-subscriptions/spec.md)               | **Referenced** — AI generation and instruction optimization are premium features                 |

## Glossary

| Term                | Definition                                                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BYOK                | Bring Your Own Key — users supply their own AI provider API credentials; Sous Chef calls the provider on their behalf.                                                |
| AI Provider Config  | Stores a user's BYOK credentials for their chosen AI provider (e.g., OpenAI API key). Encrypted at rest.                                                              |
| Agent Authorization | Represents a user's OAuth grant to an external agent platform. Tracks platform, granted scopes (`recipes:read`, `recipes:create`), grant date, and revocation status. |
| External Agent      | A custom AI agent running on a third-party platform (e.g., ChatGPT GPT Actions, Gemini Extensions) that integrates with Sous Chef via OAuth 2.0.                      |
| OAuth 2.0           | Open standard authorization protocol used to grant external agents scoped access to a user's Sous Chef account with explicit user consent.                            |
| Premium Feature     | A capability restricted to users with an active paid subscription (defined in spec 010-subscriptions).                                                                |

---

**Total Requirements**: 23
**By Priority**: P1: 7 | P2: 16 | P3: 0
**By Verification Method**: Test: 17 | Inspection: 6 | Analysis: 0 | Demonstration: 0
