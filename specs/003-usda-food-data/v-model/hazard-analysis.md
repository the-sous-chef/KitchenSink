# Hazard Analysis (FMEA): USDA Food Data Integration

**Feature Branch**: `003-usda-food-data`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/003-usda-food-data/v-model/system-design.md`
**Standard**: General-Purpose FMEA (non-regulated software; `domain: ''` in `v-model-config.yml`)

## Overview

This document presents the Failure Mode and Effects Analysis (FMEA) for the **USDA Food Data Integration** feature. Every system component (`SYS-001`..`SYS-012`) from `system-design.md` is assessed for realistic failure modes. Each hazard receives a unique `HAZ-NNN` identifier and is linked to risk-control measures (`REQ-NNN` / `SYS-NNN` / `ARCH-NNN`), enabling the traceability chain: Hazard → Mitigation → Requirement → Test Case (Matrix H in `traceability-matrix.md`).

**Non-regulated context.** Sous Chef is a consumer recipe management application. There are no life-safety, vehicle-control, medical-device, or aviation-control concerns. Severity is measured against **user trust, data integrity, privacy, availability, and platform cost** — not personal injury. Safety-critical taxonomies (ISO 26262 ASIL, DO-178C DAL, IEC 62304) are intentionally **not** applied; `v-model-config.yml` sets `domain: ''`.

## ID Schema

- **Hazard ID**: `HAZ-{NNN}` — 3-digit zero-padded, sequential (HAZ-001, HAZ-002, ...). Never renumbered.
- **Lineage**: From any `HAZ-NNN`, the Mitigation column lists `REQ-NNN`, `SYS-NNN`, and (where useful) `ARCH-NNN` references. The full chain to verification test cases (`ATP-NNN`, `STP-NNN`, `ITP-NNN`, `UTP-NNN`) lives in `traceability-matrix.md` (Matrix H — Hazard Traceability).

## Risk Matrix Definition

### Severity Scale (consumer SaaS — recipe app)

| Level        | Definition                                                                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catastrophic | Cross-tenant data leak, broad unauthorized access, persistent loss of user-owned recipe data, or platform-wide outage.                                                 |
| Critical     | Individual-user data loss without recovery, sustained sharing-circle audience misroute, security control bypass for one user, or sustained core-flow outage (≥1 hour). |
| Serious      | Recoverable degradation: failed digitization batch with retry path, single-job audience-state stalled, transient endpoint 5xx with idempotent retry.                   |
| Minor        | Annoyance: slow food lookup turnaround, stale non-critical nutrition metadata, transient UI error with self-recovery.                                                  |
| Negligible   | Cosmetic only: log noise, telemetry drift, copy/wording inconsistency.                                                                                                 |

### Likelihood Scale

| Level      | Definition                                                                   |
| ---------- | ---------------------------------------------------------------------------- |
| Frequent   | Expected on a regular cadence under normal load (≥1× per day in production). |
| Probable   | Expected occasionally (≥1× per week per 1k MAU).                             |
| Occasional | Expected rarely (≥1× per month per 1k MAU).                                  |
| Remote     | Possible under unusual conditions (≥1× per quarter at small scale).          |
| Improbable | Conceivable only under stacked failure or adversarial conditions.            |

### Risk Level Matrix

|              | Frequent     | Probable     | Occasional   | Remote      | Improbable  |
| ------------ | ------------ | ------------ | ------------ | ----------- | ----------- |
| Catastrophic | Unacceptable | Unacceptable | Unacceptable | Undesirable | Undesirable |
| Critical     | Unacceptable | Unacceptable | Undesirable  | Undesirable | Tolerable   |
| Serious      | Unacceptable | Undesirable  | Undesirable  | Tolerable   | Tolerable   |
| Minor        | Undesirable  | Tolerable    | Tolerable    | Tolerable   | Acceptable  |
| Negligible   | Tolerable    | Tolerable    | Acceptable   | Acceptable  | Acceptable  |

**Disposition rule**: `Unacceptable` MUST be mitigated to `Undesirable` or lower before release. `Undesirable` MUST have explicit residual-risk acceptance recorded in this document. `Tolerable`/`Acceptable` are accepted as-is.

## Operational States

`system-design.md` defines queue and pipeline behavior but does not formally enumerate operational states; the implicit state is **NORMAL** (steady-state production). The following operating modes are referenced where relevant for state-dependent hazards:

| State                | Definition                                                                             | Source                    |
| -------------------- | -------------------------------------------------------------------------------------- | ------------------------- |
| NORMAL               | Steady-state operation under expected load and USDA/API provider availability.         | Implicit                  |
| DEGRADED-USDA        | USDA API returns elevated latency, throttles, or 5xx; retry/backoff behavior active.   | SYS-005, SYS-009          |
| RATE-LIMITED         | Internal token bucket exhausted (`tokens = 0`), queue visibility-delay/backoff active. | SYS-005, SYS-006          |
| BACKFILL-LAG         | High/low priority queues are accumulating backlog while user polling continues.        | SYS-003, SYS-004, SYS-005 |
| STALE-REFRESH-WINDOW | Foods exceed staleness threshold and scheduled refresh/re-enrichment is in progress.   | REQ-013, SYS-004, SYS-007 |

⚠️ No formally enumerated operational states exist in `system-design.md`. State-dependent severity is captured with the implicit modes above; if `system-design.md` later introduces a formal state taxonomy, this section MUST be reconciled.

## Hazard Register (FMEA)

> One or more `HAZ-NNN` per `SYS-NNN`. Mitigations cite existing `REQ-NNN`, `SYS-NNN`, `ARCH-NNN`, and `MOD-NNN` identifiers from this feature only.

### SYS-001 — FoodApiLambda

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                        | Severity | Likelihood | Risk Level  | Mitigation                                                                                           | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------- | -------- | ---------- | ----------- | ---------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-001 | SYS-001   | Validation regression allows malformed/non-numeric `fdcId` into event path. | NORMAL            | Queue pollution, wasted USDA budget, noisy failures.          | Serious  | Occasional | Undesirable | REQ-006 validation gate; ARCH-001 path validation; MOD-001 early-return 400 on invalid IDs.          | Tolerable     |
| HAZ-002 | SYS-001   | API path accidentally calls USDA directly on cache miss.                    | NORMAL            | Request latency spikes; synchronous outage when USDA is down. | Critical | Remote     | Undesirable | REQ-001 invariant; SYS-001 local-store-only contract; ARCH-001 never calls ARCH-008 in request path. | Tolerable     |
| HAZ-003 | SYS-001   | Pending dedup logic bypassed under concurrent misses for same `fdcId`.      | BACKFILL-LAG      | Duplicate SQS events and redundant fetches; budget burn.      | Serious  | Occasional | Undesirable | REQ-004 dedup requirement; SYS-008 pending set; MOD-001 `isPending` + `markPending` sequence.        | Tolerable     |

### SYS-002 — EventBridgeBus

| HAZ ID  | Component | Failure Mode                                                             | Operational State | Effect                                                       | Severity | Likelihood | Risk Level  | Mitigation                                                                                             | Residual Risk |
| ------- | --------- | ------------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------ | -------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------ | ------------- |
| HAZ-004 | SYS-002   | EventBridge publish throttled/outage drops `FoodRequested` events.       | DEGRADED-USDA     | Misses remain pending indefinitely; stale user-visible data. | Critical | Remote     | Undesirable | REQ-011/REQ-012 event contract; ARCH-002 putEvents failure handling; SYS-012 alarms on publish errors. | Tolerable     |
| HAZ-005 | SYS-002   | Rule misroute sends single lookup events to low-priority path only.      | BACKFILL-LAG      | User-facing requests starved behind batch backlog.           | Serious  | Occasional | Undesirable | ARCH-003 routing split (high vs low); SYS-003 priority queue policy; REQ-012 priority contract.        | Tolerable     |
| HAZ-006 | SYS-002   | Event payload schema drift (`fdcId`/`fdcIds`) breaks downstream parsing. | NORMAL            | Consumer discards messages; backfill silently stalls.        | Serious  | Occasional | Undesirable | REQ-IF-005 event schema requirement; ARCH-002 input validation; MOD-002 payload guards.                | Tolerable     |

### SYS-003 — HighPriorityFoodQueue

| HAZ ID  | Component | Failure Mode                                                     | Operational State | Effect                                                             | Severity | Likelihood | Risk Level  | Mitigation                                                                                       | Residual Risk |
| ------- | --------- | ---------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------ | -------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------ | ------------- |
| HAZ-007 | SYS-003   | FIFO deduplication key collision drops distinct lookup requests. | BACKFILL-LAG      | Some foods never fetched despite demand.                           | Serious  | Remote     | Tolerable   | ARCH-003 queue routing + dedup strategy; MOD-003 notes FIFO dedup collision behavior and alarms. | Tolerable     |
| HAZ-008 | SYS-003   | Visibility timeout too short for USDA latency profile.           | DEGRADED-USDA     | Premature retries create duplicate work and backlog amplification. | Serious  | Occasional | Undesirable | SYS-003 timeout configuration; ARCH-004 retry/backoff; MOD-004 partial-batch failure handling.   | Tolerable     |

### SYS-004 — LowPriorityFoodQueue

| HAZ ID  | Component | Failure Mode                                                                  | Operational State    | Effect                                                      | Severity | Likelihood | Risk Level  | Mitigation                                                                                       | Residual Risk |
| ------- | --------- | ----------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------- | -------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------ | ------------- |
| HAZ-009 | SYS-004   | Stale-food refresh jobs accumulate and never drain under sustained high load. | STALE-REFRESH-WINDOW | Nutrition data ages beyond freshness target.                | Serious  | Occasional | Undesirable | REQ-013 stale refresh trigger; SYS-004 low-priority queue isolation; SYS-012 queue-depth alarms. | Tolerable     |
| HAZ-010 | SYS-004   | Batch event payload exceeds queue constraints and is dropped.                 | NORMAL               | Recipe-driven enrichment jobs lost without user visibility. | Serious  | Remote     | Tolerable   | REQ-IF-004 batch limit (max 20 IDs); ARCH-002/ARCH-003 payload validation and bounded routing.   | Tolerable     |

### SYS-005 — FoodConsumerLambda

| HAZ ID  | Component | Failure Mode                                                           | Operational State | Effect                                                     | Severity | Likelihood | Risk Level  | Mitigation                                                                                             | Residual Risk |
| ------- | --------- | ---------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------- | -------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------ | ------------- |
| HAZ-011 | SYS-005   | USDA outage or sustained 5xx collapses consumer throughput.            | DEGRADED-USDA     | Pending foods and refresh jobs stall; user trust degrades. | Critical | Occasional | Undesirable | REQ-016/REQ-017 retry semantics; ARCH-004 retry/backoff; MOD-004 transient USDA error handling.        | Tolerable     |
| HAZ-012 | SYS-005   | USDA 429 throttling despite local token bucket (clock skew / burst).   | DEGRADED-USDA     | Requeue storm, delayed availability, increased cost.       | Serious  | Occasional | Undesirable | REQ-018/REQ-019 global rate cap; SYS-006 token bucket; MOD-004 429 visibility backoff branch.          | Tolerable     |
| HAZ-013 | SYS-005   | Malformed nutrition payload parsing writes partial/incorrect macros.   | NORMAL            | Downstream nutrition planning uses corrupted values.       | Critical | Occasional | Undesirable | REQ-NF-018 fidelity requirement; ARCH-008 response parser; MOD-004 parse-and-validate before upsert.   | Tolerable     |
| HAZ-014 | SYS-005   | ETL pipeline failure after fetch but before persistence/invalidations. | NORMAL            | Pending never clears; API repeatedly returns 202.          | Serious  | Occasional | Undesirable | ARCH-004 transactional write+invalidate sequence; MOD-004 per-record failure handling; SYS-012 alarms. | Tolerable     |

### SYS-006 — TokenBucketRateLimiter

| HAZ ID  | Component | Failure Mode                                                         | Operational State | Effect                                                 | Severity | Likelihood | Risk Level  | Mitigation                                                                                    | Residual Risk |
| ------- | --------- | -------------------------------------------------------------------- | ----------------- | ------------------------------------------------------ | -------- | ---------- | ----------- | --------------------------------------------------------------------------------------------- | ------------- |
| HAZ-015 | SYS-006   | Token refill math bug under-refills tokens for extended periods.     | RATE-LIMITED      | Throughput collapse; queue backlog and stale data.     | Serious  | Occasional | Undesirable | REQ-019 refill constraints; ARCH-005 formula; MOD-005 deterministic refill computation tests. | Tolerable     |
| HAZ-016 | SYS-006   | Atomic check/decrement violation allows overshoot >1,000 calls/hour. | NORMAL            | USDA quota breach, throttling/temporary key sanctions. | Critical | Remote     | Undesirable | REQ-018 hard cap; ARCH-005 Lua atomicity; MOD-005 single-script check-and-decrement.          | Tolerable     |

### SYS-007 — FoodDataPostgresRepository

| HAZ ID  | Component | Failure Mode                                                               | Operational State    | Effect                                                            | Severity | Likelihood | Risk Level  | Mitigation                                                                                             | Residual Risk |
| ------- | --------- | -------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------- | -------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------ | ------------- |
| HAZ-017 | SYS-007   | Foreign-key/key drift between USDA `fdcId` semantics and local cache rows. | NORMAL               | Wrong food attached to ingredient references.                     | Critical | Remote     | Undesirable | REQ-020/REQ-021 data model invariants; ARCH-006 keyed upsert by `fdcId`; MOD-006 unique index guards.  | Tolerable     |
| HAZ-018 | SYS-007   | Branded vs generic food collisions overwrite canonical row for same query. | NORMAL               | Users see misleading nutrition for selected ingredients.          | Serious  | Occasional | Undesirable | REQ-008/REQ-010 ranking relevance; ARCH-006 normalized category fields; MOD-006 conflict strategy.     | Tolerable     |
| HAZ-019 | SYS-007   | Deprecated USDA `fdcId` references remain unresolved in local records.     | STALE-REFRESH-WINDOW | Lookups return tombstones for foods that moved/replaced upstream. | Serious  | Occasional | Undesirable | REQ-005 tombstone behavior + REQ-013 refresh cycle; ARCH-006 status transitions; SYS-004 refresh jobs. | Tolerable     |

### SYS-008 — FoodDataRedisCache

| HAZ ID  | Component | Failure Mode                                       | Operational State | Effect                                                        | Severity | Likelihood | Risk Level  | Mitigation                                                                                        | Residual Risk |
| ------- | --------- | -------------------------------------------------- | ----------------- | ------------------------------------------------------------- | -------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-020 | SYS-008   | Cache invalidation missed after successful upsert. | NORMAL            | Stale food data served despite newer USDA data in PostgreSQL. | Serious  | Occasional | Undesirable | REQ-022/REQ-023 cache semantics; ARCH-007 invalidation on write; MOD-007 delete-on-upsert policy. | Tolerable     |
| HAZ-021 | SYS-008   | Pending set entry orphaned after consumer crash.   | BACKFILL-LAG      | API remains stuck at 202 and suppresses requeue.              | Serious  | Occasional | Undesirable | REQ-004 dedup + retry model; MOD-007 pending set cleanup paths; SYS-012 stale-pending alarm.      | Tolerable     |

### SYS-009 — USDAFoodDataCentralApi

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                      | Severity | Likelihood | Risk Level  | Mitigation                                                                                             | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------- | -------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------ | ------------- |
| HAZ-022 | SYS-009   | USDA schema version drift renames/removes nutrition fields.                 | DEGRADED-USDA     | Parser rejects payloads or writes wrong nutrient mapping.   | Critical | Occasional | Undesirable | REQ-024 upstream contract handling; ARCH-008 schema-aware parser; MOD-008 strict field mapping checks. | Tolerable     |
| HAZ-023 | SYS-009   | Upstream metadata mismatch causes generic/branded classification inversion. | NORMAL            | Search ranking and ingredient matching quality degrade.     | Serious  | Occasional | Undesirable | REQ-008 relevance + REQ-NF-018 fidelity; ARCH-008 classification parsing; MOD-008 typed mapping rules. | Tolerable     |
| HAZ-024 | SYS-009   | USDA API key revoked/expired without timely rotation pickup.                | DEGRADED-USDA     | Consumer cannot fetch new food data; backlog grows rapidly. | Critical | Remote     | Undesirable | REQ-026/REQ-027 secret rotation; SYS-011 secret management; ARCH-010 cached-secret refresh strategy.   | Tolerable     |

### SYS-010 — WebSocketNotificationLambda

| HAZ ID  | Component | Failure Mode                                                                  | Operational State | Effect                                                       | Severity | Likelihood | Risk Level | Mitigation                                                                                         | Residual Risk |
| ------- | --------- | ----------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------ | -------- | ---------- | ---------- | -------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-025 | SYS-010   | Optional WebSocket notifier disabled but clients assume push-only completion. | NORMAL            | Users do not see completion without manual polling fallback. | Minor    | Occasional | Tolerable  | REQ-007 polling contract remains primary; REQ-025 marks WebSocket as optional/deferred.            | Acceptable    |
| HAZ-026 | SYS-010   | Notification message routed to wrong connection/session.                      | NORMAL            | Incorrect client state update; user confusion.               | Serious  | Remote     | Tolerable  | ARCH-009 connection mapping + requestId correlation; SYS-012 structured logs for forensic tracing. | Tolerable     |

### SYS-011 — SecretManagement

| HAZ ID  | Component | Failure Mode                                                                  | Operational State | Effect                                                      | Severity | Likelihood | Risk Level  | Mitigation                                                                                            | Residual Risk |
| ------- | --------- | ----------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------- | -------- | ---------- | ----------- | ----------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-027 | SYS-011   | Secret value logged/exposed through error path or debug output.               | NORMAL            | Credential disclosure; potential API abuse and bill impact. | Critical | Remote     | Undesirable | REQ-IF-006 secret non-exposure constraint; ARCH-010 never emits raw secret; MOD-010 redacted errors.  | Tolerable     |
| HAZ-028 | SYS-011   | Rotation occurs but stale cached key remains in long-lived execution context. | DEGRADED-USDA     | Burst of auth failures until runtime recycle.               | Serious  | Occasional | Undesirable | REQ-027 rotation support; ARCH-010 TTL-based secret cache; MOD-010 periodic refresh on auth failures. | Tolerable     |

### SYS-012 — MonitoringAndLogging

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                     | Severity | Likelihood | Risk Level  | Mitigation                                                                                          | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------- | -------- | ---------- | ----------- | --------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-029 | SYS-012   | Queue-depth / backlog alarms misconfigured or disabled.                     | BACKFILL-LAG      | Operations misses prolonged incident; stale data persists. | Serious  | Occasional | Undesirable | REQ-028/REQ-029 observability requirements; ARCH-011 metrics+alarms baseline; MOD-011 alarm wiring. | Tolerable     |
| HAZ-030 | SYS-012   | Metrics cardinality explosion from unbounded labels (e.g., raw query text). | NORMAL            | CloudWatch cost spike, dropped high-cardinality telemetry. | Minor    | Probable   | Tolerable   | REQ-030 logging constraints; MOD-011 bounded dimensions; ARCH-011 structured schema.                | Acceptable    |

## Progressive Deepening Addendum (Architecture-level Hazards)

The following hazards emerged from `architecture-design.md` decomposition (11 ARCH modules, including cross-cutting utility modules `ARCH-005`, `ARCH-009`, `ARCH-010`, `ARCH-011`). They are **appended** to the SYS-level register above and capture failure modes only visible at the ARCH boundary (interface mismatches, protocol failures, data-format incompatibilities, race conditions across modules).

| HAZ ID  | Component           | Failure Mode                                                                      | Operational State | Effect                                                          | Severity | Likelihood | Risk Level  | Mitigation                                                                                                | Residual Risk |
| ------- | ------------------- | --------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------- | -------- | ---------- | ----------- | --------------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-031 | ARCH-004 + ARCH-006 | Upsert succeeds but status-transition write (`pending`→`fetched`) is skipped.     | NORMAL            | Food remains logically pending despite data presence.           | Serious  | Remote     | Tolerable   | MOD-004 + MOD-006 enforce atomic write ordering; REQ-003/REQ-007 status semantics validated in tests.     | Tolerable     |
| HAZ-032 | ARCH-006 + ARCH-007 | Cache/database key serialization mismatch (`"12345"` vs `12345`).                 | NORMAL            | Duplicate cache entries, stale reads, invalidation misses.      | Serious  | Occasional | Undesirable | ARCH-006/ARCH-007 canonical numeric `fdcId`; MOD-007 canonical key formatter utility.                     | Tolerable     |
| HAZ-033 | ARCH-008 + ARCH-006 | Multilingual food-name normalization collision maps distinct foods together.      | NORMAL            | Search quality degradation; ingredient-to-food false positives. | Serious  | Occasional | Undesirable | REQ-008 relevance ranking; ARCH-008 locale-safe parsing; MOD-008 normalization guards + MOD-006 indexing. | Tolerable     |
| HAZ-034 | ARCH-006 + ARCH-001 | Search ranking poisoning via adversarial query/token distribution in local index. | NORMAL            | Low-quality or misleading foods dominate top search results.    | Serious  | Remote     | Tolerable   | REQ-010 ranking SLA with deterministic scoring; MOD-006 bounded weighting; SYS-012 anomaly monitoring.    | Tolerable     |
| HAZ-035 | ARCH-011 + ARCH-010 | Logging/tracing path records secret-bearing upstream headers.                     | NORMAL            | Security leakage into telemetry sink.                           | Critical | Remote     | Undesirable | REQ-IF-006 + REQ-030; MOD-010 redaction and MOD-011 log schema denylist for auth headers.                 | Tolerable     |

## Coverage Summary

| Metric                                        | Value  | Notes                                                                                     |
| --------------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| Total SYS components analyzed                 | 12     | `SYS-001`..`SYS-012` from `system-design.md`.                                             |
| Total SYS-level hazards (HAZ-001..HAZ-030)    | 30     | Sequential, never renumbered.                                                             |
| Architecture-level hazards (HAZ-031..HAZ-035) | 5      | Appended via Progressive Deepening from `architecture-design.md`.                         |
| **Total hazards**                             | **35** | Range `HAZ-001`..`HAZ-035`.                                                               |
| Hazards at `Unacceptable` risk level          | 0      | All hazards mitigated to `Undesirable` or lower before this register was finalized.       |
| Hazards at `Undesirable` risk level           | 23     | All carry explicit mitigation; residual-risk acceptance recorded inline.                  |
| Hazards at `Tolerable` risk level             | 12     | Accepted as-is or accepted after mitigation.                                              |
| Hazards at `Acceptable` risk level            | 0      | None in this register.                                                                    |
| Mitigations referencing `REQ-NNN`             | ✓      | Every hazard mitigation cites at least one `REQ-NNN` or `SYS/ARCH/MOD` companion control. |
| `[HUMAN REVIEW REQUIRED]` flags               | 0      | None — every SYS has at least one realistic failure mode.                                 |

## Domain Note (non-regulated)

This analysis intentionally omits regulated-domain artifacts (ASIL classification, DAL assignment, MC/DC obligations, IEC 62304 software safety classification). `v-model-config.yml` declares `domain: ''` (consumer SaaS); reintroduce regulated taxonomies only if Sous Chef enters a regulated domain. Severity is framed against user trust, data integrity, privacy, availability, and platform cost — the only failure axes that apply to a consumer recipe application.

## Glossary

| Term                      | Definition                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| FMEA                      | Failure Mode and Effects Analysis — structured enumeration of failure modes, effects, and mitigations per component.    |
| Hazard                    | A realistic failure mode whose effect, if unmitigated, would breach a system invariant (data integrity, privacy, etc.). |
| Operational state         | A system mode in which a hazard occurs (NORMAL, DEGRADED-USDA, RATE-LIMITED, BACKFILL-LAG, STALE-REFRESH-WINDOW).       |
| Risk control / mitigation | Existing design control (`REQ/SYS/ARCH/MOD`) that reduces hazard probability and/or impact.                             |
| Residual risk             | Remaining risk after listed mitigations are in place.                                                                   |
| Pending deduplication     | Mechanism preventing duplicate queueing for identical `fdcId` while fetch is in-flight.                                 |
| Stale refresh             | Background re-fetch cycle for foods older than freshness threshold.                                                     |
| Matrix H                  | Hazard Traceability matrix in `traceability-matrix.md` connecting hazards → controls → verification cases.              |
