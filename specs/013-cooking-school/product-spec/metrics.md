# Metrics: Cooking School — Story-Level

**Branch**: `013-cooking-school`
**Date**: 2026-05-13
**Status**: Bootstrapped from [product-spec.md](./product-spec.md)
**Distinction from research metrics**: this file tracks product execution signals; it is not implementation or release evidence.

---

## Story-Level Metrics

### Learner Discovery, Purchase, and Progress

| Metric ID   | Metric                                        |   Target | Source                              |
| ----------- | --------------------------------------------- | -------: | ----------------------------------- |
| MET-013-001 | Course detail to preview start rate           |   >= 35% | client telemetry                    |
| MET-013-002 | Preview-to-purchase conversion                |    >= 8% | funnel telemetry                    |
| MET-013-003 | Enrollment creation after successful checkout | >= 99.5% | billing + enrollment reconciliation |
| MET-013-004 | Progress save success rate                    |   >= 99% | API telemetry                       |
| MET-013-005 | Course completion rate within 30 days         |   >= 25% | learning analytics                  |

### Educator Publishing

| Metric ID   | Metric                                                      |        Target | Source                     |
| ----------- | ----------------------------------------------------------- | ------------: | -------------------------- |
| MET-013-006 | Video upload success rate                                   |        >= 98% | media pipeline telemetry   |
| MET-013-007 | Transcode completion p95                                    | <= 30 minutes | media processing telemetry |
| MET-013-008 | Course publish validation false-negative rate               |             0 | QA + support review        |
| MET-013-009 | First course published within 7 days of educator activation |        >= 40% | creator funnel telemetry   |

### AI Script Drafting and Analytics

| Metric ID   | Metric                                               |                         Target | Source                   |
| ----------- | ---------------------------------------------------- | -----------------------------: | ------------------------ |
| MET-013-010 | AI draft request success rate                        | >= 95% when provider available | AI integration telemetry |
| MET-013-011 | Educator acceptance/edit rate for AI drafts          |      >= 50% accepted or edited | editor events            |
| MET-013-012 | Analytics dashboard weekly usage by active educators |                         >= 50% | client telemetry         |
| MET-013-013 | Revenue reconciliation mismatch                      |                        <= 0.5% | billing reconciliation   |
