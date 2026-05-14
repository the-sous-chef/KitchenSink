# Tasks: Feature 014 — Notification Service

**Feature**: `014-notification-service`
**Generated**: 2026-05-12
**Source artifacts**: `plan.md`, `spec.md`, `product-spec/product-spec.md`, `research/codebase-analysis.md`, `../v1-launch-plan.md`, `../governance-rules.md`

---

## Dependency Graph

```text
Foundation + Contracts (T001-T009)
  -> Registry + Governance Controls (T010-T016)
    -> Publish Ingest + Durable Routing (T017-T024)
      -> Subscribe + Replay + Ordering (T025-T033)
        -> Telemetry + Quotas + Ops Hardening (T034-T041)
          -> Cross-feature Integrations (T042-T056)
            -> Verification + M8 Exit Closure (T057-T066)
```

---

## Phase 1 — Foundation and contract scaffolding

- [ ] **T001** Confirm/add 014 API + shared workspace registration and Node 24.x engine conformance. **Files**: root `package.json`, package manifests. **Depends on**: none. [NFR-007, GR-008]
- [ ] **T002** [P] Scaffold `@kitchensink/notifications-api` package (NestJS baseline, lint/test/typecheck). **Files**: `packages/api/notifications-api/*`. **Depends on**: T001. [US-001, FR-001]
- [ ] **T003** [P] Scaffold `@kitchensink/shared-notifications` package for typed envelopes/recipient contracts. **Files**: `packages/shared/notifications/*`. **Depends on**: T001. [US-004, FR-004]
- [ ] **T004** Wire TS project references/path aliases for new 014 packages. **Files**: root/base `tsconfig*.json`, package `tsconfig.json`. **Depends on**: T002, T003. [NFR-008]
- [ ] **T005** Add env schema placeholders for auth strategy, retention window, dedupe window, quota controls, registry enforcement mode. **Files**: `packages/api/notifications-api/src/config/*`, `.env.example*`. **Depends on**: T002. [FR-017, FR-018, FR-019]
- [ ] **T006** Author OpenAPI skeleton strictly under `/api/v1/notifications/*`. **Files**: `specs/014-notification-service/contracts/api.openapi.yaml` (or agreed 014 contract path). **Depends on**: T002. [GR-002, FR-001, FR-010]
- [ ] **T007** Add architecture README documenting module boundaries (ingest, router, sequencer, replay, telemetry, registry). **Files**: `packages/api/notifications-api/README.md`. **Depends on**: T002. [NFR-001, NFR-005]
- [ ] **T008** Add dependency notes prohibiting local redefinition of shared domain types and requiring `@kitchensink/shared-recipe-core`. **Files**: 014 package manifests + README. **Depends on**: T002, T003. [GR-007]
- [ ] **T009** Create integration test harness scaffold for producer publish and subscriber replay contracts. **Files**: `packages/api/notifications-api/test/*`. **Depends on**: T002, T003. [SC-001, SC-002]

---

## Phase 2 — Registry and governance controls

- [ ] **T010** Create version-controlled `messageType` registry with fields `{ key, ownerFeature, description, status }`. **Files**: `specs/014-notification-service/contracts/message-type-registry.yaml` (or approved location). **Depends on**: T006. [FR-016]
- [ ] **T011** Implement runtime registry loader + cache invalidation strategy for publish validation path. **Files**: `packages/api/notifications-api/src/registry/*`. **Depends on**: T010. [FR-016, NFR-001]
- [ ] **T012** Implement environment-configurable enforcement mode (`warn` vs `reject`) for unregistered `messageType`. **Files**: `packages/api/notifications-api/src/publish/*`, config. **Depends on**: T011. [FR-017]
- [ ] **T013** Emit `unregistered_message_type_total` counter and producer-scoped dimensions. **Files**: telemetry module + publish pipeline. **Depends on**: T012. [FR-013, FR-016]
- [ ] **T014** Add contract tests for registered/unregistered behavior in both enforcement modes. **Files**: `packages/api/notifications-api/test/registry*.spec.ts`. **Depends on**: T012, T013. [FR-016, FR-017]
- [ ] **T015** Add governance checks for API prefix and package naming conventions in CI/lint docs. **Files**: lint/config/docs scripts. **Depends on**: T006. [GR-002, GR-009]
- [ ] **T016** Document GR-011 ownership boundary and producer obligations in 014 integration guide. **Files**: `specs/014-notification-service/contracts/producer-integration.md`. **Depends on**: T010. [GR-011]

---

## Phase 3 — Publish ingest + durable routing

- [ ] **T017** Implement `POST /api/v1/notifications/publish` endpoint and envelope schema validation before durable write. **Files**: controller/DTO/validation pipeline. **Depends on**: T006, T011. [FR-001, FR-015]
- [ ] **T018** Integrate producer authentication/authorization aligned to 002 service-to-service mechanism. **Files**: auth guards/interceptors. **Depends on**: T017. [FR-002]
- [ ] **T019** Implement durable acceptance persistence path that guarantees ack-after-durable-write semantics. **Files**: repository/store module. **Depends on**: T017. [FR-003]
- [ ] **T020** Implement recipient descriptor validator (`user|group|global`, id required/forbidden by kind). **Files**: recipient validator module. **Depends on**: T017. [FR-004]
- [ ] **T021** Implement idempotency collapse by `(producerId, idempotencyKey, dedupeWindow)`. **Files**: idempotency store/service. **Depends on**: T019. [FR-018]
- [ ] **T022** Implement per-producer quota checks + structured throttling errors. **Files**: quota service/guard. **Depends on**: T018, T019. [FR-019]
- [ ] **T023** Add queue-backed routing worker(s) for async fanout execution with retry policy. **Files**: worker queue modules. **Depends on**: T019, T020. [US-001, US-002, NFR-001]
- [ ] **T024** Add publish-path fault-injection and restart-survival tests (durability + idempotency + quota). **Files**: integration/system tests. **Depends on**: T021, T022, T023. [FR-003, FR-018, FR-019]

---

## Phase 4 — Subscription, replay, ordering

- [ ] **T025** Implement authenticated subscription endpoint under `/api/v1/notifications/subscribe`. **Files**: subscribe transport module. **Depends on**: T018. [FR-010, FR-020]
- [ ] **T026** Bind subscriber identity to authenticated principal and reject cross-user subscription attempts. **Files**: subscriber authz resolver. **Depends on**: T025. [FR-021]
- [ ] **T027** Implement group membership resolution at delivery time (pluggable source per product-spec Q-002 decision). **Files**: group resolver interface + adapter. **Depends on**: T023, T025. [FR-006, FR-022]
- [ ] **T028** Implement recipient-kind routing paths (`user`, `group`, `global`) and authenticated-only global fanout. **Files**: routing dispatcher. **Depends on**: T026, T027. [FR-005, FR-006, FR-007]
- [ ] **T029** Implement per-recipient FIFO sequencing for user/group messages; explicitly document non-FIFO global behavior. **Files**: sequencing module + docs. **Depends on**: T028. [FR-008, FR-009]
- [ ] **T030** Implement catch-up retention store and replay endpoint with configurable retention (>=24h). **Files**: retention/replay module. **Depends on**: T028. [FR-012]
- [ ] **T031** Implement unknown-`messageType` tolerant client SDK/reference behavior (log + ignore). **Files**: shared client helper/reference implementations. **Depends on**: T010, T025. [FR-011]
- [ ] **T032** Add end-to-end tests for reconnect replay, ordering guarantees, unauthorized subscribe attempts. **Files**: integration/system tests. **Depends on**: T029, T030, T031. [SC-001, SC-002, SC-004]
- [ ] **T033** Validate global broadcast scale behavior under representative subscriber counts and record baseline SLOs. **Files**: perf test harness + runbook notes. **Depends on**: T028, T029. [US-003, NFR-001]

---

## Phase 5 — Telemetry and operations hardening

- [ ] **T034** Emit counters: per-producer publish count, per-recipient-kind delivered count, undelivered-after-retention count, active subscriber gauge, per-`messageType` publish count. **Files**: telemetry pipeline. **Depends on**: T023, T028, T030. [FR-013]
- [ ] **T035** Emit dedicated global publish counter. **Files**: telemetry module. **Depends on**: T034. [FR-014]
- [ ] **T036** Add dashboard definitions + alert thresholds for delivery health and retention misses. **Files**: ops dashboards/alerts config docs. **Depends on**: T034, T035. [US-007, NFR-006]
- [ ] **T037** Add throttled publish counter and quota reject observability. **Files**: quota telemetry. **Depends on**: T022, T034. [FR-019]
- [ ] **T038** Add operational runbook (incident classes: auth failure, backlog growth, retention expiry, registry misconfig). **Files**: `specs/014-notification-service/contracts/ops-runbook.md`. **Depends on**: T036, T037. [NFR-006]
- [ ] **T039** Add canary script for publish→deliver→replay health check. **Files**: scripts/ops health checks. **Depends on**: T030, T034. [US-007]
- [ ] **T040** Run chaos/failure drills (queue lag, subscriber drop, auth outage) and capture mitigation evidence. **Files**: test evidence docs/logs. **Depends on**: T038, T039. [NFR-001, NFR-006]
- [ ] **T041** Update plan/review references with telemetry and control validation outcomes. **Files**: `plan.md`, `review.md` (evidence sections). **Depends on**: T040. [M8 remediation]

---

## Phase 6 — Cross-feature integrations (coordination-heavy)

- [ ] **T042** [COORD] Finalize integration contract with Feature 003 for `food.backfill.completed` and `food.fetch.failed` schema/recipient mapping. **Depends on**: T010, T017, T028. [003 dependency, GR-011]
- [ ] **T043** [COORD] Finalize Feature 008 timer alert trigger taxonomy and latency SLO (`timer.started`, `timer.completed`, `timer.expired` or approved equivalent). **Depends on**: T028, T029. [008 dependency]
- [ ] **T044** [COORD] Finalize Feature 005 AI disclosure event mapping to registry keys and client display behavior. **Depends on**: T010, T031. [005 dependency, GR-010 coupling]
- [ ] **T045** [COORD] Finalize Feature 009 compliance-gap/deficiency notification scope (explicit FR vs warning-level augmentation) and map to registry. **Depends on**: T010, T031. [009 dependency]
- [ ] **T046** [COORD] Finalize Feature 012 moderation notification events and appeal-state update delivery semantics. **Depends on**: T010, T028. [012 dependency]
- [ ] **T047** [COORD] Finalize Feature 013 publish/enroll milestone events and recipient mapping. **Depends on**: T010, T028. [013 dependency]
- [ ] **T048** [COORD] Determine whether Feature 006 integration is mandatory at M8 exit or hook-ready only; document Director decision. **Depends on**: T042-T047. [launch-plan M8 integration list]
- [ ] **T049** [COORD] Determine whether Feature 007 collaboration notification integration is mandatory at M8 exit or hook-ready only; document Director decision. **Depends on**: T042-T047. [launch-plan M8 integration list]
- [ ] **T050** [COORD] Determine whether Feature 010 billing lifecycle notifications are in 014 M8 hard scope; document owner + timing. **Depends on**: T042-T047. [launch-plan M8 integration list]
- [ ] **T051** [COORD] Confirm trigger ownership roster for `001`–`013`: each trigger has producer team owner, oncall group, and schema approver. **Depends on**: T042-T050. [cross-feature governance]
- [ ] **T052** Add integration tests per finalized producer contracts (at least one happy-path + one failure-path each). **Depends on**: T042-T051. [SC-001..SC-004]
- [ ] **T053** Add rollout flags by producer feature for gradual enablement/rollback. **Depends on**: T052. [NFR-001]
- [ ] **T054** Execute staged integration rollout and capture evidence snapshots for each integrated producer. **Depends on**: T053. [M8 evidence]
- [ ] **T055** Update trigger inventory in `plan.md` with final status (`live`, `hook-ready`, `deferred`) per feature. **Depends on**: T054. [Director readiness artifact]
- [ ] **T056** Record unresolved cross-team trigger disputes in `review.md` as open questions with owner + due date. **Depends on**: T055. [governance traceability]

---

## Phase 7 — Verification and M8 exit closure

- [ ] **T057** Regenerate/repair acceptance, system, integration, and unit trace mappings to remove current `❌ MISSING` cells. **Files**: `v-model/traceability-matrix.md` and related V-model artifacts. **Depends on**: T054. [M8 remediation]
- [ ] **T058** Ingest real test execution results into V-model artifacts and release-audit report (eliminate untested-only status). **Depends on**: T057. [GR-001]
- [ ] **T059** Produce `verify-report.md` with objective findings and drive to `0 CRITICAL, 0 WARNING`. **Depends on**: T058. [launch-plan M8]
- [ ] **T060** Validate GR-011 ownership evidence: integrated producers publish via 014, no producer-local delivery bypass in integrated surfaces. **Depends on**: T054, T059. [GR-011]
- [ ] **T061** Validate GR-002/GR-007/GR-008/GR-009 conformance with implementation evidence links. **Depends on**: T059. [governance closure]
- [ ] **T062** Unblock `v-model/release-audit-report.md` with final compliance status and waiver accounting (if any). **Depends on**: T058, T059. [GR-001]
- [ ] **T063** Execute full regression for publish/subscribe/replay/auth/quotas/idempotency scenarios. **Depends on**: T062. [SC-001..SC-004]
- [ ] **T064** Update `review.md` status for M8 gate decision and attach milestone evidence links. **Depends on**: T060, T061, T063. [M8 exit]
- [ ] **T065** [COORD] Conduct cross-feature sign-off review with producer owners (`003`,`005`,`008`,`009`,`012`,`013` + decided extras) and capture approvals. **Depends on**: T064. [Director launch readiness]
- [ ] **T066** Final readiness packet for Director (trigger ownership matrix + evidence index + unresolved risks). **Depends on**: T065. [Downstream M8 launch review]

---

## Parallelization notes

- Tasks marked `[P]` are safe to run in parallel after dependencies are met.
- Tasks marked `[COORD]` require coordination with external feature teams and may be schedule-critical.

---

## Coordination-critical open items (to resolve early)

1. Final delivery mechanism profile for v1 runtime (transport implementation details under hybrid model).
2. Group membership source of truth for `recipient.kind=group`.
3. Which integrations are **hard M8 exit blockers** vs **hook-ready acceptable** (`006`, `007`, `010` specifically).
4. Trigger ownership and schema approval per producer feature.
