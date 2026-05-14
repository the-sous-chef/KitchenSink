# Integration Test Plan: Cooking School (Video Learning Platform)

**Feature Branch**: `013-cooking-school`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/013-cooking-school/v-model/architecture-design.md`

## Overview

Integration tests verify module-boundary behavior for every architecture module (`ARCH-001..ARCH-020`) using four mandatory techniques: Interface Contract Testing, Data Flow Testing, Interface Fault Injection, and Concurrency & Race Condition Testing.

## Integration Tests

### Architecture Module Integration: ARCH-001 — Auth Guard Module

**Parent SYS**: SYS-001

#### Test Case: ITP-001-A (ARCH-001 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-001-A1** — Verify request/response schema compatibility at ARCH-001 boundaries.

#### Test Case: ITP-001-B (ARCH-001 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-001-B1** — Verify end-to-end transformation and persistence path through ARCH-001.

#### Test Case: ITP-001-C (ARCH-001 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-001-C1** — Inject malformed payload/timeout at ARCH-001 dependency interface and verify graceful handling.

#### Test Case: ITP-001-D (ARCH-001 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-001-D1** — Execute concurrent requests through ARCH-001 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-002 — Course Authoring API Module

**Parent SYS**: SYS-002

#### Test Case: ITP-002-A (ARCH-002 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-002-A1** — Verify request/response schema compatibility at ARCH-002 boundaries.

#### Test Case: ITP-002-B (ARCH-002 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-002-B1** — Verify end-to-end transformation and persistence path through ARCH-002.

#### Test Case: ITP-002-C (ARCH-002 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-002-C1** — Inject malformed payload/timeout at ARCH-002 dependency interface and verify graceful handling.

#### Test Case: ITP-002-D (ARCH-002 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-002-D1** — Execute concurrent requests through ARCH-002 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-003 — Media Pipeline Orchestrator

**Parent SYS**: SYS-003

#### Test Case: ITP-003-A (ARCH-003 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-003-A1** — Verify request/response schema compatibility at ARCH-003 boundaries.

#### Test Case: ITP-003-B (ARCH-003 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-003-B1** — Verify end-to-end transformation and persistence path through ARCH-003.

#### Test Case: ITP-003-C (ARCH-003 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-003-C1** — Inject malformed payload/timeout at ARCH-003 dependency interface and verify graceful handling.

#### Test Case: ITP-003-D (ARCH-003 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-003-D1** — Execute concurrent requests through ARCH-003 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-004 — Playback Entitlement Service

**Parent SYS**: SYS-004

#### Test Case: ITP-004-A (ARCH-004 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-004-A1** — Verify request/response schema compatibility at ARCH-004 boundaries.

#### Test Case: ITP-004-B (ARCH-004 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-004-B1** — Verify end-to-end transformation and persistence path through ARCH-004.

#### Test Case: ITP-004-C (ARCH-004 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-004-C1** — Inject malformed payload/timeout at ARCH-004 dependency interface and verify graceful handling.

#### Test Case: ITP-004-D (ARCH-004 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-004-D1** — Execute concurrent requests through ARCH-004 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-005 — Catalog Query API

**Parent SYS**: SYS-005

#### Test Case: ITP-005-A (ARCH-005 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-005-A1** — Verify request/response schema compatibility at ARCH-005 boundaries.

#### Test Case: ITP-005-B (ARCH-005 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-005-B1** — Verify end-to-end transformation and persistence path through ARCH-005.

#### Test Case: ITP-005-C (ARCH-005 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-005-C1** — Inject malformed payload/timeout at ARCH-005 dependency interface and verify graceful handling.

#### Test Case: ITP-005-D (ARCH-005 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-005-D1** — Execute concurrent requests through ARCH-005 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-006 — Enrollment Billing Adapter

**Parent SYS**: SYS-006

#### Test Case: ITP-006-A (ARCH-006 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-006-A1** — Verify request/response schema compatibility at ARCH-006 boundaries.

#### Test Case: ITP-006-B (ARCH-006 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-006-B1** — Verify end-to-end transformation and persistence path through ARCH-006.

#### Test Case: ITP-006-C (ARCH-006 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-006-C1** — Inject malformed payload/timeout at ARCH-006 dependency interface and verify graceful handling.

#### Test Case: ITP-006-D (ARCH-006 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-006-D1** — Execute concurrent requests through ARCH-006 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-007 — Revenue Share Engine

**Parent SYS**: SYS-006, SYS-009

#### Test Case: ITP-007-A (ARCH-007 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-007-A1** — Verify request/response schema compatibility at ARCH-007 boundaries.

#### Test Case: ITP-007-B (ARCH-007 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-007-B1** — Verify end-to-end transformation and persistence path through ARCH-007.

#### Test Case: ITP-007-C (ARCH-007 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-007-C1** — Inject malformed payload/timeout at ARCH-007 dependency interface and verify graceful handling.

#### Test Case: ITP-007-D (ARCH-007 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-007-D1** — Execute concurrent requests through ARCH-007 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-008 — Lesson Content Service

**Parent SYS**: SYS-007

#### Test Case: ITP-008-A (ARCH-008 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-008-A1** — Verify request/response schema compatibility at ARCH-008 boundaries.

#### Test Case: ITP-008-B (ARCH-008 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-008-B1** — Verify end-to-end transformation and persistence path through ARCH-008.

#### Test Case: ITP-008-C (ARCH-008 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-008-C1** — Inject malformed payload/timeout at ARCH-008 dependency interface and verify graceful handling.

#### Test Case: ITP-008-D (ARCH-008 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-008-D1** — Execute concurrent requests through ARCH-008 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-009 — AI Draft Adapter

**Parent SYS**: SYS-007

#### Test Case: ITP-009-A (ARCH-009 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-009-A1** — Verify request/response schema compatibility at ARCH-009 boundaries.

#### Test Case: ITP-009-B (ARCH-009 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-009-B1** — Verify end-to-end transformation and persistence path through ARCH-009.

#### Test Case: ITP-009-C (ARCH-009 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-009-C1** — Inject malformed payload/timeout at ARCH-009 dependency interface and verify graceful handling.

#### Test Case: ITP-009-D (ARCH-009 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-009-D1** — Execute concurrent requests through ARCH-009 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-010 — Progress Event Processor

**Parent SYS**: SYS-008

#### Test Case: ITP-010-A (ARCH-010 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-010-A1** — Verify request/response schema compatibility at ARCH-010 boundaries.

#### Test Case: ITP-010-B (ARCH-010 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-010-B1** — Verify end-to-end transformation and persistence path through ARCH-010.

#### Test Case: ITP-010-C (ARCH-010 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-010-C1** — Inject malformed payload/timeout at ARCH-010 dependency interface and verify graceful handling.

#### Test Case: ITP-010-D (ARCH-010 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-010-D1** — Execute concurrent requests through ARCH-010 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-011 — Progress Projection Query

**Parent SYS**: SYS-008

#### Test Case: ITP-011-A (ARCH-011 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-011-A1** — Verify request/response schema compatibility at ARCH-011 boundaries.

#### Test Case: ITP-011-B (ARCH-011 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-011-B1** — Verify end-to-end transformation and persistence path through ARCH-011.

#### Test Case: ITP-011-C (ARCH-011 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-011-C1** — Inject malformed payload/timeout at ARCH-011 dependency interface and verify graceful handling.

#### Test Case: ITP-011-D (ARCH-011 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-011-D1** — Execute concurrent requests through ARCH-011 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-012 — Educator Metrics Aggregator

**Parent SYS**: SYS-009

#### Test Case: ITP-012-A (ARCH-012 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-012-A1** — Verify request/response schema compatibility at ARCH-012 boundaries.

#### Test Case: ITP-012-B (ARCH-012 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-012-B1** — Verify end-to-end transformation and persistence path through ARCH-012.

#### Test Case: ITP-012-C (ARCH-012 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-012-C1** — Inject malformed payload/timeout at ARCH-012 dependency interface and verify graceful handling.

#### Test Case: ITP-012-D (ARCH-012 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-012-D1** — Execute concurrent requests through ARCH-012 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-013 — Compliance Case Manager

**Parent SYS**: SYS-010

#### Test Case: ITP-013-A (ARCH-013 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-013-A1** — Verify request/response schema compatibility at ARCH-013 boundaries.

#### Test Case: ITP-013-B (ARCH-013 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-013-B1** — Verify end-to-end transformation and persistence path through ARCH-013.

#### Test Case: ITP-013-C (ARCH-013 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-013-C1** — Inject malformed payload/timeout at ARCH-013 dependency interface and verify graceful handling.

#### Test Case: ITP-013-D (ARCH-013 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-013-D1** — Execute concurrent requests through ARCH-013 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-014 — Age & Safety Policy Filter

**Parent SYS**: SYS-010

#### Test Case: ITP-014-A (ARCH-014 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-014-A1** — Verify request/response schema compatibility at ARCH-014 boundaries.

#### Test Case: ITP-014-B (ARCH-014 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-014-B1** — Verify end-to-end transformation and persistence path through ARCH-014.

#### Test Case: ITP-014-C (ARCH-014 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-014-C1** — Inject malformed payload/timeout at ARCH-014 dependency interface and verify graceful handling.

#### Test Case: ITP-014-D (ARCH-014 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-014-D1** — Execute concurrent requests through ARCH-014 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-015 — Dispute Workflow Engine

**Parent SYS**: SYS-011

#### Test Case: ITP-015-A (ARCH-015 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-015-A1** — Verify request/response schema compatibility at ARCH-015 boundaries.

#### Test Case: ITP-015-B (ARCH-015 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-015-B1** — Verify end-to-end transformation and persistence path through ARCH-015.

#### Test Case: ITP-015-C (ARCH-015 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-015-C1** — Inject malformed payload/timeout at ARCH-015 dependency interface and verify graceful handling.

#### Test Case: ITP-015-D (ARCH-015 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-015-D1** — Execute concurrent requests through ARCH-015 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-016 — Payout Adjustment Adapter

**Parent SYS**: SYS-011

#### Test Case: ITP-016-A (ARCH-016 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-016-A1** — Verify request/response schema compatibility at ARCH-016 boundaries.

#### Test Case: ITP-016-B (ARCH-016 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-016-B1** — Verify end-to-end transformation and persistence path through ARCH-016.

#### Test Case: ITP-016-C (ARCH-016 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-016-C1** — Inject malformed payload/timeout at ARCH-016 dependency interface and verify graceful handling.

#### Test Case: ITP-016-D (ARCH-016 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-016-D1** — Execute concurrent requests through ARCH-016 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-017 — Audit Evidence Logger

**Parent SYS**: SYS-012

#### Test Case: ITP-017-A (ARCH-017 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-017-A1** — Verify request/response schema compatibility at ARCH-017 boundaries.

#### Test Case: ITP-017-B (ARCH-017 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-017-B1** — Verify end-to-end transformation and persistence path through ARCH-017.

#### Test Case: ITP-017-C (ARCH-017 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-017-C1** — Inject malformed payload/timeout at ARCH-017 dependency interface and verify graceful handling.

#### Test Case: ITP-017-D (ARCH-017 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-017-D1** — Execute concurrent requests through ARCH-017 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-018 — Backup Restore Coordinator

**Parent SYS**: SYS-012

#### Test Case: ITP-018-A (ARCH-018 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-018-A1** — Verify request/response schema compatibility at ARCH-018 boundaries.

#### Test Case: ITP-018-B (ARCH-018 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-018-B1** — Verify end-to-end transformation and persistence path through ARCH-018.

#### Test Case: ITP-018-C (ARCH-018 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-018-C1** — Inject malformed payload/timeout at ARCH-018 dependency interface and verify graceful handling.

#### Test Case: ITP-018-D (ARCH-018 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-018-D1** — Execute concurrent requests through ARCH-018 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-019 — Policy Snapshot Store

**Parent SYS**: SYS-006, SYS-012

#### Test Case: ITP-019-A (ARCH-019 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-019-A1** — Verify request/response schema compatibility at ARCH-019 boundaries.

#### Test Case: ITP-019-B (ARCH-019 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-019-B1** — Verify end-to-end transformation and persistence path through ARCH-019.

#### Test Case: ITP-019-C (ARCH-019 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-019-C1** — Inject malformed payload/timeout at ARCH-019 dependency interface and verify graceful handling.

#### Test Case: ITP-019-D (ARCH-019 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-019-D1** — Execute concurrent requests through ARCH-019 and verify ordering/idempotency guarantees.

---

### Architecture Module Integration: ARCH-020 — Scope Guard Module

**Parent SYS**: SYS-012

#### Test Case: ITP-020-A (ARCH-020 interface contract)

**Technique**: Interface Contract Testing

- **Integration Scenario: ITS-020-A1** — Verify request/response schema compatibility at ARCH-020 boundaries.

#### Test Case: ITP-020-B (ARCH-020 data flow)

**Technique**: Data Flow Testing

- **Integration Scenario: ITS-020-B1** — Verify end-to-end transformation and persistence path through ARCH-020.

#### Test Case: ITP-020-C (ARCH-020 fault injection)

**Technique**: Interface Fault Injection

- **Integration Scenario: ITS-020-C1** — Inject malformed payload/timeout at ARCH-020 dependency interface and verify graceful handling.

#### Test Case: ITP-020-D (ARCH-020 concurrency)

**Technique**: Concurrency & Race Condition Testing

- **Integration Scenario: ITS-020-D1** — Execute concurrent requests through ARCH-020 and verify ordering/idempotency guarantees.

---
