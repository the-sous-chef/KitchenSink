# Sync & Verify Report: Recipe Digitization & Family Circles

> Feature: `011-recipe-digitization` | Date: 2026-06-02 | Pre-implement 7-layer scan
> Layers checked: **L1, L2, L3, L4, L7** | Skipped: **L5** | Info-only: **L6**
> Worktree: `/home/brandon/Development/KitchenSink/.worktrees/002-user-auth`

---

## Summary

| Severity     | Count |
| ------------ | ----: |
| CRITICAL     | 1 |
| WARNING      | 6 |
| INFO         | 2 |
| CLEAN        | 6 |

**Verdict:** DRIFT DETECTED

---

## L1 — Research ↔ Product-Spec

| Check | Direction | Verdict | Notes |
| ----- | --------- | ------- | ----- |
| L1.1 | Forward (research → product-spec) | **PASS** | Research themes (OCR+correction differentiator, Circle sharing, bulk queue, persona coverage) are reflected in product spec epics, stories, and FR sections. |
| L1.2 | Backward (product-spec → research) | **PASS** | Product decisions align with research; no contradiction without rationale found. |

**Evidence:** `research.md` competitive landscape and UX patterns surface in `product-spec/product-spec.md` problem statement and user journeys.

---

## L2 — Product-Spec Must Have ↔ spec.md

| Check | Direction | Verdict | Notes |
| ----- | --------- | ------- | ----- |
| L2.1 | Forward (Must Have → spec.md) | **PASS** | Must Have stories **US-001..US-006** exist in `spec.md` with explicit acceptance criteria per story. |
| L2.2 | Backward (spec.md → product-spec) | **PASS** | `spec.md` story set (US-001..US-011) traces completely to product-spec. |

**Constitution alignment:** `analyze-report.md` flags **C1–C4** (test naming conventions, per-PR schema isolation, generate:types ordering). These are tracked as forward-drift warnings, not L2 blockers.

---

## L3 — spec.md ↔ plan.md

| Check | Direction | Verdict | Notes |
| ----- | --------- | ------- | ----- |
| L3.1 | Forward (spec FR/US Must Have → plan) | **PASS** | Plan covers all 6 Must Have stories; FR/NFR coverage matrices present. |
| L3.2 | Backward (plan scope → spec) | **WARNING** | `spec.md` defines **33 FR IDs**; `plan.md` references **23 FR IDs**. Ten FR IDs are not explicitly cited by plan (e.g., FR-023–FR-026 accessibility, FR-018 archive retention). This leaves acceptance-criteria coverage gaps for a11y and archive requirements. |

**Evidence:** `verify-report.md` line 15: "33 FR IDs; plan references 23 FR IDs; 10 spec FR IDs are not explicitly cited by plan."

---

## L4 — plan.md ↔ tasks.md

| Check | Direction | Verdict | Notes |
| ----- | --------- | ------- | ----- |
| L4.1 | Forward (plan → tasks) | **WARNING** | `analyze-report.md` identifies 4 plan↔tasks drift issues: **I1** invitation table naming (`circle_invitations` vs `circle_invites`), **I2** entity terminology divergence, **I3** FR-027 route scope incorrectly maps circle endpoints, **G1** missing Circle deletion audience revert in FR/NFR matrices. |
| L4.2 | Backward (tasks → plan) | **PASS** | Tasks T001..T100 map to plan architectural slices; traceability matrix and dependency graph present. |

**Evidence:** `tasks.md` declares all 100 tasks; dependency graph matches plan phases; task-file paths align with proposed `packages/api/*` and `packages/shared/*` structure.

---

## L5 — tasks.md ↔ Code

> **SKIPPED** per instructions (`implement` phase is `not-started`; no code evidence exists to diff against). The 2026-05-12 verify-report already established the gap. No additional value in repeating an empty diff.

---

## L6 — spec.md ↔ Code (missing-impl audit)

> **INFO only** per instructions.

| Item | Verdict | Notes |
| ---- | ------- | ----- |
| Implementation readiness | **INFO** | `implement` phase is `not-started`. 0/100 tasks complete. No source packages (`digitization-api`, `circles-api`, `digitization-ocr`, `shared-audience`) exist yet. Only T001-level workspace globs and T006-level tsconfig aliases may already be present in root configs. |
| Monorepo apps/X refs | **INFO** | Tasks T057–T062 reference paths under `packages/apps/sous-chef/{web,mobile}/` only. No disallowed `apps/X` references detected. |

---

## L7 — Cross-feature / Cross-link integrity

| Check | Verdict | Severity | Notes |
| ------ | ------- | -------- | ----- |
| Auth provider drift | **FAIL** | **CRITICAL** | `spec.md` line 50 and `plan.md` line 186 declare "**Auth0** bearer token required", but the `002-user-auth` worktree **migrated to Clerk** (commits rename `auth0Id` → `clerkId`, remove Auth0 env vars). Web package uses `@clerk/nextjs`; mobile uses `@clerk/expo`. 011 artifacts must be updated to Clerk auth conventions before implementation. |
| Internal naming drift | **FAIL** | **WARNING** | `circle_invitations` (spec) vs `circle_invites` (plan/tasks) for the same audit/rotation history table. Risks ORM/table mismatch at migration time. |
| Broken markdown link | **FAIL** | **WARNING** | `spec.md` line 53 links to `../010-monetisation/spec.md`; actual sibling directory is `010-subscriptions`. |

**Evidence for CRITICAL:**
- Commit `13808a8`: "rename auth0Id to clerkId"
- Commit `3ab8212`: "remove stale auth0 env vars after clerk migration"
- `packages/apps/sous-chef/web/package.json` depends on `@clerk/nextjs` (no Auth0 SDK)
- `packages/apps/sous-chef/mobile/package.json` depends on `@clerk/expo` (no Auth0 SDK)
- `pre-impl-review.md` still lists "Auth0 bearer middleware" as a design input — this is stale post-migration.

---

## Recommendations

1. **CRITICAL — Before implementation:** Update all 011 auth references (spec.md, plan.md, tasks.md, pre-impl-review.md, v-model requirements) from "Auth0 bearer" to **Clerk** conventions (`@clerk/backend` JWT verification, `clerkId` user identifiers). This is a blocking backward-incompatibility.
2. **HIGH — Before tasks begin:** Canonicalize `circle_invites` as the single table/migration noun and update spec.md accordingly; align FR-027 wording to include circles explicitly or split into route-scope FRs.
3. **HIGH — Before tasks begin:** Add explicit tasks for the 10 missing FR IDs (especially a11y FR-023–FR-026) to restore L3 coverage.
4. **MEDIUM:** Fix broken internal link `../010-monetisation/spec.md` → `../010-subscriptions/spec.md`.
5. **MEDIUM:** Address analyze-report C1–C4 constitution gaps (test naming, traceability headers, per-PR schema, generate:types ordering) in first setup tasks.

---

*Report generated by pre-implement sync-verify scan. Read-only; no code changes made.*
