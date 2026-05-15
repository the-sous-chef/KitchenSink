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

| ID     | Linked Artifact(s)                                                                 | Category                                                               | Risk | Status | Expiry / Revisit |
| ------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---- | ------ | ---------------- |
| WVR-01 | REQ-NF-002, REQ-NF-003                                                             | Missing system-test mapping                                            | Low  | Active | 2026-08-01       |
| WVR-02 | REQ-NF-007, REQ-NF-008                                                             | Missing system-test mapping                                            | Low  | Active | 2026-08-01       |
| WVR-03 | REQ-IF-001, REQ-IF-002, REQ-IF-003, REQ-IF-005, REQ-IF-006                         | Missing system-test mapping                                            | Low  | Active | 2026-08-01       |
| WVR-04 | REQ-CN-001, REQ-CN-003, REQ-CN-004, REQ-CN-005, REQ-CN-006, REQ-CN-007, REQ-CN-008 | Missing system-test mapping                                            | Low  | Active | 2026-08-01       |
| WVR-05 | ARCH-025 (Suspension Status Checker)                                               | Missing integration test case                                          | Low  | Closed | 2026-05-14       |
| WVR-06 | REQ-NF-001, REQ-NF-005, REQ-NF-006, REQ-NF-009, REQ-NF-010, REQ-NF-011             | Static analysis / code quality — no acceptance test applicable         | Low  | Active | 2026-08-01       |
| WVR-07 | REQ-NF-017                                                                         | Analysis / future-proofing — Verification Method is Analysis, not Test | Low  | Active | 2026-08-01       |
| WVR-08 | REQ-IF-004, REQ-IF-007                                                             | Inspection — Verification Method is Inspection, not Test               | Low  | Active | 2026-08-01       |

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

### WVR-05 — Missing Integration Test Case: ARCH-025 Suspension Status Checker ✅ CLOSED

| Field          | Value                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**         | WVR-05                                                                                                                                                |
| **Linked**     | ARCH-025, SYS-015, SYS-016                                                                                                                            |
| **Owner**      | Auth0 Remediation Team                                                                                                                                |
| **Created**    | 2026-05-14                                                                                                                                            |
| **Closed**     | 2026-05-14                                                                                                                                            |
| **Risk**       | Low-Medium                                                                                                                                            |
| **Resolution** | ITP-025-A and ITP-025-B added to `integration-test.md`; Matrix C updated with `ITS-025-A1, ITS-025-B1`. Waiver condition met per Closure Criterion 2. |

**Gap description**: Matrix C (Integration Verification) showed `ARCH-025 (Suspension Status Checker)` with `❌ MISSING` for its integration test case ID.

**Resolution**: Integration test cases `ITP-025-A` (Active User → Allow Signal) and `ITP-025-B` (Suspended User → Deny Signal) were confirmed present in `integration-test.md`. Matrix C updated accordingly. Waiver closed 2026-05-14 (T18 doc-sync).

---

### WVR-06 — Code Quality / Static Analysis Requirements (REQ-NF-001, REQ-NF-005, REQ-NF-006, REQ-NF-009, REQ-NF-010, REQ-NF-011)

| Field       | Value                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| **ID**      | WVR-06                                                                 |
| **Linked**  | REQ-NF-001, REQ-NF-005, REQ-NF-006, REQ-NF-009, REQ-NF-010, REQ-NF-011 |
| **Owner**   | Auth0 Remediation Team                                                 |
| **Created** | 2026-05-14                                                             |
| **Expiry**  | 2026-08-01                                                             |
| **Risk**    | Low                                                                    |

**Requirement summaries**:

- REQ-NF-001: TypeScript `strict: true`, no `any` outside test doubles
- REQ-NF-005: Auth status indicators must not rely on color alone
- REQ-NF-006: New workspaces must register in root `package.json` and extend shared configs
- REQ-NF-009: Custom errors must extend `Error` and expose type guards
- REQ-NF-010: Date fields must be ISO 8601 strings, never `Date` objects
- REQ-NF-011: Login/signup UI must consume design system tokens

**Rationale for deferral**: These requirements have `Verification Method: Inspection` or are enforced by static analysis tooling (TypeScript compiler, ESLint, design token linter). They do not map to acceptance test scenarios because they are verified at build/CI time or via code review, not via runtime behavior. No acceptance test scenario can meaningfully exercise "all imports use aliased paths" or "no `any` outside test doubles."

**Mitigation**: Verified by:

- `turbo run typecheck` (strict mode) for REQ-NF-001, REQ-NF-009, REQ-NF-010
- ESLint + design token audit for REQ-NF-005, REQ-NF-011
- Workspace config inspection for REQ-NF-006

---

### WVR-07 — Future-Proofing / Analysis Requirement (REQ-NF-017)

| Field       | Value                  |
| ----------- | ---------------------- |
| **ID**      | WVR-07                 |
| **Linked**  | REQ-NF-017             |
| **Owner**   | Auth0 Remediation Team |
| **Created** | 2026-05-14             |
| **Expiry**  | 2026-08-01             |
| **Risk**    | Low                    |

**Requirement summary**: The observability architecture SHALL allow future integration of LogRocket / NewRelic without requiring changes to application logging/metrics instrumentation.

**Rationale for deferral**: REQ-NF-017 has `Verification Method: Analysis`. It is a future-proofing architectural constraint, not a testable runtime behavior. No acceptance test scenario can verify "the architecture allows future integration" — this is verified by architecture review and the use of abstraction layers (MOD-027, MOD-028, MOD-029).

**Mitigation**: Verified by architecture design review confirming MOD-027/028/029 use abstraction interfaces that do not hard-code specific vendor SDKs.

---

### WVR-08 — Inspection Requirements: Library and Infrastructure Selection (REQ-IF-004, REQ-IF-007)

| Field       | Value                  |
| ----------- | ---------------------- |
| **ID**      | WVR-08                 |
| **Linked**  | REQ-IF-004, REQ-IF-007 |
| **Owner**   | Auth0 Remediation Team |
| **Created** | 2026-05-14             |
| **Expiry**  | 2026-08-01             |
| **Risk**    | Low                    |

**Requirement summaries**:

- REQ-IF-004: API Gateway authorizer SHALL use `jwks-rsa`, `jose` libraries for JWT validation
- REQ-IF-007: Infrastructure SHALL be defined using AWS CDK v2 (`aws-cdk-lib`)

**Rationale for deferral**: Both requirements have `Verification Method: Inspection`. They specify which libraries/tools must be used, not runtime behavior. Verification is by `package.json` dependency inspection and CDK stack review, not by acceptance test scenarios.

**Mitigation**: Verified by:

- `package.json` dependency inspection confirming `jwks-rsa` and `jose` are present in `packages/services/identity-webhooks/`
- CDK stack inspection confirming `aws-cdk-lib` v2 is used in `packages/infra/identity/`

---

## Waiver Closure Criteria

A waiver is closed when one of the following is true:

1. The linked requirement has an executed test result ingested into the traceability matrix.
2. The missing artifact (system design component, test case) has been added and the matrix regenerated.
3. The requirement is formally descoped via a change request and the requirements artifact is updated.

Closed waivers SHALL be moved to the **Closed Waivers** section below with a closure date and evidence reference.

---

## Closed Waivers

| ID     | Linked Artifact(s)                   | Closed     | Resolution                                                                                |
| ------ | ------------------------------------ | ---------- | ----------------------------------------------------------------------------------------- |
| WVR-05 | ARCH-025 (Suspension Status Checker) | 2026-05-14 | ITP-025-A, ITP-025-B confirmed in `integration-test.md`; Matrix C updated (T18 doc-sync). |

---

## Audit Trail

| Date       | Action                                                                             | Author                 |
| ---------- | ---------------------------------------------------------------------------------- | ---------------------- |
| 2026-05-14 | Initial register created (T19)                                                     | Auth0 Remediation Team |
| 2026-05-14 | WVR-05 closed — ITP-025-A/B confirmed; WVR-06, WVR-07, WVR-08 added (T18 doc-sync) | Auth0 Remediation Team |
