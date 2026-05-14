# V-Model Requirements Specification: Recipe Importing

**Feature Branch**: `004-recipe-importing`
**Created**: 2026-05-09
**Status**: Draft
**Source**: `specs/004-recipe-importing/spec.md`

## Overview

Recipe Importing enables users to bring recipes into the Sous Chef platform from three external sources: public website URLs, Instagram posts, and physical copies (via photo/OCR). The feature enforces attribution for web/Instagram imports (a legal requirement), deduplication by source URL, and visibility rules that differ by import type and subscription tier. It depends on the Recipe entity model (001), authentication (002), and subscription visibility rules (010).

## Requirements

### Functional Requirements

| ID      | Description                                                                                                                                                                                                                                | Priority | Rationale                                                                                                     | Verification Method |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------- | ------------------- |
| REQ-001 | The system SHALL allow users to import recipes from public website URLs by extracting structured recipe data including title, ingredients, instructions,, photos.                                                                          | P1       | Core import capability; reduces onboarding friction for users with existing recipes elsewhere.                | Test                |
| REQ-002 | The system SHALL allow users to import recipes from public Instagram posts by extracting recipe content from the post caption via Instagram's oEmbed API.                                                                                  | P1       | Instagram is a primary source of recipe discovery; oEmbed is the available API at launch.                     | Test                |
| REQ-003 | The system SHALL inform the user, reject the import when an Instagram post is video-only / image-only without recipe text in the caption.                                                                                                  | P1       | Only caption-based imports are supported at launch; unsupported formats must not silently fail.               | Test                |
| REQ-004 | The system SHALL prominently display source attribution — including source URL, original author,, platform — for all recipes imported from public websites / Instagram.                                                                    | P1       | Attribution compliance is a legal requirement for redistributing recipe metadata.                             | Test                |
| REQ-005 | The system SHALL automatically mark recipes imported from public websites / Instagram as public.                                                                                                                                           | P1       | Imported recipes with a public source URL must be publicly accessible to maintain attribution integrity.      | Test                |
| REQ-006 | The system SHALL NOT allow a publicly imported recipe to be made private except when a premium user completes the cloned-recipe substantive-edit workflow.                                                                                 | P1       | Prevents circumvention of attribution rules; premium gating aligns with subscription model (010).             | Test                |
| REQ-007 | The system SHALL allow users to clone an imported public recipe to receive their own editable copy; the clone SHALL retain source attribution, remain public until a premium user makes a substantive edit.                                | P1       | Cloning is the mechanism for users to personalise imported recipes without violating attribution rules.       | Test                |
| REQ-008 | The system SHALL enforce deduplication by source URL: if a recipe from the same URL has already been imported, the system MUST surface the existing public recipe instead of creating a duplicate,, offer the user the option to clone it. | P1       | Prevents duplicate public recipes for the same source; applies to both website and Instagram imports (C-001). | Test                |
| REQ-009 | The system SHALL allow users to import recipes from physical copies via photo capture, text extraction (OCR).                                                                                                                              | P1       | Physical copy import supports users with cookbooks or handwritten recipe cards.                               | Test                |
| REQ-010 | The system SHALL mark recipes imported from physical copies as private, with no source attribution.                                                                                                                                        | P1       | Physical copies have no public URL to attribute; private default protects copyright.                          | Test                |
| REQ-011 | The system SHALL allow users to review, correct OCR-extracted content before saving a physical copy import.                                                                                                                                | P2       | OCR accuracy is variable; user correction prevents low-quality recipe data.                                   | Demonstration       |
| REQ-012 | The system SHALL reject import attempts from known paywalled recipe sources, inform the user with a clear explanation of why the import cannot proceed.                                                                                    | P1       | Paywalled content must not be redistributed; legal and TOS compliance requirement.                            | Test                |
| REQ-013 | The system SHALL flag recipes where a user manually enters content originating from a paid source (e.g., cookbook, subscription site), MUST NOT allow such recipes to be made public.                                                      | P1       | Copyright and TOS compliance; exact detection mechanism subject to legal review (FR-014a).                    | Inspection          |
| REQ-014 | The system SHALL inform the user when a URL returns a 404 / is otherwise unavailable,, SHALL NOT create a recipe record for an unreachable source.                                                                                         | P2       | Prevents orphaned recipe records with no accessible source; clear user feedback required.                     | Test                |
| REQ-015 | The system SHALL handle the case where an Instagram post previously imported is later deleted by the original creator, preserving the imported recipe record while noting the source is no longer available.                               | P2       | Imported data should not be silently lost when the source is removed; attribution note must be updated.       | Test                |

### Non-Functional Requirements

| ID         | Description                                                                                                                              | Priority | Rationale                                                                                              | Verification Method |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ | ------------------- |
| REQ-NF-001 | All TypeScript code for this feature MUST compile with `strict: true`; `any` MUST NOT be used outside explicitly marked test doubles.    | P1       | Constitution Principle I — type safety is non-negotiable across the codebase.                          | Inspection          |
| REQ-NF-002 | All exported functions, interfaces introduced by this feature MUST carry JSDoc documentation.                                            | P1       | Constitution Principle II — documented APIs are required for maintainability.                          | Inspection          |
| REQ-NF-003 | Recipe extraction from public URLs MUST achieve at least 85% accuracy for title, ingredients,, instructions (SC-002).                    | P1       | Measurable success criterion defined in spec; below this threshold the feature does not meet its goal. | Analysis            |
| REQ-NF-004 | Any UI component introduced by this feature MUST expose an accessible name queryable via `getByRole` / `getByLabel` in Playwright tests. | P1       | Constitution Principles IV & VII — accessibility is a first-class requirement.                         | Test                |
| REQ-NF-005 | Color MUST NOT be the sole conveyor of state in any UI component for this feature; icon / text label pairing is required.                | P1       | Constitution Principle VII — accessibility for users with colour vision deficiency.                    | Inspection          |

### Interface Requirements

| ID         | Description                                                                                                                                                                            | Priority | Rationale                                                                                                 | Verification Method |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------- | ------------------- |
| REQ-IF-001 | The system SHALL integrate with Instagram's public oEmbed API for caption extraction from Instagram post URLs.                                                                         | P1       | oEmbed is the approved launch-phase integration method (C-003); Graph API upgrade is a future workstream. | Test                |
| REQ-IF-002 | The system SHALL integrate with an OCR/text extraction service to process photos of physical recipe copies.                                                                            | P1       | Physical copy import requires machine-readable text extraction from images.                               | Test                |
| REQ-IF-003 | The system SHALL integrate with the Recipe entity model defined in feature 001-sous-chef-recipe-app; all imported recipes MUST be stored as Recipe entities conforming to that schema. | P1       | Recipe Importing depends on 001 for the core data model.                                                  | Inspection          |
| REQ-IF-004 | The system SHALL enforce authentication via feature 002-auth0-user-auth for all import actions; unauthenticated import attempts MUST be rejected.                                      | P1       | All import actions require authentication per spec dependency on 002.                                     | Test                |

### Constraint Requirements

| ID         | Description                                                                                                                                                                             | Priority | Rationale                                                                                   | Verification Method |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------- | ------------------- |
| REQ-CN-001 | The system MUST NOT create more than one public recipe record per unique source URL; source URL is the deduplication key for public imports.                                            | P1       | Deduplication is a core data integrity constraint (C-001, FR-008, FR-009).                  | Test                |
| REQ-CN-002 | The system MUST NOT make public any recipe imported from a paywalled / paid source, regardless of how it was entered.                                                                   | P1       | Legal and TOS compliance; copyright protection for paid content.                            | Inspection          |
| REQ-CN-003 | Instagram import at launch MUST be limited to posts where recipe content is present in the caption text; video-only, image-only posts without caption text are explicitly out of scope. | P1       | Scope constraint defined in spec (FR-009, C-003); prevents unsupported extraction attempts. | Inspection          |
| REQ-CN-004 | The exact enforcement mechanism, detection strategy for manually entered paid-source recipes (REQ-013) MUST NOT be finalised without legal review.                                      | P1       | FR-014a explicitly flags this area as requiring legal review before implementation.         | Inspection          |

## Assumptions

- Paywalled recipe sources will be identified by a maintained blocklist; edge cases may require manual review.
- Instagram recipe import uses the public oEmbed API with caption text parsing at launch. A Meta Developer Graph API application should be submitted as a parallel workstream to enable richer extraction in a future iteration.
- Instagram import only supports posts where the recipe content is written in the caption; video-only or image-only posts without caption text are unsupported at launch.
- Recipe attribution for imported content is a display requirement; the system does not host or redistribute copyrighted content beyond recipe metadata (title, ingredient list, instruction summaries).
- OCR/text extraction for physical copy imports will have variable accuracy; users will be able to review and correct extracted content before saving.

## Dependencies

- **001-sous-chef-recipe-app** — Required. Imported recipes are stored as Recipe entities defined in 001.
- **002-auth0-user-auth** — Required. All import actions require authenticated users.
- **010-subscriptions** — Referenced. Visibility rules (private/public toggle after substantive edit) differ for free vs. premium users.

## Glossary

| Term             | Definition                                                                                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recipe Source    | Attribution metadata for an imported recipe — includes source URL (deduplication key for public imports), platform (web/Instagram), original author, and import date.                              |
| Deduplication    | The process of detecting that a recipe from a given source URL has already been imported and surfacing the existing public recipe instead of creating a duplicate.                                 |
| Clone            | A user-owned editable copy of an imported public recipe; retains source attribution and remains public until a premium user makes a substantive edit.                                              |
| Substantive Edit | A meaningful change to recipe content (title, ingredients, or instructions) that distinguishes the clone from the original; the threshold for allowing a premium user to set the clone to private. |
| oEmbed           | A standard API format used to retrieve metadata from Instagram posts; the approved integration method for Instagram import at launch.                                                              |
| OCR              | Optical Character Recognition — text extraction from photos of physical recipe copies.                                                                                                             |
| Paywalled Source | A recipe website or service that requires a paid subscription to access content (e.g., NY Times Cooking, Delish); imports from these sources are blocked.                                          |

---

**Total Requirements**: 24
**By Priority**: P1: 21 | P2: 3 | P3: 0
**By Verification Method**: Test: 14 | Inspection: 8 | Analysis: 1 | Demonstration: 1
