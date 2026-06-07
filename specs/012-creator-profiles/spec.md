# Feature Specification: Public Creator Profiles

**Feature Branch**: `012-creator-profiles`
**Created**: 2026-05-09
**Status**: Bootstrapped (pending revalidation)
**Mode**: retroactive-bootstrap

## Overview

Creator Profiles gives home cooks, food bloggers, and professional chefs a public identity on KitchenSink. Each creator gets an `@handle` URL, a curated profile page, and tools to grow an audience. Followers can discover recipes through the creator's public collections. Embed widgets let creators share their profile on external sites.

This feature owns the `CreatorProfile` entity and the `public-profile` audience behavior. `public-profile` is a canonical audience scope under the unified audience model defined in `specs/cross-feature-consistency-report.md` §10 and enforced by `specs/governance-rules.md` GR-014. Monetization extensions (tip jars, paid follows, premium recipe gates) are implemented here but delegate billing mechanics to 010-subscriptions.

## Dependencies

| Spec                                                            | Relationship                                                                                                          |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [002-user-auth](../002-user-auth/spec.md)           | **Required** — `@handle` is tied to an authenticated identity; profile creation requires a verified account           |
| [001-commise-recipe-app](../001-commise-recipe-app/spec.md) | **Required** — recipes are the primary content surface on a creator profile                                           |
| [010-subscriptions](../010-subscriptions/spec.md)               | **Integration** — tip jars, premium recipe gates, and paid follows extend 010's billing model                         |
| [011-recipe-digitization](../011-recipe-digitization/spec.md)   | **Peer** — `circle` is owned by 011; `public-profile` is owned here; the two audience scopes are siblings, not nested |

## Personas

- **Primary — P11 Robin** (aspiring food creator): wants a shareable profile to build an audience and eventually earn from their recipes.
- **Secondary — P5 Morgan** (discovery-driven home cook): browses creator profiles to find trusted recipe sources and follows creators whose style matches their taste.
- **Tertiary — P9 Drew** (professional chef / brand): needs a polished public presence with embed widgets for their restaurant or catering website.

## Audience Scope Defined Here

`public-profile`: content visible to any unauthenticated visitor on a creator's `/@handle` page. It is distinct from `circle` (private invite groups, owned by 011) and `published-lesson` (lesson/course access rules applied by 013).

## Source-of-Truth Note

This file is the canonical feature boundary and audience-scope document. The detailed FR enumeration currently used by `plan.md`, `tasks.md`, and `v-model/` is carried in `product-spec/product-spec.md` pending revalidation or a formal crosswalk into this spec. Until that crosswalk is completed, verification must keep the `spec.md` ↔ `product-spec/` drift warning open rather than treating the FR namespace as fully resolved.

## Functional Requirements

### FR-001 — @handle Profile Pages

Every user may claim a unique `@handle`. The profile page at `/@handle` shows bio, avatar, follower count, and pinned public collections. Unauthenticated visitors can view all public content.

### FR-002 — Follow / Unfollow

Authenticated users can follow or unfollow any creator. Follower and following counts are public. A creator's feed surfaces new recipes from followed creators (integration point with 001's recipe feed).

### FR-003 — Public Collections

Creators can group recipes into named, ordered collections (e.g., "Summer Grilling", "30-Minute Weeknights"). Collections are visible on the profile page. Each collection has its own shareable URL.

### FR-004 — Embed Widgets

A creator can generate an embeddable `<iframe>` snippet for their profile card or a specific collection. The widget renders a lightweight, CDN-served view with no auth dependency.

### FR-005 — Basic Creator Analytics

Creators see a private dashboard: profile views (7d / 30d), follower growth, top recipes by saves, and collection click-through rates. Data is aggregated; no individual visitor tracking.

### FR-006 — Monetization Surface (extends 010)

- **Tip jar**: visitors can send a one-time tip via 010's payment flow.
- **Premium recipes**: creators can mark individual recipes as premium-only; 010 handles the paywall and revenue split.
- **Paid follows**: optional monthly subscription to a creator's premium feed; 010 owns billing, 012 owns the follow-tier model.

## API Paths

All endpoints under `/api/v1/`. Node 24.x. Package names follow `@kitchensink/{group}-{name}`.

| Method | Path                                       | Description                            |
| ------ | ------------------------------------------ | -------------------------------------- |
| GET    | `/api/v1/creators/:handle`                 | Public profile data                    |
| GET    | `/api/v1/creators/:handle/collections`     | List public collections                |
| GET    | `/api/v1/creators/:handle/collections/:id` | Collection detail + recipes            |
| POST   | `/api/v1/creators/:handle/follow`          | Follow a creator (auth required)       |
| DELETE | `/api/v1/creators/:handle/follow`          | Unfollow (auth required)               |
| GET    | `/api/v1/creators/:handle/analytics`       | Creator's own analytics (auth = owner) |
| GET    | `/api/v1/creators/:handle/widget`          | Embed widget HTML fragment             |
| POST   | `/api/v1/creators/:handle/tip`             | Initiate tip (delegates to 010)        |

## Entity Ownership

**`CreatorProfile`** is defined and owned by this feature. Fields: `id`, `userId` (FK → auth), `handle` (unique), `displayName`, `bio`, `avatarKey` (S3), `followerCount`, `followingCount`, `isVerified`, `monetizationEnabled`, `createdAt`, `updatedAt`.

Referenced by:

- 010-subscriptions: `creatorId` on `PaidFollow` and `TipTransaction` tables.
- 013-cooking-school: `creatorId` on `Course` and `Lesson` tables (educator profile surface).

## Out of Scope

- Video hosting or lesson content (owned by 013).
- Circle / private group sharing (owned by 011).
- AI-generated bio or recipe suggestions (owned by 005).
- Verified badge issuance process (internal ops, not a user-facing feature).
