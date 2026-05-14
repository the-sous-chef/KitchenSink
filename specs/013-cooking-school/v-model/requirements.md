# V-Model Requirements Specification: Cooking School (Video Learning Platform)

**Feature Branch**: `013-cooking-school`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/013-cooking-school/spec.md`, `specs/013-cooking-school/research.md`, `specs/013-cooking-school/product-spec/product-spec.md`

## Overview

Feature 013 defines a two-sided cooking school marketplace where educators author and monetize video lessons while learners discover, purchase, and complete courses. Requirements below formalize v1 scope only (async video learning), preserving explicit out-of-scope items (live classes, certificates).

## Requirements

### Functional Requirements

| ID      | Description                                                                                                                        | Priority | Rationale                                                      | Verification Method |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- | ------------------- |
| REQ-001 | The system SHALL allow educators to create courses with title, description, thumbnail, and price.                                  | P1       | Core educator authoring capability.                            | Test                |
| REQ-002 | The system SHALL allow educators to add lessons to a course with title, description, transcript, and sort order.                   | P1       | Defines instructional structure for learners.                  | Test                |
| REQ-003 | The system SHALL accept video uploads and transcode each lesson to HLS renditions (720p and 1080p).                                | P1       | Enables adaptive video playback across devices.                | Test                |
| REQ-004 | The system SHALL deliver lesson playback via CDN with signed playback URLs for enrolled learners.                                  | P1       | Protects paid content and enforces entitlements.               | Test                |
| REQ-005 | The system SHALL expose unsigned preview playback only for designated preview lessons.                                             | P1       | Supports trial conversion while limiting free access.          | Test                |
| REQ-006 | The system SHALL provide a learner catalog listing with educator handle, lesson count, and price.                                  | P1       | Supports discovery and purchase intent.                        | Demonstration       |
| REQ-007 | The system SHALL process one-time course purchases and grant enrollment immediately after successful payment.                      | P1       | Primary monetization and access path.                          | Test                |
| REQ-008 | The system SHALL enforce published-lesson access so only enrolled authenticated learners can access non-preview lessons.           | P1       | Prevents unauthorized lesson access.                           | Test                |
| REQ-009 | The system SHALL track lesson progress using watch_percent, completed_at, and last_watched_at fields.                              | P1       | Supports resume learning and completion analytics.             | Test                |
| REQ-010 | The system SHALL mark lessons complete automatically when watch_percent reaches or exceeds 80%.                                    | P1       | Standardizes completion semantics across clients.              | Test                |
| REQ-011 | The system SHALL provide a learner progress view across all enrolled courses.                                                      | P1       | Allows learners to resume learning efficiently.                | Demonstration       |
| REQ-012 | The system SHALL provide educator analytics with enrollments, lesson completion rates, and revenue summaries.                      | P1       | Enables content and business optimization.                     | Demonstration       |
| REQ-013 | The system SHALL support optional recipe linkage on lessons and render linked recipe data in a read-only lesson drawer.            | P2       | Differentiates platform through recipe graph integration.      | Test                |
| REQ-014 | The system SHALL request AI script drafts from the AI service for linked recipes using educator-owned recipe scope.                | P2       | Reduces educator script authoring effort.                      | Test                |
| REQ-015 | The system SHALL allow educators to publish or unpublish lessons independently of course publish state.                            | P1       | Supports staged content rollout and fixes.                     | Test                |
| REQ-016 | The system SHALL persist educator-defined lesson reorder operations.                                                               | P2       | Maintains intended pedagogical sequence.                       | Test                |
| REQ-017 | The system SHALL use CreatorProfile from feature 012 as the educator identity source without duplicating profile ownership in 013. | P1       | Avoids identity fragmentation across features.                 | Inspection          |
| REQ-018 | The system SHALL read educator subscription tier from feature 010 and apply tier-based upload limits.                              | P1       | Implements monetization packaging and operational constraints. | Test                |
| REQ-019 | The system SHALL compute revenue share as 80/20 default and 85/15 for pro tier, and persist ledger details per enrollment.         | P1       | Ensures transparent and consistent payouts.                    | Test                |
| REQ-020 | The system SHALL require JWT authentication and role checks for all learner and educator protected actions.                        | P1       | Baseline access security for two-sided marketplace.            | Test                |
| REQ-021 | The system SHALL expose API endpoints under /api/v1 with JSON contracts aligned to platform conventions.                           | P1       | Maintains consistency with existing platform APIs.             | Inspection          |
| REQ-022 | The system SHALL support compliance review and takedown workflows for copyrighted or policy-violating lesson content.              | P1       | Enables legal and policy operations.                           | Test                |
| REQ-023 | The system SHALL support support-operator dispute workflows for refunds/access errors with auditable payout adjustments.           | P1       | Prevents unresolved payment/access escalations.                | Test                |
| REQ-024 | The system SHALL retain and back up enrollment/progress records and support controlled recovery for data-loss incidents.           | P1       | Protects learner progress and financial records.               | Analysis            |
| REQ-025 | The system SHALL enforce age-restricted content access controls based on lesson/course maturity flags.                             | P1       | Prevents inappropriate access by underage learners.            | Test                |
| REQ-026 | The system SHALL require knife/fire safety disclaimer acknowledgement before playback for safety-tagged lessons.                   | P2       | Reduces unsafe usage in high-risk lesson contexts.             | Demonstration       |
| REQ-027 | The system SHALL display refund policy terms before purchase and snapshot accepted policy text with enrollment records.            | P1       | Reduces refund ambiguity and dispute friction.                 | Test                |
| REQ-028 | The system SHALL harden playback against token replay/hotlinking through short-lived playback tokens and origin checks.            | P1       | Mitigates stream DRM bypass and piracy abuse.                  | Test                |

## Assumptions

- Feature 010 billing and tier lookups remain available during purchase and payout paths.
- Feature 012 CreatorProfile read APIs remain stable for educator identity projections.
- Feature 005 AI draft endpoint is available for synchronous request/response in v1.

## Dependencies

- `002-auth0-user-auth` (JWT issuance and claim model)
- `010-subscriptions` (billing primitives, tier and payout primitives)
- `012-creator-profiles` (educator identity and public handle pages)
- `005-ai-integration` (lesson script drafting)
- `001-sous-chef-recipe-app` (recipe entity linkage)

## Glossary

| Term                 | Definition                                                                |
| -------------------- | ------------------------------------------------------------------------- |
| published-lesson     | Non-preview lesson requiring enrollment entitlement.                      |
| preview lesson       | Public lesson preview (typically first lesson) available before purchase. |
| enrollment snapshot  | Immutable purchase-policy and revenue metadata captured at purchase time. |
| safety-tagged lesson | Lesson tagged as requiring knife/fire safety disclaimer acknowledgment.   |

---

**Total Requirements**: 28
**By Priority**: P1: 22 | P2: 6 | P3: 0
**By Verification Method**: Test: 21 | Inspection: 2 | Analysis: 1 | Demonstration: 4
