# Feature Specification: Subscriptions & Monetization

**Feature Branch**: `010-subscriptions`
**Created**: 2026-04-14
**Status**: Draft
**Input**: Split from `001-sous-chef-recipe-app` — free/premium tier definitions, feature gating, upgrade prompts, and subscription lifecycle.

## Dependencies

| Spec                                                            | Relationship                                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [003-auth0-user-auth](../003-auth0-user-auth/spec.md)           | **Required** — subscription tier is a property of the authenticated user                     |
| [001-sous-chef-recipe-app](../001-sous-chef-recipe-app/spec.md) | **Referenced** — gates private recipe visibility (FR-003)                                    |
| [004-recipe-importing](../004-recipe-importing/spec.md)         | **Referenced** — gates clone-to-private for imported recipes (FR-011)                        |
| [005-ai-integration](../005-ai-integration/spec.md)             | **Referenced** — gates AI generation and instruction optimization (FR-016, FR-019)           |
| [006-meal-planning](../006-meal-planning/spec.md)               | **Referenced** — gates AI meal suggestions, auto-generation, waste optimization (FR-025–027) |
| [007-grocery-lists](../007-grocery-lists/spec.md)               | **Referenced** — gates online ordering (FR-031)                                              |
| [009-nutrition-planning](../009-nutrition-planning/spec.md)     | **Referenced** — gates trainer nutrition planning (FR-038)                                   |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Free and Premium Subscription Tiers (Priority: P3)

New users start on a free tier that provides core functionality: creating, viewing, editing, and deleting their own recipes (all public); sharing and cloning recipes; basic recipe importing; basic meal planning (manual assignment only); grocery list generation (without online ordering); and cooking mode. Premium features (private recipe visibility, AI recipe generation, AI meal plan optimization, food waste optimization, online grocery ordering, nutrition planning for clients, and AI instruction optimization) require a paid subscription.

**Why this priority**: The monetization model must be designed early but can be built incrementally. The free tier must deliver enough value to hook users without giving away the premium differentiators.

**Independent Test**: Can be tested by verifying a free-tier user can access all basic features and sees appropriate upgrade prompts when attempting premium features.

**Acceptance Scenarios**:

1. **Given** a new user signs up, **When** their account is created, **Then** they are on the free tier with access to all basic features and all their recipes are public.
2. **Given** a free-tier user, **When** they attempt to set a recipe to private, **Then** they are prompted to upgrade to premium.
3. **Given** a free-tier user, **When** they attempt to use AI recipe generation, **Then** they see a preview or teaser of the feature with a prompt to upgrade.
4. **Given** a free-tier user, **When** they attempt to use food waste optimization in meal planning, **Then** they are prompted to upgrade.
5. **Given** a user upgrades to premium, **When** they access premium features, **Then** all premium functionality is immediately available, including the ability to set recipes to private.
6. **Given** a premium user, **When** their subscription lapses, **Then** they retain access to all their data but premium features are locked until renewal. Previously private recipes remain private (except imported/attributed recipes, which MUST remain public per source TOS and FR-011), but no new recipes can be set to private until renewal.

---

### Edge Cases

- What happens when a premium user downgrades — do they lose access to AI-generated recipes they already saved?

## Requirements _(mandatory)_

### Functional Requirements

**Subscription & Monetization**

- **FR-040**: System MUST provide a free tier with access to: recipe CRUD, sharing/cloning, basic importing, manual meal planning, grocery list generation, and cooking mode.
- **FR-041**: System MUST provide a premium tier that unlocks: private recipe visibility, AI recipe generation, AI meal suggestions, auto-generated meal plans, food waste optimization, AI instruction optimization, online grocery ordering, and trainer nutrition planning.
- **FR-042**: System MUST gate premium features with clear upgrade prompts that preview the feature value for free-tier users.
- **FR-043**: System MUST retain all user data and non-premium functionality if a premium subscription lapses.

### Non-Functional Requirements _(constitution-derived)_

- **NFR-001**: All TypeScript MUST compile with `strict: true`; no `any` used outside explicitly marked test doubles. (Constitution Principle I)
- **NFR-002**: All exported functions and interfaces MUST carry JSDoc documentation. (Principle II)
- **NFR-003**: Any UI component MUST expose an accessible name queryable via `getByRole`/`getByLabel` in Playwright tests. (Principles IV & VII)
- **NFR-004**: Color MUST NOT be the sole conveyor of state; icon or text label pairing required. (Principle VII)

### Key Entities

- **Subscription**: Tracks a user's plan (free/premium), billing cycle, and feature access permissions.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-005**: 80% of free-tier users engage with at least 3 core features (recipe creation, search, sharing) within their first week.
- **SC-006**: Premium conversion rate of at least 5% of active free-tier users within the first 3 months.

## Assumptions

- The free tier is designed as a conversion funnel — features are gated to demonstrate premium value, not to cripple the free experience.
