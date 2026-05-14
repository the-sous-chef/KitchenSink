# Technical Plan: Feature 003 — USDA Food Data Integration

**Feature**: `003-usda-food-data`
**Architecture**: Event-Driven Queue-Based (SQS + Lambda + Token Bucket)
**Reference**: `docs/architecture/usda/05-event-driven-queue-based.md`
**Status**: Draft

---

## 1. Architecture Overview

### System Context

```
USDA FoodData Central (1,000 req/hr limit)
        ↑
        │ (async, rate-limited)
        ↓
SQS Queue (USDA fetch requests)
        ↓
Lambda Consumer (token bucket @ 1,000 req/hr)
        ↓
PostgreSQL (local food store + Redis cache)
        ↑________________________|
        │                      |
REST API Gateway         API Gateway
(Lambda authorizer)      (search queries)
        ↑                      ↑
   Sous Chef App         Search UX
```

### Data Flow

1. **Lookup path** (synchronous): API → PostgreSQL → Redis cache → response (no USDA call)
2. **Fetch path** (async): Cache miss → EventBridge → SQS → Lambda consumer → USDA API → PostgreSQL → mark fetched
3. **Bulk path**: Multiple unknown fdcIds → single `FoodBatchRequested` event → batch Lambda → reduced queue pressure

### Key Architecture Decision

Use Architecture 5 (Event-Driven Queue-Based) per user selection. This treats the USDA rate limit as a first-class constraint and decouples data fetching from data serving.

---

## 2. Data Model

### Core Tables

```sql
-- Local USDA food data store
foods (
  fdc_id INT PRIMARY KEY,          -- USDA FoodData Central ID
  description TEXT,
  data_type TEXT,                  -- 'Foundation' | 'SR Legacy' | 'Branded'
  fetch_status TEXT,              -- 'pending' | 'fetched' | 'not_found' | 'failed'
  last_synced_at TIMESTAMP,
  raw_json JSONB,                  -- Full USDA response
  -- Standard nutrients (per 100g)
  calories DECIMAL,
  protein_g DECIMAL,
  carbs_g DECIMAL,
  fat_g DECIMAL,
  fiber_g DECIMAL,
  sodium_mg DECIMAL,
  -- Extended nutrients
  sugar_g DECIMAL,
  saturated_fat_g DECIMAL,
  cholesterol_mg DECIMAL,
  -- Micros
  vitamin_a_iu DECIMAL,
  vitamin_c_mg DECIMAL,
  calcium_mg DECIMAL,
  iron_mg DECIMAL,
  -- Search vector
  search_vector TSVECTOR,
  -- Branding (Branded Foods only)
  brand_owner TEXT,
  brand_name TEXT,
  upc_code TEXT
)

-- USDA sync metadata
usda_sync_metadata (
  id INT PRIMARY KEY DEFAULT 1,   -- Singleton
  last_full_sync_at TIMESTAMP,
  last_incremental_at TIMESTAMP,
  foundation_version TEXT,
  sr_legacy_version TEXT,
  branded_version TEXT
)

-- Failed fetch tracking
usda_fetch_failures (
  fdc_id INT PRIMARY KEY,
  attempted_at TIMESTAMP,
  failure_reason TEXT,
  attempt_count INT DEFAULT 0
)

-- Pending fetch deduplication (prevents double-queuing)
usda_pending (
  fdc_id INT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  source TEXT                    -- 'single' | 'batch'
)
```

### Integration with 001

The `ingredients` table in 001 already has `usda_fdc_id` and 4 macro columns. 003 extends it with additional nutrient columns and `fetch_status` tracking.

---

## 3. API Contracts

### Endpoints

| Method | Path                            | Auth     | Description                             |
| ------ | ------------------------------- | -------- | --------------------------------------- |
| GET    | `/v1/foods/{fdcId}`             | Required | Get food by USDA FDC ID                 |
| GET    | `/v1/foods/{fdcId}/status`      | Required | Poll fetch status                       |
| GET    | `/v1/foods/search?query=`       | Required | Search local foods                      |
| POST   | `/v1/foods/batch`               | Required | Request batch fetch for multiple fdcIds |
| GET    | `/v1/foods/{fdcId}/nutrients`   | Required | Get full nutrient breakdown             |
| GET    | `/v1/foods/autocomplete?query=` | Required | Autocomplete suggestions                |

### Response Shapes

```typescript
// GET /v1/foods/{fdcId} — success (fetched)
200 OK
{
  "fdcId": 171688,
  "description": "Apple, raw, granny smith",
  "dataType": "Foundation",
  "nutrients": {
    "calories": 58,
    "proteinG": 0.3,
    "carbsG": 13.4,
    "fatG": 0.2,
    "fiberG": 2.4
  },
  "fetchStatus": "fetched"
}

// GET /v1/foods/{fdcId} — pending (async backfill)
202 Accepted
{
  "status": "pending",
  "fdcId": 171688,
  "estimatedWaitSeconds": 3
}

// GET /v1/foods/{fdcId} — not found (tombstoned)
404 Not Found
{
  "error": "Food not found",
  "fdcId": 999999,
  "message": "This food has been tombstoned after failed USDA lookup"
}
```

---

## 4. Event Contracts

### EventBridge Events

```typescript
// Cache miss — single food
FoodRequested {
  eventId: string,
  timestamp: ISO8601,
  fdcId: number,
  requestedBy: string,      // user ID or 'system'
  priority: 'high' | 'normal'
}

// Batch import — multiple foods
FoodBatchRequested {
  eventId: string,
  timestamp: ISO8601,
  fdcIds: number[],
  source: 'import' | 'recipe',
  correlationId: string
}

// Fetch completed — for WebSocket notification
FoodFetchCompleted {
  eventId: string,
  timestamp: ISO8601,
  fdcId: number,
  status: 'fetched' | 'not_found' | 'failed'
}
```

### SQS Queue

**Queue**: `usda-fetch-queue` (Standard)
**DLQ**: `usda-fetch-dlq`
**Rate limiter**: Token bucket in Lambda consumer
**Visibility timeout**: 6× Lambda timeout (allow full processing + 5 retries)

---

## 5. Lambda Functions

### food-fetch-consumer (SQS trigger)

- **Runtime**: Node.js 22.x
- **Memory**: 512 MB
- **Timeout**: 30s
- **Rate limiting**: Token bucket (Redis or in-memory) capped at 1,000 req/hr to USDA API
- **Concurrency**: 5 max (pre-configured reservation)
- **Error handling**: 5 retries with exponential backoff → DLQ

### food-search-indexer (EventBridge trigger)

- Triggered by `FoodFetchCompleted`
- Updates PostgreSQL `search_vector` with new food data
- Invalidates Redis cache

### usda-bulk-sync (EventBridge scheduled)

- Runs weekly (Sunday 2am UTC)
- Downloads Foundation + SR Legacy from USDA bulk files
- Upserts into PostgreSQL
- Updates `usda_sync_metadata`

---

## 6. Resilience & External Services

### USDA API (external)

- **Rate limit**: 1,000 req/hr — enforced via token bucket
- **Timeout**: 10s per request
- **Degraded mode**: If USDA API unavailable, return 503 with retry-after header
- **Circuit breaker**: After 5 consecutive failures, open circuit for 60s

### Redis Cache (optional accelerator)

- **Key pattern**: `food:{fdcId}` → full food JSON
- **TTL**: 1 hour for fetched foods, 5 minutes for pending
- **Cache-aside**: Read-through on cache miss

---

## 7. Migration / Schema Changes

```sql
-- Migration for 003 usda-food-data
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS usda_fdc_id INT REFERENCES foods(fdc_id);
ALTER TABLE ingredients ADD COLUMN fetch_status TEXT DEFAULT 'unlinked';
ALTER TABLE ingredients ADD COLUMN fiber_g_per_100g DECIMAL;
ALTER TABLE ingredients ADD COLUMN sodium_mg_per_100g DECIMAL;
ALTER TABLE ingredients ADD COLUMN serving_size_g DECIMAL;
ALTER TABLE ingredients ADD COLUMN serving_description TEXT;
ALTER TABLE ingredients ADD COLUMN brand_owner TEXT;
ALTER TABLE ingredients ADD COLUMN last_synced_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS usda_sync_metadata (...);
CREATE TABLE IF NOT EXISTS usda_fetch_failures (...);
CREATE TABLE IF NOT EXISTS usda_pending (...);

-- Indexes
CREATE INDEX idx_foods_fetch_status ON foods(fetch_status) WHERE fetch_status = 'pending';
CREATE INDEX idx_foods_search ON foods USING GIN(search_vector);
CREATE INDEX idx_foods_data_type ON foods(data_type);
```

---

## 8. Monitoring & Observability

### CloudWatch Metrics

- `usda-fetch-queue-depth` — SQS queue depth
- `usda-api-request-count` — success/failure rate
- `usda-api-latency` — p50/p95/p99
- `usda-token-bucket-available` — remaining capacity
- `food-cache-hit-rate` — Redis hit rate

### Alarms

- DLQ depth > 0 → SNS alert
- API error rate > 5% → SNS alert
- Queue depth > 10,000 → SNS alert

---

## 9. Open Questions (from Research)

1. **Branded Foods sync**: Full 3.1 GB monthly update vs incremental API — preference?
2. **WebSocket notifications**: Required for P3 (FR-036), deferred or in-scope for initial release?

---

## 10. Implementation Order

1. **PostgreSQL schema** — foods table, indexes, sync metadata
2. **REST API endpoints** — GET /v1/foods/{fdcId}, /status, /search
3. **Redis cache layer** — cache-aside pattern
4. **SQS queue + consumer Lambda** — token bucket rate limiter
5. **EventBridge events** — FoodRequested, FoodBatchRequested
6. **Bulk sync Lambda** — weekly Foundation/SR Legacy download
7. **Monitoring + alarms**
8. **WebSocket notifications** (P3, deferred)
