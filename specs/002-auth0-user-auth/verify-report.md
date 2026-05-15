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

**Verification complete.** No critical drift remaining. The single open warning (W2) is acknowledged as low-impact and intentionally deferred.
