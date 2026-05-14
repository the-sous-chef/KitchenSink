# Tasks: Feature 003 — USDA Food Data Integration

**Feature**: `003-usda-food-data`
**Architecture**: Event-Driven Queue-Based (SQS + Lambda + Token Bucket)
**Generated**: 2026-05-09
**Source Artifacts**: plan.md, spec.md, research.md

---

## Dependency Graph

```
SETUP (T-001–T-004)
  └─► SCHEMA (T-005–T-008)
        └─► API LAYER (T-009–T-014)
              ├─► QUEUE + CONSUMER (T-015–T-021)
              │     └─► RATE LIMITER (T-022–T-025)
              │           └─► BATCH PROCESSING (T-026–T-029)
              │                 └─► PRIORITY QUEUES (T-030–T-033)
              ├─► SEARCH (T-034–T-037)
              ├─► STALE REFRESH (T-038–T-040)
              ├─► STATUS POLLING (T-041–T-043)
              └─► MONITORING (T-044–T-048)
                    └─► WEBSOCKET [P3, deferred] (T-049–T-052)
```

---

## Phase 0 — Setup & Infrastructure

### T-001 · CDK Stack Scaffold

**Story**: Foundation
**Priority**: P0
**Depends on**: —

Create the CDK stack for feature 003 under `infra/stacks/usda-food-data/`. Define the stack class, environment config, and export outputs (queue URLs, Lambda ARNs, table names) consumed by other stacks.

**Acceptance**:

- `cdk synth` produces valid CloudFormation with no errors
- Stack exports `usdaFetchQueueUrl`, `usdaFetchDlqUrl`, `foodsTableName`

---

### T-002 · Environment Config (Zod)

**Story**: Foundation
**Priority**: P0
**Depends on**: T-001

Add USDA-specific env vars to the Zod schema in `@nestjs/config`:

- `USDA_API_KEY` (required, string)
- `USDA_API_BASE_URL` (default: `https://api.nal.usda.gov/fdc/v1`)
- `USDA_RATE_LIMIT_PER_HOUR` (default: 1000)
- `USDA_TOKEN_BUCKET_STORE` (`redis` | `postgres`, default: `postgres`)
- `USDA_STALE_THRESHOLD_DAYS` (default: 30)

**Acceptance**:

- Missing `USDA_API_KEY` at startup throws a descriptive Zod validation error
- All env vars accessible via `ConfigService` in Lambda and NestJS contexts

---

### T-003 · USDA API Client Module

**Story**: Foundation
**Priority**: P0
**Depends on**: T-002

Create `src/usda/usda-api.client.ts` — a typed HTTP client wrapping the USDA FoodData Central REST API:

- `getFood(fdcId: number): Promise<UsdaFoodDetail>`
- `getFoodsBatch(fdcIds: number[]): Promise<UsdaFoodDetail[]>` (POST `/v1/foods`, max 20 IDs)
- `searchFoods(query: string): Promise<UsdaSearchResult>`
- 10s request timeout
- Throws `UsdaNotFoundError` on 404, `UsdaRateLimitError` on 429, `UsdaServiceError` on 5xx

**Acceptance**:

- Unit tests mock HTTP layer; all error types are thrown correctly
- `getFoodsBatch` rejects arrays > 20 IDs with `InvalidBatchSizeError`

---

### T-004 · Drizzle Schema File for 003

**Story**: Foundation
**Priority**: P0
**Depends on**: T-001

Create `src/db/schema/usda.ts` with Drizzle table definitions for:

- `foods` (all columns from plan.md §2)
- `usda_sync_metadata` (singleton)
- `usda_fetch_failures`
- `usda_pending`

Export all tables from `src/db/schema/index.ts`.

**Acceptance**:

- `drizzle-kit generate` produces valid SQL migration with no errors
- All column types match plan.md §2 exactly

---

## Phase 1 — Database Schema (US-1 foundation)

### T-005 · Migration: `foods` Table

**Story**: US-1 (Single Food Lookup — Cache Hit)
**Priority**: P1
**Depends on**: T-004

Write and apply Drizzle migration creating the `foods` table with all columns from plan.md §2:

- Primary key `fdc_id INT`
- All macro/micro nutrient columns (`DECIMAL`, nullable)
- `fetch_status TEXT` with check constraint (`pending | fetched | not_found | failed`)
- `search_vector TSVECTOR`
- `raw_json JSONB`
- `last_synced_at TIMESTAMP`

**Acceptance**:

- Migration runs cleanly on a fresh PostgreSQL 16 instance
- `fetch_status` check constraint rejects invalid values

---

### T-006 · Migration: Supporting Tables

**Story**: US-1 / US-5
**Priority**: P1
**Depends on**: T-005

Write and apply migrations for:

- `usda_sync_metadata` (singleton row, `id INT PRIMARY KEY DEFAULT 1`)
- `usda_fetch_failures` (`fdc_id`, `error_code`, `failed_at`, `retry_count`)
- `usda_pending` (`fdc_id`, `created_at`, `source`)

**Acceptance**:

- All three tables created; `usda_sync_metadata` has a default row with `id = 1`

---

### T-007 · Migration: Indexes

**Story**: US-1 / US-6
**Priority**: P1
**Depends on**: T-005, T-006

Apply indexes from plan.md §7:

- `idx_foods_fetch_status` — partial index on `fetch_status = 'pending'`
- `idx_foods_search` — GIN index on `search_vector`
- `idx_foods_data_type` — btree on `data_type`
- `idx_foods_upc` — btree on `upc_code` (nullable, for branded foods)

Enable `pg_trgm` extension for fuzzy search.

**Acceptance**:

- `EXPLAIN ANALYZE` on `search_vector @@ to_tsquery(...)` shows GIN index scan
- `EXPLAIN ANALYZE` on `fetch_status = 'pending'` shows partial index scan

---

### T-008 · Migration: `ingredients` Table Extensions

**Story**: US-4 (Bulk Ingredient Lookup)
**Priority**: P1
**Depends on**: T-005

Apply `ALTER TABLE ingredients` from plan.md §7:

- `usda_fdc_id INT REFERENCES foods(fdc_id)` (nullable FK)
- `fetch_status TEXT DEFAULT 'unlinked'`
- `fiber_g_per_100g DECIMAL`
- `sodium_mg_per_100g DECIMAL`
- `serving_size_g DECIMAL`
- `serving_description TEXT`
- `brand_owner TEXT`
- `last_synced_at TIMESTAMP`

**Acceptance**:

- Migration is idempotent (`IF NOT EXISTS` / `IF NOT EXISTS` guards)
- FK constraint enforced; `NULL` allowed (ingredient may have no USDA match)

---

## Phase 2 — REST API Layer (US-1, US-8)

### T-009 · NestJS Module: `FoodsModule`

**Story**: US-1
**Priority**: P1
**Depends on**: T-005, T-006, T-007

Scaffold `src/foods/foods.module.ts` with:

- `FoodsController` (routes)
- `FoodsService` (business logic)
- `FoodsRepository` (Drizzle queries)
- Import `UsdaApiModule`, `CacheModule`, `EventBridgeModule`

**Acceptance**:

- Module bootstraps without errors in NestJS app
- All providers injectable via DI

---

### T-010 · `GET /v1/foods/{fdcId}` — Cache Hit Path

**Story**: US-1
**Priority**: P1
**Depends on**: T-009

Implement the synchronous lookup path:

1. Validate `fdcId` is a positive integer (400 on invalid)
2. Check Redis cache (`food:{fdcId}`) → return 200 if hit
3. Check PostgreSQL `foods` table → return 200 if `fetch_status = 'fetched'`
4. If `fetch_status = 'not_found'` → return 404 with tombstone message
5. Backfill Redis cache on PostgreSQL hit

Response shape per plan.md §3.

**Acceptance**:

- Cache hit returns 200 within 50ms (per spec US-1 scenario 3)
- Tombstoned food returns 404 without queuing (US-1 scenario 4)
- Invalid `fdcId` (non-numeric, negative) returns 400

---

### T-011 · `GET /v1/foods/{fdcId}` — Cache Miss / 202 Path

**Story**: US-2
**Priority**: P1
**Depends on**: T-010

Extend the lookup handler for the async backfill path:

1. Food not in local store → check `usda_pending` for deduplication
2. If not pending: insert into `usda_pending`, publish `FoodRequested` EventBridge event
3. Return `202 Accepted` with `{ status: "pending", fdcId, estimatedWaitSeconds: 30 }`
4. If already pending: return `202 Accepted` without publishing duplicate event

**Acceptance**:

- First request for unknown food returns 202 within 100ms (US-2 scenario 1)
- Second request for same pending food returns 202 without duplicate SQS message (US-2 scenario 4)
- `usda_pending` row created on first request, not duplicated on second

---

### T-012 · `GET /v1/foods/{fdcId}/status`

**Story**: US-8
**Priority**: P2
**Depends on**: T-010

Implement the status polling endpoint:

- Query `foods.fetch_status` for the given `fdcId`
- `pending` → `{ fdcId, status: "pending", estimatedWaitSeconds: 20 }`
- `fetched` → `{ fdcId, status: "fetched", ...fullFoodData }`
- `not_found` → `{ fdcId, status: "not_found" }`
- `failed` → `{ fdcId, status: "failed", message: "..." }`
- Food not in DB at all → 404

**Acceptance**:

- All four status transitions return correct shapes (US-8 scenarios 1–4)
- `fetched` response includes full nutrient data

---

### T-013 · `GET /v1/foods/search?query=`

**Story**: US-6
**Priority**: P2
**Depends on**: T-007, T-009

Implement full-text + fuzzy search:

- Use `search_vector @@ plainto_tsquery(query)` for FTS
- Fall back to `pg_trgm` similarity for short/misspelled queries
- Return max 20 results ranked by relevance (`ts_rank`)
- Never calls USDA API (local-only)
- `GET /v1/foods/autocomplete?query=` — same logic, returns `[{ fdcId, description }]` (max 10)

**Acceptance**:

- "chicken breast" returns relevant results (US-6 scenario 1)
- "avacado" returns avocado via fuzzy match (US-6 scenario 2)
- Empty result set returned (not USDA call) when no local match (US-6 scenario 3)
- 10,000-food dataset returns results within 200ms (US-6 scenario 4)

---

### T-014 · `GET /v1/foods/{fdcId}/nutrients`

**Story**: US-1 / US-4
**Priority**: P2
**Depends on**: T-010

Implement the full nutrient breakdown endpoint:

- Returns all macro + micro columns from `foods` table
- Includes `raw_json` nutrient array from USDA response
- 404 if food not fetched yet (with pending status hint)

**Acceptance**:

- Returns all nutrient fields including micros (vitamin_a, vitamin_c, calcium, iron)
- Null fields included in response (not omitted)

---

## Phase 3 — SQS Queue + Lambda Consumer (US-2, US-3)

### T-015 · CDK: SQS Queues

**Story**: US-2 / US-5
**Priority**: P1
**Depends on**: T-001

Define in CDK:

- `usda-fetch-queue-high` (Standard, visibility timeout 180s = 6 × 30s Lambda timeout)
- `usda-fetch-queue-low` (Standard, same config)
- `usda-fetch-dlq` (Standard, maxReceiveCount: 3)
- Wire DLQ to both queues

**Acceptance**:

- `cdk synth` shows both queues with correct DLQ config
- Visibility timeout = 6 × Lambda timeout (plan.md §4)

---

### T-016 · CDK: EventBridge Rules

**Story**: US-2 / US-4 / US-5
**Priority**: P1
**Depends on**: T-015

Define EventBridge rules routing:

- `FoodRequested` → High Priority SQS queue (US-5 scenario 2)
- `FoodBatchRequested` → Low Priority SQS queue (US-5 scenario 3)
- `FoodFetchCompleted` → `food-search-indexer` Lambda

**Acceptance**:

- `cdk synth` shows correct event patterns and targets
- `FoodRequested` and `FoodBatchRequested` route to different queues

---

### T-017 · Lambda: `food-fetch-consumer` Scaffold

**Story**: US-2
**Priority**: P1
**Depends on**: T-015, T-016

Create `src/lambdas/food-fetch-consumer/handler.ts`:

- SQS trigger (batch size: 1 for High Priority, 5 for Low Priority)
- Node.js 22.x, 512 MB, 30s timeout, max concurrency: 5
- Structured logging via `@aws-lambda-powertools/logger`
- Sentry error capture via `@sentry/aws-serverless`

**Acceptance**:

- Lambda deploys and processes a test SQS message without errors
- Powertools logger emits structured JSON logs

---

### T-018 · Consumer: Single Food Fetch Flow

**Story**: US-2
**Priority**: P1
**Depends on**: T-017, T-003

Implement the single-food fetch flow in the consumer:

1. Parse `FoodRequested` message
2. Check token bucket (consume 1 token or extend visibility timeout)
3. Call `UsdaApiClient.getFood(fdcId)`
4. On 200: upsert into `foods` with `fetch_status = 'fetched'`, delete from `usda_pending`
5. On 404: write tombstone (`fetch_status = 'not_found'`), delete SQS message
6. On 5xx: do NOT delete SQS message (allow retry)
7. Publish `FoodFetchCompleted` event

**Acceptance**:

- Successful fetch: food in DB with `fetch_status = 'fetched'`, pending row deleted (US-2 scenario 2)
- USDA 404: tombstone written, no retry (US-2 scenario 5)
- USDA 5xx: message not deleted, retried (US-5 scenario 4)

---

### T-019 · Consumer: Batch Food Fetch Flow

**Story**: US-4
**Priority**: P1
**Depends on**: T-018

Implement the batch fetch flow:

1. Parse `FoodBatchRequested` message (up to 20 fdcIds)
2. Consume exactly 1 token from bucket (not N tokens)
3. Call `UsdaApiClient.getFoodsBatch(fdcIds)`
4. For each result: upsert `fetch_status = 'fetched'`
5. For each 404 in batch response: write tombstone
6. Delete from `usda_pending` for all processed IDs
7. Publish `FoodFetchCompleted` for each ID

**Acceptance**:

- 5 IDs in batch → 1 token consumed (US-4 scenario 3)
- Mixed 200/404 batch: 4 fetched + 1 tombstoned (US-4 scenario 5)

---

### T-020 · Lambda: `food-search-indexer`

**Story**: US-6
**Priority**: P2
**Depends on**: T-018

Create `src/lambdas/food-search-indexer/handler.ts`:

- Triggered by `FoodFetchCompleted` EventBridge event
- Updates `search_vector` column: `to_tsvector('english', description)`
- Invalidates Redis cache key `food:{fdcId}`

**Acceptance**:

- After fetch, `search_vector` is populated and food appears in search results
- Redis cache invalidated (next read re-populates from DB)

---

### T-021 · `POST /v1/foods/batch`

**Story**: US-4
**Priority**: P1
**Depends on**: T-011, T-016

Implement the batch request endpoint:

1. Accept `{ fdcIds: number[] }` (max 20, validated)
2. Resolve known foods from PostgreSQL
3. Identify unknown IDs (not in `foods` or `usda_pending`)
4. Deduplicate against `usda_pending`
5. Publish single `FoodBatchRequested` event with only new IDs
6. Return: resolved foods + pending IDs

**Acceptance**:

- 15 ingredients (10 known, 5 unknown) → 10 resolved + 5 pending (US-4 scenario 1)
- 5 unknown IDs → 1 `FoodBatchRequested` event (US-4 scenario 2)
- 3 of 5 already pending → event contains only 2 new IDs (US-4 scenario 4)

---

## Phase 4 — Token Bucket Rate Limiter (US-3)

### T-022 · Token Bucket: Interface & PostgreSQL Implementation

**Story**: US-3
**Priority**: P1
**Depends on**: T-006

Create `src/usda/token-bucket/`:

- `ITokenBucket` interface: `consume(n: number): Promise<boolean>`, `reset(): Promise<void>`, `available(): Promise<number>`
- `PostgresTokenBucket` implementation using `usda_sync_metadata` row for atomic state
- Atomic check-and-consume via `UPDATE ... WHERE available_tokens >= n RETURNING available_tokens`
- Refill logic: calculate tokens earned since `last_refill_at` at 16.67/min rate

**Acceptance**:

- Concurrent consume calls are atomic (no race condition under 5 concurrent Lambdas)
- Refill adds ~16–17 tokens per minute up to 1,000 cap (US-3 scenario 3)
- `consume(1)` with 3 tokens remaining → returns `true`, leaves 2 tokens (US-3 scenario 1)

---

### T-023 · Token Bucket: Redis Implementation

**Story**: US-3
**Priority**: P2
**Depends on**: T-022

Create `RedisTokenBucket` implementation using Redis atomic Lua script:

- Lua script for atomic check-and-consume (no TOCTOU race)
- Key: `usda:token_bucket`
- TTL-based refill via scheduled Lambda or inline refill on consume

**Acceptance**:

- Lua script executes atomically; concurrent calls never over-consume
- Falls back to `PostgresTokenBucket` if Redis unavailable

---

### T-024 · Consumer: Token Bucket Integration

**Story**: US-3
**Priority**: P1
**Depends on**: T-022, T-018

Integrate token bucket into `food-fetch-consumer`:

- Before each USDA API call: `await tokenBucket.consume(1)`
- If `consume` returns `false` (0 tokens): extend SQS visibility timeout by 60s, do not call USDA (US-3 scenario 2)
- On USDA 429 response: call `tokenBucket.reset()`, stop processing batch (US-3 scenario 4)

**Acceptance**:

- 0 tokens → visibility timeout extended, no USDA call (US-3 scenario 2)
- USDA 429 → bucket reset to 0, message not deleted (US-3 scenario 4)

---

### T-025 · Token Bucket: Unit Tests

**Story**: US-3
**Priority**: P1
**Depends on**: T-022, T-023

Write unit tests for both `PostgresTokenBucket` and `RedisTokenBucket`:

- Consume with sufficient tokens
- Consume with 0 tokens (returns false)
- Refill rate (mock time)
- Concurrent consume (mock DB/Redis for atomicity)
- Reset to 0

**Acceptance**:

- All scenarios from US-3 acceptance criteria covered
- Tests pass with `npm test`

---

## Phase 5 — Priority Queues & Failure Recovery (US-5)

### T-026 · Consumer: High vs Low Priority Polling

**Story**: US-5
**Priority**: P1
**Depends on**: T-017

Implement priority-aware polling in the consumer:

- Poll High Priority queue first (long-poll 20s)
- Only poll Low Priority queue when High Priority is empty
- Configurable via `USDA_HIGH_PRIORITY_QUEUE_URL` / `USDA_LOW_PRIORITY_QUEUE_URL`

**Acceptance**:

- 5 high + 50 low priority messages → all 5 high processed before any low (US-5 scenario 1)

---

### T-027 · DLQ Alarm & Reprocessing

**Story**: US-5
**Priority**: P1
**Depends on**: T-015

CDK: Create CloudWatch alarm on DLQ depth > 0 → SNS alert.

Create `src/lambdas/usda-dlq-reprocessor/handler.ts`:

- Manual trigger (EventBridge scheduled or on-demand)
- Reads DLQ messages, logs structured error context, optionally re-queues to Low Priority

**Acceptance**:

- DLQ alarm fires when depth > 0 (US-5 scenario 5)
- Reprocessor Lambda deploys without errors

---

### T-028 · Retry Logic: Exponential Backoff

**Story**: US-5
**Priority**: P1
**Depends on**: T-018

Implement retry tracking in `food-fetch-consumer`:

- On USDA 5xx: increment `usda_fetch_failures.retry_count`, do not delete SQS message
- After 3 failures: SQS routes to DLQ automatically (maxReceiveCount: 3)
- On USDA 404: write tombstone, delete SQS message immediately (no retry)

**Acceptance**:

- USDA 5xx → message retried 3 times → lands in DLQ (US-5 scenario 4)
- USDA 404 → tombstone written, no DLQ entry (US-2 scenario 5)

---

### T-029 · Circuit Breaker

**Story**: US-5
**Priority**: P2
**Depends on**: T-024

Implement circuit breaker in `UsdaApiClient`:

- After 5 consecutive failures: open circuit for 60s (plan.md §6)
- Open circuit: return `UsdaCircuitOpenError` without making HTTP call
- Half-open after 60s: allow 1 probe request

**Acceptance**:

- 5 consecutive 5xx → circuit opens, next call throws `UsdaCircuitOpenError`
- After 60s: circuit half-opens, probe request allowed

---

## Phase 6 — Stale Data Refresh (US-7)

### T-030 · Lambda: `usda-stale-refresh`

**Story**: US-7
**Priority**: P2
**Depends on**: T-015, T-016

Create `src/lambdas/usda-stale-refresh/handler.ts`:

- EventBridge scheduled rule: daily at 3am UTC
- Query `foods` where `last_synced_at < NOW() - INTERVAL '30 days'` AND `fetch_status = 'fetched'`
- Publish `FoodBatchRequested` events (batches of 20) to Low Priority queue
- Configurable threshold via `USDA_STALE_THRESHOLD_DAYS`

**Acceptance**:

- Food fetched 31 days ago → re-queued on Low Priority (US-7 scenario 1)
- Food fetched 5 days ago → not re-queued (US-7 scenario 2)
- Tombstoned foods (`not_found`) → never re-queued (US-7 scenario 3)

---

### T-031 · Lambda: `usda-bulk-sync`

**Story**: US-7 (bulk variant)
**Priority**: P2
**Depends on**: T-005, T-006

Create `src/lambdas/usda-bulk-sync/handler.ts`:

- EventBridge scheduled: Sunday 2am UTC (plan.md §5)
- Downloads Foundation + SR Legacy bulk files from USDA
- Upserts into `foods` table (batch inserts, 1,000 rows/batch)
- Updates `usda_sync_metadata` with version and timestamp

**Acceptance**:

- Lambda completes without timeout for a 10,000-row test dataset
- `usda_sync_metadata` updated after successful run

---

## Phase 7 — Monitoring & Observability (US-10)

### T-032 · CloudWatch Dashboard

**Story**: US-10
**Priority**: P2
**Depends on**: T-015, T-017

CDK: Create CloudWatch dashboard `usda-food-data`:

- High Priority queue depth
- Low Priority queue depth
- DLQ depth
- Token bucket available tokens (`usda-token-bucket-available`)
- Consumer Lambda error rate
- `food_fetch_latency_seconds` distribution
- Cache hit rate (`food-cache-hit-rate`)

**Acceptance**:

- Dashboard visible in CloudWatch console after `cdk deploy`
- All 7 widgets populated after processing 100 test requests (US-10 scenario 1)

---

### T-033 · CloudWatch Alarms

**Story**: US-10
**Priority**: P2
**Depends on**: T-032

CDK: Create alarms from plan.md §8:

- DLQ depth > 0 → SNS alert (US-10 scenario 2)
- API error rate > 5% → SNS alert
- Queue depth > 10,000 → SNS alert
- High Priority queue message age > 5 minutes → SNS alert (US-10 scenario 3)

**Acceptance**:

- All 4 alarms created in CDK synth
- DLQ alarm fires immediately when depth > 0 (US-10 scenario 2)

---

### T-034 · Custom Metrics Emission

**Story**: US-10
**Priority**: P2
**Depends on**: T-018

Emit custom CloudWatch metrics from `food-fetch-consumer`:

- `food_fetch_latency_seconds` — time from SQS enqueue to DB write
- `usda_api_request_count` — success/failure dimensions
- `usda_token_bucket_available` — after each consume

**Acceptance**:

- Metrics visible in CloudWatch after processing test messages (US-10 scenario 4)

---

## Phase 8 — Auth Integration (FR-035)

### T-035 · Lambda Authorizer Integration

**Story**: FR-035
**Priority**: P1
**Depends on**: T-009

Wire the shared API Gateway Lambda authorizer from feature 002 to all `/v1/foods/*` routes:

- All 6 endpoints require valid Auth0 JWT
- Authorizer ARN injected via CDK cross-stack reference

**Acceptance**:

- Unauthenticated request to any `/v1/foods/*` endpoint returns 401
- Valid Auth0 token returns expected response

---

## Phase 9 — WebSocket Notifications [P3 — Deferred]

### T-036 · CDK: API Gateway WebSocket API

**Story**: US-9
**Priority**: P3
**Depends on**: T-018

> **Deferred**: Implement only if polling UX (US-8) is validated as insufficient.

Create API Gateway WebSocket API:

- `$connect` / `$disconnect` routes
- Store connection IDs in DynamoDB (`usda_ws_connections`)
- Associate `fdcId` subscriptions with connection IDs

**Acceptance**:

- Client can establish WebSocket connection with valid Auth0 token
- Connection ID stored in DynamoDB on connect, removed on disconnect

---

### T-037 · WebSocket: Push Notification on Fetch Complete

**Story**: US-9
**Priority**: P3
**Depends on**: T-036

Extend `food-search-indexer` Lambda to push WebSocket notification:

- On `FoodFetchCompleted` event: look up subscribed connection IDs for `fdcId`
- Push `{ type: "food_ready", fdcId }` via `ApiGatewayManagementApi`
- Handle stale connections (410 Gone → delete from DynamoDB)

**Acceptance**:

- Connected client receives push within 60s of food being fetched (US-9 scenario 1)
- Stale connection cleaned up without error (US-9 scenario 3)

---

## Phase 10 — Integration Tests

### T-038 · Integration Test: Cache Hit Path (US-1)

**Story**: US-1
**Priority**: P1
**Depends on**: T-010

Write integration tests (Jest + testcontainers PostgreSQL):

- Seed food with `fetch_status = 'fetched'`
- `GET /v1/foods/{fdcId}` → 200 with full data
- Tombstoned food → 404
- Invalid fdcId → 400

---

### T-039 · Integration Test: Async Backfill (US-2)

**Story**: US-2
**Priority**: P1
**Depends on**: T-011, T-018

Write integration tests (mock USDA API):

- Unknown food → 202 Accepted
- Duplicate request → 202 without duplicate SQS message
- Consumer processes message → food in DB with `fetch_status = 'fetched'`
- USDA 404 → tombstone

---

### T-040 · Integration Test: Rate Limiter (US-3)

**Story**: US-3
**Priority**: P1
**Depends on**: T-024, T-025

Write integration tests:

- Configure bucket to 5 tokens
- Submit 10 requests → exactly 5 USDA calls made
- Remaining 5 processed after token refill (mock time)
- USDA 429 → bucket reset to 0

---

### T-041 · Integration Test: Batch Processing (US-4)

**Story**: US-4
**Priority**: P1
**Depends on**: T-021

Write integration tests:

- 15 ingredients (10 known, 5 unknown) → correct split
- Deduplication against pending set
- Batch USDA response with mixed 200/404

---

### T-042 · Integration Test: Priority Queues (US-5)

**Story**: US-5
**Priority**: P1
**Depends on**: T-026

Write integration tests:

- 50 low + 5 high priority messages → high processed first
- 3 USDA 5xx retries → DLQ

---

### T-043 · Integration Test: Search (US-6)

**Story**: US-6
**Priority**: P2
**Depends on**: T-013

Write integration tests (testcontainers PostgreSQL with pg_trgm):

- Seed 100 foods
- Exact match search
- Fuzzy match ("avacado" → avocado)
- Empty result set (no USDA call)
- Performance: 10,000 foods, < 200ms

---

## Summary

| Phase                   | Tasks       | Priority | Stories                |
| ----------------------- | ----------- | -------- | ---------------------- |
| 0 — Setup               | T-001–T-004 | P0       | Foundation             |
| 1 — Schema              | T-005–T-008 | P1       | US-1, US-4             |
| 2 — REST API            | T-009–T-014 | P1/P2    | US-1, US-2, US-6, US-8 |
| 3 — SQS + Consumer      | T-015–T-021 | P1/P2    | US-2, US-4             |
| 4 — Token Bucket        | T-022–T-025 | P1/P2    | US-3                   |
| 5 — Priority + Recovery | T-026–T-029 | P1/P2    | US-5                   |
| 6 — Stale Refresh       | T-030–T-031 | P2       | US-7                   |
| 7 — Monitoring          | T-032–T-034 | P2       | US-10                  |
| 8 — Auth                | T-035       | P1       | FR-035                 |
| 9 — WebSocket [P3]      | T-036–T-037 | P3       | US-9                   |
| 10 — Integration Tests  | T-038–T-043 | P1/P2    | All                    |

**Total tasks: 43**
**P0**: 4 · **P1**: 24 · **P2**: 12 · **P3**: 2 (deferred)

### Implementation Order (per plan.md §10)

1. T-001–T-004 (Setup)
2. T-005–T-008 (Schema)
3. T-009–T-011 (Core API — cache hit + 202 path)
4. T-015–T-019 (SQS + Consumer + single/batch fetch)
5. T-022–T-025 (Token bucket)
6. T-026–T-029 (Priority queues + failure recovery)
7. T-012–T-014, T-021 (Remaining API endpoints)
8. T-030–T-031 (Stale refresh + bulk sync)
9. T-032–T-035 (Monitoring + auth)
10. T-038–T-043 (Integration tests)
11. T-036–T-037 (WebSocket — P3, deferred)
