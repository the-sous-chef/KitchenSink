# Metrics: Recipe Importing — Story-Level

**Branch**: `004-recipe-importing`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](./product-spec.md), [spec.md](../spec.md)
**Distinction from research/metrics-roi.md**: This file is story-level and team-operational; research metrics are portfolio-level.

---

## Metric Notation

Each metric is tied to a story in `product-spec.md` and references FR IDs from `spec.md`.

---

## Story-Level Metrics

### US-401: Import Recipe from Public URL

**FRs**: [FR-008](../spec.md#fr-008)

| Metric ID    | Metric                                  | Target | Source             | Signal                                 |
| ------------ | --------------------------------------- | ------ | ------------------ | -------------------------------------- |
| MET-US401-01 | URL import success rate                 | >= 70% | API telemetry      | `POST /import/url` success ratio       |
| MET-US401-02 | Time to saved import (median)           | <= 45s | UX events          | import_submit → import_saved           |
| MET-US401-03 | Required field completeness after parse | >= 85% | parser QA fixtures | title+ingredients+instructions present |

---

### US-402: Instagram Import

**FRs**: [FR-009](../spec.md#fr-009)

| Metric ID    | Metric                                  | Target | Source              | Signal                               |
| ------------ | --------------------------------------- | ------ | ------------------- | ------------------------------------ |
| MET-US402-01 | Supported Instagram import success      | >= 60% | API telemetry       | caption-eligible posts imported      |
| MET-US402-02 | Unsupported-caption detection precision | >= 95% | QA + support triage | correctly rejected unsupported posts |

---

### US-403 / US-404: Attribution + Visibility Invariants

**FRs**: [FR-010](../spec.md#fr-010), [FR-011](../spec.md#fr-011)

| Metric ID    | Metric                                                  | Target       | Source             | Signal                           |
| ------------ | ------------------------------------------------------- | ------------ | ------------------ | -------------------------------- |
| MET-US403-01 | Imported public recipes with attribution block rendered | 100%         | UI telemetry/query | `sourceUrl` + rendered component |
| MET-US404-01 | Invalid privatization attempts of attributed imports    | 0 successful | audit logs         | blocked policy transitions       |

---

### US-405: Physical Copy/OCR Path

**FRs**: [FR-012](../spec.md#fr-012), [FR-013](../spec.md#fr-013)

| Metric ID    | Metric                                 | Target | Source             | Signal                                   |
| ------------ | -------------------------------------- | ------ | ------------------ | ---------------------------------------- |
| MET-US405-01 | OCR path completion rate (if enabled)  | >= 50% | workflow telemetry | photo upload → saved recipe              |
| MET-US405-02 | OCR-imported recipes defaulted private | 100%   | DB query           | visibility check on `importSource='ocr'` |

---

### US-406: Paywalled Source Rejection

**FRs**: [FR-014](../spec.md#fr-014)

| Metric ID    | Metric                                         | Target | Source                   | Signal                                     |
| ------------ | ---------------------------------------------- | ------ | ------------------------ | ------------------------------------------ |
| MET-US406-01 | Paywalled-source rejection accuracy            | >= 95% | policy telemetry + audit | blocked known domains                      |
| MET-US406-02 | User-understandable error acknowledgement rate | >= 80% | UX event                 | user clicks policy-help or recovery action |

---

### US-407 / US-409: Duplicate Conflict + Error Recovery

**FRs**: [FR-008](../spec.md#fr-008), [FR-014](../spec.md#fr-014)

| Metric ID    | Metric                                      | Target | Source             | Signal                                    |
| ------------ | ------------------------------------------- | ------ | ------------------ | ----------------------------------------- |
| MET-US407-01 | Duplicate imports routed to clone/view flow | >= 99% | API + UI telemetry | already_imported responses                |
| MET-US409-01 | Error-state recovery completion             | >= 40% | UX funnel          | error_view → successful save via fallback |

---

### US-410: Paid-Source Manual Paste Policy Guardrail

**FRs**: [FR-014a](../spec.md#fr-014a)

| Metric ID    | Metric                                                         | Target                   | Source             | Signal                         |
| ------------ | -------------------------------------------------------------- | ------------------------ | ------------------ | ------------------------------ |
| MET-US410-01 | Policy decision readiness                                      | Pending                  | governance tracker | legal sign-off date            |
| MET-US410-02 | Public publish attempts blocked for flagged paid-source pastes | 100% once policy enabled | policy audit logs  | blocked visibility transitions |

This story remains policy-gated until legal review finalizes enforcement semantics.
