# Feature Specification: Cooking School (Video Learning Platform)

**Feature Branch**: `013-cooking-school`
**Created**: 2026-05-09
**Status**: Bootstrapped
**Input**: Defined via cross-feature consistency report §11 (2026-05-09). Largest scope of the 011/012/013 expansion.

## Overview

013-cooking-school is a two-sided video learning marketplace. Educators (P13 Reese) create and sell structured cooking lessons and courses. Learners (P12 Jamie) discover, purchase, and progress through that content. This is the largest of the three new features by scope, touching video infrastructure, payments, AI drafting, and creator identity.

Live classes are explicitly **Phase 2** and out of scope for v1.

## Personas

| Role               | Persona   | Relationship                                               |
| ------------------ | --------- | ---------------------------------------------------------- |
| Primary (learner)  | P12 Jamie | Discovers and completes cooking courses                    |
| Primary (educator) | P13 Reese | Creates, publishes, and monetizes lessons                  |
| Secondary          | P1 Casey  | Overlap consumer; uses lessons to improve everyday cooking |
| Secondary          | P2 Taylor | Overlap consumer; follows specific educators               |
| Tertiary           | P9 Drew   | Pro-level content creator; high-production courses         |

Both P12 and P13 are co-primary. This feature cannot be designed for one side without the other.

## Audience Scope

`published-lesson` is a canonical audience scope under the unified audience model defined in `specs/cross-feature-consistency-report.md` §10 and enforced by `specs/governance-rules.md` GR-014. Feature 013 defines the lesson/course access rules applied to that scope: a lesson with `visibility: published-lesson` is accessible to any authenticated user who has purchased the parent course, or the lesson individually if that sales mode is later enabled.

## Dependencies

| Spec                                                            | Relationship                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [002-auth0-user-auth](../002-auth0-user-auth/spec.md)           | **Required** — all learner and educator sessions are authenticated                          |
| [001-sous-chef-recipe-app](../001-sous-chef-recipe-app/spec.md) | **Referenced** — recipe entity used as source material for lesson scripts                   |
| [005-ai-integration](../005-ai-integration/spec.md)             | **Referenced** — AI-assisted lesson script drafting from recipes (P13 Reese "Should" story) |
| [010-subscriptions](../010-subscriptions/spec.md)               | **Required** — course purchases, educator subscription tiers, revenue share                 |
| [012-creator-profiles](../012-creator-profiles/spec.md)         | **Required** — `CreatorProfile` provides educator identity and `@handle` pages              |

## Source-of-Truth Note

This file is the canonical feature boundary and audience-scope document. The detailed FR enumeration currently used by `plan.md`, `tasks.md`, and `v-model/` is carried in `product-spec/product-spec.md` pending revalidation or a formal crosswalk into this spec. Until that crosswalk is completed, verification must keep the `spec.md` ↔ `product-spec/` drift warning open rather than treating the FR namespace as fully resolved.

## In-Scope (v1)

- Video upload, transcode pipeline, and CDN delivery
- Lesson entity: title, description, video asset, transcript, attached recipe references
- Course entity: ordered collection of lessons, pricing, thumbnail
- Learner enrollment and progress tracking (per-lesson completion state)
- Educator dashboard: upload, publish, unpublish, basic analytics (views, completions, revenue)
- Course purchase flow via 010 billing; revenue share calculation
- AI-assisted lesson script drafting from a linked recipe (005 integration)
- `published-lesson` audience-scope access rules
- Educator profile page powered by 012 `CreatorProfile`

## Out of Scope (v1)

- Live classes / live streaming (Phase 2)
- Community Q&A or comments on lessons
- Certificates or badges
- Mobile video playback offline download

## API Surface

All paths under `/api/v1/`. Package names follow `@kitchensink/{group}-{name}` convention. Runtime: Node 24.x / NestJS 11.

| Method | Path                               | Description                              |
| ------ | ---------------------------------- | ---------------------------------------- |
| POST   | `/api/v1/courses`                  | Create course (educator)                 |
| GET    | `/api/v1/courses/:id`              | Get course detail                        |
| POST   | `/api/v1/courses/:id/lessons`      | Add lesson to course                     |
| GET    | `/api/v1/lessons/:id`              | Get lesson (gated by enrollment)         |
| POST   | `/api/v1/courses/:id/enroll`       | Purchase/enroll in course                |
| GET    | `/api/v1/learners/me/progress`     | Get learner progress across all courses  |
| PATCH  | `/api/v1/lessons/:id/progress`     | Update lesson completion state           |
| GET    | `/api/v1/educators/me/dashboard`   | Educator analytics summary               |
| POST   | `/api/v1/lessons/:id/draft-script` | AI script draft from linked recipe (005) |

## Cross-Feature Touches

**010 (Subscriptions)**: Course purchases flow through 010's billing primitives. Educator subscription tiers (free educator vs. pro educator) gate upload limits and revenue share rates. Revenue share is calculated and disbursed via 010's payout model.

**005 (AI Integration)**: P13 Reese can trigger AI script drafting from any recipe she owns. The 005 service receives the recipe entity and returns a structured lesson outline. This is a "Should" priority story for v1.

**012 (Creator Profiles)**: Educator identity on the platform is the `CreatorProfile` from 012. The cooking school does not redefine it. Educator course listings appear on the `@handle` profile page.

**011 (Circles)**: No direct dependency. `Circle` is owned by 011 and not used by 013 in v1.

## User Stories

### Must Have

**US-001** (P12 Jamie): As a learner, I can browse and purchase a cooking course so that I can learn a new technique at my own pace.

**US-002** (P13 Reese): As an educator, I can upload a video lesson and publish it within a course so that learners can access my content.

**US-003** (P12 Jamie): As a learner, I can track which lessons I've completed so that I know where I left off.

**US-004** (P13 Reese): As an educator, I can see how many learners enrolled and completed each lesson so that I can improve my content.

**US-005** (P13 Reese): As an educator, I can link a recipe to a lesson and request an AI-drafted script outline so that I spend less time writing from scratch.

### Should Have

**US-006** (P1 Casey): As a casual learner, I can preview the first lesson of a course before purchasing so that I can judge fit before committing.

**US-007** (P2 Taylor): As a learner, I can follow an educator and see their new courses in my feed so that I don't miss new content.

**US-008** (P9 Drew): As a pro educator, I can set per-course pricing and see my revenue share breakdown so that I can run a sustainable teaching business.

### Won't Have (v1)

**US-009**: Live class scheduling and streaming (Phase 2).
