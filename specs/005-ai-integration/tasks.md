# Tasks: AI Integration (Feature 005)

**Feature**: `005-ai-integration`
**Generated**: 2026-05-09
**Last updated**: 2026-05-10
**Source artifacts**: plan.md, spec.md
**Total tasks**: 50

---

## Dependency Graph

```
Phase 5A (Foundation)
  T-001 → T-002 → T-003 → T-004 → T-005
                                      ↓
Phase 5B (Core Generation)
  T-006 → T-007 → T-008 → T-009 → T-010 → T-011 → T-012 → T-013
                                                              ↓
Phase 5C (Extended Generation)
  T-014 → T-015 → T-016 → T-017 → T-018
                                      ↓
Phase 5D (External Agent / MCP)
  T-019 → T-020 → T-021 → T-022 → T-023 → T-024 → T-025
                                                      ↓
Phase 5E (Compliance & Polish)
  T-026 → T-027 → T-028 → T-029 → T-030 → T-031 → T-032 → T-033 → T-034 → T-035 → T-036 → T-037 → T-038 → T-039 → T-040 → T-041 → T-042
                                                      ↓
Phase 5F (Mobile Parity)
  T-043 → T-044 → T-045 → T-046 → T-047 → T-048 → T-049 → T-050
```

---

## Phase 5A: Foundation (Weeks 1–2)

### US-1 / US-2 — BYOK Key Management + PII Sanitization Infrastructure

#### T-001 · Drizzle schema definitions for AI tables

- **Status**: pending
- **Priority**: P0 (blocks all other tasks)
- **Files**:
    - `src/db/schema/ai-generation-records.schema.ts`
    - `src/db/schema/prompt-templates.schema.ts`
    - `src/db/schema/user-byok-keys.schema.ts`
    - `src/db/schema/mcp-oauth-consents.schema.ts`
- **Acceptance**: All 4 Drizzle table definitions compile with `strict: true`; types exported from `src/db/schema/index.ts`
- **Notes**: `user_byok_keys.secret_arn` stores only the ARN — never the raw key. `ai_generation_records.source_prompt_hash` is SHA-256 of sanitized prompt.

#### T-002 · Drizzle migration `005_ai_integration`

- **Status**: pending
- **Priority**: P0
- **Depends on**: T-001
- **Files**:
    - `src/db/migrations/005_ai_integration.ts`
- **Acceptance**: `npm run db:migrate` creates all 4 tables + indexes without error; `down()` drops them cleanly
- **Notes**: Creates `ai_generation_records`, `prompt_templates`, `user_byok_keys`, `mcp_oauth_consents`. Indexes: `idx_ai_gen_records_user_id`, `idx_ai_gen_records_job_id`, `idx_ai_gen_records_status`, `idx_prompt_templates_key_version`, `idx_user_byok_keys_user_provider`.

#### T-003 · `ByokModule` scaffold + NestJS module wiring

- **Status**: pending
- **Priority**: P0
- **Depends on**: T-001
- **Files**:
    - `src/ai/byok/byok.module.ts`
    - `src/ai/byok/byok.service.ts`
    - `src/ai/byok/byok.controller.ts`
    - `src/ai/byok/dto/store-byok-key.dto.ts`
    - `src/ai/byok/dto/byok-key-meta.dto.ts`
- **Acceptance**: Module registers in `AppModule`; `ByokService` injectable; controller routes registered at `/ai/byok/keys`

#### T-004 · `ByokService` — AWS Secrets Manager CRUD

- **Status**: pending
- **Priority**: P0
- **Depends on**: T-003
- **Files**:
    - `src/ai/byok/byok.service.ts`
- **Acceptance**:
    - `storeKey()` writes raw key to Secrets Manager under `byok/{userId}/{provider}`, stores ARN in `user_byok_keys`, returns ARN
    - `deleteKey()` deletes from Secrets Manager + `user_byok_keys`
    - `getKey()` fetches raw key from Secrets Manager (never from Postgres)
    - `listKeys()` returns metadata only (no raw keys)
    - Raw key never written to Postgres (AC-2)
- **Notes**: Use `@aws-sdk/client-secrets-manager`. Circuit breaker on `getKey()` (timeout 3000ms, threshold 5, resetTimeout 30000ms).

#### T-005 · `ByokService` — API key format validation + provider test call

- **Status**: pending
- **Priority**: P0
- **Depends on**: T-004
- **Files**:
    - `src/ai/byok/byok.service.ts`
    - `src/ai/byok/byok.validator.ts`
- **Acceptance**:
    - `validateKey()` checks prefix: `sk-` for OpenAI, `sk-ant` for Anthropic, Gemini format
    - Makes minimal test API call (`models.list`) before storing
    - Returns `400` with descriptive error if key is invalid format or test call fails

#### T-006 · `POST /ai/byok/keys` endpoint

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-005
- **Files**:
    - `src/ai/byok/byok.controller.ts`
    - `src/ai/byok/dto/store-byok-key.dto.ts`
- **Acceptance**:
    - `201` response with `{ provider, secretArn, keyVersion, isActive }`
    - `400` on invalid key format
    - `401` if unauthenticated (Auth0 guard)
    - Raw key never in response body

#### T-007 · `DELETE /ai/byok/keys/:provider` + `GET /ai/byok/keys` endpoints

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-006
- **Files**:
    - `src/ai/byok/byok.controller.ts`
- **Acceptance**:
    - `DELETE` returns `204`; key removed from Secrets Manager + DB (AC-8)
    - `GET` returns list of key metadata; no raw keys in response

#### T-008 · `SanitizeModule` scaffold

- **Status**: pending
- **Priority**: P0
- **Depends on**: T-001
- **Files**:
    - `src/ai/sanitize/sanitize.module.ts`
    - `src/ai/sanitize/sanitize.service.ts`
    - `src/ai/sanitize/pii-patterns.ts`
- **Acceptance**: Module registers; `SanitizeService` injectable

#### T-009 · `SanitizeService` — PII detection + pseudonymization

- **Status**: pending
- **Priority**: P0
- **Depends on**: T-008
- **Files**:
    - `src/ai/sanitize/sanitize.service.ts`
    - `src/ai/sanitize/pii-patterns.ts`
- **Acceptance**:
    - `sanitizeContext()` pseudonymizes user ID → stable hash token
    - Strips: email addresses, phone numbers, names, account IDs
    - Replaces health conditions with category labels (e.g., "diabetic" → "medical-diet-low-sugar")
    - Preserves: allergies, dietary preferences
    - `scanForPii()` detects email + name patterns (AC-5)
    - Unit tests cover all PII pattern types

---

## Phase 5B: Core Generation (Weeks 3–4)

### US-1 — AI-Powered Recipe Generation (In-App BYOK)

#### T-010 · `AiModule` scaffold + provider resolution

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-004, T-009
- **Files**:
    - `src/ai/ai.module.ts`
    - `src/ai/ai.service.ts`
    - `src/ai/providers/provider-factory.ts`
    - `src/ai/types/ai.types.ts`
- **Acceptance**: `AiModule` registers; `AiService` injectable; `ProviderFactory` resolves `openai | anthropic | gemini | auto` to Vercel AI SDK provider instance

#### T-011 · Prompt template seeding + `PromptTemplateService`

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-002, T-010
- **Files**:
    - `src/ai/prompts/prompt-template.service.ts`
    - `src/db/seeds/prompt-templates.seed.ts`
- **Acceptance**:
    - Seed inserts templates for: `recipe_generation`, `meal_plan`, `shopping_list`, `nutrition_analysis`, `recipe_variation`
    - `getActiveTemplate(key)` returns current active version
    - Templates never contain raw user data (interpolation via `{{variable}}` only)

#### T-012 · `AiService.generateRecipe()` — async job enqueue

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-010, T-011
- **Files**:
    - `src/ai/ai.service.ts`
    - `src/ai/dto/generate-recipe.dto.ts`
- **Acceptance**:
    - Calls `SanitizeService.sanitizeContext()` before prompt construction
    - Enqueues `AiGenerationJob` to SQS
    - Creates `ai_generation_records` row with `status: 'pending'`
    - Returns `{ jobId, status: 'pending', estimatedWaitSeconds: 10 }`
    - `POST /ai/generate/recipe` returns `202`

#### T-013 · `GenerationQueueService` — SQS producer + consumer

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-012
- **Files**:
    - `src/ai/generation-queue.service.ts`
    - `src/ai/generation-queue.module.ts`
- **Acceptance**:
    - `enqueue()` sends `AiGenerationJob` to `ai-generation-queue`
    - `processJob()` fetches BYOK key, calls Vercel AI SDK `generateObject`, writes result to `recipes` table, updates `ai_generation_records` to `complete`
    - On failure: updates status to `failed`, writes `error_message`, sends to DLQ after 3 retries (AC-4)
    - Max 1 concurrent job per user enforced

#### T-014 · `GET /ai/generate/recipe/:jobId` — poll endpoint

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-013
- **Files**:
    - `src/ai/ai.controller.ts`
- **Acceptance**:
    - Returns `{ jobId, status, recipe?, provider, model, tokensUsed? }`
    - Status lifecycle: `pending → streaming → complete | failed` (AC-9)
    - `404` if jobId not found or belongs to different user

#### T-015 · `AiService.streamRecipe()` — SSE streaming endpoint

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-012
- **Files**:
    - `src/ai/ai.service.ts`
    - `src/ai/ai.controller.ts`
- **Acceptance**:
    - `POST /ai/generate/recipe/stream` returns `text/event-stream`
    - Emits `data: {"partial": {...}}` chunks as recipe builds
    - Final event: `data: {"done": true, "recipe": {...}}`
    - Uses Vercel AI SDK `streamObject` → NestJS SSE (AC-3)
    - Updates `ai_generation_records` status to `streaming` then `complete`

#### T-016 · Recipe preview + save flow (FR-017)

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-015
- **Files**:
    - `src/ai/ai.controller.ts`
    - `src/ai/dto/save-generated-recipe.dto.ts`
- **Acceptance**:
    - Generated recipe returned in preview state (not auto-saved)
    - `POST /ai/generate/recipe/:jobId/save` saves to `recipes` table as user-owned private recipe
    - `output_recipe_id` in `ai_generation_records` updated on save

---

## Phase 5C: Extended Generation (Week 5)

### US-1 — Meal Plan + Shopping List Generation

#### T-017 · `AiService.generateMealPlan()` + SSE endpoint

- **Status**: pending
- **Priority**: P2
- **Depends on**: T-013
- **Files**:
    - `src/ai/ai.service.ts`
    - `src/ai/dto/generate-meal-plan.dto.ts`
    - `src/ai/ai.controller.ts`
- **Acceptance**:
    - `POST /ai/generate/meal-plan` returns `202` with jobId
    - SSE variant streams partial meal plan
    - Completed job stores result in `meal_plans` table
    - `output_meal_plan_id` in `ai_generation_records` updated

#### T-018 · Shopping list generation endpoint

- **Status**: pending
- **Priority**: P2
- **Depends on**: T-013
- **Files**:
    - `src/ai/ai.service.ts`
    - `src/ai/dto/generate-shopping-list.dto.ts`
    - `src/ai/ai.controller.ts`
- **Acceptance**:
    - `POST /ai/generate/shopping-list` accepts meal plan ID or ingredient list
    - Returns `202` with jobId; result stored in `shopping_lists` table

### US-3 — Recipe Instruction Optimization (Premium, FR-019)

#### T-019 · Recipe variation / instruction optimization endpoint

- **Status**: pending
- **Priority**: P2
- **Depends on**: T-015
- **Files**:
    - `src/ai/ai.service.ts`
    - `src/ai/dto/optimize-recipe.dto.ts`
    - `src/ai/ai.controller.ts`
- **Acceptance**:
    - `POST /ai/recipes/:id/optimize` accepts `{ mode: 'simplify' | 'streamline' }`
    - Premium guard rejects non-premium users with `403`
    - Returns optimized instructions as preview (not auto-saved)

### Admin — Prompt Template CMS

#### T-020 · `GET /ai/prompts` + `PUT /ai/prompts/:templateKey` (admin)

- **Status**: pending
- **Priority**: P3
- **Depends on**: T-011
- **Files**:
    - `src/ai/prompts/prompt-template.controller.ts`
    - `src/ai/prompts/prompt-template.service.ts`
- **Acceptance**:
    - `GET /ai/prompts` lists all active templates (admin-only guard)
    - `PUT /ai/prompts/:key` creates new version (increments `version`), sets old version `is_active: false`
    - Non-admin requests return `403`

---

## Phase 5D: External Agent / MCP (Weeks 6–7)

### US-2 — External Agent Platform Integration (OAuth 2.1 + MCP)

#### T-021 · `McpModule` scaffold + OAuth 2.1 guard

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-002
- **Files**:
    - `src/ai/mcp/mcp.module.ts`
    - `src/ai/mcp/mcp-oauth.guard.ts`
    - `src/ai/mcp/mcp-oauth.strategy.ts`
- **Acceptance**:
    - Guard validates `Authorization: Bearer <token>` against Auth0 JWKS
    - Token audience must include `https://api.sous-chef.io/mcp`
    - Requests without valid token return `401` (AC-10)
    - PKCE flow supported

#### T-022 · OAuth 2.1 discovery endpoints

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-021
- **Files**:
    - `src/ai/mcp/mcp.controller.ts`
- **Acceptance**:
    - `GET /.well-known/oauth-protected-resource` returns RFC 9728 metadata
    - `GET /.well-known/oauth-authorization-server` proxies/returns Auth0 AS metadata
    - Both endpoints publicly accessible (no auth guard)

#### T-023 · `McpServerService` — JSON-RPC 2.0 handler

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-021
- **Files**:
    - `src/ai/mcp/mcp-server.service.ts`
    - `src/ai/mcp/mcp.controller.ts`
    - `src/ai/mcp/types/mcp.types.ts`
- **Acceptance**:
    - `POST /mcp` accepts JSON-RPC 2.0 single and batch requests
    - Routes to correct tool handler based on `method`
    - Returns JSON-RPC 2.0 response envelope
    - Invalid method returns `{"error": {"code": -32601, "message": "Method not found"}}`

#### T-024 · MCP tool: `recipes_list` + `recipe_get`

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-023
- **Files**:
    - `src/ai/mcp/tools/recipes.tool.ts`
- **Acceptance**:
    - `recipes_list` returns user's recipe collection (scoped to `recipes:read` scope)
    - `recipe_get` returns single recipe by ID
    - Scope check: `403` if token lacks `recipes:read`
    - Only returns recipes owned by the authenticated user

#### T-025 · MCP tool: `recipe_save`

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-024
- **Files**:
    - `src/ai/mcp/tools/recipes.tool.ts`
- **Acceptance**:
    - `recipe_save` creates recipe in `recipes` table as user-owned private recipe (FR-020)
    - Requires `recipes:create` scope
    - AI-generated recipes saved via agent treated identically to in-app saves
    - Returns saved recipe ID

#### T-026 · MCP tools: `meal_plans_list`, `meal_plan_get`, `ingredient_search`

- **Status**: pending
- **Priority**: P2
- **Depends on**: T-025
- **Files**:
    - `src/ai/mcp/tools/meal-plans.tool.ts`
    - `src/ai/mcp/tools/ingredients.tool.ts`
- **Acceptance**:
    - `meal_plans_list` / `meal_plan_get` require `meal-plans:read` scope
    - `ingredient_search` searches user's ingredient inventory
    - All tools scope-checked; unauthorized returns `403`

#### T-027 · OAuth consent management — grant + revoke (FR-018, FR-021)

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-021
- **Files**:
    - `src/ai/mcp/consent/consent.service.ts`
    - `src/ai/mcp/consent/consent.controller.ts`
    - `src/ai/mcp/dto/revoke-consent.dto.ts`
- **Acceptance**:
    - OAuth consent flow stores grant in `mcp_oauth_consents`
    - `DELETE /ai/mcp/consents/:clientId` revokes consent (sets `is_revoked: true`)
    - Revoked tokens rejected by OAuth guard
    - User can revoke at any time (FR-021)

#### T-028 · OAuth consent management UI — app settings page

- **Status**: pending
- **Priority**: P2
- **Depends on**: T-027
- **Files**:
    - `src/web/settings/agent-connections.page.tsx` (or equivalent)
- **Acceptance**:
    - Lists active external agent authorizations with platform name, granted scopes, grant date
    - Revoke button per connection
    - Accessible: all interactive elements queryable via `getByRole`/`getByLabel` (NFR-003)
    - Color not sole conveyor of state (NFR-004)

---

## Phase 5E: Compliance & Polish (Week 8)

### EU AI Act Compliance

#### T-029 · EU AI Act disclosure strings + watermark component

- **Status**: pending
- **Priority**: P0 (deadline: August 2, 2026)
- **Depends on**: T-015, T-017
- **Files**:
    - `src/web/components/ai-disclosure-banner.tsx`
    - `src/web/components/ai-generated-badge.tsx`
    - `src/i18n/en/ai-disclosures.ts`
- **Acceptance**:
    - All AI-generated recipe/meal plan outputs display: _"AI-generated content may be inaccurate. Verify before use."_
    - Nutrition advice outputs display: _"This is not medical advice. Consult a qualified professional."_
    - Disclosure visible in loading state (transparent AI generation indicator) (AC-6)
    - Accessible: disclosure text readable by screen readers

#### T-030 · `ai_generation_records` audit log writes for all generation paths

- **Status**: pending
- **Priority**: P0
- **Depends on**: T-013, T-015, T-017, T-018
- **Files**:
    - `src/ai/audit/audit-log.service.ts`
    - `src/ai/ai.service.ts`
    - `src/ai/generation-queue.service.ts`
- **Acceptance**:
    - Every generation request writes to `ai_generation_records` (pending → complete/failed)
    - `source_prompt_hash` = SHA-256 of sanitized prompt (no raw prompt stored)
    - `input_token_count`, `output_token_count`, `estimated_cost_usd` populated on completion
    - `completed_at` set on terminal status

### Resilience

#### T-031 · Circuit breaker middleware for Secrets Manager + AI provider calls

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-004, T-013
- **Files**:
    - `src/ai/byok/byok.service.ts`
    - `src/ai/providers/provider-factory.ts`
- **Acceptance**:
    - `@CircuitBreaker({ timeout: 3000, threshold: 5, resetTimeout: 30000 })` on `getByokKey()`
    - Circuit breaker on AI provider calls
    - Open circuit returns `503` with `Retry-After` header

#### T-032 · Per-user generation throttle (max 1 concurrent job)

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-013
- **Files**:
    - `src/ai/generation-queue.service.ts`
    - `src/ai/guards/concurrency.guard.ts`
- **Acceptance**:
    - Second concurrent generation request from same user returns `429`
    - Concurrency state tracked in `ai_generation_records` (count of `status: 'pending' | 'streaming'`)

#### T-033 · Rate limit middleware (Pro tier: 500 req/month)

- **Status**: pending
- **Priority**: P2
- **Depends on**: T-030
- **Files**:
    - `src/ai/guards/rate-limit.guard.ts`
- **Acceptance**:
    - Pro users: 500 generation requests/month; counter resets on 1st of month
    - Free (BYOK only): no platform limit
    - Exceeded limit returns `429` with `X-RateLimit-Reset` header

### AWS Infrastructure

#### T-034 · CDK stack: SQS `ai-generation-queue` + DLQ

- **Status**: pending
- **Priority**: P0
- **Depends on**: T-002
- **Files**:
    - `infra/stacks/ai-integration.stack.ts`
- **Acceptance**:
    - `ai-generation-queue` created with visibility timeout 120s
    - `ai-generation-dlq` with max receive count 3
    - IAM role `ai-generation-worker-role` with SQS + Secrets Manager permissions
    - `cdk diff` shows no unintended changes to existing stacks

#### T-035 · CDK stack: SNS `ai-events` topic (optional cross-service)

- **Status**: pending
- **Priority**: P3
- **Depends on**: T-034
- **Files**:
    - `infra/stacks/ai-integration.stack.ts`
- **Acceptance**:
    - `ai-events` SNS topic created
    - `GenerationQueueService` publishes `ai.generation.complete` / `ai.generation.failed` events

### Testing

#### T-036 · Unit tests: `ByokService`

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-007
- **Files**:
    - `tests/unit/ai/byok/byok.service.spec.ts`
- **Acceptance**:
    - `storeKey()` — mocked Secrets Manager; verifies ARN stored, raw key not in DB
    - `deleteKey()` — verifies both Secrets Manager + DB deletion
    - `validateKey()` — tests prefix validation for all 3 providers
    - Coverage ≥ 90% for `byok.service.ts`

#### T-037 · Unit tests: `SanitizeService`

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-009
- **Files**:
    - `tests/unit/ai/sanitize/sanitize.service.spec.ts`
- **Acceptance**:
    - Tests for each PII pattern: email, phone, name, account ID, health condition
    - `sanitizeContext()` — verifies pseudonymization is stable (same input → same hash)
    - `scanForPii()` — detects email + name patterns (AC-5)

#### T-038 · Unit tests: `McpServerService` + OAuth guard

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-025
- **Files**:
    - `tests/unit/ai/mcp/mcp-server.service.spec.ts`
    - `tests/unit/ai/mcp/mcp-oauth.guard.spec.ts`
- **Acceptance**:
    - Guard rejects missing/invalid Bearer token (AC-10)
    - Guard rejects wrong audience
    - `handleRpcRequest()` routes to correct tool handler
    - Scope enforcement tested for each tool

#### T-039 · Integration test: BYOK key store + recipe generation flow

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-016, T-036
- **Files**:
    - `tests/integration/ai/byok-recipe-generation.spec.ts`
- **Acceptance**:
    - Store OpenAI key → generate recipe → poll job → verify recipe in DB (AC-1)
    - Verifies raw key never in Postgres (AC-2)
    - Verifies `ai_generation_records` row created and updated

#### T-040 · Integration test: SQS async job lifecycle

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-013
- **Files**:
    - `tests/integration/ai/sqs-job-lifecycle.spec.ts`
- **Acceptance**:
    - Enqueue job → consumer processes → result in `recipes` table (AC-4)
    - Failed job → DLQ after 3 retries
    - `GET /ai/generate/recipe/:jobId` returns correct status at each stage (AC-9)

#### T-041 · E2E test: SSE streaming

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-015
- **Files**:
    - `tests/e2e/ai/sse-streaming.spec.ts`
- **Acceptance**:
    - `POST /ai/generate/recipe/stream` returns `text/event-stream`
    - Partial chunks received before final `done: true` event (AC-3)
    - Network capture verifies streaming (not buffered)

#### T-042 · E2E test: MCP OAuth 2.1 PKCE flow

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-027
- **Files**:
    - `tests/e2e/ai/mcp-oauth-flow.spec.ts`
- **Acceptance**:
    - OAuth 2.1 PKCE consent flow completes end-to-end (AC-7)
    - Agent calls `recipes_list` and `recipe_save` with Bearer token
    - Revoke consent → subsequent agent calls return `401`

---

## Summary by User Story

| User Story                                      | Priority | Tasks                                              | AC Coverage                                    |
| ----------------------------------------------- | -------- | -------------------------------------------------- | ---------------------------------------------- |
| US-1: AI Recipe Generation (BYOK in-app)        | P2       | T-001–T-016, T-029–T-033, T-036–T-041, T-043–T-046 | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-8, AC-9 |
| US-2: External Agent Platform (MCP/OAuth)       | P2       | T-021–T-028, T-038, T-042, T-048–T-049             | AC-7, AC-10                                    |
| US-3: Recipe Instruction Optimization (Premium) | P2       | T-019, T-047                                       | FR-019                                         |
| Admin: Prompt Template CMS                      | P3       | T-020                                              | FR-016 (partial)                               |

## Summary by Phase

| Phase                    | Tasks       | Description                                                                  |
| ------------------------ | ----------- | ---------------------------------------------------------------------------- |
| 5A: Foundation           | T-001–T-009 | DB schema, migration, BYOK module, sanitize module                           |
| 5B: Core Generation      | T-010–T-016 | AiModule, recipe generation, SSE streaming, job queue                        |
| 5C: Extended Generation  | T-017–T-020 | Meal plan, shopping list, optimization, prompt CMS                           |
| 5D: External Agent / MCP | T-021–T-028 | MCP server, OAuth 2.1, consent management                                    |
| 5E: Compliance & Polish  | T-029–T-042 | EU AI Act, audit log, circuit breakers, CDK, tests                           |
| 5F: Mobile Parity        | T-043–T-050 | Mobile screens for BYOK setup, generation, preview/save, consent, revocation |

## Open Questions (from plan.md §8)

> These must be resolved before the affected tasks can be completed:

- **OQ-5** (blocks EU user traffic): Anthropic/OpenAI DPA + SCCs must be executed before EU user prompts flow. Affects T-013, T-015, T-017.
- **OQ-6** (blocks nutrition features): EU AI Act risk classification for nutrition advice. Affects T-018, T-029.
- **OQ-3** (affects T-027, T-028): MCP OAuth client registration — self-service portal vs email-request. Recommendation: self-service portal. Product owner to confirm before Sprint 5.

---

## Phase 5F: Mobile Parity (Week 9)

> **Why this phase exists**: Tasks T-001 through T-042 target the NestJS API and web (`src/web/`) surfaces. The mobile app (`packages/apps/sous-chef/mobile`) requires dedicated implementation for all user-facing AI flows. Mobile is not a thin wrapper — it has distinct navigation patterns, screen constraints, and native capabilities (haptics, secure storage). These tasks ensure feature parity before launch.
>
> **Decisions reflected**: D-001 (two-step OAuth consent), D-003 (mandatory guard messaging on mobile), D-004 (private-only agent saves).

### US-1 / US-3 — Mobile: BYOK Provider Setup

#### T-043 · Mobile: BYOK provider configuration screen

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-007 (API endpoints complete)
- **Files**:
    - `packages/apps/sous-chef/mobile/src/screens/settings/AiProviderScreen.tsx`
    - `packages/apps/sous-chef/mobile/src/hooks/useByokKeys.ts`
- **Acceptance**:
    - Screen lists configured providers with status (active / not configured)
    - Add/replace key flow: provider picker → secure text input → save → confirmation
    - Delete key flow: swipe-to-delete or explicit remove button with confirmation dialog
    - Raw key never stored in device storage; only confirmation of ARN returned from API
    - Accessible: all inputs have labels queryable via `getByRole`/`getByLabel` (NFR-003)
    - Color not sole conveyor of state (NFR-004)

### US-1 — Mobile: AI Recipe Generation + Preview

#### T-044 · Mobile: AI recipe generation entry point + prompt input

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-043, T-016 (API preview/save endpoint)
- **Files**:
    - `packages/apps/sous-chef/mobile/src/screens/ai/GenerateRecipeScreen.tsx`
    - `packages/apps/sous-chef/mobile/src/components/ai/PromptInputCard.tsx`
- **Acceptance**:
    - User can enter ingredients, dietary constraints, cuisine, and serving count
    - "Generate" button calls `POST /ai/generate/recipe` (async job) or stream variant
    - Loading state shows EU AI Act disclosure: "AI is generating your recipe..." with disclosure text visible
    - Accessible: form fields labeled; generate button has accessible name

#### T-045 · Mobile: AI recipe preview + save/discard flow

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-044
- **Files**:
    - `packages/apps/sous-chef/mobile/src/screens/ai/RecipePreviewScreen.tsx`
    - `packages/apps/sous-chef/mobile/src/components/ai/AiGuardBanner.tsx`
- **Acceptance**:
    - Generated recipe displayed in preview state (not auto-saved) (FR-017)
    - Compact `AiGuardBanner` visible above recipe content: "AI-generated content may be inaccurate. Verify before use." (FR-022, D-003)
    - Banner not dismissible on first 3 views; collapses to icon with tooltip after that
    - "Save to my recipes" button calls `POST /ai/generate/recipe/:jobId/save`; saved recipe is private (FR-020, D-004)
    - "Discard" button discards without saving; no recipe stored (spec acceptance scenario 3)
    - Nutrition-adjacent content shows additional disclaimer (FR-022)
    - Accessible: banner text readable by screen reader; save/discard buttons have accessible names

#### T-046 · Mobile: SSE streaming display for recipe generation

- **Status**: pending
- **Priority**: P2
- **Depends on**: T-044
- **Files**:
    - `packages/apps/sous-chef/mobile/src/hooks/useRecipeStream.ts`
    - `packages/apps/sous-chef/mobile/src/screens/ai/RecipePreviewScreen.tsx`
- **Acceptance**:
    - Mobile client connects to `POST /ai/generate/recipe/stream` SSE endpoint
    - Recipe content renders progressively as chunks arrive (not buffered until complete)
    - Streaming indicator visible during generation
    - On stream complete, preview screen transitions to full preview + save/discard controls
    - Network error during stream shows retry option

### US-3 — Mobile: Premium Instruction Optimization

#### T-047 · Mobile: Instruction optimization entry point (Premium gate)

- **Status**: pending
- **Priority**: P2
- **Depends on**: T-019 (API endpoint), T-043
- **Files**:
    - `packages/apps/sous-chef/mobile/src/screens/recipe/RecipeDetailScreen.tsx`
    - `packages/apps/sous-chef/mobile/src/components/ai/OptimizeInstructionsButton.tsx`
- **Acceptance**:
    - "Optimize instructions" option visible on recipe detail screen for recipe owners
    - Free-tier users see the option but tapping it shows a Premium upsell sheet (not a silent failure)
    - Premium users see a confirmation sheet: "AI will simplify or streamline these instructions. You can review before saving."
    - Calls `POST /ai/optimize/recipe/:recipeId`; result shown in preview with accept/reject controls
    - Guard banner displayed on optimized result (FR-022, D-003)
    - Accessible: upsell sheet and confirmation sheet have accessible headings and button labels

### US-2 — Mobile: External Agent Consent + Revocation

#### T-048 · Mobile: OAuth consent screen for external agents

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-027 (consent service), T-022 (OAuth discovery endpoints)
- **Files**:
    - `packages/apps/sous-chef/mobile/src/screens/auth/AgentConsentScreen.tsx`
- **Acceptance**:
    - Screen displays agent name, requested scopes in plain language
    - `recipes:read` and `recipes:create` are shown as separate, individually toggleable checkboxes (D-001)
    - User may grant read without granting write
    - "Allow" button only active when at least one scope is selected
    - "Deny" button cancels the flow and returns to the originating deep link with error
    - Consent stored via `POST /ai/mcp/consents` on Allow
    - Accessible: checkboxes have labels; screen has accessible heading naming the requesting agent

#### T-049 · Mobile: Agent connections settings screen (revocation)

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-048, T-028 (web settings page for reference)
- **Files**:
    - `packages/apps/sous-chef/mobile/src/screens/settings/AgentConnectionsScreen.tsx`
- **Acceptance**:
    - Lists all active external agent authorizations: platform name, granted scopes (plain language), grant date
    - Each connection has a "Revoke access" button
    - Revoke calls `DELETE /ai/mcp/consents/:clientId`; connection removed from list on success
    - Empty state shown when no agents are connected
    - Accessible: list items have accessible names; revoke button labeled with agent name (not just "Revoke")
    - Color not sole conveyor of revocation state (NFR-004)

### Testing — Mobile Parity

#### T-050 · Mobile E2E tests: AI generation, preview/save, consent, revocation

- **Status**: pending
- **Priority**: P1
- **Depends on**: T-043, T-044, T-045, T-048, T-049
- **Files**:
    - `packages/apps/sous-chef/mobile/e2e/ai-generation.spec.ts`
    - `packages/apps/sous-chef/mobile/e2e/agent-consent.spec.ts`
- **Acceptance**:
    - Configure BYOK key → generate recipe → verify preview screen shows guard banner → save → verify recipe in collection as private
    - Discard flow: generate → discard → verify no recipe saved
    - Agent consent: deep link with OAuth request → consent screen shows two separate scope checkboxes → grant read-only → verify agent cannot call `recipe_save` → grant write → verify `recipe_save` succeeds and recipe is private
    - Revocation: revoke agent → verify subsequent agent API calls return `401`
    - Premium gate: free-tier user taps "Optimize instructions" → upsell sheet shown, no API call made

---
