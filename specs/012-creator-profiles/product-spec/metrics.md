# Metrics: Public Creator Profiles — Story-Level

**Branch**: `012-creator-profiles`
**Date**: 2026-05-13
**Status**: Bootstrapped from [product-spec.md](./product-spec.md)
**Distinction from research metrics**: this file tracks product execution signals; it is not implementation or release evidence.

---

## Story-Level Metrics

### Creator Activation

| Metric ID   | Metric                                           |                         Target | Source           |
| ----------- | ------------------------------------------------ | -----------------------------: | ---------------- |
| MET-012-001 | Handle claim completion rate                     |  >= 75% of creator-mode starts | funnel telemetry |
| MET-012-002 | Handle collision resolution success              | >= 90% choose alternate handle | client events    |
| MET-012-003 | Published profile with at least 3 public recipes |     >= 60% of claimed creators | DB query         |

### Public Discovery and Follow

| Metric ID   | Metric                           | Target | Source                           |
| ----------- | -------------------------------- | -----: | -------------------------------- |
| MET-012-004 | Public profile p95 load time     |  <= 2s | web telemetry                    |
| MET-012-005 | Visitor-to-follow conversion     |  >= 8% | profile analytics                |
| MET-012-006 | Follow feed delivery success     | >= 99% | feed service telemetry           |
| MET-012-007 | Private recipe leakage incidents |      0 | authorization tests + audit logs |

### Creator Analytics and Embed

| Metric ID   | Metric                                              |                 Target | Source               |
| ----------- | --------------------------------------------------- | ---------------------: | -------------------- |
| MET-012-008 | Weekly analytics dashboard usage by active creators |                 >= 40% | client telemetry     |
| MET-012-009 | Embed setup completion rate                         | >= 50% of embed starts | funnel telemetry     |
| MET-012-010 | Embed render success on sampled external pages      |                 >= 99% | synthetic monitoring |
| MET-012-011 | Analytics count reconciliation error                |                  <= 2% | analytics QA queries |
