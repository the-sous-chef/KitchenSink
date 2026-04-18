# Feature Specification: Cooking Mode

**Feature Branch**: `008-cooking-mode`
**Created**: 2026-04-14
**Status**: Draft
**Input**: Split from `001-sous-chef-recipe-app` — step-by-step hands-free cooking interface with timers and screen wake lock.

## Dependencies

| Spec                                                            | Relationship                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------- |
| [001-sous-chef-recipe-app](../001-sous-chef-recipe-app/spec.md) | **Required** — cooking mode renders Recipe instructions from 001 |
| [002-auth0-user-auth](../002-auth0-user-auth/spec.md)           | **Required** — all features require authentication               |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Cooking Mode (Priority: P2)

A user selects a recipe and enters "Cooking Mode," which presents a step-by-step, hands-free-friendly interface optimized for use while actively cooking. Instructions are displayed one step at a time in large, readable text. The user advances through steps with simple gestures, taps, or voice commands. Timers are integrated for steps that require waiting.

**Why this priority**: Cooking mode is a high-engagement feature that makes the app genuinely useful in the kitchen, differentiating it from static recipe viewers.

**Independent Test**: Can be tested by entering cooking mode for a recipe with 8+ steps and timers, advancing through all steps, and verifying timers work correctly.

**Acceptance Scenarios**:

1. **Given** a user selects a recipe, **When** they enter Cooking Mode, **Then** the first instruction step is displayed in large, readable text optimized for kitchen use.
2. **Given** a user is in Cooking Mode, **When** they advance to the next step, **Then** the display transitions smoothly to show the next instruction.
3. **Given** a step includes a time duration (e.g., "bake for 25 minutes"), **When** the user starts the timer, **Then** a countdown is displayed and an alert sounds when complete.
4. **Given** a user is in Cooking Mode, **When** they want to go back to review a previous step, **Then** they can navigate backward without losing their place.
5. **Given** a user is cooking, **When** the device screen would normally turn off, **Then** Cooking Mode keeps the screen active.

---

### Edge Cases

- What happens during Cooking Mode if the device loses internet connectivity?

## Requirements _(mandatory)_

### Functional Requirements

**Cooking Mode**

- **FR-032**: System MUST provide a Cooking Mode that displays recipe instructions one step at a time in large, readable formatting.
- **FR-033**: System MUST allow users to navigate forward and backward through recipe steps in Cooking Mode.
- **FR-034**: System MUST provide integrated countdown timers for recipe steps that include time durations.
- **FR-035**: System MUST keep the device screen active while Cooking Mode is engaged.

### Non-Functional Requirements _(constitution-derived)_

- **NFR-001**: All TypeScript MUST compile with `strict: true`; no `any` used outside explicitly marked test doubles. (Constitution Principle I)
- **NFR-002**: All exported functions and interfaces MUST carry JSDoc documentation. (Principle II)
- **NFR-003**: Any UI component MUST expose an accessible name queryable via `getByRole`/`getByLabel` in Playwright tests. (Principles IV & VII)
- **NFR-004**: Color MUST NOT be the sole conveyor of state; icon or text label pairing required. (Principle VII)

### Key Entities

None specific — Cooking Mode consumes the Recipe entity defined in [001-sous-chef-recipe-app](../001-sous-chef-recipe-app/spec.md).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-007**: Cooking Mode steps are readable from 3 feet away on standard mobile devices.

## Assumptions

- Users have internet connectivity for core features; Cooking Mode should function with limited connectivity once the recipe is loaded.
