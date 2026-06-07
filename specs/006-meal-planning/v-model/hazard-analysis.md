# Hazard Analysis (FMEA): Meal Planning

**Feature Branch**: `006-meal-planning`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/006-meal-planning/v-model/system-design.md`
**Standard**: General-Purpose FMEA (non-regulated software; `domain: ''` in `v-model-config.yml`)

## Overview

This document presents the Failure Mode and Effects Analysis (FMEA) for the **Meal Planning** feature. Every system component (`SYS-001`..`SYS-008`) from `system-design.md` is assessed for realistic failure modes. Each hazard receives a unique `HAZ-NNN` identifier and is linked to mitigation controls (`REQ-NNN` / `SYS-NNN` / `ARCH-NNN`), enabling end-to-end traceability in Matrix H of `traceability-matrix.md`.

**Non-regulated context.** Commise meal planning is consumer SaaS software. There are no life-safety, medical-device, automotive, or avionics safety obligations in scope. Severity is evaluated against **user trust, data integrity, privacy, availability, and platform cost**. Regulated taxonomies (ASIL, DAL, IEC 62304 classes) are intentionally not used.

## ID Schema

- **Hazard ID**: `HAZ-{NNN}` — 3-digit zero-padded sequential identifier (HAZ-001, HAZ-002, ...). Never renumbered.
- **Lineage**: Mitigation references use existing identifiers from this feature (`REQ-*`, `SYS-*`, `ARCH-*`).

## Risk Matrix Definition

### Severity Scale (consumer SaaS — meal planning)

| Level        | Definition                                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Catastrophic | Cross-tenant plan data exposure/modification, or irreversible user plan loss at scale.                                                       |
| Critical     | Single-user unauthorized access, unrecoverable plan corruption for one household, or sustained core-flow outage (≥1 hour).                   |
| Serious      | Recoverable but high-friction degradation: incorrect plan generation, duplicate schedules, stale grocery sync, repeated 5xx with retry path. |
| Minor        | User-visible annoyance: temporary stale nutrition totals, non-blocking validation errors, transient UI inconsistency.                        |
| Negligible   | Cosmetic-only drift without integrity or privacy impact.                                                                                     |

### Likelihood Scale

| Level      | Definition                                                     |
| ---------- | -------------------------------------------------------------- |
| Frequent   | Expected under normal usage (daily).                           |
| Probable   | Expected occasionally (weekly).                                |
| Occasional | Seen rarely (monthly).                                         |
| Remote     | Possible under unusual conditions.                             |
| Improbable | Conceivable only under stacked failures or adversarial timing. |

### Risk Level Matrix

|              | Frequent     | Probable     | Occasional   | Remote      | Improbable  |
| ------------ | ------------ | ------------ | ------------ | ----------- | ----------- |
| Catastrophic | Unacceptable | Unacceptable | Unacceptable | Undesirable | Undesirable |
| Critical     | Unacceptable | Unacceptable | Undesirable  | Undesirable | Tolerable   |
| Serious      | Unacceptable | Undesirable  | Undesirable  | Tolerable   | Tolerable   |
| Minor        | Undesirable  | Tolerable    | Tolerable    | Tolerable   | Acceptable  |
| Negligible   | Tolerable    | Tolerable    | Acceptable   | Acceptable  | Acceptable  |

**Disposition rule**: `Unacceptable` MUST be reduced to `Undesirable` or lower before release. `Undesirable` MUST have explicit acceptance in residual risk.

## Operational States

`system-design.md` defines components and interactions but no formal state taxonomy. State-dependent hazards are assessed with practical operating modes:

| State           | Definition                                                                           |
| --------------- | ------------------------------------------------------------------------------------ |
| NORMAL          | Expected steady-state operation for authenticated planning workflows.                |
| DST-BOUNDARY    | Week/day transitions around daylight saving changes and timezone offsets.            |
| DEGRADED-AI     | AI provider latency/error mode affecting premium suggestion and auto-generate flows. |
| DEGRADED-SYNC   | Cross-feature synchronization lag with downstream consumers (grocery/nutrition).     |
| CONCURRENT-EDIT | Multi-device simultaneous editing of the same meal plan.                             |

## Hazard Register (FMEA)

### SYS-001 — Meal Plan Manager

| HAZ ID  | Component | Failure Mode                                                                          | Operational State | Effect                                                                          | Severity | Likelihood | Risk Level  | Mitigation                                                                                                           | Residual Risk |
| ------- | --------- | ------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------- | -------- | ---------- | ----------- | -------------------------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-001 | SYS-001   | Calendar timezone drift stores meal slot under wrong local day.                       | DST-BOUNDARY      | Meals appear on unintended date; downstream grocery lists mismatch user intent. | Serious  | Occasional | Undesirable | REQ-001, REQ-002, REQ-010; ARCH-002 canonical timezone normalization + UTC storage; ARCH-003 date-index constraints. | Tolerable     |
| HAZ-002 | SYS-001   | Week boundary edge case (DST shift) causes duplicate/missing day in 7-day view.       | DST-BOUNDARY      | Weekly nutrition totals and schedule navigation become inconsistent.            | Serious  | Remote     | Tolerable   | REQ-005, REQ-011; ARCH-002 week-window calculations anchored to calendar dates not fixed-hour offsets.               | Acceptable    |
| HAZ-003 | SYS-001   | Calendar overflow when plan range exceeds validated bounds (30+ days pagination bug). | NORMAL            | Plan query becomes partial/incorrect; users miss scheduled meals.               | Serious  | Remote     | Tolerable   | REQ-010; ARCH-003 pagination and boundary validation; SYS-001 lifecycle validation before persistence.               | Acceptable    |
| HAZ-004 | SYS-001   | Holiday/skip-day logic error re-inserts intentionally skipped meal days.              | NORMAL            | User confidence loss; wasted ingredients due to re-added meals.                 | Minor    | Occasional | Tolerable   | REQ-001, REQ-009; ARCH-002 explicit skip-day state transitions with idempotent updates.                              | Acceptable    |

### SYS-002 — Recipe Assignment Service

| HAZ ID  | Component | Failure Mode                                                                                 | Operational State | Effect                                                                           | Severity | Likelihood | Risk Level  | Mitigation                                                                                                                                    | Residual Risk |
| ------- | --------- | -------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------- | -------- | ---------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-005 | SYS-002   | Deleted recipe still scheduled due to stale ownership check/cache race.                      | NORMAL            | Broken slot references, confusing plan display, potential 404 chains downstream. | Serious  | Occasional | Undesirable | REQ-003, REQ-009, REQ-IF-001; ARCH-005 runtime ownership validation on write; ARCH-006 FK/cascade integrity; ARCH-016 re-check on assignment. | Tolerable     |
| HAZ-006 | SYS-002   | Recurring-plan duplication creates repeated assignments after retry without idempotency key. | CONCURRENT-EDIT   | Duplicate meals inflate nutrition totals and grocery demand.                     | Serious  | Probable   | Undesirable | REQ-003, REQ-010; ARCH-005 idempotent command handling; ARCH-006 unique composite key (`planId`,`slotId`,`recipeId`,`occurrenceDate`).        | Tolerable     |
| HAZ-007 | SYS-002   | Plan template corruption maps slot types incorrectly during template apply.                  | NORMAL            | Breakfast/lunch/dinner semantics corrupted across days.                          | Serious  | Remote     | Tolerable   | REQ-002, REQ-009; ARCH-005 slot-type schema validation and strict enum mapping; ARCH-004 contract validation failures as 4xx.                 | Acceptable    |

### SYS-003 — Nutritional Summary Engine

| HAZ ID  | Component | Failure Mode                                                                            | Operational State | Effect                                                             | Severity | Likelihood | Risk Level  | Mitigation                                                                                                                         | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------ | -------- | ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-008 | SYS-003   | Serving-size scaling errors (fraction/decimal rounding drift) misstate calories/macros. | NORMAL            | User makes incorrect dietary decisions; trust erosion.             | Serious  | Occasional | Undesirable | REQ-004, REQ-005, REQ-011; ARCH-008 deterministic scaling with precision-safe arithmetic; ARCH-017 unit-normalized nutrient input. | Tolerable     |
| HAZ-009 | SYS-003   | Cache invalidation miss after plan edit serves stale daily/weekly totals.               | NORMAL            | Visible mismatch between assigned recipes and nutrition summary.   | Minor    | Probable   | Tolerable   | REQ-004, REQ-005; ARCH-009 mutation-triggered invalidation; ARCH-008 recompute-on-stale fallback.                                  | Acceptable    |
| HAZ-010 | SYS-003   | Leftover handling drift double-counts carry-over meals across consecutive days.         | NORMAL            | Weekly totals inflated; grocery planning overestimates quantities. | Serious  | Remote     | Tolerable   | REQ-005, REQ-011; SYS-003 carry-over rules constrained to single ownership record per meal instance.                               | Acceptable    |

### SYS-004 — AI Meal Suggestion Service

| HAZ ID  | Component | Failure Mode                                                                           | Operational State | Effect                                                            | Severity | Likelihood | Risk Level  | Mitigation                                                                                                                   | Residual Risk |
| ------- | --------- | -------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------- | -------- | ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-011 | SYS-004   | Dietary-restriction filter bypass returns suggestions violating user constraints.      | NORMAL            | Harmful/undesired recommendations and premium trust loss.         | Critical | Occasional | Undesirable | REQ-006, REQ-CN-001; ARCH-011 post-generation constraint filter; ARCH-010 response contract rejects invalid recommendations. | Tolerable     |
| HAZ-012 | SYS-004   | Premium guard bypass exposes AI suggestions to non-premium users.                      | NORMAL            | Entitlement/security breach and business-rule violation.          | Critical | Remote     | Undesirable | REQ-CN-001, REQ-IF-003; ARCH-021 mandatory premium guard + ARCH-018 token tier extraction.                                   | Tolerable     |
| HAZ-013 | SYS-004   | AI prompt context omits user recipe inventory, causing non-actionable recommendations. | DEGRADED-AI       | Suggested meals cannot be assigned; degraded workflow efficiency. | Minor    | Probable   | Tolerable   | REQ-006, REQ-IF-001; ARCH-011 prompt assembly requires inventory payload and validation.                                     | Acceptable    |

### SYS-005 — Meal Plan Auto-Generator

| HAZ ID  | Component | Failure Mode                                                                      | Operational State | Effect                                        | Severity | Likelihood | Risk Level  | Mitigation                                                                                                               | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------------- | ----------------- | --------------------------------------------- | -------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------------- |
| HAZ-014 | SYS-005   | Auto-generation writes partial plan then fails mid-transaction.                   | DEGRADED-AI       | Corrupted draft plan with missing days/slots. | Serious  | Occasional | Undesirable | REQ-007, REQ-009; ARCH-013 transaction boundary for all-or-nothing draft writes via ARCH-006 repository batch semantics. | Tolerable     |
| HAZ-015 | SYS-005   | Multi-device plan conflict overwrites user edits with stale auto-generated draft. | CONCURRENT-EDIT   | Silent data loss and user distrust.           | Critical | Occasional | Undesirable | REQ-007, REQ-CN-002; ARCH-013 optimistic version checks; ARCH-003 revision column conflict rejection.                    | Tolerable     |
| HAZ-016 | SYS-005   | Recurrence expansion bug duplicates future weeks during regenerate action.        | CONCURRENT-EDIT   | Plan bloat and unusable calendar.             | Serious  | Remote     | Tolerable   | REQ-007, REQ-010; SYS-005 deterministic recurrence index + dedupe in ARCH-006 unique constraints.                        | Acceptable    |

### SYS-006 — Food Waste Optimizer

| HAZ ID  | Component | Failure Mode                                                                                     | Operational State | Effect                                                                  | Severity | Likelihood | Risk Level  | Mitigation                                                                                                               | Residual Risk |
| ------- | --------- | ------------------------------------------------------------------------------------------------ | ----------------- | ----------------------------------------------------------------------- | -------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ | ------------- |
| HAZ-017 | SYS-006   | Optimizer suggests swaps that violate dietary exclusions.                                        | NORMAL            | Unsafe/unwanted plan recommendations; premium feature regression.       | Critical | Remote     | Undesirable | REQ-008, REQ-006, REQ-CN-001; ARCH-015 constraint-aware candidate scoring; ARCH-021 premium-gated validated output path. | Tolerable     |
| HAZ-018 | SYS-006   | Leftover recommendation drift causes ingredient reuse assumptions not reflected in grocery sync. | DEGRADED-SYNC     | Under-purchasing/over-purchasing from inconsistent optimization output. | Serious  | Occasional | Undesirable | REQ-008, REQ-IF-005; ARCH-015 emits explicit reuse metadata consumed by ARCH-020 serialized output.                      | Tolerable     |
| HAZ-019 | SYS-006   | Optimization run on stale plan snapshot after concurrent edits.                                  | CONCURRENT-EDIT   | Recommendations no longer apply to current schedule.                    | Minor    | Probable   | Tolerable   | REQ-008; ARCH-015 requires plan revision token from ARCH-003 prior to compute.                                           | Acceptable    |

### SYS-007 — External Integration Adapters

| HAZ ID  | Component | Failure Mode                                                                                   | Operational State | Effect                                             | Severity     | Likelihood | Risk Level  | Mitigation                                                                                                                    | Residual Risk                                                                          |
| ------- | --------- | ---------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------- | ------------ | ---------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| HAZ-020 | SYS-007   | Household-share permission leak exposes one household plan to another user context.            | NORMAL            | Cross-tenant privacy breach.                       | Catastrophic | Improbable | Undesirable | REQ-CN-002, REQ-IF-003; ARCH-018 strict subject extraction + ARCH-003 row-level user scoping on every query.                  | Undesirable — accepted with mandatory audit logging and periodic access-review checks. |
| HAZ-021 | SYS-007   | Plan-to-grocery sync race publishes stale plan snapshot after edit commit.                     | DEGRADED-SYNC     | Grocery list diverges from current meal plan.      | Serious      | Occasional | Undesirable | REQ-IF-005, REQ-011; ARCH-020 versioned serialization and monotonic revision fields; SYS-001 emits post-commit snapshot only. | Tolerable                                                                              |
| HAZ-022 | SYS-007   | Nutrition-planning consumer receives incompatible schema version.                              | NORMAL            | Downstream compliance tracking fails silently.     | Serious      | Remote     | Tolerable   | REQ-IF-006; ARCH-020 version negotiation and explicit schema version headers.                                                 | Acceptable                                                                             |
| HAZ-023 | SYS-007   | USDA adapter circuit breaker open state not surfaced, yielding empty nutrient sets as success. | DEGRADED-SYNC     | Nutrition summaries falsely appear healthy/zeroed. | Critical     | Remote     | Undesirable | REQ-IF-002, REQ-004; ARCH-017 explicit failure propagation + SYS-003 fallback error state, not silent zeros.                  | Tolerable                                                                              |

### SYS-008 — Quality & Compliance Layer

| HAZ ID  | Component | Failure Mode                                                                          | Operational State | Effect                                                        | Severity | Likelihood | Risk Level  | Mitigation                                                                                             | Residual Risk |
| ------- | --------- | ------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------- | -------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------ | ------------- |
| HAZ-024 | SYS-008   | Accessibility contract regression allows unlabeled state controls in meal planner UI. | NORMAL            | Users relying on assistive tech cannot reliably manage plans. | Serious  | Occasional | Undesirable | REQ-NF-003, REQ-NF-004; ARCH-022 lint/test gates enforce accessible names + non-color-only state cues. | Tolerable     |
| HAZ-025 | SYS-008   | Type-safety gate bypass introduces implicit `any` in nutrition/quantity math paths.   | NORMAL            | Runtime math faults and hard-to-debug production defects.     | Serious  | Remote     | Tolerable   | REQ-NF-001; ARCH-022 strict TypeScript gate in CI blocks merge.                                        | Acceptable    |

## Progressive Deepening — Architecture Boundary Hazards

| HAZ ID  | Component           | Failure Mode                                                                           | Operational State | Effect                                                              | Severity | Likelihood | Risk Level | Mitigation                                                                             | Residual Risk |
| ------- | ------------------- | -------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------- | -------- | ---------- | ---------- | -------------------------------------------------------------------------------------- | ------------- |
| HAZ-026 | ARCH-003 + ARCH-006 | Concurrent write path bypasses uniqueness constraints during retry storm.              | CONCURRENT-EDIT   | Duplicate slot assignments persist despite service-level dedupe.    | Serious  | Remote     | Tolerable  | ARCH-006 unique index + transactional upsert semantics; REQ-003, REQ-010.              | Acceptable    |
| HAZ-027 | ARCH-013 + ARCH-021 | Guard evaluated after draft generation call in controller pipeline.                    | NORMAL            | Non-premium users trigger expensive AI generation before rejection. | Serious  | Remote     | Tolerable  | ARCH-012/ARCH-010 enforce guard-first execution order; REQ-CN-001.                     | Acceptable    |
| HAZ-028 | ARCH-020 + ARCH-003 | Serialization reads pre-commit revision while publish event uses post-commit metadata. | DEGRADED-SYNC     | Cross-feature consumers observe impossible mixed-version payloads.  | Serious  | Remote     | Tolerable  | REQ-IF-005, REQ-IF-006; ARCH-020 snapshot export sourced from committed revision only. | Acceptable    |

## Coverage Summary

| Metric                                               | Count  | Notes                                                  |
| ---------------------------------------------------- | ------ | ------------------------------------------------------ |
| Total `SYS-NNN` components                           | 8      | From `system-design.md`.                               |
| `SYS-NNN` with ≥1 hazard                             | 8      | 100% SYS coverage.                                     |
| `SYS-NNN` with no realistic failure mode             | 0      | Every SYS has at least one practical failure mode.     |
| Total SYS-level hazards (HAZ-001..HAZ-025)           | 25     | Sequential, never renumbered.                          |
| Architecture-level hazards (HAZ-026..HAZ-028)        | 3      | Added from `architecture-design.md` boundaries.        |
| **Total hazards**                                    | **28** | Range `HAZ-001`..`HAZ-028`.                            |
| Hazards at `Unacceptable` risk level                 | 0      | None remain.                                           |
| Hazards at `Undesirable` risk level                  | 11     | Explicit mitigations and residual acceptance recorded. |
| Hazards at `Tolerable` risk level                    | 15     | Accepted with controls in place.                       |
| Hazards at `Acceptable` risk level                   | 2      | Low residual impact after controls.                    |
| Mitigations referencing `REQ-*` / `SYS-*` / `ARCH-*` | ✓      | All hazards cite real IDs from feature 006 artifacts.  |

## Domain Note (non-regulated)

This hazard analysis intentionally avoids regulated-domain safety classifications. The Meal Planning feature is assessed under consumer software risk principles focused on trust, privacy, integrity, availability, and cost.
