# Metrics: Meal Planning — Story-Level

**Branch**: `006-meal-planning`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](./product-spec.md), [spec.md](../spec.md), [tasks.md](../tasks.md)
**Distinction from research/metrics-roi.md**: this file tracks story-level product signals; research/metrics-roi.md tracks portfolio-level ROI.

---

## Metric Notation

Each metric maps to a story and traces back to FR/SC IDs when available.

---

## Story-Level Metrics

### US-006-001: Create Plan

**FRs**: FR-022

| Metric ID   | Metric                     | Target | Source        | Signal                                   |
| ----------- | -------------------------- | ------ | ------------- | ---------------------------------------- |
| MET-006-001 | Plan creation success rate | >= 98% | API telemetry | POST `/v1/meal-plans` 2xx rate           |
| MET-006-002 | Time to first created plan | TBD    | UX event      | `meal_plan_created` time-from-first-open |

---

### US-006-002: Assign Meals to Slots

**FRs**: FR-023

| Metric ID   | Metric                           | Target | Source        | Signal                                  |
| ----------- | -------------------------------- | ------ | ------------- | --------------------------------------- |
| MET-006-003 | Slot assignment success rate     | >= 98% | API telemetry | POST `/entries` 2xx rate                |
| MET-006-004 | Drag-drop completion reliability | >= 95% | UX telemetry  | drag start vs successful drop-confirmed |

---

### US-006-003: View Nutrition Summary

**FRs**: FR-024

| Metric ID   | Metric                         | Target               | Source        | Signal                        |
| ----------- | ------------------------------ | -------------------- | ------------- | ----------------------------- |
| MET-006-005 | Nutrition summary availability | >= 99% on plan loads | API telemetry | GET `/nutrition` success rate |
| MET-006-006 | Nutrition panel engagement     | TBD                  | UX event      | `nutrition_summary_viewed`    |

---

### US-006-004: Complete Workflow to Grocery Handoff

**FRs/SC**: SC-008

| Metric ID   | Metric                                | Target   | Source                      | Signal                       |
| ----------- | ------------------------------------- | -------- | --------------------------- | ---------------------------- |
| MET-006-007 | 7-day plan-to-grocery completion time | < 10 min | timed usability + telemetry | create→handoff elapsed time  |
| MET-006-008 | Handoff completion rate               | TBD      | event funnel                | handoff started vs completed |

---

### US-006-005: Premium AI Suggestions

**FRs**: FR-025

| Metric ID   | Metric                          | Target | Source        | Signal                           |
| ----------- | ------------------------------- | ------ | ------------- | -------------------------------- |
| MET-006-009 | Suggestion request success rate | >= 95% | API telemetry | suggestions endpoint 2xx         |
| MET-006-010 | Suggestion accept rate          | TBD    | UX event      | suggested recipe applied to slot |

---

### US-006-006: Premium Auto-Generation

**FRs**: FR-026

| Metric ID   | Metric                          | Target | Source        | Signal                 |
| ----------- | ------------------------------- | ------ | ------------- | ---------------------- |
| MET-006-011 | Auto-generation completion rate | >= 90% | API telemetry | generate endpoint 2xx  |
| MET-006-012 | Post-generation edit rate       | TBD    | UX telemetry  | edits after generation |

---

### US-006-007: Premium Waste Optimization

**FRs**: FR-027

| Metric ID   | Metric                            | Target | Source        | Signal                        |
| ----------- | --------------------------------- | ------ | ------------- | ----------------------------- |
| MET-006-013 | Optimization request success rate | >= 90% | API telemetry | optimize endpoint 2xx         |
| MET-006-014 | Suggested swap apply rate         | TBD    | UX event      | optimization actions accepted |

---

## Summary Coverage Table

| Story      | FR/SC Coverage | Metric Count |
| ---------- | -------------- | ------------ |
| US-006-001 | FR-022         | 2            |
| US-006-002 | FR-023         | 2            |
| US-006-003 | FR-024         | 2            |
| US-006-004 | SC-008         | 2            |
| US-006-005 | FR-025         | 2            |
| US-006-006 | FR-026         | 2            |
| US-006-007 | FR-027         | 2            |

## Signalfreeze

- Metrics with explicit targets in `spec.md`: SC-008 only.
- Metrics marked TBD require product analytics calibration and are not treated as hard requirements.
