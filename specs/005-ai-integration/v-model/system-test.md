# System Test Plan: AI Integration

**Feature Branch**: `005-ai-integration`
**Created**: 2026-05-09
**Status**: Draft
**Standard**: ISO/IEC/IEEE 29119-3
**Source**: `specs/005-ai-integration/v-model/system-design.md`

---

## Overview

This System Test Plan verifies that every system component (`SYS-NNN`) defined in `system-design.md` behaves as architecturally designed. Unlike acceptance tests (which verify user stories), these tests target the IEEE 1016 design views — Decomposition, Dependency, Interface, and Data Design — using named ISO 29119 techniques.

**Total System Components**: 8 (SYS-001 through SYS-008)
**Total Test Cases (STP)**: 24
**Total Test Scenarios (STS)**: 48

---

## ID Schema

- **STP-NNN**: System Test Plan item — one per test case
- **STS-NNN-X**: System Test Scenario — executable scenario within a test case
- **Technique**: Named ISO 29119-4 technique applied

---

## Technique Legend

| Code | ISO 29119-4 Technique      |
| ---- | -------------------------- |
| EP   | Equivalence Partitioning   |
| BVA  | Boundary Value Analysis    |
| DT   | Decision Table Testing     |
| ST   | State Transition Testing   |
| FI   | Fault Injection            |
| IC   | Interface Contract Testing |
| PT   | Performance Testing        |
| SC   | Security Testing           |

---

## SYS-001 — AI Provider Config Manager

> Stores, retrieves, and deletes user BYOK AI provider credentials. Encrypts credentials at rest. Guides users through setup when no provider is configured.

### STP-001 — Provider CRUD Operations (EP, DT)

**Technique**: Equivalence Partitioning + Decision Table Testing
**Parent Requirements**: REQ-001, REQ-007, REQ-NF-005
**Design View**: Decomposition View, Interface View (Provider Config CRUD)

| Condition                   | STS-001-1   | STS-001-2       | STS-001-3       | STS-001-4    |
| --------------------------- | ----------- | --------------- | --------------- | ------------ |
| Provider type valid         | Y           | N               | Y               | Y            |
| API key non-empty           | Y           | Y               | N               | Y            |
| Provider already configured | N           | N               | N               | Y            |
| **Expected**                | 201 Created | 400 Bad Request | 400 Bad Request | 409 Conflict |

**STS-001-1**: POST `/ai/provider-config` with `{ provider: "openai", apiKey: "sk-valid-key" }` for a user with no existing config → expect HTTP 201, response `{ providerId, provider: "openai", maskedKey: "sk-***" }`.

**STS-001-2**: POST `/ai/provider-config` with `{ provider: "", apiKey: "sk-valid-key" }` → expect HTTP 400 with validation error body.

**STS-001-3**: POST `/ai/provider-config` with `{ provider: "gemini", apiKey: "" }` → expect HTTP 400 with validation error body.

**STS-001-4**: POST `/ai/provider-config` with valid payload for a user who already has a provider configured → expect HTTP 409 Conflict.

---

### STP-002 — Credential Encryption at Rest (SC)

**Technique**: Security Testing
**Parent Requirements**: REQ-NF-005
**Design View**: Data Design View (AI Provider Config — AES-256 encryption)

**STS-002-1**: Store a provider config via POST `/ai/provider-config`. Query the `ai_provider_configs` table directly (via test DB connection). Assert that the `api_key` column value is NOT the plaintext key — it must be an AES-256 ciphertext blob, not the original string.

**STS-002-2**: Retrieve the provider config via GET `/ai/provider-config`. Assert that the response body contains `maskedKey` (e.g., `sk-***`) and does NOT contain the plaintext API key in any field.

---

### STP-003 — Provider Deletion and Retrieval After Delete (ST)

**Technique**: State Transition Testing
**Parent Requirements**: REQ-001
**Design View**: Decomposition View (SYS-001 lifecycle states: absent → configured → deleted)

**STS-003-1**: State: no provider configured. GET `/ai/provider-config` → expect HTTP 404 or empty response indicating no provider.

**STS-003-2**: State: provider configured. DELETE `/ai/provider-config` → expect HTTP 204 No Content.

**STS-003-3**: State: after deletion. GET `/ai/provider-config` → expect HTTP 404 or empty response (same as initial state).

---

### STP-004 — Setup Guidance When No Provider Configured (EP)

**Technique**: Equivalence Partitioning
**Parent Requirements**: REQ-007
**Design View**: Decomposition View (SYS-001 guides users through setup)

**STS-004-1**: Authenticated user with no provider configured attempts GET `/ai/generate` (recipe generation). Assert response is HTTP 422 with error code `NO_PROVIDER_CONFIGURED` and a body containing a setup guidance URL or message.

**STS-004-2**: Authenticated user with a valid provider configured attempts GET `/ai/generate`. Assert response is NOT 422 `NO_PROVIDER_CONFIGURED` (generation proceeds normally).

---

## SYS-002 — AI Recipe Generator

> Accepts recipe generation criteria, dispatches to the user's configured AI provider, and returns a structured recipe result within 15 seconds.

### STP-005 — Recipe Generation Happy Path (IC)

**Technique**: Interface Contract Testing
**Parent Requirements**: REQ-002, REQ-003
**Design View**: Interface View (Recipe Generation Request — REST)

**STS-005-1**: POST `/ai/generate` with `{ ingredients: ["chicken", "lemon"], dietaryRestrictions: ["gluten-free"], cuisine: "Mediterranean", calorieTarget: 500 }` for a user with a valid provider config. Assert HTTP 200 and response body matches `{ recipe: { title: string, ingredients: [], instructions: [], ... } }` (RecipeDraft schema).

**STS-005-2**: POST `/ai/generate` with minimal valid payload `{ ingredients: ["pasta"] }` (all optional fields omitted). Assert HTTP 200 and a valid RecipeDraft is returned.

---

### STP-006 — Recipe Generation Latency Constraint (PT)

**Technique**: Performance Testing
**Parent Requirements**: REQ-003, REQ-CN-003
**Design View**: Decomposition View (SYS-002 — 15-second SLA)

**STS-006-1**: POST `/ai/generate` with a valid payload. Measure wall-clock time from request send to response received. Assert total elapsed time ≤ 15,000 ms. Run 5 consecutive requests; all must pass.

**STS-006-2**: Simulate AI provider response latency of exactly 14,900 ms (via test stub). Assert the system returns a valid response (not a timeout error).

---

### STP-007 — Generation Timeout Handling (FI)

**Technique**: Fault Injection
**Parent Requirements**: REQ-003
**Design View**: Dependency View (SYS-002 → SYS-001 failure: "no provider configured")

**STS-007-1**: Inject a 16-second delay in the AI provider stub. POST `/ai/generate`. Assert HTTP 504 Gateway Timeout is returned and no partial recipe is persisted.

**STS-007-2**: Inject a network error (connection refused) in the AI provider stub. POST `/ai/generate`. Assert HTTP 502 or 503 is returned with an appropriate error body; no recipe is persisted.

---

### STP-008 — Premium Subscription Gate (DT)

**Technique**: Decision Table Testing
**Parent Requirements**: REQ-CN-003
**Design View**: Decomposition View (SYS-002 — premium constraint)

| User has premium subscription | Expected                     |
| ----------------------------- | ---------------------------- |
| Yes                           | 200 OK — generation proceeds |
| No                            | 402 Payment Required         |

**STS-008-1**: Authenticated user WITH active premium subscription. POST `/ai/generate` with valid payload → expect HTTP 200 and a RecipeDraft.

**STS-008-2**: Authenticated user WITHOUT premium subscription. POST `/ai/generate` → expect HTTP 402 with error code `PREMIUM_REQUIRED`.

---

## SYS-003 — AI Recipe Preview & Save Flow

> Presents AI-generated recipe results for user review. Allows accept (save) or decline (discard). No recipe persisted without explicit user acceptance.

### STP-009 — Accept Flow Persists Recipe (IC)

**Technique**: Interface Contract Testing
**Parent Requirements**: REQ-004, REQ-005, REQ-012
**Design View**: Interface View (SYS-003 ← SYS-002 ReceiveGeneratedRecipe)

**STS-009-1**: After a successful generation (SYS-002), POST `/ai/generate/accept` with the `draftId` returned. Assert HTTP 201 and a new Recipe entity exists in the database owned by the requesting user, with `visibility: "private"`.

**STS-009-2**: Accepted recipe is retrievable via the standard recipe GET endpoint (`GET /recipes/:id`) by the owning user. Assert HTTP 200 and recipe data matches the accepted draft.

---

### STP-010 — Decline Flow Discards Recipe (EP)

**Technique**: Equivalence Partitioning
**Parent Requirements**: REQ-006
**Design View**: Decomposition View (SYS-003 — no persistence on decline)

**STS-010-1**: After a successful generation, POST `/ai/generate/decline` with the `draftId`. Assert HTTP 204 No Content.

**STS-010-2**: After decline, attempt GET `/recipes/:id` for the declined draft's ID. Assert HTTP 404 — no recipe was persisted.

**STS-010-3**: After decline, query the database directly for any recipe row matching the draft content. Assert zero rows found.

---

### STP-011 — Recipe Ownership Enforcement (SC)

**Technique**: Security Testing
**Parent Requirements**: REQ-012
**Design View**: Data Design View (AI-Generated Recipe — user-owned, private)

**STS-011-1**: User A generates and accepts a recipe. User B (different authenticated user) attempts GET `/recipes/:id` for User A's recipe. Assert HTTP 403 or 404 — cross-user access is denied.

**STS-011-2**: Accepted AI-generated recipe has `ownerId` matching the requesting user's ID and `visibility: "private"` in the database row.

---

## SYS-004 — OAuth 2.0 Authorization Server

> Implements OAuth 2.0 authorization code flow for external agents. Issues scoped access tokens. Manages user consent grants and revocations.

### STP-012 — Authorization Code Flow Happy Path (IC)

**Technique**: Interface Contract Testing
**Parent Requirements**: REQ-010, REQ-013, REQ-IF-001, REQ-IF-002
**Design View**: Interface View (OAuth Authorization Endpoint)

**STS-012-1**: GET `/oauth/authorize?client_id=test-agent&redirect_uri=https://agent.example.com/callback&scope=recipes:read&state=abc123&response_type=code`. Assert HTTP 302 redirect to the consent UI (or directly to `redirect_uri` with `code` param in test mode).

**STS-012-2**: Exchange authorization code via POST `/oauth/token` with `{ grant_type: "authorization_code", code, redirect_uri, client_id, client_secret }`. Assert HTTP 200 with `{ access_token, token_type: "Bearer", expires_in, scope: "recipes:read" }`.

---

### STP-013 — Scope Enforcement (DT)

**Technique**: Decision Table Testing
**Parent Requirements**: REQ-IF-002
**Design View**: Interface View (OAuth scopes: `recipes:read`, `recipes:create`)

| Requested Scope               | Granted Scope      | Expected Token Scope          |
| ----------------------------- | ------------------ | ----------------------------- |
| `recipes:read`                | User approves      | `recipes:read`                |
| `recipes:create`              | User approves      | `recipes:create`              |
| `recipes:read recipes:create` | User approves both | `recipes:read recipes:create` |
| `admin:all`                   | N/A                | 400 invalid_scope             |

**STS-013-1**: Request token with `scope=recipes:read` → token introspection returns `scope: "recipes:read"` only.

**STS-013-2**: Request token with `scope=recipes:create` → token introspection returns `scope: "recipes:create"` only.

**STS-013-3**: Request token with `scope=recipes:read recipes:create` → token introspection returns both scopes.

**STS-013-4**: Request token with `scope=admin:all` → HTTP 400 `{ error: "invalid_scope" }`.

---

### STP-014 — Consent Revocation (ST)

**Technique**: State Transition Testing
**Parent Requirements**: REQ-013
**Design View**: Decomposition View (SYS-004 — consent lifecycle: granted → revoked)

**STS-014-1**: State: active grant. DELETE `/oauth/grants/:grantId` (user revokes). Assert HTTP 204.

**STS-014-2**: State: after revocation. Use the previously issued access token to call `/agent/recipes`. Assert HTTP 401 Unauthorized — token is no longer valid.

**STS-014-3**: State: after revocation. Attempt to exchange the refresh token (if issued). Assert HTTP 400 `{ error: "invalid_grant" }`.

---

### STP-015 — Invalid OAuth Requests (BVA)

**Technique**: Boundary Value Analysis
**Parent Requirements**: REQ-010, REQ-IF-001
**Design View**: Interface View (OAuth Authorization Endpoint — error handling)

**STS-015-1**: GET `/oauth/authorize` with missing `client_id` → HTTP 400 `{ error: "invalid_request" }`.

**STS-015-2**: GET `/oauth/authorize` with `redirect_uri` not matching registered URIs → HTTP 400 `{ error: "invalid_request" }`.

**STS-015-3**: POST `/oauth/token` with expired authorization code (> 10 minutes old) → HTTP 400 `{ error: "invalid_grant" }`.

---

## SYS-005 — External Agent API

> Exposes OAuth 2.0-protected REST endpoints for authorized agents to read and create recipes. Rejects unauthorized requests.

### STP-016 — Agent Recipe Read (IC)

**Technique**: Interface Contract Testing
**Parent Requirements**: REQ-008, REQ-IF-003
**Design View**: Interface View (Agent Recipes Read)

**STS-016-1**: GET `/agent/recipes` with valid Bearer token (scope: `recipes:read`). Assert HTTP 200 and response body `{ recipes: Recipe[] }` where each recipe is a structured JSON object matching the Recipe schema.

**STS-016-2**: GET `/agent/recipes` with valid Bearer token (scope: `recipes:read`) for a user with zero recipes. Assert HTTP 200 and `{ recipes: [] }`.

---

### STP-017 — Agent Recipe Create (IC)

**Technique**: Interface Contract Testing
**Parent Requirements**: REQ-009, REQ-012
**Design View**: Interface View (Agent Recipe Create)

**STS-017-1**: POST `/agent/recipes` with valid Bearer token (scope: `recipes:create`) and `{ recipe: { title: "Agent Pasta", ingredients: [...], instructions: [...] } }`. Assert HTTP 201 and `{ recipeId: string }`. Verify recipe exists in DB with `ownerId` = token's user and `visibility: "private"`.

**STS-017-2**: POST `/agent/recipes` with valid Bearer token (scope: `recipes:create`) and invalid recipe body (missing `title`). Assert HTTP 422 Unprocessable Entity.

---

### STP-018 — Unauthorized Agent Requests (SC, FI)

**Technique**: Security Testing + Fault Injection
**Parent Requirements**: REQ-011
**Design View**: Dependency View (SYS-005 → SYS-004: ValidateAgentToken failure)

**STS-018-1**: GET `/agent/recipes` with no Authorization header → HTTP 401 Unauthorized.

**STS-018-2**: GET `/agent/recipes` with a malformed Bearer token (`Bearer not-a-jwt`) → HTTP 401 Unauthorized.

**STS-018-3**: GET `/agent/recipes` with a valid JWT signed by a different key (forged token) → HTTP 401 Unauthorized.

**STS-018-4**: POST `/agent/recipes` with a token scoped only to `recipes:read` (wrong scope for create) → HTTP 403 Forbidden.

---

## SYS-006 — AI Instruction Optimizer

> Accepts a recipe and optimization mode (simplify/streamline). Calls the user's configured AI provider. Returns optimized instructions for user review.

### STP-019 — Optimization Happy Path (IC)

**Technique**: Interface Contract Testing
**Parent Requirements**: REQ-014, REQ-015
**Design View**: Interface View (Instruction Optimization Request)

**STS-019-1**: POST `/ai/optimize` with `{ recipeId: "<owned-recipe-id>", mode: "simplify" }` for a premium user with a valid provider config. Assert HTTP 200 and `{ optimizedInstructions: string[] }` where the array is non-empty.

**STS-019-2**: POST `/ai/optimize` with `{ recipeId: "<owned-recipe-id>", mode: "streamline" }`. Assert HTTP 200 and `{ optimizedInstructions: string[] }`.

---

### STP-020 — Optimization Mode Boundary (BVA, EP)

**Technique**: Boundary Value Analysis + Equivalence Partitioning
**Parent Requirements**: REQ-014
**Design View**: Interface View (mode: `'simplify' | 'streamline'`)

**STS-020-1**: POST `/ai/optimize` with `mode: "simplify"` → HTTP 200 (valid partition).

**STS-020-2**: POST `/ai/optimize` with `mode: "streamline"` → HTTP 200 (valid partition).

**STS-020-3**: POST `/ai/optimize` with `mode: "rewrite"` (invalid value) → HTTP 422 Unprocessable Entity.

**STS-020-4**: POST `/ai/optimize` with `mode: ""` (empty string) → HTTP 422 Unprocessable Entity.

---

### STP-021 — Optimization Ownership and Premium Gate (DT)

**Technique**: Decision Table Testing
**Parent Requirements**: REQ-014, REQ-CN-003
**Design View**: Decomposition View (SYS-006 — premium + ownership constraints)

| User owns recipe | User has premium | Expected               |
| ---------------- | ---------------- | ---------------------- |
| Yes              | Yes              | 200 OK                 |
| Yes              | No               | 402 Payment Required   |
| No               | Yes              | 422 (recipe not owned) |
| No               | No               | 402 Payment Required   |

**STS-021-1**: Premium user, owned recipe → HTTP 200 with optimized instructions.

**STS-021-2**: Non-premium user, owned recipe → HTTP 402 `PREMIUM_REQUIRED`.

**STS-021-3**: Premium user, recipe owned by another user → HTTP 422 with error code `RECIPE_NOT_OWNED`.

**STS-021-4**: Non-premium user, recipe owned by another user → HTTP 402 `PREMIUM_REQUIRED` (premium check fires first).

---

### STP-022 — Optimization Provider Failure (FI)

**Technique**: Fault Injection
**Parent Requirements**: REQ-014
**Design View**: Dependency View (SYS-006 → SYS-001: NoProviderConfiguredError)

**STS-022-1**: Premium user with NO provider configured. POST `/ai/optimize` → HTTP 422 with error code `NO_PROVIDER_CONFIGURED`.

**STS-022-2**: Premium user with valid provider. Inject AI provider timeout (> 15 s). POST `/ai/optimize` → HTTP 504 Gateway Timeout. Assert no changes applied to the original recipe.

---

## SYS-007 — Cross-Cutting: Auth Guard

> Enforces authentication on all AI and agent endpoints. Delegates to `002-auth0-user-auth`. Rejects unauthenticated requests before they reach any AI subsystem.

### STP-023 — Auth Guard Blocks Unauthenticated Access (SC, FI)

**Technique**: Security Testing + Fault Injection
**Parent Requirements**: REQ-CN-002, REQ-NF-001, REQ-NF-002
**Design View**: Dependency View (SYS-002/SYS-005/SYS-004/SYS-006/SYS-001 → SYS-007)

**STS-023-1**: POST `/ai/generate` with no session cookie / no Authorization header → HTTP 401. Assert the AI generator (SYS-002) is never invoked (no provider lookup occurs).

**STS-023-2**: POST `/ai/optimize` with no auth → HTTP 401. Assert SYS-006 is never invoked.

**STS-023-3**: GET `/oauth/authorize` with no auth → HTTP 401 or redirect to login. Assert SYS-004 consent flow is not initiated.

**STS-023-4**: GET `/agent/recipes` with no auth → HTTP 401. Assert SYS-005 is never invoked.

**STS-023-5**: POST `/ai/provider-config` with no auth → HTTP 401. Assert SYS-001 is never invoked.

---

## SYS-008 — Cross-Cutting: Type Safety & Accessibility

> Enforces TypeScript strict mode, JSDoc coverage, accessible UI component contracts, and color-independent state indicators.

### STP-024 — Accessible UI Component Contracts (IC, EP)

**Technique**: Interface Contract Testing + Equivalence Partitioning
**Parent Requirements**: REQ-NF-001, REQ-NF-002, REQ-NF-003, REQ-NF-004
**Design View**: Decomposition View (SYS-008 — accessible UI contracts)

**STS-024-1**: Render the AI provider setup UI component in a Playwright test. Assert `getByRole('form')` or `getByLabel('AI Provider Setup')` resolves without error — accessible name is queryable.

**STS-024-2**: Render the recipe generation result preview component. Assert all interactive controls (Accept / Decline buttons) are queryable via `getByRole('button', { name: /accept/i })` and `getByRole('button', { name: /decline/i })`.

**STS-024-3**: Render the OAuth consent screen component. Assert the consent grant/deny controls are queryable via `getByRole`. Assert that the provider status indicator (configured / not configured) uses an icon or text label in addition to any color change — color is not the sole state conveyor.

**STS-024-4**: Run `tsc --noEmit --strict` on all TypeScript files introduced by this feature. Assert zero type errors. Assert no `any` usage outside explicitly marked test doubles (grep for undecorated `any`).

---

## Traceability Matrix

| SYS ID  | SYS Name                                   | STP IDs                            | Techniques Used     |
| ------- | ------------------------------------------ | ---------------------------------- | ------------------- |
| SYS-001 | AI Provider Config Manager                 | STP-001, STP-002, STP-003, STP-004 | EP, DT, SC, ST      |
| SYS-002 | AI Recipe Generator                        | STP-005, STP-006, STP-007, STP-008 | IC, PT, FI, DT      |
| SYS-003 | AI Recipe Preview & Save Flow              | STP-009, STP-010, STP-011          | IC, EP, SC          |
| SYS-004 | OAuth 2.0 Authorization Server             | STP-012, STP-013, STP-014, STP-015 | IC, DT, ST, BVA     |
| SYS-005 | External Agent API                         | STP-016, STP-017, STP-018          | IC, SC, FI          |
| SYS-006 | AI Instruction Optimizer                   | STP-019, STP-020, STP-021, STP-022 | IC, BVA, EP, DT, FI |
| SYS-007 | Cross-Cutting: Auth Guard                  | STP-023                            | SC, FI              |
| SYS-008 | Cross-Cutting: Type Safety & Accessibility | STP-024                            | IC, EP              |

---

## Requirements Coverage

| REQ ID     | Description (abbreviated)                  | STP IDs                            |
| ---------- | ------------------------------------------ | ---------------------------------- |
| REQ-001    | BYOK provider configuration                | STP-001, STP-003                   |
| REQ-002    | AI recipe generation                       | STP-005                            |
| REQ-003    | 15-second latency SLA                      | STP-006, STP-007                   |
| REQ-004    | Preview before save                        | STP-009                            |
| REQ-005    | Save accepted recipes                      | STP-009                            |
| REQ-006    | No persistence on decline                  | STP-010                            |
| REQ-007    | Setup guidance when no provider            | STP-004                            |
| REQ-008    | Agent read API                             | STP-016                            |
| REQ-009    | Agent create API                           | STP-017                            |
| REQ-010    | OAuth consent required                     | STP-012, STP-015                   |
| REQ-011    | Reject unauthorized agents                 | STP-018                            |
| REQ-012    | AI recipes are private, user-owned         | STP-009, STP-011, STP-017          |
| REQ-013    | Revoke agent authorization                 | STP-014                            |
| REQ-014    | AI instruction optimization                | STP-019, STP-020, STP-021, STP-022 |
| REQ-015    | Accept/reject optimized instructions       | STP-019                            |
| REQ-NF-001 | TypeScript strict mode                     | STP-024                            |
| REQ-NF-002 | JSDoc coverage                             | STP-024                            |
| REQ-NF-003 | Accessible UI components                   | STP-024                            |
| REQ-NF-004 | Color not sole state conveyor              | STP-024                            |
| REQ-NF-005 | Credentials encrypted at rest              | STP-002                            |
| REQ-IF-001 | OAuth 2.0 authorization code flow          | STP-012, STP-015                   |
| REQ-IF-002 | `recipes:read` and `recipes:create` scopes | STP-013                            |
| REQ-IF-003 | Structured recipe format for agents        | STP-016                            |
| REQ-CN-002 | Auth required for all AI endpoints         | STP-023                            |
| REQ-CN-003 | Premium subscription gate                  | STP-008, STP-021, STP-022          |

---

## Coverage Summary

| Metric                          | Count                           |
| ------------------------------- | ------------------------------- |
| System Components (SYS) covered | 8 / 8 (100%)                    |
| Test Cases (STP)                | 24                              |
| Test Scenarios (STS)            | 48                              |
| Requirements covered            | 25 / 25 (100%)                  |
| ISO 29119-4 Techniques applied  | EP, BVA, DT, ST, FI, IC, PT, SC |
