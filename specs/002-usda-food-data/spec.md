# Feature Specification: USDA Food Data Integration

**Feature Branch**: `002-usda-food-data`
**Created**: 2026-04-14
**Status**: Draft
**Input**: User description: "Integrate USDA FoodData Central as the primary food/nutrition database backing Sous Chef recipes, using the event-driven queue-based architecture (SQS + Lambda + token bucket) for rate-limited async data fetching."

## Clarifications

### Session 2026-04-14

- Q: Are the `/foods/*` API endpoints authenticated or public? → A: Sous Chef shared auth — same auth token/session as the Sous Chef app (shared API Gateway authorizer).
- Q: What versioning strategy for our own food data API? → A: URL prefix versioning — `/v1/foods/{fdcId}`.
- Q: What is the availability target for the food data API layer? → A: 99.9% uptime (~8.7 hours downtime/year).
- Q: What is the canonical distinction between "Food" and "Ingredient"? → A: Food = USDA nutritional record. Ingredient = recipe component that MAY link to a Food via `fdcId`. All foods can be ingredients, but not all ingredients are foods (e.g., spices, oils may lack USDA matches). The link is optional.
- Q: Should we add a formal out-of-scope section? → A: No — implicit boundaries in A-008 and FR-009 are sufficient.

## User Scenarios & Testing _(mandatory)_

<!--
  Architecture reference: docs/architecture/usda/05-event-driven-queue-based.md
  Integration reference: specs/001-sous-chef-recipe-app/spec.md (FR-007, ingredients, meal plans, grocery lists)

  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
-->

### User Story 1 - Single Food Lookup (Cache Hit) (Priority: P1)

A user is creating or viewing a recipe in Sous Chef and the system needs nutritional data for an ingredient. The ingredient's food data already exists in the local data store (PostgreSQL) because it was previously fetched from USDA. The system returns the food's caloric and macronutrient information instantly without any external API call.

**Why this priority**: This is the happy path that covers the majority of requests once the local data store has warmed up. It fulfills FR-007 from the Sous Chef spec ("System MUST back ingredient data with a real food/nutrition database"). Without this, no recipe can display nutritional information.

**Independent Test**: Can be fully tested by seeding the local database with 5 known USDA foods, requesting each by `fdcId`, and verifying the system returns complete nutritional data (calories, protein, carbs, fat) with sub-50ms latency. No USDA API call should be made.

**Acceptance Scenarios**:

1. **Given** a food with `fdcId = 170567` exists in PostgreSQL with `fetch_status = 'fetched'`, **When** the API receives `GET /v1/foods/170567`, **Then** it returns `200 OK` with complete food data including `fdcId`, `description`, calories, protein, carbs, and fat, within 50ms.
2. **Given** a food exists in the Redis cache (full architecture) or PostgreSQL (lean launch), **When** the API receives a lookup request, **Then** the system never calls the USDA FoodData Central API.
3. **Given** a food exists in PostgreSQL but not in the Redis cache, **When** the API receives a lookup request, **Then** the system reads from PostgreSQL, backfills the Redis cache (if present), and returns the data within 50ms.
4. **Given** a food has `fetch_status = 'not_found'` (tombstoned), **When** the API receives a lookup request, **Then** it returns `404 Not Found` with a message indicating the food does not exist in USDA, without queuing any fetch.

---

### User Story 2 - Single Food Lookup (Cache Miss / Async Backfill) (Priority: P1)

A user requests nutritional data for an ingredient that has never been fetched from USDA before. The system immediately acknowledges the request and returns a `202 Accepted` response with a "pending" status. In the background, the system queues a fetch request, the rate-limited consumer retrieves the data from USDA, and the food becomes available for subsequent requests.

**Why this priority**: This is the core async pattern that distinguishes the event-driven architecture. Without it, any food not already in the local store would be a dead end. It enables the system to grow its data organically from user demand.

**Independent Test**: Can be fully tested by requesting a valid `fdcId` that does not exist in the local store, verifying a `202 Accepted` response is returned immediately, waiting for background processing, then re-requesting the same `fdcId` and receiving `200 OK` with full data.

**Acceptance Scenarios**:

1. **Given** a food with `fdcId = 99999` does not exist in the local store, **When** the API receives `GET /v1/foods/99999`, **Then** it returns `202 Accepted` with `{"status": "pending", "fdcId": 99999, "estimatedWaitSeconds": 30}` within 100ms.
2. **Given** a `202 Accepted` was returned for `fdcId = 99999`, **When** the background consumer processes the queued message, **Then** it fetches the food from USDA, stores it in PostgreSQL with `fetch_status = 'fetched'`, caches it in Redis (if present), and removes it from the pending set.
3. **Given** the consumer has successfully fetched `fdcId = 99999`, **When** the API subsequently receives `GET /v1/foods/99999`, **Then** it returns `200 OK` with complete food data.
4. **Given** a food is already pending (queued but not yet fetched), **When** a second request arrives for the same `fdcId`, **Then** the system returns `202 Accepted` without creating a duplicate queue message (deduplication).
5. **Given** the USDA API returns `404` for a requested `fdcId`, **When** the consumer processes the message, **Then** it writes a tombstone record with `fetch_status = 'not_found'` and deletes the SQS message (no further retries).

---

### User Story 3 - Rate-Limited USDA API Consumption (Priority: P1)

The system enforces the USDA FoodData Central rate limit of 1,000 requests per hour using a token bucket algorithm. The consumer Lambda checks the bucket before every USDA API call and pauses processing when tokens are exhausted. If USDA returns a `429 Too Many Requests` despite the bucket, the consumer resets the bucket to zero as a failsafe.

**Why this priority**: Rate limit compliance is a hard operational constraint. Violating it risks having the USDA API key banned, which would break the entire data pipeline. The token bucket is the mechanism that makes the architecture viable.

**Independent Test**: Can be fully tested by configuring the token bucket to a low capacity (e.g., 5 tokens), submitting 10 fetch requests, and verifying that exactly 5 USDA API calls are made before processing pauses, with the remaining 5 processed after token refill.

**Acceptance Scenarios**:

1. **Given** the token bucket has 3 tokens remaining, **When** the consumer attempts to process a message requiring 1 token, **Then** 1 token is consumed atomically, leaving 2 tokens, and the USDA API call proceeds.
2. **Given** the token bucket has 0 tokens, **When** the consumer attempts to process a message, **Then** it extends the SQS message visibility timeout and does not call the USDA API.
3. **Given** the token bucket refills at 16.67 tokens per minute, **When** 1 minute elapses with no consumption, **Then** approximately 16-17 tokens are added (up to the 1,000-token capacity).
4. **Given** the USDA API returns `429 Too Many Requests`, **When** the consumer receives this response, **Then** it resets the token bucket to 0, does not delete the SQS message (it will retry after visibility timeout), and stops processing remaining messages in the batch.
5. **Given** the token bucket state is stored in Redis (full architecture) or PostgreSQL (lean launch), **When** the consumer performs a check-and-consume operation, **Then** the operation is atomic (no race conditions even under concurrent access).

---

### User Story 4 - Bulk Ingredient Lookup for Recipe Import (Priority: P1)

A user imports or creates a recipe with multiple ingredients. The system resolves as many ingredients as possible from the local store immediately, and queues the remaining unknown ingredients for background fetching via the USDA batch endpoint. The batch endpoint accepts up to 20 `fdcIds` per request, consuming only 1 rate-limit token per batch call — maximizing throughput.

**Why this priority**: Recipe creation and import are core Sous Chef workflows (FR-001, FR-008). Recipes typically contain 5-20 ingredients, making batch resolution essential for acceptable UX. Without batch support, a 20-ingredient recipe would consume 20 tokens instead of 1.

**Independent Test**: Can be fully tested by creating a recipe with 15 ingredients where 10 are locally cached and 5 are unknown. Verify the response includes full data for the 10 known ingredients and "pending" status for the 5 unknown ones. Verify the consumer makes exactly 1 USDA batch API call (not 5 individual calls) consuming 1 token.

**Acceptance Scenarios**:

1. **Given** a recipe submission with 15 ingredients where 10 exist locally and 5 do not, **When** the API processes the request, **Then** it returns the 10 resolved foods with full nutritional data and 5 foods with `status: "pending"`.
2. **Given** 5 unknown `fdcIds` are identified during recipe processing, **When** the system queues a fetch, **Then** it publishes a single `FoodBatchRequested` event containing all 5 IDs (not 5 separate events).
3. **Given** the consumer receives a batch message with 5 `fdcIds`, **When** it calls the USDA API, **Then** it uses `POST /v1/foods` with all 5 IDs in one request, consuming exactly 1 token from the bucket.
4. **Given** 3 of 5 unknown `fdcIds` are already in the pending set, **When** the API processes the recipe, **Then** it publishes a `FoodBatchRequested` event containing only the 2 truly new IDs (deduplication applied).
5. **Given** a batch USDA response contains 4 successful results and 1 `404`, **When** the consumer processes the response, **Then** it stores 4 foods as `'fetched'` and 1 as `'not_found'` (tombstone).

---

### User Story 5 - Queue Priority and Failure Recovery (Priority: P1)

The system routes user-facing food lookups to a High Priority SQS queue and background/batch jobs to a Low Priority SQS queue. The consumer always drains the High Priority queue first. Messages that fail 3 processing attempts are routed to a Dead Letter Queue (DLQ) for investigation. USDA `5xx` errors trigger SQS retry; `404` errors result in tombstones (no retry).

**Why this priority**: Priority routing ensures interactive user requests are never starved by bulk background jobs. Failure recovery ensures no data is lost and the system self-heals from transient errors. Without this, the queue would be a FIFO pipe that treats a user waiting for a single food the same as a background job fetching 500 foods.

**Independent Test**: Can be fully tested by submitting 50 low-priority batch requests, then submitting 5 high-priority single lookups, and verifying the consumer processes all 5 high-priority messages before any low-priority messages. Separately, inject a message that will trigger a USDA `5xx` and verify it retries 3 times before landing in the DLQ.

**Acceptance Scenarios**:

1. **Given** the High Priority queue has 5 messages and the Low Priority queue has 50 messages, **When** the consumer polls for work, **Then** it processes all High Priority messages before polling the Low Priority queue.
2. **Given** a single food lookup (`FoodRequested` event), **When** the event is routed by EventBridge, **Then** it lands in the High Priority SQS queue.
3. **Given** a batch recipe import (`FoodBatchRequested` event), **When** the event is routed by EventBridge, **Then** it lands in the Low Priority SQS queue.
4. **Given** the USDA API returns `503 Service Unavailable`, **When** the consumer fails to process the message, **Then** SQS makes the message visible again after the visibility timeout. After 3 failed attempts, the message routes to the DLQ.
5. **Given** a message arrives in the DLQ, **When** CloudWatch detects `ApproximateNumberOfMessagesVisible > 0`, **Then** an alarm fires for operational investigation.
6. **Given** the USDA API returns `404 Not Found` for an `fdcId`, **When** the consumer processes the response, **Then** it writes a tombstone (`fetch_status = 'not_found'`), deletes the SQS message, and does NOT retry.

---

### User Story 6 - Food Search by Name (Priority: P2)

A user types an ingredient name (e.g., "chicken breast") while creating a recipe, and the system returns matching foods from the local PostgreSQL store. Search uses PostgreSQL's `pg_trgm` extension for fuzzy matching, so typos like "avacado" still match "avocado." Only locally-fetched foods are searchable — search does not trigger USDA API calls.

**Why this priority**: Ingredient search is the primary interface between Sous Chef's recipe creation UI and the food data layer. However, it operates entirely on local data and doesn't involve the queue/async pattern — it's a read-only feature that improves incrementally as the local store grows.

**Independent Test**: Can be fully tested by seeding 100 foods into PostgreSQL, searching for known foods by exact name and by misspelled name, and verifying relevant results are returned ranked by relevance within 200ms.

**Acceptance Scenarios**:

1. **Given** 100 foods exist in PostgreSQL, **When** a user searches for "chicken breast", **Then** foods with "chicken breast" in the description are returned, ranked by relevance.
2. **Given** a food with description "Avocado, raw" exists locally, **When** a user searches for "avacado", **Then** the fuzzy search returns the avocado result.
3. **Given** no foods matching a query exist locally, **When** the user searches, **Then** the system returns an empty result set (it does NOT query the USDA API for search).
4. **Given** 10,000 foods in the local store, **When** a search query is executed, **Then** results are returned within 200ms.

---

### User Story 7 - Stale Data Refresh (Priority: P2)

A scheduled EventBridge rule periodically identifies foods in the local store whose data is older than a configurable threshold (default: 30 days). These stale foods are re-queued on the Low Priority queue for background re-fetching from USDA. This ensures nutritional data stays reasonably current without manual intervention.

**Why this priority**: Data freshness is important for accuracy (SC-010 in Sous Chef spec: "Nutritional calculations accurate to within 5% of source database values") but is not blocking for launch. The system works with stale data; refresh is an optimization.

**Independent Test**: Can be fully tested by seeding 10 foods with `fetched_at` older than 30 days, triggering the scheduled refresh, and verifying all 10 are re-queued on the Low Priority queue and re-fetched with updated data.

**Acceptance Scenarios**:

1. **Given** a food was last fetched 31 days ago, **When** the scheduled stale-data check runs, **Then** the food is re-queued on the Low Priority SQS queue with an `IngestionScheduled` event.
2. **Given** a food was last fetched 5 days ago, **When** the scheduled stale-data check runs, **Then** the food is NOT re-queued.
3. **Given** 500 stale foods are identified, **When** they are re-queued, **Then** they are batched into messages of up to 20 `fdcIds` each (25 SQS messages total).
4. **Given** the consumer re-fetches a stale food, **When** USDA returns updated data, **Then** the food record is upserted with the new data and `fetched_at` is updated.

---

### User Story 8 - Fetch Status Polling (Priority: P2)

A client that received a `202 Accepted` response for a food lookup can poll a dedicated status endpoint to check whether the food data has become available. The endpoint returns the current `fetch_status` (`pending`, `fetched`, `failed`, `not_found`) and, once fetched, redirects or includes the full food data.

**Why this priority**: Polling is the simplest client notification mechanism and is the recommended launch approach (Option A from the architecture doc). WebSocket notifications are optional and deferred to P3.

**Independent Test**: Can be fully tested by requesting a food that returns `202`, polling the status endpoint at intervals, and verifying the status transitions from `pending` to `fetched` within 60 seconds.

**Acceptance Scenarios**:

1. **Given** a food with `fetch_status = 'pending'`, **When** the client calls `GET /v1/foods/{fdcId}/status`, **Then** it returns `{"fdcId": 12345, "status": "pending", "estimatedWaitSeconds": 20}`.
2. **Given** a food with `fetch_status = 'fetched'`, **When** the client calls `GET /v1/foods/{fdcId}/status`, **Then** it returns `{"fdcId": 12345, "status": "fetched"}` with the full food data included.
3. **Given** a food with `fetch_status = 'not_found'`, **When** the client calls `GET /v1/foods/{fdcId}/status`, **Then** it returns `{"fdcId": 12345, "status": "not_found"}`.
4. **Given** a food with `fetch_status = 'failed'`, **When** the client calls `GET /v1/foods/{fdcId}/status`, **Then** it returns `{"fdcId": 12345, "status": "failed"}` with a message suggesting the user try again later.

---

### User Story 9 - WebSocket Real-Time Notifications (Priority: P3)

When a food fetch completes asynchronously, the system pushes a real-time notification to connected clients via API Gateway WebSocket API. This eliminates the need for client polling and provides instant UI updates when food data becomes available.

**Why this priority**: WebSocket is an optional UX enhancement. The system is fully functional with polling (US-8). WebSocket should only be added if UX testing shows the polling experience is unacceptable.

**Independent Test**: Can be fully tested by establishing a WebSocket connection, requesting a food that returns `202`, and verifying that a `{"type": "food_ready", "fdcId": 12345}` message is pushed to the WebSocket within 60 seconds of the food being fetched.

**Acceptance Scenarios**:

1. **Given** a client has an active WebSocket connection, **When** the consumer successfully fetches a food the client requested, **Then** a `FoodDataReceived` event triggers a push notification to the client's connection: `{"type": "food_ready", "fdcId": 12345}`.
2. **Given** a client has no active WebSocket connection, **When** a food fetch completes, **Then** no notification is sent (client must use polling as fallback).
3. **Given** a WebSocket connection is established, **When** the connection is idle for more than 10 minutes, **Then** the server closes the connection gracefully and the client can reconnect.

---

### User Story 10 - Monitoring and Observability Dashboard (Priority: P3)

Operations teams can monitor the health of the USDA data pipeline via CloudWatch dashboards and alarms. Key metrics include queue depth, token bucket level, fetch latency (p50/p95/p99), cache hit rate, DLQ accumulation, and USDA API success rate.

**Why this priority**: Observability is critical for production operations but is not required for the data pipeline to function. It can be layered on after the core system is working.

**Independent Test**: Can be fully tested by generating 100 food fetch requests, then verifying CloudWatch metrics are populated: queue depth, token consumption, fetch latency, and cache hit rate are all visible on the dashboard.

**Acceptance Scenarios**:

1. **Given** the system is processing food fetch requests, **When** an operator views the CloudWatch dashboard, **Then** they see real-time metrics for High Priority queue depth, Low Priority queue depth, DLQ depth, token bucket level, and consumer Lambda error rate.
2. **Given** a message lands in the DLQ, **When** CloudWatch evaluates the alarm, **Then** the DLQ alarm fires immediately.
3. **Given** High Priority queue messages are older than 5 minutes, **When** CloudWatch evaluates the alarm, **Then** a queue-age alarm fires.
4. **Given** the consumer successfully fetches a food, **When** the custom metric is emitted, **Then** `food_fetch_latency_seconds` is recorded and visible in the latency distribution dashboard.

---

### Edge Cases

- What happens when a user requests a food with an `fdcId` that is not numeric or is outside the valid range? (System returns `400 Bad Request` immediately, no queuing.)
- What happens when the USDA API is down for an extended period (hours/days)? (Messages accumulate in SQS up to 14-day retention; processing resumes automatically when USDA recovers.)
- What happens when Redis is unavailable? (Full architecture: consumer pauses processing (fail-closed) to avoid uncontrolled USDA API usage; API Lambda falls back to PostgreSQL for reads. Lean launch: not applicable — no Redis dependency.)
- What happens when the token bucket state is lost (Redis restart or PostgreSQL row corruption)? (Bucket resets to full capacity of 1,000 tokens; a burst of up to 1,000 API calls may occur in the first hour before converging to steady-state. This is safe.)
- What happens when hundreds of users request the same new food simultaneously (thundering herd)? (Pending-fetch deduplication ensures only 1 SQS message is created per `fdcId`; only 1 USDA API call is made regardless of demand.)
- What happens when the consumer Lambda times out mid-processing? (SQS makes the message visible again after the visibility timeout; the food will be re-fetched on the next attempt. No data loss.)
- What happens when a food exists in USDA but the batch endpoint returns it without certain nutrient fields? (System stores whatever data USDA provides; missing fields are stored as `null`; the API response indicates which fields are available.)
- What happens when PostgreSQL is unavailable? (Consumer Lambda fails; messages remain in SQS. API Lambda cannot serve any food data. This is a full outage of the food data layer.)
- How does the system handle an `fdcId` that was previously tombstoned (`not_found`) but later becomes valid in USDA? (The stale-data refresh job can be configured to re-check tombstones after a configurable period, e.g., 90 days.)
- How does the system handle recipe ingredients that have no USDA match (e.g., certain spices, oils, or proprietary blends)? (The `fdcId` link on the Sous Chef Ingredient is optional. Ingredients without a linked Food simply have no nutritional data from this system; nutritional summaries for recipes exclude unlinked ingredients or display them as "nutrition unavailable.")

## Requirements _(mandatory)_

<!--
  Constitution reminders (Principles I-VII):
  - All interfaces/types MUST use strict TypeScript; no `any` outside test doubles (Principle I)
  - All exported symbols MUST carry JSDoc; braces required on all control structures (Principle II)
  - New code MUST use aliased imports with .js extensions; no `helpers/` directories (Principle III)
  - New UI elements MUST be queryable by role/label; no `data-testid` (Principles IV & VII)
  - Any new workspace MUST extend shared tooling configs and be declared in Turbo (Principle V)
  - Formatting and lint gates MUST remain green (Principle VI)
  - Interactive elements MUST have accessible names; design tokens MUST be used for color (Principle VII)
-->

### Functional Requirements

**Food Lookup (Read Path)**

- **FR-001**: System MUST serve food data from the local store (PostgreSQL, with optional Redis cache) without calling the USDA API. The API Lambda MUST NOT call USDA directly in the request path.
- **FR-002**: System MUST return `200 OK` with complete food data (fdcId, description, calories, protein, carbs, fat, and available micronutrients) when the requested food exists locally with `fetch_status = 'fetched'`.
- **FR-003**: System MUST return `202 Accepted` with `{"status": "pending", "fdcId": <id>, "estimatedWaitSeconds": <seconds>}` when a requested food does not exist locally and is not already pending.
- **FR-004**: System MUST return `202 Accepted` without re-queuing when a requested food is already in the pending state (deduplication).
- **FR-005**: System MUST return `404 Not Found` for foods with `fetch_status = 'not_found'` (tombstoned records) without queuing a fetch.
- **FR-006**: System MUST validate `fdcId` format (numeric, positive integer) and return `400 Bad Request` for invalid inputs. No invalid input MUST reach the SQS queue.
- **FR-007**: System MUST provide a `GET /v1/foods/{fdcId}/status` endpoint returning the current `fetch_status` and, if `fetched`, the full food data.

**Food Search**

- **FR-008**: System MUST provide a `GET /v1/foods/search?query=...` endpoint that searches the local PostgreSQL store using full-text or trigram-based fuzzy matching (`pg_trgm`).
- **FR-009**: System MUST NOT call the USDA API for search queries. Search operates exclusively on locally-stored food data.
- **FR-010**: Search results MUST be ranked by relevance and returned within 200ms for a local store of up to 50,000 foods.

**Async Backfill (Write Path)**

- **FR-011**: System MUST publish a `FoodRequested` event to EventBridge when a single food lookup results in a cache miss (no local data and not pending).
- **FR-012**: System MUST publish a `FoodBatchRequested` event to EventBridge when a recipe submission or import identifies multiple unknown `fdcIds`, containing all unknown IDs in a single event.
- **FR-013**: System MUST deduplicate fetch requests using a pending-fetch mechanism: Redis Set (`SISMEMBER`/`SADD` on `pending_fetch`) in the full architecture, or PostgreSQL `INSERT ... ON CONFLICT` checking `fetch_status` in the lean launch variant.

**Queue Management**

- **FR-014**: EventBridge MUST route `FoodRequested` events to the High Priority SQS queue and `FoodBatchRequested`/`IngestionScheduled` events to the Low Priority SQS queue.
- **FR-015**: The consumer Lambda MUST poll the High Priority queue first. It MUST only poll the Low Priority queue when the High Priority queue is empty.
- **FR-016**: All SQS queues MUST have a max receive count of 3 before routing failed messages to the Dead Letter Queue (DLQ).
- **FR-017**: The High Priority queue MUST have a visibility timeout of 60 seconds. The Low Priority queue MUST have a visibility timeout of 120 seconds.
- **FR-018**: The DLQ MUST retain messages for 14 days.

**Rate Limiting (Token Bucket)**

- **FR-019**: System MUST enforce a token bucket rate limiter with capacity of 1,000 tokens and a refill rate of 16.67 tokens per minute (1,000 tokens per hour).
- **FR-020**: The token bucket check-and-consume operation MUST be atomic. In the full architecture, this is a Redis Lua script. In the lean launch variant, this is a PostgreSQL `UPDATE ... RETURNING` query.
- **FR-021**: When the token bucket has insufficient tokens, the consumer MUST NOT call the USDA API. It MUST extend the SQS message visibility timeout and skip to the next message.
- **FR-022**: The consumer Lambda MUST run with reserved concurrency of 1 (exactly one consumer instance at any time).

**USDA API Integration**

- **FR-023**: The consumer MUST use `GET /v1/food/{fdcId}` for single-food fetches and `POST /v1/foods` with up to 20 `fdcIds` for batch fetches, consuming 1 token per API call regardless of batch size.
- **FR-024**: On USDA `200 OK`, the consumer MUST upsert the food into PostgreSQL with `fetch_status = 'fetched'`, cache it in Redis (if present), remove it from the pending set, delete the SQS message, and emit a `FoodDataReceived` event.
- **FR-025**: On USDA `404 Not Found`, the consumer MUST write a tombstone record (`fetch_status = 'not_found'`) and delete the SQS message. No retry.
- **FR-026**: On USDA `429 Too Many Requests`, the consumer MUST reset the token bucket to 0 tokens, leave the SQS message undeleted (it will retry after visibility timeout), and stop processing remaining messages in the batch.
- **FR-027**: On USDA `5xx` errors, the consumer MUST leave the SQS message undeleted (SQS handles retry up to 3 times). After 3 failures, the message routes to the DLQ.

**Data Persistence**

- **FR-028**: The `foods` table MUST include: `fdc_id` (primary key), `description`, `data_type`, `nutrients` (JSONB), `fetch_status` (`'pending'` | `'fetched'` | `'failed'` | `'not_found'` | `'stale'`), `fetched_at`, `last_requested_at`, `request_count`, `created_at`, `updated_at`.
- **FR-029**: System MUST index the `foods` table on: `fdc_id` (B-tree primary), `fetch_status` + `fetched_at` (composite, for stale detection), `last_requested_at` (for LRU analysis), and full-text on `description` (GIN index for search).
- **FR-030**: Redis cache entries (if present) MUST use key format `food:{fdcId}` with a TTL of 24 hours and `allkeys-lfu` eviction policy.

**Stale Data Management**

- **FR-031**: System MUST support a configurable staleness threshold (default: 30 days). Foods with `fetched_at` older than the threshold MUST be eligible for background re-fetch.
- **FR-032**: An EventBridge scheduled rule MUST trigger periodic stale-data checks. Stale foods MUST be re-queued on the Low Priority SQS queue via `IngestionScheduled` events.

**Notification**

- **FR-033**: System MUST support client polling via `GET /v1/foods/{fdcId}/status` as the primary notification mechanism for async food availability.
- **FR-034**: System MAY support WebSocket push notifications via API Gateway WebSocket API as an optional enhancement. When implemented, the consumer MUST emit `FoodDataReceived` events that trigger a push to connected clients.

**Authentication**

- **FR-035**: All `/v1/foods/*` API endpoints (`GET /v1/foods/{fdcId}`, `GET /v1/foods/{fdcId}/status`, `GET /v1/foods/search`) MUST require the same authentication as the Sous Chef application (shared API Gateway authorizer). Unauthenticated requests MUST receive `401 Unauthorized`.

### Non-Functional Requirements _(constitution-derived)_

- **NFR-001**: All TypeScript code in the USDA food data workspace MUST compile with `strict: true`; no `any` used outside explicitly marked test doubles. All interfaces for food data, queue messages, and API responses MUST use strict typing with `interface` for data shapes and `type` for unions/aliases. (Constitution Principle I)
- **NFR-002**: All exported functions, classes, interfaces, type aliases, and interface fields MUST carry JSDoc block comments. Lambda handlers, API route handlers, token bucket operations, and queue message processors MUST include `@param`, `@returns`, and `@throws` tags. (Principle II)
- **NFR-003**: All imports within the USDA food data workspace MUST use aliased paths (`@shared/*`, `@web/*`, `@armoury/<pkg>`) with `.js`/`.jsx` extensions. No `helpers/` directories. (Principle III)
- **NFR-004**: If any UI components are created for food data display (e.g., nutritional info cards, pending-food indicators), they MUST expose accessible names queryable via `getByRole`/`getByLabel` in Playwright tests. (Principles IV & VII)
- **NFR-005**: Color MUST NOT be the sole conveyor of food fetch status (pending, fetched, failed, not_found). Each status MUST be paired with a text label or icon. (Principle VII)
- **NFR-006**: The USDA food data workspace MUST be registered in the root `package.json` workspaces array and MUST extend `@armoury/typescript`, `@armoury/eslint`, `@armoury/prettier`, and `@armoury/vitest` shared configs. Turbo task dependencies MUST be declared. (Principle V)
- **NFR-007**: All code MUST pass `turbo run typecheck`, `turbo run lint`, and `turbo run format:check` with zero errors before merge. (Principle VI)
- **NFR-008**: Tests MUST conform to the testing pyramid: >= 70% unit, <= 20% integration, <= 10% E2E. Each test file MUST open with a block comment mapping requirement IDs (FR-xxx) to test case descriptions. (Principle IV)
- **NFR-009**: Custom errors (e.g., `UsdaApiError`, `TokenBucketExhaustedError`, `FoodNotFoundError`) MUST extend `Error` and MUST expose a type guard (`isXxxError(e: unknown): e is XxxError`). (Principle I)
- **NFR-010**: Dates in all food data interfaces MUST be ISO 8601 strings, never `Date` objects. (Principle I)

### Key Entities

- **Food**: Represents a single food item from the USDA FoodData Central database. A "Food" is a USDA nutritional record — distinct from a Sous Chef "Ingredient," which is a recipe component that MAY link to a Food via `fdcId`. All foods can be ingredients, but not all ingredients are foods (e.g., spices, oils may lack USDA matches; the `fdcId` link is optional on the Ingredient side). Key attributes: `fdcId` (unique identifier), `description` (human-readable name), `dataType` (e.g., Foundation, SR Legacy, Branded), `nutrients` (structured nutritional data including calories, protein, carbs, fat, and available micronutrients), `fetchStatus` (pending | fetched | failed | not_found | stale), `fetchedAt` (ISO 8601 timestamp of last successful USDA fetch), `lastRequestedAt` (ISO 8601 timestamp of most recent user request), `requestCount` (number of times this food has been requested). Stored in PostgreSQL; optionally cached in Redis. This entity fulfills Sous Chef FR-007 ("back ingredient data with a real food/nutrition database").

- **FetchRequest**: Represents an intent to retrieve food data from the USDA API. Key attributes: `fdcId` (or array of `fdcIds` for batch), `requestedAt` (ISO 8601), `requestSource` (user-lookup | recipe-import | stale-refresh), `priority` (high | low). Manifests as an EventBridge event and an SQS message. Lifecycle: created by API Lambda on cache miss -> queued in SQS -> consumed by Consumer Lambda -> resolved (food stored or tombstoned).

- **TokenBucketState**: Represents the rate limiter's current state. Key attributes: `tokens` (current available tokens, float, 0-1000), `lastRefill` (ISO 8601 timestamp of last refill calculation). Stored as a Redis hash (`rate_limiter:usda`) in the full architecture or a single PostgreSQL row in the lean launch variant. All mutations are atomic.

- **QueueMessage**: Represents an SQS message in the food fetch pipeline. Key attributes: `fdcId` (single ID) or `batchIds` (array of up to 20 IDs), `requestedAt`, `requestSource`, `priority`. Includes SQS metadata: `receiveCount` (number of processing attempts), `messageId`, `approximateFirstReceiveTimestamp`.

- **FoodDataEvent**: Represents an EventBridge event in the food data lifecycle. Types: `FoodRequested` (API Lambda -> High Priority Queue), `FoodBatchRequested` (API Lambda -> Low Priority Queue), `IngestionScheduled` (EventBridge cron -> Low Priority Queue), `FoodDataReceived` (Consumer Lambda -> WebSocket/notifications), `FetchFailed` (Consumer Lambda -> CloudWatch/SNS).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Food lookups for locally-cached items (cache hit) MUST return within 50ms at p95 latency.
- **SC-002**: The system MUST never exceed 1,000 USDA API requests per hour. Token bucket compliance MUST be verifiable via CloudWatch metrics showing zero `429` responses under normal operation.
- **SC-003**: Background food fetches (from `202 Accepted` to data available) MUST complete within 60 seconds at p95 when the High Priority queue depth is under 100 messages.
- **SC-004**: Cache hit rate MUST exceed 80% once the local store contains 5,000+ unique foods (measured over a rolling 24-hour window).
- **SC-005**: The USDA batch endpoint MUST be used for multi-food fetches, achieving an effective throughput of at least 5,000 foods per hour (average batch fill rate of 5+ IDs per API call).
- **SC-006**: Zero data loss from queue processing failures. All failed messages MUST be captured in the DLQ within 3 retry cycles. DLQ message count MUST be trackable via CloudWatch alarm.
- **SC-007**: Food search queries against a local store of up to 50,000 foods MUST return results within 200ms at p95.
- **SC-008**: Nutritional data stored locally MUST match USDA source values exactly (no rounding or transformation at ingestion). This supports Sous Chef SC-010 ("Nutritional calculations accurate to within 5% of source database values").
- **SC-009**: The food data API (`/v1/foods/*` endpoints) MUST maintain 99.9% availability measured monthly, excluding scheduled maintenance windows communicated 48 hours in advance. Availability is defined as successful responses (2xx/3xx/4xx) divided by total requests; only 5xx responses and timeouts count as downtime.

## Assumptions

- **A-001**: The USDA FoodData Central API rate limit of 1,000 requests per hour per API key is a hard constraint that cannot be increased through paid tiers or support requests within the project timeline.
- **A-002**: The lean launch variant (no Redis, `db.t4g.micro` PostgreSQL) is the default starting configuration. Redis is added when performance thresholds warrant it (p95 read latency > 100ms sustained, or lookup volume > 50K/day).
- **A-003**: Eventual consistency is acceptable for food data. Users tolerate a 10-60 second delay for first-time food lookups in exchange for never blocking on an external API call.
- **A-004**: The USDA API remains publicly available with a free tier and the current `POST /v1/foods` batch endpoint supporting up to 20 IDs per request.
- **A-005**: This feature deploys as an AWS-hosted backend service (Lambda, SQS, EventBridge, RDS, optional ElastiCache) in `us-east-1`. It serves both the web and mobile Sous Chef clients through API Gateway.
- **A-006**: The food data workspace is a new package within the KitchenSink monorepo, following all workspace governance rules from Constitution Principle V.
- **A-007**: Client-side polling (not WebSocket) is the launch notification mechanism. WebSocket (US-9) is deferred until UX testing validates the need.
- **A-008**: The `foods` table schema is purpose-built for this feature. Integration with Sous Chef's `ingredients` entity (linking recipe ingredients to `fdcId` references) is a downstream concern handled by the Sous Chef recipe management feature, not by this specification.
- **A-009**: The USDA API key is stored in AWS Secrets Manager and rotated per AWS best practices. The key is never exposed in client-facing responses or logged. All food data API endpoints share the Sous Chef application's authentication boundary (API Gateway authorizer); no separate auth mechanism is required for this feature.
- **A-010**: All food data API endpoints use URL prefix versioning (`/v1/foods/*`). Breaking changes require a new version prefix (`/v2/foods/*`). The USDA FoodData Central API's own `/v1/` prefix is independent and unrelated to our versioning.
