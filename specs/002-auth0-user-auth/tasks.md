# Tasks: Auth0 User Authentication

**Feature**: `002-auth0-user-auth`
**Generated**: 2026-05-09
**Source**: plan.md + spec.md
**Total Tasks**: 52

---

## Dependency Graph

```
[SETUP] T-001 → T-002 → T-003
   ↓
[US-1: Sign Up + DB Sync] T-010 → T-011 → T-012 → T-013 → T-014
   ↓
[US-2: Login + Session] T-020 → T-021 → T-022 → T-023 → T-024 → T-025
   ↓
[US-3: Logout] T-030 → T-031 → T-032
   ↓
[US-4: Profile Page] T-040 → T-041 → T-042
   ↓
[US-5: Edit Account] T-050 → T-051 → T-052
   ↓
[US-6: Account Deletion] T-060 → T-061 → T-062 → T-063 → T-064
   ↓
[US-7: Social Linking] T-070 → T-071 → T-072
   ↓
[US-8: MFA] T-080 → T-081
   ↓
[ADMIN: Suspension] T-090 → T-091 → T-092
   ↓
[INFRA: Reconciliation] T-100 → T-101 → T-102 → T-103
   ↓
[INFRA: Observability] T-110 → T-111 → T-112
   ↓
[CDK: Infrastructure] T-120 → T-121 → T-122 → T-123 → T-124
   ↓
[TESTS] T-130 → T-131 → T-132 → T-133 → T-134
```

---

## Phase 0 — Setup & Shared Infrastructure

### T-001 · Project scaffolding and shared types

**Priority**: P0 | **Story**: Foundation | **Depends on**: —

- Create `src/auth/types/user.entity.ts` — Drizzle schema for `users` and `accounts` tables (UUIDv4 PK, `auth0Id`, `status`, `subscriptionTier`, timestamps)
- Create `src/auth/types/auth-session.ts` — `AuthSession` interface (`accessToken`, `refreshToken`, `expiresAt`, `userId`)
- Create `src/auth/types/errors.ts` — `AuthError`, `SuspendedUserError` custom error classes with type guards
- Add `drizzle.config.ts` pointing at RDS PostgreSQL 16 connection string from env
- Configure `@nestjs/config` with Zod env schema: `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_AUDIENCE`, `DATABASE_URL`, `SQS_DELETION_QUEUE_URL`, `SQS_DLQ_URL`

**Acceptance**: TypeScript compiles; Drizzle schema generates valid SQL migration; env validation throws on missing vars.

---

### T-002 · Database migrations — users and accounts tables

**Priority**: P0 | **Story**: Foundation | **Depends on**: T-001

- Generate Drizzle migration: `users` table (`id UUID PK DEFAULT gen_random_uuid()`, `auth0Id TEXT UNIQUE NOT NULL`, `displayName TEXT`, `email TEXT NOT NULL`, `avatarUrl TEXT`, `status TEXT DEFAULT 'active'`, `createdAt TIMESTAMPTZ`, `updatedAt TIMESTAMPTZ`)
- Generate Drizzle migration: `accounts` table (`id UUID PK`, `userId UUID FK → users.id ON DELETE CASCADE`, `subscriptionTier TEXT DEFAULT 'free'`, `createdAt TIMESTAMPTZ`, `updatedAt TIMESTAMPTZ`)
- Add `pg_trgm` extension migration for future FTS
- Write migration rollback scripts

**Acceptance**: `drizzle-kit push` succeeds against local PostgreSQL 16; `\d users` and `\d accounts` show correct schema.

---

### T-003 · Observability bootstrap

**Priority**: P0 | **Story**: Foundation | **Depends on**: T-001

- Create `src/auth/observability/logger.ts` — `@aws-lambda-powertools/logger` singleton with service name `auth0-user-auth`
- Create `src/auth/observability/metrics.ts` — CloudWatch embedded metrics setup (namespace `SousChef/Auth`)
- Create `src/auth/observability/tracing.ts` — X-Ray active tracing setup; wrap Lambda handlers with `@tracer.captureLambdaHandler()`
- Configure `@sentry/aws-serverless` init in each Lambda entry point

**Acceptance**: Logger emits structured JSON; Sentry DSN env var validated at startup.

---

## Phase 1 — User Story 1: Sign Up and Database Sync (P1)

### T-010 · Auth0 post-registration Action (webhook handler)

**Priority**: P1 | **Story**: US-1 | **Depends on**: T-001, T-002

- Create `src/auth/webhook/index.ts` — Lambda handler for `POST /v1/auth/webhook` (Auth0 post-registration trigger)
- Validate Auth0 webhook signature (shared secret from env `AUTH0_WEBHOOK_SECRET`)
- Generate UUIDv4 for `userId`
- Insert `users` row: `{ id: userId, auth0Id: event.user.user_id, email: event.user.email, displayName: event.user.name }`
- Insert `accounts` row: `{ id: uuid(), userId, subscriptionTier: 'free' }`
- Implement retry logic: up to 3 attempts with exponential backoff (100ms → 200ms → 400ms) on transient DB errors
- Return `{ userId }` in response body so Auth0 Action can store in `app_metadata`

**Acceptance**: POST with valid Auth0 payload creates User + Account rows; duplicate `auth0Id` returns 409; invalid signature returns 401; DB failure after 3 retries returns 500.

---

### T-011 · Auth0 Action configuration (Auth0 tenant)

**Priority**: P1 | **Story**: US-1 | **Depends on**: T-010

- Document Auth0 Action script that calls the webhook endpoint and stores `userId` in `app_metadata`
- Document Auth0 Action trigger: `post-user-registration`
- Document required Auth0 Action secrets: `WEBHOOK_URL`, `WEBHOOK_SECRET`
- Add `app_metadata.userId` to Auth0 token custom claims via Auth0 Action (so `userId` appears in JWT)

**Acceptance**: Auth0 Action script documented in `docs/auth0-actions/post-registration.js`; custom claim `https://sous-chef.io/userId` present in issued JWTs.

---

### T-012 · Lambda REQUEST authorizer — JWKS verification

**Priority**: P1 | **Story**: US-1 (foundation for all auth) | **Depends on**: T-001, T-003

- Create `src/auth/authorizer/jwks-client.ts` — module-scope `jwks-rsa` client (survives Lambda warm starts); LRU cache with 10-min TTL; `rateLimit: true`
- Create `src/auth/authorizer/token-verifier.ts` — `verifyToken(jwt: string): Promise<JWTPayload>` using `jose`; validates `iss`, `aud`, `exp`; extracts `sub` and custom claim `https://sous-chef.io/userId`
- Create `src/auth/authorizer/context-injector.ts` — builds `$context.authorizer` payload: `{ userId, auth0Id, status, subscriptionTier }`
- Create `src/auth/authorizer/errors.ts` — `AuthError` (→ 401 Deny policy), `SuspendedUserError` (→ 403 Deny policy)
- Create `src/auth/authorizer/index.ts` — Lambda handler: verify token → lookup user status in DB → inject context → return IAM policy (`Allow` or `Deny`)

**Acceptance**: Valid JWT → Allow policy with `userId` in context; expired JWT → Deny 401; suspended user → Deny 403; JWKS fetched once per 10 min (LRU cache hit on second call).

---

### T-013 · Authorizer — suspension enforcement and policy cache

**Priority**: P1 | **Story**: US-1 | **Depends on**: T-012

- Authorizer checks `users.status` from DB on every request (after token verification)
- `status = 'suspended'` → return Deny policy with `context: { reason: 'suspended' }`
- Configure API Gateway policy cache: 5-min TTL (set in CDK stack)
- Document suspension lag: max `token_lifetime + 5 min` before suspended user is blocked

**Acceptance**: Suspend user in DB → within 5 min all new requests return 403; active user → 200.

---

### T-014 · Unit tests — authorizer and webhook handler

**Priority**: P1 | **Story**: US-1 | **Depends on**: T-010, T-012, T-013

- Vitest unit tests for `token-verifier.ts`: valid JWT, expired JWT, wrong audience, wrong issuer
- Vitest unit tests for `context-injector.ts`: all fields present, missing custom claim
- Vitest unit tests for webhook handler: valid payload, duplicate auth0Id, invalid signature, DB retry logic
- Mock `jwks-rsa` client and DB calls with `vi.mock`

**Acceptance**: `npm test` passes; ≥90% branch coverage on authorizer and webhook modules.

---

## Phase 2 — User Story 2: Login and Session Persistence (P1)

### T-020 · Web auth — `@auth0/nextjs-auth0` v4.x route handler

**Priority**: P1 | **Story**: US-2 | **Depends on**: T-001

- Create `packages/apps/sous-chef/web/auth/[...auth0].ts` — `@auth0/nextjs-auth0` catch-all route handler
- Configure `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_AUDIENCE` in Next.js env
- Implement `GET /auth/login` → redirect to Auth0 Universal Login
- Implement `GET /auth/callback` → exchange code for tokens, set httpOnly Secure SameSite=Lax cookie
- Implement `POST /auth/logout` → revoke refresh token, clear cookie, redirect to Auth0 `/v2/logout`
- Implement `GET /auth/session` → return `{ user, accessToken }` or `null`

**Acceptance**: Browser login flow completes; cookie set with `HttpOnly; Secure; SameSite=Lax`; `/auth/session` returns user after login; returns null after logout.

---

### T-021 · Web auth — session hook and provider

**Priority**: P1 | **Story**: US-2 | **Depends on**: T-020

- Create `packages/apps/sous-chef/web/auth/use-session.ts` — client-side hook wrapping `@auth0/nextjs-auth0` `useUser()`; returns `{ user, isLoading, isAuthenticated }`
- Create `packages/apps/sous-chef/web/auth/providers.tsx` — `UserProvider` wrapper from `@auth0/nextjs-auth0`; wrap `_app.tsx` or root layout
- Implement route guard: redirect unauthenticated users to `/auth/login` on protected pages

**Acceptance**: `useSession()` returns user on authenticated pages; unauthenticated access to `/profile` redirects to `/auth/login`.

---

### T-022 · Mobile auth — `react-native-auth0` v5.5 provider

**Priority**: P1 | **Story**: US-2 | **Depends on**: T-001

- Create `packages/apps/sous-chef/mobile/auth/Auth0Provider.tsx` — `Auth0Provider` from `react-native-auth0`; configure `domain` and `clientId` from Expo env
- Create `packages/apps/sous-chef/mobile/auth/use-auth.ts` — hook: `{ isAuthenticated, user, login, logout, getAccessToken }`; uses `authorize()` (PKCE) and `clearSession()`
- Create `packages/apps/sous-chef/mobile/auth/screens/LoginScreen.tsx` — shown automatically when `!isAuthenticated`; calls `login()` on mount
- Store tokens via `expo-secure-store` (handled by `react-native-auth0` v5.5 natively)

**Acceptance**: App launch with no session → LoginScreen shown; after Auth0 login → home screen shown; tokens in Keychain/Keystore (verified via `expo-secure-store` read).

---

### T-023 · Token refresh — web (silent refresh via `@auth0/nextjs-auth0`)

**Priority**: P1 | **Story**: US-2 | **Depends on**: T-020

- Configure `@auth0/nextjs-auth0` to use refresh tokens (`useRefreshTokens: true`)
- Implement NestJS API interceptor (or Next.js middleware) that detects 401 from API Gateway → calls `/auth/session` to refresh → retries original request
- Handle refresh token expiry: clear cookie → redirect to `/auth/login`

**Acceptance**: Access token expires → next API call silently refreshes and succeeds; refresh token expired → user redirected to login.

---

### T-024 · Token refresh — mobile (silent refresh via `react-native-auth0`)

**Priority**: P1 | **Story**: US-2 | **Depends on**: T-022

- Implement Axios/fetch interceptor in mobile app: on 401 → call `getCredentials()` (triggers silent refresh) → retry
- Handle refresh failure: call `clearSession()` → navigate to LoginScreen

**Acceptance**: Background token refresh succeeds without user interaction; expired refresh token → LoginScreen shown.

---

### T-025 · Integration tests — login and session flows

**Priority**: P1 | **Story**: US-2 | **Depends on**: T-020, T-021, T-022, T-023, T-024

- Vitest integration tests for web auth callback handler (mock Auth0 token endpoint)
- Vitest integration tests for mobile `use-auth` hook (mock `react-native-auth0`)
- Playwright E2E: web login flow → profile page accessible → logout → redirected to login

**Acceptance**: All integration tests pass; Playwright E2E login flow completes in CI.

---

## Phase 3 — User Story 3: Logout (P1)

### T-030 · Web logout — token revocation and cookie clear

**Priority**: P1 | **Story**: US-3 | **Depends on**: T-020

- `POST /auth/logout` handler: call Auth0 `/oauth/revoke` with `refresh_token`; clear httpOnly cookie; redirect to Auth0 `/v2/logout?returnTo=<base_url>`
- Handle Auth0 revocation failure gracefully (log error, still clear local cookie)

**Acceptance**: After logout, `/auth/session` returns null; old access token rejected by authorizer within TTL; cookie absent in browser.

---

### T-031 · Mobile logout — token clear and session end

**Priority**: P1 | **Story**: US-3 | **Depends on**: T-022

- `logout()` in `use-auth.ts`: call `clearSession()` (revokes refresh token at Auth0 + clears Keychain/Keystore)
- After logout, `isAuthenticated` → false → LoginScreen shown automatically

**Acceptance**: After `logout()`, `expo-secure-store` has no tokens; LoginScreen displayed; old access token rejected by API.

---

### T-032 · Unit tests — logout flows

**Priority**: P1 | **Story**: US-3 | **Depends on**: T-030, T-031

- Vitest: web logout handler revokes token and clears cookie
- Vitest: mobile `logout()` calls `clearSession()` and updates auth state

**Acceptance**: All tests pass.

---

## Phase 4 — User Story 4: View Profile Page (P1)

### T-040 · API endpoint — `GET /v1/users/me`

**Priority**: P1 | **Story**: US-4 | **Depends on**: T-012, T-002

- Create `src/users/users.controller.ts` — NestJS controller
- `GET /v1/users/me`: extract `userId` from `$context.authorizer.userId` (injected by Lambda authorizer); query `users` table; return `{ id, displayName, email, avatarUrl, createdAt }`
- Return 404 if user not found (should not happen in normal flow; log as anomaly)
- Apply authorizer guard on all `/v1/users/*` routes

**Acceptance**: Authenticated request returns user JSON; unauthenticated request returns 401 (blocked by authorizer).

---

### T-041 · Web profile page UI

**Priority**: P1 | **Story**: US-4 | **Depends on**: T-040, T-021

- Create `packages/apps/sous-chef/web/app/profile/page.tsx` — server component; fetch `/v1/users/me` with access token from session
- Display: display name, email, avatar (or default placeholder), account creation date
- Redirect to `/auth/login` if unauthenticated (middleware guard)

**Acceptance**: Profile page shows correct user data from DB; no avatar → placeholder shown; unauthenticated → redirect.

---

### T-042 · Mobile profile screen UI

**Priority**: P1 | **Story**: US-4 | **Depends on**: T-040, T-022

- Create `packages/apps/sous-chef/mobile/screens/ProfileScreen.tsx` — fetch `/v1/users/me` with Bearer token; display name, email, avatar, creation date
- Show default avatar placeholder when `avatarUrl` is null

**Acceptance**: ProfileScreen shows correct data; default avatar shown when no avatar set.

---

## Phase 5 — User Story 5: Edit Account Details (P2)

### T-050 · API endpoint — `PATCH /v1/users/me`

**Priority**: P2 | **Story**: US-5 | **Depends on**: T-040

- `PATCH /v1/users/me`: accept `{ displayName?, avatarUrl? }`; validate with `class-validator` (displayName non-empty, avatarUrl valid URL or null)
- Update `users` row; return updated user
- Validate avatar: supported formats (JPEG, PNG, WebP), max 5MB (validate Content-Type + Content-Length)

**Acceptance**: Valid PATCH updates DB and returns updated user; empty displayName → 400; invalid avatar format → 400.

---

### T-051 · Web account edit page UI

**Priority**: P2 | **Story**: US-5 | **Depends on**: T-050, T-021

- Create `packages/apps/sous-chef/web/app/account/edit/page.tsx` — form with display name input, avatar upload, email (read-only)
- On submit: `PATCH /v1/users/me`; show success/error toast
- Avatar upload: client-side format/size validation before submit

**Acceptance**: Form submits successfully; display name updated in DB; email field is read-only; invalid inputs show validation errors.

---

### T-052 · Mobile account edit screen UI

**Priority**: P2 | **Story**: US-5 | **Depends on**: T-050, T-022

- Create `packages/apps/sous-chef/mobile/screens/AccountEditScreen.tsx` — display name input, avatar picker (Expo ImagePicker), email read-only
- On save: `PATCH /v1/users/me`; navigate back to ProfileScreen on success

**Acceptance**: Account edit saves to DB; email read-only; avatar picker works on iOS and Android.

---

## Phase 6 — User Story 6: Account Deletion (P2)

### T-060 · API endpoint — `DELETE /v1/users/me`

**Priority**: P2 | **Story**: US-6 | **Depends on**: T-040, T-002

- `DELETE /v1/users/me`: require confirmation header `X-Confirm-Delete: DELETE` (or body `{ confirm: 'DELETE' }`)
- Synchronously delete `users` row (cascades to `accounts` and all user-owned data via FK `ON DELETE CASCADE`)
- Attempt Auth0 Management API `deleteUser(auth0Id)` — if success, done
- If Auth0 deletion fails: enqueue `{ auth0Id, userId, attempt: 1 }` to SQS deletion queue; return 200 (user is logged out)
- Return 400 if confirmation missing

**Acceptance**: DELETE with confirmation → user row deleted; Auth0 deletion attempted; SQS message enqueued on Auth0 failure; missing confirmation → 400.

---

### T-061 · Async deletion — SQS consumer Lambda

**Priority**: P2 | **Story**: US-6 | **Depends on**: T-060

- Create `src/auth/deletion/index.ts` — SQS consumer Lambda; triggered by deletion queue
- Create `src/auth/deletion/auth0-deleter.ts` — calls Auth0 Management API `deleteUser()`
- Create `src/auth/deletion/backoff.ts` — on failure: `changeMessageVisibility` with backoff schedule (30s → 60s → 120s → 240s → 480s based on `attempt` in message body); increment `attempt`; after 5 attempts → let message go to DLQ
- Create `src/auth/deletion/dlq-alarm.ts` — CloudWatch alarm: DLQ `ApproximateNumberOfMessagesVisible > 0` → SNS alert

**Acceptance**: SQS message processed; Auth0 deletion retried with correct backoff delays; after 5 failures → message in DLQ; CloudWatch alarm fires.

---

### T-062 · Web account deletion UI

**Priority**: P2 | **Story**: US-6 | **Depends on**: T-060, T-021

- Create deletion confirmation modal: text input requiring user to type "DELETE"; submit button disabled until input matches
- On confirm: `DELETE /v1/users/me`; on success: call logout → redirect to login page

**Acceptance**: Submit disabled until "DELETE" typed; successful deletion → logged out → login page shown.

---

### T-063 · Mobile account deletion UI

**Priority**: P2 | **Story**: US-6 | **Depends on**: T-060, T-022

- Create deletion confirmation screen with text input requiring "DELETE"; on confirm: `DELETE /v1/users/me`; on success: `clearSession()` → LoginScreen

**Acceptance**: Same as web; works on iOS and Android.

---

### T-064 · Unit tests — deletion flow and SQS consumer

**Priority**: P2 | **Story**: US-6 | **Depends on**: T-060, T-061

- Vitest: DELETE endpoint with/without confirmation header
- Vitest: SQS consumer backoff logic (mock `changeMessageVisibility`); DLQ after 5 attempts
- Vitest: Auth0 deleter success and failure paths

**Acceptance**: All tests pass; backoff schedule verified.

---

## Phase 7 — User Story 7: Social Account Linking (P2)

### T-070 · API endpoints — social identity linking

**Priority**: P2 | **Story**: US-7 | **Depends on**: T-012

- `POST /v1/users/me/identities`: accept `{ provider, accessToken }`; call Auth0 Management API `linkUserAccount()`; return updated identities list
- `DELETE /v1/users/me/identities/:provider`: call Auth0 Management API `unlinkUserAccount()`; return updated identities list
- Validate: cannot unlink last identity (would lock user out)

**Acceptance**: Link Google → Auth0 user has two identities; unlink → one identity; unlink last → 400.

---

### T-071 · Web social linking UI

**Priority**: P2 | **Story**: US-7 | **Depends on**: T-070, T-021

- Account settings page: list linked providers; "Link Google" button; "Unlink" button per provider
- Show error if unlinking last identity

**Acceptance**: Linking and unlinking works; last identity unlink blocked with error message.

---

### T-072 · Mobile social linking UI

**Priority**: P2 | **Story**: US-7 | **Depends on**: T-070, T-022

- Account settings screen: same as web; use `react-native-auth0` for OAuth flow

**Acceptance**: Same as web on iOS and Android.

---

## Phase 8 — User Story 8: MFA (P3)

### T-080 · Web MFA enrollment link

**Priority**: P3 | **Story**: US-8 | **Depends on**: T-021

- Account settings page: "Enable MFA" button → redirect to Auth0 MFA enrollment URL (constructed from `AUTH0_DOMAIN` + `/mfa`)
- "Disable MFA" button → redirect to Auth0 MFA management URL

**Acceptance**: Clicking "Enable MFA" opens Auth0 MFA enrollment; after enrollment, subsequent logins require second factor.

---

### T-081 · Mobile MFA enrollment link

**Priority**: P3 | **Story**: US-8 | **Depends on**: T-022

- Account settings screen: "Enable MFA" → open Auth0 MFA enrollment URL in in-app browser (`expo-web-browser`)

**Acceptance**: MFA enrollment accessible from mobile; TOTP works after enrollment.

---

## Phase 9 — Admin: User Suspension (P2)

### T-090 · API endpoints — suspend and reactivate

**Priority**: P2 | **Story**: Admin | **Depends on**: T-040

- `POST /v1/users/:userId/suspend`: admin-only (check `isAdmin` claim in authorizer context); set `users.status = 'suspended'`; return updated user
- `POST /v1/users/:userId/reactivate`: admin-only; set `users.status = 'active'`; return updated user
- Authorizer already enforces `status = 'suspended'` → 403 (T-013)

**Acceptance**: Suspend user → subsequent requests return 403 within authorizer cache TTL (5 min); reactivate → requests succeed again.

---

### T-091 · Password reset — web

**Priority**: P2 | **Story**: FR-027/FR-028 | **Depends on**: T-020

- Login page: "Forgot Password?" link → redirect to Auth0 password reset flow (`/dbconnections/change_password` or Universal Login forgot-password)
- No backend changes needed (Auth0 handles entirely)

**Acceptance**: "Forgot Password" link visible on login page; clicking it initiates Auth0 password reset email flow.

---

### T-092 · Password reset — mobile

**Priority**: P2 | **Story**: FR-027/FR-028 | **Depends on**: T-022

- LoginScreen: "Forgot Password?" link → open Auth0 password reset URL in `expo-web-browser`

**Acceptance**: Same as web on mobile.

---

## Phase 10 — Reconciliation Job (P2)

### T-100 · Reconciliation Lambda — Auth0 user lister

**Priority**: P2 | **Story**: FR-017 | **Depends on**: T-001, T-003

- Create `src/auth/reconciliation/auth0-lister.ts` — paginated Auth0 Management API user list (100/page, filter `created_at > now - 7 days`); returns `{ user_id, app_metadata }[]`

**Acceptance**: Fetches all Auth0 users created in last 7 days; handles pagination correctly.

---

### T-101 · Reconciliation Lambda — user diff and orphan creator

**Priority**: P2 | **Story**: FR-017 | **Depends on**: T-100, T-002

- Create `src/auth/reconciliation/user-diff.ts` — set difference: Auth0 users NOT IN `users` table (by `auth0Id`)
- Create `src/auth/reconciliation/orphan-creator.ts` — for each orphaned user: create `users` + `accounts` rows; call Auth0 Management API to set `app_metadata.userId`

**Acceptance**: Orphaned Auth0 user → DB record created; `app_metadata.userId` set in Auth0.

---

### T-102 · Reconciliation Lambda — entry point and EventBridge Scheduler

**Priority**: P2 | **Story**: FR-017 | **Depends on**: T-100, T-101

- Create `src/auth/reconciliation/index.ts` — Lambda handler; orchestrates lister → diff → orphan-creator; emits CloudWatch metric `OrphanedUsersReconciled`
- CDK: EventBridge Scheduler rule `cron(0 3 * * ? *)` (03:00 UTC nightly) → Lambda

**Acceptance**: Lambda invoked nightly; orphaned users reconciled; metric emitted.

---

### T-103 · Unit tests — reconciliation

**Priority**: P2 | **Story**: FR-017 | **Depends on**: T-100, T-101, T-102

- Vitest: `user-diff.ts` with mock Auth0 list and DB query
- Vitest: `orphan-creator.ts` creates correct DB rows and calls Auth0 API

**Acceptance**: All tests pass.

---

## Phase 11 — CDK Infrastructure

### T-120 · CDK stack — API Gateway REST API + authorizer

**Priority**: P0 | **Story**: Infrastructure | **Depends on**: T-012

- `aws-cdk-lib` stack: REST API with Lambda REQUEST authorizer (T-012 Lambda)
- Authorizer cache TTL: 300 seconds (5 min)
- All `/v1/*` routes use authorizer
- `/v1/auth/webhook` route: no authorizer (Auth0 signature validation in handler)

**Acceptance**: `cdk synth` succeeds; API Gateway created with authorizer attached.

---

### T-121 · CDK stack — SQS deletion queue + DLQ

**Priority**: P2 | **Story**: Infrastructure | **Depends on**: T-061

- SQS standard queue: `visibilityTimeout = 6 × Lambda timeout (6 × 30s = 180s)`; `retentionPeriod = 14 days`
- DLQ: `maxReceiveCount = 5`; `retentionPeriod = 14 days`
- CloudWatch alarm: DLQ `ApproximateNumberOfMessagesVisible > 0` → SNS topic → email alert
- Lambda event source mapping: deletion queue → deletion Lambda

**Acceptance**: `cdk synth` succeeds; SQS queues created with correct config; alarm configured.

---

### T-122 · CDK stack — EventBridge Scheduler (reconciliation)

**Priority**: P2 | **Story**: Infrastructure | **Depends on**: T-102

- EventBridge Scheduler: `cron(0 3 * * ? *)` → reconciliation Lambda
- IAM role for scheduler with `lambda:InvokeFunction` permission

**Acceptance**: `cdk synth` succeeds; scheduler rule created.

---

### T-123 · CDK stack — Lambda functions and IAM roles

**Priority**: P0 | **Story**: Infrastructure | **Depends on**: T-001

- Lambda functions: authorizer, webhook handler, deletion consumer, reconciliation job
- Runtime: `nodejs22.x`; memory: 256MB (authorizer), 512MB (others)
- IAM roles: least-privilege; authorizer needs `rds-data:ExecuteStatement`; deletion consumer needs `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:ChangeMessageVisibility`
- X-Ray active tracing enabled on all Lambdas
- Sentry DSN and Auth0 credentials via SSM Parameter Store (not env vars in plain text)

**Acceptance**: `cdk synth` succeeds; all Lambdas defined with correct runtimes and IAM.

---

### T-124 · CDK stack — RDS security group and VPC config

**Priority**: P0 | **Story**: Infrastructure | **Depends on**: T-002

- Lambda functions in VPC (same VPC as RDS); security group allows Lambda → RDS on port 5432
- NAT Gateway for Lambda internet access (Auth0 API calls)

**Acceptance**: `cdk synth` succeeds; Lambda can reach RDS and Auth0 endpoints.

---

## Phase 12 — End-to-End Tests

### T-130 · Playwright E2E — web sign up and login

**Priority**: P1 | **Story**: US-1, US-2 | **Depends on**: T-020, T-021, T-040, T-041

- Playwright test: navigate to app → redirected to login → complete Auth0 login (test user) → profile page shows correct data
- Use `getByRole` and `getByLabel` selectors throughout

**Acceptance**: E2E test passes in CI against staging environment.

---

### T-131 · Playwright E2E — web logout

**Priority**: P1 | **Story**: US-3 | **Depends on**: T-030

- Playwright test: login → click logout → redirected to login page → `/auth/session` returns null

**Acceptance**: E2E test passes.

---

### T-132 · Playwright E2E — web profile and account edit

**Priority**: P2 | **Story**: US-4, US-5 | **Depends on**: T-041, T-051

- Playwright test: login → profile page shows data → navigate to edit → change display name → save → profile page shows updated name

**Acceptance**: E2E test passes.

---

### T-133 · Playwright E2E — web account deletion

**Priority**: P2 | **Story**: US-6 | **Depends on**: T-062

- Playwright test: login → account settings → delete account → type "DELETE" → confirm → redirected to login → old credentials rejected

**Acceptance**: E2E test passes; user no longer exists in DB after deletion.

---

### T-134 · Integration tests — authorizer performance

**Priority**: P1 | **Story**: NFR | **Depends on**: T-012, T-013

- Vitest integration test: authorizer cold start < 500ms; warm invocation < 50ms p99 (mock JWKS, mock DB)
- Token refresh < 200ms p99 (mock Auth0 token endpoint)

**Acceptance**: Performance assertions pass in CI.

---

## Summary

| Phase                              | Tasks         | Priority | User Story |
| ---------------------------------- | ------------- | -------- | ---------- |
| Setup                              | T-001 – T-003 | P0       | Foundation |
| US-1: Sign Up + DB Sync            | T-010 – T-014 | P1       | US-1       |
| US-2: Login + Session              | T-020 – T-025 | P1       | US-2       |
| US-3: Logout                       | T-030 – T-032 | P1       | US-3       |
| US-4: Profile Page                 | T-040 – T-042 | P1       | US-4       |
| US-5: Edit Account                 | T-050 – T-052 | P2       | US-5       |
| US-6: Account Deletion             | T-060 – T-064 | P2       | US-6       |
| US-7: Social Linking               | T-070 – T-072 | P2       | US-7       |
| US-8: MFA                          | T-080 – T-081 | P3       | US-8       |
| Admin: Suspension + Password Reset | T-090 – T-092 | P2       | Admin      |
| Reconciliation                     | T-100 – T-103 | P2       | FR-017     |
| CDK Infrastructure                 | T-120 – T-124 | P0/P2    | Infra      |
| E2E Tests                          | T-130 – T-134 | P1/P2    | All        |

**Total: 52 tasks**

### Recommended Implementation Order

1. **P0 Foundation**: T-001 → T-002 → T-003 → T-120 → T-123 → T-124
2. **P1 Core Auth**: T-012 → T-013 → T-010 → T-011 → T-014 → T-020 → T-021 → T-022 → T-023 → T-024 → T-025
3. **P1 Logout + Profile**: T-030 → T-031 → T-032 → T-040 → T-041 → T-042 → T-130 → T-131
4. **P2 Account Management**: T-050 → T-051 → T-052 → T-060 → T-061 → T-062 → T-063 → T-064 → T-121
5. **P2 Social + Admin**: T-070 → T-071 → T-072 → T-090 → T-091 → T-092 → T-100 → T-101 → T-102 → T-103 → T-122
6. **P2 E2E**: T-132 → T-133 → T-134
7. **P3 MFA**: T-080 → T-081
