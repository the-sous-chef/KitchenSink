# Integration Test Plan: Public Creator Profiles

**Feature Branch**: `012-creator-profiles`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/012-creator-profiles/v-model/architecture-design.md`

## Overview

Integration plan validates module boundary contracts for every architecture module (`ARCH-001..ARCH-020`) using four mandatory techniques.

## Test ID & Technique Rules

- `ITP-NNN-A`: Interface Contract Testing
- `ITP-NNN-B`: Communication Path Testing
- `ITP-NNN-C`: Data Flow Testing
- `ITP-NNN-D`: Sequence/Order Testing

## Integration Tests

### Architecture Module Integration: ARCH-001 — Creator Lifecycle Controller

#### Test Case: ITP-001-A (Interface contract for Creator Lifecycle Controller)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-001-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-001-B (Communication path for Creator Lifecycle Controller)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-001-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-001-C (Data flow for Creator Lifecycle Controller)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-001-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-001-D (Sequence/order for Creator Lifecycle Controller)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-001-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-002 — Handle Policy Validator

#### Test Case: ITP-002-A (Interface contract for Handle Policy Validator)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-002-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-002-B (Communication path for Handle Policy Validator)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-002-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-002-C (Data flow for Handle Policy Validator)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-002-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-002-D (Sequence/order for Handle Policy Validator)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-002-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-003 — Creator Profile Repository

#### Test Case: ITP-003-A (Interface contract for Creator Profile Repository)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-003-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-003-B (Communication path for Creator Profile Repository)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-003-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-003-C (Data flow for Creator Profile Repository)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-003-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-003-D (Sequence/order for Creator Profile Repository)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-003-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-004 — Public Profile Query Service

#### Test Case: ITP-004-A (Interface contract for Public Profile Query Service)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-004-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-004-B (Communication path for Public Profile Query Service)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-004-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-004-C (Data flow for Public Profile Query Service)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-004-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-004-D (Sequence/order for Public Profile Query Service)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-004-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-005 — SEO Metadata Builder

#### Test Case: ITP-005-A (Interface contract for SEO Metadata Builder)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-005-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-005-B (Communication path for SEO Metadata Builder)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-005-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-005-C (Data flow for SEO Metadata Builder)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-005-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-005-D (Sequence/order for SEO Metadata Builder)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-005-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-006 — Follow Command Handler

#### Test Case: ITP-006-A (Interface contract for Follow Command Handler)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-006-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-006-B (Communication path for Follow Command Handler)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-006-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-006-C (Data flow for Follow Command Handler)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-006-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-006-D (Sequence/order for Follow Command Handler)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-006-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-007 — Follow Counter Projector

#### Test Case: ITP-007-A (Interface contract for Follow Counter Projector)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-007-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-007-B (Communication path for Follow Counter Projector)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-007-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-007-C (Data flow for Follow Counter Projector)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-007-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-007-D (Sequence/order for Follow Counter Projector)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-007-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-008 — Feed Fanout Adapter

#### Test Case: ITP-008-A (Interface contract for Feed Fanout Adapter)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-008-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-008-B (Communication path for Feed Fanout Adapter)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-008-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-008-C (Data flow for Feed Fanout Adapter)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-008-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-008-D (Sequence/order for Feed Fanout Adapter)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-008-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-009 — Collections API Service

#### Test Case: ITP-009-A (Interface contract for Collections API Service)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-009-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-009-B (Communication path for Collections API Service)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-009-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-009-C (Data flow for Collections API Service)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-009-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-009-D (Sequence/order for Collections API Service)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-009-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-010 — Collection Ordering Engine

#### Test Case: ITP-010-A (Interface contract for Collection Ordering Engine)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-010-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-010-B (Communication path for Collection Ordering Engine)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-010-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-010-C (Data flow for Collection Ordering Engine)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-010-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-010-D (Sequence/order for Collection Ordering Engine)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-010-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-011 — Widget Fragment Renderer

#### Test Case: ITP-011-A (Interface contract for Widget Fragment Renderer)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-011-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-011-B (Communication path for Widget Fragment Renderer)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-011-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-011-C (Data flow for Widget Fragment Renderer)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-011-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-011-D (Sequence/order for Widget Fragment Renderer)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-011-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-012 — Analytics Snapshot Job

#### Test Case: ITP-012-A (Interface contract for Analytics Snapshot Job)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-012-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-012-B (Communication path for Analytics Snapshot Job)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-012-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-012-C (Data flow for Analytics Snapshot Job)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-012-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-012-D (Sequence/order for Analytics Snapshot Job)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-012-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-013 — Analytics Read Endpoint

#### Test Case: ITP-013-A (Interface contract for Analytics Read Endpoint)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-013-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-013-B (Communication path for Analytics Read Endpoint)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-013-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-013-C (Data flow for Analytics Read Endpoint)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-013-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-013-D (Sequence/order for Analytics Read Endpoint)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-013-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-014 — Moderation & DMCA Orchestrator

#### Test Case: ITP-014-A (Interface contract for Moderation & DMCA Orchestrator)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-014-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-014-B (Communication path for Moderation & DMCA Orchestrator)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-014-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-014-C (Data flow for Moderation & DMCA Orchestrator)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-014-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-014-D (Sequence/order for Moderation & DMCA Orchestrator)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-014-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-015 — Monetization Delegation Adapter

#### Test Case: ITP-015-A (Interface contract for Monetization Delegation Adapter)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-015-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-015-B (Communication path for Monetization Delegation Adapter)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-015-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-015-C (Data flow for Monetization Delegation Adapter)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-015-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-015-D (Sequence/order for Monetization Delegation Adapter)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-015-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-016 — AuthZ & Session Freshness Guard

#### Test Case: ITP-016-A (Interface contract for AuthZ & Session Freshness Guard)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-016-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-016-B (Communication path for AuthZ & Session Freshness Guard)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-016-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-016-C (Data flow for AuthZ & Session Freshness Guard)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-016-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-016-D (Sequence/order for AuthZ & Session Freshness Guard)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-016-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-017 — Privacy Erasure Orchestrator

#### Test Case: ITP-017-A (Interface contract for Privacy Erasure Orchestrator)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-017-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-017-B (Communication path for Privacy Erasure Orchestrator)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-017-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-017-C (Data flow for Privacy Erasure Orchestrator)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-017-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-017-D (Sequence/order for Privacy Erasure Orchestrator)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-017-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-018 — Blocked Interaction Filter

#### Test Case: ITP-018-A (Interface contract for Blocked Interaction Filter)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-018-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-018-B (Communication path for Blocked Interaction Filter)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-018-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-018-C (Data flow for Blocked Interaction Filter)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-018-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-018-D (Sequence/order for Blocked Interaction Filter)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-018-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-019 — Abuse Throttle & Spam Detection

#### Test Case: ITP-019-A (Interface contract for Abuse Throttle & Spam Detection)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-019-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-019-B (Communication path for Abuse Throttle & Spam Detection)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-019-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-019-C (Data flow for Abuse Throttle & Spam Detection)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-019-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-019-D (Sequence/order for Abuse Throttle & Spam Detection)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-019-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---

### Architecture Module Integration: ARCH-020 — Audit Log Publisher

#### Test Case: ITP-020-A (Interface contract for Audit Log Publisher)

**Technique**: Interface Contract Testing

- **Scenario**: `ITS-020-A1` validates request/response schema, auth policy, and error envelope at the module boundary.

#### Test Case: ITP-020-B (Communication path for Audit Log Publisher)

**Technique**: Communication Path Testing

- **Scenario**: `ITS-020-B1` verifies upstream/downstream handshake semantics and retry-safe propagation.

#### Test Case: ITP-020-C (Data flow for Audit Log Publisher)

**Technique**: Data Flow Testing

- **Scenario**: `ITS-020-C1` traces payload transformation from ingress DTO to persisted/emitted integration artifact.

#### Test Case: ITP-020-D (Sequence/order for Audit Log Publisher)

**Technique**: Sequence/Order Testing

- **Scenario**: `ITS-020-D1` verifies ordered side effects (guard -> state change -> event/audit) and race-safe behavior.

---
