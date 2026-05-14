# Hazard Analysis (FMEA): Grocery Lists & Online Ordering

**Feature Branch**: `007-grocery-lists`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/007-grocery-lists/v-model/system-design.md`
**Standard**: General-Purpose FMEA (non-regulated software; `domain: ''` in `v-model-config.yml`)

## Overview

This document presents the Failure Mode and Effects Analysis (FMEA) for the **Grocery Lists & Online Ordering** feature. Every system component (`SYS-001`..`SYS-006`) from `system-design.md` is assessed for realistic failure modes. Each hazard receives a unique `HAZ-NNN` identifier and is linked to risk-control measures (`REQ-NNN` / `SYS-NNN` / `ARCH-NNN`), enabling the traceability chain: Hazard → Mitigation → Requirement → Test Case (Matrix H in `traceability-matrix.md`).

**Non-regulated context.** Sous Chef is a consumer grocery workflow application. There are no life-safety, vehicle-control, medical-device, or aviation-control concerns. Severity is measured against **user trust, data integrity, privacy, availability, ordering correctness, and platform cost** — not personal injury. Safety-critical taxonomies (ISO 26262 ASIL, DO-178C DAL, IEC 62304) are intentionally **not** applied; `v-model-config.yml` sets `domain: ''`.

## ID Schema

- **Hazard ID**: `HAZ-{NNN}` — 3-digit zero-padded, sequential (HAZ-001, HAZ-002, ...). Never renumbered.
- **Lineage**: From any `HAZ-NNN`, the Mitigation column lists `REQ-NNN`, `SYS-NNN`, and (where useful) `ARCH-NNN` references. The full chain to verification test cases (`ATP-NNN`, `STP-NNN`, `ITP-NNN`, `UTP-NNN`) lives in `traceability-matrix.md` (Matrix H — Hazard Traceability).

## Risk Matrix Definition

### Severity Scale (consumer SaaS — grocery workflow)

| Level        | Definition                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Catastrophic | Cross-tenant data leak, broad unauthorized list/order access, or persistent loss of canonical grocery/order state across households. |
| Critical     | Single-household privacy breach, unrecoverable grocery-state loss, or incorrect paid order submission with no remediation path.      |
| Serious      | Recoverable ordering/list correctness failure with user-visible remediation (retry, reconcile, restore).                             |
| Minor        | User-visible inconvenience, transient mismatch, or degraded UX with straightforward recovery.                                        |
| Negligible   | Cosmetic-only issue (copy, telemetry noise, non-blocking label drift).                                                               |

### Likelihood Scale

| Level      | Definition                                                                   |
| ---------- | ---------------------------------------------------------------------------- |
| Frequent   | Expected in normal operation unless controlled.                              |
| Probable   | Repeats under common edge conditions (multi-device edits, provider latency). |
| Occasional | Seen intermittently under realistic production conditions.                   |
| Remote     | Requires uncommon preconditions or correlated failures.                      |
| Improbable | Very unlikely; requires multiple independent control failures.               |

### Risk Level Matrix

| Severity \ Likelihood | Frequent    | Probable    | Occasional  | Remote      | Improbable |
| --------------------- | ----------- | ----------- | ----------- | ----------- | ---------- |
| Catastrophic          | Intolerable | Intolerable | Undesirable | Undesirable | Tolerable  |
| Critical              | Intolerable | Undesirable | Undesirable | Tolerable   | Tolerable  |
| Serious               | Undesirable | Undesirable | Tolerable   | Tolerable   | Acceptable |
| Minor                 | Tolerable   | Tolerable   | Tolerable   | Acceptable  | Acceptable |
| Negligible            | Acceptable  | Acceptable  | Acceptable  | Acceptable  | Acceptable |

## Operational States

- `NORMAL`: Online, authenticated, steady-state list generation/editing/ordering.
- `CONCURRENT-SESSION`: Same list edited from multiple sessions/devices.
- `OFFLINE-CLIENT`: Local interaction while connectivity is unavailable.
- `ORDERING`: Store mapping and order submission pipeline active.
- `DEPENDENCY-DEGRADED`: Upstream provider unavailable/slow (store API, meal-plan/recipe/USDA, push).

## Hazard Register (FMEA)

> One or more `HAZ-NNN` per `SYS-NNN`. Mitigations cite existing `REQ-NNN`, `SYS-NNN`, or `ARCH-NNN` identifiers from this feature.

### SYS-001 — Grocery List Generator

| HAZ ID  | Component | Failure Mode                                                                                                                  | Operational State | Effect                                                                                | Severity | Likelihood | Risk Level | Mitigation                                                            | Residual Risk |
| ------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------- | -------- | ---------- | ---------- | --------------------------------------------------------------------- | ------------- |
| HAZ-001 | SYS-001   | Unit aggregation error when equivalent measures are combined incorrectly (for example `1 cup` + `8 oz`) during normalization. | NORMAL            | Incorrect total quantity in consolidated list; order over/under-purchase risk.        | Serious  | Occasional | Tolerable  | REQ-002, REQ-IF-003, REQ-CN-003, SYS-001, SYS-006, ARCH-003, ARCH-014 | Tolerable     |
| HAZ-002 | SYS-001   | Ingredient dedup false-merge merges semantically different items (for example green onion vs yellow onion).                   | NORMAL            | User loses ingredient specificity; wrong products selected downstream.                | Serious  | Occasional | Tolerable  | REQ-002, REQ-IF-003, SYS-001, SYS-006, ARCH-003, ARCH-002             | Tolerable     |
| HAZ-003 | SYS-001   | List size overflow on very large plans exceeds processing envelope and fails before persistence.                              | NORMAL            | Grocery list generation fails or times out; user cannot proceed to shopping workflow. | Serious  | Remote     | Tolerable  | REQ-003, REQ-009, SYS-001, ARCH-002, ARCH-003                         | Tolerable     |
| HAZ-004 | SYS-001   | Store-section grouping drift (aisle/category classification stale) produces unstable grouping across refreshes.               | NORMAL            | Navigation friction and trust erosion; users miss items in store.                     | Minor    | Probable   | Tolerable  | REQ-001, REQ-IF-003, SYS-001, SYS-006, ARCH-003                       | Acceptable    |

### SYS-002 — List State Manager

| HAZ ID  | Component | Failure Mode                                                                                         | Operational State  | Effect                                                                  | Severity | Likelihood | Risk Level  | Mitigation                                                      | Residual Risk |
| ------- | --------- | ---------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------- | -------- | ---------- | ----------- | --------------------------------------------------------------- | ------------- |
| HAZ-005 | SYS-002   | Concurrent edit race causes stale write to overwrite newer item state.                               | CONCURRENT-SESSION | Item flags/quantities regress; household sees conflicting list state.   | Serious  | Probable   | Undesirable | REQ-004, REQ-005, SYS-002, ARCH-005                             | Tolerable     |
| HAZ-006 | SYS-002   | Offline check-off actions are lost on reconnect due to failed reconciliation or conflict resolution. | OFFLINE-CLIENT     | User must re-check items manually; duplicate purchase risk.             | Serious  | Occasional | Tolerable   | REQ-004, REQ-005, REQ-011, SYS-002, ARCH-005, ARCH-006          | Tolerable     |
| HAZ-007 | SYS-002   | Deleted-item undo failure prevents restore within expected undo window.                              | NORMAL             | User must re-enter item manually; workflow interruption and trust loss. | Minor    | Occasional | Tolerable   | REQ-004, REQ-011, SYS-002, ARCH-005, ARCH-006                   | Acceptable    |
| HAZ-008 | SYS-002   | List templates desynchronize and apply outdated template snapshot after source template changed.     | CONCURRENT-SESSION | Generated list reflects stale defaults; incorrect shopping intent.      | Serious  | Remote     | Tolerable   | REQ-001, REQ-011, SYS-002, ARCH-005, ARCH-006                   | Tolerable     |
| HAZ-009 | SYS-002   | Manual-add typo correction resolves to wrong canonical item and silently changes intent.             | NORMAL             | Wrong ingredient appears in list; ordering mismatch risk.               | Minor    | Probable   | Tolerable   | REQ-001, REQ-002, REQ-011, SYS-002, SYS-001, ARCH-005, ARCH-003 | Acceptable    |

### SYS-003 — Online Ordering Orchestrator

| HAZ ID  | Component | Failure Mode                                                                               | Operational State | Effect                                                                           | Severity | Likelihood | Risk Level | Mitigation                                                   | Residual Risk |
| ------- | --------- | ------------------------------------------------------------------------------------------ | ----------------- | -------------------------------------------------------------------------------- | -------- | ---------- | ---------- | ------------------------------------------------------------ | ------------- |
| HAZ-010 | SYS-003   | Outage handling path drops local order intent when grocery store API returns 5xx/timeouts. | ORDERING          | User must rebuild cart/list mapping after retry; potential data loss perception. | Serious  | Occasional | Tolerable  | REQ-010, REQ-IF-001, SYS-003, SYS-006, ARCH-008, ARCH-014    | Tolerable     |
| HAZ-011 | SYS-003   | Premium gate enforcement bypass allows free-tier order submission to third-party APIs.     | ORDERING          | Unauthorized premium feature use and billing leakage.                            | Critical | Remote     | Tolerable  | REQ-CN-002, REQ-IF-006, SYS-003, SYS-005, ARCH-013, ARCH-008 | Tolerable     |
| HAZ-012 | SYS-003   | Duplicate order submit on client retry lacks idempotency guard.                            | ORDERING          | Double charge or duplicate carts at provider.                                    | Serious  | Occasional | Tolerable  | REQ-008, REQ-010, SYS-003, ARCH-008, ARCH-007                | Tolerable     |

### SYS-004 — Store Configuration Manager

| HAZ ID  | Component | Failure Mode                                                                                                             | Operational State  | Effect                                                                      | Severity | Likelihood | Risk Level | Mitigation                                                   | Residual Risk |
| ------- | --------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------ | --------------------------------------------------------------------------- | -------- | ---------- | ---------- | ------------------------------------------------------------ | ------------- |
| HAZ-013 | SYS-004   | Store setup wizard loops or exits without persisted connection details.                                                  | NORMAL             | User cannot complete ordering setup; repeated onboarding friction.          | Minor    | Occasional | Tolerable  | REQ-006, REQ-007, SYS-004, ARCH-009, ARCH-010                | Acceptable    |
| HAZ-014 | SYS-004   | Share invite expiry timestamp is mis-evaluated (timezone/clock skew), allowing invalid accept or rejecting valid invite. | NORMAL             | Collaboration setup fails unpredictably; user confusion and support burden. | Minor    | Occasional | Tolerable  | REQ-011, REQ-005, SYS-004, SYS-002, ARCH-010, ARCH-006       | Acceptable    |
| HAZ-015 | SYS-004   | Household member removed mid-session retains stale writable list session until token refresh.                            | CONCURRENT-SESSION | Ex-member can continue list mutations briefly after revocation.             | Critical | Remote     | Tolerable  | REQ-CN-001, REQ-IF-005, SYS-004, SYS-005, ARCH-012, ARCH-010 | Tolerable     |

### SYS-005 — Auth & Subscription Enforcer

| HAZ ID  | Component | Failure Mode                                                                                                       | Operational State   | Effect                                                                      | Severity     | Likelihood | Risk Level  | Mitigation                                                              | Residual Risk |
| ------- | --------- | ------------------------------------------------------------------------------------------------------------------ | ------------------- | --------------------------------------------------------------------------- | ------------ | ---------- | ----------- | ----------------------------------------------------------------------- | ------------- |
| HAZ-016 | SYS-005   | Shared-list permission leak from missing ownership/household check on list mutation endpoint.                      | NORMAL              | Unauthorized user reads/writes another household grocery list.              | Catastrophic | Remote     | Undesirable | REQ-CN-001, REQ-IF-005, SYS-005, ARCH-012, ARCH-001, ARCH-004, ARCH-007 | Tolerable     |
| HAZ-017 | SYS-005   | Subscription status cache staleness blocks active premium user or permits expired premium user.                    | ORDERING            | Incorrect entitlement decisions at checkout.                                | Serious      | Occasional | Tolerable   | REQ-CN-002, REQ-IF-006, SYS-005, ARCH-013, ARCH-008                     | Tolerable     |
| HAZ-018 | SYS-005   | Push notification delivery failure on share/collaboration events leaves participants with stale local assumptions. | DEPENDENCY-DEGRADED | Delayed awareness of edits/ownership changes; increased conflict frequency. | Minor        | Probable   | Tolerable   | REQ-011, REQ-IF-005, SYS-005, SYS-006, ARCH-012, ARCH-014               | Acceptable    |

### SYS-006 — External Dependency Adapters

| HAZ ID  | Component | Failure Mode                                                                                                 | Operational State   | Effect                                                                | Severity | Likelihood | Risk Level | Mitigation                                                            | Residual Risk |
| ------- | --------- | ------------------------------------------------------------------------------------------------------------ | ------------------- | --------------------------------------------------------------------- | -------- | ---------- | ---------- | --------------------------------------------------------------------- | ------------- |
| HAZ-019 | SYS-006   | USDA normalization adapter returns partial or inconsistent unit mappings.                                    | DEPENDENCY-DEGRADED | Aggregation quality degrades; duplicate and quantity errors increase. | Serious  | Occasional | Tolerable  | REQ-IF-003, REQ-002, SYS-006, SYS-001, ARCH-014, ARCH-003             | Tolerable     |
| HAZ-020 | SYS-006   | Meal-plan/recipe adapter timeout causes generator to fail with opaque error rather than actionable guidance. | DEPENDENCY-DEGRADED | User cannot generate list and lacks clear remediation path.           | Serious  | Occasional | Tolerable  | REQ-IF-002, REQ-IF-004, REQ-009, SYS-006, SYS-001, ARCH-014, ARCH-002 | Tolerable     |
| HAZ-021 | SYS-006   | Grocery provider API schema drift mis-maps product substitutions and packaging sizes.                        | ORDERING            | Incorrect product mapping and order content mismatch.                 | Serious  | Remote     | Tolerable  | REQ-IF-001, REQ-008, REQ-010, SYS-006, SYS-003, ARCH-014, ARCH-008    | Tolerable     |

## Progressive Deepening (Architecture-Level)

- Service-level concurrency controls for `ARCH-005` and persistence conflict handling for list item state updates are a primary control for HAZ-005/HAZ-006.
- Canonical ingredient identity and conversion confidence surfaced from `ARCH-003` and `ARCH-014` are primary controls for HAZ-001/HAZ-002/HAZ-019.
- Authorization and entitlement checks in `ARCH-012` and `ARCH-013` are primary controls for HAZ-011/HAZ-015/HAZ-016/HAZ-017.

## Coverage Summary

- System components covered: `SYS-001`..`SYS-006` (6/6).
- Hazards recorded: `HAZ-001`..`HAZ-021` (21 total).
- High-severity hazards (Catastrophic/Critical): HAZ-011, HAZ-015, HAZ-016.
- All hazards map to existing requirement/component/module identifiers from this feature.

## Frozen-Pending-Resolution Tracker

No `[FROZEN-PENDING-RESOLUTION]` markers are present in `specs/007-grocery-lists/v-model/system-design.md` at the time of authoring.

## Domain Note (non-regulated)

This artifact is maintained under the non-regulated profile. Hazard scoring and mitigations support product quality, privacy, and reliability decisions; they do not claim compliance with regulated safety taxonomies.

## Glossary

- **Dedup false-merge**: Incorrectly combining distinct ingredients into one line item.
- **Grouping drift**: Store aisle/category assignment changing unexpectedly between refreshes.
- **Stale write**: Update based on outdated state that overwrites a newer value.
- **Idempotency**: Property that repeated identical requests do not create duplicate side effects.
