# System Design: Notification Service

**Feature Branch**: `014-notification-service`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/014-notification-service/v-model/requirements.md`

## Overview

The system decomposition maps all 31 requirements to independently testable service components, keeping producer ingress, recipient routing, subscriber delivery, observability, and governance concerns explicit. This feature is non-regulated (`domain: ''`), so design uses general software reliability and privacy controls.

## ID Schema

- **System Component**: `SYS-NNN` — sequential identifier, never renumbered.
- **Parent Requirements**: comma-separated `REQ-NNN` list per component (many-to-many).
- Example: `SYS-013` maps to `REQ-013, REQ-026` for counters and observability latency.

## Design Constraints (from FROZEN-PENDING-RESOLUTION markers)

| Constraint ID | Affected Scope | Constraint Summary                                                                                    |
| ------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| None          | N/A            | No `FROZEN-PENDING-RESOLUTION` markers are declared in feature 014 source artifacts as of 2026-05-10. |

## Decomposition View (IEEE 1016 §5.1)

| SYS ID  | Name                                          | Description                                                                                                                                                                        | Parent Requirements | Type                                                   |
| ------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------ | ------- | ------- |
| SYS-001 | Publish API Contract Gateway                  | The system SHALL expose a single publish API at `/api/v1/notifications/publish` accepting `{ recipient, messageType, payload, occurredAt, idempotencyKey? }`.                      | REQ-001             | Service                                                |
| SYS-002 | Producer Auth Verifier                        | The publish API SHALL authenticate producer calls using the shared service-to-service mechanism aligned with feature 002.                                                          | REQ-002             | Service                                                |
| SYS-003 | Durable Publish Commit Manager                | The publish API SHALL return success only after durable acceptance that survives single-instance restart.                                                                          | REQ-003             | Service                                                |
| SYS-004 | Recipient Descriptor Validator                | The service SHALL validate `RecipientDescriptor` (`user                                                                                                                            | group               | global`) and required/forbidden `id` presence by kind. | REQ-004 | Service |
| SYS-005 | User Recipient Router                         | The service SHALL route `recipient.kind=user` only to subscribers whose authenticated identity equals `recipient.id`.                                                              | REQ-005             | Service                                                |
| SYS-006 | Group Recipient Router                        | The service SHALL route `recipient.kind=group` to all users in group membership resolved at delivery time.                                                                         | REQ-006             | Service                                                |
| SYS-007 | Global Broadcast Router                       | The service SHALL route `recipient.kind=global` to all authenticated subscribers currently in application scope.                                                                   | REQ-007             | Service                                                |
| SYS-008 | Per-Recipient FIFO Sequencer                  | The service SHALL preserve FIFO ordering per recipient for user/group deliveries and SHALL NOT promise cross-recipient ordering.                                                   | REQ-008             | Service                                                |
| SYS-009 | Global Ordering Policy Guard                  | The service SHALL treat global ordering as best-effort and SHALL document global broadcasts as non-FIFO.                                                                           | REQ-009             | Service                                                |
| SYS-010 | Subscription API Gateway                      | The service SHALL expose authenticated subscription capability under `/api/v1/notifications/subscribe` (or transport-equivalent under `/api/v1/notifications/*`).                  | REQ-010             | Service                                                |
| SYS-011 | Client Dispatch Compatibility Contract        | Clients SHALL dispatch by `messageType`; unknown keywords SHALL be logged and ignored without crash.                                                                               | REQ-011             | Module                                                 |
| SYS-012 | Offline Catch-Up Retention Service            | The service SHALL retain undelivered user/group messages for a configurable catch-up window of at least 24 hours.                                                                  | REQ-012             | Service                                                |
| SYS-013 | Operational Counters Aggregator               | The service SHALL expose operational counters for producer publishes, delivered-by-recipient-kind, undelivered-after-retention, active subscribers, and per-messageType publishes. | REQ-013             | Service                                                |
| SYS-014 | Global Broadcast Counter Channel              | The service SHALL emit a distinct global-broadcast counter separable from user/group traffic.                                                                                      | REQ-014             | Service                                                |
| SYS-015 | Envelope Schema Validation Pipeline           | Publish envelope schema validation SHALL occur before durable storage; malformed envelopes SHALL return structured error responses.                                                | REQ-015             | Service                                                |
| SYS-016 | MessageType Registry Store                    | The platform SHALL maintain a version-controlled messageType registry with owner feature and description metadata.                                                                 | REQ-016             | Service                                                |
| SYS-017 | Registry Enforcement Switch                   | The service SHALL support per-environment registry enforcement mode that rejects unregistered messageType publishes.                                                               | REQ-017             | Service                                                |
| SYS-018 | Idempotency Dedup Engine                      | The publish contract SHALL support optional producer idempotencyKey deduplication within configured window (producer,key).                                                         | REQ-018             | Service                                                |
| SYS-019 | Per-Producer Quota Enforcer                   | The platform SHALL enforce per-producer publish quotas and emit throttled-publish counters on rejection.                                                                           | REQ-019             | Service                                                |
| SYS-020 | Unauthenticated Access Rejector               | The service SHALL reject all unauthenticated subscribe/delivery attempts.                                                                                                          | REQ-020             | Service                                                |
| SYS-021 | Cross-User Subscription Guard                 | The service SHALL block cross-user subscription attempts that do not match the authenticated identity.                                                                             | REQ-021             | Service                                                |
| SYS-022 | Opaque Payload Preservation Layer             | Publish processing SHALL treat payload as opaque JSON and SHALL NOT semantically validate domain payload fields.                                                                   | REQ-022             | Service                                                |
| SYS-023 | Unknown Recipient / Empty Group Counter Path  | Publish for unknown user or empty group recipients SHALL succeed with zero-delivery behavior and explicit undeliverable/zero-fanout counters.                                      | REQ-023             | Service                                                |
| SYS-024 | Publish Availability SLO Monitor              | Publish API availability SHALL be at least 99.9% over the reporting window.                                                                                                        | REQ-024             | Service                                                |
| SYS-025 | Delivery Latency SLO Evaluator                | Connected publish-to-delivery latency p95 SHALL be at most 2 seconds under nominal load.                                                                                           | REQ-025             | Service                                                |
| SYS-026 | Structured Logging and Counter Query Pipeline | Every accepted publish and delivery event SHALL be observable via structured logs and queryable counters within one minute.                                                        | REQ-026             | Service                                                |
| SYS-027 | Producer Fairness Backpressure Controller     | Backpressure controls SHALL ensure a misbehaving producer does not increase unrelated producer latency by more than 10%.                                                           | REQ-027             | Service                                                |
| SYS-028 | Node Runtime Conformance Gate                 | The runtime target SHALL be Node.js 24.x in alignment with monorepo engine constraints.                                                                                            | REQ-028             | Utility                                                |
| SYS-029 | Package Naming Governance Check               | Package naming for any notification-service packages SHALL follow `@kitchensink/{group}-{name}`.                                                                                   | REQ-029             | Utility                                                |
| SYS-030 | Launch Registry Coverage Readiness Gate       | At launch, at least five messageType registry entries SHALL exist spanning 003 plus reserved namespaces for 001/005/008/009.                                                       | REQ-030             | Module                                                 |
| SYS-031 | WA-004 Ownership Evidence Publisher           | The feature SHALL explicitly close WA-004 by documenting notification-service ownership in cross-feature consistency outcomes.                                                     | REQ-031             | Utility                                                |

## Dependency View (IEEE 1016 §5.2)

| Source  | Target  | Relationship | Failure Impact                                                      |
| ------- | ------- | ------------ | ------------------------------------------------------------------- |
| SYS-001 | SYS-002 | Calls        | Unauthorized producers could publish if auth path fails open.       |
| SYS-001 | SYS-003 | Calls        | Publish success could be returned without durable safety.           |
| SYS-001 | SYS-015 | Calls        | Malformed envelopes could contaminate durable queue.                |
| SYS-001 | SYS-018 | Calls        | Duplicate retries inflate delivery volume.                          |
| SYS-001 | SYS-019 | Calls        | Noisy producer can starve shared channel.                           |
| SYS-005 | SYS-008 | Calls        | User-target ordering would become non-deterministic.                |
| SYS-006 | SYS-008 | Calls        | Group fanout ordering could drift across reconnect.                 |
| SYS-006 | SYS-023 | Calls        | Empty groups not visible in counters.                               |
| SYS-007 | SYS-014 | Calls        | Global operational actions lose auditability.                       |
| SYS-010 | SYS-020 | Calls        | Unauthenticated subscription paths may remain reachable.            |
| SYS-010 | SYS-021 | Calls        | Cross-user leakage possible if identity mismatch checks fail.       |
| SYS-010 | SYS-012 | Reads        | Reconnect backlog not delivered.                                    |
| SYS-011 | SYS-022 | Uses         | Unknown messageType can crash clients instead of tolerant behavior. |
| SYS-013 | SYS-026 | Writes       | Counter integrity and queryability decay.                           |
| SYS-016 | SYS-017 | Uses         | Registry observe/enforce progression breaks.                        |
| SYS-017 | SYS-001 | Controls     | Enforcement mode not applied at publish boundary.                   |
| SYS-024 | SYS-026 | Reads        | Availability SLO cannot be proven.                                  |
| SYS-025 | SYS-026 | Reads        | Latency breach detection unavailable.                               |
| SYS-027 | SYS-019 | Controls     | Fairness objective cannot be enforced.                              |
| SYS-030 | SYS-016 | Reads        | Launch readiness for messageType coverage is unverifiable.          |
| SYS-031 | SYS-030 | Reads        | WA-004 closure evidence cannot be published confidently.            |

### Dependency Diagram

```text
Producer -> SYS-001 -> {SYS-002,SYS-015,SYS-003,SYS-018,SYS-019}
Subscriber -> SYS-010 -> {SYS-020,SYS-021,SYS-012} -> {SYS-005,SYS-006,SYS-007}
Routing -> SYS-008 -> Delivery
Observability -> SYS-013 -> SYS-026 -> {SYS-024,SYS-025,SYS-027,SYS-030,SYS-031}
Registry -> SYS-016 -> SYS-017 -> SYS-001
```

## Interface View (IEEE 1016 §5.3)

### External Interfaces

| Interface                                                   | Producer/Consumer                       | Components                                                                      | Contract                                                                                  |
| ----------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `POST /api/v1/notifications/publish`                        | Producer services (001/003/005/008/009) | SYS-001, SYS-002, SYS-003, SYS-015, SYS-016, SYS-017, SYS-018, SYS-019          | PublishEnvelope ingress with auth, validation, durability, dedup, quota, registry policy. |
| `/api/v1/notifications/subscribe` (or transport-equivalent) | Authenticated web/mobile clients        | SYS-010, SYS-020, SYS-021, SYS-012                                              | Identity-bound subscription and reconnect catch-up.                                       |
| Operator counters endpoint/query plane                      | Ops engineer                            | SYS-013, SYS-014, SYS-023, SYS-024, SYS-025, SYS-026, SYS-027, SYS-030, SYS-031 | Counter, SLO, readiness, ownership evidence reporting.                                    |

### Internal Interfaces

| Interface                     | Components                                  | Contract Summary                                                              |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| Recipient routing contract    | SYS-004, SYS-005, SYS-006, SYS-007, SYS-008 | Normalized recipient descriptor -> recipient-scoped sequence/delivery stream. |
| Registry enforcement contract | SYS-016, SYS-017, SYS-001                   | messageType lookup + enforcement mode -> allow/reject + counter side effects. |
| Catch-up retention contract   | SYS-012, SYS-010                            | Retained undelivered backlog keyed by authenticated subscriber identity.      |
| Payload opacity contract      | SYS-022 with SYS-001/SYS-015                | Envelope fields validated while payload remains opaque passthrough JSON.      |

## Data Design View (IEEE 1016 §5.4)

| Data Entity              | Owned By            | Key Fields                                                             | Lifecycle                                         |
| ------------------------ | ------------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| PublishEnvelope          | SYS-001/SYS-015     | recipient, messageType, payload, occurredAt, idempotencyKey            | Ingested, validated, durably committed.           |
| DeliveryEnvelope         | SYS-005/006/007/008 | id, messageType, payload, occurredAt, publishedAt                      | Routed, sequenced, delivered/retried/expired.     |
| MessageTypeRegistryEntry | SYS-016/017/030     | messageType, ownerFeature, description, registeredAt, enforcementState | Versioned configuration and runtime policy input. |
| CounterRecord            | SYS-013/014/023/026 | metricName, labels, value, timestamp                                   | Aggregated and queryable within one minute.       |
| SubscriberSession        | SYS-010/020/021     | subscriberId, authSubject, connectionState                             | Authenticated session boundary for routing.       |

## Coverage Summary

| Metric                  | Value        |
| ----------------------- | ------------ |
| Total Requirements      | 31           |
| Total System Components | 31           |
| REQ → SYS Coverage      | 31/31 (100%) |

### REQ → SYS Coverage Index (verifies 100%)

- REQ-001 → SYS-001
- REQ-002 → SYS-002
- REQ-003 → SYS-003
- REQ-004 → SYS-004
- REQ-005 → SYS-005
- REQ-006 → SYS-006
- REQ-007 → SYS-007
- REQ-008 → SYS-008
- REQ-009 → SYS-009
- REQ-010 → SYS-010
- REQ-011 → SYS-011
- REQ-012 → SYS-012
- REQ-013 → SYS-013
- REQ-014 → SYS-014
- REQ-015 → SYS-015
- REQ-016 → SYS-016
- REQ-017 → SYS-017
- REQ-018 → SYS-018
- REQ-019 → SYS-019
- REQ-020 → SYS-020
- REQ-021 → SYS-021
- REQ-022 → SYS-022
- REQ-023 → SYS-023
- REQ-024 → SYS-024
- REQ-025 → SYS-025
- REQ-026 → SYS-026
- REQ-027 → SYS-027
- REQ-028 → SYS-028
- REQ-029 → SYS-029
- REQ-030 → SYS-030
- REQ-031 → SYS-031

## Derived Requirements

- None. System decomposition remains within the 31 requirement baseline.

## Glossary

| Term               | Definition                                            |
| ------------------ | ----------------------------------------------------- |
| SYS-NNN            | System component identifier in this design layer.     |
| Recipient scope    | User/group/global routing domain for a publish event. |
| Catch-up retention | Offline window for undelivered user/group messages.   |
