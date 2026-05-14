# Research: Cooking School (Video Learning Platform)

**Feature**: `013-cooking-school`
**Date**: 2026-05-09
**Mode**: Retroactive bootstrap — synthesized from consistency report §11 and cross-feature corpus.

## Problem Statement

Home cooks and food enthusiasts want structured, video-based instruction from trusted educators. Existing platforms (YouTube, Skillshare, MasterClass) are generic or expensive. KitchenSink already owns the recipe graph, AI integration, and creator identity layer. A cooking school built on top of that graph can offer something no generic platform can: lessons that are directly linked to the recipes learners already use, with AI-assisted content creation for educators.

The problem is two-sided. Educators need a low-friction publishing workflow and a fair revenue model. Learners need discoverable, high-quality content with progress tracking that fits their schedule.

## Competitive Landscape

| Platform                      | Strengths                              | Weaknesses                                                                 |
| ----------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| MasterClass                   | High production value, celebrity chefs | Expensive, no recipe integration, passive consumption                      |
| Skillshare                    | Broad catalog, subscription model      | Generic; cooking is a small slice; no recipe graph                         |
| YouTube                       | Free, massive catalog                  | No structured courses, no progress tracking, no monetization for educators |
| America's Test Kitchen Online | Deep culinary authority                | Closed ecosystem, no creator marketplace                                   |
| Teachable / Thinkific         | Flexible creator tools                 | No cooking-specific features; educators must bring their own audience      |

**KitchenSink's differentiation**: recipe-linked lessons, AI script drafting from existing recipes, and a creator identity layer (012 `CreatorProfile`) that learners already follow. The platform doesn't need to compete on catalog size at launch; it competes on integration depth.

## UX Patterns

### Learner Side

- **Course card**: thumbnail, educator `@handle`, lesson count, price, average completion rate.
- **Lesson player**: video + transcript side-by-side; linked recipe visible in a drawer; progress auto-saved on 80% watch completion.
- **Progress dashboard**: list of enrolled courses with per-lesson completion indicators. Simple, not gamified in v1.
- **Preview gate**: first lesson of every course is free to preview. Conversion pattern borrowed from Skillshare and Udemy.

### Educator Side

- **Upload flow**: drag-and-drop video → transcode status indicator → add title/description → link recipe (optional) → request AI script draft → publish.
- **Course builder**: ordered lesson list with drag-to-reorder; set course price; publish/unpublish toggle.
- **Dashboard**: enrollment count, lesson completion rates, revenue this month, payout status. Minimal in v1; deeper analytics in a later iteration.

### Two-Sided Marketplace Dynamics

013 is the largest of the 011/012/013 expansion because it must serve two distinct primary personas simultaneously. Design decisions that optimize for P13 Reese (fast publishing, high revenue share) can conflict with decisions that optimize for P12 Jamie (low price, high content quality). The v1 strategy is to prioritize educator supply first: without good content, learner demand doesn't materialize.

## Codebase Analysis

### Relevant Existing Packages

- `@kitchensink/auth-*` (002): JWT validation, user identity. Educator and learner roles will be claims on the existing auth token.
- `@kitchensink/recipe-*` (001): Recipe entity is the source material for lesson scripts. The lesson entity holds a foreign key to `recipes.id`.
- `@kitchensink/ai-*` (005): Existing AI service accepts a recipe and returns structured text. The lesson script drafting endpoint wraps this with a lesson-specific prompt template.
- `@kitchensink/billing-*` (010): Course purchase is a one-time charge (not a subscription). 010's billing primitives handle Stripe checkout; 013 adds a `course_purchase` product type.
- `@kitchensink/creator-*` (012): `CreatorProfile` is the educator's public identity. 013 reads it; does not write to it.

### New Infrastructure Required

- **Video pipeline**: S3 upload → MediaConvert transcode job → CloudFront CDN delivery. This is net-new infrastructure not present in any existing feature.
- **Progress store**: `lesson_progress` table in RDS (learner_id, lesson_id, completed_at, watch_percent). Lightweight; no separate service needed.
- **Revenue share**: a `course_revenue` table tracking gross, platform fee, and educator payout per enrollment. Payout disbursement deferred to 010's payout model.

### Package Naming

New packages will follow `@kitchensink/{group}-{name}`:

- `@kitchensink/school-courses` — course and lesson CRUD, enrollment
- `@kitchensink/school-progress` — learner progress tracking
- `@kitchensink/school-video` — upload, transcode orchestration, CDN URL generation
- `@kitchensink/school-educator` — educator dashboard, analytics, revenue

## Tech Stack

- **Runtime**: Node 24.x, NestJS 11 (consistent with 001 backend)
- **Video storage**: S3 (raw uploads) + AWS MediaConvert (transcode to HLS) + CloudFront (delivery)
- **Database**: RDS PostgreSQL 16 — new tables in existing cluster
- **CDN**: CloudFront (already used for recipe photos in 001)
- **AI**: 005 AI service (existing); lesson script drafting adds a new prompt template
- **Payments**: Stripe via 010 billing primitives; new `course_purchase` product type
- **Frontend**: Next.js (web), Expo (mobile) — video player via `react-native-video` on mobile, HLS.js on web

## Metrics & ROI

### Success Metrics (v1)

| Metric                   | Target (90 days post-launch) |
| ------------------------ | ---------------------------- |
| Educator signups         | 50 active course publishers  |
| Courses published        | 100                          |
| Learner enrollments      | 1,000                        |
| Lesson completion rate   | >40%                         |
| Gross merchandise volume | $10,000                      |

### Revenue Model

- Platform takes 20% of each course sale; educator keeps 80%.
- Pro educator tier (via 010) reduces platform fee to 15% and unlocks higher upload limits.
- No subscription required for learners to purchase individual courses.

## Risks

| Risk                                              | Likelihood | Mitigation                                                               |
| ------------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| Video transcode pipeline complexity delays launch | High       | Use AWS MediaConvert managed service; scope v1 to HLS only               |
| Educator supply too thin at launch                | Medium     | Seed with P9 Drew-type pro creators via direct outreach                  |
| Learner churn before course completion            | Medium     | Free preview lesson lowers commitment barrier                            |
| Revenue share disputes                            | Low        | Transparent `course_revenue` table; payout visible in educator dashboard |
| Live classes scope creep into v1                  | Low        | Explicitly Phase 2; no live infrastructure in v1 codebase                |

## Open Questions

1. Should à la carte lesson purchases (individual lessons outside a course) be v1 or v2?
2. What is the minimum viable educator analytics dashboard — views only, or views + revenue?
3. Does the mobile app support video upload from phone camera in v1, or web-only upload?
4. How does the AI script draft interact with recipes the educator doesn't own (e.g., public recipes)?
