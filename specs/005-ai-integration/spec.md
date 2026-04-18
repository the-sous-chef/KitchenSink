# Feature Specification: AI Integration

**Feature Branch**: `005-ai-integration`
**Created**: 2026-04-14
**Status**: Draft
**Input**: Split from `001-sous-chef-recipe-app` — AI-powered recipe generation (BYOK in-app + external agent platforms via OAuth).

## Dependencies

| Spec                                                            | Relationship                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [001-sous-chef-recipe-app](../001-sous-chef-recipe-app/spec.md) | **Required** — AI-generated recipes are stored as Recipe entities defined in 001                 |
| [003-auth0-user-auth](../003-auth0-user-auth/spec.md)           | **Required** — all AI features require authentication; external agent OAuth builds on auth layer |
| [010-subscriptions](../010-subscriptions/spec.md)               | **Referenced** — AI generation and instruction optimization are premium features                 |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - AI-Powered Recipe Generation and Assistance (Priority: P2)

A user can interact with AI for recipe generation in two ways. **In-app (BYOK)**: The user configures their preferred AI provider (OpenAI, Gemini, Anthropic, etc.) by storing their own API credentials in Sous Chef. When they request a recipe in the app, Sous Chef calls the user's configured provider and returns the result. **Via external agent platforms**: The user interacts with a Sous Chef custom agent inside platforms like ChatGPT or Gemini. The agent can read the user's recipe collection ("What chicken recipes do I have?") and save new recipes to their Sous Chef account — all after the user has authorized the agent via an OAuth consent flow.

**Why this priority**: AI integration is identified as critical for long-term product differentiation and value. The two-direction model (Sous Chef as AI client + Sous Chef as agent tool) maximizes reach — users get AI where they already are, and the app becomes a platform.

**Independent Test**: In-app: configure an AI provider key, request "low-carb Italian dinner for 4," verify recipe is returned and saveable. External agent: authorize a test agent via OAuth, have it read the user's collection and save a new recipe, verify both operations succeed.

**Acceptance Scenarios**:

1. **Given** a user provides criteria (ingredients, dietary needs, cuisine), **When** they request an AI-generated recipe in-app, **Then** the system calls their configured AI provider and returns a complete recipe within 15 seconds.
2. **Given** an AI-generated recipe is displayed, **When** the user chooses to save it, **Then** it is added to their collection as a private recipe they own.
3. **Given** an AI-generated recipe is displayed, **When** the user declines to save, **Then** no recipe is stored.
4. **Given** a user has not configured any AI provider credentials, **When** they attempt to generate a recipe in-app, **Then** the system guides them through provider setup.
5. **Given** a user has authorized a Sous Chef agent on an external platform (e.g., ChatGPT), **When** the agent requests to read the user's recipes, **Then** the system returns the user's collection in a structured format.
6. **Given** a user has authorized a Sous Chef agent on an external platform, **When** the agent creates a recipe on their behalf, **Then** the recipe is saved to the user's collection as a private, owned recipe.
7. **Given** a user has NOT authorized an external agent, **When** the agent attempts to access their account, **Then** the system rejects the request and returns an authorization error.
8. **Given** a user owns a recipe, **When** they request AI optimization of the instructions (simplify or streamline), **Then** the system returns improved instructions that the user can accept or reject. _(Premium feature)_

---

### Edge Cases

- What happens when AI recipe generation fails or returns low-quality results?

## Requirements _(mandatory)_

### Functional Requirements

**AI Integration**

- **FR-015**: System MUST allow users to configure their preferred AI provider (e.g., OpenAI, Gemini, Anthropic) by securely storing their own API credentials (BYOK model).
- **FR-016**: System MUST call the user's configured AI provider to generate recipes based on criteria (ingredients, dietary restrictions, cuisine, calorie targets) and return results within the app.
- **FR-017**: System MUST allow users to preview AI-generated recipes before optionally saving them to their collection.
- **FR-018**: System MUST expose an OAuth 2.0-protected API that allows authorized external agents (e.g., ChatGPT GPT Actions, Gemini Extensions) to read the user's recipe collection and create recipes on their behalf. Users MUST explicitly grant consent via an OAuth authorization flow before any agent can access their account.
- **FR-019**: System MUST allow recipe owners to request AI-powered optimization of recipe instructions (simplify language or streamline cooking steps). _(Premium)_
- **FR-020**: AI-generated recipes saved by users (whether via in-app generation or external agent) MUST be treated as private, user-owned recipes.
- **FR-021**: System MUST allow users to revoke external agent authorizations at any time from their account settings.

### Non-Functional Requirements _(constitution-derived)_

- **NFR-001**: All TypeScript MUST compile with `strict: true`; no `any` used outside explicitly marked test doubles. (Constitution Principle I)
- **NFR-002**: All exported functions and interfaces MUST carry JSDoc documentation. (Principle II)
- **NFR-003**: Any UI component MUST expose an accessible name queryable via `getByRole`/`getByLabel` in Playwright tests. (Principles IV & VII)
- **NFR-004**: Color MUST NOT be the sole conveyor of state; icon or text label pairing required. (Principle VII)

### Key Entities

- **AI Provider Config**: Stores a user's BYOK credentials for their chosen AI provider (e.g., OpenAI API key). Encrypted at rest. Used by the system to make AI generation requests on the user's behalf within the app.
- **Agent Authorization**: Represents a user's OAuth grant to an external agent platform. Tracks which platform, granted scopes (recipes:read, recipes:create), grant date, and revocation status. Users can revoke at any time.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-003**: AI-generated recipes are returned to the user within 15 seconds of the request.

## Assumptions

- AI integration operates in two directions: (1) **BYOK in-app** — users store their own AI provider API keys (OpenAI, Gemini, Anthropic, etc.) and Sous Chef calls the provider on their behalf; (2) **External agent platform** — Sous Chef exposes an OAuth 2.0 API that custom agents on platforms like ChatGPT and Gemini use to read/write recipes on behalf of authorized users.
- External agent platform integrations (ChatGPT GPT Actions, Gemini Extensions, etc.) will conform to each platform's required auth flow, which is typically OAuth 2.0 authorization code.

## Clarifications

- **C-002 (AI Integration Model)**: AI integration operates as two distinct patterns: **(1) BYOK in-app** — users configure their preferred AI provider (OpenAI, Gemini, Anthropic) by storing their own API credentials; Sous Chef calls the provider to generate recipes within the app. **(2) External agent platform** — Sous Chef exposes an OAuth 2.0 API so custom agents on ChatGPT, Gemini, etc. can read the user's recipe collection and create recipes on their behalf. Users must explicitly authorize agents via OAuth consent and can revoke access at any time. Both directions produce private, user-owned recipes.
