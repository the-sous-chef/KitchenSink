# Metrics and ROI: Meal Planning

**Branch**: `006-meal-planning` | **Date**: 2026-05-09
**Status**: Complete | **Sources**: [spec.md](../spec.md), [plan.md](../plan.md), [tasks.md](../tasks.md), [v-model/requirements.md](../v-model/requirements.md)

---

## Overview

This document captures portfolio-level metrics and ROI hypotheses for feature 006. Story-level product metrics live in `../product-spec/metrics.md`.

---

## 1. Operational SLOs (Constitution-Derived NFRs)

### NFR-001: Strict TypeScript / No Unbounded `any`

| SLO                                                | Target | Measurement              |
| -------------------------------------------------- | ------ | ------------------------ |
| Strict typecheck compliance for touched workspaces | 100%   | `npm run typecheck` pass |
| Unapproved `any` usage in production code          | 0      | ESLint + review          |

---

### NFR-002: Exported API Documentation

| SLO                                      | Target | Measurement                       |
| ---------------------------------------- | ------ | --------------------------------- |
| Exported functions/interfaces with JSDoc | 100%   | lint/doc audit of changed modules |

---

### NFR-003: Accessibility Queryability

| SLO                                                  | Target                       | Measurement                                      |
| ---------------------------------------------------- | ---------------------------- | ------------------------------------------------ |
| Interactive planner controls queryable by role/label | 100% of critical UI controls | Playwright assertions (`getByRole`/`getByLabel`) |

---

### NFR-004: Non-Color-Only State

| SLO                                                | Target                       | Measurement                                            |
| -------------------------------------------------- | ---------------------------- | ------------------------------------------------------ |
| Planner state indicators with icon/text redundancy | 100% of stateful UI elements | design QA + automated visual assertions where possible |

---

## 2. Outcome Metric from Spec

### SC-008: Meal-Plan-to-Grocery Completion Time

| Metric                                                                 | Target                        | Window                                    | Source |
| ---------------------------------------------------------------------- | ----------------------------- | ----------------------------------------- | ------ |
| End-to-end workflow time (create plan → assignments → grocery handoff) | < 10 minutes for a 7-day plan | controlled usability sessions + telemetry | SC-008 |

This is currently the only explicit numeric success criterion in `spec.md`.

---

## 3. Product Metrics (Portfolio-Level)

These are derived operational/business hypotheses; thresholds should be finalized during revalidation.

| Metric                                                            | Initial Target | Rationale                                |
| ----------------------------------------------------------------- | -------------- | ---------------------------------------- |
| Planner activation rate (users creating first plan within 7 days) | TBD            | Measures feature adoption                |
| Weekly active planners                                            | TBD            | Retention linkage for recurring behavior |
| Premium AI usage rate among premium users (FR-025..027)           | TBD            | Validates premium value                  |
| Grocery handoff completion rate                                   | TBD            | End-to-end value realization             |
| Nutrition-summary view rate                                       | TBD            | Validates FR-024 utility                 |

---

## 4. ROI Hypothesis

Feature 006 should improve:

1. **Retention**: planning creates a recurring weekly habit.
2. **Premium conversion**: AI suggestions/auto-generation/waste optimization are high-intent paid capabilities.
3. **Cross-feature stickiness**: stronger coupling between recipes (001), grocery (007), and nutrition planning (009).

---

## 5. Instrumentation Readiness

Minimum telemetry events to support above metrics:

- `meal_plan_created`
- `meal_slot_assigned`
- `nutrition_summary_viewed`
- `ai_suggestions_requested`
- `ai_plan_generated`
- `waste_optimization_requested`
- `grocery_handoff_started`
- `grocery_handoff_completed`

Event schema details are not defined in current source artifacts and should be finalized later.

---

## 6. Traceability Snapshot

| Source requirement | Coverage in this document                   |
| ------------------ | ------------------------------------------- |
| NFR-001            | Operational SLO section 1                   |
| NFR-002            | Operational SLO section 1                   |
| NFR-003            | Operational SLO section 1                   |
| NFR-004            | Operational SLO section 1                   |
| SC-008             | Outcome metric section 2                    |
| FR-024/025/026/027 | Product metric and ROI framing sections 3–4 |

## WARNING

- `spec.md` defines only one explicit numeric success criterion (SC-008). Additional targets above are intentionally marked TBD to avoid inventing requirements.
