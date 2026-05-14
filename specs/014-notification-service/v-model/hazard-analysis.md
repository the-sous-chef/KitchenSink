# Hazard Analysis (FMEA): Notification Service

**Feature Branch**: `014-notification-service`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/014-notification-service/v-model/system-design.md`
**Standard**: General-Purpose FMEA (non-regulated software; `domain: ''`)

## Overview

This FMEA evaluates each `SYS-NNN` component for realistic failure modes impacting trust, privacy, availability, routing correctness, and operational resilience in a shared notification platform.

## ID Schema

- **Hazard ID**: `HAZ-{NNN}` sequential and never renumbered.
- **Mitigation** references `REQ-NNN` / `SYS-NNN` controls for matrix lineage.

## Risk Matrix Definition

### Severity Scale (consumer SaaS)

| Level        | Definition                                                       |
| ------------ | ---------------------------------------------------------------- |
| Catastrophic | Broad cross-tenant leak or prolonged platform outage.            |
| Critical     | Severe privacy/security/availability degradation for many users. |
| Serious      | Significant but recoverable delivery or operability degradation. |
| Minor        | Limited user-impacting defect with workaround.                   |
| Negligible   | Cosmetic or low-impact operational noise.                        |

### Likelihood Scale

| Level      | Definition                                   |
| ---------- | -------------------------------------------- |
| Frequent   | Expected repeatedly under normal operations. |
| Probable   | Likely to occur occasionally.                |
| Occasional | Plausible but intermittent.                  |
| Remote     | Unlikely with current controls.              |
| Improbable | Highly unlikely edge condition.              |

### Risk Level Matrix

| Severity \ Likelihood | Frequent    | Probable    | Occasional  | Remote      | Improbable |
| --------------------- | ----------- | ----------- | ----------- | ----------- | ---------- |
| Catastrophic          | Intolerable | Intolerable | Undesirable | Undesirable | Tolerable  |
| Critical              | Intolerable | Undesirable | Undesirable | Tolerable   | Tolerable  |
| Serious               | Undesirable | Undesirable | Tolerable   | Tolerable   | Acceptable |
| Minor                 | Tolerable   | Tolerable   | Acceptable  | Acceptable  | Acceptable |
| Negligible            | Acceptable  | Acceptable  | Acceptable  | Acceptable  | Acceptable |

## Operational States

- `NORMAL` — steady publish/subscribe operations.
- `RECONNECT` — subscriber reconnect and backlog replay.
- `DEGRADED` — partial dependency outage or elevated retries.
- `INCIDENT` — high-risk security/privacy or systemic failure condition.

## Hazard Register (FMEA)

> One or more hazards per SYS. Required notification-service themes are explicitly included.

### SYS-001 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                      | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level  | Mitigation                         | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ----------- | ---------------------------------- | ------------- |
| HAZ-001 | SYS-001   | Notification storm/DoS overwhelms publish ingress and degrades unrelated traffic. | INCIDENT          | Delivery privacy/integrity/availability objective is violated for affected audience. | Critical | Occasional | Undesirable | REQ-019, REQ-027, SYS-019, SYS-027 | Tolerable     |

### SYS-002 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                                     | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | ------------------------------------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-002 | SYS-002   | Opt-out/policy bypass causes delivery where suppression should apply in future preference modes. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-002, SYS-002 | Tolerable     |

### SYS-003 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                       | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | ------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-003 | SYS-003   | Push-token/session token leak exposes recipient endpoint metadata. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-003, SYS-003 | Tolerable     |

### SYS-004 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                        | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level  | Mitigation       | Residual Risk |
| ------- | --------- | ----------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ----------- | ---------------- | ------------- |
| HAZ-004 | SYS-004   | Quiet-hours violation delivers time-sensitive notifications during blocked windows. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Serious  | Occasional | Undesirable | REQ-004, SYS-004 | Tolerable     |

### SYS-005 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                         | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level  | Mitigation       | Residual Risk |
| ------- | --------- | -------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ----------- | ---------------- | ------------- |
| HAZ-005 | SYS-005   | Deduplication failure causes duplicate deliveries and user distrust. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Serious  | Occasional | Undesirable | REQ-005, SYS-005 | Tolerable     |

### SYS-006 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level  | Mitigation                | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ----------- | ------------------------- | ------------- |
| HAZ-006 | SYS-006   | Cross-tenant message leak routes payload to unauthorized tenant/user scope. | INCIDENT          | Delivery privacy/integrity/availability objective is violated for affected audience. | Critical | Occasional | Undesirable | REQ-005, REQ-021, SYS-006 | Tolerable     |

### SYS-007 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                             | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level  | Mitigation       | Residual Risk |
| ------- | --------- | ------------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ----------- | ---------------- | ------------- |
| HAZ-007 | SYS-007   | Retry amplification creates cascading queue pressure and repeated sends. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Serious  | Occasional | Undesirable | REQ-007, SYS-007 | Tolerable     |

### SYS-008 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                 | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level  | Mitigation       | Residual Risk |
| ------- | --------- | ---------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ----------- | ---------------- | ------------- |
| HAZ-008 | SYS-008   | Expired-token cascade triggers broad subscribe failures after auth rotation. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Serious  | Occasional | Undesirable | REQ-008, SYS-008 | Tolerable     |

### SYS-009 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                               | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level  | Mitigation       | Residual Risk |
| ------- | --------- | -------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ----------- | ---------------- | ------------- |
| HAZ-009 | SYS-009   | Locale fallback corruption renders malformed/misleading localized content. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Serious  | Occasional | Undesirable | REQ-009, SYS-009 | Tolerable     |

### SYS-010 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                        | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level  | Mitigation       | Residual Risk |
| ------- | --------- | ------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ----------- | ---------------- | ------------- |
| HAZ-010 | SYS-010   | Time-zone scheduling drift delivers at wrong local wall-clock time. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Serious  | Occasional | Undesirable | REQ-010, SYS-010 | Tolerable     |

### SYS-011 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                  | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level  | Mitigation                         | Residual Risk |
| ------- | --------- | ----------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ----------- | ---------------------------------- | ------------- |
| HAZ-011 | SYS-011   | GDPR erasure miss leaves notification history artifacts after delete request. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Serious  | Occasional | Undesirable | REQ-012, REQ-031, SYS-012, SYS-031 | Tolerable     |

### SYS-012 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level  | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ----------- | ---------------- | ------------- |
| HAZ-012 | SYS-012   | APNs/FCM/SES/SNS vendor outage cascades into prolonged undelivered backlog. | INCIDENT          | Delivery privacy/integrity/availability objective is violated for affected audience. | Critical | Occasional | Undesirable | REQ-012, SYS-012 | Tolerable     |

### SYS-013 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                            | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level  | Mitigation                         | Residual Risk |
| ------- | --------- | ----------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ----------- | ---------------------------------- | ------------- |
| HAZ-013 | SYS-013   | End-to-end latency SLO breach exceeds 2s p95 for connected subscribers. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Serious  | Occasional | Undesirable | REQ-025, REQ-026, SYS-025, SYS-026 | Tolerable     |

### SYS-014 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-014 | SYS-014   | SYS-014 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-014, SYS-014 | Tolerable     |

### SYS-015 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-015 | SYS-015   | SYS-015 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-015, SYS-015 | Tolerable     |

### SYS-016 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-016 | SYS-016   | SYS-016 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-016, SYS-016 | Tolerable     |

### SYS-017 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-017 | SYS-017   | SYS-017 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-017, SYS-017 | Tolerable     |

### SYS-018 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-018 | SYS-018   | SYS-018 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-018, SYS-018 | Tolerable     |

### SYS-019 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-019 | SYS-019   | SYS-019 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-019, SYS-019 | Tolerable     |

### SYS-020 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-020 | SYS-020   | SYS-020 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-020, SYS-020 | Tolerable     |

### SYS-021 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-021 | SYS-021   | SYS-021 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-021, SYS-021 | Tolerable     |

### SYS-022 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-022 | SYS-022   | SYS-022 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-022, SYS-022 | Tolerable     |

### SYS-023 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-023 | SYS-023   | SYS-023 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-023, SYS-023 | Tolerable     |

### SYS-024 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-024 | SYS-024   | SYS-024 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-024, SYS-024 | Tolerable     |

### SYS-025 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-025 | SYS-025   | SYS-025 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-025, SYS-025 | Tolerable     |

### SYS-026 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-026 | SYS-026   | SYS-026 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-026, SYS-026 | Tolerable     |

### SYS-027 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-027 | SYS-027   | SYS-027 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-027, SYS-027 | Tolerable     |

### SYS-028 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-028 | SYS-028   | SYS-028 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-028, SYS-028 | Tolerable     |

### SYS-029 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-029 | SYS-029   | SYS-029 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-029, SYS-029 | Tolerable     |

### SYS-030 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-030 | SYS-030   | SYS-030 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-030, SYS-030 | Tolerable     |

### SYS-031 — Component Hazard Analysis

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                               | Severity | Likelihood | Risk Level | Mitigation       | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ | -------- | ---------- | ---------- | ---------------- | ------------- |
| HAZ-031 | SYS-031   | SYS-031 control path fails open/closed causing requirement non-conformance. | DEGRADED          | Delivery privacy/integrity/availability objective is violated for affected audience. | Minor    | Remote     | Tolerable  | REQ-031, SYS-031 | Tolerable     |

## Progressive Deepening (Architecture-Level)

| Deepening Target               | Trigger                                 | Planned Follow-up                                                        |
| ------------------------------ | --------------------------------------- | ------------------------------------------------------------------------ |
| ARCH-level retry topology      | Repeated retry-amplification incidents  | Add architecture-level throttling and retry budget hazard decomposition. |
| Registry governance controls   | High unregistered messageType rates     | Extend controls around registry ownership enforcement workflow.          |
| Dependency outage choreography | Multi-vendor outage simulation findings | Expand degraded-mode delivery policies and failover narratives.          |

## Coverage Summary

| Metric                  | Value          |
| ----------------------- | -------------- |
| Total SYS Components    | 31             |
| Total Hazards           | 31             |
| SYS with ≥1 Hazard      | 31 / 31 (100%) |
| Hazards with Mitigation | 31 / 31 (100%) |

## Frozen-Pending-Resolution Tracker

- None declared in 014 upstream sources.

## Domain Note (non-regulated)

General-purpose software FMEA is applied. No ISO 26262 / IEC 62304 / DO-178C safety sections are used.

## Glossary

| Term          | Definition                                                                            |
| ------------- | ------------------------------------------------------------------------------------- |
| Hazard        | Potential failure mode affecting platform trust, privacy, integrity, or availability. |
| Residual Risk | Remaining risk after mapped controls are applied.                                     |
