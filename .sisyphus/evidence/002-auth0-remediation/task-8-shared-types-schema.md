# T8 — Shared Auth Types, Database Schema, and Migration Path

**Date:** 2026-05-14  
**Task:** T8 from 002-auth0-remediation plan  
**Status:** Complete

---

## Files Changed

| File | Change |
|------|--------|
| `packages/shared/auth-types/src/schema/accounts.ts` | Added `subscriptionTier`, `createdAt`, `updatedAt` — unified ECS + Lambda column set |
| `packages/shared/auth-types/src/account.ts` | Added `subscriptionTier` to `AccountReadDto` to match unified schema |
| `packages/shared/auth-types/src/error.ts` | **New** — `AuthErrorCode` union + `AuthErrorEnvelope` interface |
| `packages/shared/auth-types/src/index.ts` | Export `error.ts` |
| `packages/services/identity/src/database/schema.ts` | Replaced local table definitions with re-export from `@kitchensink/auth-types/schema` |
| `packages/services/identity/src/database/accounts.schema.ts` | **Deleted** — orphaned duplicate, never exported from `index.ts` |
| `packages/services/identity/package.json` | Added `@kitchensink/auth-types: "*"` dependency; added `db:generate` script |
| `packages/services/identity/drizzle.config.ts` | **New** — Drizzle Kit config pointing at `src/database/schema.ts`, output to `src/database/migrations/` |

---

## Issues Found and Fixed

### 1. Divergent `accounts` Table Between ECS and Lambda
**Before:**  
- `auth-types/schema/accounts.ts` (used by Lambda): `id`, `userId`, `provider`, `providerAccountId` — no timestamps, no subscription tier  
- `identity/src/database/schema.ts` (used by ECS): `id`, `userId`, `subscriptionTier`, `createdAt`, `updatedAt` — no provider columns  
- Both services hit the **same RDS database** but with incompatible column expectations  

**Risk:** Lambda's `ensureUserAccountProfile` would insert rows without `subscriptionTier`; ECS's `getUserMe` would read `subscriptionTier` as `null` (or fail if NOT NULL). ECS's `accounts` table definition was missing `provider`/`providerAccountId` entirely, so any query joining on those columns from ECS would fail at runtime.

**Fix:** Unified `auth-types/schema/accounts.ts` to include all columns: `provider`, `providerAccountId`, `subscriptionTier` (default `'free'`), `createdAt`, `updatedAt`. This is the single source of truth for both surfaces.

### 2. Identity Service Redefined Schema Locally Instead of Importing
**Before:** `identity/src/database/schema.ts` duplicated `users`, `accounts`, `profiles` table definitions inline — diverging silently from `auth-types/schema`.

**Fix:** Replaced with a single re-export:
```ts
export { userStatusEnum, users, accounts, profiles } from '@kitchensink/auth-types/schema';
```
ECS now uses the identical Drizzle table objects as Lambda. Schema drift is structurally impossible.

### 3. Orphaned `accounts.schema.ts`
**Before:** `packages/services/identity/src/database/accounts.schema.ts` existed but was never exported from `database/index.ts` and was never imported by any service code. It imported `users` from `@kitchensink/auth-types/schema` but defined a stale `accounts` table (missing `provider`/`providerAccountId`).

**Fix:** Deleted.

### 4. No Migration Generation Path
**Before:** `drizzle-kit` was in `devDependencies` but no `drizzle.config.ts` existed and no `db:generate` script was defined. There was no way to generate SQL migrations from the schema.

**Fix:** Added `drizzle.config.ts` at the identity service root:
```ts
export default defineConfig({
    dialect: 'postgresql',
    schema: './src/database/schema.ts',
    out: './src/database/migrations',
    casing: 'snake_case',
});
```
Added `"db:generate": "drizzle-kit generate --config drizzle.config.ts"` to `package.json` scripts.

**Migration generation command:**
```bash
npm run db:generate --workspace=packages/services/identity
```
This produces SQL migration files in `packages/services/identity/src/database/migrations/`. No migration files are committed yet — the first run will generate the baseline from the current unified schema.

### 5. No Shared `AuthError` Type
**Before:** `ErrorEnvelope` lived only in `packages/services/identity-webhooks/src/common/error-envelope.ts` — not shared with ECS or consumers.

**Fix:** Added `packages/shared/auth-types/src/error.ts` exporting:
- `AuthErrorCode` — discriminated union of all auth error codes (`UNAUTHORIZED`, `FORBIDDEN`, `TOKEN_EXPIRED`, `TOKEN_INVALID`, `USER_NOT_FOUND`, `USER_SUSPENDED`, `ACCOUNT_NOT_FOUND`, `PROFILE_NOT_FOUND`, `INTERNAL_ERROR`)
- `AuthErrorEnvelope` — `{ code: AuthErrorCode; message: string; requestId: string; cause?: unknown }`

---

## Schema Contract (Final)

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `auth0_sub` | `text` NOT NULL | unique index |
| `email` | `text` NOT NULL | unique lower() index |
| `status` | `user_status` enum | `active` \| `suspended` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` nullable | soft-delete |

### `accounts`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → users | cascade delete |
| `provider` | `text` NOT NULL | e.g. `"auth0"`, `"google-oauth2"` |
| `provider_account_id` | `text` NOT NULL | unique with `provider` |
| `subscription_tier` | `text` NOT NULL | default `"free"` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → users | cascade delete, unique |
| `display_name` | `text` NOT NULL | |
| `avatar_url` | `text` nullable | |
| `bio` | `text` nullable | |
| `updated_at` | `timestamptz` | |

---

## Typecheck Results

```
packages/shared/auth-types     — tsc: PASS (0 errors)
packages/services/identity     — tsc: PASS (0 errors)
packages/services/identity-webhooks — pre-existing test errors (authorizer.test.ts, unrelated to T8)
```

---

## Migration Path

No SQL migration files are committed. The convention is:

1. Schema changes go to `packages/shared/auth-types/src/schema/`
2. Run `npm run db:generate --workspace=packages/services/identity` to produce SQL in `src/database/migrations/`
3. Commit generated SQL alongside schema changes
4. Apply via `drizzle-kit migrate` or direct `psql` in CI/CD

The `accounts` table schema change (adding `provider`, `provider_account_id`, `subscription_tier`, `created_at`, `updated_at`) requires a **non-destructive additive migration** for any existing database. The `provider` and `provider_account_id` columns are `NOT NULL` — a migration must backfill them before adding the constraint, or use a two-phase migration (add nullable → backfill → add NOT NULL).
