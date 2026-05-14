# System Test Plan: USDA Food Data Integration

**Feature Branch**: `003-usda-food-data`
**Created**: 2026-05-09
**Status**: Draft
**Source**: `specs/003-usda-food-data/v-model/system-design.md`

## Overview

This document defines the System Test Plan for the USDA Food Data Integration feature. Every system component in `system-design.md` has one or more Test Cases (STP), and every Test Case has one or more executable System Scenarios (STS) in technical BDD format (Given/When/Then).

System tests verify **architectural behavior**, not user journeys. Language is technical and component-oriented. The architecture is event-driven and queue-based: user-facing food lookups are served exclusively from local PostgreSQL (with optional Redis cache); the USDA API is never called in the request path.

## ID Schema

- **System Test Case**: `STP-{NNN}-{X}` — where NNN matches the parent SYS, X is a letter suffix (A, B, C...)
- **System Test Scenario**: `STS-{NNN}-{X}{#}` — nested under the parent STP, with numeric suffix (1, 2, 3...)
- Example: `STS-001-A1` → Scenario 1 of Test Case A verifying SYS-001

## ISO 29119 Test Techniques

Each test case identifies its technique by name:

- **Interface Contract Testing** — Verifies API contracts from the Interface View
- **Boundary Value Analysis** — Tests data limits from the Data Design View
- **Equivalence Partitioning** — Tests representative data classes
- **Fault Injection** — Tests failure propagation from the Dependency View

## System Tests

---

### Component Verification: SYS-001 (FoodApiLambda)

**Parent Requirements**: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010

#### Test Case: STP-001-A (Local-Store-Only Serving — No USDA API Call in Request Path)

**Technique**: Interface Contract Testing
**Target View**: Interface View (IC-002: SYS-001 → SYS-007)
**Description**: Verifies that FoodApiLambda serves all responses exclusively from PostgreSQL/Redis and never invokes the USDA API during the request lifecycle.

- **System Scenario: STS-001-A1**
    - **Given** a food record exists in PostgreSQL with `fdc_id = 12345` and `fetch_status = 'fetched'`; Redis cache is cold for `food:12345`
    - **When** FoodApiLambda receives `GET /v1/foods/12345`
    - **Then** FoodApiLambda executes `SELECT * FROM foods WHERE fdc_id = 12345` against SYS-007; no outbound HTTP call to `api.nal.usda.gov` is made; response is `200 OK` with `fdcId`, `description`, `calories`, `protein`, `carbs`, `fat`, and available micronutrients

- **System Scenario: STS-001-A2**
    - **Given** Redis cache contains `food:12345` with `fetch_status = 'fetched'`
    - **When** FoodApiLambda receives `GET /v1/foods/12345`
    - **Then** FoodApiLambda executes `GET food:12345` against SYS-008 (cache hit); no PostgreSQL query is issued; no outbound HTTP call to USDA API; response is `200 OK` with full nutrition payload

#### Test Case: STP-001-B (HTTP Status Code Contract per fetch_status)

**Technique**: Equivalence Partitioning
**Target View**: Data Design View (fetch_status state machine)
**Description**: Verifies that FoodApiLambda returns the correct HTTP status code for each `fetch_status` partition.

- **System Scenario: STS-001-B1**
    - **Given** PostgreSQL contains `fdc_id = 11111` with `fetch_status = 'fetched'`
    - **When** FoodApiLambda receives `GET /v1/foods/11111`
    - **Then** response status is `200 OK`; body contains `fdcId: 11111` and all required nutrition fields

- **System Scenario: STS-001-B2**
    - **Given** no record exists in PostgreSQL or Redis for `fdc_id = 22222`; `pending_fetch` Redis set does not contain `22222`
    - **When** FoodApiLambda receives `GET /v1/foods/22222`
    - **Then** response status is `202 Accepted`; body is `{ "status": "pending", "fdcId": 22222, "estimatedWaitSeconds": <positive integer> }`; a `FoodRequested` event is published to SYS-002

- **System Scenario: STS-001-B3**
    - **Given** PostgreSQL contains `fdc_id = 33333` with `fetch_status = 'pending'`; `pending_fetch` Redis set contains `33333`
    - **When** FoodApiLambda receives `GET /v1/foods/33333`
    - **Then** response status is `202 Accepted`; no new `FoodRequested` event is published to SYS-002 (deduplication enforced)

- **System Scenario: STS-001-B4**
    - **Given** PostgreSQL contains `fdc_id = 44444` with `fetch_status = 'not_found'`
    - **When** FoodApiLambda receives `GET /v1/foods/44444`
    - **Then** response status is `404 Not Found`; no event is published to SYS-002; no SQS message is enqueued

#### Test Case: STP-001-C (Input Validation — fdcId Boundary Values)

**Technique**: Boundary Value Analysis
**Target View**: Data Design View (fdcId: numeric, positive integer)
**Description**: Verifies that FoodApiLambda rejects invalid `fdcId` inputs before any downstream component is invoked.

- **System Scenario: STS-001-C1**
    - **Given** FoodApiLambda is running
    - **When** FoodApiLambda receives `GET /v1/foods/0`
    - **Then** response status is `400 Bad Request`; no query is issued to SYS-007 or SYS-008; no event is published to SYS-002

- **System Scenario: STS-001-C2**
    - **Given** FoodApiLambda is running
    - **When** FoodApiLambda receives `GET /v1/foods/-1`
    - **Then** response status is `400 Bad Request`; no downstream component is invoked

- **System Scenario: STS-001-C3**
    - **Given** FoodApiLambda is running
    - **When** FoodApiLambda receives `GET /v1/foods/abc`
    - **Then** response status is `400 Bad Request`; no downstream component is invoked

- **System Scenario: STS-001-C4**
    - **Given** FoodApiLambda is running
    - **When** FoodApiLambda receives `GET /v1/foods/1` (minimum valid positive integer)
    - **Then** FoodApiLambda proceeds to query SYS-007/SYS-008; response is not `400`

#### Test Case: STP-001-D (Search Endpoint — Local-Only Execution)

**Technique**: Interface Contract Testing
**Target View**: Interface View (SYS-001 → SYS-007 full-text search)
**Description**: Verifies that `GET /v1/foods/search` executes exclusively against local PostgreSQL using pg_trgm/FTS and never calls the USDA API.

- **System Scenario: STS-001-D1**
    - **Given** PostgreSQL contains 1,000 food records with `fetch_status = 'fetched'`; no outbound network route to USDA API is available
    - **When** FoodApiLambda receives `GET /v1/foods/search?query=chicken`
    - **Then** FoodApiLambda issues a pg_trgm or tsvector query against SYS-007; results are returned ranked by relevance; no outbound HTTP call to USDA API; response time is under 200ms

- **System Scenario: STS-001-D2**
    - **Given** PostgreSQL contains 50,000 food records
    - **When** FoodApiLambda receives `GET /v1/foods/search?query=broccoli`
    - **Then** response is returned within 200ms; results are ranked by relevance score descending

---

### Component Verification: SYS-002 (EventBridgeBus)

**Parent Requirements**: REQ-011, REQ-012

#### Test Case: STP-002-A (Event Routing — FoodRequested to HighPriorityQueue)

**Technique**: Interface Contract Testing
**Target View**: Interface View (IC-001: SYS-001 → SYS-002; SYS-002 → SYS-003)
**Description**: Verifies that EventBridgeBus routes `FoodRequested` events exclusively to SYS-003 (HighPriorityFoodQueue).

- **System Scenario: STS-002-A1**
    - **Given** EventBridgeBus has a rule matching `detail-type = "FoodRequested"` targeting SYS-003
    - **When** SYS-001 publishes `FoodRequested { "fdcId": 12345, "requestedAt": "<timestamp>" }` to the event bus
    - **Then** the event is delivered to SYS-003 (HighPriorityFoodQueue); SYS-004 (LowPriorityFoodQueue) receives no message

#### Test Case: STP-002-B (Event Routing — FoodBatchRequested to LowPriorityQueue)

**Technique**: Interface Contract Testing
**Target View**: Interface View (SYS-002 → SYS-004)
**Description**: Verifies that EventBridgeBus routes `FoodBatchRequested` events exclusively to SYS-004 (LowPriorityFoodQueue).

- **System Scenario: STS-002-B1**
    - **Given** EventBridgeBus has a rule matching `detail-type = "FoodBatchRequested"` targeting SYS-004
    - **When** a producer publishes `FoodBatchRequested { "fdcIds": [1, 2, 3], "correlationId": "abc" }` to the event bus
    - **Then** the event is delivered to SYS-004 (LowPriorityFoodQueue); SYS-003 receives no message

#### Test Case: STP-002-C (Fault Injection — EventBridge Publish Failure)

**Technique**: Fault Injection
**Target View**: Dependency View (SYS-001 → SYS-002: publish failure)
**Description**: Verifies system behavior when EventBridge publish fails.

- **System Scenario: STS-002-C1**
    - **Given** EventBridgeBus is unavailable (simulated via IAM deny or endpoint failure)
    - **When** FoodApiLambda attempts to publish `FoodRequested` for `fdc_id = 99999`
    - **Then** FoodApiLambda returns `202 Accepted` to the caller (or propagates an error); the food record remains in `fetch_status = 'pending'` or is not created; no SQS message reaches SYS-003

---

### Component Verification: SYS-003 (HighPriorityFoodQueue)

**Parent Requirements**: REQ-011, REQ-012, REQ-014

#### Test Case: STP-003-A (FIFO Queue Message Delivery Contract)

**Technique**: Interface Contract Testing
**Target View**: Interface View (SYS-002 → SYS-003; SYS-003 → SYS-005)
**Description**: Verifies that HighPriorityFoodQueue is a FIFO queue and delivers messages to SYS-005 with correct schema.

- **System Scenario: STS-003-A1**
    - **Given** HighPriorityFoodQueue is empty; SYS-002 routes a `FoodRequested` event
    - **When** the SQS message `{ "fdcId": 12345, "priority": "high", "correlationId": "xyz" }` is enqueued
    - **Then** SYS-005 (ConsumerLambda) receives the message with all three fields intact; message is delivered in FIFO order relative to other high-priority messages

#### Test Case: STP-003-B (DLQ Routing After Max Receive Count)

**Technique**: Fault Injection
**Target View**: Dependency View (SYS-003 → SYS-005 failure path)
**Description**: Verifies that messages exceeding max receive count (3) are routed to the Dead Letter Queue.

- **System Scenario: STS-003-B1**
    - **Given** a message `{ "fdcId": 55555 }` is in HighPriorityFoodQueue; SYS-005 fails to process it and does not delete it on each attempt
    - **When** the message has been received 3 times without deletion
    - **Then** the message is moved to the HighPriorityFoodQueue DLQ; it is no longer visible in the main queue

---

### Component Verification: SYS-004 (LowPriorityFoodQueue)

**Parent Requirements**: REQ-011, REQ-013

#### Test Case: STP-004-A (FIFO Queue Message Delivery — Batch Schema)

**Technique**: Interface Contract Testing
**Target View**: Interface View (SYS-002 → SYS-004)
**Description**: Verifies that LowPriorityFoodQueue delivers batch messages with the correct schema to SYS-005.

- **System Scenario: STS-004-A1**
    - **Given** LowPriorityFoodQueue is empty; SYS-002 routes a `FoodBatchRequested` event
    - **When** the SQS message `{ "fdcIds": [1, 2, 3], "priority": "low", "correlationId": "batch-001" }` is enqueued
    - **Then** SYS-005 receives the message with `fdcIds` array intact; message is delivered in FIFO order

#### Test Case: STP-004-B (DLQ Routing After Max Receive Count)

**Technique**: Fault Injection
**Target View**: Dependency View (SYS-004 → SYS-005 failure path)
**Description**: Verifies that low-priority messages exceeding max receive count are routed to the DLQ.

- **System Scenario: STS-004-B1**
    - **Given** a batch message `{ "fdcIds": [77777, 88888] }` is in LowPriorityFoodQueue; SYS-005 fails to process it 3 times
    - **When** the message has been received 3 times without deletion
    - **Then** the message is moved to the LowPriorityFoodQueue DLQ; it is no longer visible in the main queue

---

### Component Verification: SYS-005 (FoodConsumerLambda)

**Parent Requirements**: REQ-011, REQ-012, REQ-014, REQ-015, REQ-016, REQ-017

#### Test Case: STP-005-A (High-Priority Queue Polling Priority)

**Technique**: Interface Contract Testing
**Target View**: Dependency View (SYS-003 → SYS-005; SYS-004 → SYS-005)
**Description**: Verifies that ConsumerLambda polls HighPriorityQueue first and only polls LowPriorityQueue when HighPriorityQueue is empty.

- **System Scenario: STS-005-A1**
    - **Given** both SYS-003 and SYS-004 contain messages
    - **When** ConsumerLambda begins a polling cycle
    - **Then** ConsumerLambda processes all available messages from SYS-003 before issuing any `ReceiveMessage` call to SYS-004

- **System Scenario: STS-005-A2**
    - **Given** SYS-003 is empty; SYS-004 contains messages
    - **When** ConsumerLambda begins a polling cycle
    - **Then** ConsumerLambda issues a `ReceiveMessage` call to SYS-004 and processes the available messages

#### Test Case: STP-005-B (Successful USDA Fetch — Full Success Path)

**Technique**: Interface Contract Testing
**Target View**: Interface View (IC-004: SYS-005 → SYS-009; IC-005: SYS-005 → SYS-007)
**Description**: Verifies the complete success path: token check → USDA call → PostgreSQL upsert → Redis invalidation → SQS delete → EventBridge emit.

- **System Scenario: STS-005-B1**
    - **Given** SYS-006 token bucket has ≥ 1 token; SQS message `{ "fdcId": 12345 }` is in SYS-003; USDA API returns `200 OK` with food data for `fdcId = 12345`
    - **When** ConsumerLambda processes the message
    - **Then** ConsumerLambda: (1) calls SYS-006 and receives `{ allowed: true }`; (2) calls USDA API `POST /v1/foods` with `{ fdcIds: [12345] }`; (3) upserts food into SYS-007 with `fetch_status = 'fetched'`; (4) issues `DEL food:12345` and `SREM pending_fetch 12345` to SYS-008; (5) deletes the SQS message from SYS-003; (6) publishes `FoodDataReceived` event to SYS-002

#### Test Case: STP-005-C (Batch Processing — Up to 20 fdcIds per USDA Call)

**Technique**: Boundary Value Analysis
**Target View**: Data Design View (batch size: 1–20 fdcIds per USDA API call)
**Description**: Verifies that ConsumerLambda batches up to 20 fdcIds per USDA API call and consumes exactly 1 token per call regardless of batch size.

- **System Scenario: STS-005-C1**
    - **Given** SYS-006 has ≥ 1 token; SQS message contains `{ "fdcIds": [1, 2, ..., 20] }` (20 IDs)
    - **When** ConsumerLambda processes the message
    - **Then** exactly 1 HTTP call is made to USDA API with all 20 IDs; exactly 1 token is consumed from SYS-006

- **System Scenario: STS-005-C2**
    - **Given** SYS-006 has ≥ 2 tokens; SQS message contains `{ "fdcIds": [1, 2, ..., 21] }` (21 IDs, exceeds batch limit)
    - **When** ConsumerLambda processes the message
    - **Then** ConsumerLambda splits into 2 USDA API calls (20 + 1); 2 tokens are consumed from SYS-006

#### Test Case: STP-005-D (USDA 404 — Tombstone Write)

**Technique**: Equivalence Partitioning
**Target View**: Data Design View (fetch_status = 'not_found')
**Description**: Verifies that a USDA 404 response results in a tombstone record and no retry.

- **System Scenario: STS-005-D1**
    - **Given** SQS message `{ "fdcId": 99999 }` is in SYS-003; USDA API returns `404 Not Found` for `fdcId = 99999`
    - **When** ConsumerLambda processes the message
    - **Then** ConsumerLambda upserts `{ fdc_id: 99999, fetch_status: 'not_found' }` into SYS-007; the SQS message is deleted; no retry is scheduled; no `FoodDataReceived` event is emitted

#### Test Case: STP-005-E (USDA 429 — Token Bucket Reset and Backoff)

**Technique**: Fault Injection
**Target View**: Dependency View (SYS-005 → SYS-009: rate limit exceeded)
**Description**: Verifies that a USDA 429 response resets the token bucket to 0 and stops processing remaining messages.

- **System Scenario: STS-005-E1**
    - **Given** SYS-006 token bucket has 5 tokens; ConsumerLambda is processing a batch of 3 SQS messages; USDA API returns `429 Too Many Requests` on the second message
    - **When** ConsumerLambda receives the 429 response
    - **Then** ConsumerLambda resets SYS-006 token bucket to 0 tokens; the second SQS message is left undeleted (visibility timeout expires for retry); the third message is not processed in this invocation

#### Test Case: STP-005-F (USDA 5xx — SQS Native Retry via Visibility Timeout)

**Technique**: Fault Injection
**Target View**: Dependency View (SYS-005 → SYS-009: transient error)
**Description**: Verifies that USDA 5xx errors leave the SQS message undeleted for SQS-native retry.

- **System Scenario: STS-005-F1**
    - **Given** SQS message `{ "fdcId": 11111 }` is in SYS-003; USDA API returns `503 Service Unavailable`
    - **When** ConsumerLambda processes the message
    - **Then** ConsumerLambda does NOT delete the SQS message; the message becomes visible again after the visibility timeout; after 3 total receive attempts, the message is routed to the DLQ

---

### Component Verification: SYS-006 (TokenBucketRateLimiter)

**Parent Requirements**: REQ-018, REQ-019

#### Test Case: STP-006-A (Atomic Token Check-and-Consume)

**Technique**: Interface Contract Testing
**Target View**: Interface View (IC-003: SYS-005 → SYS-006)
**Description**: Verifies that the token bucket check-and-consume operation is atomic and returns the correct response schema.

- **System Scenario: STS-006-A1**
    - **Given** Redis token bucket key has 500 tokens remaining
    - **When** SYS-005 executes the Lua script atomic check-and-decrement
    - **Then** the script returns `{ "allowed": true, "tokensRemaining": 499 }`; the Redis key is decremented by exactly 1 in a single atomic operation

- **System Scenario: STS-006-A2**
    - **Given** Redis token bucket key has 0 tokens remaining
    - **When** SYS-005 executes the Lua script atomic check-and-decrement
    - **Then** the script returns `{ "allowed": false, "tokensRemaining": 0 }`; the Redis key is not modified

#### Test Case: STP-006-B (Rate Limit Capacity and Refill Boundary Values)

**Technique**: Boundary Value Analysis
**Target View**: Data Design View (capacity: 1,000 tokens; refill: 16.67 tokens/minute)
**Description**: Verifies token bucket capacity ceiling and refill rate at boundary values.

- **System Scenario: STS-006-B1**
    - **Given** the token bucket is at capacity (1,000 tokens)
    - **When** a refill event fires (16.67 tokens added)
    - **Then** the bucket remains at 1,000 tokens (capacity ceiling enforced; no overflow)

- **System Scenario: STS-006-B2**
    - **Given** the token bucket has 990 tokens; 60 seconds elapse (1 refill cycle = 16.67 tokens)
    - **When** the refill is applied
    - **Then** the bucket has min(990 + 16.67, 1000) = 1,000 tokens (ceiling enforced)

- **System Scenario: STS-006-B3**
    - **Given** the token bucket has 0 tokens; 60 seconds elapse
    - **When** the refill is applied
    - **Then** the bucket has 16 or 17 tokens (floor/ceil of 16.67); subsequent check-and-consume returns `{ "allowed": true }`

#### Test Case: STP-006-C (Fault Injection — Redis Unavailable)

**Technique**: Fault Injection
**Target View**: Dependency View (SYS-005 → SYS-006: token bucket unavailable)
**Description**: Verifies ConsumerLambda behavior when the token bucket Redis is unreachable.

- **System Scenario: STS-006-C1**
    - **Given** Redis (SYS-006) is unreachable (connection timeout)
    - **When** ConsumerLambda attempts to call the token bucket Lua script
    - **Then** ConsumerLambda does NOT call the USDA API; the SQS message is left undeleted; an error is logged to CloudWatch (SYS-012)

---

### Component Verification: SYS-007 (FoodDataPostgresRepository)

**Parent Requirements**: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-020, REQ-021

#### Test Case: STP-007-A (Upsert Contract — ON CONFLICT Behavior)

**Technique**: Interface Contract Testing
**Target View**: Interface View (IC-005: SYS-005 → SYS-007 UPSERT)
**Description**: Verifies that the PostgreSQL upsert correctly handles both insert (new food) and update (existing food) cases.

- **System Scenario: STS-007-A1**
    - **Given** no record exists for `fdc_id = 12345` in the `foods` table
    - **When** ConsumerLambda executes `INSERT INTO foods (...) VALUES (...) ON CONFLICT (fdc_id) DO UPDATE SET ...` with `fetch_status = 'fetched'`
    - **Then** a new row is inserted with all required fields: `fdc_id`, `description`, `data_type`, `nutrients` (JSONB), `fetch_status = 'fetched'`, `fetched_at`, `created_at`, `updated_at`

- **System Scenario: STS-007-A2**
    - **Given** a record exists for `fdc_id = 12345` with `fetch_status = 'pending'`
    - **When** ConsumerLambda executes the upsert with `fetch_status = 'fetched'` and updated nutrition data
    - **Then** the existing row is updated; `fetch_status` changes to `'fetched'`; `fetched_at` and `updated_at` are set to current timestamp; no duplicate row is created

#### Test Case: STP-007-B (fetch_status State Machine — All Partitions)

**Technique**: Equivalence Partitioning
**Target View**: Data Design View (fetch_status: 'pending' | 'fetched' | 'failed' | 'not_found' | 'stale')
**Description**: Verifies that each valid `fetch_status` value is stored and retrieved correctly.

- **System Scenario: STS-007-B1**
    - **Given** a food record is inserted with `fetch_status = 'pending'`
    - **When** FoodApiLambda queries `SELECT * FROM foods WHERE fdc_id = $1`
    - **Then** the returned row has `fetch_status = 'pending'`; FoodApiLambda returns `202 Accepted`

- **System Scenario: STS-007-B2**
    - **Given** a food record has `fetch_status = 'not_found'`
    - **When** FoodApiLambda queries the record
    - **Then** the returned row has `fetch_status = 'not_found'`; FoodApiLambda returns `404 Not Found`

#### Test Case: STP-007-C (Fault Injection — PostgreSQL Unavailable)

**Technique**: Fault Injection
**Target View**: Dependency View (SYS-001 → SYS-007: PostgreSQL unavailable)
**Description**: Verifies FoodApiLambda behavior when PostgreSQL is unreachable.

- **System Scenario: STS-007-C1**
    - **Given** PostgreSQL (SYS-007) is unreachable (connection refused)
    - **When** FoodApiLambda receives `GET /v1/foods/12345`
    - **Then** FoodApiLambda returns `503 Service Unavailable`; no USDA API call is made; the error is logged to CloudWatch (SYS-012)

---

### Component Verification: SYS-008 (FoodDataRedisCache)

**Parent Requirements**: REQ-001, REQ-002, REQ-003, REQ-004, REQ-022, REQ-023

#### Test Case: STP-008-A (Cache Hit — Hot Food Data Served from Redis)

**Technique**: Interface Contract Testing
**Target View**: Interface View (SYS-001 → SYS-008 GET)
**Description**: Verifies that a Redis cache hit bypasses PostgreSQL and returns food data directly.

- **System Scenario: STS-008-A1**
    - **Given** Redis key `food:12345` exists with TTL > 0 and contains serialized food data with `fetch_status = 'fetched'`
    - **When** FoodApiLambda executes `GET food:12345`
    - **Then** FoodApiLambda returns the cached data as `200 OK`; no `SELECT` query is issued to SYS-007

#### Test Case: STP-008-B (Cache TTL Boundary — 24-Hour Expiry)

**Technique**: Boundary Value Analysis
**Target View**: Data Design View (Redis TTL: 24 hours = 86,400 seconds)
**Description**: Verifies that cached food data expires after exactly 24 hours.

- **System Scenario: STS-008-B1**
    - **Given** ConsumerLambda writes `SET food:12345 <data> EX 86400` to Redis after a successful USDA fetch
    - **When** 86,400 seconds elapse
    - **Then** `GET food:12345` returns nil (key expired); FoodApiLambda falls through to PostgreSQL on the next request

#### Test Case: STP-008-C (Pending-Set Deduplication — SISMEMBER / SADD)

**Technique**: Interface Contract Testing
**Target View**: Interface View (SYS-001 → SYS-008 pending_fetch set)
**Description**: Verifies that the `pending_fetch` Redis set prevents duplicate `FoodRequested` events for the same `fdcId`.

- **System Scenario: STS-008-C1**
    - **Given** `pending_fetch` Redis set contains `12345`
    - **When** FoodApiLambda receives `GET /v1/foods/12345` (cache miss, DB miss)
    - **Then** FoodApiLambda executes `SISMEMBER pending_fetch 12345` → returns 1; no `FoodRequested` event is published; response is `202 Accepted`

- **System Scenario: STS-008-C2**
    - **Given** `pending_fetch` Redis set does NOT contain `99999`
    - **When** FoodApiLambda receives `GET /v1/foods/99999` (cache miss, DB miss)
    - **Then** FoodApiLambda executes `SADD pending_fetch 99999`; a `FoodRequested` event is published to SYS-002; response is `202 Accepted`

#### Test Case: STP-008-D (Fault Injection — Redis Unavailable, Fallthrough to PostgreSQL)

**Technique**: Fault Injection
**Target View**: Dependency View (SYS-001 → SYS-008: Redis unavailable)
**Description**: Verifies that Redis unavailability causes FoodApiLambda to fall through to PostgreSQL without returning an error.

- **System Scenario: STS-008-D1**
    - **Given** Redis (SYS-008) is unreachable; PostgreSQL contains `fdc_id = 12345` with `fetch_status = 'fetched'`
    - **When** FoodApiLambda receives `GET /v1/foods/12345`
    - **Then** FoodApiLambda falls through to SYS-007; response is `200 OK` with food data; no `503` is returned due to Redis failure alone

---

### Component Verification: SYS-009 (USDAFoodDataCentralApi)

**Parent Requirements**: REQ-016, REQ-017, REQ-024

#### Test Case: STP-009-A (Batch Endpoint Contract — POST /v1/foods)

**Technique**: Interface Contract Testing
**Target View**: Interface View (IC-004: SYS-005 → SYS-009)
**Description**: Verifies that ConsumerLambda calls the USDA batch endpoint with the correct request schema and processes the response correctly.

- **System Scenario: STS-009-A1**
    - **Given** SYS-006 has ≥ 1 token; SQS message contains `{ "fdcIds": [12345, 67890] }`
    - **When** ConsumerLambda calls `POST https://api.nal.usda.gov/fdc/v1/foods` with `Authorization: Bearer <USDA_API_KEY>` and body `{ "fdcIds": [12345, 67890] }`
    - **Then** USDA API returns `200 OK` with an array of food objects; ConsumerLambda upserts each food into SYS-007

#### Test Case: STP-009-B (API Key Injection from Secrets Manager)

**Technique**: Interface Contract Testing
**Target View**: Interface View (SYS-011 → SYS-005: USDA_API_KEY injection)
**Description**: Verifies that ConsumerLambda uses the API key from SYS-011 (Secrets Manager) in all USDA API calls.

- **System Scenario: STS-009-B1**
    - **Given** `USDA_API_KEY` environment variable is set in ConsumerLambda from SYS-011
    - **When** ConsumerLambda calls the USDA API
    - **Then** the `Authorization` header contains the correct API key value; the USDA API returns `200 OK` (not `401 Unauthorized`)

---

### Component Verification: SYS-010 (WebSocketNotificationLambda)

**Parent Requirements**: REQ-025

#### Test Case: STP-010-A (Fire-and-Forget WebSocket Push — No Impact on API Lambda)

**Technique**: Fault Injection
**Target View**: Dependency View (SYS-010 → SYS-001: fire-and-forget)
**Description**: Verifies that WebSocketNotificationLambda failure does not affect FoodApiLambda or the core data pipeline.

- **System Scenario: STS-010-A1**
    - **Given** WebSocketNotificationLambda (SYS-010) is unavailable or throws an exception
    - **When** a `FoodDataReceived` event is published to SYS-002 by ConsumerLambda
    - **Then** the event routing to SYS-010 fails silently; FoodApiLambda continues to serve requests normally; ConsumerLambda continues processing; no error propagates to the core pipeline

#### Test Case: STP-010-B (WebSocket Push on FoodDataReceived Event)

**Technique**: Interface Contract Testing
**Target View**: Interface View (SYS-002 → SYS-010 event routing)
**Description**: Verifies that WebSocketNotificationLambda is triggered by `FoodDataReceived` events and pushes to connected clients.

- **System Scenario: STS-010-B1**
    - **Given** a client is connected to the API Gateway WebSocket API; ConsumerLambda publishes `FoodDataReceived { "fdcId": 12345, "fetchedAt": "<timestamp>" }` to SYS-002
    - **When** EventBridgeBus routes the event to SYS-010
    - **Then** WebSocketNotificationLambda calls `@connections/{connectionId}` on the API Gateway Management API with the food data payload; the connected client receives the push notification

---

### Component Verification: SYS-011 (SecretManagement)

**Parent Requirements**: REQ-026, REQ-027

#### Test Case: STP-011-A (API Key Injection into ConsumerLambda Environment)

**Technique**: Interface Contract Testing
**Target View**: Interface View (SYS-011 → SYS-005: USDA_API_KEY)
**Description**: Verifies that the USDA API key is retrieved from Secrets Manager and injected into ConsumerLambda as an environment variable.

- **System Scenario: STS-011-A1**
    - **Given** Secrets Manager contains a secret named `usda-food-data/api-key` with value `<valid-api-key>`
    - **When** ConsumerLambda is invoked
    - **Then** the `USDA_API_KEY` environment variable is populated with the secret value; ConsumerLambda successfully authenticates to the USDA API

#### Test Case: STP-011-B (Fault Injection — Secrets Manager Unavailable)

**Technique**: Fault Injection
**Target View**: Dependency View (SYS-005 → SYS-011: Secrets Manager unavailable)
**Description**: Verifies that ConsumerLambda stops processing when Secrets Manager is unreachable.

- **System Scenario: STS-011-B1**
    - **Given** Secrets Manager (SYS-011) is unreachable (network partition or IAM deny)
    - **When** ConsumerLambda attempts to retrieve the USDA API key
    - **Then** ConsumerLambda does NOT call the USDA API; processing stops; an error is logged to CloudWatch (SYS-012); SQS messages remain undeleted for retry

---

### Component Verification: SYS-012 (MonitoringAndLogging)

**Parent Requirements**: REQ-028, REQ-029, REQ-030

#### Test Case: STP-012-A (CloudWatch Log Emission — API Lambda and Consumer Lambda)

**Technique**: Interface Contract Testing
**Target View**: Interface View (SYS-001 → SYS-012; SYS-005 → SYS-012)
**Description**: Verifies that both FoodApiLambda and ConsumerLambda emit structured logs to CloudWatch.

- **System Scenario: STS-012-A1**
    - **Given** FoodApiLambda is invoked with `GET /v1/foods/12345`
    - **When** the request completes (success or error)
    - **Then** a structured log entry is written to the FoodApiLambda CloudWatch log group containing at minimum: `fdcId`, `fetch_status`, HTTP response code, and request duration

- **System Scenario: STS-012-A2**
    - **Given** ConsumerLambda processes a message from SYS-003
    - **When** the processing completes (success, 404, 429, or 5xx)
    - **Then** a structured log entry is written to the ConsumerLambda CloudWatch log group containing: `fdcId`, USDA response code, tokens consumed, and processing outcome

#### Test Case: STP-012-B (X-Ray Tracing — Distributed Request Visibility)

**Technique**: Interface Contract Testing
**Target View**: Interface View (SYS-001 → SYS-012 tracing)
**Description**: Verifies that X-Ray traces are emitted for distributed request flows spanning FoodApiLambda and ConsumerLambda.

- **System Scenario: STS-012-B1**
    - **Given** X-Ray active tracing is enabled on FoodApiLambda and ConsumerLambda
    - **When** a food lookup triggers the full pipeline: FoodApiLambda → EventBridge → SQS → ConsumerLambda → USDA API → PostgreSQL
    - **Then** an X-Ray trace is recorded with segments for each component; the trace is queryable in the X-Ray console by `fdcId` or `correlationId`

#### Test Case: STP-012-C (CloudWatch Alarm — Consumer Lambda Error Rate)

**Technique**: Equivalence Partitioning
**Target View**: Data Design View (alarm thresholds)
**Description**: Verifies that CloudWatch alarms fire when error rates exceed configured thresholds.

- **System Scenario: STS-012-C1**
    - **Given** a CloudWatch alarm is configured on ConsumerLambda error rate with threshold > 5% over 5 minutes
    - **When** ConsumerLambda error rate exceeds 5% (e.g., 6 errors in 100 invocations within 5 minutes)
    - **Then** the CloudWatch alarm transitions to `ALARM` state; an SNS notification is triggered

---

## Traceability Summary

| SYS ID  | Component Name              | Test Cases               | Scenarios                                              |
| ------- | --------------------------- | ------------------------ | ------------------------------------------------------ |
| SYS-001 | FoodApiLambda               | STP-001-A, B, C, D       | STS-001-A1, A2, B1, B2, B3, B4, C1, C2, C3, C4, D1, D2 |
| SYS-002 | EventBridgeBus              | STP-002-A, B, C          | STS-002-A1, B1, C1                                     |
| SYS-003 | HighPriorityFoodQueue       | STP-003-A, B             | STS-003-A1, B1                                         |
| SYS-004 | LowPriorityFoodQueue        | STP-004-A, B             | STS-004-A1, B1                                         |
| SYS-005 | FoodConsumerLambda          | STP-005-A, B, C, D, E, F | STS-005-A1, A2, B1, C1, C2, D1, E1, F1                 |
| SYS-006 | TokenBucketRateLimiter      | STP-006-A, B, C          | STS-006-A1, A2, B1, B2, B3, C1                         |
| SYS-007 | FoodDataPostgresRepository  | STP-007-A, B, C          | STS-007-A1, A2, B1, B2, C1                             |
| SYS-008 | FoodDataRedisCache          | STP-008-A, B, C, D       | STS-008-A1, B1, C1, C2, D1                             |
| SYS-009 | USDAFoodDataCentralApi      | STP-009-A, B             | STS-009-A1, B1                                         |
| SYS-010 | WebSocketNotificationLambda | STP-010-A, B             | STS-010-A1, B1                                         |
| SYS-011 | SecretManagement            | STP-011-A, B             | STS-011-A1, B1                                         |
| SYS-012 | MonitoringAndLogging        | STP-012-A, B, C          | STS-012-A1, A2, B1, C1                                 |

**Total Test Cases**: 29 STP
**Total Scenarios**: 43 STS
**Components Covered**: 12 / 12 (100%)
