# Feature Specification: Meal Planning

**Feature Branch**: `006-meal-planning`
**Created**: 2026-04-14
**Status**: Draft
**Input**: Split from `001-sous-chef-recipe-app` — meal plan creation, recipe assignment, nutritional summaries, and AI-powered meal suggestions.

## Dependencies

| Spec                                                            | Relationship                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [001-sous-chef-recipe-app](../001-sous-chef-recipe-app/spec.md) | **Required** — meal plans assign Recipe entities from the user's collection          |
| [003-usda-food-data](../003-usda-food-data/spec.md)             | **Required** — nutritional summaries depend on food data                             |
| [002-auth0-user-auth](../002-auth0-user-auth/spec.md)           | **Required** — all meal planning requires authentication                             |
| [005-ai-integration](../005-ai-integration/spec.md)             | **Referenced** — AI meal suggestions and auto-generation use AI provider config      |
| [007-grocery-lists](../007-grocery-lists/spec.md)               | **Downstream** — grocery lists are generated from meal plans                         |
| [009-nutrition-planning](../009-nutrition-planning/spec.md)     | **Downstream** — nutrition plans link to meal plans for compliance                   |
| [010-subscriptions](../010-subscriptions/spec.md)               | **Referenced** — AI suggestions, auto-generation, and waste optimization are premium |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Meal Planning (Priority: P2)

A user creates a meal plan for a configurable time period (e.g., 1 week, 2 weeks). They can manually assign recipes to specific meals (breakfast, lunch, dinner, snacks) on specific days, or use AI-powered features to suggest meals, auto-generate an entire plan, or optimize for reduced food waste by reusing overlapping ingredients across meals.

**Why this priority**: Meal planning transforms the app from a recipe storage tool into a daily-use lifestyle tool, which is critical for retention and demonstrating premium value.

**Independent Test**: Can be tested by creating a 7-day meal plan, assigning recipes to meals, and verifying the plan displays correctly with all nutritional summaries.

**Acceptance Scenarios**:

1. **Given** a user with recipes in their collection, **When** they create a new meal plan for a date range, **Then** they can assign recipes to specific meals on specific days.
2. **Given** a meal plan in progress, **When** the user requests AI meal suggestions, **Then** the system suggests recipes that fit dietary preferences and available recipes. _(Premium feature)_
3. **Given** a user requests an auto-generated meal plan, **When** they provide preferences and constraints, **Then** the system generates a complete plan they can review and modify. _(Premium feature)_
4. **Given** a meal plan with multiple recipes, **When** the user requests food waste optimization, **Then** the system rearranges or suggests swaps to maximize shared ingredient usage. _(Premium feature)_
5. **Given** a completed meal plan, **When** the user views it, **Then** they see daily and weekly nutritional summaries based on recipe data.

---

### Edge Cases

- How does the system handle very large meal plans (30+ days)?

## Requirements _(mandatory)_

### Functional Requirements

**Meal Planning**

- **FR-022**: System MUST allow users to create meal plans for configurable date ranges with customizable meal slots (breakfast, lunch, dinner, snacks).
- **FR-023**: System MUST allow users to manually assign recipes from their collection to meal slots.
- **FR-024**: System MUST display daily and weekly nutritional summaries for meal plans based on recipe ingredient data.
- **FR-025**: System MUST provide AI-powered meal suggestions based on user preferences, dietary needs, and existing recipes. _(Premium)_
- **FR-026**: System MUST provide auto-generation of complete meal plans based on user-defined constraints. _(Premium)_
- **FR-027**: System MUST provide food waste optimization that suggests recipe arrangements to maximize shared ingredient usage across meals. _(Premium)_

### Non-Functional Requirements _(constitution-derived)_

- **NFR-001**: All TypeScript MUST compile with `strict: true`; no `any` used outside explicitly marked test doubles. (Constitution Principle I)
- **NFR-002**: All exported functions and interfaces MUST carry JSDoc documentation. (Principle II)
- **NFR-003**: Any UI component MUST expose an accessible name queryable via `getByRole`/`getByLabel` in Playwright tests. (Principles IV & VII)
- **NFR-004**: Color MUST NOT be the sole conveyor of state; icon or text label pairing required. (Principle VII)

### Key Entities

- **Meal Plan**: A collection of meal slots organized by date and meal type (breakfast, lunch, dinner, snack). Spans a configurable date range. Can be linked to a nutrition plan. _(See [009-nutrition-planning](../009-nutrition-planning/spec.md))_

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-008**: Users can complete a full meal-plan-to-grocery-list workflow in under 10 minutes for a 7-day plan.

## Assumptions

- None specific to this spec beyond those in [001-sous-chef-recipe-app](../001-sous-chef-recipe-app/spec.md).
