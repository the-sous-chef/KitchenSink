# Feature Specification: Grocery Lists & Online Ordering

**Feature Branch**: `007-grocery-lists`
**Created**: 2026-04-14
**Status**: Draft
**Input**: Split from `001-sous-chef-recipe-app` — grocery list generation from meal plans with ingredient aggregation, deduplication, and online ordering integration.

## Dependencies

| Spec                                                            | Relationship                                               |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| [006-meal-planning](../006-meal-planning/spec.md)               | **Required** — grocery lists are generated from meal plans |
| [001-sous-chef-recipe-app](../001-sous-chef-recipe-app/spec.md) | **Required** — ingredient data comes from Recipe entities  |
| [002-usda-food-data](../002-usda-food-data/spec.md)             | **Required** — ingredient identity and unit normalization  |
| [003-auth0-user-auth](../003-auth0-user-auth/spec.md)           | **Required** — all grocery features require authentication |
| [010-subscriptions](../010-subscriptions/spec.md)               | **Referenced** — online ordering is a premium feature      |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Grocery List Generation and Online Ordering (Priority: P2)

From a meal plan, a user generates a consolidated grocery list. The list aggregates all ingredients across the planned recipes, combines duplicates (e.g., two recipes needing onions), adjusts quantities, and accounts for items the user already has. The user can then order the groceries online through a supported and configured grocery store.

**Why this priority**: Grocery list generation is a natural extension of meal planning that delivers tangible time savings. Online ordering integration is a key premium feature that drives subscription value.

**Independent Test**: Can be tested by generating a grocery list from a 3-day meal plan and verifying ingredient aggregation and quantity calculations are correct.

**Acceptance Scenarios**:

1. **Given** a completed meal plan, **When** the user generates a grocery list, **Then** all ingredients are aggregated with combined quantities.
2. **Given** a grocery list, **When** duplicate ingredients exist across recipes, **Then** quantities are summed and displayed as a single line item.
3. **Given** a grocery list, **When** the user marks items as "already have," **Then** those items are excluded from the shopping list.
4. **Given** a grocery list and a configured grocery store, **When** the user initiates online ordering, **Then** the system maps ingredients to store products and creates an order. _(Premium feature)_
5. **Given** a user has not configured any grocery store, **When** they attempt to order online, **Then** the system guides them through store setup and connection.

---

### Edge Cases

- What happens when a user tries to generate a grocery list from an empty meal plan?
- How does the system handle grocery store API outages during online ordering?

## Requirements _(mandatory)_

### Functional Requirements

**Grocery List & Ordering**

- **FR-028**: System MUST generate a consolidated grocery list from a meal plan, aggregating and deduplicating ingredients with summed quantities.
- **FR-029**: System MUST allow users to mark grocery items as "already have" to exclude them from the list.
- **FR-030**: System MUST allow users to configure supported grocery store integrations for online ordering.
- **FR-031**: System MUST map grocery list ingredients to store products and facilitate online order creation. _(Premium)_

### Non-Functional Requirements _(constitution-derived)_

- **NFR-001**: All TypeScript MUST compile with `strict: true`; no `any` used outside explicitly marked test doubles. (Constitution Principle I)
- **NFR-002**: All exported functions and interfaces MUST carry JSDoc documentation. (Principle II)
- **NFR-003**: Any UI component MUST expose an accessible name queryable via `getByRole`/`getByLabel` in Playwright tests. (Principles IV & VII)
- **NFR-004**: Color MUST NOT be the sole conveyor of state; icon or text label pairing required. (Principle VII)

### Key Entities

- **Grocery List**: An aggregated, deduplicated list of ingredients derived from a meal plan. Items can be marked as "already have" or mapped to store products for online ordering.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-004**: Grocery lists generated from a 7-day meal plan accurately aggregate all ingredients within 5 seconds.
- **SC-008**: Users can complete a full meal-plan-to-grocery-list workflow in under 10 minutes for a 7-day plan.

## Assumptions

- Grocery store integrations will be implemented via third-party APIs (e.g., Instacart, Kroger, Amazon Fresh) — available stores will vary by user location.
