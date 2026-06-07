# Product Specification: Commise - AI Integration

**Branch**: `005-ai-integration`
**Date**: 2026-05-09
**Last updated**: 2026-05-10
**Status**: Approved — decisions D-001 through D-005 recorded in review.md
**Source**: [spec.md](../spec.md)

---

## Vision

Commise AI Integration makes the recipe platform conversational, assistive, and interoperable without surrendering user control. Users can generate and refine recipes in-app using their preferred AI provider (BYOK), and can authorize external agent platforms to interact with their recipe data through explicit OAuth consent.

**Tagline**: "AI help, user control."

**Core principles**:

- AI is opt-in and transparent.
- User-owned keys and user-owned generated content.
- External agent access always requires explicit, revocable consent. Read and write scopes are granted separately.
- Low-confidence output must surface guardrails and recovery paths on every surface, web and mobile. This is not configurable.
- All AI-saved recipes default to private. No agent can publish to a user's public profile.

---

## Personas

### Primary: P7 Quinn — AI Companion User

**Archetype**: AI Companion User
**Core Motivation**: Conversational kitchen brain, hands-free assistance

**Profile**: Quinn treats Commise as a thinking partner in the kitchen. They want to ask natural-language questions mid-cook, get contextual suggestions without leaving the app, and trust that the AI understands their pantry and preferences over time.

**AI-specific goals**:

- Ask natural-language recipe questions ("what can I substitute for buttermilk here?") and get grounded, in-context answers.
- Generate full recipes from a conversational prompt without switching to a separate AI tool.
- Configure their preferred AI provider (BYOK) once and have it work seamlessly across all AI features.
- See confidence indicators so they know when to trust output vs. double-check.
- Keep all generated content private until they explicitly choose to save or share.

**AI-specific pains**:

- Generic AI outputs that ignore their dietary constraints or pantry state.
- Being forced to copy-paste between a chat tool and the recipe app.
- No way to recover gracefully when the AI produces a low-quality or unsafe result.

**Fits**: `FR-015`, `FR-016`, `FR-017`, `FR-020`.

---

### Secondary: P1 Casey — Beginner Cook

**Archetype**: Beginner Cook
**Core Motivation**: Build confidence, guided cooking, accessible UX

**Profile**: Casey is still learning their way around the kitchen. They rely on clear, step-by-step instructions and want AI to help them figure out what to cook with whatever's in the fridge, without overwhelming them with options or jargon.

**AI-specific goals**:

- Ask "what can I make with X?" and get a realistic, beginner-friendly suggestion.
- Get simplified instructions when a recipe step feels too advanced.
- Preview a generated recipe before committing to it, so there are no surprises mid-cook.
- Understand why the AI made a suggestion (brief rationale helps build cooking intuition).
- Regenerate against a different provider if the first result doesn't feel right.

**AI-specific pains**:

- AI outputs that assume advanced technique or equipment they don't have.
- No fallback when a generated recipe turns out to be impractical.
- Feeling locked into one AI provider with no way to compare results.

**Fits**: `FR-016`, `FR-017`, `FR-019`, `FR-020`.

---

### Tertiary: P8 Alex — Commise Power User

**Archetype**: Commise Power User
**Core Motivation**: Multi-feature daily power use, integrations, automation

**Profile**: Alex uses Commise heavily and wants AI to handle the tedious parts at scale. They're interested in batch operations, connecting external agent platforms, and automating repetitive tasks like tagging, normalization, and instruction cleanup across their entire recipe library.

**AI-specific goals**:

- Batch-tag or normalize a large recipe collection using AI without touching each recipe manually.
- Authorize external agents (ChatGPT, Gemini, custom tools) to read and write recipes via OAuth, with clear scope boundaries.
- Revoke agent access instantly and see a full consent activity timeline.
- Use AI-assisted instruction optimization across multiple recipes in one session.
- Integrate Commise into their broader automation stack via the MCP server.

**AI-specific pains**:

- No bulk AI operations — having to optimize recipes one at a time is a dealbreaker at scale.
- Opaque consent flows that make it hard to track which agents have access to what.
- Prompt injection risks when external agents interact with user-owned content.

**Fits**: `FR-018`, `FR-019`, `FR-020`, `FR-021`.

---

## Internal Stakeholders

### External-Agent Integrator

**Role**: Operational/platform role — not a user persona.

Responsible for onboarding third-party AI agent platforms (e.g., ChatGPT plugins, Gemini extensions, custom MCP clients) to the Commise agent API. Key responsibilities include:

- **MCP server contracts**: Defining and versioning the tool schemas exposed via the Model Context Protocol server, ensuring external agents receive well-typed, stable interfaces for recipe read/write operations.
- **OAuth scope governance**: Reviewing and approving the scopes available to external agents, ensuring least-privilege access and clear user-facing consent language.
- **Prompt-injection threat reviews**: Auditing agent interaction patterns for prompt-injection vectors, particularly where external agent output could influence recipe content saved to user accounts.
- **Third-party agent certification**: Evaluating new agent integrations before they're listed as trusted connectors in the Commise consent flow.

This role surfaces in `FR-018` (external agent OAuth access) and `FR-021` (revocation and audit trail) and owns the security review gate before any new agent platform goes live.

---

## Epics

### Epic 1: BYOK AI Generation (P2)

Enable users to configure providers and generate recipes in-app with preview-first save controls.

### Epic 2: AI-Assisted Refinement (P2)

Allow premium users to optimize instructions (simplify/streamline) with explicit review.

### Epic 3: External Agent Platform Access (P2)

Expose OAuth-protected agent capabilities for recipe read/write on behalf of the user.

### Epic 4: Trust, Confidence, and Recovery (P2)

Provide confidence indicators, hallucination guards, and fallback flows that keep users in control.

---

## Stories (MoSCoW)

### Must Have

1. **US-001 — Configure AI Provider (BYOK)**
   As a user, I can securely configure my preferred AI provider credentials so the app can generate recipes with my own account.
   **FRs**: [FR-015](../spec.md#fr-015)

2. **US-002 — Generate Recipe In-App**
   As a user, I can request generated recipes based on ingredients and constraints and get a response in-app.
   **FRs**: [FR-016](../spec.md#fr-016)

3. **US-003 — Preview Before Save**
   As a user, I can preview generated recipes and decide whether to save them.
   **FRs**: [FR-017](../spec.md#fr-017), [FR-020](../spec.md#fr-020)

4. **US-004 — External Agent OAuth Access**
   As a user, I can authorize external agents via OAuth so they can read/create recipes for my account within granted scope. Read access (`recipes:read`) and write access (`recipes:create`) are separate consent steps; I may grant read without granting write.
   **FRs**: [FR-018](../spec.md#fr-018) _(D-001)_

5. **US-005 — Revoke Agent Access**
   As a user, I can revoke previously granted agent authorizations at any time.
   **FRs**: [FR-021](../spec.md#fr-021)

### Should Have

6. **US-006 — Premium Instruction Optimization**
   As a premium user, I can ask AI to simplify or streamline recipe instructions before saving changes. This feature is gated behind the Pro subscription tier with no free trial at launch. The subscription check is enforced server-side. _(D-002)_
   **FRs**: [FR-019](../spec.md#fr-019)

7. **US-007 — Confidence + Guardrail Messaging**
   As a user, I see a confidence indicator and guard message on every AI-generated output — web and mobile. The message "AI-generated content may be inaccurate. Verify before use." is not dismissible on first view and cannot be disabled. Nutrition-adjacent outputs additionally show "This is not medical advice." This is mandatory, not configurable. _(D-003)_
   **FRs**: [FR-022](../spec.md#fr-022)

### Could Have

8. **US-008 — Cross-provider Regeneration Shortcut**
   As a user, I can regenerate the same prompt against another configured provider when first result quality is low.
   **FR linkage**: Derived interaction pattern from [FR-016](../spec.md#fr-016), not a new requirement.

9. **US-009 — Consent Activity Timeline**
   As a user, I can view historical consent/revocation events for external agents.
   **FR linkage**: Derived visibility pattern from [FR-021](../spec.md#fr-021), not a new requirement.

### Won't Have (v1)

- Autonomous agent writes without explicit user OAuth consent.
- Automatic save of generated recipes without preview/decision.
- Platform-paid unrestricted model token quotas (conflicts with BYOK-first approach).
- Free trial quota for instruction optimization (FR-019). Deferred to v2 pending conversion data. _(D-002)_
- Agent-initiated visibility changes. Agents may only save private recipes; visibility changes require user action in-app. _(D-004)_

---

## Out of Scope

- Replacing manual recipe CRUD from feature 001.
- Introducing new subscription rules beyond existing premium gating policy references.
- Declaring additional hard FRs beyond `FR-015..FR-022` in this bootstrap.

---

## Product Decisions Log

| ID    | Decision                                                                                          | Date       |
| ----- | ------------------------------------------------------------------------------------------------- | ---------- |
| D-001 | Two-step OAuth consent: `recipes:read` and `recipes:create` are separate consent steps            | 2026-05-10 |
| D-002 | FR-019 instruction optimization is strictly Premium at launch; no free trial quota                | 2026-05-10 |
| D-003 | Confidence/guard messaging is mandatory on all AI surfaces, web and mobile; not user-configurable | 2026-05-10 |
| D-004 | All AI-saved recipes default to `private`; agents cannot set non-private visibility               | 2026-05-10 |
| D-005 | One active BYOK key per provider; up to all three providers simultaneously                        | 2026-05-10 |

Full rationale for each decision is in [review.md](../review.md#revision-1--product-owner-decisions-2026-05-10).
