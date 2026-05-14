# User Journeys: USDA Food Data Integration

**Branch**: `003-usda-food-data`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](./product-spec.md), [spec.md](../spec.md)

---

## Journey Notation

Each journey covers one end-to-end flow per persona. Steps reference FR IDs in brackets. P1/P2/P3 markers correspond to story priority from spec.md.

---

## Persona 1: Recipe Author (Avery) — Journey A: Add Ingredient with Mixed Cache State

**Scenario**: Avery creates a recipe with multiple ingredients. Some foods are already fetched locally; some are unknown and must be queued.

```mermaid
sequenceDiagram
    participant U as Avery (Web/Mobile)
    participant API as Foods API
    participant DB as PostgreSQL/Redis
    participant EB as EventBridge
    participant Q as SQS (High/Low)
    participant C as Consumer Lambda
    participant USDA as USDA API

    Note over U,DB: P1 — Local lookup + pending contract

    U->>API: GET /v1/foods/search?query=chicken
    API->>DB: local fuzzy search only
    DB-->>API: ranked results
    API-->>U: food choices (FR-008, FR-009, FR-010)

    U->>API: GET /v1/foods/170567
    API->>DB: lookup fdcId
    DB-->>API: fetched record
    API-->>U: 200 food payload (FR-001, FR-002)

    U->>API: GET /v1/foods/99999
    API->>DB: lookup miss
    API->>EB: publish FoodRequested
    EB->>Q: route to High Priority queue
    API-->>U: 202 pending (FR-003, FR-011, FR-014)

    loop status polling
      U->>API: GET /v1/foods/99999/status
      API->>DB: read fetch_status
      API-->>U: pending/fetched/not_found
    end

    Q->>C: deliver message
    C->>C: token bucket check
    C->>USDA: GET /v1/food/99999
    USDA-->>C: 200 food record
    C->>DB: upsert fetched + cache fill
    C-->>Q: delete message
```

---

## Persona 2: Nutrition-Conscious Planner (Riley) — Journey B: Disambiguate and Validate Nutrition

**Scenario**: Riley chooses between branded and generic foods, monitors nutrient values, and handles missing/unavailable records without breaking planning.

```mermaid
sequenceDiagram
    participant U as Riley
    participant API as Foods API
    participant DB as Local Food Store

    Note over U,DB: P2 — Search quality + nutritional fidelity

    U->>API: GET /v1/foods/search?query=milk
    API->>DB: pg_trgm + FTS query
    DB-->>API: Foundation + Branded matches
    API-->>U: ranked list with data type badges

    U->>U: selects generic vs branded record

    U->>API: GET /v1/foods/{fdcId}
    API->>DB: fetch local nutrient payload
    DB-->>API: nutrients JSON
    API-->>U: nutrition panel data (FR-002, FR-028)

    alt food not found tombstoned
      API-->>U: 404 not_found status
      U->>U: marks ingredient as unmatched/freeform
    end
```

---

## Persona 3: Operations Engineer (Jordan) — Journey C: Maintain Pipeline Reliability Under Load

**Scenario**: Jordan monitors queue pressure and USDA constraints during a spike in uncached food requests.

```mermaid
sequenceDiagram
    participant O as Jordan
    participant CW as CloudWatch
    participant Q as SQS Queues + DLQ
    participant C as Consumer Lambda
    participant USDA as USDA API

    Note over O,USDA: P1/P3 — reliability and observability

    O->>CW: View dashboard (queue depth, token level, latency)
    CW-->>O: high queue depth warning

    C->>C: enforce token bucket
    alt tokens available
      C->>USDA: batch fetch call
      USDA-->>C: 200
    else tokens exhausted
      C->>Q: extend visibility timeout, skip call
    end

    alt repeated 5xx failures
      Q->>Q: message retried 3x then moved to DLQ
      CW-->>O: DLQ alarm fired
    end
```

---

## Cross-Persona Flows

### Flow X1: Pending → Fetched Transition

1. Client receives `202 pending` (FR-003).
2. Background consumer fetches/upserts (FR-024).
3. Status endpoint transitions to `fetched` (FR-033).

### Flow X2: Not Found Tombstone

1. USDA returns 404 (FR-025).
2. Local record marked `not_found`.
3. Future lookups return 404 immediately without requeue (FR-005).

### Flow X3: Rate-Limit Delay Handling

1. Token bucket depleted (FR-019..FR-021).
2. Consumer pauses processing and preserves message retry path.
3. UI remains accurate through pending status rather than timeout/failure mislabeling.

---

## Journey Coverage Matrix

| Story                       | Journey A | Journey B | Journey C   | Cross Flows |
| --------------------------- | --------- | --------- | ----------- | ----------- |
| US-001 Cache-hit lookup     | ✅        | ✅        | —           | —           |
| US-002 Async backfill       | ✅        | —         | ✅          | X1          |
| US-003 Rate limiting        | —         | —         | ✅          | X3          |
| US-004 Batch lookup         | ✅        | —         | ✅          | —           |
| US-005 Queue priority + DLQ | ✅        | —         | ✅          | X2/X3       |
| US-006 Local search         | ✅        | ✅        | —           | —           |
| US-007 Stale refresh        | —         | ✅        | ✅          | —           |
| US-008 Polling status       | ✅        | ✅        | —           | X1/X2       |
| US-009 WebSocket (optional) | —         | —         | ⚪ Deferred | —           |
| US-010 Observability        | —         | —         | ✅          | X3          |
