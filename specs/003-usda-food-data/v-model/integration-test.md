# Integration Test Plan: USDA Food Data Integration

**Feature Branch**: `003-usda-food-data`
**Created**: 2026-05-09
**Status**: Draft
**Source**: `specs/003-usda-food-data/v-model/architecture-design.md`

## Overview

This document defines the Integration Test Plan for the USDA Food Data Integration feature. Every architecture module in `architecture-design.md` has one or more Test Cases (ITP), and every Test Case has one or more executable Integration Scenarios (ITS) in module-boundary BDD format (Given/When/Then).

Integration tests verify **seams and handshakes between modules**, not internal logic or user journeys. Language is module-boundary-oriented. The USDA API is never called in the request path — all user-facing lookups are served from local storage (PostgreSQL + Redis). Cache misses trigger an event-driven backfill pipeline: ARCH-001 → ARCH-002 → ARCH-003 → SQS → ARCH-004 → ARCH-005 → ARCH-008 → ARCH-006 → ARCH-007.

## ID Schema

- **Integration Test Case**: `ITP-{NNN}-{X}` — where NNN matches the parent ARCH, X is a letter suffix (A, B, C...)
- **Integration Test Scenario**: `ITS-{NNN}-{X}{#}` — nested under the parent ITP, with numeric suffix (1, 2, 3...)
- Example: `ITS-001-A1` → Scenario 1 of Test Case A verifying ARCH-001

## ISO 29119-4 Integration Test Techniques

Consumer-Driven Contract Testing (CDCT) is included for externally consumed module contracts; provider modules publish contracts and consumer modules validate expectations before integration deployment.

Each test case identifies its technique by name and anchors to a specific architecture view:

| Technique                                | Source View                   | What It Tests                                                 |
| ---------------------------------------- | ----------------------------- | ------------------------------------------------------------- |
| **Interface Contract Testing**           | Interface View                | Module API contracts, data format compliance, error responses |
| **Data Flow Testing**                    | Data Flow View                | End-to-end data transformation chain validation               |
| **Interface Fault Injection**            | Interface View + Process View | Malformed payloads, timeouts, graceful failure                |
| **Concurrency & Race Condition Testing** | Process View                  | Simultaneous access, lock handling, queue ordering            |

## Integration Tests

---

### Module Verification: ARCH-001 (FoodApiController)

**Parent System Components**: SYS-001

#### Test Case: ITP-001-A (FoodApiController→FoodRedisCacheService contract on cache hit)

**Technique**: Interface Contract Testing
**Target View**: Interface View
**Description**: Verifies that ARCH-001 correctly invokes ARCH-007's `get(fdcId)` operation and propagates the returned `FoodData` payload as a `200 OK` response without modification.

- **Integration Scenario: ITS-001-A1**
    - **Given** Module ARCH-007 (FoodRedisCacheService) holds a cached entry for `fdcId=12345` with `fetch_status='fetched'`
    - **When** Module ARCH-001 (FoodApiController) sends a `GET /v1/foods/12345` request to ARCH-007 via `get(12345)`
    - **Then** The handshake between ARCH-001 and ARCH-007 completes with ARCH-001 receiving `FoodData` and returning `200 OK` with the full nutrition payload to the caller

- **Integration Scenario: ITS-001-A2**
    - **Given** Module ARCH-007 returns `null` (cache miss) and Module ARCH-006 (FoodPostgresRepository) also returns `null` (DB miss)
    - **When** Module ARCH-001 sends `get(12345)` to ARCH-007 then `findByFdcId(12345)` to ARCH-006
    - **Then** Module ARCH-001 receives `null` from both ARCH-007 and ARCH-006, then sends `publishFoodRequested(12345)` to ARCH-002, and returns `202 Accepted` to the caller

#### Test Case: ITP-001-B (FoodApiController input validation gate — no invalid input reaches ARCH-002)

**Technique**: Interface Fault Injection
**Target View**: Interface View + Process View
**Description**: Verifies that ARCH-001 rejects malformed `fdcId` values before any downstream module boundary is crossed, ensuring ARCH-002 never receives invalid payloads.

- **Integration Scenario: ITS-001-B1**
    - **Given** Module ARCH-001 receives a request with `fdcId='abc'` (non-numeric)
    - **When** ARCH-001 performs input validation before invoking any downstream module
    - **Then** Module ARCH-001 returns `400 Bad Request` to the caller and sends zero messages to ARCH-002 (EventBridgePublisher)

- **Integration Scenario: ITS-001-B2**
    - **Given** Module ARCH-001 receives a request with `fdcId=-1` (negative integer)
    - **When** ARCH-001 performs boundary validation
    - **Then** Module ARCH-001 returns `400 Bad Request` and the ARCH-002 boundary is never crossed

#### Test Case: ITP-001-C (FoodApiController→FoodRedisCacheService deduplication handshake)

**Technique**: Interface Contract Testing
**Target View**: Interface View
**Description**: Verifies that ARCH-001 calls ARCH-007's `isPending(fdcId)` before publishing to ARCH-002, and returns `202 Accepted` without re-queuing when the food is already pending.

- **Integration Scenario: ITS-001-C1**
    - **Given** Module ARCH-007 returns `true` from `isPending(12345)` (food already in pending_fetch set)
    - **When** Module ARCH-001 sends `isPending(12345)` to ARCH-007
    - **Then** Module ARCH-001 receives `true`, returns `202 Accepted` to the caller, and sends zero `publishFoodRequested` calls to ARCH-002

---

### Module Verification: ARCH-002 (EventBridgePublisher)

**Parent System Components**: SYS-002

#### Test Case: ITP-002-A (EventBridgePublisher→EventBridge bus contract for FoodRequested events)

**Technique**: Interface Contract Testing
**Target View**: Interface View
**Description**: Verifies that ARCH-002 correctly validates and publishes `FoodRequested` event payloads to the EventBridge default bus, and that the event schema matches the contract expected by ARCH-003.

- **Integration Scenario: ITS-002-A1**
    - **Given** Module ARCH-001 sends `publishFoodRequested({ fdcId: 12345, requestedAt: '2026-05-09T00:00:00Z' })` to ARCH-002
    - **When** Module ARCH-002 validates the payload and publishes to the EventBridge default bus
    - **Then** The handshake between ARCH-002 and EventBridge completes with an `{ eventId: string }` response, and the event is routed to ARCH-003

- **Integration Scenario: ITS-002-A2**
    - **Given** Module ARCH-001 sends `publishFoodBatchRequested({ fdcIds: [1,2,3], requestedAt: '2026-05-09T00:00:00Z' })` to ARCH-002
    - **When** Module ARCH-002 publishes the batch event to EventBridge
    - **Then** Module ARCH-002 returns `{ eventId: string }` and the event is routed by ARCH-003 to the LowPriorityQueue

#### Test Case: ITP-002-B (EventBridgePublisher rejects malformed payloads before publish)

**Technique**: Interface Fault Injection
**Target View**: Interface View + Process View
**Description**: Verifies that ARCH-002 performs input validation and does not publish malformed events to EventBridge.

- **Integration Scenario: ITS-002-B1**
    - **Given** Module ARCH-001 sends a payload with missing `requestedAt` field to ARCH-002
    - **When** Module ARCH-002 validates the event payload at its boundary
    - **Then** Module ARCH-002 rejects the payload and returns an error to ARCH-001 without publishing to EventBridge

---

### Module Verification: ARCH-003 (SqsQueueRouter)

**Parent System Components**: SYS-002, SYS-003, SYS-004

#### Test Case: ITP-003-A (SqsQueueRouter routes individual FoodRequested events to HighPriorityQueue)

**Technique**: Interface Contract Testing
**Target View**: Interface View
**Description**: Verifies that ARCH-003 correctly routes individual `FoodRequested` events from EventBridge to the SQS HighPriorityQueue, and batch events to the LowPriorityQueue.

- **Integration Scenario: ITS-003-A1**
    - **Given** EventBridge delivers a `FoodRequested` event (single fdcId) to ARCH-003's routing rule
    - **When** Module ARCH-003 evaluates the event type and invokes `routeToHighPriorityQueue(message)`
    - **Then** The handshake between ARCH-003 and SQS HighPriorityQueue completes with delivery confirmed, and ARCH-004 receives the message from HighPriorityQueue

- **Integration Scenario: ITS-003-A2**
    - **Given** EventBridge delivers a `FoodBatchRequested` event (multiple fdcIds) to ARCH-003's routing rule
    - **When** Module ARCH-003 evaluates the event type and invokes `routeToLowPriorityQueue(message)`
    - **Then** The handshake between ARCH-003 and SQS LowPriorityQueue completes with delivery confirmed

#### Test Case: ITP-003-B (SqsQueueRouter DLQ handshake on queue unavailability)

**Technique**: Interface Fault Injection
**Target View**: Interface View + Process View
**Description**: Verifies that ARCH-003 correctly routes failed messages to the DLQ when the target SQS queue is unavailable.

- **Integration Scenario: ITS-003-B1**
    - **Given** SQS HighPriorityQueue is unavailable (simulated queue error)
    - **When** Module ARCH-003 attempts `routeToHighPriorityQueue(message)`
    - **Then** Module ARCH-003 routes the message to the configured DLQ and the delivery failure is recorded

---

### Module Verification: ARCH-004 (FoodConsumerService)

**Parent System Components**: SYS-005

#### Test Case: ITP-004-A (FoodConsumerService→TokenBucketRateLimiter contract before USDA call)

**Technique**: Interface Contract Testing
**Target View**: Interface View
**Description**: Verifies that ARCH-004 always calls ARCH-005's `checkTokens()` before invoking ARCH-008, and that the token check result gates the USDA API call.

- **Integration Scenario: ITS-004-A1**
    - **Given** Module ARCH-005 (TokenBucketRateLimiter) returns `{ allowed: true, tokensRemaining: 500 }` to ARCH-004
    - **When** Module ARCH-004 sends `checkTokens()` to ARCH-005 before processing an SQS message
    - **Then** Module ARCH-004 proceeds to invoke ARCH-008 (`fetchFoods([12345])`) and does not call `ChangeMessageVisibility` on the SQS message

- **Integration Scenario: ITS-004-A2**
    - **Given** Module ARCH-005 returns `{ allowed: false, tokensRemaining: 0 }` to ARCH-004
    - **When** Module ARCH-004 sends `checkTokens()` to ARCH-005
    - **Then** Module ARCH-004 sends `ChangeMessageVisibility(+30s)` to SQS and does NOT invoke ARCH-008

#### Test Case: ITP-004-B (FoodConsumerService data flow: SQS→USDA→PostgreSQL→Redis)

**Technique**: Data Flow Testing
**Target View**: Data Flow View
**Description**: Verifies the end-to-end data transformation chain from SQS message receipt through USDA API fetch, PostgreSQL upsert, and Redis cache invalidation across module boundaries.

- **Integration Scenario: ITS-004-B1**
    - **Given** Module ARCH-004 receives an SQS HighPriorityQueue message `{ fdcId: 12345 }` and ARCH-005 allows the token
    - **When** Module ARCH-004 sends `fetchFoods([12345])` to ARCH-008, receives `USDAFoodResponse[]`, then sends `upsertFood(food)` to ARCH-006, then sends `invalidate(12345)` and `clearPending(12345)` to ARCH-007
    - **Then** The data transformation chain completes: ARCH-006 persists the food record, ARCH-007 clears the cache entry, and ARCH-004 sends DELETE to SQS

#### Test Case: ITP-004-C (FoodConsumerService retry with exponential backoff on USDA error)

**Technique**: Interface Fault Injection
**Target View**: Interface View + Process View
**Description**: Verifies that ARCH-004 applies exponential backoff retry logic when ARCH-008 returns an error, without immediately deleting the SQS message.

- **Integration Scenario: ITS-004-C1**
    - **Given** Module ARCH-008 returns a `500 Server Error` to ARCH-004 on first invocation
    - **When** Module ARCH-004 receives the error from ARCH-008
    - **Then** Module ARCH-004 does NOT delete the SQS message, applies exponential backoff, and the message becomes visible again for retry

---

### Module Verification: ARCH-005 (TokenBucketRateLimiter)

**Parent System Components**: SYS-006 `[CROSS-CUTTING]`

#### Test Case: ITP-005-A (TokenBucketRateLimiter atomic token check under concurrent Consumer Lambda invocations)

**Technique**: Concurrency & Race Condition Testing
**Target View**: Process View
**Description**: Verifies that ARCH-005's Redis Lua script atomically checks and decrements tokens when multiple ARCH-004 instances invoke `checkTokens()` simultaneously, ensuring the 1,000 calls/hour cap is never exceeded.

- **Integration Scenario: ITS-005-A1**
    - **Given** Module ARCH-005 has exactly 1 token remaining in the Redis bucket and two ARCH-004 instances simultaneously send `checkTokens()`
    - **When** Both ARCH-004 instances invoke ARCH-005's `checkTokens()` concurrently
    - **Then** Exactly one ARCH-004 instance receives `{ allowed: true }` and the other receives `{ allowed: false, tokensRemaining: 0 }` — the token is never double-spent

- **Integration Scenario: ITS-005-A2**
    - **Given** Module ARCH-005 has 1,000 tokens and 1,000 concurrent ARCH-004 invocations each call `checkTokens()`
    - **When** All 1,000 invocations execute against ARCH-005 simultaneously
    - **Then** Exactly 1,000 invocations receive `{ allowed: true }` and zero additional invocations are allowed — the bucket is atomically exhausted

#### Test Case: ITP-005-B (TokenBucketRateLimiter→Redis interface fault on Redis unavailability)

**Technique**: Interface Fault Injection
**Target View**: Interface View + Process View
**Description**: Verifies that ARCH-005 propagates a Redis unavailability error to ARCH-004 in a way that causes ARCH-004 to fail safely (not call USDA API).

- **Integration Scenario: ITS-005-B1**
    - **Given** Redis is unavailable when ARCH-004 sends `checkTokens()` to ARCH-005
    - **When** Module ARCH-005 attempts to execute the Lua script against Redis
    - **Then** Module ARCH-005 returns an error to ARCH-004, and ARCH-004 does NOT invoke ARCH-008 (USDA API call is blocked)

---

### Module Verification: ARCH-006 (FoodPostgresRepository)

**Parent System Components**: SYS-007

#### Test Case: ITP-006-A (FoodPostgresRepository upsert contract with FoodConsumerService)

**Technique**: Interface Contract Testing
**Target View**: Interface View
**Description**: Verifies that ARCH-006 correctly accepts `FoodData` from ARCH-004 via `upsertFood()` and persists it, returning `{ success: boolean }` as specified in the interface contract.

- **Integration Scenario: ITS-006-A1**
    - **Given** Module ARCH-004 has a valid `USDAFoodResponse` parsed into `FoodData` format
    - **When** Module ARCH-004 sends `upsertFood(food)` to ARCH-006
    - **Then** Module ARCH-006 persists the record to PostgreSQL and returns `{ success: true }` to ARCH-004

- **Integration Scenario: ITS-006-A2**
    - **Given** Module ARCH-001 sends `findByFdcId(12345)` to ARCH-006 for a food with `fetch_status='fetched'`
    - **When** Module ARCH-006 queries PostgreSQL
    - **Then** Module ARCH-006 returns the full `FoodData` object to ARCH-001 with all required fields (`fdcId`, `description`, `calories`, `protein`, `carbs`, `fat`)

#### Test Case: ITP-006-B (FoodPostgresRepository data flow: full-text search boundary)

**Technique**: Data Flow Testing
**Target View**: Data Flow View
**Description**: Verifies that ARCH-006 correctly transforms a search query string from ARCH-001 into a PostgreSQL full-text/trigram query and returns `FoodData[]`.

- **Integration Scenario: ITS-006-B1**
    - **Given** Module ARCH-001 sends `searchFoods('chicken breast')` to ARCH-006
    - **When** Module ARCH-006 executes the pg_trgm/tsvector query against PostgreSQL
    - **Then** Module ARCH-006 returns `FoodData[]` to ARCH-001 with results ranked by relevance

#### Test Case: ITP-006-C (FoodPostgresRepository connection error propagation)

**Technique**: Interface Fault Injection
**Target View**: Interface View + Process View
**Description**: Verifies that ARCH-006 propagates PostgreSQL connection errors to callers (ARCH-001, ARCH-004) without swallowing them.

- **Integration Scenario: ITS-006-C1**
    - **Given** PostgreSQL is unavailable when ARCH-004 sends `upsertFood(food)` to ARCH-006
    - **When** Module ARCH-006 attempts the database operation
    - **Then** Module ARCH-006 returns a connection error to ARCH-004, and ARCH-004 does NOT delete the SQS message (enabling retry)

---

### Module Verification: ARCH-007 (FoodRedisCacheService)

**Parent System Components**: SYS-008

#### Test Case: ITP-007-A (FoodRedisCacheService cache-through data flow: ARCH-001→ARCH-007→ARCH-006)

**Technique**: Data Flow Testing
**Target View**: Data Flow View
**Description**: Verifies the cache-through data flow where ARCH-001 queries ARCH-007 first, falls through to ARCH-006 on miss, and the result flows back through ARCH-007 to ARCH-001.

- **Integration Scenario: ITS-007-A1**
    - **Given** Module ARCH-007 returns `null` from `get(12345)` (Redis miss) and ARCH-006 returns a `FoodData` record
    - **When** Module ARCH-001 sends `get(12345)` to ARCH-007, then `findByFdcId(12345)` to ARCH-006
    - **Then** The data flows from ARCH-006 → ARCH-001 → `200 OK` response, and ARCH-007 is not populated (cache-through does not auto-populate on read miss)

#### Test Case: ITP-007-B (FoodRedisCacheService pending_fetch deduplication under concurrent ARCH-001 requests)

**Technique**: Concurrency & Race Condition Testing
**Target View**: Process View
**Description**: Verifies that ARCH-007's `pending_fetch` Redis set prevents duplicate SQS messages when multiple ARCH-001 instances concurrently request the same uncached food.

- **Integration Scenario: ITS-007-B1**
    - **Given** Two concurrent ARCH-001 instances both receive cache miss for `fdcId=12345` and both call `isPending(12345)` on ARCH-007 simultaneously
    - **When** Both ARCH-001 instances invoke `markPending(12345)` on ARCH-007 (SADD to pending_fetch set)
    - **Then** Exactly one ARCH-001 instance proceeds to call ARCH-002 (`publishFoodRequested`); the second receives `isPending=true` and returns `202 Accepted` without publishing

#### Test Case: ITP-007-C (FoodRedisCacheService cache invalidation handshake with FoodConsumerService)

**Technique**: Interface Contract Testing
**Target View**: Interface View
**Description**: Verifies that ARCH-004 correctly calls ARCH-007's `invalidate()` and `clearPending()` after a successful USDA fetch and PostgreSQL upsert.

- **Integration Scenario: ITS-007-C1**
    - **Given** Module ARCH-004 has successfully upserted food data into ARCH-006
    - **When** Module ARCH-004 sends `invalidate(12345)` then `clearPending(12345)` to ARCH-007
    - **Then** Module ARCH-007 removes `food:12345` from Redis and removes `12345` from the `pending_fetch` set, returning `void` to ARCH-004

#### Test Case: ITP-007-D (FoodRedisCacheService Redis unavailability fault propagation)

**Technique**: Interface Fault Injection
**Target View**: Interface View + Process View
**Description**: Verifies that ARCH-007 propagates Redis unavailability errors to ARCH-001 so that ARCH-001 can fall through to ARCH-006 rather than failing the request.

- **Integration Scenario: ITS-007-D1**
    - **Given** Redis is unavailable when ARCH-001 sends `get(12345)` to ARCH-007
    - **When** Module ARCH-007 attempts the Redis GET operation
    - **Then** Module ARCH-007 returns an error/null to ARCH-001, and ARCH-001 falls through to ARCH-006 (`findByFdcId`) rather than returning a 503

---

### Module Verification: ARCH-008 (UsdaApiClient)

**Parent System Components**: SYS-009

#### Test Case: ITP-008-A (UsdaApiClient→USDA API contract: batch request and response parsing)

**Technique**: Interface Contract Testing
**Target View**: Interface View
**Description**: Verifies that ARCH-008 correctly sends batch requests (up to 20 fdcIds) to the USDA FoodData Central API and parses `USDAFoodResponse[]` for ARCH-004.

- **Integration Scenario: ITS-008-A1**
    - **Given** Module ARCH-004 sends `fetchFoods([12345, 67890])` to ARCH-008 with a valid API key from ARCH-010
    - **When** Module ARCH-008 sends an HTTP POST to the USDA API with the fdcId batch
    - **Then** Module ARCH-008 receives a valid USDA response and returns `USDAFoodResponse[]` to ARCH-004 with all requested foods

#### Test Case: ITP-008-B (UsdaApiClient error classification and propagation)

**Technique**: Interface Fault Injection
**Target View**: Interface View + Process View
**Description**: Verifies that ARCH-008 correctly classifies USDA API errors (401, 429, 500) and propagates them to ARCH-004 in a way that enables appropriate retry behavior.

- **Integration Scenario: ITS-008-B1**
    - **Given** The USDA API returns `429 Too Many Requests` to ARCH-008
    - **When** Module ARCH-008 receives the 429 response
    - **Then** Module ARCH-008 returns a rate-limit error to ARCH-004, and ARCH-004 applies exponential backoff without deleting the SQS message

- **Integration Scenario: ITS-008-B2**
    - **Given** The USDA API returns `401 Unauthorized` to ARCH-008 (invalid API key)
    - **When** Module ARCH-008 receives the 401 response
    - **Then** Module ARCH-008 returns an authentication error to ARCH-004, classified distinctly from transient errors

---

### Module Verification: ARCH-009 (WebSocketNotifier)

**Parent System Components**: SYS-010 `[CROSS-CUTTING]`

#### Test Case: ITP-009-A (WebSocketNotifier→API Gateway WebSocket contract for FoodDataReceived events)

**Technique**: Interface Contract Testing
**Target View**: Interface View
**Description**: Verifies that ARCH-009 correctly receives `FoodDataReceived` events from EventBridge and pushes notifications to connected clients via the API Gateway WebSocket API boundary.

- **Integration Scenario: ITS-009-A1**
    - **Given** EventBridge delivers a `FoodDataReceived` event `{ fdcId: 12345, foodData: FoodData }` to ARCH-009
    - **When** Module ARCH-009 invokes `notifyClients(12345, foodData)` against the API Gateway WebSocket API
    - **Then** Module ARCH-009 returns the count of clients notified to the EventBridge invocation context (fire-and-forget; WebSocket connection errors do not propagate as failures)

#### Test Case: ITP-009-B (WebSocketNotifier graceful handling of WebSocket connection errors)

**Technique**: Interface Fault Injection
**Target View**: Interface View + Process View
**Description**: Verifies that ARCH-009 handles WebSocket connection errors gracefully (fire-and-forget) without failing the EventBridge invocation.

- **Integration Scenario: ITS-009-B1**
    - **Given** All connected WebSocket clients have disconnected before ARCH-009 receives the `FoodDataReceived` event
    - **When** Module ARCH-009 attempts `notifyClients(12345, foodData)` against the API Gateway WebSocket API
    - **Then** Module ARCH-009 returns `0` clients notified without throwing an error to EventBridge

---

### Module Verification: ARCH-010 (SecretManager)

**Parent System Components**: SYS-011 `[CROSS-CUTTING]`

#### Test Case: ITP-010-A (SecretManager→AWS Secrets Manager contract: API key retrieval for ARCH-008)

**Technique**: Interface Contract Testing
**Target View**: Interface View
**Description**: Verifies that ARCH-010 correctly retrieves the USDA API key from AWS Secrets Manager and provides it to ARCH-008 (injected as Lambda environment variable at cold start), and that the key is never exposed in logs.

- **Integration Scenario: ITS-010-A1**
    - **Given** AWS Secrets Manager holds a valid USDA API key secret
    - **When** Module ARCH-010 invokes `getUsdaApiKey()` during Lambda cold start
    - **Then** Module ARCH-010 returns the API key string to the Lambda environment, and the key value does NOT appear in any ARCH-011 (MonitoringLogger) log output

#### Test Case: ITP-010-B (SecretManager fault propagation on secret not found)

**Technique**: Interface Fault Injection
**Target View**: Interface View + Process View
**Description**: Verifies that ARCH-010 propagates a "secret not found" error to the Lambda initialization context, preventing ARCH-008 from making unauthenticated USDA API calls.

- **Integration Scenario: ITS-010-B1**
    - **Given** AWS Secrets Manager does not contain the expected USDA API key secret
    - **When** Module ARCH-010 invokes `getUsdaApiKey()`
    - **Then** Module ARCH-010 returns a "Secret not found" error to the Lambda initialization context, and ARCH-008 is not invoked

---

### Module Verification: ARCH-011 (MonitoringLogger)

**Parent System Components**: SYS-012 `[CROSS-CUTTING]`

#### Test Case: ITP-011-A (MonitoringLogger structured log contract with ARCH-001 and ARCH-004)

**Technique**: Interface Contract Testing
**Target View**: Interface View
**Description**: Verifies that ARCH-011 correctly accepts structured JSON log entries from ARCH-001 and ARCH-004 via `logRequest()`, including `requestId` correlation, and emits them to CloudWatch without dropping fields.

- **Integration Scenario: ITS-011-A1**
    - **Given** Module ARCH-001 processes a `GET /v1/foods/12345` request with `requestId='req-abc'`
    - **When** Module ARCH-001 sends `logRequest('req-abc', { path: '/v1/foods/12345', status: 200 }, 45)` to ARCH-011
    - **Then** Module ARCH-011 emits a structured JSON log entry to CloudWatch containing `requestId`, `path`, `status`, and `duration` fields — no fields are dropped

#### Test Case: ITP-011-B (MonitoringLogger metric emission contract: queue depth and token bucket utilization)

**Technique**: Data Flow Testing
**Target View**: Data Flow View
**Description**: Verifies that ARCH-011 correctly receives metric data from ARCH-004 and ARCH-005 and emits CloudWatch metrics for queue depth and token bucket utilization.

- **Integration Scenario: ITS-011-B1**
    - **Given** Module ARCH-004 processes an SQS message and ARCH-005 returns `tokensRemaining=750`
    - **When** Module ARCH-004 sends `incrementMetric('token_bucket_utilization', 250)` to ARCH-011
    - **Then** Module ARCH-011 emits the metric to CloudWatch with the correct namespace and value

#### Test Case: ITP-011-C (MonitoringLogger X-Ray trace boundary handshake)

**Technique**: Interface Contract Testing
**Target View**: Interface View
**Description**: Verifies that ARCH-011's `startTrace(reqId)` correctly opens an X-Ray segment that spans the ARCH-001→ARCH-007→ARCH-006 call chain.

- **Integration Scenario: ITS-011-C1**
    - **Given** Module ARCH-001 begins processing a food lookup request
    - **When** Module ARCH-001 sends `startTrace('req-abc')` to ARCH-011
    - **Then** Module ARCH-011 returns a `Segment` object to ARCH-001, and the segment is visible in X-Ray with the correct `requestId` correlation

---

## Test Harness & Mocking Strategy

| Test Case | External Dependency          | Mock/Stub Strategy                                     | Rationale                                                         |
| --------- | ---------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| ITP-001-A | ARCH-007 (Redis)             | In-memory Redis stub (ioredis-mock)                    | Isolates ARCH-001↔ARCH-007 boundary without real Redis            |
| ITP-001-B | ARCH-002 (EventBridge)       | Spy on publishFoodRequested — assert zero calls        | Verifies no downstream boundary is crossed on invalid input       |
| ITP-001-C | ARCH-007 (Redis pending set) | In-memory Redis stub with pre-seeded pending_fetch set | Simulates deduplication state                                     |
| ITP-002-A | EventBridge default bus      | AWS SDK mock (aws-sdk-mock / jest mock)                | Avoids real EventBridge calls; verifies payload schema            |
| ITP-002-B | EventBridge default bus      | AWS SDK mock — assert PutEvents not called             | Verifies validation gate before publish                           |
| ITP-003-A | SQS HighPriorityQueue        | LocalStack SQS or AWS SDK mock                         | Verifies routing rule logic without real SQS                      |
| ITP-003-B | SQS (unavailable)            | AWS SDK mock returning ServiceUnavailable              | Simulates queue failure for DLQ routing test                      |
| ITP-004-A | ARCH-005 (Redis Lua)         | Redis stub returning controlled token responses        | Isolates token check gate from real Redis                         |
| ITP-004-B | ARCH-008 (USDA API)          | HTTP mock (nock) returning valid USDAFoodResponse      | Avoids real USDA API calls; controls response data                |
| ITP-004-C | ARCH-008 (USDA API)          | HTTP mock returning 500 on first call                  | Simulates transient USDA error for retry verification             |
| ITP-005-A | Redis (concurrent access)    | Real Redis instance with concurrent test clients       | Concurrency test requires real atomic Lua script execution        |
| ITP-005-B | Redis (unavailable)          | Redis stub throwing connection error                   | Simulates Redis failure for fault propagation test                |
| ITP-006-A | PostgreSQL                   | Test PostgreSQL instance (Docker) or pg-mem            | Verifies real SQL upsert behavior; schema-level contract          |
| ITP-006-B | PostgreSQL (pg_trgm)         | Test PostgreSQL instance with pg_trgm extension        | Full-text search requires real extension                          |
| ITP-006-C | PostgreSQL (unavailable)     | pg-mock throwing connection error                      | Simulates DB failure for error propagation test                   |
| ITP-007-A | ARCH-007 (Redis), ARCH-006   | Redis stub (miss) + PostgreSQL stub (hit)              | Isolates cache-through data flow                                  |
| ITP-007-B | Redis (concurrent SADD)      | Real Redis instance with concurrent test clients       | Concurrency test requires real Redis SADD atomicity               |
| ITP-007-C | Redis (invalidate/clear)     | Redis stub — assert DEL and SREM called                | Verifies cache invalidation handshake                             |
| ITP-007-D | Redis (unavailable)          | Redis stub throwing connection error                   | Simulates Redis failure for fallthrough test                      |
| ITP-008-A | USDA FoodData Central API    | HTTP mock (nock) with valid USDA response fixture      | Avoids real USDA API dependency; controls response                |
| ITP-008-B | USDA FoodData Central API    | HTTP mock returning 429 / 401 responses                | Simulates USDA error codes for classification test                |
| ITP-009-A | API Gateway WebSocket API    | AWS SDK mock for PostToConnection                      | Avoids real WebSocket connections; verifies notification dispatch |
| ITP-009-B | API Gateway WebSocket API    | AWS SDK mock returning GoneException (disconnected)    | Simulates disconnected clients for fire-and-forget test           |
| ITP-010-A | AWS Secrets Manager          | AWS SDK mock returning valid secret string             | Avoids real Secrets Manager; verifies key retrieval contract      |
| ITP-010-B | AWS Secrets Manager          | AWS SDK mock throwing ResourceNotFoundException        | Simulates missing secret for fault propagation test               |
| ITP-011-A | CloudWatch Logs              | AWS SDK mock — assert PutLogEvents payload             | Verifies structured log field completeness                        |
| ITP-011-B | CloudWatch Metrics           | AWS SDK mock — assert PutMetricData values             | Verifies metric emission contract                                 |
| ITP-011-C | AWS X-Ray                    | X-Ray SDK mock — assert segment creation               | Verifies trace boundary handshake                                 |

---

## Coverage Summary

| Metric                            | Count          |
| --------------------------------- | -------------- |
| Total Architecture Modules (ARCH) | 11             |
| Total Test Cases (ITP)            | 28             |
| Total Scenarios (ITS)             | 36             |
| Modules with ≥1 ITP               | 11 / 11 (100%) |
| Test Cases with ≥1 ITS            | 28 / 28 (100%) |
| **Overall Coverage (ARCH→ITP)**   | **100%**       |

### Technique Distribution

| Technique                            | Test Cases | Percentage |
| ------------------------------------ | ---------- | ---------- |
| Interface Contract Testing           | 12         | 43%        |
| Interface Fault Injection            | 10         | 36%        |
| Data Flow Testing                    | 4          | 14%        |
| Concurrency & Race Condition Testing | 2          | 7%         |
| **Total**                            | **28**     | **100%**   |

## Uncovered Modules

None — full coverage achieved.
