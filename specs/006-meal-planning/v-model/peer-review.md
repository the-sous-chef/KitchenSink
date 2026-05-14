# V-Model Peer Review: Meal Planning (006)

**Feature Branch**: `006-meal-planning`
**Review Date**: 2026-05-09
**Reviewer**: AI Peer Review (speckit.v-model.peer-review)
**Artifacts Reviewed**:

- `specs/006-meal-planning/v-model/requirements.md`
- `specs/006-meal-planning/v-model/acceptance-plan.md`
- `specs/006-meal-planning/v-model/unit-test.md`
- `specs/006-meal-planning/v-model/trace.md`

**Review Standard**: ISO 29119 / V-Model bidirectional traceability
**Finding ID Schema**: `PRF-006-{N}` — sequential, severity-ordered

---

## Summary

| Severity | Count |
| -------- | ----- |
| CRITICAL | 3     |
| WARNING  | 7     |
| PASSED   | 8     |

**Overall Verdict**: ⚠️ **CONDITIONAL PASS** — Three critical defects must be resolved before this artifact set is promoted to implementation. Seven warnings should be addressed or formally accepted with rationale.

---

## CRITICAL Findings

---

### PRF-006-1 · CRITICAL — Phantom Requirement REQ-CN-003 Referenced Across Multiple Artifacts

**Artifacts**: `acceptance-plan.md`, `trace.md`
**Standard**: ISO 29119-4 §6.3 — every test case SHALL trace to a defined requirement

**Evidence**:

- `acceptance-plan.md` line 69: `AT-006-D — Requirement: REQ-006, REQ-CN-003`
- `acceptance-plan.md` line 82: `AT-006-E — Requirement: REQ-007, REQ-CN-003`
- `acceptance-plan.md` line 93: `AT-006-F — Requirement: REQ-008, REQ-CN-003`
- `acceptance-plan.md` line 117: `REQ-CN-003 | Free-tier user | AI features … return 402 | Fault Injection`
- `trace.md` Matrix B: `AT-006-D → REQ-CN-001` (inconsistent — uses CN-001 not CN-003)

**Problem**: `REQ-CN-003` does not exist in `requirements.md`. The Constraint Requirements table defines only `REQ-CN-001` (AI features restricted to premium) and `REQ-CN-002` (meal plan scoped to authenticated user). There is no `REQ-CN-003`.

The intent of `REQ-CN-003` appears to be identical to `REQ-CN-001` (premium gating of AI features). This creates a traceability break: three acceptance test groups (AT-006-D, AT-006-E, AT-006-F) and the acceptance criteria table reference a non-existent requirement ID.

Additionally, `trace.md` Matrix B maps `ATS-006-D2` to `REQ-CN-001` while `acceptance-plan.md` maps the same test to `REQ-CN-003` — an internal inconsistency between artifacts.

**Required Action**: Either (a) add `REQ-CN-003` to `requirements.md` with a distinct definition, or (b) replace all `REQ-CN-003` references in `acceptance-plan.md` with `REQ-CN-001` and reconcile `trace.md` Matrix B accordingly.

---

### PRF-006-2 · CRITICAL — REQ-NF-003 Verification Method is "Test" but No Acceptance Test Exists

**Artifacts**: `requirements.md`, `acceptance-plan.md`, `trace.md`
**Standard**: ISO 29119-4 §6.2 — requirements with verification method "Test" SHALL have corresponding test cases

**Evidence**:

- `requirements.md` line 36: `REQ-NF-003 | … UI components MUST expose accessible name … | P1 | Test`
- `trace.md` Matrix A (NF section): `REQ-NF-003 | *(Test — no AT defined in acceptance-plan.md)* | — | Test | ⬜`
- `acceptance-plan.md`: No AT case references `REQ-NF-003`

**Problem**: `REQ-NF-003` is a P1 requirement with verification method "Test", but no acceptance test case exists for it. The trace matrix acknowledges the gap with a parenthetical note but does not flag it as a defect. Accessibility compliance (`getByRole`/`getByLabel` queryability) is a testable, automatable criterion that must have a corresponding AT.

This is particularly significant because `REQ-NF-003` is a P1 requirement derived from Constitution Principles IV & VII, meaning it is non-negotiable per project standards.

**Required Action**: Add an acceptance test case (e.g., `AT-006-G — Accessibility`) covering `REQ-NF-003`, with BDD scenarios verifying that all meal planning UI components are queryable by role/label in Playwright tests.

---

### PRF-006-3 · CRITICAL — REQ-IF-005 and REQ-IF-006 Verification Method Mismatch

**Artifacts**: `requirements.md`, `trace.md`
**Standard**: ISO 29119-4 §6.2 — verification method SHALL be consistent between requirement definition and traceability matrix

**Evidence**:

- `requirements.md` (Interface Requirements): `REQ-IF-005 | Expose meal plan data consumable by feature 007 | P2 | Test`
- `requirements.md`: `REQ-IF-006 | Expose meal plan data linkable by feature 009 | P2 | Test`
- `trace.md` Matrix A: `REQ-IF-005 | *(Inspection — no AT defined)* | — | Test | ⬜`
- `trace.md` Matrix A: `REQ-IF-006 | *(Inspection — no AT defined)* | — | Test | ⬜`

**Problem**: Both requirements declare verification method "Test" in `requirements.md`, but `trace.md` labels them `*(Inspection — no AT defined)*` in the ATP-ID column while still showing "Test" in the Verification Method column. This is a self-contradictory entry: the matrix simultaneously says "Inspection" (no AT needed) and "Test" (AT required). No acceptance test exists for either.

These are P2 interface requirements for downstream consumers (grocery lists, nutrition planning). If they are truly verifiable only by inspection, the verification method in `requirements.md` must be changed to "Inspection". If they require a test, an AT must be created.

**Required Action**: Resolve the contradiction — either (a) change verification method to "Inspection" in `requirements.md` for both REQ-IF-005 and REQ-IF-006 and update `trace.md` to remove the "Test" column value, or (b) add acceptance test cases covering the public API contract consumed by features 007 and 009.

---

## WARNING Findings

---

### PRF-006-4 · WARNING — Typo in REQ-CN-001 and REQ-009 Descriptions (Double Comma)

**Artifacts**: `requirements.md`
**Standard**: Documentation quality; not a standards violation but introduces ambiguity

**Evidence**:

- `requirements.md` line 54: `REQ-CN-001 | AI meal suggestions, auto-generation,, food waste optimization MUST be restricted…`
- `requirements.md` line 26: `REQ-009 | … all assigned recipes, meal slots,, nutritional summaries displayed.`

**Problem**: Both descriptions contain a double comma (`,,`) which is a copy-paste artifact. While minor, requirements documents are contractual artifacts; typographic errors in SHALL statements can create ambiguity during implementation review.

**Required Action**: Remove the duplicate commas in both requirement descriptions.

---

### PRF-006-5 · WARNING — REQ-009 Verification Method is "Demonstration" — Not Testable

**Artifacts**: `requirements.md`, `acceptance-plan.md`, `trace.md`
**Standard**: ISO 29119-4 §6.2 — demonstration is a valid but weaker verification method; should be justified

**Evidence**:

- `requirements.md` line 26: `REQ-009 | … view a completed meal plan … | P2 | Demonstration`
- `requirements.md` line 28: `REQ-011 | … complete full meal-plan-to-grocery-list workflow … in under 10 minutes | P2 | Demonstration`
- `trace.md` Matrix A: Both REQ-009 and REQ-011 show `*(Demonstration — no AT defined)*`
- `acceptance-plan.md` line 114: `REQ-009 | Plan exists | Full plan displayed with all slots, recipes, and nutritional summaries | Statement Coverage` — this entry in the acceptance criteria table implies a test, contradicting the "Demonstration" method

**Problem**: `acceptance-plan.md` includes `REQ-009` in the "Acceptance Criteria per REQ" table with a technique ("Statement Coverage"), implying it is tested. However, `requirements.md` specifies "Demonstration" and no AT case exists. The acceptance criteria table entry for REQ-009 is an orphan — it references a requirement but has no corresponding AT-006-X case.

**Required Action**: Either (a) add an AT case for REQ-009 (the plan view scenario) and change verification method to "Test", or (b) remove REQ-009 from the acceptance criteria table and document the demonstration procedure separately.

---

### PRF-006-6 · WARNING — AT-006-A References REQ-CN-001 in Backward Traceability but REQ-CN-001 is About AI Gating, Not CRUD Auth

**Artifacts**: `trace.md`
**Standard**: Traceability accuracy — backward trace SHALL correctly identify the requirement satisfied

**Evidence**:

- `trace.md` Matrix B: `AT-006-A | Meal Plan CRUD | REQ-001, REQ-010, REQ-CN-001 | Create plan for configurable date range; 30+ day support; auth enforcement`
- `requirements.md`: `REQ-CN-001` = "AI meal suggestions, auto-generation, food waste optimization MUST be restricted to premium subscribers"
- `requirements.md`: `REQ-CN-002` = "Meal Plan entity MUST be scoped to authenticated user; users MUST NOT access another user's meal plans"

**Problem**: AT-006-A covers Meal Plan CRUD including cross-user access (ATS-006-A5 returns 404 for another user's plan). This scenario satisfies `REQ-CN-002` (data isolation), not `REQ-CN-001` (AI premium gating). The backward trace incorrectly maps AT-006-A to REQ-CN-001 instead of REQ-CN-002.

**Required Action**: Replace `REQ-CN-001` with `REQ-CN-002` in the AT-006-A backward trace entry.

---

### PRF-006-7 · WARNING — Missing Boundary Test for Minimum Date Range (1-Day Plan)

**Artifacts**: `acceptance-plan.md`, `unit-test.md`
**Standard**: ISO 29119-4 Boundary Value Analysis — min-1, min, nominal, max, max+1 boundaries required

**Evidence**:

- `acceptance-plan.md` AT-006-A: Tests 1-week (7 days) and 30+ days — no 1-day plan scenario
- `unit-test.md` UTP-002-B: Tests `dayCount` boundaries at 364, 365, 366 (upper boundary) but no lower boundary (min=1, min-1=0)
- `requirements.md` REQ-001: "configurable date range (e.g., 1 week, 2 weeks, 30+ days)" — 1-day is a valid edge case

**Problem**: The lower boundary of the date range is untested at both acceptance and unit levels. A 1-day plan (dayCount=1) is the minimum valid value; a 0-day plan (startDate=endDate or endDate < startDate) is the min-1 invalid case. Neither is covered. The unit test for `dayCount` only covers the upper boundary (365/366), leaving the lower boundary (0/1) as a gap.

**Required Action**: Add `UTS-002-B4` (dayCount=1 → succeeds) and `UTS-002-B5` (dayCount=0 → throws) to `unit-test.md`. Add an acceptance scenario to AT-006-A for a 1-day plan creation.

---

### PRF-006-8 · WARNING — No Acceptance Test for REQ-010 Update/Edit Scenario

**Artifacts**: `acceptance-plan.md`, `trace.md`
**Standard**: Requirement coverage completeness

**Evidence**:

- `requirements.md` REQ-010: "support meal plans spanning at least 30 days without degradation of functionality / performance"
- `trace.md` Matrix A: `REQ-010 | AT-006-A | Meal Plan CRUD (create 1-week, 30+ days…)`
- `acceptance-plan.md` AT-006-A: ATS-006-A2 creates a 31-day plan (201 returned) — but no scenario tests that operations (assign recipe, view summary) on a 30+ day plan function correctly

**Problem**: ATS-006-A2 only verifies that a 31-day plan can be _created_ (201 with correct slot count). REQ-010 requires that functionality does not degrade for large plans — this implies recipe assignment, nutritional summary retrieval, and plan view must also work on 30+ day plans. No scenario tests these operations against a large plan.

**Required Action**: Add acceptance scenarios to AT-006-B and AT-006-C that operate on a 30+ day plan (e.g., assign recipe to day 28, retrieve weekly summary for week 4).

---

### PRF-006-9 · WARNING — MOD-010 (AISuggestionController) Has Only 1 Unit Test Scenario

**Artifacts**: `unit-test.md`, `trace.md`
**Standard**: ISO 29119-4 §7.4 — controllers SHALL have branch coverage for all guard conditions

**Evidence**:

- `trace.md` Matrix D: `MOD-010 | AISuggestionController | UTP-010-A | UTS-010-A1 (1 total)`
- `unit-test.md` MOD-010: UTP-010-A covers only the premium-guard delegation path
- `trace.md` Matrix D: `MOD-012 | AutoGenerateController | UTP-012-A | UTS-012-A1 (1 total)`
- `trace.md` Matrix D: `MOD-014 | WasteOptimizationController | UTP-014-A | UTS-014-A1 (1 total)`

**Problem**: All three premium-feature controllers (AI Suggestion, Auto-Generate, Waste Optimization) have exactly 1 unit test scenario each. Controllers that sit behind a `PremiumTierGuard` have at least two branches: (1) guard passes → delegate to service, (2) guard rejects → 402. The guard rejection path is tested at the guard level (UTP-021-A) but not at the controller level. If the guard is misconfigured on a specific controller, the controller-level test would not catch it.

**Required Action**: Add a second scenario to UTP-010-A, UTP-012-A, and UTP-014-A verifying that when the `PremiumTierGuard` throws `ForbiddenException`, the controller propagates it without swallowing the error.

---

### PRF-006-10 · WARNING — REQ-011 (10-Minute Workflow) Has No Measurable Acceptance Criterion

**Artifacts**: `requirements.md`, `acceptance-plan.md`
**Standard**: IEEE 830 §4.3 — requirements SHALL be verifiable

**Evidence**:

- `requirements.md` line 28: `REQ-011 | … complete full meal-plan-to-grocery-list workflow … in under 10 minutes | P2 | Demonstration`
- `acceptance-plan.md`: No AT or acceptance criterion defined for REQ-011
- `trace.md` Matrix A: `REQ-011 | *(Demonstration — no AT defined)* | — | Demonstration | ⬜`

**Problem**: REQ-011 is a usability/performance requirement with a specific measurable threshold (10 minutes). "Demonstration" as a verification method is acceptable for usability, but no demonstration procedure, test environment, or pass/fail criterion is documented. Without a defined procedure, this requirement cannot be objectively verified or signed off.

**Required Action**: Document a demonstration procedure for REQ-011 — specify the test environment, user persona, starting state, steps to execute, and the 10-minute pass criterion. Alternatively, if this is a UX metric tracked post-launch, mark it as "Post-Launch Metric" and remove it from the V-Model verification scope.

---

## PASSED Findings

---

### PRF-006-P1 · PASSED — Forward Traceability Coverage for Functional Requirements

All 11 functional requirements (REQ-001 through REQ-011) are mapped to at least one acceptance test case in `trace.md` Matrix A. No functional requirement is left without an ATP-ID (excluding REQ-009 and REQ-011 which use "Demonstration" — addressed in PRF-006-5 and PRF-006-10).

---

### PRF-006-P2 · PASSED — Backward Traceability: No Orphan Acceptance Tests

`trace.md` Matrix B maps all AT cases (AT-006-A through AT-006-F) and all ATS scenarios back to parent requirements. No acceptance test is orphaned (i.e., every AT traces to at least one REQ). The single exception (REQ-CN-001 vs REQ-CN-002 mapping for AT-006-A) is flagged in PRF-006-6.

---

### PRF-006-P3 · PASSED — Unit Test ISO 29119-4 Technique Coverage

`unit-test.md` correctly applies all six mandatory white-box techniques across the 21 testable modules:

- Statement & Branch Coverage (all controller and service modules)
- Boundary Value Analysis (date ranges, TTL, macro aggregation)
- Equivalence Partitioning (meal types, tier enum)
- Strict Isolation (all external dependencies mocked)
- Error Guessing (null returns, malformed AI responses, USDA outage)
- State Transition Testing (circuit breaker CLOSED→OPEN→HALF-OPEN in MOD-017)

Each UTP correctly identifies its technique and anchors it to a named source view.

---

### PRF-006-P4 · PASSED — Hazard Traceability (Matrix H) is Complete and Well-Formed

`trace.md` Matrix H defines 7 hazards (HAZ-001 through HAZ-007) covering IDOR, unauthenticated access, premium bypass, cross-user recipe assignment, AI response parsing failures, USDA outage cascade, and Redis cache failure. Each hazard links to: severity, REQ-IDs, mitigation description, and verification reference (AT or UTP). This is a thorough security and resilience hazard register.

---

### PRF-006-P5 · PASSED — Premium Gating Tested at Multiple Levels

The premium tier restriction (REQ-CN-001) is verified at three independent levels:

1. **Unit**: UTP-021-A (PremiumTierGuard branch coverage), UTP-021-B (equivalence partitioning on tier enum)
2. **Acceptance**: ATS-006-D2 (402 for free-tier AI suggestions), ATS-006-E free-tier scenario, ATS-006-F free-tier scenario
3. **Hazard**: HAZ-003 with fault injection verification

This defense-in-depth approach to premium gating verification is well-structured.

---

### PRF-006-P6 · PASSED — USDA Integration Failure Modes Thoroughly Tested

MOD-017 (UsdaFoodApiAdapter) has 7 unit test scenarios (UTS-017-A1 through A3, UTS-017-B1 through B4) covering the circuit breaker state machine (CLOSED, OPEN, HALF-OPEN transitions) and HTTP error handling. HAZ-006 links the USDA outage hazard to both the circuit breaker unit tests and the cache fallback (UTP-008-B). This is a complete treatment of a critical external dependency failure mode.

---

### PRF-006-P7 · PASSED — BDD Scenario Format Consistently Applied

All acceptance test scenarios in `acceptance-plan.md` follow the Given/When/Then format with concrete, testable values (specific UUIDs, HTTP methods, status codes, response field names). Scenarios are unambiguous and directly executable by a QA engineer or Playwright automation.

---

### PRF-006-P8 · PASSED — Module Design Traceability (Matrix D) is Complete

`trace.md` Matrix D maps all 21 testable modules (MOD-001 through MOD-021; MOD-022 excluded as build-time only) to their UTP cases and UTS scenario counts. Every module has at least one UTP. The cross-cutting module exclusion is documented with rationale. Total scenario count (92 UTS) is consistent with the artifact information header.

---

## Required Actions Summary

| PRF-ID     | Severity | Action Required                                                                                                         | Owner               |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------- |
| PRF-006-1  | CRITICAL | Add REQ-CN-003 to requirements.md OR replace all REQ-CN-003 references with REQ-CN-001; reconcile trace.md Matrix B     | Requirements Author |
| PRF-006-2  | CRITICAL | Add AT-006-G (Accessibility) covering REQ-NF-003 with Playwright role/label scenarios                                   | Test Author         |
| PRF-006-3  | CRITICAL | Resolve REQ-IF-005 / REQ-IF-006 verification method contradiction (Test vs Inspection) in requirements.md and trace.md  | Requirements Author |
| PRF-006-4  | WARNING  | Remove double commas in REQ-CN-001 and REQ-009 descriptions                                                             | Requirements Author |
| PRF-006-5  | WARNING  | Reconcile REQ-009 acceptance criteria table entry with "Demonstration" verification method; add AT or remove from table | Test Author         |
| PRF-006-6  | WARNING  | Replace REQ-CN-001 with REQ-CN-002 in AT-006-A backward trace entry                                                     | Trace Author        |
| PRF-006-7  | WARNING  | Add lower boundary unit tests (dayCount=0, dayCount=1) and 1-day plan acceptance scenario                               | Test Author         |
| PRF-006-8  | WARNING  | Add acceptance scenarios for recipe assignment and summary retrieval on 30+ day plans                                   | Test Author         |
| PRF-006-9  | WARNING  | Add guard-rejection scenario to UTP-010-A, UTP-012-A, UTP-014-A                                                         | Test Author         |
| PRF-006-10 | WARNING  | Document demonstration procedure for REQ-011 or reclassify as post-launch metric                                        | Requirements Author |
