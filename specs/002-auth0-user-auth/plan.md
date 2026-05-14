# Implementation Plan: Auth0 User Authentication

**Branch**: `002-auth0-user-auth` | **Date**: 2026-05-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-auth0-user-auth/spec.md`

---

## Summary

Auth0-based user authentication for the Sous Chef app across web (Next.js) and mobile (Expo). Users log in via Auth0 (Authorization Code Flow with PKCE on mobile, via `@auth0/nextjs-auth0` v4.x on web). Sessions persist via refresh tokens stored in httpOnly cookies (web) or Keychain/Keystore (mobile). Users are identified by auto-generated UUIDv4 IDs synced to the database on signup via Auth0 post-registration Actions. The system provides profile management, account editing, account deletion (cascade to all user data + Auth0), password reset via Auth0, MFA via Auth0, social account linking, user suspension/reactivation, and API authorization via a REST API Lambda REQUEST authorizer with JWKS caching and context injection. Async deletion handles Auth0 Management API failures via SQS + DLQ. A nightly EventBridge Scheduler job reconciles orphaned Auth0 users.

Key architectural decisions (from research):

- **REST API + Lambda REQUEST authorizer** (not HTTP API JWT authorizer): enables custom claim logic (`status: suspended` → 403), context injection (`userId` into `$context.authorizer`), and suspension enforcement
- **Two-layer JWKS cache**: in-process LRU (10 min TTL) + API Gateway policy cache (5 min TTL)
- **Async Auth0 deletion**: SQS queue with exponential backoff (30s → 60s → 120s → 240s → 480s) and DLQ after 5 attempts
- **Reconciliation**: EventBridge Scheduler (nightly) + Lambda diffs Auth0 users vs DB, creates missing records

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22.x (Lambda runtime)
**Primary Dependencies**: `@auth0/nextjs-auth0` v4.x (web), `react-native-auth0` v5.5 (mobile Expo 53+), `jwks-rsa` (JWT verification), `jose` (JWT verification in Lambda), `@aws-sdk/client-sqs`, `@aws-sdk/client-sqs` (async deletion queue), `@aws-sdk/client-eventbridge`, `@aws-sdk/client-cloudwatch`, `@aws-sdk/client-xray`, `@sentry/aws-serverless` (Lambda error tracking), `@aws-lambda-powertools/logger` (structured logging), CDK v2 (`aws-cdk-lib`)
**Storage**: RDS PostgreSQL 16 via Drizzle ORM (User, Account entities); SQS (async deletion queue + DLQ)
**Testing**: Vitest (unit/integration), Playwright (E2E with `getByRole`/`getByLabel`)
**Target Platform**: AWS Lambda (authorizer + API handlers + reconciliation job); Next.js 15 web app; Expo 53+ mobile app
**Project Type**: Backend auth layer (Lambda/API Gateway) + web/mobile Auth0 SDK integration
**Performance Goals**: Token refresh < 200ms p99; authorizer < 50ms p99 (cached); API Gateway auth 401 latency < 5ms p99
**Constraints**: JWTs are self-contained; revocation only via short token lifetime + short authorizer cache TTL; Auth0 is authoritative for user identity
**Scale/Scope**: 10,000 concurrent authenticated users (SC-007); 1 hour access token lifetime; 30-day refresh token lifetime

---

## Constitution Check

| #   | Principle                                                                                                                          | Status  | Notes                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I   | **Correctness & Type Safety** — strict TS, no `any`, proper error types, ISO dates                                                 | ✅ Pass | `strict: true` throughout; custom error types with type guards; ISO 8601 strings for all date fields                                                     |
| II  | **Readability & JSDoc** — JSDoc on all exports, braces, blank-line rules, named exports                                            | ✅ Pass | All exported symbols carry JSDoc with `@param`/`@returns`/`@throws`; named exports only                                                                  |
| III | **Code Organization & Imports** — aliased imports, `.js` extensions, `utils/`/`lib/`/`dal/` layout, no `helpers/`                  | ✅ Pass | `@shared/*`, `@auth/*` aliases; `dal/` and `services/` layout; no `helpers/`                                                                             |
| IV  | **Testing Discipline** — pyramid ratios, `getByRole`/`getByLabel` only, no `waitForTimeout`, test-plan comments                    | ✅ Pass | >= 70% unit, <= 20% integration, <= 10% E2E; all UI queries via `getByRole`/`getByLabel`; no `data-testid`                                               |
| V   | **Monorepo & Workspace Governance** — workspace registered, shared tooling extended, Turbo tasks declared, per-PR schema isolation | ✅ Pass | New auth workspaces extend `@armoury/typescript`, `@armoury/eslint`, `@armoury/prettier`, `@armoury/vitest`; Turbo tasks declared                        |
| VI  | **Formatting & Tooling** — Prettier/ESLint shared configs, git hooks active, CI gates passing                                      | ✅ Pass | All auth code passes `turbo run typecheck`, `turbo run lint`, `turbo run format:check`                                                                   |
| VII | **Accessibility & UX Consistency** — accessible names, design tokens, domain-grouped components, platform parity                   | ✅ Pass | All auth UI components expose accessible names; status indicators use text+icon, not color alone; design token consumption via `--accent-primary` et al. |

---

## Architecture Overview

### System Context

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Auth0 Tenant                                     │
│  Universal Login (web) ──► Auth0 ──► /authorize ──► callback               │
│  Native Auth Screen (mobile) ─────────────────────────────────────────────► │
│                                                                              │
│  Post-Registration Action ──► Create User + Account in DB                   │
│  Management API ◄── deleteUser(), blockUser(), updateUser()                   │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           AWS API Gateway (REST)                              │
│  /auth/callback ──────────────────────────────────────────────────────────── │
│  /users/{id} ────────────────────────────────────────────────────────────── │
│  /accounts/{id} ──────────────────────────────────────────────────────────── │
│                                                                              │
│  ⚙ Lambda REQUEST Authorizer                                                 │
│    ├─ jwks-rsa: verify JWT signature                                        │
│    ├─ JWKS LRU cache (10 min) + API Gateway policy cache (5 min)            │
│    ├─ Extract claims: userId, auth0Id, email, status, isImpersonating       │
│    ├─ 403 if status === 'suspended'                                          │
│    └─ Inject context: userId, email, status, isImpersonating                │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AWS Lambda Functions                                   │
│                                                                              │
│  auth-callback    ── exchanges Auth0 code for tokens, sets httpOnly cookie   │
│  users-controller ── CRUD on User entity, profile, account edit/delete       │
│  auth-deletion-queue-consumer ── retries Auth0 deletion on SQS failure       │
│  reconciliation-job ── EventBridge Scheduler nightly Lambda                    │
│    └─ Diffs Auth0 users vs DB, creates orphaned records                       │
│                                                                              │
│  ── CloudWatch Logs ── Sentry (error tracking) ── X-Ray (tracing)            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Auth Flows

**Web Login**: User → Next.js `/api/auth/login` → redirect to Auth0 Universal Login → Auth0 `/callback` → exchange code → set httpOnly refresh-token cookie → return access token
**Mobile Login**: App launch → `react-native-auth0` Auth0 SDK → Auth0 native screen → exchange code → store tokens in Keychain/Keystore
**Token Refresh**: Client detects expiry → SDK calls `/oauth/token` → new access token; or NestJS API interceptor calls Auth0 `/oauth/token` server-side for web
**Logout**: Clear local tokens → revoke refresh token at Auth0 revocation endpoint → redirect to Auth0 `/v2/logout`
**Account Deletion**: Confirm with "DELETE" → sync delete User + Account + cascade → async delete Auth0 user via SQS (on failure, DLQ after 5 retries)

### Async Deletion Queue

```
User confirms DELETE
    │
    ├─► DB delete (User + Account + cascade)  ← synchronous; must succeed
    │
    └─► Auth0 Management API delete
          ├─ SUCCESS: done
          └─ FAILURE: enqueue to SQS standard queue
                           │
                           ├─ visibilityTimeout = 6 × Lambda timeout
                           ├─ Lambda consumer retries with backoff
                           │     30s → 60s → 120s → 240s → 480s
                           └─ After 5 attempts → DLQ
                                retentionPeriod = 14 days
                                CloudWatch Alarm → SNS → alert
```

### Reconciliation Algorithm

```
EventBridge Scheduler (nightly, 03:00 UTC)
    │
    ▼
Lambda: fetch Auth0 users (paginated, 100/page, last 7 days)
    │
    ├─ Users with app_metadata.userId → check DB exists
    └─ Users with no app_metadata.userId → always orphaned
    │
    ▼
Set diff: Auth0 users NOT IN DB → create User + Account records
    │
    └─ Update Auth0 app_metadata with canonical userId
```

---

## Data Model

### User Entity

```typescript
interface User {
    id: string; // UUIDv4, auto-generated at signup — canonical ID across all Sous Chef systems
    auth0Id: string; // Auth0 sub claim — used only for Auth0 API calls
    email: string; // synced from Auth0 at registration
    displayName: string;
    avatarUrl: string | null;
    status: 'active' | 'suspended'; // default: 'active'
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
}
```

### Account Entity

```typescript
interface Account {
    id: string; // UUIDv4
    userId: string; // FK to User.id
    subscriptionTier: 'free' | 'premium'; // default: 'free'; managed by feature 010
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
}
```

### AuthSession (client-side only, not a DB entity)

```typescript
interface AuthSession {
    accessToken: string; // JWT
    refreshToken: string; // opaque string
    expiresAt: string; // ISO 8601
    userId: string; // extracted from access token custom claim
}
```

---

## API Contracts

### Web Auth Endpoints

| Method | Path             | Auth     | Description                                       |
| ------ | ---------------- | -------- | ------------------------------------------------- |
| `GET`  | `/auth/login`    | None     | Redirects to Auth0 Universal Login                |
| `GET`  | `/auth/callback` | None     | Handles Auth0 callback, exchanges code for tokens |
| `POST` | `/auth/logout`   | Required | Revokes refresh token, clears cookie              |
| `GET`  | `/auth/session`  | None     | Returns current session info (user or null)       |

### User Management Endpoints

| Method   | Path                      | Auth             | Description                                   |
| -------- | ------------------------- | ---------------- | --------------------------------------------- |
| `GET`    | `/v1/users/me`            | Required         | Get current user profile                      |
| `PATCH`  | `/v1/users/me`            | Required         | Update display name, avatar                   |
| `DELETE` | `/v1/users/me`            | Required         | Delete account (cascade + async Auth0 delete) |
| `POST`   | `/v1/users/me/suspend`    | Required (admin) | Suspend user                                  |
| `POST`   | `/v1/users/me/reactivate` | Required (admin) | Reactivate suspended user                     |

### Account Endpoints

| Method  | Path              | Auth     | Description                                  |
| ------- | ----------------- | -------- | -------------------------------------------- |
| `GET`   | `/v1/accounts/me` | Required | Get account info including subscription tier |
| `PATCH` | `/v1/accounts/me` | Required | Update account details                       |

### Social Linking Endpoints

| Method   | Path                                | Auth     | Description                                         |
| -------- | ----------------------------------- | -------- | --------------------------------------------------- |
| `POST`   | `/v1/users/me/identities`           | Required | Link social provider (POST to Auth0 Management API) |
| `DELETE` | `/v1/users/me/identities/:provider` | Required | Unlink social provider                              |

### Webhook Endpoints

| Method | Path               | Auth      | Description                                    |
| ------ | ------------------ | --------- | ---------------------------------------------- |
| `POST` | `/v1/auth/webhook` | Auth0 sig | Handles Auth0 post-registration action trigger |

---

## Module Structure

```
src/
├── auth/
│   ├── authorizer/
│   │   ├── index.ts              — Lambda handler entry point
│   │   ├── jwks-client.ts        — jwks-rsa client (module scope, survives cold starts)
│   │   ├── token-verifier.ts    — JWT verification with JWKS caching
│   │   ├── context-injector.ts   — builds $context.authorizer payload
│   │   └── errors.ts             — custom errors: AuthError, SuspendedUserError
│   │
│   ├── callback/
│   │   ├── index.ts              — Lambda: /auth/callback handler
│   │   ├── token-exchange.ts     — exchanges Auth0 code for tokens
│   │   └── cookie-setter.ts      — sets httpOnly, Secure, SameSite= Lax cookie
│   │
│   ├── deletion/
│   │   ├── index.ts              — SQS consumer Lambda entry
│   │   ├── auth0-deleter.ts      — calls Auth0 Management API deleteUser()
│   │   ├── backoff.ts            — exponential backoff via changeMessageVisibility
│   │   └── dlq-alarm.ts          — CloudWatch alarm on DLQ depth > 0
│   │
│   ├── reconciliation/
│   │   ├── index.ts              — EventBridge Scheduler Lambda entry
│   │   ├── auth0-lister.ts       — paginated Auth0 user list (last 7 days)
│   │   ├── user-diff.ts          — set difference: Auth0 vs DB
│   │   └── orphan-creator.ts     — creates missing User + Account records
│   │
│   ├── observability/
│   │   ├── logger.ts             — @aws-lambda-powertools/logger setup
│   │   ├── metrics.ts            — CloudWatch embedded metrics (mmdb)
│   │   └── tracing.ts            — X-Ray active tracing setup
│   │
│   └── types/
│       ├── user.entity.ts        — User + Account Drizzle schema
│       ├── auth-session.ts       — AuthSession interface
│       └── errors.ts             — custom error types with type guards

packages/apps/sous-chef/web/
├── auth/
│   ├── [...auth0].ts             — @auth0/nextjs-auth0 route handler
│   ├── use-session.ts             — client-side session hook
│   └── providers.tsx              — SessionProvider wrapper

packages/apps/sous-chef/mobile/
├── auth/
│   ├── Auth0Provider.tsx         — react-native-auth0 provider
│   ├── use-auth.ts                — hook: isAuthenticated, user, login/logout
│   └── screens/
│       └── LoginScreen.tsx        — native Auth0 screen launcher
```

---

## Key Decisions

| Decision                 | Choice                                                      | Rationale                                                                                                |
| ------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Authorizer type          | REST API + Lambda REQUEST                                   | Custom claim logic (suspension 403), context injection (userId), multiple auth methods for impersonation |
| JWT library              | `jwks-rsa` + `jose`                                         | `jwks-rsa` for key fetching with LRU cache; `jose` for fast JWT verification in Lambda                   |
| JWKS cache TTL           | 10 min in-process + 5 min API Gateway                       | Balances freshness (suspension lag = token lifetime + 5 min) vs. cost (fewer JWKS fetches)               |
| Suspension enforcement   | 403 at authorizer, TTL 5 min                                | Self-contained JWTs can't be individually revoked; short TTL minimizes suspension lag                    |
| Mobile token storage     | Keychain (iOS) / Keystore (Android) via `expo-secure-store` | Platform-native secure storage; `react-native-auth0` v5.5 supports it natively                           |
| Web token storage        | httpOnly, Secure, SameSite=Lax cookie                       | XSS-safe; CSRF protection via SameSite; `SameSite=Lax` for cross-origin POST                             |
| Account deletion order   | DB first, then Auth0 async                                  | User data deleted immediately; Auth0 deletion retried via SQS; DLQ alerts if Auth0 fails permanently     |
| Async deletion backoff   | 30s → 60s → 120s → 240s → 480s                              | Exponential; max 5 attempts before DLQ; avoids Auth0 API rate limits                                     |
| Reconciliation cadence   | Nightly (03:00 UTC) via EventBridge Scheduler               | Catches orphaned users from post-reg action timeouts; uses 7-day window to limit API calls               |
| API Gateway REST vs HTTP | REST API                                                    | Required for Lambda REQUEST authorizer with IAM policy output                                            |
| Observability            | CloudWatch + X-Ray + Sentry                                 | Structured logs, distributed traces, centralized error tracking; Sentry for alerting                     |

---

## Open Questions (OQ from spec)

| #    | Question                                                                                   | Decision                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| OQ-1 | Auth0 tenant configuration (applications, API audience, social connections, MFA policies)? | A-002: pre-configured before implementation; not our responsibility                                         |
| OQ-2 | Expo Auth0 SDK version compatibility with Expo 53?                                         | `react-native-auth0` v5.5 confirmed Expo 53 compatible (PR #1147)                                           |
| OQ-3 | Token lifetime?                                                                            | 1 hour access token; 30-day refresh token                                                                   |
| OQ-4 | Impersonation mechanism?                                                                   | Auth0 impersonation or token exchange; audit logs include impersonation flag                                |
| OQ-5 | Concurrent session handling?                                                               | All sessions independent; logout on one device does not affect others unless refresh token revoked globally |
