# User Journeys: Cooking School

**Branch**: `013-cooking-school`
**Date**: 2026-05-13
**Status**: Bootstrapped from [product-spec.md](./product-spec.md)

---

## Journey A — Jamie previews, purchases, and learns from a course

**Persona**: P12 Jamie, learner
**Goal**: Buy a trusted cooking course and make measurable progress through lessons.

1. Jamie discovers a course from a creator profile, recommendation, or catalog surface.
2. Jamie opens the course detail page and watches the free preview lesson.
3. Jamie signs in if purchase is required.
4. Jamie completes checkout through the subscription/billing owner feature.
5. Enrollment is created immediately after successful purchase.
6. Jamie watches lessons; progress saves automatically at the configured threshold.
7. Jamie resumes from the progress dashboard and completes the course.

**Success evidence**: preview works before purchase, purchase gates paid lessons server-side, progress is durable across sessions, and completion state is visible.

---

## Journey B — Reese uploads and publishes an async video course

**Persona**: P13 Reese, educator
**Goal**: Publish a structured paid course without managing external video infrastructure.

1. Reese opens educator tools from her creator profile.
2. Reese creates a course shell with title, description, price, and lesson outline.
3. Reese uploads lesson videos.
4. The system shows processing/transcode status per lesson.
5. Reese links optional recipes to lessons.
6. Reese previews the course as a learner.
7. Reese publishes the course once required metadata and preview configuration are valid.

**Success evidence**: publishing is blocked until required lesson metadata and media states are valid; preview accurately reflects learner access rules.

---

## Journey C — Reese uses AI-assisted script drafting

**Persona**: P13 Reese
**Goal**: Draft lesson scripts from existing recipes while retaining editorial control.

1. Reese selects a lesson and linked recipe.
2. Reese requests an AI script draft.
3. The system sends recipe context to the AI integration owner service.
4. Reese reviews the generated draft.
5. Reese edits, accepts, or discards the draft.
6. Accepted script content is stored as educator-authored course material with AI disclosure where required.

**Success evidence**: AI outage has a graceful fallback; generated content is never published without educator acceptance; disclosure follows shared AI governance.

---

## Journey D — Reese reviews course analytics

**Persona**: P13 Reese
**Goal**: Understand enrollment, completion, and revenue performance.

1. Reese opens the educator analytics dashboard.
2. Reese reviews course enrollment, lesson completion, preview conversion, and revenue status.
3. Reese identifies lessons with high drop-off.
4. Reese updates course content or pricing based on the signal.

**Success evidence**: analytics are tied to enrolled learners and billing records without exposing private learner data.
