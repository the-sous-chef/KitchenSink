# Sync-Verify Report — 002-auth0-user-auth

**Run date**: 2026-05-23 (updated after sub-keyed implementation recovery)
**Scope (user-focused)**: Feature 002 sub-keyed Auth0 identity implementation, Wave 2/Wave 3 recovery, identity service/webhook/mobile/infra checks, spec cascade
**Mode**: Direct recovery after Sisyphus-Junior delegation produced repeated no-output timeouts. Prior report preserved as `verify-report.prev.md`.

---

## Summary

| Severity | Count          |
| -------- | -------------- |
| CRITICAL | 0              |
| WARNING  | 2 acknowledged |
| PASSED   | 10             |

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

### W3 — T20 local/dev database smoke not executed in this environment

**Drift type**: Verification dependency.
**Artifacts**: migration 0004, identity-webhooks post-login upsert, identity service `/v1/users/me`, admin search.
**Impact**: Medium — focused tests and CDK synth passed, but no local PostgreSQL 16 database/API stack was available for the full `psql` + curl smoke path.
**Action**: Keep release audit BLOCKED until real DB/API smoke evidence is captured in `.sisyphus/evidence/task-20-*`.

### W4 — Serverless print requires CloudFormation resolver access

**Drift type**: Environment/tooling limitation.
**Artifacts**: `packages/infra/identity/serverless.yml`.
**Impact**: Low — CDK Webhooks stack synthesizes protected `/webhooks/post-login` and `/v1/users/upsert` routes to `handlers/post-login.handler`; `serverless print` could not resolve `cf:` variables offline.
**Action**: Run `npm run print:sls --workspace=@kitchensink/identity-infra` in an AWS-authenticated environment before deployment.

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
- ✅ `@kitchensink/identity-service` `npm run typecheck` passes after auth middleware, resolver, upsert, and admin search recovery.
- ✅ `@kitchensink/identity-service` `npm test` passes with 17/17 focused tests.
- ✅ `@kitchensink/identity-webhooks` `npm run typecheck` and `npm test` pass with 12/12 tests.
- ✅ `@kitchensink/mobile` `npm run typecheck` and `npm test` pass with 35/35 tests.
- ✅ `@kitchensink/identity-infra` `npm run synth` and `npm run typecheck` pass; synthesized templates include protected post-login/upsert routes and no plaintext Auth0 credentials.
- ✅ Feature 002 active spec/data-model/plan language identifies Auth0 `sub` / `users.sub` as the canonical user primary key and marks generated UUID/app_metadata language as superseded.
- ✅ Downstream spec 001, 005, and 010 technical FK/auth references are aligned to `users.sub` / Auth0 `sub`; spec 003 has no active UUID FK matches.
- ✅ V-Model release audit remains explicit: 278 mapped scenarios are tracked as untested/blocked until real execution results are ingested.

---

## Status

**Verification partially complete.** No critical implementation drift remains in the focused Wave 2/Wave 3 checks. Release readiness remains blocked by the unexecuted T20 local/dev DB smoke and Serverless print validation in an AWS-authenticated environment.
