# Waiver Register: 002-auth0-user-auth

**Feature**: Auth0 User Authentication
**Created**: 2026-05-14
**Owner**: Auth0 Remediation Team
**Status**: Active
**Review Cycle**: Each release gate or when a waived item is resolved

---

## P0 Security Waiver Prohibition

> **No P0 security scenarios are waived.**
>
> The following scenarios and requirements are explicitly excluded from waiver consideration and must have executed test results before any release gate passes:
>
> - PKCE enforcement (REQ-001, ATS-001-A1, ATS-001-A2, ATS-001-B1)
> - PKCE verifier entropy (REQ-001, related unit test scenarios)
> - JWT authorizer validation (REQ-IF-004, REQ-IF-009, STS-015-\*)
> - Account deletion safety and cascading (REQ-026, REQ-027, REQ-028, REQ-CN-004)
> - Cross-tenant data isolation (HAZ-015, HAZ-014)
> - Unauthorized provisioning endpoint access (HAZ-012)
>
> Any attempt to waive the above is invalid and must be rejected at audit.

---

## Waiver Index

| ID     | Linked Artifact(s)                                                                 | Category                      | Risk | Status | Expiry / Revisit |
| ------ | ---------------------------------------------------------------------------------- | ----------------------------- | ---- | ------ | ---------------- |
| WVR-01 | REQ-NF-002, REQ-NF-003                                                             | Missing system-test mapping   | Low  | Active | 2026-08-01       |
| WVR-02 | REQ-NF-007, REQ-NF-008                                                             | Missing system-test mapping   | Low  | Active | 2026-08-01       |
| WVR-03 | REQ-IF-001, REQ-IF-002, REQ-IF-003, REQ-IF-005, REQ-IF-006                         | Missing system-test mapping   | Low  | Active | 2026-08-01       |
| WVR-04 | REQ-CN-001, REQ-CN-003, REQ-CN-004, REQ-CN-005, REQ-CN-006, REQ-CN-007, REQ-CN-008 | Missing system-test mapping   | Low  | Active | 2026-08-01       |
| WVR-05 | ARCH-025 (Suspension Status Checker)                                               | Missing integration test case | Low  | Active | 2026-08-01       |

---

## Waiver Details

### WVR-01 — Non-Functional Requirements: Performance and Scalability (REQ-NF-002, REQ-NF-003)

| Field       | Value                  |
| ----------- | ---------------------- |
| **ID**      | WVR-01                 |
| **Linked**  | REQ-NF-002, REQ-NF-003 |
| **Owner**   | Auth0 Remediation Team |
| **Created** | 2026-05-14             |
| **Expiry**  | 2026-08-01             |
| **Risk**    | Low                    |

**Requirement text (summary)**:

- REQ-NF-002: Auth flows SHALL complete within defined latency budgets (P95 targets).
- REQ-NF-003: The system SHALL handle concurrent auth requests without degradation.

**Why no system-test mapping exists**: Both requirements specify `Verification Method: Test` but the system-design artifact (`system-design.md`) does not define a dedicated SYS component for performance/load testing infrastructure. The traceability matrix generator therefore found no SYS-NNN anchor to attach STP/STS scenarios to. The requirements are real and must be verified; the gap is in the matrix mapping, not in the requirement itself.

**Rationale for deferral**: Sous Chef is a pre-launch consumer SaaS with no production traffic. Load and latency testing requires a staging environment with representative data volumes that does not yet exist. Executing synthetic load tests against Auth0's shared tenant before launch would produce misleading baselines.

**Risk**: Low. Auth0 handles the authentication compute; the Sous Chef backend adds only token validation overhead (JWKS cache hit path). Latency risk is bounded by Auth0's SLA.

**Mitigation**:

1. Add SYS-021 (Performance Test Harness) to `system-design.md` before the next release gate to close the mapping gap.
2. Execute k6 or Artillery load tests against the staging environment before the first production release.
3. Set CloudWatch alarms on P95 auth latency from day one of production traffic.

---

### WVR-02 — Non-Functional Requirements: Testing Pyramid and Error Classes (REQ-NF-007, REQ-NF-008)

| Field       | Value                  |
| ----------- | ---------------------- |
| **ID**      | WVR-02                 |
| **Linked**  | REQ-NF-007, REQ-NF-008 |
| **Owner**   | Auth0 Remediation Team |
| **Created** | 2026-05-14             |
| **Expiry**  | 2026-08-01             |
| **Risk**    | Low                    |

**Requirement text (summary)**:

- REQ-NF-007: Auth flows SHALL be resilient to Auth0 service degradation with defined fallback behavior.
- REQ-NF-008: Tests SHALL conform to the testing pyramid (>=70% unit, <=20% integration, <=10% E2E).

**Why no system-test mapping exists**: REQ-NF-007 describes a resilience property that spans multiple SYS components (SYS-001 through SYS-007) rather than mapping to a single system component. REQ-NF-008 is a process/inspection constraint on the test suite itself, not a runtime behavior of the auth system. Neither has a natural SYS-NNN anchor in the current system design.

**Rationale for deferral**: REQ-NF-007 resilience is partially covered by existing HAZ-009 (Auth0 outage during post-registration) and its mitigations in SYS-007. REQ-NF-008 is enforced by CI tooling (vitest coverage thresholds) rather than a system test scenario.

**Risk**: Low. REQ-NF-007 resilience paths are exercised indirectly through HAZ-009 hazard test coverage. REQ-NF-008 is a static property verifiable by inspection of the test suite at any time.

**Mitigation**:

1. Add a cross-cutting resilience test scenario to `system-test.md` that covers Auth0 circuit-breaker behavior (REQ-NF-007) before the next release gate.
2. Add a CI check that enforces the testing pyramid ratio (REQ-NF-008) and link it to the traceability matrix as an inspection evidence artifact.

---

### WVR-03 — Interface Requirements: SDK and Library Selection (REQ-IF-001, REQ-IF-002, REQ-IF-003, REQ-IF-005, REQ-IF-006)

| Field       | Value                                                      |
| ----------- | ---------------------------------------------------------- |
| **ID**      | WVR-03                                                     |
| **Linked**  | REQ-IF-001, REQ-IF-002, REQ-IF-003, REQ-IF-005, REQ-IF-006 |
| **Owner**   | Auth0 Remediation Team                                     |
| **Created** | 2026-05-14                                                 |
| **Expiry**  | 2026-08-01                                                 |
| **Risk**    | Low                                                        |

**Requirement text (summary)**:

- REQ-IF-001: Use `@auth0/nextjs-auth0` v4.x for web.
- REQ-IF-002: Use `react-native-auth0` v5.5 for mobile.
- REQ-IF-003: Use `expo-secure-store` for mobile token storage.
- REQ-IF-005: Use `jwks-rsa` and `jose` for JWT validation.
- REQ-IF-006: Use `@sentry/aws-serverless` and `@aws-lambda-powertools/logger` for observability.

**Why no system-test mapping exists**: All five requirements specify `Verification Method: Inspection`. They constrain which libraries are used, not what the system does at runtime. There are no SYS-NNN components in `system-design.md` dedicated to library selection; the libraries are consumed by existing components. The traceability matrix generator correctly found no STP/STS scenarios to attach.

**Rationale for deferral**: Inspection-verified requirements are satisfied by reviewing `package.json` and import statements. This is not a deferral of verification; it is a recognition that the verification method is inspection, not test execution.

**Risk**: None. The libraries are already present in `package.json` and in use across the codebase. Inspection evidence is available immediately.

**Mitigation**: Add an inspection checklist entry to the release gate process that confirms library versions match requirements. Record the `package.json` snapshot as evidence in `.sisyphus/evidence/`.

---

### WVR-04 — Constraint Requirements: Platform, Identity, and Tooling Constraints (REQ-CN-001, REQ-CN-003 through REQ-CN-008)

| Field       | Value                                                                              |
| ----------- | ---------------------------------------------------------------------------------- |
| **ID**      | WVR-04                                                                             |
| **Linked**  | REQ-CN-001, REQ-CN-003, REQ-CN-004, REQ-CN-005, REQ-CN-006, REQ-CN-007, REQ-CN-008 |
| **Owner**   | Auth0 Remediation Team                                                             |
| **Created** | 2026-05-14                                                                         |
| **Expiry**  | 2026-08-01                                                                         |
| **Risk**    | Low                                                                                |

**Requirement text (summary)**:

- REQ-CN-001: Lambda runtime SHALL be Node.js 22.x.
- REQ-CN-003: Canonical user identifier SHALL be UUIDv4; Auth0 `sub` used only for Auth0 API calls.
- REQ-CN-004: Account deletion SHALL be permanent (no soft-delete).
- REQ-CN-005: Email change is out of scope for this feature.
- REQ-CN-006: Admin UI is out of scope; suspension/impersonation are backend-only.
- REQ-CN-007: Infrastructure SHALL use CDK v2 only.
- REQ-CN-008: All workspaces SHALL extend shared tooling configs.

**Why no system-test mapping exists**: All seven requirements specify `Verification Method: Inspection`. They constrain architecture decisions, scope boundaries, and tooling choices. None describe runtime behaviors that generate STP/STS test scenarios. REQ-CN-004 (permanent deletion) is covered by existing acceptance and system test scenarios for account deletion (REQ-026 through REQ-028); the constraint aspect (no soft-delete) is an inspection check on the schema and deletion handler.

**Rationale for deferral**: Same as WVR-03. Inspection-verified constraints are satisfied by code review, schema review, and CDK stack review. The traceability gap is a matrix-generation artifact, not a verification gap.

**Risk**: Low. REQ-CN-004 (permanent deletion) has the highest consequence if violated; it is mitigated by the existing deletion test scenarios and a schema inspection confirming no `deletedAt` / `isDeleted` columns exist.

**Mitigation**: Add an inspection checklist to the release gate covering: Node.js runtime version in CDK stack, schema review for soft-delete columns, CDK-only IaC confirmation, and shared config extension in each workspace `package.json`.

---

### WVR-05 — Missing Integration Test Case: ARCH-025 Suspension Status Checker

| Field       | Value                      |
| ----------- | -------------------------- |
| **ID**      | WVR-05                     |
| **Linked**  | ARCH-025, SYS-015, SYS-016 |
| **Owner**   | Auth0 Remediation Team     |
| **Created** | 2026-05-14                 |
| **Expiry**  | 2026-08-01                 |
| **Risk**    | Low-Medium                 |

**Gap description**: Matrix C (Integration Verification) shows `ARCH-025 (Suspension Status Checker)` with `❌ MISSING` for its integration test case ID. The module is mapped to SYS-015 and SYS-016 in the architecture design, and SYS-015/SYS-016 have system test coverage (STP-015-_, STP-016-_). The gap is specifically at the integration test level in `integration-test.md`.

**Rationale for deferral**: The suspension status check is a read-only lookup against the Sous Chef database, called by the JWT authorizer Lambda. Its behavior is fully covered at the system test level (STS-015-B1, STS-015-B2, STS-015-C1 cover suspended-user rejection). The integration test gap means the module-to-module interaction (authorizer calling the status checker) lacks a dedicated ITP scenario, but the end-to-end path is exercised by system tests.

**Risk**: Low-Medium. The suspension check is a security-relevant path (suspended users must be denied). System test coverage partially compensates, but the integration-level gap means a regression in the authorizer-to-status-checker interface could go undetected until system test.

**Mitigation**:

1. Add `ITP-034-A` to `integration-test.md` covering ARCH-025 before the next release gate. This is the preferred resolution; the waiver should be closed, not renewed.
2. Until ITP-034-A exists, the system test scenarios STS-015-B1, STS-015-B2, STS-015-C1 serve as compensating controls.

---

## Waiver Closure Criteria

A waiver is closed when one of the following is true:

1. The linked requirement has an executed test result ingested into the traceability matrix.
2. The missing artifact (system design component, test case) has been added and the matrix regenerated.
3. The requirement is formally descoped via a change request and the requirements artifact is updated.

Closed waivers SHALL be moved to the **Closed Waivers** section below with a closure date and evidence reference.

---

## Closed Waivers

_None at this time._

---

## Audit Trail

| Date       | Action                         | Author                 |
| ---------- | ------------------------------ | ---------------------- |
| 2026-05-14 | Initial register created (T19) | Auth0 Remediation Team |
