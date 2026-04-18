# Feature Specification: Nutrition Planning

**Feature Branch**: `009-nutrition-planning`
**Created**: 2026-04-14
**Status**: Draft
**Input**: Split from `001-sous-chef-recipe-app` — nutrition plans with macro targets, meal plan compliance tracking, and trainer-client model.

## Dependencies

| Spec                                                            | Relationship                                                                                   |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [006-meal-planning](../006-meal-planning/spec.md)               | **Required** — nutrition plans link to meal plans for compliance analysis                      |
| [002-usda-food-data](../002-usda-food-data/spec.md)             | **Required** — nutritional calculations depend on food data                                    |
| [001-sous-chef-recipe-app](../001-sous-chef-recipe-app/spec.md) | **Required** — recipe nutritional data is the basis for compliance calculations                |
| [003-auth0-user-auth](../003-auth0-user-auth/spec.md)           | **Required** — all features require authentication; trainer-client requires user relationships |
| [010-subscriptions](../010-subscriptions/spec.md)               | **Referenced** — trainer nutrition planning and AI recipe swaps are premium features           |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Nutrition Planning (Priority: P3)

A personal trainer or diet-conscious user creates nutrition plans that define daily or weekly caloric and macronutrient targets. They can link meal plans to nutrition plans, and the system tracks whether the planned meals meet the nutritional goals. The system highlights gaps or excesses in the plan.

**Why this priority**: Nutrition planning serves a more specialized audience (trainers, dieters) and builds on top of the meal planning and recipe data foundations.

**Independent Test**: Can be tested by creating a nutrition plan with specific macro targets, linking it to a meal plan, and verifying the system shows compliance or deviation.

**Acceptance Scenarios**:

1. **Given** a user creates a nutrition plan, **When** they define daily calorie and macro targets (protein, carbs, fat), **Then** the plan is saved and visible on their dashboard.
2. **Given** a nutrition plan linked to a meal plan, **When** the user views the plan, **Then** they see a comparison of planned nutrition vs. targets with clear indicators for gaps or excesses.
3. **Given** a personal trainer, **When** they create a nutrition plan for a client, **Then** the client can view the plan and use it to guide their meal planning. _(Premium feature)_
4. **Given** a meal plan does not meet nutrition targets, **When** the user views the analysis, **Then** the system suggests recipe swaps or adjustments to better meet goals. _(Premium feature)_

---

### Edge Cases

None identified specific to this spec.

## Requirements _(mandatory)_

### Functional Requirements

**Nutrition Planning**

- **FR-036**: System MUST allow users to create nutrition plans with daily caloric and macronutrient targets (protein, carbs, fat).
- **FR-037**: System MUST allow linking meal plans to nutrition plans and display compliance analysis.
- **FR-038**: System MUST allow users with appropriate permissions to create nutrition plans for other users (trainer-client model). _(Premium)_
- **FR-039**: System MUST suggest recipe swaps to better align meal plans with nutrition targets. _(Premium)_

### Non-Functional Requirements _(constitution-derived)_

- **NFR-001**: All TypeScript MUST compile with `strict: true`; no `any` used outside explicitly marked test doubles. (Constitution Principle I)
- **NFR-002**: All exported functions and interfaces MUST carry JSDoc documentation. (Principle II)
- **NFR-003**: Any UI component MUST expose an accessible name queryable via `getByRole`/`getByLabel` in Playwright tests. (Principles IV & VII)
- **NFR-004**: Color MUST NOT be the sole conveyor of state; icon or text label pairing required. (Principle VII)

### Key Entities

- **Nutrition Plan**: Defines daily/weekly caloric and macronutrient targets. Can be created for self or for a client (trainer model). Links to meal plans for compliance tracking.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-010**: Nutritional calculations for meal plans are accurate to within 5% of the source food database values.

## Assumptions

- The trainer-client relationship for nutrition planning requires explicit consent from the client user.
