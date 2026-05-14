# Product Forge Revalidation Log: Feature 005

**Branch**: `005-ai-integration`
**Created**: 2026-05-09
**Last updated**: 2026-05-10
**Status**: Product decisions approved — V-Model/test artifacts remain pre-implementation blocked
**Mode**: Retroactive bootstrap
**Milestone**: `M5` Isengard
**Public Launch**: 1.0 (end of `M6`)
**Launch Plan**: [`v1-launch-plan.md`](../v1-launch-plan.md)

---

## Purpose

This file records the iterative revalidation cycle for the Product Forge layer of feature 005. Each revision captures user feedback, the corrections applied, and an explicit approval marker.

This feature was **retroactively bootstrapped** — the SpecKit + V-Model artifacts already existed before Product Forge was layered on. Revalidation here therefore focuses on:

1. Whether the synthesized `research/` and `product-spec/` artifacts faithfully reflect the existing `spec.md`, `plan.md`, `research.md`, `tasks.md`, and `v-model/requirements.md`.
2. Whether the new artifacts surface any gaps, contradictions, or stale assumptions in the upstream artifacts.
3. Whether the Must Have / Should Have / Could Have decomposition in `product-spec/product-spec.md` matches product priorities for AI integration.

---

## Revision Log

### Revision 0 — Initial Bootstrap (2026-05-09)

**Author**: Sisyphus (Product Forge bootstrap)
**Trigger**: User-directed retroactive bootstrap of feature 005.

**Artifacts produced**:

- [research/competitors.md](./research/competitors.md)
- [research/ux-patterns.md](./research/ux-patterns.md)
- [research/codebase-analysis.md](./research/codebase-analysis.md)
- [research/tech-stack.md](./research/tech-stack.md)
- [research/metrics-roi.md](./research/metrics-roi.md)
- [product-spec/product-spec.md](./product-spec/product-spec.md)
- [product-spec/user-journey.md](./product-spec/user-journey.md)
- [product-spec/wireframes/](./product-spec/wireframes/)
- [product-spec/metrics.md](./product-spec/metrics.md)

**Synthesis sources**:

| Bootstrapped File    | Primary Source(s)                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------- |
| competitors.md       | `research.md` competitor landscape + named targets (ChefGPT, SideChef AI, DishGen, Whisk AI) |
| ux-patterns.md       | `spec.md` FR-015..FR-021 + `plan.md` SSE and fallback patterns                               |
| codebase-analysis.md | root `package.json`, `AGENTS.md`, `plan.md`, `tasks.md`                                      |
| tech-stack.md        | `plan.md` architecture/modules + `research.md` implementation recommendations                |
| metrics-roi.md       | `spec.md` NFR-001..004 + SC-003, `plan.md` operational constraints                           |
| product-spec.md      | `spec.md` user stories + FR-015..FR-021, `v-model/requirements.md`                           |
| user-journey.md      | `spec.md` story scenarios + `plan.md` endpoint flow                                          |
| wireframes/          | user-provided wireframe list + `spec.md` FR coverage                                         |
| metrics.md           | `product-spec.md` Must Have stories mapped to measurable outcomes                            |

**Notes and boundaries**:

- No changes were made to `spec.md`, `plan.md`, `tasks.md`, or `v-model/` artifacts during bootstrap.
- Three open questions were surfaced for product owner resolution (see Revision 1 below).

---

### Revision 1 — Product Owner Decisions (2026-05-10)

**Author**: Product Owner
**Trigger**: Engineering handoff blocked on three unresolved policy questions.

**Decisions recorded**:

#### Decision D-001: OAuth scope policy for external agents (resolves OQ-3 / review question 2)

**Question**: Should the default OAuth scope grant for external agents be read-only (`recipes:read`), with `recipes:create` requiring a separate, explicit consent step?

**Decision**: **Yes. Two-step consent is required.**

- The initial OAuth authorization screen grants `recipes:read` only.
- `recipes:create` (write access) is a separate scope that requires a distinct, clearly labeled consent prompt. The consent screen must name the scope in plain language: "Allow [Agent Name] to save new recipes to your account."
- Agents requesting both scopes in a single authorization request must present them as two distinct checkboxes, not a bundled grant. Users may grant read without write.
- This decision is reflected in `FR-018` (updated in `spec.md`) and in T-027 acceptance criteria.
- **Rationale**: Write access to a user's recipe collection is a higher-trust action than read. Bundling scopes in a single consent click obscures the write grant and creates a security and trust risk. Separate consent is consistent with the principle of least privilege and with how Google and Slack handle tiered OAuth scopes.

#### Decision D-002: Premium gating for instruction optimization (resolves review question 1)

**Question**: Should `FR-019` (instruction optimization) remain strictly Premium at launch, or allow a limited free trial quota?

**Decision**: **Strictly Premium at launch. No free trial quota for v1.**

- Instruction optimization (`FR-019`) is gated behind the Pro subscription tier with no free trial at launch.
- Rationale: BYOK recipe generation (FR-016) already provides free-tier AI value. Instruction optimization is a refinement feature that benefits power users. A free trial quota adds rate-limit complexity before the feature is proven. This can be revisited in v2 based on conversion data.
- The "Could Have" free-trial path is explicitly deferred to v2 in `product-spec.md`.
- Engineers must enforce this gate server-side (subscription check before calling `AiService.optimizeInstructions()`), not only in the UI.

#### Decision D-003: Confidence scoring and hallucination guard messaging (resolves review question 3)

**Question**: Should confidence scoring and hallucination guard messaging be mandatory UX across all AI outputs, or configurable by surface?

**Decision**: **Mandatory on all AI-generated content surfaces. Not configurable by users.**

- Every AI-generated recipe, meal plan, and instruction optimization result must display a confidence indicator and the standard guard message: "AI-generated content may be inaccurate. Verify before use."
- The guard message is not dismissible on first view. After a user has seen it 3 times, it may collapse to an icon with tooltip — but it cannot be disabled entirely.
- Nutrition-adjacent outputs additionally display: "This is not medical advice. Consult a qualified professional."
- This applies equally to web and mobile surfaces. Mobile must not omit the guard due to screen space constraints; use a compact inline variant if needed.
- Rationale: EU AI Act (effective August 2, 2026) requires transparency disclosures on AI-generated content. Making this configurable would create a compliance gap. Consistent messaging also builds user trust faster than opt-in disclosure.
- This decision promotes W-003 from a warning to a resolved requirement. `FR-022` has been added to `spec.md` to formalize it.

#### Decision D-004: Default visibility for AI-saved recipes (clarifies FR-020)

**Question** (surfaced during handoff review): When an external agent saves a recipe via `recipe_save`, what is the default visibility? Is it the same as in-app saves?

**Decision**: **All AI-saved recipes default to private, regardless of save path.**

- Recipes saved via in-app generation and recipes saved by external agents via `recipe_save` both default to `visibility: 'private'`.
- The user must explicitly change visibility to `public` or `shared` through the standard recipe settings flow. No agent can set visibility to anything other than `private` on initial save.
- The `recipe_save` MCP tool must reject any payload that includes a `visibility` field set to a non-private value. Return `400` with message: "Agents may only save private recipes. The user can change visibility after saving."
- This is a security boundary: external agents must not be able to publish content to a user's public profile without the user taking an explicit action in the app.
- `FR-020` in `spec.md` has been updated to make this explicit.

#### Decision D-005: BYOK key limits per user

**Question** (surfaced during handoff review): Can a user store keys for all three providers simultaneously, or is there a limit?

**Decision**: **One active key per provider, up to all three providers simultaneously.**

- A user may store one active BYOK key per provider (OpenAI, Anthropic, Gemini). Storing a new key for a provider replaces the existing one (the old secret is deleted from Secrets Manager).
- There is no limit on how many providers a user configures. A user may have all three active at once.
- The `user_byok_keys` schema already enforces uniqueness on `(user_id, provider)` — this decision confirms that constraint is intentional, not a gap.
- No additional schema changes required.

---

## Open Questions Remaining (not blocking product decisions; implementation blocked pending OQ-5, OQ-6)

These questions do not block engineering start but must be resolved before the affected tasks can be marked complete.

| ID   | Question                                                             | Blocks          | Owner    | Target              |
| ---- | -------------------------------------------------------------------- | --------------- | -------- | ------------------- |
| OQ-1 | Which GCP region for Gemini? (us-east1 vs us-central1)               | GA launch       | Platform | Before GA           |
| OQ-2 | Rate limit tracking by generation type or total count?               | T-033           | Product  | Sprint 6            |
| OQ-3 | MCP OAuth client registration: self-service portal or email-request? | T-027, T-028    | Product  | Sprint 5            |
| OQ-4 | Prompt template user-fork support?                                   | T-020           | Product  | V2 scope — deferred |
| OQ-5 | Anthropic/OpenAI DPA + SCCs executed?                                | EU user traffic | Legal    | Before EU launch    |
| OQ-6 | EU AI Act risk classification for nutrition advice?                  | T-018, T-029    | Legal    | Before EU launch    |

OQ-3 recommendation: self-service portal in app settings (see plan.md §8). Product owner to confirm before Sprint 5.

---

## Approval Block

### Approved

**Approved by**: Product Owner
**Date**: 2026-05-10
**Scope**: Decisions D-001 through D-005 are final for v1. These decisions resolve the product-layer blockers only. Engineering implementation remains blocked by the V-Model/test artifact lifecycle (plan.md, requirements.md, system-design.md, architecture-design.md all remain Draft; release-audit-report.md is ❌ BLOCKED with 224 untested scenarios). Sprint start requires those artifacts to advance through implementation and test execution. Open questions OQ-1 through OQ-6 are tracked above; OQ-5 and OQ-6 additionally block EU user traffic and nutrition features respectively.

**Artifacts updated as part of this approval**:

- `review.md` — this file (decisions recorded)
- `spec.md` — FR-018 updated (two-step consent), FR-020 updated (agent visibility restriction), FR-022 added (mandatory confidence/guard messaging)
- `product-spec/product-spec.md` — D-002 premium gating confirmed, D-003 guard messaging promoted to Must Have
- `tasks.md` — mobile parity tasks T-043 through T-050 added
- `.forge-status.yml` — revalidation marked complete; verify marked complete
- `verify-report.md` — updated to reflect resolved warnings

**Artifacts NOT changed and still in pre-implementation state**:

- `plan.md` — Status: Draft
- `v-model/requirements.md` — Status: Draft
- `v-model/system-design.md` — Status: Draft
- `v-model/architecture-design.md` — Status: Draft
- `v-model/release-audit-report.md` — Compliance Status: ❌ BLOCKED (224 untested scenarios, 0 executed)
- All V-Model test artifacts (unit-test.md, integration-test.md, system-test.md, acceptance-plan.md) — pre-implementation, no test runs recorded
