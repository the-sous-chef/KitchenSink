# Tech Stack Rationale

**Branch**: `003-usda-food-data` | **Date**: 2026-05-09
**Status**: Complete | **Sources**: [plan.md](../plan.md), [research.md](../research.md), [spec.md](../spec.md)

---

## Overview

Feature 003 chooses a queue-centric AWS architecture that treats USDA rate limiting as a first-class system constraint. The selected stack optimizes predictable request-path latency and operational resilience over synchronous freshness.

---

## API Layer: Local-Store-First Food Endpoints

### Choice

API reads from PostgreSQL (optional Redis) and never calls USDA directly on request path.

### Rationale

- Required by FR-001 and FR-009.
- Guarantees low, predictable latency for cache-hit reads.
- Isolates client experience from external API outages.

### Trade-offs

| Trade-off                            | Mitigated By                                      |
| ------------------------------------ | ------------------------------------------------- |
| Eventual consistency on first lookup | Pending-status contract + polling                 |
| Extra infrastructure complexity      | Deterministic queue/event model and observability |

---

## Persistence: PostgreSQL + Optional Redis

### Choice

PostgreSQL as durable source of truth; Redis optional accelerator for full architecture.

### Rationale

- PostgreSQL supports status lifecycle, JSON nutrients, and indexed search.
- Lean launch supports PostgreSQL-only path (A-002).
- Redis enables lower p95 reads and token-bucket LUA option at scale.

### Trade-offs

| Trade-off                           | Mitigated By                                 |
| ----------------------------------- | -------------------------------------------- |
| Redis operational overhead          | Start lean; add only when threshold exceeded |
| PostgreSQL-only higher read latency | Use indexing + targeted cache layer rollout  |

---

## Search: PostgreSQL FTS + pg_trgm

### Choice

Local fuzzy search using PostgreSQL full-text + trigram matching.

### Rationale

- Explicit FR requirement (FR-008, FR-010).
- Keeps search completely local (FR-009).
- Supports search-as-you-type with typo tolerance.

---

## Async Pipeline: EventBridge + SQS + Lambda

### Choice

Event-driven queue-based architecture with High/Low queues and DLQ.

### Rationale

- Matches selected architecture in plan.
- Supports priority handling for user-facing misses vs bulk/stale jobs.
- Naturally composes retry semantics and dead-letter capture.

### Trade-offs

| Trade-off                          | Mitigated By                                |
| ---------------------------------- | ------------------------------------------- |
| Message-order and retry complexity | Idempotent upsert + pending dedupe strategy |
| Operational tuning burden          | CloudWatch metrics and alarms from day one  |

---

## Rate Limiting: Token Bucket (Redis or PostgreSQL Atomic)

### Choice

Token bucket capacity 1,000 with refill 16.67/min, enforced in consumer before USDA call.

### Rationale

- Direct mapping to USDA external limit and FR-019..FR-022.
- Allows deterministic “skip + visibility extension” behavior under exhaustion.

### Trade-offs

| Trade-off                                                | Mitigated By                               |
| -------------------------------------------------------- | ------------------------------------------ |
| Under-utilization risk with conservative bucket behavior | Batch endpoint usage (FR-023, SC-005)      |
| Complexity of atomicity                                  | Single-consumer + atomic DB/Lua operations |

---

## USDA Integration Mode

### Choice

- Single fetch: `GET /v1/food/{fdcId}`
- Batch fetch: `POST /v1/foods` up to 20 IDs

### Rationale

- Required by FR-023.
- Batch mode amortizes token consumption and boosts throughput.

---

## Observability Stack

### Choice

CloudWatch metrics, alarms, and dashboard-first operations with DLQ and queue-age alerts.

### Rationale

- Required for SC-006/SC-009 operational confidence.
- Supports P3 observability user story without changing core architecture.

---

## Research Question Mapping

| Research Question                 | Stack Decision                                             |
| --------------------------------- | ---------------------------------------------------------- |
| RQ-1 (data types)                 | Preserve USDA data type distinctions in UI and persistence |
| RQ-2 (API/rate limits)            | Queue + token bucket mandatory                             |
| RQ-3 (alternative APIs)           | USDA-first; no paid API dependency at launch               |
| RQ-4 (TypeScript implementations) | Typed client + explicit error taxonomy                     |
| RQ-5 (Lambda + SQS patterns)      | High/Low queue strategy + DLQ + retry model                |
| RQ-6/RQ-7 (integration pipeline)  | Optional ingredient linkage path with async backfill       |
| RQ-8 (UX lookup patterns)         | Search-as-you-type + disambiguation + pending status       |
