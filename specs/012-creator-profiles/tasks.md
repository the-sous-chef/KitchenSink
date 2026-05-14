# Tasks: Feature 012 — Public Creator Profiles

**Feature**: `012-creator-profiles`
**Generated**: 2026-05-12
**Milestone**: `M7` Minas Tirith
**Source artifacts**: `plan.md`, `spec.md`, `product-spec/product-spec.md`, `v-model/requirements.md`

---

## Milestone and Governance Context

- Milestone authority: [`../v1-launch-plan.md`](../v1-launch-plan.md)
- Governance authority: [`../governance-rules.md`](../governance-rules.md)
- GR-002 anchor: [`../governance-rules.md#gr-002-api-url-prefix-standard`](../governance-rules.md#gr-002-api-url-prefix-standard)
- GR-007 anchor: [`../governance-rules.md#gr-007-shared-type-library-ownership`](../governance-rules.md#gr-007-shared-type-library-ownership)
- Spec baseline: [`spec.md`](./spec.md)
- Product baseline: [`product-spec/product-spec.md`](./product-spec/product-spec.md)

---

## Dependency Graph

```text
Setup (T001-T006)
  -> Schema/Migrations (T007-T014)
    -> Domain APIs (T015-T027)
      -> Public/Profile Web + Widget (T028-T034)
      -> Analytics + Moderation/Privacy (T035-T041)
      -> Monetization Delegation + Feed Bridge (T042-T046)
        -> Integration/E2E/Performance tests (T047-T056)
          -> Release readiness evidence (T057-T060)
```

---

## Phase 1 — Setup

- [ ] **T001** Add workspace/package registration for `@kitchensink/creator-profiles-api` and related build targets; **Files**: root `package.json`, turbo/workspace config. **Depends on**: none. [FR-028, NFR-005]
- [ ] **T002 [P]** Scaffold `packages/api/creator-profiles-api` package config (`package.json`, tsconfig, lint/test config) aligned with Node 24 + NestJS 11 conventions used by 001; **Files**: `packages/api/creator-profiles-api/*`. **Depends on**: T001. [US-001, FR-001]
- [ ] **T003 [P]** Add env schema placeholders for creator profile, widget caching, analytics schedule, moderation hooks, and feed bridge config; **Files**: API config + `.env.example*`. **Depends on**: T002. [FR-025, FR-027, NFR-001]
- [ ] **T004** Wire shared type dependencies and imports to `@kitchensink/shared-recipe-core`; forbid local duplicate core entities; **Files**: `package.json`, domain DTO/type modules. **Depends on**: T002. [GR-007, FR-029]
- [ ] **T005** Add API route prefix guardrails and route tests to enforce `/api/v1/*` across 012 endpoints; **Files**: route modules + tests. **Depends on**: T002. [GR-002, FR-028]
- [ ] **T006** Create feature-level README/update docs pointers inside feature folder for implementation references (`plan/tasks/review/spec/product-spec`); **Files**: `specs/012-creator-profiles/*` references if needed. **Depends on**: T001. [M7 readiness]

---

## Phase 2 — Schema & Migrations

- [ ] **T007** Create migration for `creator_profiles` table with handle uniqueness, profile metadata, moderation state, and lifecycle timestamps; **Files**: schema + migration files. **Depends on**: T003. [US-001, FR-001, FR-004]
- [ ] **T008** Create migration for `creator_follows` with composite uniqueness (`follower_id`, `creator_id`) and indexing for follower/following queries; **Files**: schema + migration files. **Depends on**: T007. [US-003, FR-013, FR-015]
- [ ] **T009** Create migration for `creator_collections` with creator ownership, name/description constraints, and ordering position fields; **Files**: schema + migration files. **Depends on**: T007. [US-002, FR-017, FR-018]
- [ ] **T010** Create migration for `creator_collection_recipes` join table with stable ordering and ownership constraints; **Files**: schema + migration files. **Depends on**: T009. [US-002, FR-019]
- [ ] **T011** Create migration for `creator_analytics_snapshots` with aggregate-only fields and query indexes by creator/date; **Files**: schema + migration files. **Depends on**: T007. [US-006, FR-023, FR-024, FR-025]
- [ ] **T012** Add DB-level constraints/checks for handle format and cooldown-related metadata persistence invariants; **Files**: migrations and repository tests. **Depends on**: T007. [FR-001, FR-005]
- [ ] **T013** Add migration tests validating uniqueness/idempotency/order constraints for follows and collections; **Files**: migration/integration tests. **Depends on**: T008, T010, T012. [FR-013, FR-018, FR-019]
- [ ] **T014** Add rollback-safe migration verification script for local/CI environments; **Files**: scripts + CI config hooks. **Depends on**: T007-T013. [NFR-005]

---

## Phase 3 — Core Domain APIs

- [ ] **T015** Implement `POST /api/v1/creators` handle claim endpoint with auth, validation, and conflict handling; **Files**: controller/service/DTO/repo modules. **Depends on**: T012. [US-001, FR-001, FR-003, FR-028]
- [ ] **T016** Implement owner profile update endpoint (`PUT /api/v1/creators/:handle`) with field bounds and avatar metadata handling; **Files**: controller/service/DTO modules. **Depends on**: T015. [FR-002]
- [ ] **T017** Implement handle change cooldown/reservation policy enforcement and persistence checks; **Files**: policy validator + service tests. **Depends on**: T015. [FR-005]
- [ ] **T018** Implement profile deactivate/suspend-aware lifecycle behavior for public visibility transitions; **Files**: service/repository + moderation checks. **Depends on**: T016. [FR-004, FR-020]
- [ ] **T019** Implement public profile read endpoint (`GET /api/v1/creators/:handle`) with strict public payload schema; **Files**: query service/controller/serializer. **Depends on**: T015, T018. [US-004, FR-001, FR-006]
- [ ] **T020** Implement profile SEO/canonical metadata builder for SSR consumers; **Files**: metadata utility + contract tests. **Depends on**: T019. [FR-007, NFR-SEO]
- [ ] **T021** Implement collections list/detail endpoints for public view with ownership/publicity enforcement; **Files**: controller/query modules. **Depends on**: T010, T019. [US-002, FR-017, FR-019]
- [ ] **T022** Implement owner collection CRUD endpoints with max limits and validation constraints; **Files**: controller/service/DTO modules. **Depends on**: T021. [US-002, FR-017]
- [ ] **T023** Implement collection reordering persistence and deterministic response ordering; **Files**: ordering service + tests. **Depends on**: T022. [FR-018]
- [ ] **T024** Implement follow endpoint (`POST /api/v1/creators/:handle/follow`) with idempotency guarantees; **Files**: follow service/controller/repository. **Depends on**: T008, T019. [US-003, FR-013]
- [ ] **T025** Implement unfollow endpoint (`DELETE /api/v1/creators/:handle/follow`) with idempotency and counter integrity; **Files**: follow service/controller/repository. **Depends on**: T024. [US-003, FR-013, FR-015]
- [ ] **T026** Implement follower/following count projection path with <=5s bounded consistency target; **Files**: projector module and async worker hooks. **Depends on**: T024, T025. [FR-015]
- [ ] **T027** Add blocked/suspended-state authorization checks across profile/follow/collection mutating endpoints; **Files**: guards/policies/tests. **Depends on**: T018, T024, T025. [FR-020, FR-021]

---

## Phase 4 — Public Web Surface + Widget

- [ ] **T028** Implement `/@handle` SSR route integration with profile API payloads and SEO metadata contract; **Files**: web app route/page modules. **Depends on**: T019, T020. [US-004, FR-006, FR-007]
- [ ] **T029** Implement profile page sections: bio/avatar/follower count/public collections/paginated public recipes; **Files**: UI components + page composition. **Depends on**: T028. [US-004, FR-001]
- [ ] **T030** Implement authenticated follow/unfollow interactions on profile page with optimistic UX and rollback handling; **Files**: client actions/hooks/components. **Depends on**: T024, T025, T029. [US-003, FR-013]
- [ ] **T031** Implement embed widget endpoint (`GET /api/v1/creators/:handle/widget`) returning static HTML fragment (no JS); **Files**: widget renderer/endpoint. **Depends on**: T019. [US-005, FR-026]
- [ ] **T032** Enforce widget cache headers (`Cache-Control: public, max-age=300`) and CDN compatibility tests; **Files**: endpoint config + contract tests. **Depends on**: T031. [FR-027]
- [ ] **T033** Validate widget payload includes avatar/displayName/followerCount/3 recent public recipes only; **Files**: renderer tests. **Depends on**: T031. [FR-026]
- [ ] **T034** Add profile route and widget accessibility/usability smoke checks (desktop + mobile); **Files**: E2E specs. **Depends on**: T029, T033. [US-004, US-005]

---

## Phase 5 — Analytics, Moderation, Privacy

- [ ] **T035** Implement daily analytics snapshot job over internal event data with aggregate-only fields; **Files**: scheduled job/service/repository modules. **Depends on**: T011. [US-006, FR-023, FR-025]
- [ ] **T036** Implement owner-only analytics endpoint (`GET /api/v1/creators/:handle/analytics`) with strict authz checks; **Files**: controller/service/guard modules. **Depends on**: T035. [US-006, FR-023]
- [ ] **T037** Enforce analytics privacy requirements (no visitor identifiers/IPs in storage or responses); **Files**: data pipeline filters + tests. **Depends on**: T035, T036. [FR-024]
- [ ] **T038** Implement moderation suspension workflow hooks that hide profile and block new follows; **Files**: moderation service/integration points/tests. **Depends on**: T018, T027. [FR-020]
- [ ] **T039** Implement creator-facing suspension notification + appeal-path response contract integration; **Files**: notification adapter/event schema/tests. **Depends on**: T038. [FR-021]
- [ ] **T040** Implement DMCA takedown workflow integration and recipe unpublish SLA instrumentation path; **Files**: compliance workflow modules. **Depends on**: T029, T038. [FR-022]
- [ ] **T041** Implement GDPR erasure propagation for creator-profile-owned records and caches; **Files**: privacy orchestration modules + tests. **Depends on**: T007-T011, T035. [REQ-018 lineage]

---

## Phase 6 — Cross-feature integrations

- [ ] **T042** Implement feed projection bridge for follow/publication events to existing feed ownership boundaries; **Files**: event adapter modules + tests. **Depends on**: T026. [FR-014]
- [ ] **T043** Implement tip delegation endpoint contract to 010 without local billing logic; **Files**: gateway/controller integration tests. **Depends on**: T019. [FR-010 boundary, FR-016 context]
- [ ] **T044** Implement premium/paid-follow delegation markers and boundary validations to 010 contracts; **Files**: adapter modules + policy checks. **Depends on**: T043. [FR-016]
- [ ] **T045** Add integration tests validating 012 does not process payment state directly and only delegates; **Files**: integration tests. **Depends on**: T043, T044. [Boundary enforcement]
- [ ] **T046** Add sibling audience scope checks ensuring S-004 is not nested with S-003/S-002 semantics; **Files**: policy tests/contracts. **Depends on**: T021, T029. [Audience model]

---

## Phase 7 — Test, Verification, and M7 readiness evidence

- [ ] **T047** Add API contract tests for all `/api/v1/creators/*` endpoints including authz/error envelopes. **Depends on**: T015-T027, T031, T036. [GR-002]
- [ ] **T048** Add integration tests for profile lifecycle, follow graph, collection ordering, and moderation transitions. **Depends on**: T027, T038. [FR-001..FR-022]
- [ ] **T049** Add unit tests for handle validator, follow projector, widget renderer, analytics aggregators, and privacy filters. **Depends on**: T017, T026, T033, T037. [v-model/unit-test.md]
- [ ] **T050** Add E2E tests: claim handle, public browse, follow/unfollow, collection browse, widget embed render, owner analytics view. **Depends on**: T030, T034, T036. [US-001..US-006]
- [ ] **T051** Add performance checks: profile SSR p95, follow API p95, widget cache-hit p95, analytics endpoint p95 against NFR targets. **Depends on**: T028, T032, T036. [NFR table]
- [ ] **T052** Add security/privacy tests for blocked-user restrictions, stale-session protections, and PII non-leak in public payloads. **Depends on**: T027, T037, T041. [Hazard mitigations]
- [ ] **T053** Run full test suite + lint + typecheck for affected workspaces and archive evidence references. **Depends on**: T047-T052. [M7 exit evidence]
- [ ] **T054** Update V-Model execution status artifacts (`traceability-matrix.md`, release audit inputs) with real test-case mappings/results. **Depends on**: T053. [GR-001 readiness]
- [ ] **T055** Produce `sync-verify` input bundle linking `spec.md` ↔ `product-spec/` ↔ `plan.md` ↔ `tasks.md` ↔ implemented code/tests. **Depends on**: T054. [Downstream sync-verify]
- [ ] **T056** Prepare M7 feature readiness checklist and unresolved risk register updates in `review.md`. **Depends on**: T054, T055. [Launch governance]

---

## Finalization / handoff tasks

- [ ] **T057** Confirm milestone references and post-1.0 placement remain aligned with [`../v1-launch-plan.md`](../v1-launch-plan.md). **Depends on**: T056.
- [ ] **T058** Confirm GR-002 and GR-007 compliance evidence is documented in review and test artifacts. **Depends on**: T056.
- [ ] **T059** Validate links among `spec.md`, `product-spec/`, `plan.md`, `tasks.md`, and `review.md` are intact. **Depends on**: T056.
- [ ] **T060** Submit artifacts for Director-led sync-verify and M7 milestone integration. **Depends on**: T057, T058, T059.

---

## Notes

- This task set is milestone-aware for `M7` and intentionally keeps monetization mechanics delegated to feature 010.
- No tasks in this file modify other feature directories; cross-feature items are integration boundaries and contract compliance checks only.
