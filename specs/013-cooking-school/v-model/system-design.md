# System Design: Cooking School (Video Learning Platform)

**Feature Branch**: `013-cooking-school`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/013-cooking-school/v-model/requirements.md`

## Overview

System decomposition groups marketplace behavior into twelve testable components spanning authoring, media processing, monetization, learning progress, policy control, and governance. Every REQ maps to at least one SYS component with explicit many-to-many traceability.

## ID Schema

- **System Component**: `SYS-NNN` (sequential, non-renumbering)
- **Parent Requirements**: comma-separated `REQ-NNN` mapping per component

## Decomposition View (IEEE 1016 §5.1)

| SYS ID  | Name                                       | Description                                                                          | Parent Requirements                | Type      |
| ------- | ------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------- | --------- |
| SYS-001 | Identity & API Access Control              | Enforces JWT auth, learner/educator role checks, and /api/v1 contract gating.        | REQ-020, REQ-021                   | Service   |
| SYS-002 | Course Authoring Management                | Creates and updates courses/lessons including publish toggles and lesson ordering.   | REQ-001, REQ-002, REQ-015, REQ-016 | Subsystem |
| SYS-003 | Video Ingest & Transcode Processing        | Handles upload intake and HLS transcode orchestration with rendition status.         | REQ-003                            | Subsystem |
| SYS-004 | Playback Entitlement & Delivery            | Issues preview/enrolled playback URLs and enforces tokenized protected playback.     | REQ-004, REQ-005, REQ-008, REQ-028 | Service   |
| SYS-005 | Catalog & Profile Discovery                | Serves course discovery cards with creator profile data and pricing metadata.        | REQ-006, REQ-017                   | Service   |
| SYS-006 | Enrollment Checkout & Revenue Share        | Processes purchases, creates enrollments, and computes tier-aware revenue splits.    | REQ-007, REQ-018, REQ-019, REQ-027 | Subsystem |
| SYS-007 | Lesson Content & Recipe/AI Integration     | Maintains lesson metadata, linked recipe drawer data, and AI draft orchestration.    | REQ-013, REQ-014                   | Service   |
| SYS-008 | Learner Progress State Management          | Captures watch progress, completion thresholds, and recovery-ready progress history. | REQ-009, REQ-010, REQ-011, REQ-024 | Subsystem |
| SYS-009 | Educator Analytics Reporting               | Produces educator enrollment, completion, revenue, and payout dashboard aggregates.  | REQ-012, REQ-019                   | Service   |
| SYS-010 | Compliance, Safety, and Age Policy Control | Supports takedowns, age-restricted gating, and knife/fire disclaimer requirements.   | REQ-022, REQ-025, REQ-026          | Subsystem |
| SYS-011 | Dispute & Refund Operations                | Manages support-led disputes, refund outcomes, and payout adjustment linkage.        | REQ-023, REQ-027                   | Service   |
| SYS-012 | Data Governance & Recovery                 | Applies data-retention policy, backup/restore workflows, and policy audit evidence.  | REQ-024, REQ-027                   | Subsystem |

## Dependency View (IEEE 1016 §5.2)

| Source  | Target  | Relationship | Failure Impact                                                             |
| ------- | ------- | ------------ | -------------------------------------------------------------------------- |
| SYS-002 | SYS-001 | Calls        | Unauthorized course mutations are rejected.                                |
| SYS-003 | SYS-001 | Calls        | Unauthenticated upload requests are blocked.                               |
| SYS-004 | SYS-006 | Reads        | Enrollment state unavailable blocks paid playback token issuance.          |
| SYS-004 | SYS-010 | Calls        | Policy flags unavailable can over-allow restricted content.                |
| SYS-005 | SYS-009 | Reads        | Analytics fields degrade to stale values in catalog cards.                 |
| SYS-006 | SYS-001 | Calls        | Purchase initiation denied without valid user claims.                      |
| SYS-006 | SYS-011 | Subscribes   | Failed dispute linkage can leave payout adjustments inconsistent.          |
| SYS-007 | SYS-005 | Reads        | Missing creator/recipe context degrades lesson metadata completeness.      |
| SYS-008 | SYS-006 | Reads        | Progress for non-enrolled learners is denied.                              |
| SYS-009 | SYS-008 | Reads        | Completion rate metrics become stale if progress projection lags.          |
| SYS-010 | SYS-012 | Writes       | Compliance case evidence persistence is at risk if governance store fails. |
| SYS-011 | SYS-012 | Writes       | Refund audit trail may be incomplete under governance storage outage.      |

### Dependency Diagram

```text
SYS-001 -> SYS-002, SYS-003, SYS-006
SYS-006 -> SYS-004 -> SYS-010
SYS-006 -> SYS-011 -> SYS-012
SYS-008 -> SYS-009
SYS-010 -> SYS-012
```

## Interface View (IEEE 1016 §5.3)

| Interface                               | Provider | Consumer        | Contract Summary                                               |
| --------------------------------------- | -------- | --------------- | -------------------------------------------------------------- |
| `POST /api/v1/courses`                  | SYS-002  | Educator client | Creates course with metadata and price.                        |
| `POST /api/v1/courses/:id/enroll`       | SYS-006  | Learner client  | Processes payment and creates enrollment snapshot.             |
| `GET /api/v1/lessons/:id`               | SYS-004  | Learner client  | Returns preview or signed playback URL based on entitlement.   |
| `PATCH /api/v1/lessons/:id/progress`    | SYS-008  | Learner client  | Upserts watch progress and completion status.                  |
| `POST /api/v1/lessons/:id/draft-script` | SYS-007  | Educator client | Calls AI integration for lesson draft outline.                 |
| Compliance case queue                   | SYS-010  | SYS-011/SYS-012 | Emits takedown/dispute events with immutable case identifiers. |

## Data Design View (IEEE 1016 §5.4)

| Entity              | Owner SYS       | Purpose                               | Key Fields                                                           |
| ------------------- | --------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `courses`           | SYS-002         | Course metadata and publication state | `id`, `creator_profile_id`, `price_cents`, `published_at`            |
| `lessons`           | SYS-002/SYS-007 | Lesson payload and policy flags       | `id`, `course_id`, `is_preview`, `recipe_id`, `safety_tags`          |
| `enrollments`       | SYS-006         | Purchase state and policy snapshot    | `id`, `learner_id`, `course_id`, `policy_snapshot`, `revenue_split`  |
| `lesson_progress`   | SYS-008         | Learner progression tracking          | `lesson_id`, `watch_percent`, `completed_at`, `last_watched_at`      |
| `compliance_cases`  | SYS-010         | Takedown and policy investigations    | `case_id`, `reason`, `status`, `resolution`                          |
| `refund_disputes`   | SYS-011         | Refund/access dispute lifecycle       | `dispute_id`, `enrollment_id`, `decision`, `payout_adjustment_cents` |
| `governance_events` | SYS-012         | Audit and recovery ledger             | `event_id`, `actor`, `event_type`, `payload_hash`                    |

## Design Decisions and Constraints

- Non-regulated profile: `domain: ` in `v-model-config.yml`; General-Purpose FMEA only.
- Live classes and certificates remain explicitly out of v1 scope.
- Entitlement checks must execute before signed playback URL generation.
- Refund policy text must be immutable once attached to an enrollment snapshot.

---

**Total SYS Components**: 12
**REQ Coverage**: 28/28 (100%)
