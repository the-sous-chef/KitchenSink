# Metrics: Nutrition Planning — Story-Level

**Branch**: `009-nutrition-planning`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](./product-spec.md), [spec.md](../spec.md)
**Distinction from research/metrics-roi.md**: This file is per-story product execution metrics; research/metrics-roi.md is portfolio-level ROI and operational framing.

---

## Story-Level Metrics

### US-001: Create Nutrition Plan

**Traceability**: `FR-036`

| Metric ID    | Metric                         | Target                                                   | Source              |
| ------------ | ------------------------------ | -------------------------------------------------------- | ------------------- |
| MET-US001-01 | Plan setup completion rate     | >= 60% of started setups                                 | UX funnel events    |
| MET-US001-02 | Time to first saved plan       | <= 4 minutes median                                      | Client telemetry    |
| MET-US001-03 | Invalid target submission rate | <= 5%                                                    | API validation logs |
| MET-US001-04 | Goal-adjustment retention      | >= 50% users still active 2 weeks after first adjustment | Cohort analysis     |

---

### US-002: Link Meal Plan and View Compliance

**Traceability**: `FR-037`, `SC-010`

| Metric ID    | Metric                            | Target                                | Source                  |
| ------------ | --------------------------------- | ------------------------------------- | ----------------------- |
| MET-US002-01 | Linked-plan adoption              | >= 70% of plans linked to meal plans  | DB query                |
| MET-US002-02 | Compliance view weekly engagement | >= 2 views/week active nutrition user | UX events               |
| MET-US002-03 | Compliance calc accuracy          | Within 5% error bound                 | Validation test harness |
| MET-US002-04 | Compliance API reliability        | >= 99.5% success                      | API telemetry           |

---

### US-003: Trainer Creates Client Plan (Premium)

**Traceability**: `FR-038`, `REQ-008`

| Metric ID    | Metric                                  | Target                                          | Source                 |
| ------------ | --------------------------------------- | ----------------------------------------------- | ---------------------- |
| MET-US003-01 | Trainer plan assignment success         | >= 95% successful create attempts               | API telemetry          |
| MET-US003-02 | Consent-gated flow correctness          | 100% trainer plan writes require consent        | Compliance audit query |
| MET-US003-03 | Client view activation after assignment | >= 75% of assigned clients open plan within 72h | UX events              |

---

### US-004: Recipe Swap Guidance (Premium)

**Traceability**: `FR-039`

| Metric ID    | Metric                              | Target                                          | Source              |
| ------------ | ----------------------------------- | ----------------------------------------------- | ------------------- |
| MET-US004-01 | Suggestion acceptance rate          | >= 25%                                          | UX interaction logs |
| MET-US004-02 | Accepted-swap deviation improvement | >= 65% accepted swaps reduce same-day deviation | Compliance deltas   |
| MET-US004-03 | Time-to-decision on suggestion      | <= 90s median                                   | UX timing events    |

---

## Warning-Level Metrics (Extension Scope)

If dietary profiles and deficiency alerts are promoted to explicit FRs:

- `MET-US008-*`: dietary-filter efficacy metrics
- `MET-US009-*`: deficiency-alert quality metrics

These are not part of strict Must Have acceptance for current FR set.
