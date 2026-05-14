# Metrics: Recipe Digitization & Family Circles — Story-Level

**Branch**: `011-recipe-digitization`
**Date**: 2026-05-13
**Status**: Bootstrapped from [product-spec.md](./product-spec.md)
**Distinction from research metrics**: this file tracks product execution signals; it is not implementation or release evidence.

---

## Story-Level Metrics

### OCR Capture and Correction

| Metric ID   | Metric                                                 |                               Target | Source             |
| ----------- | ------------------------------------------------------ | -----------------------------------: | ------------------ |
| MET-011-001 | OCR job completion time for single image               |                           <= 60s p95 | job telemetry      |
| MET-011-002 | Structured field extraction accuracy on labeled corpus |                               >= 90% | QA corpus          |
| MET-011-003 | Median correction time per accepted recipe             |                         <= 5 minutes | client telemetry   |
| MET-011-004 | Low-confidence field precision                         | >= 80% flagged fields require review | QA review sampling |

### Recipe Save and Privacy

| Metric ID   | Metric                               | Target | Source                        |
| ----------- | ------------------------------------ | -----: | ----------------------------- |
| MET-011-005 | Accepted OCR draft save success rate | >= 99% | API telemetry                 |
| MET-011-006 | Accidental public exposure incidents |      0 | security/privacy incident log |
| MET-011-007 | Draft abandonment after OCR success  | <= 25% | funnel telemetry              |

### Family Circles

| Metric ID   | Metric                            | Target | Source                           |
| ----------- | --------------------------------- | -----: | -------------------------------- |
| MET-011-008 | Circle creation success rate      | >= 98% | API telemetry                    |
| MET-011-009 | Invite acceptance rate            | >= 60% | invitation events                |
| MET-011-010 | Unauthorized Circle recipe access |      0 | authorization tests + audit logs |

### Bulk Import

| Metric ID   | Metric                                               |               Target | Source           |
| ----------- | ---------------------------------------------------- | -------------------: | ---------------- |
| MET-011-011 | Bulk queue survival across navigation/session resume | 100% in QA scenarios | end-to-end tests |
| MET-011-012 | Failed bulk jobs with actionable retry state         |                 100% | job audit        |
| MET-011-013 | Clean-bulk accept false-positive rate                |                <= 2% | QA sampling      |
