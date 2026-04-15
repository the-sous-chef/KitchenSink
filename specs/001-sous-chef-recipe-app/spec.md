# Feature Specification: Sous Chef - Recipe & Meal Planning App

**Feature Branch**: `001-sous-chef-recipe-app`
**Created**: 2026-04-14
**Status**: Draft
**Input**: User description: "Build a mobile and web app named Sous Chef for recipe management, AI-powered recipe generation, meal planning, grocery ordering, nutrition planning, cooking mode, and recipe importing with attribution — featuring free and paid subscription tiers."

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

### User Story 3 - Import Recipes from External Sources (Priority: P1)

A user wants to import a recipe from a public website URL, an Instagram post, or a physical copy (via photo/OCR). When importing from a website or Instagram, the system extracts the recipe data, attributes the original source, and saves it as a public recipe. The user can clone the imported recipe to make their own editable version, but the clone remains public with attribution until the user makes a substantive edit (at which point a premium user may set it to private). Physical copy imports (photo scanning) create private recipes since there is no public URL to attribute. Recipes from paid sources (cookbooks, subscription sites) must never be made public — this area requires legal review.

**Why this priority**: Recipe importing dramatically reduces friction for onboarding new users who already have recipes elsewhere. Attribution compliance for web/Instagram imports is a legal requirement.

**Independent Test**: Can be tested by importing a recipe from a public URL, verifying attribution is displayed and the recipe is public, then cloning it to create an editable private copy.

**Acceptance Scenarios**:

1. **Given** a user provides a public recipe URL, **When** the system imports it, **Then** a recipe is created with extracted title, ingredients, instructions, and visible source attribution.
2. **Given** a recipe is imported from a URL or Instagram, **When** it is saved, **Then** it is automatically marked as public and the original source is prominently displayed.
3. **Given** a user wants to edit an imported public recipe, **When** they clone it, **Then** they receive an editable copy that remains public with source attribution. The clone can only be made private by a premium user after making a substantive edit to the content.
4. **Given** a user photographs a physical recipe (cookbook page, handwritten card), **When** the system processes the image, **Then** the extracted recipe is saved as a private recipe owned by the user.
5. **Given** an imported recipe from Instagram, **When** it is displayed, **Then** the original creator's handle and post link are visible as attribution.
6. **Given** a URL from a paywalled source (e.g., NY Times Cooking, Delish), **When** a user attempts to import, **Then** the system informs the user that paywalled content cannot be imported and explains why.

---

### User Story 4 - AI-Powered Recipe Generation and Assistance (Priority: P2)

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

### User Story 5 - Meal Planning (Priority: P2)

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

### User Story 6 - Grocery List Generation and Online Ordering (Priority: P2)

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

### User Story 7 - Cooking Mode (Priority: P2)

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

### User Story 8 - Nutrition Planning (Priority: P3)

A personal trainer or diet-conscious user creates nutrition plans that define daily or weekly caloric and macronutrient targets. They can link meal plans to nutrition plans, and the system tracks whether the planned meals meet the nutritional goals. The system highlights gaps or excesses in the plan.

**Why this priority**: Nutrition planning serves a more specialized audience (trainers, dieters) and builds on top of the meal planning and recipe data foundations.

**Independent Test**: Can be tested by creating a nutrition plan with specific macro targets, linking it to a meal plan, and verifying the system shows compliance or deviation.

**Acceptance Scenarios**:

1. **Given** a user creates a nutrition plan, **When** they define daily calorie and macro targets (protein, carbs, fat), **Then** the plan is saved and visible on their dashboard.
2. **Given** a nutrition plan linked to a meal plan, **When** the user views the plan, **Then** they see a comparison of planned nutrition vs. targets with clear indicators for gaps or excesses.
3. **Given** a personal trainer, **When** they create a nutrition plan for a client, **Then** the client can view the plan and use it to guide their meal planning. _(Premium feature)_
4. **Given** a meal plan does not meet nutrition targets, **When** the user views the analysis, **Then** the system suggests recipe swaps or adjustments to better meet goals. _(Premium feature)_

---

### User Story 9 - Free and Premium Subscription Tiers (Priority: P3)

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

- What happens when a user imports a URL that returns a 404 or is no longer available?
- How does the system handle recipes with ingredients not found in the real food database?
- What happens when a user tries to generate a grocery list from an empty meal plan?
- How does the system behave when a recipe imported from Instagram is later deleted by the original creator?
- What happens during Cooking Mode if the device loses internet connectivity?
- How does the system handle concurrent edits if a user edits the same recipe from two devices? _(Resolved: see C-005 — full version history with conflict detection)_
- What happens when AI recipe generation fails or returns low-quality results?
- How does the system handle grocery store API outages during online ordering?
- What happens when a premium user downgrades — do they lose access to AI-generated recipes they already saved?
- How does the system handle very large meal plans (30+ days)?

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

**Recipe Importing**

- **FR-008**: System MUST allow users to import recipes from public website URLs by extracting structured recipe data (title, ingredients, instructions, photos). If a recipe from the same URL has already been imported, the system MUST surface the existing public recipe instead of creating a duplicate, and offer the user the option to clone it.
- **FR-009**: System MUST allow users to import recipes from public Instagram posts by extracting recipe content from the post caption via Instagram's oEmbed API. Import is limited to posts where the recipe is written in the caption text; video-only or image-only posts without recipe text in the caption are unsupported (system MUST inform the user). Deduplication by source URL applies: if the same Instagram post has already been imported, the system surfaces the existing public recipe.
- **FR-010**: System MUST prominently display source attribution (URL, author, platform) for all recipes imported from websites or Instagram.
- **FR-011**: System MUST automatically mark recipes imported from public websites or Instagram as public. These recipes MUST NOT be made private unless cloned AND substantively edited by a premium user.
- **FR-012**: System MUST allow users to import recipes from physical copies via photo capture and text extraction.
- **FR-013**: System MUST mark recipes imported from physical copies as private (no public source to attribute).
- **FR-014**: System MUST reject import attempts from known paywalled recipe sources and inform the user with a clear explanation.
- **FR-014a**: _(Legal review required)_ If a user manually copies a recipe from a paid source (e.g., cookbook, subscription site) into the system, that recipe MUST be flagged as originating from a paid source and MUST NOT be made public. The exact enforcement mechanism and detection strategy require legal review to ensure compliance with copyright and TOS obligations.

**AI Integration**

- **FR-015**: System MUST allow users to configure their preferred AI provider (e.g., OpenAI, Gemini, Anthropic) by securely storing their own API credentials (BYOK model).
- **FR-016**: System MUST call the user's configured AI provider to generate recipes based on criteria (ingredients, dietary restrictions, cuisine, calorie targets) and return results within the app.
- **FR-017**: System MUST allow users to preview AI-generated recipes before optionally saving them to their collection.
- **FR-018**: System MUST expose an OAuth 2.0-protected API that allows authorized external agents (e.g., ChatGPT GPT Actions, Gemini Extensions) to read the user's recipe collection and create recipes on their behalf. Users MUST explicitly grant consent via an OAuth authorization flow before any agent can access their account.
- **FR-019**: System MUST allow recipe owners to request AI-powered optimization of recipe instructions (simplify language or streamline cooking steps). _(Premium)_
- **FR-020**: AI-generated recipes saved by users (whether via in-app generation or external agent) MUST be treated as private, user-owned recipes.
- **FR-021**: System MUST allow users to revoke external agent authorizations at any time from their account settings.

**Meal Planning**

- **FR-022**: System MUST allow users to create meal plans for configurable date ranges with customizable meal slots (breakfast, lunch, dinner, snacks).
- **FR-023**: System MUST allow users to manually assign recipes from their collection to meal slots.
- **FR-024**: System MUST display daily and weekly nutritional summaries for meal plans based on recipe ingredient data.
- **FR-025**: System MUST provide AI-powered meal suggestions based on user preferences, dietary needs, and existing recipes. _(Premium)_
- **FR-026**: System MUST provide auto-generation of complete meal plans based on user-defined constraints. _(Premium)_
- **FR-027**: System MUST provide food waste optimization that suggests recipe arrangements to maximize shared ingredient usage across meals. _(Premium)_

**Grocery List & Ordering**

- **FR-028**: System MUST generate a consolidated grocery list from a meal plan, aggregating and deduplicating ingredients with summed quantities.
- **FR-029**: System MUST allow users to mark grocery items as "already have" to exclude them from the list.
- **FR-030**: System MUST allow users to configure supported grocery store integrations for online ordering.
- **FR-031**: System MUST map grocery list ingredients to store products and facilitate online order creation. _(Premium)_

**Cooking Mode**

- **FR-032**: System MUST provide a Cooking Mode that displays recipe instructions one step at a time in large, readable formatting.
- **FR-033**: System MUST allow users to navigate forward and backward through recipe steps in Cooking Mode.
- **FR-034**: System MUST provide integrated countdown timers for recipe steps that include time durations.
- **FR-035**: System MUST keep the device screen active while Cooking Mode is engaged.

**Nutrition Planning**

- **FR-036**: System MUST allow users to create nutrition plans with daily caloric and macronutrient targets (protein, carbs, fat).
- **FR-037**: System MUST allow linking meal plans to nutrition plans and display compliance analysis.
- **FR-038**: System MUST allow users with appropriate permissions to create nutrition plans for other users (trainer-client model). _(Premium)_
- **FR-039**: System MUST suggest recipe swaps to better align meal plans with nutrition targets. _(Premium)_

**Subscription & Monetization**

- **FR-040**: System MUST provide a free tier with access to: recipe CRUD, sharing/cloning, basic importing, manual meal planning, grocery list generation, and cooking mode.
- **FR-041**: System MUST provide a premium tier that unlocks: private recipe visibility, AI recipe generation, AI meal suggestions, auto-generated meal plans, food waste optimization, AI instruction optimization, online grocery ordering, and trainer nutrition planning.
- **FR-042**: System MUST gate premium features with clear upgrade prompts that preview the feature value for free-tier users.
- **FR-043**: System MUST retain all user data and non-premium functionality if a premium subscription lapses.

**Platform**

- **FR-044**: System MUST be available as both a mobile application and a web application with feature parity.
- **FR-045**: System MUST require user authentication for all features. There is no unauthenticated/anonymous access.

### Non-Functional Requirements _(constitution-derived)_

- **NFR-001**: All TypeScript MUST compile with `strict: true`; no `any` used outside explicitly marked test doubles. (Constitution Principle I)
- **NFR-002**: All exported functions and interfaces MUST carry JSDoc documentation. (Principle II)
- **NFR-003**: Any UI component MUST expose an accessible name queryable via `getByRole`/`getByLabel` in Playwright tests. (Principles IV & VII)
- **NFR-004**: Color MUST NOT be the sole conveyor of state; icon or text label pairing required. (Principle VII)

### Key Entities

- **User**: Represents a registered account holder. Has a subscription tier (free or premium), owns recipes, meal plans, nutrition plans, and grocery lists. Can have a trainer-client relationship with other users. Can configure AI provider credentials and manage external agent authorizations.
- **Recipe**: The core data object. Has a title, description, ingredients, instructions (ordered steps), prep/cook/total time, servings, tags, photos, visibility (public/private), owner, and optional source attribution. Backed by real food data for nutritional information.
- **Ingredient**: A reference to a real food item with nutritional data (calories, protein, carbs, fat per unit). Linked to recipes with a specific quantity and unit.
- **AI Provider Config**: Stores a user's BYOK credentials for their chosen AI provider (e.g., OpenAI API key). Encrypted at rest. Used by the system to make AI generation requests on the user's behalf within the app.
- **Agent Authorization**: Represents a user's OAuth grant to an external agent platform. Tracks which platform, granted scopes (recipes:read, recipes:create), grant date, and revocation status. Users can revoke at any time.
- **Meal Plan**: A collection of meal slots organized by date and meal type (breakfast, lunch, dinner, snack). Spans a configurable date range. Can be linked to a nutrition plan.
- **Grocery List**: An aggregated, deduplicated list of ingredients derived from a meal plan. Items can be marked as "already have" or mapped to store products for online ordering.
- **Nutrition Plan**: Defines daily/weekly caloric and macronutrient targets. Can be created for self or for a client (trainer model). Links to meal plans for compliance tracking.
- **Subscription**: Tracks a user's plan (free/premium), billing cycle, and feature access permissions.
- **Recipe Source**: Attribution metadata for imported recipes — includes source URL (used as the deduplication key for public imports), platform (web/Instagram), original author, and import date. Enforces the public visibility rule for attributed recipes. A given source URL maps to exactly one public recipe.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can create a complete recipe (with ingredients, instructions, and photo) in under 5 minutes.
- **SC-002**: Imported recipes from public URLs successfully extract title, ingredients, and instructions with at least 85% accuracy.
- **SC-003**: AI-generated recipes are returned to the user within 15 seconds of the request.
- **SC-004**: Grocery lists generated from a 7-day meal plan accurately aggregate all ingredients within 5 seconds.
- **SC-005**: 80% of free-tier users engage with at least 3 core features (recipe creation, search, sharing) within their first week.
- **SC-006**: Premium conversion rate of at least 5% of active free-tier users within the first 3 months.
- **SC-007**: Cooking Mode steps are readable from 3 feet away on standard mobile devices.
- **SC-008**: Users can complete a full meal-plan-to-grocery-list workflow in under 10 minutes for a 7-day plan.
- **SC-009**: The system supports 10,000 concurrent users without noticeable performance degradation.
- **SC-010**: Nutritional calculations for meal plans are accurate to within 5% of the source food database values.

## Assumptions

- Users have internet connectivity for core features; Cooking Mode should function with limited connectivity once the recipe is loaded.
- The real food/nutrition database will be sourced from a publicly available or licensable dataset (e.g., USDA FoodData Central or equivalent).
- Grocery store integrations will be implemented via third-party APIs (e.g., Instacart, Kroger, Amazon Fresh) — available stores will vary by user location.
- Recipe import from physical copies relies on OCR/text extraction which will have variable accuracy; users will be able to review and correct extracted content.
- Paywalled recipe sources will be identified by a maintained blocklist; edge cases may require manual review.
- AI integration operates in two directions: (1) **BYOK in-app** — users store their own AI provider API keys (OpenAI, Gemini, Anthropic, etc.) and Sous Chef calls the provider on their behalf; (2) **External agent platform** — Sous Chef exposes an OAuth 2.0 API that custom agents on platforms like ChatGPT and Gemini use to read/write recipes on behalf of authorized users.
- External agent platform integrations (ChatGPT GPT Actions, Gemini Extensions, etc.) will conform to each platform's required auth flow, which is typically OAuth 2.0 authorization code.
- The trainer-client relationship for nutrition planning requires explicit consent from the client user.
- Instagram recipe import initially uses the public oEmbed API + caption text parsing. A Meta Developer application for the Graph API should be submitted early as a parallel workstream, since the review process is slow; once approved, the system can upgrade to richer extraction (structured post data, image alt text, video transcriptions).
- Instagram import only supports posts where the recipe content is written in the caption. Posts that are video-only or image-only without caption text are explicitly unsupported at launch.
- The mobile application will target iOS and Android platforms.
- The free tier is designed as a conversion funnel — features are gated to demonstrate premium value, not to cripple the free experience.
- Recipe attribution for imported content is a display requirement; the system does not host or redistribute copyrighted content beyond recipe metadata (title, ingredient list, instruction summaries).

## Clarifications

- **C-001 (Import Deduplication)**: When multiple users import a recipe from the same URL, the system creates a single shared public recipe keyed by source URL. Subsequent imports of the same URL surface the existing public recipe and offer the user the option to clone it into their own collection. No duplicate public recipes are created for the same source URL. Applies to both website and Instagram imports.
- **C-003 (Instagram Import Method)**: Instagram import uses the public oEmbed API with caption text parsing at launch. Only posts with recipe content in the caption are supported; video-only or image-only posts without recipe text are unsupported and the user is informed. A Meta Developer Graph API application should be submitted as a parallel workstream to enable richer extraction in a future iteration.
- **C-004 (Visibility Model)**: No unauthenticated/anonymous access — all users must sign up. Visibility rules by recipe origin:
  - **User-created recipes**: Public by default. Premium users can set to private. Free-tier users' recipes are always public.
  - **Imported from public source (website/Instagram)**: Always public with source attribution. Clones of these recipes also remain public with attribution until a premium user makes a substantive edit, at which point they may set the clone to private.
  - **Imported from physical copy (photo/OCR)**: Private (no public source to attribute).
  - **Recipes from paid sources (cookbooks, subscription sites)**: MUST NEVER be made public. _(Legal review required — see FR-014a for enforcement strategy.)_
  - **On premium lapse**: Previously private user-created recipes stay private; no new recipes can be set to private until renewal. Paid-source recipes remain private regardless.
- **C-002 (AI Integration Model)**: AI integration operates as two distinct patterns: **(1) BYOK in-app** — users configure their preferred AI provider (OpenAI, Gemini, Anthropic) by storing their own API credentials; Sous Chef calls the provider to generate recipes within the app. **(2) External agent platform** — Sous Chef exposes an OAuth 2.0 API so custom agents on ChatGPT, Gemini, etc. can read the user's recipe collection and create recipes on their behalf. Users must explicitly authorize agents via OAuth consent and can revoke access at any time. Both directions produce private, user-owned recipes.
- **C-005 (Concurrent Edit Conflict Resolution)**: Every recipe save creates a new version in a full version history. Users can view and restore any previous version. On concurrent edit conflict (same recipe edited from two devices), the system detects the conflict, warns the user, and presents both versions for the user to choose or manually merge.
