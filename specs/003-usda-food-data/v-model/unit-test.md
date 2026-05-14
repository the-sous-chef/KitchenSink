# Unit Test Plan: USDA Food Data Integration

**Feature Branch**: `003-usda-food-data`
**Created**: 2026-05-09
**Status**: Draft
**Source**: `specs/003-usda-food-data/v-model/module-design.md`

## Overview

This document defines the Unit Test Plan for the USDA Food Data Integration feature. Every module design (`MOD-NNN`) in `module-design.md` has one or more Test Cases (`UTP-NNN-X`), and every Test Case has one or more executable Unit Scenarios (`UTS-NNN-X#`) in white-box Arrange/Act/Assert format.

Unit tests verify **internal module logic** — control flow, data transformations, state transitions, and variable boundaries. They do NOT test module boundaries (integration), user journeys (acceptance), or system-level behavior (system tests).

## ID Schema

- **Unit Test Case**: `UTP-{NNN}-{X}` — where NNN matches the parent MOD, X is a letter suffix (A, B, C...)
- **Unit Test Scenario**: `UTS-{NNN}-{X}{#}` — nested under the parent UTP, with numeric suffix (1, 2, 3...)
- Example: `UTS-001-A1` → Scenario 1 of Test Case A verifying MOD-001
- ID lineage: from `UTS-001-A1`, a regex extracts `UTP-001-A` and `MOD-001`. To find the `ARCH-NNN` ancestor, consult the "Parent Architecture Modules" field in `module-design.md`.

## ISO 29119-4 White-Box Techniques

Each test case MUST identify its technique by name and anchor to a specific module design view:

| Technique                       | Source View                   | What It Tests                                           |
| ------------------------------- | ----------------------------- | ------------------------------------------------------- |
| **Statement & Branch Coverage** | Algorithmic/Logic View        | Every line and every True/False branch outcome          |
| **Boundary Value Analysis**     | Internal Data Structures      | Scalar variable boundaries: min-1, min, mid, max, max+1 |
| **Equivalence Partitioning**    | Internal Data Structures      | Discrete non-scalar types: Booleans, Enums              |
| **Strict Isolation**            | Architecture Interface View   | Every external dependency mocked/stubbed                |
| **Error Guessing**              | Error Handling & Return Codes | Negative paths, invalid inputs, dependency exceptions   |
| **State Transition Testing**    | State Machine View            | Every transition including invalid ones                 |

---

## Unit Tests

---

### Module: MOD-001 (FoodApiController — Request Handler)

**Parent Architecture Modules**: ARCH-001
**Target Source File(s)**: `src/food-api/handler.ts`

---

#### Test Case: UTP-001-A (isValidFdcId — boundary and branch coverage)

**Technique**: Boundary Value Analysis + Statement & Branch Coverage
**Target View**: Algorithmic/Logic View + Internal Data Structures
**Description**: Verifies every branch of `isValidFdcId()` across the integer boundary: non-numeric, ≤0, valid range, and >9999999.

**Dependency & Mock Registry:**

None — `isValidFdcId` is a pure function with no external dependencies.

- **Unit Scenario: UTS-001-A1**
    - **Arrange**: Set `fdcId = 0`
    - **Act**: Call `isValidFdcId(0)`
    - **Assert**: Returns `false` (boundary: min-1 is 0, must be > 0)

- **Unit Scenario: UTS-001-A2**
    - **Arrange**: Set `fdcId = 1`
    - **Act**: Call `isValidFdcId(1)`
    - **Assert**: Returns `true` (boundary: min valid value)

- **Unit Scenario: UTS-001-A3**
    - **Arrange**: Set `fdcId = 5000000`
    - **Act**: Call `isValidFdcId(5000000)`
    - **Assert**: Returns `true` (mid-range valid value)

- **Unit Scenario: UTS-001-A4**
    - **Arrange**: Set `fdcId = 9999999`
    - **Act**: Call `isValidFdcId(9999999)`
    - **Assert**: Returns `true` (boundary: max valid value)

- **Unit Scenario: UTS-001-A5**
    - **Arrange**: Set `fdcId = 10000000`
    - **Act**: Call `isValidFdcId(10000000)`
    - **Assert**: Returns `false` (boundary: max+1 exceeds limit)

- **Unit Scenario: UTS-001-A6**
    - **Arrange**: Set `fdcId = "abc"` (non-numeric string)
    - **Act**: Call `isValidFdcId("abc")`
    - **Assert**: Returns `false` (non-integer input)

- **Unit Scenario: UTS-001-A7**
    - **Arrange**: Set `fdcId = -1`
    - **Act**: Call `isValidFdcId(-1)`
    - **Assert**: Returns `false` (negative integer)

---

#### Test Case: UTP-001-B (handleGetFood — 4-layer cache lookup branch coverage)

**Technique**: Statement & Branch Coverage
**Target View**: Algorithmic/Logic View
**Description**: Verifies every branch in `handleGetFood()`: invalid fdcId → 400; Redis HIT → 200; Redis MISS + DB HIT → 200; Redis MISS + DB MISS + pending → 202; Redis MISS + DB MISS + not pending → 202 with backfill trigger.

**Dependency & Mock Registry:**

| Dependency             | Source   | Mock/Stub Strategy                                   | Rationale                                 |
| ---------------------- | -------- | ---------------------------------------------------- | ----------------------------------------- |
| `RedisCacheService`    | ARCH-007 | Mock: `get()` returns null or FoodData stub          | Isolate Redis layer from controller logic |
| `PostgresRepository`   | ARCH-006 | Mock: `findByFdcId()` returns null or FoodData stub  | Isolate DB layer from controller logic    |
| `EventBridgePublisher` | ARCH-002 | Mock: `publishFoodRequested()` returns `{ eventId }` | Prevent real EventBridge calls            |
| `MonitoringLogger`     | ARCH-011 | Stub: no-op                                          | Prevent CloudWatch side-effects           |

- **Unit Scenario: UTS-001-B1**
    - **Arrange**: Set `event.pathParameters.fdcId = "abc"`; `isValidFdcId` returns `false`
    - **Act**: Call `handleGetFood(event)` with mocked dependencies
    - **Assert**: Returns `{ statusCode: 400, body: '{"error":"Invalid fdcId format"}' }`; `RedisCacheService.get` NOT called; `PostgresRepository.findByFdcId` NOT called

- **Unit Scenario: UTS-001-B2**
    - **Arrange**: Set `event.pathParameters.fdcId = "12345"`; `RedisCacheService.get` mock returns `{ fdcId: 12345, description: "Apple" }` (cache HIT)
    - **Act**: Call `handleGetFood(event)`
    - **Assert**: Returns `{ statusCode: 200, body: contains fdcId 12345 }`; `MonitoringLogger.incrementMetric` called with `"cache.hit", 1`; `PostgresRepository.findByFdcId` NOT called

- **Unit Scenario: UTS-001-B3**
    - **Arrange**: Set `fdcId = "12345"`; `RedisCacheService.get` returns `null`; `PostgresRepository.findByFdcId` returns `{ fdcId: 12345, fetch_status: "fetched" }`
    - **Act**: Call `handleGetFood(event)`
    - **Assert**: Returns `{ statusCode: 200 }`; `RedisCacheService.set` called with `fdcId=12345, TTL=3600`; `MonitoringLogger.incrementMetric` called with `"db.hit", 1`

- **Unit Scenario: UTS-001-B4**
    - **Arrange**: Set `fdcId = "12345"`; `RedisCacheService.get` returns `null`; `PostgresRepository.findByFdcId` returns `null`; `RedisCacheService.isPending` returns `true`
    - **Act**: Call `handleGetFood(event)`
    - **Assert**: Returns `{ statusCode: 202, body: contains "pending" }`; `EventBridgePublisher.publishFoodRequested` NOT called; `RedisCacheService.markPending` NOT called

- **Unit Scenario: UTS-001-B5**
    - **Arrange**: Set `fdcId = "12345"`; `RedisCacheService.get` returns `null`; `PostgresRepository.findByFdcId` returns `null`; `RedisCacheService.isPending` returns `false`
    - **Act**: Call `handleGetFood(event)`
    - **Assert**: Returns `{ statusCode: 202, body: contains "pending" }`; `RedisCacheService.markPending` called with `12345`; `EventBridgePublisher.publishFoodRequested` called with `{ fdcId: 12345 }`; `MonitoringLogger.incrementMetric` called with `"backfill.triggered", 1`

---

#### Test Case: UTP-001-C (handleSearchFoods — query length branch coverage)

**Technique**: Statement & Branch Coverage + Boundary Value Analysis
**Target View**: Algorithmic/Logic View + Internal Data Structures
**Description**: Verifies `handleSearchFoods()` rejects queries shorter than 2 characters and passes valid queries to the repository.

**Dependency & Mock Registry:**

| Dependency           | Source   | Mock/Stub Strategy                              | Rationale                    |
| -------------------- | -------- | ----------------------------------------------- | ---------------------------- |
| `PostgresRepository` | ARCH-006 | Mock: `searchFoods()` returns `[]` or food list | Isolate DB from search logic |

- **Unit Scenario: UTS-001-C1**
    - **Arrange**: Set `event.queryStringParameters.query = "a"` (length 1)
    - **Act**: Call `handleSearchFoods(event)`
    - **Assert**: Returns `{ statusCode: 400, body: '{"error":"Query too short"}' }`; `PostgresRepository.searchFoods` NOT called

- **Unit Scenario: UTS-001-C2**
    - **Arrange**: Set `event.queryStringParameters.query = ""` (length 0)
    - **Act**: Call `handleSearchFoods(event)`
    - **Assert**: Returns `{ statusCode: 400 }`; `PostgresRepository.searchFoods` NOT called

- **Unit Scenario: UTS-001-C3**
    - **Arrange**: Set `event.queryStringParameters.query = "ap"` (length 2, boundary min valid); `PostgresRepository.searchFoods` mock returns `[{ fdcId: 1, description: "Apple" }]`
    - **Act**: Call `handleSearchFoods(event)`
    - **Assert**: Returns `{ statusCode: 200, body: contains foods array }`; `PostgresRepository.searchFoods` called with `"ap"`

---

#### Test Case: UTP-001-D (handleGetFoodStatus — state machine transitions)

**Technique**: State Transition Testing
**Target View**: State Machine View
**Description**: Verifies `handleGetFoodStatus()` transitions: invalid fdcId → Rejected; DB null + pending → 200 pending; DB null + not pending → 404; DB row found → 200 with status.

**Dependency & Mock Registry:**

| Dependency           | Source   | Mock/Stub Strategy                             | Rationale                    |
| -------------------- | -------- | ---------------------------------------------- | ---------------------------- |
| `PostgresRepository` | ARCH-006 | Mock: `findByFdcId()` returns null or row stub | Isolate DB from status logic |
| `RedisCacheService`  | ARCH-007 | Mock: `isPending()` returns boolean            | Isolate Redis from logic     |

- **Unit Scenario: UTS-001-D1**
    - **Arrange**: Set `fdcId = "-5"` (invalid); `isValidFdcId` returns `false`
    - **Act**: Call `handleGetFoodStatus(event)`
    - **Assert**: Returns `{ statusCode: 400 }`; `PostgresRepository.findByFdcId` NOT called

- **Unit Scenario: UTS-001-D2**
    - **Arrange**: Set `fdcId = "12345"`; `PostgresRepository.findByFdcId` returns `null`; `RedisCacheService.isPending` returns `true`
    - **Act**: Call `handleGetFoodStatus(event)`
    - **Assert**: Returns `{ statusCode: 200, body: contains '"status":"pending"' }`

- **Unit Scenario: UTS-001-D3**
    - **Arrange**: Set `fdcId = "12345"`; `PostgresRepository.findByFdcId` returns `null`; `RedisCacheService.isPending` returns `false`
    - **Act**: Call `handleGetFoodStatus(event)`
    - **Assert**: Returns `{ statusCode: 404 }`

- **Unit Scenario: UTS-001-D4**
    - **Arrange**: Set `fdcId = "12345"`; `PostgresRepository.findByFdcId` returns `{ fdcId: 12345, fetch_status: "fetched", nutrients: {} }`
    - **Act**: Call `handleGetFoodStatus(event)`
    - **Assert**: Returns `{ statusCode: 200, body: contains foodData }`

- **Unit Scenario: UTS-001-D5**
    - **Arrange**: Set `fdcId = "12345"`; `PostgresRepository.findByFdcId` returns `{ fdcId: 12345, fetch_status: "not_found" }`
    - **Act**: Call `handleGetFoodStatus(event)`
    - **Assert**: Returns `{ statusCode: 200, body: contains '"status":"not_found"' }`; `foodData` field absent

---

#### Test Case: UTP-001-E (handleGetNutrition — fetch_status guard)

**Technique**: Equivalence Partitioning
**Target View**: Internal Data Structures (`FetchStatus` enum)
**Description**: Verifies `handleGetNutrition()` returns 404 for all non-`fetched` FetchStatus values and 200 only when `fetch_status == "fetched"`.

**Dependency & Mock Registry:**

| Dependency           | Source   | Mock/Stub Strategy                                            | Rationale                       |
| -------------------- | -------- | ------------------------------------------------------------- | ------------------------------- |
| `PostgresRepository` | ARCH-006 | Mock: `findByFdcId()` returns row with varying `fetch_status` | Isolate DB from nutrition logic |

- **Unit Scenario: UTS-001-E1**
    - **Arrange**: Set `fdcId = "12345"`; `PostgresRepository.findByFdcId` returns `null`
    - **Act**: Call `handleGetNutrition(event)`
    - **Assert**: Returns `{ statusCode: 404, body: contains "Nutrition data not available" }`

- **Unit Scenario: UTS-001-E2**
    - **Arrange**: Set `fdcId = "12345"`; `PostgresRepository.findByFdcId` returns `{ fetch_status: "pending" }`
    - **Act**: Call `handleGetNutrition(event)`
    - **Assert**: Returns `{ statusCode: 404 }`

- **Unit Scenario: UTS-001-E3**
    - **Arrange**: Set `fdcId = "12345"`; `PostgresRepository.findByFdcId` returns `{ fetch_status: "not_found" }`
    - **Act**: Call `handleGetNutrition(event)`
    - **Assert**: Returns `{ statusCode: 404 }`

- **Unit Scenario: UTS-001-E4**
    - **Arrange**: Set `fdcId = "12345"`; `PostgresRepository.findByFdcId` returns `{ fetch_status: "fetched", nutrients: { protein: { amount: 2.5, unit: "g" } } }`
    - **Act**: Call `handleGetNutrition(event)`
    - **Assert**: Returns `{ statusCode: 200, body: contains nutrients object }`

---

### Module: MOD-002 (EventBridgePublisher — Event Emitter)

**Parent Architecture Modules**: ARCH-002
**Target Source File(s)**: `src/events/event-bridge-publisher.ts`

---

#### Test Case: UTP-002-A (publishFoodRequested — validation and happy path)

**Technique**: Statement & Branch Coverage + Strict Isolation
**Target View**: Algorithmic/Logic View
**Description**: Verifies `publishFoodRequested()` throws `ValidationError` for invalid inputs and calls `EventBridgeClient.putEvents` with correct entry shape on valid input.

**Dependency & Mock Registry:**

| Dependency          | Source             | Mock/Stub Strategy                                                                     | Rationale                       |
| ------------------- | ------------------ | -------------------------------------------------------------------------------------- | ------------------------------- |
| `EventBridgeClient` | AWS SDK (external) | Mock: `putEvents()` returns `{ FailedEntryCount: 0, Entries: [{ EventId: "evt-1" }] }` | Prevent real AWS calls          |
| `MonitoringLogger`  | ARCH-011           | Stub: no-op                                                                            | Prevent CloudWatch side-effects |

- **Unit Scenario: UTS-002-A1**
    - **Arrange**: Set `payload = { fdcId: 0, requestedAt: "2026-05-09T00:00:00Z" }` (invalid fdcId)
    - **Act**: Call `publishFoodRequested(payload)`
    - **Assert**: Throws `ValidationError("Invalid fdcId")`; `EventBridgeClient.putEvents` NOT called

- **Unit Scenario: UTS-002-A2**
    - **Arrange**: Set `payload = { fdcId: 12345, requestedAt: "not-a-date" }` (invalid timestamp)
    - **Act**: Call `publishFoodRequested(payload)`
    - **Assert**: Throws `ValidationError("Invalid requestedAt timestamp")`; `EventBridgeClient.putEvents` NOT called

- **Unit Scenario: UTS-002-A3**
    - **Arrange**: Set `payload = { fdcId: 12345, requestedAt: "2026-05-09T00:00:00Z" }`; `EventBridgeClient.putEvents` mock returns `{ FailedEntryCount: 0, Entries: [{ EventId: "evt-abc" }] }`
    - **Act**: Call `publishFoodRequested(payload)`
    - **Assert**: Returns `{ eventId: "evt-abc" }`; `EventBridgeClient.putEvents` called with `{ Entries: [{ Source: "usda-food-data", DetailType: "FoodRequested", Detail: contains fdcId 12345, EventBusName: ENV.EVENT_BUS_NAME }] }`

- **Unit Scenario: UTS-002-A4**
    - **Arrange**: Set valid `payload`; `EventBridgeClient.putEvents` mock returns `{ FailedEntryCount: 1, Entries: [{ ErrorCode: "ThrottlingException" }] }`
    - **Act**: Call `publishFoodRequested(payload)`
    - **Assert**: Throws `EventBridgeError("PutEvents partial failure", "ThrottlingException")`

---

#### Test Case: UTP-002-B (publishFoodBatchRequested — batch size boundary)

**Technique**: Boundary Value Analysis
**Target View**: Internal Data Structures (`fdcIds` array length)
**Description**: Verifies `publishFoodBatchRequested()` enforces the 1–20 item batch size constraint at boundaries.

**Dependency & Mock Registry:**

| Dependency          | Source             | Mock/Stub Strategy                                                                  | Rationale              |
| ------------------- | ------------------ | ----------------------------------------------------------------------------------- | ---------------------- |
| `EventBridgeClient` | AWS SDK (external) | Mock: `putEvents()` returns `{ FailedEntryCount: 0, Entries: [{ EventId: "e1" }] }` | Prevent real AWS calls |

- **Unit Scenario: UTS-002-B1**
    - **Arrange**: Set `payload.fdcIds = []` (length 0, below min)
    - **Act**: Call `publishFoodBatchRequested(payload)`
    - **Assert**: Throws `ValidationError("fdcIds must be 1–20 items")`; `EventBridgeClient.putEvents` NOT called

- **Unit Scenario: UTS-002-B2**
    - **Arrange**: Set `payload.fdcIds = [1]` (length 1, min valid); `requestedAt` valid ISO8601
    - **Act**: Call `publishFoodBatchRequested(payload)`
    - **Assert**: Returns `{ eventId: "e1" }`; `EventBridgeClient.putEvents` called with `DetailType: "FoodBatchRequested"`

- **Unit Scenario: UTS-002-B3**
    - **Arrange**: Set `payload.fdcIds = Array(20).fill(1).map((_, i) => i + 1)` (length 20, max valid)
    - **Act**: Call `publishFoodBatchRequested(payload)`
    - **Assert**: Returns `{ eventId: "e1" }`; `EventBridgeClient.putEvents` called once

- **Unit Scenario: UTS-002-B4**
    - **Arrange**: Set `payload.fdcIds = Array(21).fill(1).map((_, i) => i + 1)` (length 21, max+1)
    - **Act**: Call `publishFoodBatchRequested(payload)`
    - **Assert**: Throws `ValidationError("fdcIds must be 1–20 items")`

---

#### Test Case: UTP-002-C (publishFoodDataReceived — fire-and-forget error handling)

**Technique**: Statement & Branch Coverage
**Target View**: Algorithmic/Logic View (fire-and-forget branch)
**Description**: Verifies `publishFoodDataReceived()` logs but does NOT throw when `EventBridgeClient.putEvents` returns a failure.

**Dependency & Mock Registry:**

| Dependency          | Source             | Mock/Stub Strategy                                                                   | Rationale                            |
| ------------------- | ------------------ | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `EventBridgeClient` | AWS SDK (external) | Mock: `putEvents()` returns `{ FailedEntryCount: 1, Entries: [{ ErrorCode: "X" }] }` | Simulate partial failure             |
| `MonitoringLogger`  | ARCH-011           | Mock: `logRequest()` records call args                                               | Verify log call without side-effects |

- **Unit Scenario: UTS-002-C1**
    - **Arrange**: Set `payload = { fdcId: 12345, foodData: { description: "Apple" } }`; `EventBridgeClient.putEvents` mock returns `{ FailedEntryCount: 1, Entries: [{ ErrorCode: "ThrottlingException" }] }`
    - **Act**: Call `publishFoodDataReceived(payload)`
    - **Assert**: Does NOT throw; `MonitoringLogger.logRequest` called with `"eb-publish-fail"` and `{ fdcId: 12345 }`

- **Unit Scenario: UTS-002-C2**
    - **Arrange**: Set valid `payload`; `EventBridgeClient.putEvents` mock returns `{ FailedEntryCount: 0, Entries: [{ EventId: "e1" }] }`
    - **Act**: Call `publishFoodDataReceived(payload)`
    - **Assert**: Does NOT throw; `MonitoringLogger.logRequest` NOT called with `"eb-publish-fail"`

---

### Module: MOD-003 (SqsQueueRouter — EventBridge Rule Router)

**Parent Architecture Modules**: ARCH-003
**Target Source File(s)**: `infra/lib/sqs-queue-router.ts` (CDK construct)

---

#### Test Case: UTP-003-A (deduplicateMessage — MessageDeduplicationId generation)

**Technique**: Statement & Branch Coverage + Boundary Value Analysis
**Target View**: Algorithmic/Logic View (`deduplicateMessage` function)
**Description**: Verifies the deduplication ID is deterministic within a 5-minute window and changes across window boundaries.

**Dependency & Mock Registry:**

None — `deduplicateMessage` is a pure function (SHA256 hash of fdcId + time-bucketed timestamp).

- **Unit Scenario: UTS-003-A1**
    - **Arrange**: Set `fdcId = 12345`; set `now()` to `T = 1000` (floor(1000/300) = 3)
    - **Act**: Call `deduplicateMessage(12345)` at time T
    - **Assert**: `MessageDeduplicationId` equals `SHA256("FoodRequested:12345:3")`; `MessageGroupId` equals `"food-12345"`

- **Unit Scenario: UTS-003-A2**
    - **Arrange**: Set `fdcId = 12345`; set `now()` to `T = 1299` (still floor(1299/300) = 4, same window as T=1200)
    - **Act**: Call `deduplicateMessage(12345)` at time T and at T+1
    - **Assert**: Both calls return identical `MessageDeduplicationId` (same 5-minute bucket)

- **Unit Scenario: UTS-003-A3**
    - **Arrange**: Set `fdcId = 12345`; call at `T = 1199` (bucket 3) and `T = 1200` (bucket 4)
    - **Act**: Call `deduplicateMessage(12345)` at both times
    - **Assert**: `MessageDeduplicationId` values differ (window boundary crossed)

---

#### Test Case: UTP-003-B (configureDlq — redrive policy values)

**Technique**: Equivalence Partitioning
**Target View**: Internal Data Structures (`RedrivePolicy`)
**Description**: Verifies `configureDlq()` sets `maxReceiveCount` correctly for HighPriority (3) and LowPriority (5) queues.

**Dependency & Mock Registry:**

None — `configureDlq` is a pure configuration function operating on a queue object.

- **Unit Scenario: UTS-003-B1**
    - **Arrange**: Create `queue = {}` stub; set `dlqArn = "arn:aws:sqs:us-east-1:123:dlq"`; set `maxReceiveCount = 3`
    - **Act**: Call `configureDlq(queue, dlqArn, 3)`
    - **Assert**: `queue.RedrivePolicy.deadLetterTargetArn` equals `dlqArn`; `queue.RedrivePolicy.maxReceiveCount` equals `3`

- **Unit Scenario: UTS-003-B2**
    - **Arrange**: Create `queue = {}` stub; set `maxReceiveCount = 5`
    - **Act**: Call `configureDlq(queue, dlqArn, 5)`
    - **Assert**: `queue.RedrivePolicy.maxReceiveCount` equals `5`

---

### Module: MOD-004 (FoodConsumerService — SQS Message Processor)

**Parent Architecture Modules**: ARCH-004
**Target Source File(s)**: `src/consumer/food-consumer.ts`

---

#### Test Case: UTP-004-A (processRecord — rate limit exhausted branch)

**Technique**: Statement & Branch Coverage + State Transition Testing
**Target View**: Algorithmic/Logic View + State Machine View (CheckingRateLimit → RequeueingMessage)
**Description**: Verifies `processRecord()` changes message visibility and returns `{ failed: false }` when token bucket is exhausted.

**Dependency & Mock Registry:**

| Dependency               | Source   | Mock/Stub Strategy                                                               | Rationale                           |
| ------------------------ | -------- | -------------------------------------------------------------------------------- | ----------------------------------- |
| `TokenBucketRateLimiter` | ARCH-005 | Mock: `checkTokens()` returns `{ allowed: false }`; `getWaitTime()` returns `25` | Simulate exhausted bucket           |
| `SqsClient`              | AWS SDK  | Mock: `changeMessageVisibility()` records args                                   | Prevent real SQS calls              |
| `UsdaApiClient`          | ARCH-008 | Mock: NOT called (assert)                                                        | Verify USDA not called when limited |

- **Unit Scenario: UTS-004-A1**
    - **Arrange**: Set `record = { messageId: "msg-1", receiptHandle: "rh-1", body: '{"fdcId":12345}' }`; `TokenBucketRateLimiter.checkTokens` returns `{ allowed: false }`; `TokenBucketRateLimiter.getWaitTime` returns `25`
    - **Act**: Call `processRecord(record)`
    - **Assert**: Returns `{ failed: false, messageId: "msg-1" }`; `SqsClient.changeMessageVisibility` called with `("rh-1", 30)` (25 + 5); `UsdaApiClient.fetchFoods` NOT called

---

#### Test Case: UTP-004-B (processRecord — USDA error branches)

**Technique**: Statement & Branch Coverage
**Target View**: Algorithmic/Logic View (CATCH branches)
**Description**: Verifies `processRecord()` handles USDA 429, 5xx, and 404 errors with correct SQS outcomes.

**Dependency & Mock Registry:**

| Dependency               | Source   | Mock/Stub Strategy                                                   | Rationale                      |
| ------------------------ | -------- | -------------------------------------------------------------------- | ------------------------------ |
| `TokenBucketRateLimiter` | ARCH-005 | Mock: `checkTokens()` returns `{ allowed: true }`                    | Allow rate limit to pass       |
| `UsdaApiClient`          | ARCH-008 | Mock: `fetchFoods()` throws `UsdaApiError` with varying status codes | Simulate USDA error responses  |
| `SqsClient`              | AWS SDK  | Mock: `changeMessageVisibility()` records args                       | Verify visibility change calls |
| `PostgresRepository`     | ARCH-006 | Mock: `updateFetchStatus()` records args                             | Verify DB update on 404        |
| `RedisCacheService`      | ARCH-007 | Mock: `clearPending()` records args                                  | Verify pending cleared on 404  |

- **Unit Scenario: UTS-004-B1**
    - **Arrange**: `UsdaApiClient.fetchFoods` throws `UsdaApiError` with `status = 429`; `record.receiptHandle = "rh-1"`
    - **Act**: Call `processRecord(record)`
    - **Assert**: Returns `{ failed: false, messageId: record.messageId }`; `SqsClient.changeMessageVisibility` called with `("rh-1", 60)`

- **Unit Scenario: UTS-004-B2**
    - **Arrange**: `UsdaApiClient.fetchFoods` throws `UsdaApiError` with `status = 503`
    - **Act**: Call `processRecord(record)`
    - **Assert**: Returns `{ failed: true, messageId: record.messageId }`; `SqsClient.changeMessageVisibility` NOT called

- **Unit Scenario: UTS-004-B3**
    - **Arrange**: `UsdaApiClient.fetchFoods` throws `UsdaApiError` with `status = 404`; `message.fdcId = 12345`
    - **Act**: Call `processRecord(record)`
    - **Assert**: Returns `{ failed: false, messageId: record.messageId }`; `PostgresRepository.updateFetchStatus` called with `(12345, "not_found")`; `RedisCacheService.clearPending` called with `12345`

---

#### Test Case: UTP-004-C (processRecord — successful fetch and persist)

**Technique**: Statement & Branch Coverage + State Transition Testing
**Target View**: Algorithmic/Logic View + State Machine View (FetchingFromUsda → PersistingResults → PublishingEvent)
**Description**: Verifies `processRecord()` upserts each food, invalidates cache, clears pending, publishes event, and increments metric on successful USDA fetch.

**Dependency & Mock Registry:**

| Dependency               | Source   | Mock/Stub Strategy                                                      | Rationale                      |
| ------------------------ | -------- | ----------------------------------------------------------------------- | ------------------------------ |
| `TokenBucketRateLimiter` | ARCH-005 | Mock: `checkTokens()` returns `{ allowed: true }`                       | Allow rate limit to pass       |
| `UsdaApiClient`          | ARCH-008 | Mock: `fetchFoods()` returns `[{ fdcId: 12345, description: "Apple" }]` | Simulate successful USDA fetch |
| `PostgresRepository`     | ARCH-006 | Mock: `upsertFood()` returns `{ success: true }`                        | Prevent real DB writes         |
| `RedisCacheService`      | ARCH-007 | Mock: `invalidate()` and `clearPending()` record args                   | Verify cache operations        |
| `EventBridgePublisher`   | ARCH-002 | Mock: `publishFoodDataReceived()` records args                          | Verify event published         |
| `MonitoringLogger`       | ARCH-011 | Mock: `incrementMetric()` records args                                  | Verify metric emitted          |

- **Unit Scenario: UTS-004-C1**
    - **Arrange**: `record.body = '{"fdcId":12345}'`; `UsdaApiClient.fetchFoods` returns `[{ fdcId: 12345, description: "Apple" }]`
    - **Act**: Call `processRecord(record)`
    - **Assert**: Returns `{ failed: false, messageId: record.messageId }`; `PostgresRepository.upsertFood` called with `{ fdcId: 12345 }`; `RedisCacheService.invalidate` called with `12345`; `RedisCacheService.clearPending` called with `12345`; `EventBridgePublisher.publishFoodDataReceived` called with `{ fdcId: 12345 }`; `MonitoringLogger.incrementMetric` called with `("consumer.processed", 1)`

---

#### Test Case: UTP-004-D (handler — batch item failure aggregation)

**Technique**: Statement & Branch Coverage
**Target View**: Algorithmic/Logic View (`handler` function)
**Description**: Verifies `handler()` correctly aggregates `batchItemFailures` from mixed success/failure records.

**Dependency & Mock Registry:**

| Dependency      | Source   | Mock/Stub Strategy                                                                                                     | Rationale                   |
| --------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `processRecord` | Internal | Spy: first call returns `{ failed: false, messageId: "msg-1" }`; second returns `{ failed: true, messageId: "msg-2" }` | Control per-record outcomes |

- **Unit Scenario: UTS-004-D1**
    - **Arrange**: Set `sqsEvent.Records = [{ messageId: "msg-1" }, { messageId: "msg-2" }]`; `processRecord` spy returns `{ failed: false }` for msg-1 and `{ failed: true }` for msg-2
    - **Act**: Call `handler(sqsEvent)`
    - **Assert**: Returns `{ batchItemFailures: [{ itemIdentifier: "msg-2" }] }` (only failed record included)

- **Unit Scenario: UTS-004-D2**
    - **Arrange**: Set `sqsEvent.Records = [{ messageId: "msg-1" }]`; `processRecord` spy returns `{ failed: false }`
    - **Act**: Call `handler(sqsEvent)`
    - **Assert**: Returns `{ batchItemFailures: [] }` (empty array, no failures)

---

### Module: MOD-005 (TokenBucketRateLimiter — Redis Lua Script Rate Limiter)

**Parent Architecture Modules**: ARCH-005 [CROSS-CUTTING]
**Target Source File(s)**: `src/rate-limiter/token-bucket.ts`

---

#### Test Case: UTP-005-A (Lua script logic — token refill and consumption)

**Technique**: Statement & Branch Coverage + Boundary Value Analysis
**Target View**: Algorithmic/Logic View (Lua script)
**Description**: Verifies the Lua script's token refill calculation and the allowed/denied branch at the token boundary.

**Dependency & Mock Registry:**

| Dependency    | Source      | Mock/Stub Strategy                                                                                 | Rationale                              |
| ------------- | ----------- | -------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `RedisClient` | ElastiCache | Mock: `eval()` / `evalsha()` executes Lua script logic in-process (or use embedded Redis for unit) | Isolate from real Redis infrastructure |

- **Unit Scenario: UTS-005-A1**
    - **Arrange**: Set `tokens = 1.0`, `last_refill = now - 0` (no elapsed time), `capacity = 1000`, `refill_rate = 0.2778`
    - **Act**: Execute Lua script via mock Redis `eval`
    - **Assert**: Returns `[1, 0]` (allowed=true, tokensRemaining=0); `SET BUCKET_KEY 0` called; `SET LAST_REFILL_KEY now` called

- **Unit Scenario: UTS-005-A2**
    - **Arrange**: Set `tokens = 0.5`, `last_refill = now - 0` (no elapsed time, tokens < 1)
    - **Act**: Execute Lua script
    - **Assert**: Returns `[0, 0]` (allowed=false, tokensRemaining=0 after clamp); `SET BUCKET_KEY` called with value < 1

- **Unit Scenario: UTS-005-A3**
    - **Arrange**: Set `tokens = 0`, `last_refill = now - 3600` (1 hour elapsed); `capacity = 1000`, `refill_rate = 0.2778`
    - **Act**: Execute Lua script
    - **Assert**: `new_tokens` clamped to `1000` (capacity); returns `[1, 999]` (allowed=true, 999 remaining after consuming 1)

- **Unit Scenario: UTS-005-A4**
    - **Arrange**: Set `tokens = 0`, `last_refill = now - 1` (1 second elapsed, refill = 0.2778 < 1)
    - **Act**: Execute Lua script
    - **Assert**: Returns `[0, ...]` (allowed=false; 0.2778 tokens insufficient to consume 1)

---

#### Test Case: UTP-005-B (checkTokens — Redis unavailability error propagation)

**Technique**: Statement & Branch Coverage
**Target View**: Error Handling Return Codes
**Description**: Verifies `checkTokens()` throws `RateLimiterError` when Redis is unavailable or times out.

**Dependency & Mock Registry:**

| Dependency    | Source      | Mock/Stub Strategy                             | Rationale                     |
| ------------- | ----------- | ---------------------------------------------- | ----------------------------- |
| `RedisClient` | ElastiCache | Mock: `eval()` throws `ConnectionRefusedError` | Simulate Redis unavailability |

- **Unit Scenario: UTS-005-B1**
    - **Arrange**: `RedisClient.eval` mock throws `ConnectionRefusedError`
    - **Act**: Call `checkTokens()`
    - **Assert**: Throws `RateLimiterError`; error message contains "unavailable" or "connection"

- **Unit Scenario: UTS-005-B2**
    - **Arrange**: `RedisClient.eval` mock throws `TimeoutError` after 100ms
    - **Act**: Call `checkTokens()`
    - **Assert**: Throws `RateLimiterError`

---

#### Test Case: UTP-005-C (state transitions — TokensAvailable ↔ TokensExhausted)

**Technique**: State Transition Testing
**Target View**: State Machine View
**Description**: Verifies the state machine transitions between `TokensAvailable` and `TokensExhausted` as tokens are consumed and time elapses.

**Dependency & Mock Registry:**

| Dependency    | Source      | Mock/Stub Strategy                                                    | Rationale                               |
| ------------- | ----------- | --------------------------------------------------------------------- | --------------------------------------- |
| `RedisClient` | ElastiCache | Mock: `eval()` returns controlled `[allowed, tokensRemaining]` tuples | Drive state machine through transitions |

- **Unit Scenario: UTS-005-C1**
    - **Arrange**: `RedisClient.eval` returns `[1, 5]` (tokens available)
    - **Act**: Call `checkTokens()`
    - **Assert**: Returns `{ allowed: true, tokensRemaining: 5 }` (state: TokensAvailable)

- **Unit Scenario: UTS-005-C2**
    - **Arrange**: `RedisClient.eval` returns `[1, 0]` (last token consumed)
    - **Act**: Call `checkTokens()`
    - **Assert**: Returns `{ allowed: true, tokensRemaining: 0 }` (transition: TokensAvailable → TokensExhausted)

- **Unit Scenario: UTS-005-C3**
    - **Arrange**: `RedisClient.eval` returns `[0, 0]` (exhausted)
    - **Act**: Call `checkTokens()`
    - **Assert**: Returns `{ allowed: false, tokensRemaining: 0 }` (state: TokensExhausted)

---

### Module: MOD-006 (FoodPostgresRepository — Database Access Layer)

**Parent Architecture Modules**: ARCH-006
**Target Source File(s)**: `src/repository/food-postgres-repository.ts`

---

#### Test Case: UTP-006-A (findByFdcId — row mapping and null return)

**Technique**: Statement & Branch Coverage + Strict Isolation
**Target View**: Algorithmic/Logic View
**Description**: Verifies `findByFdcId()` returns `null` when no rows found and correctly maps a row to `FoodData` when found.

**Dependency & Mock Registry:**

| Dependency | Source  | Mock/Stub Strategy                                              | Rationale                   |
| ---------- | ------- | --------------------------------------------------------------- | --------------------------- |
| `pool`     | pg Pool | Mock: `query()` returns `{ rows: [] }` or `{ rows: [rowStub] }` | Prevent real DB connections |

- **Unit Scenario: UTS-006-A1**
    - **Arrange**: `pool.query` mock returns `{ rows: [] }` for `fdcId = 12345`
    - **Act**: Call `findByFdcId(12345)`
    - **Assert**: Returns `null`; `pool.query` called with SQL containing `$1` and params `[12345]`

- **Unit Scenario: UTS-006-A2**
    - **Arrange**: `pool.query` mock returns `{ rows: [{ fdc_id: 12345, description: "Apple", brand_owner: null, nutrients: '{"protein":{"amount":0.3,"unit":"g"}}', fetch_status: "fetched", fetched_at: new Date() }] }`
    - **Act**: Call `findByFdcId(12345)`
    - **Assert**: Returns `FoodData` object with `fdcId = 12345`, `description = "Apple"`, `fetchStatus = "fetched"`, `nutrients.protein.amount = 0.3`

---

#### Test Case: UTP-006-B (upsertFood — SQL construction and conflict handling)

**Technique**: Statement & Branch Coverage + Strict Isolation
**Target View**: Algorithmic/Logic View
**Description**: Verifies `upsertFood()` executes the correct `INSERT ... ON CONFLICT DO UPDATE` SQL and returns `{ success: true }`.

**Dependency & Mock Registry:**

| Dependency | Source  | Mock/Stub Strategy                        | Rationale              |
| ---------- | ------- | ----------------------------------------- | ---------------------- |
| `pool`     | pg Pool | Mock: `query()` returns `{ rowCount: 1 }` | Prevent real DB writes |

- **Unit Scenario: UTS-006-B1**
    - **Arrange**: Set `food = { fdcId: 12345, description: "Apple", brandOwner: "Brand A", nutrients: { protein: { amount: 0.3, unit: "g" } }, fetchStatus: "fetched" }`
    - **Act**: Call `upsertFood(food)`
    - **Assert**: Returns `{ success: true }`; `pool.query` called with SQL containing `ON CONFLICT (fdc_id) DO UPDATE`; params include `12345`, `"Apple"`, `"Brand A"`, JSON-stringified nutrients

---

#### Test Case: UTP-006-C (updateFetchStatus — valid and invalid status values)

**Technique**: Equivalence Partitioning
**Target View**: Internal Data Structures (`FetchStatus` enum)
**Description**: Verifies `updateFetchStatus()` throws `ValidationError` for invalid status values and executes the UPDATE query for valid ones.

**Dependency & Mock Registry:**

| Dependency | Source  | Mock/Stub Strategy                        | Rationale              |
| ---------- | ------- | ----------------------------------------- | ---------------------- |
| `pool`     | pg Pool | Mock: `query()` returns `{ rowCount: 1 }` | Prevent real DB writes |

- **Unit Scenario: UTS-006-C1**
    - **Arrange**: Set `fdcId = 12345`, `status = "invalid_status"`
    - **Act**: Call `updateFetchStatus(12345, "invalid_status")`
    - **Assert**: Throws `ValidationError`; `pool.query` NOT called

- **Unit Scenario: UTS-006-C2**
    - **Arrange**: Set `fdcId = 12345`, `status = "not_found"` (valid enum value)
    - **Act**: Call `updateFetchStatus(12345, "not_found")`
    - **Assert**: `pool.query` called with UPDATE SQL and params `[12345, "not_found"]`; returns without throwing

- **Unit Scenario: UTS-006-C3**
    - **Arrange**: Set `fdcId = 12345`, `status = "pending"` (valid enum value)
    - **Act**: Call `updateFetchStatus(12345, "pending")`
    - **Assert**: `pool.query` called; returns without throwing

---

#### Test Case: UTP-006-D (findByFdcId — JSON parse error on nutrients column)

**Technique**: Statement & Branch Coverage
**Target View**: Error Handling Return Codes
**Description**: Verifies `findByFdcId()` logs a `DataIntegrityError` and returns `null` when the `nutrients` JSONB column contains malformed JSON.

**Dependency & Mock Registry:**

| Dependency         | Source   | Mock/Stub Strategy                                                                  | Rationale                |
| ------------------ | -------- | ----------------------------------------------------------------------------------- | ------------------------ |
| `pool`             | pg Pool  | Mock: `query()` returns `{ rows: [{ fdc_id: 12345, nutrients: "INVALID_JSON{" }] }` | Simulate corrupt DB data |
| `MonitoringLogger` | ARCH-011 | Mock: `logError()` records args                                                     | Verify error is logged   |

- **Unit Scenario: UTS-006-D1**
    - **Arrange**: `pool.query` returns row with `nutrients = "INVALID_JSON{"` (unparseable)
    - **Act**: Call `findByFdcId(12345)`
    - **Assert**: Returns `null`; `MonitoringLogger.logError` called with error containing "DataIntegrityError" or "JSON parse"

---

### Module: MOD-007 (FoodRedisCacheService — Cache & Pending-Set Manager)

**Parent Architecture Modules**: ARCH-007
**Target Source File(s)**: `src/cache/food-redis-cache-service.ts`

---

#### Test Case: UTP-007-A (get — cache hit, miss, and JSON parse error)

**Technique**: Statement & Branch Coverage + Strict Isolation
**Target View**: Algorithmic/Logic View
**Description**: Verifies `get()` returns parsed `FoodData` on hit, `null` on miss, and `null` (with log) on JSON parse error.

**Dependency & Mock Registry:**

| Dependency         | Source      | Mock/Stub Strategy                                             | Rationale                |
| ------------------ | ----------- | -------------------------------------------------------------- | ------------------------ |
| `RedisClient`      | ElastiCache | Mock: `get()` returns `null`, JSON string, or malformed string | Prevent real Redis calls |
| `MonitoringLogger` | ARCH-011    | Mock: `logError()` records args                                | Verify error logging     |

- **Unit Scenario: UTS-007-A1**
    - **Arrange**: `RedisClient.get` mock returns `null` for key `"food:12345"`
    - **Act**: Call `get(12345)`
    - **Assert**: Returns `null`

- **Unit Scenario: UTS-007-A2**
    - **Arrange**: `RedisClient.get` mock returns `'{"fdcId":12345,"description":"Apple"}'`
    - **Act**: Call `get(12345)`
    - **Assert**: Returns `{ fdcId: 12345, description: "Apple" }`

- **Unit Scenario: UTS-007-A3**
    - **Arrange**: `RedisClient.get` mock returns `"INVALID_JSON{"`
    - **Act**: Call `get(12345)`
    - **Assert**: Returns `null`; `MonitoringLogger.logError` called

---

#### Test Case: UTP-007-B (set — key schema and TTL)

**Technique**: Statement & Branch Coverage + Strict Isolation
**Target View**: Algorithmic/Logic View
**Description**: Verifies `set()` calls `Redis.set` with the correct key (`"food:{fdcId}"`), JSON-serialized value, and `EX` TTL.

**Dependency & Mock Registry:**

| Dependency    | Source      | Mock/Stub Strategy                   | Rationale               |
| ------------- | ----------- | ------------------------------------ | ----------------------- |
| `RedisClient` | ElastiCache | Mock: `set()` records call arguments | Verify key/TTL contract |

- **Unit Scenario: UTS-007-B1**
    - **Arrange**: Set `fdcId = 12345`, `data = { fdcId: 12345, description: "Apple" }`, `ttl = 3600`
    - **Act**: Call `set(12345, data, 3600)`
    - **Assert**: `RedisClient.set` called with `("food:12345", '{"fdcId":12345,"description":"Apple"}', "EX", 3600)`

---

#### Test Case: UTP-007-C (isPending / markPending / clearPending — pending set operations)

**Technique**: Statement & Branch Coverage + Equivalence Partitioning
**Target View**: Algorithmic/Logic View
**Description**: Verifies the pending set operations use correct Redis commands and key schemas.

**Dependency & Mock Registry:**

| Dependency    | Source      | Mock/Stub Strategy                                                    | Rationale                  |
| ------------- | ----------- | --------------------------------------------------------------------- | -------------------------- |
| `RedisClient` | ElastiCache | Mock: `sismember()` returns 0 or 1; `sadd()` and `srem()` record args | Verify Redis command usage |

- **Unit Scenario: UTS-007-C1**
    - **Arrange**: `RedisClient.sismember` mock returns `1` for `("pending_fetch", "12345")`
    - **Act**: Call `isPending(12345)`
    - **Assert**: Returns `true`

- **Unit Scenario: UTS-007-C2**
    - **Arrange**: `RedisClient.sismember` mock returns `0`
    - **Act**: Call `isPending(12345)`
    - **Assert**: Returns `false`

- **Unit Scenario: UTS-007-C3**
    - **Arrange**: `RedisClient.sadd` and `RedisClient.set` mocks record args
    - **Act**: Call `markPending(12345)`
    - **Assert**: `RedisClient.sadd` called with `("pending_fetch", "12345")`; `RedisClient.set` called with `("pending_ttl:12345", "1", "EX", 300)`

- **Unit Scenario: UTS-007-C4**
    - **Arrange**: `RedisClient.srem` and `RedisClient.del` mocks record args
    - **Act**: Call `clearPending(12345)`
    - **Assert**: `RedisClient.srem` called with `("pending_fetch", "12345")`; `RedisClient.del` called with `"pending_ttl:12345"`

---

### Module: MOD-008 (UsdaApiClient — HTTP Client for USDA FoodData Central)

**Parent Architecture Modules**: ARCH-008
**Target Source File(s)**: `src/usda/usda-api-client.ts`

---

#### Test Case: UTP-008-A (fetchFoods — batch size boundary validation)

**Technique**: Boundary Value Analysis
**Target View**: Internal Data Structures (`fdcIds` array, `MAX_BATCH_SIZE = 20`)
**Description**: Verifies `fetchFoods()` throws `ValidationError` for empty array and arrays exceeding 20 items, and proceeds for valid sizes.

**Dependency & Mock Registry:**

| Dependency      | Source     | Mock/Stub Strategy                               | Rationale                    |
| --------------- | ---------- | ------------------------------------------------ | ---------------------------- |
| `HTTP.POST`     | node-fetch | Mock: returns `{ status: 200, body: '[]' }`      | Prevent real HTTP calls      |
| `SecretManager` | ARCH-010   | Mock: `getUsdaApiKey()` returns `"test-api-key"` | Prevent Secrets Manager call |

- **Unit Scenario: UTS-008-A1**
    - **Arrange**: Set `fdcIds = []` (length 0)
    - **Act**: Call `fetchFoods([])`
    - **Assert**: Returns `[]` immediately; `HTTP.POST` NOT called

- **Unit Scenario: UTS-008-A2**
    - **Arrange**: Set `fdcIds = [1]` (length 1, min valid); `HTTP.POST` mock returns `{ status: 200, body: '[{"fdcId":1,"description":"Apple","foodNutrients":[]}]' }`
    - **Act**: Call `fetchFoods([1])`
    - **Assert**: Returns array with 1 `FoodData` item; `HTTP.POST` called with URL containing `/foods`

- **Unit Scenario: UTS-008-A3**
    - **Arrange**: Set `fdcIds = Array(20).fill(0).map((_, i) => i + 1)` (length 20, max valid)
    - **Act**: Call `fetchFoods(fdcIds)`
    - **Assert**: `HTTP.POST` called once; does NOT throw

- **Unit Scenario: UTS-008-A4**
    - **Arrange**: Set `fdcIds = Array(21).fill(0).map((_, i) => i + 1)` (length 21, max+1)
    - **Act**: Call `fetchFoods(fdcIds)`
    - **Assert**: Throws `ValidationError("Batch size exceeds maximum of 20")`; `HTTP.POST` NOT called

---

#### Test Case: UTP-008-B (fetchFoods — HTTP status code branches)

**Technique**: Statement & Branch Coverage + Equivalence Partitioning
**Target View**: Algorithmic/Logic View + Error Handling Return Codes
**Description**: Verifies `fetchFoods()` throws the correct `UsdaApiError` for each HTTP error status class.

**Dependency & Mock Registry:**

| Dependency      | Source     | Mock/Stub Strategy                               | Rationale                    |
| --------------- | ---------- | ------------------------------------------------ | ---------------------------- |
| `HTTP.POST`     | node-fetch | Mock: returns varying `{ status }` values        | Simulate USDA HTTP responses |
| `SecretManager` | ARCH-010   | Mock: `getUsdaApiKey()` returns `"test-api-key"` | Prevent Secrets Manager call |

- **Unit Scenario: UTS-008-B1**
    - **Arrange**: `HTTP.POST` mock returns `{ status: 401 }`
    - **Act**: Call `fetchFoods([12345])`
    - **Assert**: Throws `UsdaApiError` with `status = 401` and message containing "Invalid API key"

- **Unit Scenario: UTS-008-B2**
    - **Arrange**: `HTTP.POST` mock returns `{ status: 429 }`
    - **Act**: Call `fetchFoods([12345])`
    - **Assert**: Throws `UsdaApiError` with `status = 429` and message containing "rate limit"

- **Unit Scenario: UTS-008-B3**
    - **Arrange**: `HTTP.POST` mock returns `{ status: 500 }`
    - **Act**: Call `fetchFoods([12345])`
    - **Assert**: Throws `UsdaApiError` with `status = 500` and message containing "server error"

- **Unit Scenario: UTS-008-B4**
    - **Arrange**: `HTTP.POST` mock returns `{ status: 404 }`
    - **Act**: Call `fetchFoods([12345])`
    - **Assert**: Throws `UsdaApiError` with `status = 404`

---

#### Test Case: UTP-008-C (mapUsdaResponseToFoodData — nutrient extraction)

**Technique**: Statement & Branch Coverage
**Target View**: Algorithmic/Logic View (`mapUsdaResponseToFoodData` + `extractNutrients`)
**Description**: Verifies `mapUsdaResponseToFoodData()` correctly maps USDA response fields and `extractNutrients()` filters to the 6 target nutrient IDs.

**Dependency & Mock Registry:**

None — `mapUsdaResponseToFoodData` and `extractNutrients` are pure functions.

- **Unit Scenario: UTS-008-C1**
    - **Arrange**: Set `usdaItem = { fdcId: 12345, description: "Apple", brandOwner: "Brand A", foodNutrients: [{ nutrientId: 203, amount: 0.3, unitName: "g" }, { nutrientId: 999, amount: 100, unitName: "mg" }] }`
    - **Act**: Call `mapUsdaResponseToFoodData(usdaItem)`
    - **Assert**: Returns `FoodData` with `fdcId = 12345`, `description = "Apple"`, `brandOwner = "Brand A"`, `fetchStatus = "fetched"`; `nutrients` contains nutrientId 203 but NOT 999 (filtered out)

- **Unit Scenario: UTS-008-C2**
    - **Arrange**: Set `usdaItem` with `brandOwner = undefined`
    - **Act**: Call `mapUsdaResponseToFoodData(usdaItem)`
    - **Assert**: Returns `FoodData` with `brandOwner = null`

---

### Module: MOD-009 (WebSocketNotifier — Real-Time Client Notification)

**Parent Architecture Modules**: ARCH-009
**Target Source File(s)**: `src/websocket/websocket-notifier.ts`

---

#### Test Case: UTP-009-A (notifyClients — GoneException cleanup and fire-and-forget)

**Technique**: Statement & Branch Coverage + State Transition Testing
**Target View**: Algorithmic/Logic View + State Machine View (Connected → Disconnected via GoneException)
**Description**: Verifies `notifyClients()` deletes stale connections on `GoneException`, logs but continues on other errors, and returns the correct `notifiedCount`.

**Dependency & Mock Registry:**

| Dependency                   | Source   | Mock/Stub Strategy                                                                             | Rationale                   |
| ---------------------------- | -------- | ---------------------------------------------------------------------------------------------- | --------------------------- |
| `ConnectionStore`            | DynamoDB | Mock: `getConnectionsForFdcId()` returns connection ID list; `deleteConnection()` records args | Prevent real DynamoDB calls |
| `ApiGatewayManagementClient` | AWS SDK  | Mock: `postToConnection()` succeeds, throws `GoneException`, or throws generic `Error`         | Simulate WebSocket states   |
| `MonitoringLogger`           | ARCH-011 | Mock: `logRequest()` records args                                                              | Verify error logging        |

- **Unit Scenario: UTS-009-A1**
    - **Arrange**: `ConnectionStore.getConnectionsForFdcId` returns `["conn-1", "conn-2"]`; `ApiGatewayManagementClient.postToConnection` succeeds for both
    - **Act**: Call `notifyClients(12345, foodDataStub)`
    - **Assert**: Returns `2`; `ConnectionStore.deleteConnection` NOT called

- **Unit Scenario: UTS-009-A2**
    - **Arrange**: `ConnectionStore.getConnectionsForFdcId` returns `["conn-1"]`; `ApiGatewayManagementClient.postToConnection` throws `GoneException`
    - **Act**: Call `notifyClients(12345, foodDataStub)`
    - **Assert**: Returns `0`; `ConnectionStore.deleteConnection` called with `"conn-1"`; `MonitoringLogger.logRequest` NOT called with `"ws-notify-fail"`

- **Unit Scenario: UTS-009-A3**
    - **Arrange**: `ConnectionStore.getConnectionsForFdcId` returns `["conn-1"]`; `ApiGatewayManagementClient.postToConnection` throws generic `Error("network error")`
    - **Act**: Call `notifyClients(12345, foodDataStub)`
    - **Assert**: Returns `0`; `ConnectionStore.deleteConnection` NOT called; `MonitoringLogger.logRequest` called with `"ws-notify-fail"` and `{ connectionId: "conn-1", fdcId: 12345 }`

- **Unit Scenario: UTS-009-A4**
    - **Arrange**: `ConnectionStore.getConnectionsForFdcId` returns `[]` (no subscribers)
    - **Act**: Call `notifyClients(12345, foodDataStub)`
    - **Assert**: Returns `0`; `ApiGatewayManagementClient.postToConnection` NOT called

---

#### Test Case: UTP-009-B (onConnect / onDisconnect — connection store operations)

**Technique**: Statement & Branch Coverage
**Target View**: Algorithmic/Logic View
**Description**: Verifies `onConnect()` stores connection with TTL and `onDisconnect()` deletes it.

**Dependency & Mock Registry:**

| Dependency        | Source   | Mock/Stub Strategy                                           | Rationale                   |
| ----------------- | -------- | ------------------------------------------------------------ | --------------------------- |
| `ConnectionStore` | DynamoDB | Mock: `putConnection()` and `deleteConnection()` record args | Prevent real DynamoDB calls |

- **Unit Scenario: UTS-009-B1**
    - **Arrange**: Set `connectionId = "conn-1"`, `fdcId = 12345`; `now()` returns `1000`
    - **Act**: Call `onConnect("conn-1", 12345)`
    - **Assert**: `ConnectionStore.putConnection` called with `{ connectionId: "conn-1", fdcId: 12345, ttl: 4600 }` (1000 + 3600)

- **Unit Scenario: UTS-009-B2**
    - **Arrange**: Set `connectionId = "conn-1"`
    - **Act**: Call `onDisconnect("conn-1")`
    - **Assert**: `ConnectionStore.deleteConnection` called with `"conn-1"`

---

### Module: MOD-010 (SecretManager — AWS Secrets Manager Wrapper)

**Parent Architecture Modules**: ARCH-010 [CROSS-CUTTING]
**Target Source File(s)**: `src/secrets/secret-manager.ts`

---

#### Test Case: UTP-010-A (getUsdaApiKey — in-memory cache hit and miss)

**Technique**: Statement & Branch Coverage + State Transition Testing
**Target View**: Algorithmic/Logic View + State Machine View (CacheEmpty → CachePopulated → CacheExpired)
**Description**: Verifies `getUsdaApiKey()` returns cached value on HIT without calling Secrets Manager, and fetches + caches on MISS.

**Dependency & Mock Registry:**

| Dependency             | Source   | Mock/Stub Strategy                                                          | Rationale                          |
| ---------------------- | -------- | --------------------------------------------------------------------------- | ---------------------------------- |
| `SecretsManagerClient` | AWS SDK  | Mock: `getSecretValue()` returns `{ SecretString: '{"apiKey":"key-123"}' }` | Prevent real Secrets Manager calls |
| `SECRET_CACHE`         | Internal | Direct manipulation: set/clear cache entries before each scenario           | Control cache state                |

- **Unit Scenario: UTS-010-A1**
    - **Arrange**: Set `SECRET_CACHE[secretName] = { value: "cached-key", expiresAt: now() + 60000 }` (cache HIT, not expired)
    - **Act**: Call `getUsdaApiKey()`
    - **Assert**: Returns `"cached-key"`; `SecretsManagerClient.getSecretValue` NOT called

- **Unit Scenario: UTS-010-A2**
    - **Arrange**: Set `SECRET_CACHE = {}` (cache MISS); `SecretsManagerClient.getSecretValue` mock returns `{ SecretString: '{"apiKey":"key-123"}' }`
    - **Act**: Call `getUsdaApiKey()`
    - **Assert**: Returns `"key-123"`; `SecretsManagerClient.getSecretValue` called once; `SECRET_CACHE[secretName].value` equals `"key-123"`; `SECRET_CACHE[secretName].expiresAt` approximately `now() + 300000`

- **Unit Scenario: UTS-010-A3**
    - **Arrange**: Set `SECRET_CACHE[secretName] = { value: "old-key", expiresAt: now() - 1 }` (cache EXPIRED); `SecretsManagerClient.getSecretValue` mock returns `{ SecretString: '{"apiKey":"new-key"}' }`
    - **Act**: Call `getUsdaApiKey()`
    - **Assert**: Returns `"new-key"`; `SecretsManagerClient.getSecretValue` called once (cache miss on expiry)

---

#### Test Case: UTP-010-B (rotateKey — cache invalidation)

**Technique**: Statement & Branch Coverage
**Target View**: Algorithmic/Logic View
**Description**: Verifies `rotateKey()` calls `SecretsManagerClient.rotateSecret` and deletes the in-memory cache entry.

**Dependency & Mock Registry:**

| Dependency             | Source   | Mock/Stub Strategy                            | Rationale                  |
| ---------------------- | -------- | --------------------------------------------- | -------------------------- |
| `SecretsManagerClient` | AWS SDK  | Mock: `rotateSecret()` returns `{}`           | Prevent real rotation call |
| `SECRET_CACHE`         | Internal | Direct manipulation: pre-populate cache entry | Verify cache is cleared    |

- **Unit Scenario: UTS-010-B1**
    - **Arrange**: Set `SECRET_CACHE[secretName] = { value: "old-key", expiresAt: now() + 60000 }`; `SecretsManagerClient.rotateSecret` mock records args
    - **Act**: Call `rotateKey()`
    - **Assert**: Returns `{ success: true }`; `SecretsManagerClient.rotateSecret` called with `{ SecretId: secretName }`; `SECRET_CACHE[secretName]` is `undefined`

---

#### Test Case: UTP-010-C (getUsdaApiKey — Secrets Manager error propagation)

**Technique**: Statement & Branch Coverage
**Target View**: Error Handling Return Codes
**Description**: Verifies `getUsdaApiKey()` propagates `SecretNotFoundError` and `SecretAccessError` from Secrets Manager.

**Dependency & Mock Registry:**

| Dependency             | Source  | Mock/Stub Strategy                                                                     | Rationale                  |
| ---------------------- | ------- | -------------------------------------------------------------------------------------- | -------------------------- |
| `SecretsManagerClient` | AWS SDK | Mock: `getSecretValue()` throws `ResourceNotFoundException` or `AccessDeniedException` | Simulate IAM/config errors |

- **Unit Scenario: UTS-010-C1**
    - **Arrange**: `SECRET_CACHE = {}`; `SecretsManagerClient.getSecretValue` throws `ResourceNotFoundException`
    - **Act**: Call `getUsdaApiKey()`
    - **Assert**: Throws `SecretNotFoundError`

- **Unit Scenario: UTS-010-C2**
    - **Arrange**: `SECRET_CACHE = {}`; `SecretsManagerClient.getSecretValue` throws `AccessDeniedException`
    - **Act**: Call `getUsdaApiKey()`
    - **Assert**: Throws `SecretAccessError`

---

### Module: MOD-011 (MonitoringLogger — Structured Logging & Metrics)

**Parent Architecture Modules**: ARCH-011 [CROSS-CUTTING]
**Target Source File(s)**: `src/monitoring/monitoring-logger.ts`

---

#### Test Case: UTP-011-A (logRequest — structured log payload shape)

**Technique**: Statement & Branch Coverage + Strict Isolation
**Target View**: Algorithmic/Logic View
**Description**: Verifies `logRequest()` calls the underlying `logger.info` with the correct structured payload including all required fields.

**Dependency & Mock Registry:**

| Dependency | Source                        | Mock/Stub Strategy                    | Rationale                          |
| ---------- | ----------------------------- | ------------------------------------- | ---------------------------------- |
| `logger`   | @aws-lambda-powertools/logger | Mock: `info()` records call arguments | Prevent real CloudWatch log writes |

- **Unit Scenario: UTS-011-A1**
    - **Arrange**: Set `requestId = "req-1"`, `event = { fdcId: 12345 }`, `durationMs = 42`; mock `ISO8601Now()` returns `"2026-05-09T00:00:00Z"`
    - **Act**: Call `logRequest("req-1", { fdcId: 12345 }, 42)`
    - **Assert**: `logger.info` called with `"request"` and object containing `{ requestId: "req-1", event: { fdcId: 12345 }, durationMs: 42, timestamp: "2026-05-09T00:00:00Z" }`

---

#### Test Case: UTP-011-B (logError — error fields extraction)

**Technique**: Statement & Branch Coverage
**Target View**: Algorithmic/Logic View
**Description**: Verifies `logError()` extracts `name`, `message`, and `stack` from the `Error` object and includes them in the structured log.

**Dependency & Mock Registry:**

| Dependency | Source                        | Mock/Stub Strategy                     | Rationale                          |
| ---------- | ----------------------------- | -------------------------------------- | ---------------------------------- |
| `logger`   | @aws-lambda-powertools/logger | Mock: `error()` records call arguments | Prevent real CloudWatch log writes |

- **Unit Scenario: UTS-011-B1**
    - **Arrange**: Set `error = new Error("Something failed")`; `error.name = "ValidationError"`; `requestId = "req-1"`; `context = { fdcId: 12345 }`
    - **Act**: Call `logError("req-1", error, { fdcId: 12345 })`
    - **Assert**: `logger.error` called with `"error"` and object containing `{ requestId: "req-1", errorName: "ValidationError", errorMessage: "Something failed", stackTrace: error.stack, context: { fdcId: 12345 } }`

---

#### Test Case: UTP-011-C (incrementMetric — EMF payload structure)

**Technique**: Statement & Branch Coverage
**Target View**: Algorithmic/Logic View (EMF metric format)
**Description**: Verifies `incrementMetric()` emits a CloudWatch EMF-compliant payload with the correct namespace, dimension, and metric name.

**Dependency & Mock Registry:**

| Dependency | Source                        | Mock/Stub Strategy                    | Rationale                          |
| ---------- | ----------------------------- | ------------------------------------- | ---------------------------------- |
| `logger`   | @aws-lambda-powertools/logger | Mock: `info()` records call arguments | Prevent real CloudWatch log writes |

- **Unit Scenario: UTS-011-C1**
    - **Arrange**: Set `name = "cache.hit"`, `value = 1`; mock `unixTimestampMs()` returns `1715212800000`
    - **Act**: Call `incrementMetric("cache.hit", 1)`
    - **Assert**: `logger.info` called with `"metric"` and object where `_aws.CloudWatchMetrics[0].Namespace = "UsdaFoodData"`, `_aws.CloudWatchMetrics[0].Metrics[0].Name = "cache.hit"`, `_aws.CloudWatchMetrics[0].Metrics[0].Unit = "Count"`, `["cache.hit"] = 1`, `service = "usda-food-data"`

---

## Coverage Summary

| Metric                                 | Count                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Total MOD modules                      | 11                                                                                                                         |
| Non-[EXTERNAL] MODs requiring coverage | 11                                                                                                                         |
| MODs with at least one UTP             | 11 / 11 (100%)                                                                                                             |
| Total Unit Test Cases (UTP)            | 33                                                                                                                         |
| Total Unit Test Scenarios (UTS)        | 82                                                                                                                         |
| Techniques applied                     | Statement & Branch Coverage, Boundary Value Analysis, Equivalence Partitioning, Strict Isolation, State Transition Testing |

## Technique Distribution

| Technique                   | UTP Count |
| --------------------------- | --------- |
| Statement & Branch Coverage | 28        |
| Boundary Value Analysis     | 9         |
| Equivalence Partitioning    | 5         |
| Strict Isolation            | 8         |
| State Transition Testing    | 7         |

> Note: Many UTPs apply multiple techniques simultaneously; counts reflect primary + secondary technique pairings.

---

_End of Unit Test Plan — 003-usda-food-data_
