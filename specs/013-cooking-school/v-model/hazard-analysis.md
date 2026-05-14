# Hazard Analysis (FMEA): Cooking School (Video Learning Platform)

**Feature Branch**: `013-cooking-school`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/013-cooking-school/v-model/system-design.md`
**Standard**: General-Purpose FMEA (non-regulated software; `domain: `)

## Overview

This FMEA assesses every system component (`SYS-001..SYS-012`) for operational, policy, monetization, and data-governance failures in the cooking school domain.

## ID Schema

- **Hazard ID**: `HAZ-NNN` sequential identifiers.
- **Lineage**: Hazard -> Mitigation controls (`REQ/SYS/ARCH`) -> V-model test artifacts via traceability matrix.

## Risk Matrix Definition

### Severity Scale

| Level    | Definition                                                                    |
| -------- | ----------------------------------------------------------------------------- |
| Critical | Security/policy breach, major financial/legal impact, or severe trust damage. |
| Serious  | Significant functional degradation, recoverable data/financial impact.        |
| Minor    | Limited operational disruption with low user harm.                            |

### Likelihood Scale

| Level      | Definition                                            |
| ---------- | ----------------------------------------------------- |
| Probable   | Expected multiple times per quarter without controls. |
| Occasional | Can occur in normal operation with edge conditions.   |
| Remote     | Unlikely but credible; requires compounded faults.    |

## Hazard Register

| Hazard ID | System Component | Failure Mode                                                         | Effects                                                 | Severity | Likelihood | Risk   | Mitigation                                                                  | Traceability                                  |
| --------- | ---------------- | -------------------------------------------------------------------- | ------------------------------------------------------- | -------- | ---------- | ------ | --------------------------------------------------------------------------- | --------------------------------------------- |
| HAZ-001   | SYS-001          | Instructor identity spoofing through forged role claim               | Unauthorized educator actions and fraudulent publishing | Critical | Occasional | High   | JWT signature + issuer/audience validation; role claims from trusted source | REQ-020, SYS-001, ARCH-001                    |
| HAZ-002   | SYS-004          | Video stream DRM bypass via replayed playback URL                    | Paid lesson piracy and revenue loss                     | Critical | Probable   | High   | Short-lived signed playback tokens and origin checks                        | REQ-028, REQ-004, SYS-004, ARCH-004           |
| HAZ-003   | SYS-010          | Course content piracy not actioned after DMCA report                 | Legal exposure and creator trust loss                   | Critical | Occasional | High   | Compliance case manager SLA and takedown workflow                           | REQ-022, SYS-010, ARCH-013                    |
| HAZ-004   | SYS-011          | Payment dispute mishandling and unresolved refund state              | Chargeback risk and user dissatisfaction                | Serious  | Occasional | Medium | Dispute workflow with auditable states and payout adjustment adapter        | REQ-023, REQ-027, SYS-011, ARCH-015, ARCH-016 |
| HAZ-005   | SYS-008          | Student progress data loss after write failure                       | Learner completion history corruption                   | Serious  | Occasional | Medium | Idempotent progress writes plus backup/restore capability                   | REQ-024, REQ-009, SYS-008, SYS-012            |
| HAZ-006   | SYS-006          | Revenue split calculated with wrong educator tier                    | Incorrect payouts and contractual disputes              | Serious  | Remote     | Medium | Tier lookup from 010 with persisted enrollment snapshot                     | REQ-018, REQ-019, SYS-006, ARCH-007, ARCH-019 |
| HAZ-007   | SYS-010          | Certificate forgery claim despite no certificate feature             | User deception and support overhead                     | Minor    | Occasional | Low    | Scope guard denies certificate issuance APIs and UI pathways                | REQ-021, SYS-012, ARCH-020                    |
| HAZ-008   | SYS-010          | Age-restricted content leak to underage account                      | Policy and trust violations                             | Critical | Occasional | High   | Age gating policy filter prior to playback entitlement                      | REQ-025, SYS-010, ARCH-014                    |
| HAZ-009   | SYS-010          | Knife/fire-safety disclaimer omission on tagged lesson               | Unsafe learner behavior prompted by missing warning     | Serious  | Occasional | Medium | Mandatory disclaimer acknowledgment before playback token issuance          | REQ-026, SYS-010, ARCH-014                    |
| HAZ-010   | SYS-006          | Refund policy ambiguity at purchase time                             | Escalated disputes and inconsistent operator decisions  | Serious  | Probable   | High   | Display policy pre-purchase and persist immutable policy snapshot           | REQ-027, SYS-006, ARCH-019                    |
| HAZ-011   | SYS-003          | Transcode job stuck without operator visibility                      | Lesson unavailable and delayed publish windows          | Serious  | Occasional | Medium | Job state timeout detection and retry escalation                            | REQ-003, SYS-003, ARCH-003                    |
| HAZ-012   | SYS-004          | Preview entitlement misclassification exposes paid lessons           | Unauthorized access to non-preview content              | Critical | Remote     | Medium | Separate preview/public path and enrolled signed path checks                | REQ-005, REQ-008, SYS-004, ARCH-004           |
| HAZ-013   | SYS-007          | AI draft called on unauthorized or unlinked recipe                   | Privacy breach and invalid content generation           | Serious  | Remote     | Medium | Recipe ownership validation before AI callout                               | REQ-013, REQ-014, SYS-007, ARCH-009           |
| HAZ-014   | SYS-009          | Educator dashboard revenue stale or inconsistent                     | Incorrect business decisions by educators               | Minor    | Occasional | Low    | Metrics recomputation and event-lag monitoring                              | REQ-012, SYS-009, ARCH-012                    |
| HAZ-015   | SYS-002          | Lesson reorder race causes incorrect pedagogical sequence            | Learner confusion and mismatch with educator intent     | Minor    | Occasional | Low    | Optimistic concurrency and last-write conflict handling                     | REQ-016, SYS-002, ARCH-002                    |
| HAZ-016   | SYS-012          | Backup snapshot corruption prevents restore                          | Extended operational outage and history loss            | Critical | Remote     | Medium | Periodic restore drills and checksum verification                           | REQ-024, SYS-012, ARCH-018                    |
| HAZ-017   | SYS-001          | API versioning bypass through non-/api/v1 endpoint                   | Inconsistent behavior and security policy gaps          | Serious  | Remote     | Low    | Gateway route enforcement and endpoint inventory checks                     | REQ-021, SYS-001, ARCH-001                    |
| HAZ-018   | SYS-011          | Payout adjustment applied twice during concurrent dispute processing | Financial overcorrection and accounting drift           | Serious  | Remote     | Medium | Idempotency keys on dispute adjustment application                          | REQ-023, SYS-011, ARCH-016                    |

## Component Coverage

| SYS ID  | Hazard Coverage                                 |
| ------- | ----------------------------------------------- |
| SYS-001 | HAZ-001, HAZ-017                                |
| SYS-002 | HAZ-015                                         |
| SYS-003 | HAZ-011                                         |
| SYS-004 | HAZ-002, HAZ-012                                |
| SYS-005 | (covered indirectly via discovery dependencies) |
| SYS-006 | HAZ-006, HAZ-010                                |
| SYS-007 | HAZ-013                                         |
| SYS-008 | HAZ-005                                         |
| SYS-009 | HAZ-014                                         |
| SYS-010 | HAZ-003, HAZ-008, HAZ-009                       |
| SYS-011 | HAZ-004, HAZ-018                                |
| SYS-012 | HAZ-007, HAZ-016                                |

---

**Total Hazards**: 18
**Risk Distribution**: High: 5 | Medium: 10 | Low: 3
