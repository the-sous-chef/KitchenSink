# Feature Specification: Recipe Importing

**Feature Branch**: `004-recipe-importing`
**Created**: 2026-04-14
**Status**: Draft
**Input**: Split from `001-sous-chef-recipe-app` — recipe importing from external sources (URLs, Instagram, physical copies) with attribution and deduplication.

## Dependencies

| Spec                                                            | Relationship                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------ |
| [001-sous-chef-recipe-app](../001-sous-chef-recipe-app/spec.md) | **Required** — imports create Recipe entities defined in 001       |
| [003-auth0-user-auth](../003-auth0-user-auth/spec.md)           | **Required** — all import actions require authentication           |
| [010-subscriptions](../010-subscriptions/spec.md)               | **Referenced** — visibility rules differ for free vs premium users |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Import Recipes from External Sources (Priority: P1)

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

### Edge Cases

- What happens when a user imports a URL that returns a 404 or is no longer available?
- How does the system behave when a recipe imported from Instagram is later deleted by the original creator?

## Requirements _(mandatory)_

### Functional Requirements

**Recipe Importing**

- **FR-008**: System MUST allow users to import recipes from public website URLs by extracting structured recipe data (title, ingredients, instructions, photos). If a recipe from the same URL has already been imported, the system MUST surface the existing public recipe instead of creating a duplicate, and offer the user the option to clone it.
- **FR-009**: System MUST allow users to import recipes from public Instagram posts by extracting recipe content from the post caption via Instagram's oEmbed API. Import is limited to posts where the recipe is written in the caption text; video-only or image-only posts without recipe text in the caption are unsupported (system MUST inform the user). Deduplication by source URL applies: if the same Instagram post has already been imported, the system surfaces the existing public recipe.
- **FR-010**: System MUST prominently display source attribution (URL, author, platform) for all recipes imported from websites or Instagram.
- **FR-011**: System MUST automatically mark recipes imported from public websites or Instagram as public. These recipes MUST NOT be made private unless cloned AND substantively edited by a premium user.
- **FR-012**: System MUST allow users to import recipes from physical copies via photo capture and text extraction.
- **FR-013**: System MUST mark recipes imported from physical copies as private (no public source to attribute).
- **FR-014**: System MUST reject import attempts from known paywalled recipe sources and inform the user with a clear explanation.
- **FR-014a**: _(Legal review required)_ If a user manually copies a recipe from a paid source (e.g., cookbook, subscription site) into the system, that recipe MUST be flagged as originating from a paid source and MUST NOT be made public. The exact enforcement mechanism and detection strategy require legal review to ensure compliance with copyright and TOS obligations.

### Non-Functional Requirements _(constitution-derived)_

- **NFR-001**: All TypeScript MUST compile with `strict: true`; no `any` used outside explicitly marked test doubles. (Constitution Principle I)
- **NFR-002**: All exported functions and interfaces MUST carry JSDoc documentation. (Principle II)
- **NFR-003**: Any UI component MUST expose an accessible name queryable via `getByRole`/`getByLabel` in Playwright tests. (Principles IV & VII)
- **NFR-004**: Color MUST NOT be the sole conveyor of state; icon or text label pairing required. (Principle VII)

### Key Entities

- **Recipe Source**: Attribution metadata for imported recipes — includes source URL (used as the deduplication key for public imports), platform (web/Instagram), original author, and import date. Enforces the public visibility rule for attributed recipes. A given source URL maps to exactly one public recipe.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-002**: Imported recipes from public URLs successfully extract title, ingredients, and instructions with at least 85% accuracy.

## Assumptions

- Paywalled recipe sources will be identified by a maintained blocklist; edge cases may require manual review.
- Instagram recipe import initially uses the public oEmbed API + caption text parsing. A Meta Developer application for the Graph API should be submitted early as a parallel workstream, since the review process is slow; once approved, the system can upgrade to richer extraction (structured post data, image alt text, video transcriptions).
- Instagram import only supports posts where the recipe content is written in the caption. Posts that are video-only or image-only without caption text are explicitly unsupported at launch.
- Recipe attribution for imported content is a display requirement; the system does not host or redistribute copyrighted content beyond recipe metadata (title, ingredient list, instruction summaries).
- Recipe import from physical copies relies on OCR/text extraction which will have variable accuracy; users will be able to review and correct extracted content.

## Clarifications

- **C-001 (Import Deduplication)**: When multiple users import a recipe from the same URL, the system creates a single shared public recipe keyed by source URL. Subsequent imports of the same URL surface the existing public recipe and offer the user the option to clone it into their own collection. No duplicate public recipes are created for the same source URL. Applies to both website and Instagram imports.
- **C-003 (Instagram Import Method)**: Instagram import uses the public oEmbed API with caption text parsing at launch. Only posts with recipe content in the caption are supported; video-only or image-only posts without recipe text are unsupported and the user is informed. A Meta Developer Graph API application should be submitted as a parallel workstream to enable richer extraction in a future iteration.
