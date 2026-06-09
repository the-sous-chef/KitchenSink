# Hazard Analysis (FMEA): Nutrition Planning

**Feature Branch**: `009-nutrition-planning`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/009-nutrition-planning/v-model/system-design.md`
**Standard**: General-Purpose FMEA (non-regulated software; `domain: ''` in `v-model-config.yml`)

## Overview

This document presents the Failure Mode and Effects Analysis (FMEA) for the **Nutrition Planning** feature. Every system component (`SYS-001`..`SYS-014`) from `system-design.md` is assessed for realistic failure modes. Each hazard receives a unique `HAZ-NNN` identifier and is linked to risk-control measures (`REQ-NNN` / `SYS-NNN` / `ARCH-NNN`), enabling the traceability chain: Hazard → Mitigation → Requirement → Test Case (Matrix H in `traceability-matrix.md`).

**Non-regulated context.** Commise nutrition planning is a **consumer-grade wellness** feature, not a medical device and not a clinical decision-support system. Outputs are planning guidance only and explicitly **NOT medical advice**. Severity is measured against user trust, data integrity, privacy, availability, and subscription/business impact — not personal injury. Safety-critical taxonomies (ISO 26262 ASIL, DO-178C DAL, IEC 62304) are intentionally **not** applied; `v-model-config.yml` sets `domain: ''`.

## ID Schema

- **Hazard ID**: `HAZ-{NNN}` — 3-digit zero-padded, sequential (HAZ-001, HAZ-002, ...). Never renumbered.
- **Lineage**: From any `HAZ-NNN`, the Mitigation column lists `REQ-NNN`, `SYS-NNN`, and (where useful) `ARCH-NNN` references. The full chain to verification test cases (`ATP-NNN`, `STP-NNN`, `ITP-NNN`, `UTP-NNN`) lives in `traceability-matrix.md` (Matrix H — Hazard Traceability).

## Risk Matrix Definition

### Severity Scale (consumer nutrition planning)

| Level        | Definition                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Catastrophic | Cross-tenant health-profile/plan leak, broad unauthorized account access, or platform-wide outage of planning workflows.     |
| Critical     | Unauthorized trainer actions on client plans, sustained incorrect compliance guidance, or unrecoverable user plan data loss. |
| Serious      | Incorrect but recoverable calculations/recommendations that materially reduce user trust or require manual correction.       |
| Minor        | Localized inaccuracies, stale dashboard state, or transient workflow failures with retry/reload recovery.                    |
| Negligible   | Cosmetic-only issues with no decision impact.                                                                                |

### Likelihood Scale

| Level      | Definition                                                   |
| ---------- | ------------------------------------------------------------ |
| Frequent   | Expected regularly in normal usage without controls.         |
| Probable   | Likely to occur periodically under common conditions.        |
| Occasional | Plausible under specific but realistic edge conditions.      |
| Remote     | Unlikely; requires rare concurrency/input sequences.         |
| Improbable | Theoretically possible but not expected in normal operation. |

### Risk Acceptability Matrix

| Severity \ Likelihood | Frequent           | Probable           | Occasional         | Remote             | Improbable         |
| --------------------- | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ |
| Catastrophic          | Intolerable        | Intolerable        | Undesirable        | Undesirable        | Tolerable          |
| Critical              | Intolerable        | Undesirable        | Undesirable        | Tolerable          | Tolerable          |
| Serious               | Undesirable        | Undesirable        | Tolerable          | Tolerable          | Broadly Acceptable |
| Minor                 | Tolerable          | Tolerable          | Tolerable          | Broadly Acceptable | Broadly Acceptable |
| Negligible            | Broadly Acceptable | Broadly Acceptable | Broadly Acceptable | Broadly Acceptable | Broadly Acceptable |

## FMEA by System Component

### SYS-001 — Nutrition Plan Manager

| HAZ ID  | Component | Failure Mode                                                                            | Operational State | Effect                                                           | Severity | Likelihood | Risk Level  | Mitigation                                                                                                                                                              | Residual Risk      |
| ------- | --------- | --------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------- | -------- | ---------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HAZ-001 | SYS-001   | BMR/TDEE formula variant misapplied when creating a plan baseline.                      | NORMAL            | Daily calorie target systematically over/under-shoots user goal. | Serious  | Occasional | Tolerable   | REQ-001 input validation boundaries; REQ-NF-005 calculation-accuracy threshold; SYS-001 service-level deterministic formula selection; ARCH-002 formula strategy tests. | Broadly Acceptable |
| HAZ-002 | SYS-001   | Weekly target persistence rounds macros independently causing drift from calorie total. | NORMAL            | Macro target rounding errors produce inconsistent plan guidance. | Serious  | Probable   | Undesirable | REQ-001 canonical macro+calorie invariants; SYS-001 atomic save with normalized totals; ARCH-003 persistence constraints; REQ-NF-005 tolerance checks.                  | Tolerable          |

### SYS-002 — Meal Plan Linker

| HAZ ID  | Component | Failure Mode                                                                     | Operational State | Effect                                                                       | Severity | Likelihood | Risk Level | Mitigation                                                                                                                               | Residual Risk      |
| ------- | --------- | -------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------- | -------- | ---------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HAZ-003 | SYS-002   | Link operation points to stale or wrong meal-plan ID after rapid user switching. | NORMAL            | Compliance analysis evaluates the wrong meal plan.                           | Serious  | Occasional | Tolerable  | REQ-002 explicit link ownership checks; REQ-IF-001 existence validation through SYS-008; ARCH-006 idempotent link update flow.           | Broadly Acceptable |
| HAZ-004 | SYS-002   | Serving-size override metadata not versioned with link.                          | NORMAL            | Serving-size override drift causes mismatched intake vs target calculations. | Serious  | Occasional | Tolerable  | REQ-002 requires stable association semantics; SYS-002 stores serving context with link row; ARCH-007 revision fields and update guards. | Broadly Acceptable |

### SYS-003 — Compliance Analyser

| HAZ ID  | Component | Failure Mode                                                                     | Operational State | Effect                                                                   | Severity | Likelihood | Risk Level  | Mitigation                                                                                                                                                                | Residual Risk |
| ------- | --------- | -------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------ | -------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-005 | SYS-003   | Missing USDA match defaults to zero nutrition without a hard warning path.       | NORMAL            | Wrong nutrient calculation and misleading “on target” compliance output. | Critical | Occasional | Undesirable | REQ-NF-005 accuracy constraint; SYS-003 rejects silent-zero for unmatched foods; ARCH-008 emits unresolved-food markers; REQ-003 requires explicit gap/excess indicators. | Tolerable     |
| HAZ-006 | SYS-003   | Daily aggregate computed in UTC while user dashboard period uses local timezone. | NORMAL            | Daily-aggregate timezone bug shifts totals to adjacent day.              | Serious  | Probable   | Undesirable | REQ-003 period-consistent comparison; SYS-003 timezone-aware bucketization; ARCH-008 user-timezone context requirement.                                                   | Tolerable     |

### SYS-004 — Dashboard Visibility Controller

| HAZ ID  | Component | Failure Mode                                                                    | Operational State | Effect                                                         | Severity | Likelihood | Risk Level | Mitigation                                                                                                                                               | Residual Risk      |
| ------- | --------- | ------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------- | -------- | ---------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HAZ-007 | SYS-004   | Plan list cache key omits user timezone/day boundary state.                     | NORMAL            | Goal-tracking appears off-by-one day on dashboard trend cards. | Minor    | Probable   | Tolerable  | REQ-004 dashboard correctness requirement; SYS-004 cache key includes user/date context; ARCH-004 response contracts include localized date labels.      | Broadly Acceptable |
| HAZ-008 | SYS-004   | Deleted or revoked trainer-shared plan remains visible due to stale projection. | DEGRADED          | User acts on obsolete guidance and loses trust.                | Minor    | Occasional | Tolerable  | REQ-004 visibility synchronization; REQ-006 access-scope checks for trainer/client context; SYS-004 invalidates projections on consent/ownership events. | Broadly Acceptable |

### SYS-005 — Trainer-Client Plan Controller

| HAZ ID  | Component | Failure Mode                                            | Operational State | Effect                                                     | Severity | Likelihood | Risk Level  | Mitigation                                                                                                                              | Residual Risk      |
| ------- | --------- | ------------------------------------------------------- | ----------------- | ---------------------------------------------------------- | -------- | ---------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HAZ-009 | SYS-005   | Trainer role check bypass in one mutation endpoint.     | NORMAL            | Unauthorized plan creation/modification for another user.  | Critical | Remote     | Tolerable   | REQ-005 role authorization on every write path; REQ-006 read scope checks; ARCH-010 centralized guard chain with integration tests.     | Broadly Acceptable |
| HAZ-010 | SYS-005   | Controller allows update after consent revocation race. | NORMAL            | Trainer changes client plan after client withdrew consent. | Critical | Occasional | Undesirable | REQ-008 hard consent gate before each mutation; SYS-006 authoritative consent lookup; ARCH-011 transaction-level recheck before commit. | Tolerable          |

### SYS-006 — Consent Manager

| HAZ ID  | Component | Failure Mode                                                                        | Operational State | Effect                                                          | Severity | Likelihood | Risk Level | Mitigation                                                                                                                                                | Residual Risk      |
| ------- | --------- | ----------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------- | -------- | ---------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HAZ-011 | SYS-006   | Consent record write succeeds but read replica lags for authorization checks.       | NORMAL            | False denial or temporary false allow depending on path timing. | Serious  | Occasional | Tolerable  | REQ-008 explicit consent-state enforcement; SYS-006 read-your-write strategy for critical checks; ARCH-012 primary-read for mutation authorization paths. | Broadly Acceptable |
| HAZ-012 | SYS-006   | Consent scope stored too broadly (“all plans”) instead of per relationship/context. | NORMAL            | Over-permissioning of trainer actions across client contexts.   | Critical | Remote     | Tolerable  | REQ-008 scoped consent model; SYS-006 consent tuple keyed by trainerId+clientId+scope; ARCH-012 uniqueness + scope constraints.                           | Broadly Acceptable |

### SYS-007 — AI Recipe Swap Suggester

| HAZ ID  | Component | Failure Mode                                                                             | Operational State | Effect                                                                         | Severity | Likelihood | Risk Level  | Mitigation                                                                                                                                                                          | Residual Risk      |
| ------- | --------- | ---------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------ | -------- | ---------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HAZ-013 | SYS-007   | Allergy false-negative: substitute ingredient allergen not flagged in suggestion output. | NORMAL            | User receives unsafe suggestion for personal allergy profile.                  | Critical | Occasional | Undesirable | REQ-007 suggestion quality gate; SYS-007 allergen-aware candidate filtering; ARCH-014 hard block on unresolved allergen metadata; REQ-003 visible warning state if data incomplete. | Tolerable          |
| HAZ-014 | SYS-007   | Dietary-restriction filter bypass on one recommendation strategy branch.                 | NORMAL            | Suggestions violate user’s selected dietary restrictions (e.g., vegan, halal). | Serious  | Occasional | Tolerable   | REQ-007 restriction-constrained ranking; SYS-007 post-filter invariant check before response; ARCH-014 centralized policy filter across all strategies.                             | Broadly Acceptable |

### SYS-008 — Meal Planning Integration Adapter

| HAZ ID  | Component | Failure Mode                                                       | Operational State | Effect                                                        | Severity | Likelihood | Risk Level  | Mitigation                                                                                                                               | Residual Risk      |
| ------- | --------- | ------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------- | -------- | ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HAZ-015 | SYS-008   | Adapter accepts partial nutrient payload as complete meal total.   | NORMAL            | Compliance engine compares targets to incomplete intake data. | Serious  | Probable   | Undesirable | REQ-IF-001 integration contract validation; SYS-008 schema completeness checks; ARCH-015 fail-closed on missing nutrient fields.         | Tolerable          |
| HAZ-016 | SYS-008   | Retry policy duplicates retrieval side effects in upstream system. | DEGRADED          | Inconsistent link/reference state and noisy analytics.        | Minor    | Occasional | Tolerable   | REQ-CN-001 idempotent integration expectation; SYS-008 idempotency key propagation; ARCH-015 bounded retries with duplicate suppression. | Broadly Acceptable |

### SYS-009 — USDA Food Data Integration Adapter

| HAZ ID  | Component | Failure Mode                                                                | Operational State | Effect                                                                           | Severity | Likelihood | Risk Level  | Mitigation                                                                                                                                                           | Residual Risk      |
| ------- | --------- | --------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------- | -------- | ---------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HAZ-017 | SYS-009   | Unit conversion bug (g ↔ oz) loses precision and compounds over aggregates. | NORMAL            | Macro/micro totals drift enough to alter compliance status.                      | Serious  | Probable   | Undesirable | REQ-NF-005 accuracy tolerance; REQ-IF-002 canonical unit normalization contract; SYS-009 fixed-precision conversion library; ARCH-016 conversion regression tests.   | Tolerable          |
| HAZ-018 | SYS-009   | No robust fallback when USDA lookup misses branded/custom ingredient.       | NORMAL            | Missing USDA match propagates as under-counted nutrition in downstream analysis. | Serious  | Occasional | Tolerable   | REQ-IF-002 explicit “unmatched ingredient” response state; SYS-009 returns unresolved flag, not zero values; SYS-003 surfaces unresolved items in compliance output. | Broadly Acceptable |

### SYS-010 — Recipe App Integration Adapter

| HAZ ID  | Component | Failure Mode                                                           | Operational State | Effect                                                                        | Severity | Likelihood | Risk Level  | Mitigation                                                                                                                                           | Residual Risk      |
| ------- | --------- | ---------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------- | -------- | ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HAZ-019 | SYS-010   | Custom recipe nutrient metadata omitted for user-authored recipes.     | NORMAL            | Custom recipe nutrient missing causes false “gap”/“excess” recommendations.   | Serious  | Probable   | Undesirable | REQ-IF-003 complete recipe-nutrition contract; SYS-010 completeness validation before forwarding; ARCH-017 unresolved-nutrition marker passthrough.  | Tolerable          |
| HAZ-020 | SYS-010   | Ingredient-level allergen tags not propagated from recipe app payload. | NORMAL            | Downstream allergy checks in suggestion workflow can produce false negatives. | Critical | Remote     | Tolerable   | REQ-IF-003 requires allergen metadata fields when present; SYS-010 preserves allergen annotations; ARCH-017 contract tests for allergen passthrough. | Broadly Acceptable |

### SYS-011 — Auth Integration Adapter

| HAZ ID  | Component | Failure Mode                                                | Operational State | Effect                                                                                     | Severity     | Likelihood | Risk Level  | Mitigation                                                                                                                                           | Residual Risk |
| ------- | --------- | ----------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------ | ------------ | ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-021 | SYS-011   | Token audience/issuer misconfiguration accepts foreign JWT. | NORMAL            | Unauthorized principal can read or mutate nutrition plans.                                 | Catastrophic | Remote     | Undesirable | REQ-IF-004 strict JWT validation contract; SYS-011 issuer+audience+expiry checks; ARCH-018 hardened verification middleware.                         | Tolerable     |
| HAZ-022 | SYS-011   | Health-profile attributes logged in auth debug traces.      | NORMAL            | Health-data PII leak in logs in a consumer app context (non-clinical; not medical advice). | Critical     | Occasional | Undesirable | REQ-IF-004 minimal-claims principle; REQ-008 privacy-safe consent workflow; SYS-011 PII redaction at log boundary; ARCH-018 structured safe logging. | Tolerable     |

### SYS-012 — Subscription Gate

| HAZ ID  | Component | Failure Mode                                                                             | Operational State | Effect                                                                 | Severity | Likelihood | Risk Level | Mitigation                                                                                                                                  | Residual Risk      |
| ------- | --------- | ---------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------- | -------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HAZ-023 | SYS-012   | Cached subscription entitlement not invalidated after downgrade.                         | NORMAL            | Premium features remain accessible without entitlement.                | Serious  | Occasional | Tolerable  | REQ-IF-005 authoritative entitlement check; REQ-CN-002 premium gate enforcement; SYS-012 short TTL + event invalidation.                    | Broadly Acceptable |
| HAZ-024 | SYS-012   | Restriction policy tied to premium branch only, bypassing dietary policy in free branch. | NORMAL            | Dietary-restriction filter bypass for non-premium recommendation path. | Serious  | Remote     | Tolerable  | REQ-007 policy applies regardless of tier; SYS-012 separates entitlement from restriction safety policy; ARCH-019 policy composition tests. | Broadly Acceptable |

### SYS-013 — TypeScript Strict Compliance Layer

| HAZ ID  | Component | Failure Mode                                                                   | Operational State | Effect                                                                   | Severity | Likelihood | Risk Level | Mitigation                                                                                                                | Residual Risk      |
| ------- | --------- | ------------------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------------ | -------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HAZ-025 | SYS-013   | Implicit `any` in nutrition arithmetic helper bypasses compile guard.          | NORMAL            | Runtime `NaN`/coercion errors produce unstable compliance output.        | Serious  | Occasional | Tolerable  | REQ-NF-001 strict compile gating in CI; SYS-013 static analysis rule set; ARCH-020 blocked merge on type-rule violations. | Broadly Acceptable |
| HAZ-026 | SYS-013   | Missing JSDoc on exported formula helpers leads to incorrect downstream reuse. | NORMAL            | Maintainers apply formula/utilities incorrectly, causing latent defects. | Minor    | Occasional | Tolerable  | REQ-NF-002 JSDoc enforcement; SYS-013 API doc linting; ARCH-020 documentation coverage checks.                            | Broadly Acceptable |

### SYS-014 — Accessibility Compliance Layer

| HAZ ID  | Component | Failure Mode                                                                     | Operational State | Effect                                                                  | Severity | Likelihood | Risk Level  | Mitigation                                                                                                                             | Residual Risk      |
| ------- | --------- | -------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------- | -------- | ---------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| HAZ-027 | SYS-014   | Micronutrient gap/excess indicator encoded only via color in chart legend.       | NORMAL            | Micro-nutrient gap not surfaced for color-blind/screen-reader users.    | Serious  | Probable   | Undesirable | REQ-NF-004 icon/text pairing requirement; REQ-NF-003 accessible-name requirement; SYS-014 accessibility checks on compliance widgets.  | Tolerable          |
| HAZ-028 | SYS-014   | ARIA labels missing on compliance state controls in dashboard and suggestion UI. | NORMAL            | Screen-reader users cannot reliably interpret plan compliance controls. | Serious  | Occasional | Tolerable   | REQ-NF-003 `getByRole`/`getByLabel` testability; SYS-014 a11y linting and Playwright checks; ARCH-020 shared accessibility guardrails. | Broadly Acceptable |

## Coverage Summary

| Metric                           | Value                                |
| -------------------------------- | ------------------------------------ |
| Total System Components Assessed | 14 (`SYS-001`..`SYS-014`)            |
| Total Hazards Identified         | 28 (`HAZ-001`..`HAZ-028`)            |
| Components with ≥1 Hazard        | 14/14 (100%)                         |
| Highest Initial Risk Observed    | Catastrophic/Undesirable (`HAZ-021`) |
| Non-Regulated Profile Applied    | Yes (`domain: ''`)                   |

## Residual Risk Statement

All identified hazards are reduced to **Tolerable** or **Broadly Acceptable** residual risk through requirement- and architecture-linked controls. No safety-critical taxonomies are used because this feature is consumer nutrition planning software, explicitly non-clinical and not medical advice.
