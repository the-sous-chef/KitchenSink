# Unit Test Plan: Cooking School (Video Learning Platform)

**Feature Branch**: `013-cooking-school`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/013-cooking-school/v-model/module-design.md`

## Overview

Unit tests cover all module designs (`MOD-001..MOD-020`) using five mandatory white-box techniques: Statement & Branch Coverage, Boundary Value Analysis, Equivalence Partitioning, Strict Isolation, and State Transition Testing.

## Unit Tests

### Module Validation: MOD-001 — Auth Guard Module

**Parent ARCH**: ARCH-001

#### Test Case: UTP-001-A (MOD-001 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-001-A1** — Execute success and primary failure paths for MOD-001.

#### Test Case: UTP-001-B (MOD-001 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-001-B1** — Validate min, nominal, and max boundary inputs for MOD-001.

#### Test Case: UTP-001-C (MOD-001 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-001-C1** — Validate valid/invalid class partitions for MOD-001 request payloads.

#### Test Case: UTP-001-D (MOD-001 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-001-D1** — Mock all external dependencies and validate deterministic behavior for MOD-001.

#### Test Case: UTP-001-E (MOD-001 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-001-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-001.

---

### Module Validation: MOD-002 — Course Authoring API Module

**Parent ARCH**: ARCH-002

#### Test Case: UTP-002-A (MOD-002 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-002-A1** — Execute success and primary failure paths for MOD-002.

#### Test Case: UTP-002-B (MOD-002 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-002-B1** — Validate min, nominal, and max boundary inputs for MOD-002.

#### Test Case: UTP-002-C (MOD-002 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-002-C1** — Validate valid/invalid class partitions for MOD-002 request payloads.

#### Test Case: UTP-002-D (MOD-002 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-002-D1** — Mock all external dependencies and validate deterministic behavior for MOD-002.

#### Test Case: UTP-002-E (MOD-002 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-002-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-002.

---

### Module Validation: MOD-003 — Media Pipeline Orchestrator

**Parent ARCH**: ARCH-003

#### Test Case: UTP-003-A (MOD-003 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-003-A1** — Execute success and primary failure paths for MOD-003.

#### Test Case: UTP-003-B (MOD-003 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-003-B1** — Validate min, nominal, and max boundary inputs for MOD-003.

#### Test Case: UTP-003-C (MOD-003 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-003-C1** — Validate valid/invalid class partitions for MOD-003 request payloads.

#### Test Case: UTP-003-D (MOD-003 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-003-D1** — Mock all external dependencies and validate deterministic behavior for MOD-003.

#### Test Case: UTP-003-E (MOD-003 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-003-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-003.

---

### Module Validation: MOD-004 — Playback Entitlement Service

**Parent ARCH**: ARCH-004

#### Test Case: UTP-004-A (MOD-004 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-004-A1** — Execute success and primary failure paths for MOD-004.

#### Test Case: UTP-004-B (MOD-004 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-004-B1** — Validate min, nominal, and max boundary inputs for MOD-004.

#### Test Case: UTP-004-C (MOD-004 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-004-C1** — Validate valid/invalid class partitions for MOD-004 request payloads.

#### Test Case: UTP-004-D (MOD-004 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-004-D1** — Mock all external dependencies and validate deterministic behavior for MOD-004.

#### Test Case: UTP-004-E (MOD-004 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-004-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-004.

---

### Module Validation: MOD-005 — Catalog Query API

**Parent ARCH**: ARCH-005

#### Test Case: UTP-005-A (MOD-005 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-005-A1** — Execute success and primary failure paths for MOD-005.

#### Test Case: UTP-005-B (MOD-005 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-005-B1** — Validate min, nominal, and max boundary inputs for MOD-005.

#### Test Case: UTP-005-C (MOD-005 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-005-C1** — Validate valid/invalid class partitions for MOD-005 request payloads.

#### Test Case: UTP-005-D (MOD-005 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-005-D1** — Mock all external dependencies and validate deterministic behavior for MOD-005.

#### Test Case: UTP-005-E (MOD-005 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-005-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-005.

---

### Module Validation: MOD-006 — Enrollment Billing Adapter

**Parent ARCH**: ARCH-006

#### Test Case: UTP-006-A (MOD-006 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-006-A1** — Execute success and primary failure paths for MOD-006.

#### Test Case: UTP-006-B (MOD-006 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-006-B1** — Validate min, nominal, and max boundary inputs for MOD-006.

#### Test Case: UTP-006-C (MOD-006 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-006-C1** — Validate valid/invalid class partitions for MOD-006 request payloads.

#### Test Case: UTP-006-D (MOD-006 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-006-D1** — Mock all external dependencies and validate deterministic behavior for MOD-006.

#### Test Case: UTP-006-E (MOD-006 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-006-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-006.

---

### Module Validation: MOD-007 — Revenue Share Engine

**Parent ARCH**: ARCH-007

#### Test Case: UTP-007-A (MOD-007 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-007-A1** — Execute success and primary failure paths for MOD-007.

#### Test Case: UTP-007-B (MOD-007 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-007-B1** — Validate min, nominal, and max boundary inputs for MOD-007.

#### Test Case: UTP-007-C (MOD-007 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-007-C1** — Validate valid/invalid class partitions for MOD-007 request payloads.

#### Test Case: UTP-007-D (MOD-007 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-007-D1** — Mock all external dependencies and validate deterministic behavior for MOD-007.

#### Test Case: UTP-007-E (MOD-007 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-007-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-007.

---

### Module Validation: MOD-008 — Lesson Content Service

**Parent ARCH**: ARCH-008

#### Test Case: UTP-008-A (MOD-008 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-008-A1** — Execute success and primary failure paths for MOD-008.

#### Test Case: UTP-008-B (MOD-008 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-008-B1** — Validate min, nominal, and max boundary inputs for MOD-008.

#### Test Case: UTP-008-C (MOD-008 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-008-C1** — Validate valid/invalid class partitions for MOD-008 request payloads.

#### Test Case: UTP-008-D (MOD-008 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-008-D1** — Mock all external dependencies and validate deterministic behavior for MOD-008.

#### Test Case: UTP-008-E (MOD-008 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-008-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-008.

---

### Module Validation: MOD-009 — AI Draft Adapter

**Parent ARCH**: ARCH-009

#### Test Case: UTP-009-A (MOD-009 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-009-A1** — Execute success and primary failure paths for MOD-009.

#### Test Case: UTP-009-B (MOD-009 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-009-B1** — Validate min, nominal, and max boundary inputs for MOD-009.

#### Test Case: UTP-009-C (MOD-009 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-009-C1** — Validate valid/invalid class partitions for MOD-009 request payloads.

#### Test Case: UTP-009-D (MOD-009 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-009-D1** — Mock all external dependencies and validate deterministic behavior for MOD-009.

#### Test Case: UTP-009-E (MOD-009 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-009-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-009.

---

### Module Validation: MOD-010 — Progress Event Processor

**Parent ARCH**: ARCH-010

#### Test Case: UTP-010-A (MOD-010 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-010-A1** — Execute success and primary failure paths for MOD-010.

#### Test Case: UTP-010-B (MOD-010 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-010-B1** — Validate min, nominal, and max boundary inputs for MOD-010.

#### Test Case: UTP-010-C (MOD-010 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-010-C1** — Validate valid/invalid class partitions for MOD-010 request payloads.

#### Test Case: UTP-010-D (MOD-010 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-010-D1** — Mock all external dependencies and validate deterministic behavior for MOD-010.

#### Test Case: UTP-010-E (MOD-010 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-010-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-010.

---

### Module Validation: MOD-011 — Progress Projection Query

**Parent ARCH**: ARCH-011

#### Test Case: UTP-011-A (MOD-011 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-011-A1** — Execute success and primary failure paths for MOD-011.

#### Test Case: UTP-011-B (MOD-011 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-011-B1** — Validate min, nominal, and max boundary inputs for MOD-011.

#### Test Case: UTP-011-C (MOD-011 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-011-C1** — Validate valid/invalid class partitions for MOD-011 request payloads.

#### Test Case: UTP-011-D (MOD-011 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-011-D1** — Mock all external dependencies and validate deterministic behavior for MOD-011.

#### Test Case: UTP-011-E (MOD-011 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-011-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-011.

---

### Module Validation: MOD-012 — Educator Metrics Aggregator

**Parent ARCH**: ARCH-012

#### Test Case: UTP-012-A (MOD-012 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-012-A1** — Execute success and primary failure paths for MOD-012.

#### Test Case: UTP-012-B (MOD-012 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-012-B1** — Validate min, nominal, and max boundary inputs for MOD-012.

#### Test Case: UTP-012-C (MOD-012 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-012-C1** — Validate valid/invalid class partitions for MOD-012 request payloads.

#### Test Case: UTP-012-D (MOD-012 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-012-D1** — Mock all external dependencies and validate deterministic behavior for MOD-012.

#### Test Case: UTP-012-E (MOD-012 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-012-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-012.

---

### Module Validation: MOD-013 — Compliance Case Manager

**Parent ARCH**: ARCH-013

#### Test Case: UTP-013-A (MOD-013 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-013-A1** — Execute success and primary failure paths for MOD-013.

#### Test Case: UTP-013-B (MOD-013 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-013-B1** — Validate min, nominal, and max boundary inputs for MOD-013.

#### Test Case: UTP-013-C (MOD-013 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-013-C1** — Validate valid/invalid class partitions for MOD-013 request payloads.

#### Test Case: UTP-013-D (MOD-013 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-013-D1** — Mock all external dependencies and validate deterministic behavior for MOD-013.

#### Test Case: UTP-013-E (MOD-013 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-013-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-013.

---

### Module Validation: MOD-014 — Age & Safety Policy Filter

**Parent ARCH**: ARCH-014

#### Test Case: UTP-014-A (MOD-014 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-014-A1** — Execute success and primary failure paths for MOD-014.

#### Test Case: UTP-014-B (MOD-014 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-014-B1** — Validate min, nominal, and max boundary inputs for MOD-014.

#### Test Case: UTP-014-C (MOD-014 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-014-C1** — Validate valid/invalid class partitions for MOD-014 request payloads.

#### Test Case: UTP-014-D (MOD-014 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-014-D1** — Mock all external dependencies and validate deterministic behavior for MOD-014.

#### Test Case: UTP-014-E (MOD-014 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-014-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-014.

---

### Module Validation: MOD-015 — Dispute Workflow Engine

**Parent ARCH**: ARCH-015

#### Test Case: UTP-015-A (MOD-015 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-015-A1** — Execute success and primary failure paths for MOD-015.

#### Test Case: UTP-015-B (MOD-015 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-015-B1** — Validate min, nominal, and max boundary inputs for MOD-015.

#### Test Case: UTP-015-C (MOD-015 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-015-C1** — Validate valid/invalid class partitions for MOD-015 request payloads.

#### Test Case: UTP-015-D (MOD-015 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-015-D1** — Mock all external dependencies and validate deterministic behavior for MOD-015.

#### Test Case: UTP-015-E (MOD-015 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-015-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-015.

---

### Module Validation: MOD-016 — Payout Adjustment Adapter

**Parent ARCH**: ARCH-016

#### Test Case: UTP-016-A (MOD-016 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-016-A1** — Execute success and primary failure paths for MOD-016.

#### Test Case: UTP-016-B (MOD-016 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-016-B1** — Validate min, nominal, and max boundary inputs for MOD-016.

#### Test Case: UTP-016-C (MOD-016 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-016-C1** — Validate valid/invalid class partitions for MOD-016 request payloads.

#### Test Case: UTP-016-D (MOD-016 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-016-D1** — Mock all external dependencies and validate deterministic behavior for MOD-016.

#### Test Case: UTP-016-E (MOD-016 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-016-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-016.

---

### Module Validation: MOD-017 — Audit Evidence Logger

**Parent ARCH**: ARCH-017

#### Test Case: UTP-017-A (MOD-017 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-017-A1** — Execute success and primary failure paths for MOD-017.

#### Test Case: UTP-017-B (MOD-017 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-017-B1** — Validate min, nominal, and max boundary inputs for MOD-017.

#### Test Case: UTP-017-C (MOD-017 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-017-C1** — Validate valid/invalid class partitions for MOD-017 request payloads.

#### Test Case: UTP-017-D (MOD-017 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-017-D1** — Mock all external dependencies and validate deterministic behavior for MOD-017.

#### Test Case: UTP-017-E (MOD-017 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-017-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-017.

---

### Module Validation: MOD-018 — Backup Restore Coordinator

**Parent ARCH**: ARCH-018

#### Test Case: UTP-018-A (MOD-018 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-018-A1** — Execute success and primary failure paths for MOD-018.

#### Test Case: UTP-018-B (MOD-018 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-018-B1** — Validate min, nominal, and max boundary inputs for MOD-018.

#### Test Case: UTP-018-C (MOD-018 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-018-C1** — Validate valid/invalid class partitions for MOD-018 request payloads.

#### Test Case: UTP-018-D (MOD-018 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-018-D1** — Mock all external dependencies and validate deterministic behavior for MOD-018.

#### Test Case: UTP-018-E (MOD-018 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-018-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-018.

---

### Module Validation: MOD-019 — Policy Snapshot Store

**Parent ARCH**: ARCH-019

#### Test Case: UTP-019-A (MOD-019 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-019-A1** — Execute success and primary failure paths for MOD-019.

#### Test Case: UTP-019-B (MOD-019 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-019-B1** — Validate min, nominal, and max boundary inputs for MOD-019.

#### Test Case: UTP-019-C (MOD-019 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-019-C1** — Validate valid/invalid class partitions for MOD-019 request payloads.

#### Test Case: UTP-019-D (MOD-019 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-019-D1** — Mock all external dependencies and validate deterministic behavior for MOD-019.

#### Test Case: UTP-019-E (MOD-019 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-019-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-019.

---

### Module Validation: MOD-020 — Scope Guard Module

**Parent ARCH**: ARCH-020

#### Test Case: UTP-020-A (MOD-020 statement and branch coverage)

**Technique**: Statement & Branch Coverage

- **Unit Scenario: UTS-020-A1** — Execute success and primary failure paths for MOD-020.

#### Test Case: UTP-020-B (MOD-020 boundary values)

**Technique**: Boundary Value Analysis

- **Unit Scenario: UTS-020-B1** — Validate min, nominal, and max boundary inputs for MOD-020.

#### Test Case: UTP-020-C (MOD-020 equivalence classes)

**Technique**: Equivalence Partitioning

- **Unit Scenario: UTS-020-C1** — Validate valid/invalid class partitions for MOD-020 request payloads.

#### Test Case: UTP-020-D (MOD-020 dependency isolation)

**Technique**: Strict Isolation

- **Unit Scenario: UTS-020-D1** — Mock all external dependencies and validate deterministic behavior for MOD-020.

#### Test Case: UTP-020-E (MOD-020 state transitions)

**Technique**: State Transition Testing

- **Unit Scenario: UTS-020-E1** — Validate Idle→Validating→Processing→Persisting→Completed and failure transitions for MOD-020.

---
