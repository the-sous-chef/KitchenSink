# V-Model Peer Review: Auth0 User Authentication

**Feature Branch**: `002-auth0-user-auth`
**Review Date**: 2026-05-09
**Reviewer**: AI Peer Review (speckit.v-model.peer-review)
**Status**: Draft — Awaiting Resolution
**Artifacts Reviewed**:

- `specs/002-auth0-user-auth/v-model/requirements.md`
- `specs/002-auth0-user-auth/v-model/acceptance-plan.md`
- `specs/002-auth0-user-auth/v-model/unit-test.md`
- `specs/002-auth0-user-auth/v-model/trace.md`

**Standards Applied**: ISO 29119 (software testing), ISO 26262 (safety-critical patterns), IEC 62304 (software lifecycle), DO-178C (traceability discipline)

---

## Executive Summary

The artifact set is **substantially complete and well-structured** for a Draft baseline. The requirements specification covers 79 requirements across four categories with clear rationale and verification methods. The acceptance plan provides BDD scenarios for all 44 functional requirements. The unit test plan covers 6 modules with 30 scenarios using ISO 29119-4 white-box techniques. The traceability matrix provides five matrices (A–D + H) with bidirectional coverage.

**Critical findings**: 3 (must resolve before implementation begins)
**Warning findings**: 8 (should resolve before test execution)
**Passed**: 11 criteria

---

## Findings

---

### 🔴 CRITICAL

---

#### PRF-002-A1 — `requirements.md`: REQ-021 Verification Method Mismatch

**Artifact**: `requirements.md`
**Criterion**: Internal consistency — verification method must match testability of the requirement
**Severity**: CRITICAL

**Evidence**:

> REQ-021: "The account edit page SHALL display the email field as read-only with a note directing users to Auth0 for email changes." — Verification Method: **Inspection**

However, `trace.md` Matrix A maps REQ-021 to `AT-021-A` with verification method **Scenario-Based Testing**, and the acceptance plan defines a BDD scenario for it. The requirements document says "Inspection" but the downstream artifacts treat it as a testable scenario.

**Impact**: Verification method inconsistency means the requirement may be signed off via inspection alone while a test case exists that could fail — or vice versa. This is a traceability integrity violation.

**Resolution**: Align REQ-021's verification method to "Test" (matching the acceptance plan and trace matrix), or remove AT-021-A and mark it inspection-only in all downstream artifacts.

---

#### PRF-002-A2 — `unit-test.md`: No Unit Coverage for Post-Registration Action, API Gateway Authorizer, or Reconciliation Module

**Artifact**: `unit-test.md`
**Criterion**: Completeness of coverage — all modules with security-critical logic must have unit tests
**Severity**: CRITICAL

**Evidence**:
From `trace.md` Matrix C:

> "Post-Registration Action → Sous Chef DB: No UTP (backend action)"
> "API Gateway Authorizer → Auth0 JWKS: No UTP (authorizer module)"
> "Reconciliation Job → Auth0 Management API + DB: No UTP (reconciliation module)"

These three modules implement the most security-critical behaviors in the feature:

- The post-registration action creates User/Account records and stores UUIDv4 in `app_metadata` (REQ-013 through REQ-017)
- The API Gateway authorizer validates JWT signature, expiry, audience, and issuer on every request (REQ-038, REQ-039, REQ-042)
- The reconciliation job is the safety net for orphaned Auth0 users (REQ-017)

The unit test plan covers only 6 web/mobile client-side modules (MOD-001 through MOD-006). The backend Lambda modules are entirely absent.

**Impact**: HAZ-006 (orphaned Auth0 user), HAZ-008 (unauthorized API access), and HAZ-009 (suspended user retains access) have no unit-level verification. These are rated Critical and High severity in Matrix H.

**Resolution**: Add MOD-007 (Post-Registration Action), MOD-008 (API Gateway Authorizer), and MOD-009 (Reconciliation Job) to `module-design.md` and corresponding UTP cases to `unit-test.md`. At minimum, the authorizer's JWT validation logic (signature check, expiry, audience, issuer, suspension check) must have unit coverage.

---

#### PRF-002-A3 — `trace.md`: Matrix C Missing Integration Test for Account Deletion Cascade

**Artifact**: `trace.md`
**Criterion**: Forward/backward traceability completeness — all P1/P2 security-critical flows must have integration verification
**Severity**: CRITICAL

**Evidence**:
Matrix C lists "Account Deletion → Auth0 Management API" as a single integration point covering only REQ-024. However, REQ-025 (cascade to all user-owned data) is not listed as a separate integration point, and the cascade behavior (recipes, meal plans, etc.) is not mapped to any integration test.

Additionally, the suspension/reactivation flow (REQ-041, REQ-042, REQ-043, REQ-044) has no integration point in Matrix C at all. The authorizer's suspension check (HAZ-009, rated High) is only covered by AT-042-A at the acceptance level — no integration test between the authorizer and the suspension status check is defined.

**Impact**: The cascade deletion and suspension enforcement are GDPR-critical and security-critical respectively. Missing integration coverage means these behaviors could pass unit and acceptance tests while failing at the module boundary.

**Resolution**: Add integration points to Matrix C for:

1. Account Deletion Cascade → Sous Chef DB (REQ-024, REQ-025)
2. API Gateway Authorizer → Suspension Status Check (REQ-041, REQ-042)

---

### 🟡 WARNING

---

#### PRF-002-A4 — `requirements.md`: Double Comma Typos Indicate Copy-Paste Errors

**Artifact**: `requirements.md`
**Criterion**: Completeness — requirements must be unambiguous and free of syntactic errors
**Severity**: WARNING

**Evidence**:
Multiple requirements contain double commas that obscure intent:

- REQ-018: "display name, email, avatar,, account creation date" — double comma before "account creation date"
- REQ-NF-001: "Auth0 SDK types, token interfaces,, API response types" — double comma
- REQ-NF-002: "exported functions, classes, interfaces, type aliases,, interface fields" — double comma
- REQ-CN-008: "shared `@armoury/typescript`, `@armoury/eslint`, `@armoury/prettier`,, `@armoury/vitest`" — double comma

**Impact**: While the intent is clear in context, double commas in formal requirements documents can cause ambiguity during inspection-based verification and suggest the requirements were not carefully proofread.

**Resolution**: Correct all double commas. Perform a full text search for `,, ` across `requirements.md`.

---

#### PRF-002-A5 — `requirements.md`: REQ-001 Redundant Phrasing

**Artifact**: `requirements.md`
**Criterion**: Standards-based compliance — requirements must be atomic and unambiguous (ISO 29119 §5.2)
**Severity**: WARNING

**Evidence**:

> REQ-001: "The system SHALL authenticate users via Auth0 Authorization Code Flow with PKCE on the web platform, the mobile platform."

The phrase "on the web platform, the mobile platform" is grammatically awkward and could be read as a single platform called "the web platform, the mobile platform." REQ-002 and REQ-003 already split the platform-specific behaviors. REQ-001 as written is either redundant with REQ-002/REQ-003 or needs clearer scoping language.

**Resolution**: Rewrite as: "The system SHALL authenticate users via Auth0 Authorization Code Flow with PKCE on both the web (Next.js) and mobile (Expo) platforms." Alternatively, split into REQ-001-WEB and REQ-001-MOB for unambiguous platform scoping.

---

#### PRF-002-A6 — `acceptance-plan.md`: Source References `system-test.md` Which Is Not in Scope

**Artifact**: `acceptance-plan.md`
**Criterion**: Internal consistency — all referenced artifacts must exist or be explicitly noted as pending
**Severity**: WARNING

**Evidence**:
The acceptance plan header states:

> **Source**: `specs/002-auth0-user-auth/v-model/requirements.md`, `specs/002-auth0-user-auth/v-model/system-test.md`

However, `system-test.md` is not among the artifacts provided for review, and `trace.md`'s Artifact Information table lists it as "Referenced" with no creation date and no status. The acceptance plan's overview also states: "System tests (STP/STS) verify architectural behavior at the component boundary" — implying `system-test.md` exists and is a peer artifact.

**Impact**: If `system-test.md` does not exist, the acceptance plan's claim of complementary coverage with system tests is unverifiable. If it does exist but was not included in this review, the peer review is incomplete.

**Resolution**: Either (a) confirm `system-test.md` exists and include it in the artifact set, or (b) remove the reference from the acceptance plan header and update the overview to remove the STP/STS distinction until that artifact is created.

---

#### PRF-002-A7 — `unit-test.md`: UTP-004-A Uses `jose` Library Directly — Violates Strict Isolation Technique

**Artifact**: `unit-test.md`
**Criterion**: Standards-based compliance — ISO 29119-4 Strict Isolation requires all external dependencies mocked
**Severity**: WARNING

**Evidence**:

> UTS-004-A1: "Mock isolation: none (uses jose library directly)"
> UTS-004-A2: "Mock isolation: none"
> UTS-004-A3: "Mock isolation: none"

The test case `UTP-004-A` is declared with technique "Statement & Branch Coverage + Equivalence Partitioning" but the mock isolation notes confirm the `jose` library is used directly. The ISO 29119-4 technique table in the document itself states: "Strict Isolation — Every external dependency mocked/stubbed."

Using the real `jose` library in a unit test makes the test an integration test (MOD-004 ↔ jose), not a unit test. If `jose` has a bug or breaking change, these tests will fail for reasons unrelated to the module under test.

**Resolution**: Either (a) mock `jose`'s `decodeJwt` / `jwtVerify` functions and reclassify as true unit tests, or (b) move these scenarios to an integration test plan and replace them with unit tests that mock the jose boundary. Document the decision explicitly.

---

#### PRF-002-A8 — `unit-test.md`: MOD-006 Missing State Transition Testing for Mobile Auth Lifecycle

**Artifact**: `unit-test.md`
**Criterion**: Completeness of coverage — state machine views require State Transition Testing technique
**Severity**: WARNING

**Evidence**:
MOD-006 (Mobile Auth0 Client SDK Wrapper) covers only `getAccessToken` with 4 scenarios (UTP-006-A). The mobile auth lifecycle has at least 4 distinct states: Unauthenticated → Authenticating → Authenticated → Logging Out → Unauthenticated. The unit test plan's own technique table lists "State Transition Testing" as a mandatory technique for State Machine Views.

Missing transitions:

- Unauthenticated → Authenticating (login initiation)
- Authenticated → Logging Out (logout action, token revocation)
- Any state → Error (network failure during auth)
- Authenticated → Unauthenticated (refresh token expiry forcing re-auth, REQ-008)

**Resolution**: Add UTP-006-B with State Transition Testing technique covering the full mobile auth state machine. This is especially important given REQ-002 (mobile auto-displays auth screen) and REQ-008 (session persistence across restarts).

---

#### PRF-002-A9 — `trace.md`: Matrix A REQ-009 Acceptance Test Mismatch

**Artifact**: `trace.md`
**Criterion**: Internal consistency — acceptance test summaries must match the requirement being verified
**Severity**: WARNING

**Evidence**:
Matrix A maps REQ-009 as follows:

> REQ-009: "Bearer token attached to all API requests" → AT-009-A: "Expired session forces re-authentication"

REQ-009 states the system SHALL attach a valid access token to all API requests as a Bearer token. The acceptance test summary "Expired session forces re-authentication" describes the behavior of REQ-007/REQ-008 (token refresh / session expiry), not the positive case of Bearer token attachment.

The actual positive verification of REQ-009 (confirming the Authorization header is present and correctly formatted on API calls) appears to be missing from the acceptance plan.

**Resolution**: Add a positive scenario to AT-009-A verifying that authenticated API requests include `Authorization: Bearer <token>` in the request headers. The existing expired-session scenario should be relabeled or moved to AT-007-A/AT-008-A where it more naturally belongs.

---

#### PRF-002-A10 — `trace.md`: REQ-CN-008 Listed as Separate Constraint but Counted Inconsistently

**Artifact**: `trace.md`
**Criterion**: Internal consistency — requirement counts must be consistent across all artifacts
**Severity**: WARNING

**Evidence**:
`trace.md` Artifact Information states:

> "44 FR + 17 NF + 10 IF + 7 CN + 1 CN-008 = 79 total requirements"

This implies REQ-CN-008 is counted separately from the 7 CN requirements, making the actual constraint count 8 (REQ-CN-001 through REQ-CN-008). However, the acceptance plan overview states "7 constraint requirements (REQ-CN-001 through REQ-CN-007)" — omitting REQ-CN-008 from its coverage claim.

`requirements.md` itself lists REQ-CN-008 as a full constraint requirement in the Constraint Requirements table.

**Impact**: REQ-CN-008 (all auth workspaces extend shared configs) has no acceptance test case defined in the acceptance plan, and the acceptance plan does not acknowledge this gap.

**Resolution**: Either (a) add AT-CN-008-A to the acceptance plan and update the coverage claim to "8 constraint requirements," or (b) explicitly document REQ-CN-008 as Inspection-only with no AT required, and update the trace matrix accordingly.

---

#### PRF-002-A11 — `unit-test.md`: UTP-003-B Uses Real Crypto — Should Be Explicitly Classified

**Artifact**: `unit-test.md`
**Criterion**: Standards-based compliance — test classification must be explicit
**Severity**: WARNING

**Evidence**:

> UTS-003-B1: "Mock isolation: none (uses real crypto via Node.js crypto module)"

`trace.md` Matrix C notes: "Web Session Cookie Manager → AES-256-GCM crypto: Covered by unit test with real crypto; no additional integration test needed."

Using the real Node.js `crypto` module is acceptable for a unit test (it is a stdlib, not an external service), but the decision to treat this as a unit test rather than an integration test should be explicitly justified in the document. The current note in Matrix C is the only justification, and it is in the trace matrix rather than the unit test plan itself.

**Resolution**: Add a brief rationale note to UTP-003-B explaining why real crypto is acceptable here (stdlib, deterministic, no network I/O) and confirming this is a deliberate design decision, not an oversight.

---

### ✅ PASSED

---

#### PRF-002-P1 — `requirements.md`: Requirement Structure and Completeness

All 79 requirements (44 FR + 17 NF + 10 IF + 8 CN) are present with ID, description, priority, rationale, and verification method. The four-category structure (Functional, Non-Functional, Interface, Constraint) follows ISO 29119 patterns. Priorities are consistently assigned (P1/P2/P3). Rationale fields are substantive and security-aware.

---

#### PRF-002-P2 — `requirements.md`: Security Requirements Coverage

Security-critical behaviors are comprehensively specified: PKCE enforcement (REQ-001), secure token storage (REQ-006), token revocation on logout (REQ-011), JWT validation (REQ-039), suspension enforcement (REQ-042), and password delegation to Auth0 (REQ-028, REQ-CN-002). The constraint against using Auth0 `sub` as primary identifier (REQ-CN-003) demonstrates vendor lock-in awareness.

---

#### PRF-002-P3 — `requirements.md`: Assumptions and Dependencies Section

The Assumptions section correctly identifies pre-conditions (Auth0 tenant provisioned, database schema defined, CDK environment configured) that are outside the feature's scope. This is good practice for preventing scope creep and clarifying implementation prerequisites.

---

#### PRF-002-P4 — `acceptance-plan.md`: BDD Scenario Quality

BDD scenarios consistently follow Given/When/Then format with observable outcomes. Negative paths are included alongside positive paths (e.g., ATS-001-A2 for callback completion, ATS-005-A2 for tampered state rejection). Platform-specific scenarios (web vs. mobile) are correctly separated.

---

#### PRF-002-P5 — `acceptance-plan.md`: Non-Functional and Constraint Coverage

The acceptance plan correctly identifies which NF/IF/CN requirements are Inspection-only (no AT defined) vs. testable (AT defined). The distinction is clearly documented in Matrix A of the trace. This is appropriate — not all requirements need automated acceptance tests.

---

#### PRF-002-P6 — `unit-test.md`: ISO 29119-4 Technique Application

All 8 UTP cases identify their technique by name and anchor to a specific module design view. The technique table is present and correctly defines the 6 mandatory techniques. Multiple techniques are combined where appropriate (e.g., UTP-001-B: Statement Coverage + Equivalence Partitioning).

---

#### PRF-002-P7 — `unit-test.md`: Arrange/Act/Assert Format Consistency

All 30 UTS scenarios follow the Arrange/Act/Assert format with explicit mock isolation notes. This is consistent with ISO 29119-4 white-box test case specification requirements and enables direct implementation by engineers without ambiguity.

---

#### PRF-002-P8 — `trace.md`: Five-Matrix Structure

The trace matrix implements all five required matrices: Matrix A (Forward: REQ → ATP), Matrix B (Backward: ATP → REQ), Matrix C (Integration Verification), Matrix D (Implementation Verification: MOD → UTP), and Matrix H (Hazard Traceability). This is the complete V-Model traceability structure.

---

#### PRF-002-P9 — `trace.md`: Hazard Traceability (Matrix H)

Matrix H identifies 15 hazards with severity ratings (Critical/High/Medium/Low), maps each to requirements and mitigations, and links to specific acceptance test cases and unit test scenarios. HAZ-001 through HAZ-015 cover the primary attack surfaces: PKCE bypass, XSS token theft, session fixation, refresh token reuse, orphaned users, password exposure, unauthorized API access, suspended user bypass, impersonation abuse, accidental deletion, and GDPR non-compliance.

---

#### PRF-002-P10 — `trace.md`: Backward Traceability — No Orphan Acceptance Tests

Matrix B confirms all acceptance test cases (AT-001-A through AT-CN-007-A) trace back to a parent requirement. No orphan ATs were identified. This confirms the acceptance plan did not introduce test cases without a corresponding requirement.

---

#### PRF-002-P11 — `trace.md`: UTP → REQ Traceability Completeness

The UTP → REQ sub-table in Matrix D maps all 8 UTP cases to their covered requirements. REQ coverage via unit tests spans: REQ-001, REQ-003, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-039, REQ-040. The mapping is internally consistent with the unit test plan.

---

## Summary Table

| Finding ID  | Artifact             | Severity    | Title                                                                     |
| ----------- | -------------------- | ----------- | ------------------------------------------------------------------------- |
| PRF-002-A1  | `requirements.md`    | 🔴 CRITICAL | REQ-021 Verification Method Mismatch                                      |
| PRF-002-A2  | `unit-test.md`       | 🔴 CRITICAL | No Unit Coverage for Post-Registration Action, Authorizer, Reconciliation |
| PRF-002-A3  | `trace.md`           | 🔴 CRITICAL | Matrix C Missing Integration Tests for Deletion Cascade and Suspension    |
| PRF-002-A4  | `requirements.md`    | 🟡 WARNING  | Double Comma Typos Indicate Copy-Paste Errors                             |
| PRF-002-A5  | `requirements.md`    | 🟡 WARNING  | REQ-001 Redundant/Ambiguous Platform Phrasing                             |
| PRF-002-A6  | `acceptance-plan.md` | 🟡 WARNING  | Source References `system-test.md` Which Is Not in Scope                  |
| PRF-002-A7  | `unit-test.md`       | 🟡 WARNING  | UTP-004-A Uses `jose` Directly — Violates Strict Isolation                |
| PRF-002-A8  | `unit-test.md`       | 🟡 WARNING  | MOD-006 Missing State Transition Testing for Mobile Auth Lifecycle        |
| PRF-002-A9  | `trace.md`           | 🟡 WARNING  | Matrix A REQ-009 Acceptance Test Summary Mismatch                         |
| PRF-002-A10 | `trace.md`           | 🟡 WARNING  | REQ-CN-008 Counted Inconsistently Across Artifacts                        |
| PRF-002-A11 | `unit-test.md`       | 🟡 WARNING  | UTP-003-B Real Crypto Usage Not Explicitly Justified in Unit Test Plan    |
| PRF-002-P1  | `requirements.md`    | ✅ PASSED   | Requirement Structure and Completeness                                    |
| PRF-002-P2  | `requirements.md`    | ✅ PASSED   | Security Requirements Coverage                                            |
| PRF-002-P3  | `requirements.md`    | ✅ PASSED   | Assumptions and Dependencies Section                                      |
| PRF-002-P4  | `acceptance-plan.md` | ✅ PASSED   | BDD Scenario Quality                                                      |
| PRF-002-P5  | `acceptance-plan.md` | ✅ PASSED   | Non-Functional and Constraint Coverage                                    |
| PRF-002-P6  | `unit-test.md`       | ✅ PASSED   | ISO 29119-4 Technique Application                                         |
| PRF-002-P7  | `unit-test.md`       | ✅ PASSED   | Arrange/Act/Assert Format Consistency                                     |
| PRF-002-P8  | `trace.md`           | ✅ PASSED   | Five-Matrix Structure                                                     |
| PRF-002-P9  | `trace.md`           | ✅ PASSED   | Hazard Traceability (Matrix H)                                            |
| PRF-002-P10 | `trace.md`           | ✅ PASSED   | Backward Traceability — No Orphan Acceptance Tests                        |
| PRF-002-P11 | `trace.md`           | ✅ PASSED   | UTP → REQ Traceability Completeness                                       |

---

## Overall Assessment

**Verdict**: ⚠️ CONDITIONAL PASS — Resolve CRITICAL findings before implementation begins

The artifact set demonstrates strong engineering discipline: comprehensive requirement coverage, well-structured BDD scenarios, ISO 29119-4 compliant unit test cases, and a complete five-matrix traceability structure. The hazard analysis (Matrix H) is particularly thorough and reflects genuine security awareness.

The three CRITICAL findings must be resolved before implementation:

1. **PRF-002-A1** is a data integrity issue — a requirement with conflicting verification methods will cause sign-off ambiguity.
2. **PRF-002-A2** is the most significant gap — the backend Lambda modules (post-registration action, API Gateway authorizer, reconciliation job) are the highest-risk components in the feature and have zero unit test coverage defined.
3. **PRF-002-A3** leaves two security-critical integration boundaries (deletion cascade, suspension enforcement) without integration test definitions.

The eight WARNING findings are quality improvements that should be addressed before test execution but do not block implementation planning.

**Recommended next actions** (in priority order):

1. Add MOD-007/MOD-008/MOD-009 to `module-design.md` and corresponding UTP cases to `unit-test.md` (PRF-002-A2)
2. Add integration points for deletion cascade and suspension to `trace.md` Matrix C (PRF-002-A3)
3. Align REQ-021 verification method across `requirements.md` and `trace.md` (PRF-002-A1)
4. Confirm or create `system-test.md` (PRF-002-A6)
5. Fix double comma typos in `requirements.md` (PRF-002-A4)
6. Address remaining WARNING findings before test execution phase
