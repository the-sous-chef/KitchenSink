# Implementation Plan: Auth0 User Authentication

**Branch**: `003-auth0-user-auth` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-auth0-user-auth/spec.md`

## Summary

Implement Auth0-based user authentication for Sous Chef across web (Next.js) and mobile (Expo). Core deliverables: a shared REST API + Lambda REQUEST authorizer (satisfying USDA spec FR-035 and Sous Chef FR-045), post-registration sync Action writing User + Account records to Aurora DSQL (PostgreSQL), session persistence via refresh tokens, async Auth0 deletion queue (SQS + DLQ), nightly reconciliation job (EventBridge Scheduler), and full observability stack (structured CloudWatch JSON → Sentry via Lambda forwarder + ADOT distributed tracing).

Authorizer choice: REST API + Lambda REQUEST authorizer (not HTTP API JWT) — required for custom claim enforcement from `app_metadata` (user ID, status), context injection to eliminate downstream DB lookups, and `status: suspended` denial at the authorizer level.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22.x (Lambda runtime)  
**Primary Dependencies**: `@auth0/nextjs-auth0` v4.x (web), `react-native-auth0` v5.5.0 (mobile, Expo 53+ compatible — PR #1147), `expo-secure-store` (mobile token storage), `jwks-rsa` (authorizer), `jose` (JWT verification), `@aws-sdk/client-sqs` (SQS), `@sentry/aws-serverless`, `@aws-lambda-powertools/logger`, CDK v2 (`aws-cdk-lib`)  
**Storage**: Aurora DSQL (PostgreSQL-compatible) — User, Account tables. SQS queues for async deletion. Secrets Manager for Auth0 M2M credentials.  
**Testing**: Vitest (unit + integration), Playwright (browser E2E)  
**Target Platform**: AWS Lambda (Node.js 22.x), Next.js 15 (App Router, web), Expo 53 (mobile), AWS API Gateway REST API  
**Performance Goals**: Authorizer p95 < 50ms (JWKS cached), token refresh transparent (SC-003: 99.9% success), profile page load < 2s (SC-005)  
**Constraints**: API Gateway authorizer result cache TTL 300s; Auth0 Management API rate limit ~2 req/s (Developer plan); Auth0 post-registration action timeout 20s; SQS visibility timeout = 6× Lambda timeout; 2 CWL subscription filters per log group  
**Scale/Scope**: 10,000 concurrent authenticated users (SC-007); Auth0 user set reconciled via 7-day rolling scan window (see research.md §3 — Reconciliation Architecture); 8 user stories, 44 FRs, 17 NFRs (NFR-001–NFR-011 core, NFR-012–NFR-017 observability)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #   | Principle                                                                                                                          | Status  | Notes                                                                                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| I   | **Correctness & Type Safety** — strict TS, no `any`, proper error types, ISO dates                                                 | ✅ Pass | All auth interfaces use strict types. Custom errors: `AuthSessionExpiredError`, `UserNotFoundError`, `AccountDeletionFailedError` with type guards (NFR-009). Dates as ISO 8601 strings (NFR-010).                                                                                                     |
| II  | **Readability & JSDoc** — JSDoc on all exports, braces, blank-line rules, named exports                                            | ✅ Pass | All exported Lambda handlers, CDK constructs, and shared types require JSDoc with `@param`/`@returns`/`@throws` (NFR-002). Named exports only; Next.js `page.tsx` default export is a justified framework exception.                                                                                   |
| III | **Code Organization & Imports** — aliased imports, `.js` extensions, `utils/`/`lib/`/`dal/` layout, no `helpers/`                  | ✅ Pass | Auth Lambda packages use `@auth/*` aliases. DB access in `dal/`. No `helpers/` directories (NFR-003).                                                                                                                                                                                                  |
| IV  | **Testing Discipline** — pyramid ratios, `getByRole`/`getByLabel` only, no `waitForTimeout`, test-plan comments                    | ✅ Pass | ≥70% unit (JWT validation, error types, DB mapping), ≤20% integration (SQS + Lambda), ≤10% E2E (Playwright login flows). All test files open with FR → test mapping comment block (NFR-008).                                                                                                           |
| V   | **Monorepo & Workspace Governance** — workspace registered, shared tooling extended, Turbo tasks declared, per-PR schema isolation | ✅ Pass | New workspaces (`packages/infra/auth-layer`, `packages/apps/web`, `packages/apps/mobile`) registered in root `package.json`. All extend `@armoury/*` shared configs. Per-PR schema isolation: `pr_<number>` schemas for Aurora DSQL (NFR-006).                                                         |
| VI  | **Formatting & Tooling** — Prettier/ESLint shared configs, git hooks active, CI gates passing, `generate:types` runs first         | ✅ Pass | All new workspaces import `@armoury/eslint`, `@armoury/prettier`. `generate:types` (OpenAPI → TS types) declared as Turbo dependency before `test` tasks (NFR-007).                                                                                                                                    |
| VII | **Accessibility & UX Consistency** — accessible names, design tokens, domain-grouped components, platform parity                   | ✅ Pass | Login/signup/profile UI: all interactive elements have accessible names; design tokens for all colors (NFR-011). Auth status indicators use text + icon, never color alone (NFR-005). Platform parity: web (Next.js + Radix + Tailwind v4) and mobile (Expo + Tamagui) same visual language (NFR-004). |

## Project Structure

### Documentation (this feature)

```text
specs/003-auth0-user-auth/
├── plan.md              # This file
├── research.md          # Architecture research (authorizer, queues, tracing, observability)
├── data-model.md        # User, Account, AuthSession entity definitions + DB schema
├── quickstart.md        # Local dev setup (Auth0 tenant, env vars, DB)
├── contracts/           # TypeScript interfaces for all API/service boundaries
│   ├── user.ts          # User + Account entity interfaces
│   ├── auth-session.ts  # AuthSession interface
│   ├── authorizer.ts    # Lambda REQUEST authorizer context + policy types
│   ├── post-reg.ts      # Post-registration action payload types
│   ├── deletion.ts      # Async deletion queue message types
│   └── reconciliation.ts # Reconciliation job result types
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/
├── infra/
│   └── auth-layer/            # CDK stack for auth infrastructure
│       ├── src/
│       │   ├── stacks/
│       │   │   └── AuthLayerStack.ts         # Main CDK stack (authorizer, queues, scheduler)
│       │   ├── constructs/
│       │   │   ├── Auth0Authorizer.ts         # Lambda REQUEST authorizer construct
│       │   │   ├── Auth0DeletionQueue.ts      # SQS + DLQ + alarm construct
│       │   │   └── ReconciliationScheduler.ts # EventBridge Scheduler construct
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── cdk.json
│
├── functions/
│   ├── auth-authorizer/       # Lambda REQUEST authorizer handler
│   │   ├── src/
│   │   │   ├── index.ts       # handler export
│   │   │   ├── lib/
│   │   │   │   ├── verifyToken.ts
│   │   │   │   └── buildPolicy.ts
│   │   │   └── __tests__/
│   │   └── package.json
│   │
│   ├── auth0-post-registration/ # Auth0 Action (deployed to Auth0, not AWS)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── dal/
│   │   │   │   └── userRepository.ts
│   │   │   └── __tests__/
│   │   └── package.json
│   │
│   ├── auth0-deletion-worker/ # SQS consumer — retries Auth0 user deletion
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── lib/
│   │   │   │   └── deleteAuth0User.ts
│   │   │   └── __tests__/
│   │   └── package.json
│   │
│   ├── auth0-reconciliation/  # Nightly reconciliation job
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── lib/
│   │   │   │   ├── fetchAuth0Users.ts
│   │   │   │   └── diffUsers.ts
│   │   │   ├── dal/
│   │   │   │   └── userRepository.ts
│   │   │   └── __tests__/
│   │   └── package.json
│   │
│   └── sentry-log-forwarder/  # CWL subscription filter → Sentry
│       ├── src/
│       │   ├── index.ts
│       │   └── __tests__/
│       └── package.json
│
├── apps/
│   ├── web/                   # Next.js 15 App Router
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   └── callback/page.tsx
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── account/
│   │   │   │   │   ├── edit/page.tsx
│   │   │   │   │   └── delete/page.tsx
│   │   │   │   └── api/auth/[...auth0]/route.ts
│   │   │   ├── auth/
│   │   │   │   ├── lib/
│   │   │   │   │   └── authClient.ts
│   │   │   │   └── components/
│   │   │   │       ├── LogoutButton.tsx
│   │   │   │       └── ProfileCard.tsx
│   │   │   └── middleware.ts  # Auth0 session middleware
│   │   └── package.json
│   │
│   └── mobile/                # Expo 53
│       ├── src/
│       │   ├── auth/
│       │   │   ├── AuthProvider.tsx
│       │   │   ├── lib/
│       │   │   │   └── authSession.ts
│       │   │   └── screens/
│       │   │       ├── LoginScreen.tsx
│       │   │       └── ProfileScreen.tsx
│       │   └── account/
│       │       ├── screens/
│       │       │   ├── EditAccountScreen.tsx
│       │       │   └── DeleteAccountScreen.tsx
│       │       └── components/
│       └── package.json
│
└── shared/
    └── auth-types/            # Shared TypeScript types consumed by all workspaces
        ├── src/
        │   ├── User.ts
        │   ├── Account.ts
        │   ├── AuthSession.ts
        │   ├── errors.ts
        │   └── index.ts
        └── package.json
```

**Structure Decision**: Multi-workspace monorepo. Infrastructure (`packages/infra/auth-layer`) is separated from Lambda functions (`packages/functions/*`) and apps (`packages/apps/*`). Shared types live in `packages/shared/auth-types` to avoid circular dependencies. The Auth0 post-registration Action is a Lambda-equivalent deployed to Auth0's runtime — it lives in `packages/functions/auth0-post-registration` for local development and testing but is deployed via the Auth0 CLI, not CDK.

## Complexity Tracking

| Violation                                               | Why Needed                                                                                                                                | Simpler Alternative Rejected Because                                                                                                                                                   |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6 new workspaces (infra, 4 functions, 2 apps, 1 shared) | Each is independently deployable and has distinct dependencies (CDK vs Lambda vs Next.js vs Expo)                                         | Single workspace would conflate incompatible build targets (CDK synth, Lambda bundle, Next.js build, Expo build) and violate Constitution Principle V's per-workspace governance model |
| REST API Gateway (not HTTP API)                         | Custom claim enforcement (`status: suspended` → 403), context injection, `app_metadata` claims — none possible in HTTP API JWT authorizer | HTTP API JWT authorizer only validates standard OAuth claims, cannot shape IAM policy or inject per-request context                                                                    |
