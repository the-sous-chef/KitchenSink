# V-Model Peer Review: AI Integration

**Feature Branch**: `005-ai-integration`
**Review Date**: 2026-05-09
**Reviewer**: AI Peer Review (Automated Linter)
**Artifacts Reviewed**:

- `specs/005-ai-integration/v-model/requirements.md`
- `specs/005-ai-integration/v-model/acceptance-plan.md`
- `specs/005-ai-integration/v-model/unit-test.md`
- `specs/005-ai-integration/v-model/trace.md`

**Review Standard**: ISO 29119 / V-Model bidirectional traceability; five lenses applied per artifact:

1. Standards compliance
2. Internal consistency
3. Traceability completeness
4. Coverage gaps
5. Missing test scenarios

---

## Summary

| Severity | Count |
| -------- | ----- |
| CRITICAL | 4     |
| WARNING  | 8     |
| PASSED   | 12    |

**Overall Verdict**: ⚠️ **CONDITIONAL PASS** — Four critical findings must be resolved before this artifact set is considered shippable. Eight warnings should be addressed before implementation begins.

---

## CRITICAL Findings

---

### PRF-005-A1 — Duplicate AT section label `AT-005-F` in acceptance-plan.md

**Artifact**: `acceptance-plan.md`
**Lens**: Internal Consistency
**Severity**: CRITICAL

**Evidence**: The acceptance plan defines two distinct test cases both labeled `AT-005-F`:

- Line ~109: `AT-005-F — Provider credential management` (covers REQ-001, REQ-NF-005; scenarios ATS-005-F1 through ATS-005-F4)
- Line ~122: `AT-005-F (Accessibility & Type Safety)` (covers REQ-NF-001 through REQ-NF-004; scenarios ATS-005-G1 through ATS-005-G4)

The second block uses `AT-005-F` as its header but internally assigns scenario IDs with the `G` suffix (`ATS-005-G1`, `ATS-005-G2`, etc.), indicating the intended label was `AT-005-G`. The trace matrix (Matrix A, Matrix B) correctly references `AT-005-G` for non-functional requirements, creating a mismatch between the acceptance plan and the trace matrix.

**Impact**: Any tooling or human reviewer cross-referencing `AT-005-F` will find two conflicting test cases. The trace matrix references `AT-005-G` which does not exist as a named section in the acceptance plan.

**Required Fix**: Rename the second `AT-005-F` section header to `AT-005-G — Accessibility & Type Safety` to match the scenario IDs (`ATS-005-G*`) and the trace matrix references.

---

### PRF-005-A2 — Integration test plan entirely absent; 13 integration points unverified

**Artifact**: `trace.md` (Gap Report), `unit-test.md`
**Lens**: Coverage Gaps
**Severity**: CRITICAL

**Evidence**: The trace matrix Gap Report (line ~282) explicitly states:

> "All 13 integration points identified in Matrix C lack defined integration test cases."

No `integration-test.md` artifact exists in the v-model directory. The gap report flags MOD-015 (`AuthGuardMiddleware`) as **High** risk with no UTP defined, and MOD-016 (`PremiumEntitlementGuard`) as **Medium** risk with no UTP defined. Both are cross-cutting security guards that enforce authentication and premium entitlement on every AI and agent endpoint. The recommendation to "define integration test cases" is noted but not acted upon within the artifact set.

**Impact**: The two highest-risk cross-cutting modules (auth guard, premium gate) have zero executable test coverage at any level. A security regression in either module would not be caught by the defined test suite.

**Required Fix**: Either (a) produce an `integration-test.md` covering the 13 Matrix C integration points, with priority on MOD-015 and MOD-016, or (b) explicitly document that integration tests are deferred to a separate sprint and update the trace matrix status to reflect the deferred coverage risk.

---

### PRF-005-A3 — REQ-CN-001 has no executable verification path

**Artifact**: `requirements.md`, `trace.md`
**Lens**: Traceability Completeness
**Severity**: CRITICAL

**Evidence**: `REQ-CN-001` ("AI Integration MUST depend on Recipe entities from spec 001-sous-chef-recipe-app") is listed with `Verification Method: Inspection` and no ATP-ID in Matrix A:

> `*(Inspection — no AT defined)*`

The trace matrix Gap Report classifies this as Low risk, but the requirement is Priority P1 and represents a hard cross-spec dependency. No acceptance test, integration test, or unit test verifies that AI-generated recipes are actually stored as `Recipe` entities from spec 001 (correct schema, correct table, correct foreign keys). The unit tests for `RecipeRepository` (MOD-007) stub the repository entirely, so they do not verify the actual schema dependency.

**Impact**: If the spec 001 Recipe schema changes (e.g., a required field is added), the AI integration could silently break with no test catching the regression. "Inspection" is insufficient for a P1 cross-spec dependency.

**Required Fix**: Add at least one acceptance test scenario to `AT-005-B` or a new `AT-005-H` that verifies an AI-generated recipe is persisted with the correct spec-001 schema fields (e.g., `ownerId`, `isPrivate`, `source`, `createdAt`). Alternatively, add a schema-level integration test that validates the `provider_configs` and `agent_consent_records` tables against the spec-001 migration baseline.

---

### PRF-005-A4 — `stateStore` in OAuthAuthorizationServer is in-memory; no persistence or TTL test defined

**Artifact**: `unit-test.md` (UTP-008-A), `acceptance-plan.md`
**Lens**: Missing Test Scenarios
**Severity**: CRITICAL

**Evidence**: UTP-008-A describes `initiateAuthorization` storing OAuth state "in memory" (`server.stateStore`). UTS-008-A1 verifies the state is stored; UTS-008-A2 verifies state mismatch throws. However, no test scenario covers:

1. **State expiry**: What happens if the OAuth callback arrives after the state TTL expires? The state store entry may have been evicted, causing a false "State mismatch" error for a legitimate user.
2. **Concurrent authorization requests**: If a user initiates two OAuth flows simultaneously, does the second overwrite the first state entry? This could allow a CSRF attack window.
3. **Server restart**: In-memory state is lost on restart; a user mid-flow would receive a state mismatch error with no recovery path.

The acceptance plan (AT-005-C) does not include a scenario for state TTL expiry or concurrent flow collision.

**Impact**: The OAuth PKCE flow is a security-critical path (HAZ-005). Missing TTL and concurrency tests leave a gap in the security verification of the authorization server.

**Required Fix**: Add UTS-008-A3 (state TTL expiry → Error thrown with descriptive message) and UTS-008-A4 (concurrent state entries coexist without collision). Add ATS-005-C8 to the acceptance plan covering state expiry during OAuth flow.

---

## WARNING Findings

---

### PRF-005-B1 — All 26 requirements share the same priority (P2 for FR/IF/CN, P1 for NF)

**Artifact**: `requirements.md`
**Lens**: Standards Compliance
**Severity**: WARNING

**Evidence**: Every functional requirement (REQ-001 through REQ-015) is assigned `P2`. Every non-functional requirement is `P1`. No requirement is `P1` for functional criticality, and no requirement is `P3` for lower priority. The security-critical requirements (REQ-010, REQ-011 — OAuth consent and unauthorized access rejection) carry the same priority as cosmetic/UX requirements (REQ-004 — preview before saving).

**Impact**: Priority is used to drive test execution order and risk-based testing decisions. A flat priority distribution provides no signal for triage when implementation is time-constrained.

**Recommendation**: Elevate REQ-010, REQ-011, REQ-NF-005 to P1 (security-critical). Consider P3 for REQ-014/REQ-015 (premium instruction optimization) as they are explicitly marked as premium/deferred features.

---

### PRF-005-B2 — `REQ-002` input parameter list contains a double comma (typo)

**Artifact**: `requirements.md`
**Lens**: Standards Compliance
**Severity**: WARNING

**Evidence**: REQ-002 reads:

> "generate recipes from specified ingredients, dietary restriction values, cuisine value,, calorie target value"

There is a double comma (`,,`) between "cuisine value" and "calorie target value". This is a copy-paste artifact that makes the requirement ambiguous — a reader could interpret this as an empty/unnamed fourth parameter.

**Recommendation**: Fix to: "generate recipes from specified ingredients, dietary restriction values, cuisine value, calorie target value."

---

### PRF-005-B3 — `AT-005-B` covers REQ-012 but trace Matrix A maps REQ-012 only to `AT-005-B`

**Artifact**: `trace.md`, `acceptance-plan.md`
**Lens**: Traceability Completeness
**Severity**: WARNING

**Evidence**: REQ-012 ("All AI-generated recipes saved as private, user-owned regardless of generation path") is mapped exclusively to `AT-005-B` in Matrix A. However, AT-005-B only covers the **in-app generation** path. The **external agent path** (REQ-009, AT-005-D) also produces AI-generated recipes, but no scenario in AT-005-D explicitly verifies that agent-created recipes are saved with `isPrivate: true` and `source: 'agent'`.

ATS-005-D1 verifies the agent can call `GET /agent/recipes` and ATS-005-C5 verifies a recipe is created (201), but neither asserts `isPrivate: true` or `source: 'agent'` on the created record.

**Recommendation**: Add `ATS-005-D6` — "Agent creates recipe → recipe persisted with `isPrivate: true`, `source: 'agent'`, `ownerId` set to authorizing user" — and update Matrix A to map REQ-012 to both `AT-005-B` and `AT-005-D`.

---

### PRF-005-B4 — `UTP-001-A` does not test IV uniqueness across multiple writes

**Artifact**: `unit-test.md`
**Lens**: Missing Test Scenarios
**Severity**: WARNING

**Evidence**: UTP-001-A (upsertProviderConfig) verifies that `crypto.randomBytes(12)` is called and that the encrypted payload is stored. However, no scenario verifies that **two successive writes produce different IVs**. The description states "unique IV per write" as a requirement, but UTS-001-A1 stubs `crypto.randomBytes(12) → Buffer.alloc(12)` (a fixed value), which would not catch a bug where the IV is cached or reused.

**Recommendation**: Add UTS-001-A5 — "Two successive upserts → verify `crypto.randomBytes` called twice with distinct return values; verify stored `encryptedApiKey` values differ."

---

### PRF-005-B5 — `UTP-006-A` (RecipeGenerationService) missing timeout boundary scenario

**Artifact**: `unit-test.md`
**Lens**: Missing Test Scenarios
**Severity**: WARNING

**Evidence**: REQ-003 mandates a 15-second response time. AT-005-B2 covers the acceptance-level timeout scenario (504 `ProviderTimeoutError`). However, the unit test plan for MOD-006 (`RecipeGenerationService`) does not include a scenario where the AI provider adapter call exceeds the timeout threshold and the service correctly propagates `ProviderTimeoutError`. The existing UTP-006 scenarios cover success, provider API error, and no-credentials cases, but not the timeout boundary.

**Recommendation**: Add UTS-006-A4 — "Provider call exceeds 15 s → `ProviderTimeoutError` thrown with `timeoutMs: 15000` in error payload; verify adapter called with timeout signal."

---

### PRF-005-B6 — `AT-005-E` (consent revocation) missing scenario for partial scope revocation

**Artifact**: `acceptance-plan.md`
**Lens**: Missing Test Scenarios
**Severity**: WARNING

**Evidence**: AT-005-E covers full consent revocation (ATS-005-E1 through ATS-005-E3). REQ-IF-002 defines two scopes: `recipes:read` and `recipes:create`. No scenario tests what happens when a user revokes only one scope (e.g., removes `recipes:create` but retains `recipes:read`). The consent model may or may not support partial scope revocation, but this is not specified or tested.

**Recommendation**: Either (a) add ATS-005-E4 — "User revokes `recipes:create` scope only → agent retains `recipes:read` access; `recipes:create` calls return 403" — or (b) add a constraint to REQ-013 clarifying that revocation is all-or-nothing, and add a test verifying that partial scope revocation is rejected.

---

### PRF-005-B7 — `UTP-020-A` (TokenDenylist) does not test denylist persistence across restarts

**Artifact**: `unit-test.md`
**Lens**: Missing Test Scenarios
**Severity**: WARNING

**Evidence**: MOD-020 (`TokenDenylist`) is described as storing revoked token identifiers. UTP-020-A covers add-to-denylist, check-denylist, and TTL expiry scenarios. However, no scenario verifies that the denylist is backed by persistent storage (DB or Redis) rather than in-memory state. If the denylist is in-memory (like the OAuth state store in MOD-008), a server restart would clear all revocations, allowing previously revoked agent tokens to regain access.

**Recommendation**: Add UTS-020-A5 — "Denylist entry persisted to DB; verify `db.query` called with INSERT on `addToDenylist`; verify `db.query` called with SELECT on `isRevoked`." If the implementation is intentionally in-memory with a short TTL, document this explicitly and add a HAZ entry for the restart-clears-denylist risk.

---

### PRF-005-B8 — `requirements.md` Assumptions section references spec `010-subscriptions` which may not exist

**Artifact**: `requirements.md`
**Lens**: Standards Compliance
**Severity**: WARNING

**Evidence**: REQ-CN-003 and the Assumptions section reference "spec `010-subscriptions`" as the source of premium subscription status. The AGENTS.md project structure lists active features `001-sous-chef-recipe-app` and `002-auth0-user-auth`. There is no evidence that `010-subscriptions` is a defined or planned spec in this repository.

**Impact**: If `010-subscriptions` does not exist, REQ-CN-003 and REQ-014/REQ-015 (premium features) have an unresolvable dependency. The premium gate (MOD-016 `PremiumEntitlementGuard`) would have no spec to implement against.

**Recommendation**: Verify that `specs/010-subscriptions/` exists or is planned. If not, either (a) create a stub spec for the subscription dependency, or (b) mark REQ-014, REQ-015, and REQ-CN-003 as `DEFERRED` pending spec 010 and remove them from the current implementation scope.

---

## PASSED Findings

---

### PRF-005-P1 — Requirements specification is complete and well-structured

**Artifact**: `requirements.md`
**Lens**: Standards Compliance

All 26 requirements (15 FR + 5 NF + 3 IF + 3 CN) are present with ID, description, priority, rationale, and verification method. The two-direction architecture (BYOK in-app + external agent platform) is clearly articulated in the overview. Rationale fields are substantive and non-trivial.

---

### PRF-005-P2 — BDD scenario structure is consistently applied across all acceptance test cases

**Artifact**: `acceptance-plan.md`
**Lens**: Standards Compliance

All acceptance test scenarios use the Given/When/Then format. Happy path, negative path, boundary, and inspection strategies are all represented. The ID schema (`AT-005-X` / `ATS-005-X#`) is consistently applied across AT-005-A through AT-005-F (credential management) and the G-series non-functional tests.

---

### PRF-005-P3 — ISO 29119-4 white-box techniques are correctly identified and applied

**Artifact**: `unit-test.md`
**Lens**: Standards Compliance

All six required techniques (Statement & Branch Coverage, Boundary Value Analysis, Equivalence Partitioning, Strict Isolation, Error Guessing, State Transition Testing) are present in the technique table. Each UTP correctly identifies its technique and anchors it to a specific module design view. Technique selection is appropriate to the module under test (e.g., State Transition Testing for MOD-009 AgentConsentManager, Boundary Value Analysis for MOD-001 encryption).

---

### PRF-005-P4 — Security hazard traceability (Matrix H) is thorough

**Artifact**: `trace.md`
**Lens**: Traceability Completeness

Matrix H identifies 7 security hazards (HAZ-001 through HAZ-007) covering plaintext key storage, GCM auth tag tampering, missing encryption key, unauthorized agent access, OAuth CSRF, PKCE code verifier theft, and token replay after revocation. Each hazard links to severity, mitigating REQ-IDs, and verification artifacts. This is above-average security traceability for a feature of this scope.

---

### PRF-005-P5 — Forward and backward traceability matrices are complete with no orphan artifacts

**Artifact**: `trace.md`
**Lens**: Traceability Completeness

Matrix A (REQ → ATP) covers all 26 requirements. Matrix B (ATP → REQ) covers all 7 AT cases with no orphan ATs. The orphan analysis explicitly confirms zero orphan ATs, zero orphan UTPs, and zero orphan REQs. This is a strong traceability posture.

---

### PRF-005-P6 — Encryption implementation is well-specified with correct cryptographic primitives

**Artifact**: `requirements.md`, `unit-test.md`
**Lens**: Standards Compliance

REQ-NF-005 specifies AES-256-GCM. UTP-001-A correctly tests IV uniqueness (per-write `crypto.randomBytes(12)`), GCM auth tag verification (`decipher.setAuthTag`), and `DecryptionError` propagation on auth tag mismatch. The test scenarios align with the cryptographic requirements and HAZ-001/HAZ-002.

---

### PRF-005-P7 — PKCE implementation is correctly specified and tested

**Artifact**: `unit-test.md` (UTP-008-A/B), `acceptance-plan.md` (AT-005-C)
**Lens**: Missing Test Scenarios

The OAuth PKCE flow is tested at both unit level (UTS-008-A2 state mismatch, UTS-008-B code verifier mismatch) and acceptance level (ATS-005-C6 state mismatch, ATS-005-C7 code verifier mismatch). HAZ-005 and HAZ-006 are both covered by executable tests. This is correct security-first test design.

---

### PRF-005-P8 — Premium gate is tested at acceptance level with correct HTTP semantics

**Artifact**: `acceptance-plan.md` (ATS-005-B7)
**Lens**: Coverage Gaps

ATS-005-B7 correctly specifies that a free-tier user receives `402 Upgrade required` and that no AI provider call is made. This verifies both the business rule (premium gate) and the performance implication (no wasted provider API call). The "no AI call made" assertion is a strong negative test.

---

### PRF-005-P9 — Consent revocation denylist check is correctly ordered (denylist before token validation)

**Artifact**: `acceptance-plan.md` (ATS-005-D3), `unit-test.md` (UTP-010-A)
**Lens**: Missing Test Scenarios

ATS-005-D3 specifies that `AgentTokenValidator` checks the denylist first, before token signature validation. This is the correct security ordering — a revoked token with a valid signature must still be rejected. UTP-010-A tests this at the unit level. HAZ-007 (token replay after revocation) is covered.

---

### PRF-005-P10 — Draft TTL and cache invalidation are tested

**Artifact**: `acceptance-plan.md` (ATS-005-B6)
**Lens**: Missing Test Scenarios

ATS-005-B6 covers the draft expiry scenario (user does not act for 10+ minutes → 404 on save attempt). This correctly tests the TTL boundary and ensures the system does not allow stale drafts to be persisted. The scenario is present at acceptance level; a corresponding unit test for the cache TTL logic would strengthen coverage but is not a gap at this review level.

---

### PRF-005-P11 — Instruction optimization accept/reject is non-destructive until accepted

**Artifact**: `acceptance-plan.md` (ATS-005-B9, ATS-005-B10), `unit-test.md` (UTP-014-A)
**Lens**: Missing Test Scenarios

ATS-005-B10 verifies that rejecting optimization returns the original instructions unchanged. UTP-014-A uses State Transition Testing to verify the accept/reject state machine. The non-destructive preview pattern (REQ-015) is correctly implemented in the test design.

---

### PRF-005-P12 — Masked API key response is consistently specified

**Artifact**: `acceptance-plan.md`, `unit-test.md`
**Lens**: Internal Consistency

The masked key format (`****{last4}`) is consistently referenced in ATS-005-A1, ATS-005-F1, UTS-001-A1, and UTS-019-A1. No scenario returns a raw API key in a success response. The `DecryptionError → 500` path (ATS-005-A6, UTS-001-B3) correctly avoids returning the raw key on failure. Internal consistency on this security-sensitive field is strong.

---

## Action Items Summary

| PRF-ID     | Severity | Artifact                             | Action                                                                     |
| ---------- | -------- | ------------------------------------ | -------------------------------------------------------------------------- |
| PRF-005-A1 | CRITICAL | `acceptance-plan.md`                 | Rename second `AT-005-F` section to `AT-005-G`                             |
| PRF-005-A2 | CRITICAL | `trace.md`, `unit-test.md`           | Produce `integration-test.md` or formally defer with risk acknowledgment   |
| PRF-005-A3 | CRITICAL | `requirements.md`, `trace.md`        | Add executable acceptance test for REQ-CN-001 cross-spec schema dependency |
| PRF-005-A4 | CRITICAL | `unit-test.md`, `acceptance-plan.md` | Add OAuth state TTL and concurrent flow unit tests; add ATS-005-C8         |
| PRF-005-B1 | WARNING  | `requirements.md`                    | Differentiate priorities; elevate security-critical FRs to P1              |
| PRF-005-B2 | WARNING  | `requirements.md`                    | Fix double comma typo in REQ-002                                           |
| PRF-005-B3 | WARNING  | `acceptance-plan.md`, `trace.md`     | Add ATS-005-D6 for REQ-012 agent-path ownership verification               |
| PRF-005-B4 | WARNING  | `unit-test.md`                       | Add UTS-001-A5 for IV uniqueness across successive writes                  |
| PRF-005-B5 | WARNING  | `unit-test.md`                       | Add UTS-006-A4 for 15-second timeout boundary in RecipeGenerationService   |
| PRF-005-B6 | WARNING  | `acceptance-plan.md`                 | Add ATS-005-E4 for partial scope revocation or constrain REQ-013           |
| PRF-005-B7 | WARNING  | `unit-test.md`                       | Add UTS-020-A5 for TokenDenylist DB persistence verification               |
| PRF-005-B8 | WARNING  | `requirements.md`                    | Verify spec `010-subscriptions` exists; defer premium features if not      |
