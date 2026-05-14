# Metrics: Grocery Lists & Online Ordering — Story-Level

**Branch**: `007-grocery-lists`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](./product-spec.md), [spec.md](../spec.md)
**Distinction from research/metrics-roi.md**: That file covers portfolio-level ROI and business outcomes. This file is story-level — per-user-story measurable outcomes for product teams.

---

## Metric Notation

Each metric is tied to a Must Have or Should Have story. Every metric has a measurable signal and suggested target.

---

## Story-Level Metrics

### US-001: Generate List from Meal Plan

**FRs**: [FR-028](../spec.md#feature-requirements)

| Metric ID    | Metric                               | Target                        | Source        | Signal                                            |
| ------------ | ------------------------------------ | ----------------------------- | ------------- | ------------------------------------------------- |
| MET-US001-01 | Meal plans converted to grocery list | >= 70% of eligible meal plans | API telemetry | POST from-meal-plan success / eligible meal plans |
| MET-US001-02 | Generation completion latency        | p95 <= 5s                     | API telemetry | generation_duration_ms                            |
| MET-US001-03 | Generation failure rate              | <= 1%                         | API telemetry | non-2xx generation responses                      |

---

### US-002: Deduplicate and Sum Ingredient Quantities

**FRs**: [FR-028](../spec.md#feature-requirements)

| Metric ID    | Metric                            | Target                            | Source                     | Signal                          |
| ------------ | --------------------------------- | --------------------------------- | -------------------------- | ------------------------------- |
| MET-US002-01 | Duplicate-collapse effectiveness  | >= 95% expected merges completed  | Aggregation test telemetry | expected_merge_count vs actual  |
| MET-US002-02 | Quantity correctness dispute rate | <= 2% lists edited for correction | UX events                  | manual quantity override events |

---

### US-003: Mark Already-Have Items

**FRs**: [FR-029](../spec.md#feature-requirements)

| Metric ID    | Metric                    | Target                            | Source           | Signal                              |
| ------------ | ------------------------- | --------------------------------- | ---------------- | ----------------------------------- |
| MET-US003-01 | Pantry toggle usage       | >= 40% of lists use pantry marks  | UX events        | pantry_toggle_count > 0             |
| MET-US003-02 | Pantry exclusion accuracy | 100% excluded from to-order count | API/DB assertion | summary_to_order consistency checks |

---

### US-004: Aisle-Oriented Shopping View

**FRs**: [FR-028](../spec.md#feature-requirements), [FR-029](../spec.md#feature-requirements)

| Metric ID    | Metric                          | Target                           | Source    | Signal                       |
| ------------ | ------------------------------- | -------------------------------- | --------- | ---------------------------- |
| MET-US004-01 | Grouped-view adoption           | >= 60% of active list sessions   | UX events | grouped_view_opened          |
| MET-US004-02 | In-store completion speed proxy | Median list completion <= 25 min | UX timing | first_check_to_last_check_ms |

---

### US-005: Configure Store Connection

**FRs**: [FR-030](../spec.md#feature-requirements)

| Metric ID    | Metric                      | Target                             | Source                 | Signal                          |
| ------------ | --------------------------- | ---------------------------------- | ---------------------- | ------------------------------- |
| MET-US005-01 | Store setup completion rate | >= 65% of setup starts             | Setup funnel telemetry | setup_completed / setup_started |
| MET-US005-02 | Setup error retry success   | >= 70% recover after first failure | Setup telemetry        | retry_success_count             |

---

### US-007: Premium Order Handoff

**FRs**: [FR-031](../spec.md#feature-requirements)

| Metric ID    | Metric                        | Target                                    | Source                      | Signal                     |
| ------------ | ----------------------------- | ----------------------------------------- | --------------------------- | -------------------------- |
| MET-US007-01 | Order handoff initiation rate | >= 30% of premium users with active lists | API telemetry               | order_initiated            |
| MET-US007-02 | Mapped-item ratio at handoff  | >= 85% mapped items                       | Mapping telemetry           | mapped_items / total_items |
| MET-US007-03 | Handoff completion success    | >= 95% non-error redirect responses       | API/store adapter telemetry | checkout_url_returned      |

---

## Accessibility and Quality Indicators

| Metric ID   | Requirement                  | Target                                                  | Signal                         |
| ----------- | ---------------------------- | ------------------------------------------------------- | ------------------------------ |
| MET-QLTY-01 | NFR-003 accessible names     | 100% critical controls discoverable by role/label tests | Playwright accessibility suite |
| MET-QLTY-02 | NFR-004 non-color-only state | 100% status states include icon/text cue                | UI snapshot/assertion checks   |
