# Hazard Analysis (FMEA): Public Creator Profiles

**Feature Branch**: `012-creator-profiles`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/012-creator-profiles/v-model/system-design.md`
**Standard**: General-Purpose FMEA (non-regulated software; `domain: ''`)

## Overview

This non-regulated FMEA evaluates failure modes across all system components (`SYS-001..SYS-011`) with emphasis on creator-profile-specific hazards: PII leak, impersonation, profile spam, content moderation evasion, follower-graph DoS, stale OAuth takeover, GDPR erasure gaps, and blocked-user circumvention.

## ID Schema

- **Hazard ID**: `HAZ-NNN`
- **Lineage**: Mitigations reference `REQ-NNN`, `SYS-NNN`, and `ARCH-NNN` for Matrix H traceability.

## Risk Matrix Definition

### Severity Scale

| Level        | Definition                                                                           |
| ------------ | ------------------------------------------------------------------------------------ |
| Catastrophic | Cross-tenant privacy/security breach, account takeover, or major compliance failure. |
| Critical     | Significant policy/legal breach or sustained core workflow outage.                   |
| Serious      | Recoverable but high-impact degradation.                                             |
| Minor        | Limited user-impact degradation.                                                     |
| Negligible   | Cosmetic issue without meaningful user/compliance impact.                            |

### Likelihood Scale

| Level    | Definition                                        |
| -------- | ------------------------------------------------- |
| Frequent | Expected repeatedly in normal operations.         |
| Possible | Plausible under realistic load/threat conditions. |
| Unlikely | Requires uncommon trigger or fault combination.   |
| Rare     | Highly improbable edge sequence.                  |

## Hazard Register

| Hazard ID | System Component | Failure Mode                                                          | Effect                                                                 | Severity     | Likelihood | Risk   | Mitigation Links                    |
| --------- | ---------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------ | ---------- | ------ | ----------------------------------- |
| HAZ-001   | SYS-001          | Handle normalization bug allows near-duplicate impersonation handles. | Creator impersonation and trust erosion.                               | Critical     | Possible   | High   | REQ-001, REQ-005, SYS-001, ARCH-002 |
| HAZ-002   | SYS-001          | Profile deactivation fails to hide public route cache.                | Suspended/deactivated profile remains publicly reachable.              | Serious      | Possible   | Medium | REQ-004, SYS-001, ARCH-003          |
| HAZ-003   | SYS-002          | Uniqueness race permits dual claim under concurrency.                 | Identity collision and account confusion.                              | Critical     | Unlikely   | High   | REQ-003, SYS-002, ARCH-002          |
| HAZ-004   | SYS-003          | PII fields accidentally serialized in public profile payload.         | Public PII leak on unauthenticated page.                               | Catastrophic | Unlikely   | High   | REQ-008, REQ-013, SYS-003, ARCH-004 |
| HAZ-005   | SYS-003          | Blocked/suspended state not reflected in read model.                  | Policy-breaching profile visibility.                                   | Critical     | Possible   | High   | REQ-014, REQ-018, SYS-003, ARCH-004 |
| HAZ-006   | SYS-004          | Idempotency key omission duplicates follow records.                   | Follower-count inflation and integrity drift.                          | Serious      | Possible   | Medium | REQ-009, SYS-004, ARCH-006          |
| HAZ-007   | SYS-004          | Follower-graph write amplification DoS under bot traffic.             | Service degradation and elevated infrastructure cost.                  | Critical     | Possible   | High   | REQ-009, REQ-018, SYS-004, ARCH-019 |
| HAZ-008   | SYS-005          | Feed fanout misses follow events after transient queue outage.        | Followers do not receive creator updates.                              | Serious      | Possible   | Medium | REQ-010, SYS-005, ARCH-008          |
| HAZ-009   | SYS-006          | Collection ownership validation bypass adds чужие private recipes.    | Unauthorized content exposure / attribution corruption.                | Critical     | Unlikely   | High   | REQ-011, SYS-006, ARCH-010          |
| HAZ-010   | SYS-006          | Collection spam creation floods discovery surface.                    | Profile spam and moderation burden increase.                           | Serious      | Possible   | Medium | REQ-011, REQ-018, SYS-006, ARCH-019 |
| HAZ-011   | SYS-007          | Widget response includes active session-dependent markup.             | Cross-site leakage and embed instability.                              | Serious      | Unlikely   | Medium | REQ-012, SYS-007, ARCH-011          |
| HAZ-012   | SYS-007          | CDN cache serves stale profile after erasure request.                 | GDPR right-to-erasure gap in externally embedded surfaces.             | Critical     | Possible   | High   | REQ-018, SYS-007, ARCH-017          |
| HAZ-013   | SYS-008          | Analytics snapshot job stores IP/user-level identifiers.              | Privacy policy violation and compliance risk.                          | Critical     | Unlikely   | High   | REQ-013, SYS-008, ARCH-012          |
| HAZ-014   | SYS-008          | Analytics pipeline lag presents misleading creator metrics.           | Creator decision quality degradation.                                  | Minor        | Possible   | Low    | REQ-013, SYS-008, ARCH-012          |
| HAZ-015   | SYS-009          | Suspension workflow fails to block new follows.                       | Moderation evasion by sanctioned profile.                              | Critical     | Possible   | High   | REQ-014, SYS-009, ARCH-014          |
| HAZ-016   | SYS-009          | DMCA queue backlog breaches 24h takedown SLA.                         | Legal/compliance exposure.                                             | Critical     | Possible   | High   | REQ-015, SYS-009, ARCH-014          |
| HAZ-017   | SYS-010          | Delegation adapter accidentally processes billing logic locally.      | Ownership boundary violation and financial inconsistency.              | Serious      | Unlikely   | Medium | REQ-016, SYS-010, ARCH-015          |
| HAZ-018   | SYS-010          | Downstream 010 outage causes unhandled delegation errors.             | Creator monetization surface unavailable without graceful degradation. | Serious      | Possible   | Medium | REQ-016, SYS-010, ARCH-015          |
| HAZ-019   | SYS-011          | Stale OAuth token accepted for sensitive profile mutation.            | Profile takeover via stale session replay.                             | Catastrophic | Possible   | High   | REQ-017, SYS-011, ARCH-016          |
| HAZ-020   | SYS-011          | Blocked-user circumvention via alternate follow endpoint path.        | Harassment/control bypass on creator surface.                          | Critical     | Possible   | High   | REQ-018, SYS-011, ARCH-018          |
| HAZ-021   | SYS-011          | Erasure orchestrator removes profile but leaves avatar object.        | Incomplete GDPR right-to-erasure fulfillment.                          | Critical     | Possible   | High   | REQ-018, SYS-011, ARCH-017          |
| HAZ-022   | SYS-011          | Abuse heuristics under-detect profile spam campaigns.                 | Discovery quality collapse and moderation overload.                    | Serious      | Possible   | Medium | REQ-018, SYS-011, ARCH-019          |
| HAZ-023   | SYS-011          | Audit events dropped during policy-deny path.                         | Forensic gap for abuse and compliance incidents.                       | Serious      | Unlikely   | Medium | REQ-017, REQ-018, SYS-011, ARCH-020 |
| HAZ-024   | SYS-011          | PII appears in structured error logs.                                 | Secondary PII leak through observability channel.                      | Critical     | Possible   | High   | REQ-013, REQ-018, SYS-011, ARCH-020 |

## Coverage Summary

- System components covered: 11 / 11
- Total hazards: 24
- Highest-risk themes explicitly covered: impersonation, PII leak, moderation evasion, follower-graph DoS, stale OAuth takeover, GDPR erasure gaps, blocked-user circumvention.
