# Metrics: Subscriptions & Monetization — Story-Level

**Branch**: `010-subscriptions`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](./product-spec.md), [spec.md](../spec.md)
**Distinction from research/metrics-roi.md**: that file tracks portfolio/business outcomes; this file tracks per-story product execution metrics.

---

## Metric Notation

Each story has measurable signals with explicit targets. Metrics are designed for product + engineering teams validating adoption, conversion, and trust contracts.

---

## Story-Level Metrics

### US-010-001: Free Tier Core Access

**FRs**: [FR-040](../spec.md#functional-requirements)

| Metric ID   | Metric                                                      | Target | Source            | Signal                     |
| ----------- | ----------------------------------------------------------- | ------ | ----------------- | -------------------------- |
| MET-010-001 | Week-1 core feature engagement (>=3 free capabilities used) | >= 80% | event telemetry   | aligns to SC-005           |
| MET-010-002 | Free-tier recipe CRUD success rate                          | >= 99% | API telemetry     | successful core operations |
| MET-010-003 | Free-tier retention day-30                                  | >= 35% | account analytics | active free users D30      |

---

### US-010-002: Premium Feature Unlocks

**FRs**: [FR-041](../spec.md#functional-requirements)

| Metric ID   | Metric                                                          | Target  | Source                             | Signal                               |
| ----------- | --------------------------------------------------------------- | ------- | ---------------------------------- | ------------------------------------ |
| MET-010-004 | Premium entitlement propagation delay after successful checkout | <= 60s  | webhook + account state timestamps | checkout complete -> premium active  |
| MET-010-005 | Premium feature first-use rate within 24h of upgrade            | >= 50%  | feature telemetry                  | any premium endpoint success         |
| MET-010-006 | Gated endpoint false-denial rate for active premium users       | <= 0.1% | API error audits                   | erroneous PREMIUM_REQUIRED responses |

---

### US-010-003: Contextual Upgrade Prompting

**FRs**: [FR-042](../spec.md#functional-requirements)

| Metric ID   | Metric                                        | Target                          | Source                   | Signal                                     |
| ----------- | --------------------------------------------- | ------------------------------- | ------------------------ | ------------------------------------------ |
| MET-010-007 | Prompt view-to-CTA click rate                 | >= 20%                          | frontend telemetry       | paywall interaction events                 |
| MET-010-008 | CTA-to-checkout-start rate                    | >= 12%                          | API + frontend telemetry | checkout session created                   |
| MET-010-009 | Accessibility pass rate for prompt components | 100% in CI accessibility checks | test suite               | labeled controls and non-color-only states |

---

### US-010-004: Data-Safe Downgrade

**FRs**: [FR-043](../spec.md#functional-requirements)

| Metric ID   | Metric                                                      | Target | Source                           | Signal                          |
| ----------- | ----------------------------------------------------------- | ------ | -------------------------------- | ------------------------------- |
| MET-010-010 | Post-downgrade data loss incidents                          | 0      | incident tracking                | integrity regressions           |
| MET-010-011 | Non-premium free functionality availability after downgrade | >= 99% | synthetic + telemetry            | core flows still operational    |
| MET-010-012 | Reactivation rate within 60 days of downgrade               | >= 15% | subscription lifecycle analytics | canceled -> premium transitions |

---

## Cross-Story Health Metrics

| Metric                                       | Target                                 | Why                             |
| -------------------------------------------- | -------------------------------------- | ------------------------------- |
| SC-006 premium conversion                    | >= 5% of active free users in 3 months | Monetization baseline from spec |
| Billing confusion support tickets / 1k users | < 5                                    | Quality of UX communication     |
| Webhook idempotency integrity                | 100% duplicate suppression             | Prevent entitlement drift       |
