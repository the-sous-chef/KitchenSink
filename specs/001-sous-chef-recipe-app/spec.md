# Feature Specification: Sous Chef - Recipe Management Core

**Feature Branch**: `001-sous-chef-recipe-app`
**Created**: 2026-04-14
**Status**: Draft
**Input**: User description: "Core recipe management for the Sous Chef app — CRUD, search, versioning, sharing/cloning, collections, and platform parity across web and mobile."

## Dependencies

This is the **foundational spec** for the Sous Chef product. All other specs depend on it.

| Spec                                                        | Relationship                                                          |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| [003-usda-food-data](../003-usda-food-data/spec.md)         | Provides the food/nutrition database backing FR-007 (ingredient data) |
| [002-auth0-user-auth](../002-auth0-user-auth/spec.md)       | Provides authentication required by FR-045                            |
| [004-recipe-importing](../004-recipe-importing/spec.md)     | Extends recipe creation with external source import                   |
| [005-ai-integration](../005-ai-integration/spec.md)         | Extends recipe creation with AI generation                            |
| [006-meal-planning](../006-meal-planning/spec.md)           | Consumes recipes for meal plan assignment                             |
| [007-grocery-lists](../007-grocery-lists/spec.md)           | Consumes recipe ingredients via meal plans                            |
| [008-cooking-mode](../008-cooking-mode/spec.md)             | Consumes recipe instructions for step-by-step display                 |
| [009-nutrition-planning](../009-nutrition-planning/spec.md) | Consumes recipe nutritional data via meal plans                       |
| [010-subscriptions](../010-subscriptions/spec.md)           | Gates premium features (private visibility, etc.)                     |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create and Manage Personal Recipes (Priority: P1)

A user opens Sous Chef, creates an account, and begins building their personal recipe collection. They can create new recipes from scratch by entering a title, description, ingredients (backed by real food data with nutritional information), step-by-step instructions, prep/cook times, servings, tags, and photos. They can edit or delete recipes they own, and organize them into collections. They can view their recipes in a searchable, filterable list.

**Why this priority**: Recipe management is the core data model that every other feature depends on. Without recipes, there is no meal planning, no grocery lists, no cooking mode. This is the foundation of the entire product.

**Independent Test**: Can be fully tested by creating an account, adding 5+ recipes with full details, editing one, deleting one, and searching/filtering the collection. Delivers immediate personal value as a digital recipe box.

**Acceptance Scenarios**:

1. **Given** a logged-in user with no recipes, **When** they create a new recipe with title, ingredients, and instructions, **Then** the recipe appears in their collection and is marked as public by default.
2. **Given** a user owns a recipe, **When** they edit the title, ingredients, or instructions, **Then** the changes are saved and reflected immediately.
3. **Given** a user owns a recipe, **When** they delete it, **Then** it is removed from their collection and no longer accessible.
4. **Given** a user does NOT own a recipe, **When** they attempt to edit or delete it, **Then** the system prevents the action and displays an appropriate message.
5. **Given** a user with 20+ recipes, **When** they search by keyword or filter by tag/category, **Then** matching recipes are returned within 2 seconds.
6. **Given** a user is entering ingredients, **When** they type an ingredient name, **Then** the system suggests matches from the real food database with associated nutritional data.

---

### User Story 2 - Share, Copy, and Clone Recipes (Priority: P1)

A user wants to share a recipe they own with the community or with specific people. They can make a recipe public so anyone can view it. Other users can copy or clone a public recipe into their own collection. A cloned recipe becomes a private copy that the new user owns and can edit freely, independent of the original.

**Why this priority**: Sharing and cloning are essential social features that drive user engagement and content growth. They also establish the public/private recipe model that underpins imported recipe attribution.

**Independent Test**: Can be tested by User A sharing a recipe publicly, User B finding and cloning it, then User B editing their clone without affecting User A's original.

**Acceptance Scenarios**:

1. **Given** a user owns a private recipe (premium), **When** they set it to public, **Then** it becomes discoverable and viewable by all users.
2. **Given** a public recipe (user-created, not imported), **When** any user copies/clones it, **Then** a new recipe is created in their collection that they fully own. Visibility follows default rules (public for free users, configurable for premium).
3. **Given** a cloned recipe, **When** the new owner edits it, **Then** the original recipe remains unchanged.
4. **Given** a user does NOT own a recipe, **When** they attempt to share or modify sharing settings, **Then** the system prevents the action.
5. **Given** a public recipe with attribution (imported from public source), **When** a user clones it, **Then** the clone retains source attribution, remains public, and can only be made private by a premium user after making a substantive edit.

---

### Edge Cases

- How does the system handle recipes with ingredients not found in the real food database?
- How does the system handle concurrent edits if a user edits the same recipe from two devices? _(Resolved: see C-005 — full version history with conflict detection)_

## Requirements _(mandatory)_

### Functional Requirements

**Recipe Management (Core)**

- **FR-001**: System MUST allow authenticated users to create recipes with title, description, ingredients (linked to real food data), step-by-step instructions, prep time, cook time, total time, servings, tags/categories, and photos.
- **FR-002**: System MUST restrict editing and deleting of recipes to the recipe owner only.
- **FR-003**: System MUST default new user-created recipes to public visibility. Premium users MAY set their own original recipes to private. Free-tier users' recipes are always public.
- **FR-004**: System MUST allow any authenticated user to view public recipes.
- **FR-005**: System MUST allow any authenticated user to copy/clone a public recipe into their own collection. A clone of a public-source imported recipe (website/Instagram) remains public and retains source attribution; the clone can only be made private by a premium user AND only after making a substantive edit to the recipe content. Cloning alone is not sufficient to change visibility.
- **FR-006**: System MUST provide search and filtering of recipes by keyword, tags, cuisine, dietary category, ingredient, and prep/cook time.
- **FR-007**: System MUST back ingredient data with a real food/nutrition database that provides caloric and macronutrient information per ingredient.
- **FR-007a**: System MUST maintain a full version history for every recipe. Each save creates a new version. Users can view previous versions and restore any prior version.
- **FR-007b**: System MUST detect concurrent edit conflicts (e.g., same recipe edited on two devices). When a conflict is detected, the system MUST warn the user and present both versions, allowing them to choose which to keep or to merge manually.

**Platform**

- **FR-044**: System MUST be available as both a mobile application and a web application with feature parity.
- **FR-045**: System MUST require user authentication for all features. There is no unauthenticated/anonymous access.

### Non-Functional Requirements _(constitution-derived)_

- **NFR-001**: All TypeScript MUST compile with `strict: true`; no `any` used outside explicitly marked test doubles. (Constitution Principle I)
- **NFR-002**: All exported functions and interfaces MUST carry JSDoc documentation. (Principle II)
- **NFR-003**: Any UI component MUST expose an accessible name queryable via `getByRole`/`getByLabel` in Playwright tests. (Principles IV & VII)
- **NFR-004**: Color MUST NOT be the sole conveyor of state; icon or text label pairing required. (Principle VII)

### Key Entities

- **User**: Represents a registered account holder. Has a subscription tier (free or premium), owns recipes, meal plans, nutrition plans, and grocery lists. Can configure AI provider credentials and manage external agent authorizations. _(Auth details: see [002-auth0-user-auth](../002-auth0-user-auth/spec.md))_
- **Recipe**: The core data object. Has a title, description, ingredients, instructions (ordered steps), prep/cook/total time, servings, tags, photos, visibility (public/private), owner, and optional source attribution. Backed by real food data for nutritional information.
- **Ingredient**: A reference to a real food item with nutritional data (calories, protein, carbs, fat per unit). Linked to recipes with a specific quantity and unit. _(Data source: see [003-usda-food-data](../003-usda-food-data/spec.md))_

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create a complete recipe (with ingredients, instructions, and photo) in under 5 minutes.
- **SC-005**: 80% of free-tier users engage with at least 3 core features (recipe creation, search, sharing) within their first week.
- **SC-009**: The system supports 10,000 concurrent users without noticeable performance degradation.

## Assumptions

- Users have internet connectivity for core features.
- The real food/nutrition database will be sourced from a publicly available or licensable dataset (e.g., USDA FoodData Central or equivalent).
- The mobile application will target iOS and Android platforms.

## Clarifications

- **C-004 (Visibility Model)**: No unauthenticated/anonymous access — all users must sign up. Visibility rules by recipe origin:
  - **User-created recipes**: Public by default. Premium users can set to private. Free-tier users' recipes are always public.
  - **Imported from public source (website/Instagram)**: Always public with source attribution. Clones of these recipes also remain public with attribution until a premium user makes a substantive edit, at which point they may set the clone to private.
  - **Imported from physical copy (photo/OCR)**: Private (no public source to attribute).
  - **Recipes from paid sources (cookbooks, subscription sites)**: MUST NEVER be made public. _(Legal review required — see FR-014a in [004-recipe-importing](../004-recipe-importing/spec.md))_
  - **On premium lapse**: Previously private user-created recipes stay private; no new recipes can be set to private until renewal. Paid-source recipes remain private regardless.
- **C-005 (Concurrent Edit Conflict Resolution)**: Every recipe save creates a new version in a full version history. Users can view and restore any previous version. On concurrent edit conflict (same recipe edited from two devices), the system detects the conflict, warns the user, and presents both versions for the user to choose or manually merge.
