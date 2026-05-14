# Tasks: Feature 013 — Cooking School (Video Learning Platform)

**Feature**: `013-cooking-school`
**Generated**: 2026-05-12
**Source artifacts**: `plan.md`, `spec.md`, `product-spec/product-spec.md`, `research.md`, `v-model/`
**Milestone**: [`M7` Minas Tirith](../v1-launch-plan.md#38-m7--milestone-minas-tirith)
**Governance**: [`governance-rules.md`](../governance-rules.md)

---

## Dependency Graph

```text
Governance + setup (T001-T010)
  -> Schema + contracts (T011-T023)
    -> Educator authoring + media ingest (T024-T037)
      -> Enrollment + entitlement + learner progress (T038-T052)
        -> Analytics + AI + compliance workflows (T053-T064)
          -> Integration + E2E + traceability closure (T065-T078)
            -> M7 evidence + release gate docs (T079-T085)
```

---

## Governance-Critical Tasks

- [ ] **T001** Enforce `/api/v1/...` route conventions for all 013 endpoints and add lint/test guardrails for prefix drift. **Files**: `packages/api/cooking-school-api/src/**`, API contract tests. **Depends on**: none. [GR-002]
- [ ] **T002** Ensure all cross-feature FR references in 013 artifacts are fully qualified (`{feature}-FR-{NNN}`) and update shared FR index if references are added. **Files**: `specs/013-cooking-school/*.md`, `specs/cross-feature-FR-index.md`. **Depends on**: none. [GR-003]
- [ ] **T003** Import canonical shared entities from approved shared libraries; remove duplicate local source-of-truth domain types. **Files**: `packages/shared/cooking-school-contracts/*`, `packages/api/cooking-school-api/src/**`. **Depends on**: none. [GR-007]
- [ ] **T004** Enforce Node/runtime/package naming standards for newly introduced workspaces. **Files**: `packages/api/cooking-school-*/package.json`, build config. **Depends on**: none. [GR-008, GR-009]
- [ ] **T005** Integrate shared subscription gating primitives from 010 for purchase/access checks; prohibit local fork of gating logic. **Files**: `packages/api/cooking-school-api/src/auth/**`, `src/enrollment/**`. **Depends on**: T003. [GR-012]
- [ ] **T006** Implement and validate `published-lesson` audience semantics exactly as defined by 013 and referenced by 001/012. **Files**: `packages/api/cooking-school-api/src/access/**`. **Depends on**: T001, T005. [GR-014]

---

## Phase 1 — Setup and Workspace Scaffolding

- [ ] **T007** Register/verify workspace discovery for `packages/api/*` and `packages/shared/*` paths used by 013 packages. **Files**: root `package.json`, turbo config. **Depends on**: none.
- [ ] **T008 [P]** Scaffold `packages/api/cooking-school-api` (NestJS 11 baseline, lint, test, build, typecheck scripts). **Files**: `packages/api/cooking-school-api/*`. **Depends on**: T007.
- [ ] **T009 [P]** Scaffold `packages/api/cooking-school-video-worker` for transcode callback/status processing. **Files**: `packages/api/cooking-school-video-worker/*`. **Depends on**: T007.
- [ ] **T010 [P]** Scaffold `packages/shared/cooking-school-contracts` for DTO/events/types shared across API/web/mobile. **Files**: `packages/shared/cooking-school-contracts/*`. **Depends on**: T007.

---

## Phase 2 — Schema, Migrations, and Contracts

- [ ] **T011** Add migration for `courses` table (creator linkage, title, slug, pricing, publish state). **Files**: migration + schema definitions. **Depends on**: T008.
- [ ] **T012** Add migration for `course_lessons` (course relation, order index, transcript, preview flag). **Files**: migration + schema definitions. **Depends on**: T011.
- [ ] **T013** Add migration for `lesson_video_assets` (source object, rendition manifests, transcode status). **Files**: migration + schema definitions. **Depends on**: T012.
- [ ] **T014** Add migration for `course_enrollments` with `(course_id, learner_user_id)` uniqueness + purchase reference. **Files**: migration + schema definitions. **Depends on**: T011.
- [ ] **T015** Add migration for `lesson_progress` (`watch_percent`, `completed_at`, `last_watched_at`). **Files**: migration + schema definitions. **Depends on**: T012, T014.
- [ ] **T016** Add migration for `educator_revenue_ledger` and payout projection fields needed by analytics. **Files**: migration + schema definitions. **Depends on**: T014.
- [ ] **T017** Add migration for `course_audit_events` (publish/unpublish/access/compliance trail). **Files**: migration + schema definitions. **Depends on**: T011.
- [ ] **T018** Implement DTO contracts for course, lesson, playback, enrollment, progress, and analytics payloads. **Files**: `packages/shared/cooking-school-contracts/src/**`. **Depends on**: T010, T011-T017.
- [ ] **T019** Define event contracts for transcode completed/failed, enrollment created, progress completed, and publish lifecycle events. **Files**: `packages/shared/cooking-school-contracts/src/events/**`. **Depends on**: T018.
- [ ] **T020** Add env schema + defaults for media pipeline, CDN signing, and integration endpoints (005/010/012). **Files**: config modules + `.env.example*`. **Depends on**: T008, T009.
- [ ] **T021 [P]** Add unit tests for schema constraints and serialization contracts. **Files**: schema/contract test suites. **Depends on**: T011-T019.
- [ ] **T022 [P]** Add migration rollback tests for all new tables and indexes. **Files**: migration test harness. **Depends on**: T011-T017.
- [ ] **T023** Update architecture/ERD documentation snippets in 013 plan-linked technical references. **Files**: `specs/013-cooking-school/plan.md` (if needed), package docs. **Depends on**: T011-T019.

---

## Phase 3 — Educator Authoring and Media Pipeline

- [ ] **T024** Implement educator course create/update endpoints with creator ownership checks via 012 identity linkage. **Depends on**: T001, T018.
- [ ] **T025** Implement lesson create/update/reorder endpoints with optimistic concurrency handling. **Depends on**: T024.
- [ ] **T026** Implement publish/unpublish workflow with readiness checks (video status, required metadata). **Depends on**: T025, T017.
- [ ] **T027** Implement upload-intent endpoint and signed object-upload initiation for lesson media ingest. **Depends on**: T013, T020.
- [ ] **T028** Implement worker-side transcode callback/status projection and retry/DLQ behavior for failures. **Depends on**: T009, T027.
- [ ] **T029** Implement playback manifest selection and signed URL issuance for entitled users. **Depends on**: T013, T028, T006.
- [ ] **T030 [P]** Implement educator-side transcode status read model for dashboard/workbench state. **Depends on**: T028.
- [ ] **T031 [P]** Add audit event emission for authoring + publish lifecycle transitions. **Depends on**: T026, T017.
- [ ] **T032** Implement recipe-link attachment and validation against 001 recipe references. **Depends on**: T025.
- [ ] **T033** Add validation rules for lesson metadata completeness before publish. **Depends on**: T025.
- [ ] **T034 [P]** Add integration tests for authoring happy-path + failure modes (invalid ownership, invalid state transitions). **Depends on**: T024-T033.
- [ ] **T035 [P]** Add media-pipeline integration tests for callback idempotency and retry behavior. **Depends on**: T027-T030.
- [ ] **T036** Add API contract tests for educator routes and route-prefix governance checks. **Depends on**: T024-T033.
- [ ] **T037** Add performance smoke checks for large lesson/course retrieval payloads. **Depends on**: T034-T036.

---

## Phase 4 — Enrollment, Entitlement, and Learner Progress

- [ ] **T038** Implement catalog list/query endpoints with creator `@handle` projection from 012. **Depends on**: T018, T024.
- [ ] **T039** Implement lesson preview gating (unsigned/limited access for designated preview lesson only). **Depends on**: T006, T029, T038.
- [ ] **T040** Integrate 010 purchase completion callback/webhook path and idempotent enrollment creation. **Depends on**: T005, T014.
- [ ] **T041** Implement enrollment lookup and entitlement resolution middleware for non-preview lesson playback. **Depends on**: T040.
- [ ] **T042** Implement learner playback endpoint with preview-vs-enrollment policy branching. **Depends on**: T039, T041.
- [ ] **T043** Implement progress write endpoint with watch-percent monotonic updates. **Depends on**: T015, T042.
- [ ] **T044** Implement auto-completion threshold logic (`>=80%`) and completion timestamp behavior. **Depends on**: T043.
- [ ] **T045** Implement learner progress dashboard projection across enrolled courses. **Depends on**: T043, T044.
- [ ] **T046 [P]** Add integration tests for purchase->enrollment->playback authorization chain. **Depends on**: T040-T042.
- [ ] **T047 [P]** Add integration tests for progress event ordering and completion threshold correctness. **Depends on**: T043-T045.
- [ ] **T048** Add negative-path tests for unauthorized access to non-preview lessons. **Depends on**: T041-T042.
- [ ] **T049** Add replay/idempotency tests for duplicate purchase callbacks. **Depends on**: T040.
- [ ] **T050** Add API contract tests for learner catalog/enrollment/progress routes. **Depends on**: T038-T045.
- [ ] **T051 [P]** Add accessibility and UX acceptance checks for transcript + recipe drawer interactions in learner player UI (if in-scope for current code packages). **Depends on**: T042, T045.
- [ ] **T052** Add observability metrics and alerting baselines for entitlement denials, progress writes, and callback failures. **Depends on**: T040-T045.

---

## Phase 5 — Analytics, AI Assist, and Compliance

- [ ] **T053** Implement educator analytics aggregates for enrollments, completion rates, and revenue snapshots. **Depends on**: T016, T045.
- [ ] **T054** Implement payout-status projection endpoints for educator dashboard. **Depends on**: T053.
- [ ] **T055** Implement AI script-draft endpoint integrating 005 with lesson + recipe context payloads. **Depends on**: T032, T018.
- [ ] **T056** Add AI fallback path for timeout/error/quota conditions with explicit user-facing result states. **Depends on**: T055.
- [ ] **T057** Implement compliance workflow stubs: takedown case, age/safety gating flags, dispute/refund status surfacing. **Depends on**: T017, T040.
- [ ] **T058** Implement audit logging for compliance/dispute decisions tied to enrollment and payout updates. **Depends on**: T057.
- [ ] **T059 [P]** Add analytics correctness tests against seeded enrollment/progress/revenue fixtures. **Depends on**: T053-T054.
- [ ] **T060 [P]** Add AI integration tests for normal and degraded paths. **Depends on**: T055-T056.
- [ ] **T061 [P]** Add compliance workflow tests (takedown + dispute + safety policy enforcement). **Depends on**: T057-T058.
- [ ] **T062** Add security tests for signed playback URL TTL and replay protections. **Depends on**: T029, T042.
- [ ] **T063** Add data retention/purge validation for logs and temporary media metadata per policy. **Depends on**: T057-T058.
- [ ] **T064** Add runbook docs for operational incidents (transcode backlog, callback failure, entitlement drift). **Depends on**: T052, T058.

---

## Phase 6 — Traceability Closure and M7 Exit Evidence

- [ ] **T065** Map all REQ rows to concrete ATP test IDs in `v-model/traceability-matrix.md` (remove `❌ MISSING`). **Depends on**: T034, T046, T059.
- [ ] **T066** Map all SYS rows to executed STP coverage IDs with scenario status evidence. **Depends on**: T034-T061.
- [ ] **T067** Map all ARCH rows to executed ITP coverage IDs with scenario status evidence. **Depends on**: T035, T046, T060.
- [ ] **T068** Map all MOD rows to executed UTP coverage IDs with scenario status evidence. **Depends on**: T021, T022, T034, T047.
- [ ] **T069** Map hazard mitigations to concrete executed verification evidence (Matrix H closure). **Depends on**: T061-T063.
- [ ] **T070** Ingest test execution outputs into V-Model artifacts and regenerate release-audit report with evidence-backed status. **Depends on**: T065-T069.
- [ ] **T071** Create/update `verify-report.md` with 013-specific CRITICAL/WARNING burn-down to `0/0`. **Depends on**: T070.
- [ ] **T072** Run full package lint/test/typecheck/build for all touched workspaces and capture milestone evidence links. **Depends on**: T070.
- [ ] **T073** Produce M7 demo script + evidence set for publish/enroll/gated playback/progress/analytics flows. **Depends on**: T053, T070.
- [ ] **T074** Validate cross-feature contract compatibility snapshots for 002/005/010/012 integrations. **Depends on**: T055, T070.
- [ ] **T075** Conduct governance checklist signoff against GR-002/007/012/014 and attach evidence references. **Depends on**: T072, T074.
- [ ] **T076** Update `review.md` with M7 readiness state, resolved/open decisions, and exit evidence references. **Depends on**: T071, T075.
- [ ] **T077 [P]** Dry-run sync-verify prerequisites and preflight checks for downstream Director integration. **Depends on**: T076.
- [ ] **T078** Final artifact consistency pass (`plan.md`, `tasks.md`, `review.md`, `verify-report.md`, `v-model/*`). **Depends on**: T077.

---

## Phase 7 — Post-Completion Administrative Closure

- [ ] **T079** Ensure launch-plan references are current and correctly anchored for M7 sections. **Depends on**: T078.
- [ ] **T080** Ensure governance links and rule IDs remain valid after final edits. **Depends on**: T078.
- [ ] **T081** Confirm no edits were made outside `specs/013-cooking-school/` except explicitly required cross-feature index updates. **Depends on**: T078.
- [ ] **T082** Prepare handoff note for Director with open risks/decisions and evidence pointers. **Depends on**: T078.
- [ ] **T083** Record follow-up backlog items (if any) for post-M7 optimization, clearly marked non-blocking. **Depends on**: T078.
- [ ] **T084** Validate that all Must Have stories from `spec.md` are represented by implemented + tested task chains. **Depends on**: T078.
- [ ] **T085** Milestone closure checkpoint: verify 013 ready for sync-verify ingestion. **Depends on**: T079-T084.
