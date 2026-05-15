# Sync-Verify Report — 002-auth0-user-auth

**Run date**: 2026-05-14 (updated post-fix)
**Scope (user-focused)**: Wave 8 deliverables, identity-service `test`/`test:e2e` split, app paths
**Mode**: Fixes applied for C1 and W1. Prior report preserved as `verify-report.prev.md`.

---

## Summary

| Severity | Count                          |
| -------- | ------------------------------ |
| CRITICAL | 0 (1 resolved)                 |
| WARNING  | 1 (1 resolved, 1 acknowledged) |
| PASSED   | 5                              |

---

## RESOLVED

### C1 (resolved) — v-model artifacts referenced stale `apps/web/*` / `apps/mobile/*` paths

**Fix applied**: Bulk `sed` rewrite across:

- `specs/002-auth0-user-auth/v-model/module-design.md`
- `specs/002-auth0-user-auth/v-model/trace.md`
- `specs/002-auth0-user-auth/v-model/unit-test.md`

Replacements:

- `apps/web/` → `packages/apps/sous-chef/web/`
- `apps/mobile/` → `packages/apps/sous-chef/mobile/`

**Verification**: `grep -rnE "(^|[^-/])apps/(web|mobile)/" specs/002-auth0-user-auth/v-model/` → 0 matches.

### W1 (resolved) — `test` vs `test:e2e` split documented

**Fix applied**: Added explicit note under T-082 in `specs/002-auth0-user-auth/tasks.md`:

> **Test split (added 2026-05-14)**: `@kitchensink/identity-service` exposes `npm test` (unit/integration; vitest excludes `tests/e2e/**`) and `npm run test:e2e` (separate `vitest.e2e.config.ts`, requires LocalStack + Postgres via `packages/infra/identity` `local:up`). CI runs only `npm test`; `test:e2e` is run locally or in a future `services:up`-gated CI job.

**Deferred (not blocking)**:

- `v-model/requirements.md` REQ-045..REQ-050 still phrase the CI gate as `npm test`; the new T-082 note is authoritative.
- `.github/workflows/identity-ci.yml` continues to call `npm test`; a future `services:up`-gated `test:e2e` job is the recommended follow-up but not required for this verification pass.

---

## WARNING (acknowledged)

### W2 — Wave 8 deliverables only referenced in tasks.md / v-model/requirements.md

**Drift type**: Forward drift (tasks → spec/plan/product-spec).
**Artifacts**: `.github/workflows/identity-ci.yml`, `packages/infra/identity/docs/auth0-tenant-rollout.md`, `packages/infra/identity/docs/perf-reliability.md`.
**Not referenced in**: `spec.md`, `plan.md`, `product-spec/*`.
**Impact**: Low — implementation/operational artifacts; spec/plan/product-spec stay product-level.
**Action**: None. Flagged for awareness only.

---

## PASSED

- ✅ Wave 8 deliverables exist on disk and are referenced consistently in tasks.md and v-model/requirements.md.
- ✅ `packages/apps/sous-chef/web` and `packages/apps/sous-chef/mobile` paths are consistent in spec.md, plan.md, tasks.md, **and now v-model/\***.
- ✅ All identity workspace CI scripts (`lint`, `typecheck`, `test`) exist and pass after the e2e split.
- ✅ `@kitchensink/identity-service` `npm test` → 14/14 passing (e2e excluded).
- ✅ T-082 documents the `test` / `test:e2e` split.

---

## Status

**Sync-verify pass complete.** No critical path drift remaining. The single open warning (W2) is acknowledged as low-impact and intentionally deferred.

---

## Release Audit Gate (BLOCKED)

> **Updated 2026-05-15 (T21)** — This section records the release audit status after T20 regeneration.

The sync-verify pass above covers artifact path consistency and test/e2e split documentation. It does **not** constitute a release gate.

The V-Model release audit (`v-model/release-audit-report.md`, regenerated 2026-05-15 by T20) reports:

```
226 test scenarios: 27 passed, 0 failed, 0 skipped, 199 untested
Compliance Status: BLOCKED — 199 test scenarios untested
```

**Implementation evidence exists** for T1-T20 across:

- `packages/apps/sous-chef/mobile` (PKCE, JWT trust, secure storage)
- `packages/apps/sous-chef/web` (session hardening, returnTo normalization, refresh endpoint)
- `packages/services/identity` (API alignment and admin/user endpoints)
- `packages/infra/identity` (Lambda authorizer, CDK stack, CI workflows)

**Why verify is still BLOCKED:**

- Only 27 of 226 V-Model scenarios have machine-readable test results ingested (Matrix D unit scenarios from T13-T16).
- T17 E2E tests (14 tests) are unmatched because test names use descriptive `T-074`/`T-075` labels rather than V-Model scenario IDs.
- Matrix A/B/C (validation, system-test, integration-test) scenarios have no ingested results.
- T17 issues remain open: E2E env guards, E2E not wired in CI, authorizer allow-path JWT signature, post-registration 500 instead of 401.

**Required to unblock:**

1. Fix T17 issues documented in `.sisyphus/notepads/002-auth0-remediation/issues.md`.
2. Add V-Model scenario IDs to E2E/system/integration test names.
3. Re-ingest results and rebuild release audit via `build-audit-report.sh`.
4. Confirm 0 untested required scenarios (or all remaining formally waived with waiver IDs).

**Do NOT mark verify or test-run complete until the above steps are done.**
