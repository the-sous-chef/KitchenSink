# Wireframes: Sous Chef Recipe Management Core

**Branch**: `001-sous-chef-recipe-app`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](../product-spec.md), [spec.md](../../spec.md)

---

## Index

| File                                               | Description                                                                                                   | Key FRs                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [recipe-list.md](./recipe-list.md)                 | Main recipe list with search bar, filter chips, and recipe cards                                              | FR-006, FR-004                            |
| [recipe-detail.md](./recipe-detail.md)             | Full recipe view with ingredients, steps, nutrition, photos, and version indicator                            | FR-001, FR-007, FR-007a, FR-007b          |
| [recipe-edit.md](./recipe-edit.md)                 | Multi-step recipe editor with ingredient autocomplete, step reordering, and photo upload with per-file status | FR-001, FR-001a, FR-002, FR-007b, FR-007c |
| [recipe-search.md](./recipe-search.md)             | Search results page with filter sidebar and sort controls                                                     | FR-006, FR-004                            |
| [collection-view.md](./collection-view.md)         | Collection detail page with recipe membership list, visibility badge, and pull-updates action                 | FR-008, FR-009, FR-010, FR-011            |
| [version-history.md](./version-history.md)         | Version history timeline with side-by-side diff and restore action                                            | FR-007b, FR-007c                          |
| [conflict-resolution.md](./conflict-resolution.md) | HTTP 409 conflict resolution UI with three resolution options                                                 | FR-007c                                   |

---

## FR Reference Key

- **FR-001**: Recipe creation (title, description, ingredients, instructions, times, servings, tags, photos)
- **FR-001a**: Atomic save independent of photo uploads; per-file validation and retry
- **FR-002**: Owner-only edit/delete; soft delete tombstone
- **FR-003**: Public by default; premium users can set private
- **FR-004**: Any authenticated user can view public recipes
- **FR-005**: Clone public recipe; attribution retained; substantive-edit gate for privacy
- **FR-006**: Full-text search and filtering
- **FR-007**: Real food/nutrition database backing ingredients
- **FR-007a**: Freeform ingredients with optional manual nutrition entry
- **FR-007b**: Version history (last 10 in DB, all in S3)
- **FR-007b-i**: Async S3 archive with pending-archive retry and DLQ
- **FR-007c**: Optimistic concurrency conflict detection and side-by-side resolution UI
- **FR-008**: Create/rename/delete collections
- **FR-009**: Add/remove recipes from collections
- **FR-010**: Collection visibility (public/private)
- **FR-011**: Clone collection as snapshot; opt-in pull-from-source
- **FR-044**: Web and mobile with feature parity
- **FR-045**: All features require authentication
- **C-004**: Visibility model by subscription tier
- **C-005**: Concurrent edit conflict resolution flow
- **C-006**: Freeform ingredient handling
- **C-007**: Soft delete tombstone vs GDPR hard purge
