# Metrics: AI Integration — Story-Level

**Branch**: `005-ai-integration`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](./product-spec.md), [spec.md](../spec.md)
**Distinction from research/metrics-roi.md**: That file covers portfolio-level ROI and operating posture. This file is story-level — per-story measurable outcomes for product teams.

---

## Metric Notation

Each metric is tied to a Must Have user story. "Measurable" means a queryable signal (API telemetry, consent logs, or UX events) with a defined target.

---

## Story-Level Metrics

### US-001: Configure AI Provider (BYOK)

**FRs**: [FR-015](../spec.md#fr-015)

| Metric ID    | Metric                                      | Target | Source        | Signal                                     |
| ------------ | ------------------------------------------- | ------ | ------------- | ------------------------------------------ |
| MET-US001-01 | BYOK setup completion after first AI intent | >= 70% | UX events     | `ai_setup_started` → `ai_setup_completed`  |
| MET-US001-02 | Provider key validation success             | >= 95% | API telemetry | successful key test calls / submitted keys |

---

### US-002: Generate Recipe In-App

**FRs**: [FR-016](../spec.md#fr-016)

| Metric ID    | Metric                           | Target     | Source        | Signal                                      |
| ------------ | -------------------------------- | ---------- | ------------- | ------------------------------------------- |
| MET-US002-01 | Time to generation-ready preview | <= 15s p95 | API telemetry | request accepted to preview-ready timestamp |
| MET-US002-02 | Generation endpoint success rate | >= 98%     | API telemetry | 2xx / total generation requests             |

---

### US-003: Preview and Save Generated Recipe

**FRs**: [FR-017](../spec.md#fr-017), [FR-020](../spec.md#fr-020)

| Metric ID    | Metric                        | Target | Source      | Signal                                         |
| ------------ | ----------------------------- | ------ | ----------- | ---------------------------------------------- |
| MET-US003-01 | Preview-to-save conversion    | >= 35% | UX + API    | `ai_preview_opened` → `recipe_saved`           |
| MET-US003-02 | Incorrect auto-save incidents | 0      | audit query | generated recipes with no explicit save action |

---

### US-004: External Agent OAuth Access

**FRs**: [FR-018](../spec.md#fr-018)

| Metric ID    | Metric                         | Target                       | Source          | Signal                           |
| ------------ | ------------------------------ | ---------------------------- | --------------- | -------------------------------- |
| MET-US004-01 | OAuth consent completion rate  | >= 80% of initiated consents | OAuth telemetry | consent success / consent start  |
| MET-US004-02 | Authorized MCP request success | >= 99%                       | API telemetry   | authorized MCP tool call success |

---

### US-005: Revoke Agent Access

**FRs**: [FR-021](../spec.md#fr-021)

| Metric ID    | Metric                         | Target | Source        | Signal                               |
| ------------ | ------------------------------ | ------ | ------------- | ------------------------------------ |
| MET-US005-01 | Revocation completion success  | >= 99% | API telemetry | revoke success / revoke attempts     |
| MET-US005-02 | Post-revocation blocked access | 100%   | auth logs     | MCP requests denied after revocation |

---

## Summary Coverage Table

| Must Have Story | FR Coverage    | Metric Count |
| --------------- | -------------- | -----------: |
| US-001          | FR-015         |            2 |
| US-002          | FR-016         |            2 |
| US-003          | FR-017, FR-020 |            2 |
| US-004          | FR-018         |            2 |
| US-005          | FR-021         |            2 |

Total story-level metrics: **10**.

---

## Signalfreeze

Metric names and IDs in this document are frozen for the current bootstrap revision. Additions are allowed in future revalidation revisions but existing IDs should remain stable to preserve trend continuity.
