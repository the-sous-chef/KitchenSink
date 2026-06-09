# Codebase Analysis: AI Integration

**Branch**: `005-ai-integration` | **Date**: 2026-05-09
**Status**: Complete | **Sources**: [plan.md](../plan.md), [tasks.md](../tasks.md), root `package.json`, [AGENTS.md](../../../AGENTS.md)

---

## Monorepo Layout

KitchenSink is a Turborepo + npm workspaces monorepo. Root `package.json` currently defines:

```json
"workspaces": [
  "packages/tools/*",
  "packages/apps/commise/web",
  "packages/apps/commise/mobile",
  "packages/ui"
]
```

`plan.md` and `tasks.md` for feature 005 target backend AI modules under the existing API architecture without changing root workspace declarations in this bootstrap pass.

---

## Existing Workspaces Relevant to 005

### `packages/apps/commise/web`

- Hosts AI entry UI, suggestion cards, and generation UX.
- Needs SSE-friendly client handling for streaming generation output.

### `packages/apps/commise/mobile`

- Needs feature parity for AI generation and preview/save flow (`FR-016`, `FR-017`).
- OAuth external-agent management may remain web-first initially, but revocation visibility must still be user-accessible (`FR-021`).

### `packages/ui`

- Candidate home for reusable AI components:
    - confidence badges,
    - suggestion card primitives,
    - fallback/error state panels.

### Backend API workspace (implementation target from plan/tasks)

- `tasks.md` defines AI-centric module/file paths (`src/ai/...`, `src/db/schema/...`) implying integration into existing NestJS API codebase.

---

## New/Expanded Module Surface (from plan/tasks)

| Module                | Purpose                                             | Primary Tasks              |
| --------------------- | --------------------------------------------------- | -------------------------- |
| `AiModule`            | generation orchestration + streaming endpoints      | T-006..T-020               |
| `ByokModule`          | provider key lifecycle and Secrets Manager refs     | T-003..T-005               |
| `McpModule`           | OAuth 2.1 protected MCP JSON-RPC tools              | T-021..T-025               |
| Prompt/Policy helpers | sanitization, confidence, guardrails, policy checks | T-007, T-008, T-011, T-028 |

---

## Conventions and Constraints

### Language + runtime

- TypeScript 5.x, Node >=24 at repository level.
- Strict typing and DTO validation conventions carry forward from existing stack guidance.

### Security and privacy

- BYOK secret material should never enter app logs or database plaintext.
- Postgres stores only secret references (ARNs / metadata).
- OAuth audience and scope checks required for external agent path.

### Testing and verification

- Root scripts indicate turbo-driven `test`, `lint`, and `typecheck` lanes.
- tasks include unit/integration/E2E + performance + security verification expectations.

---

## Dependency Graph (Feature 005 Logical)

1. Schema/migrations (T-001, T-002)
2. BYOK key management (T-003..T-005)
3. Core generation + prompt pipeline (T-006..T-013)
4. Extended generation features (T-014..T-020)
5. External agent OAuth/MCP (T-021..T-025)
6. Compliance and polish (T-026..T-042)

This sequence matches the phase graph in `tasks.md` and is suitable for phased rollout.

---

## Gaps and Pending Decisions

1. Exact package location for NestJS API files is implied by plan/tasks but not explicitly declared in root workspace table.
2. Quantitative confidence-score computation methodology is not formalized in spec text.
3. UI ownership split (web vs shared `packages/ui`) for AI components is implementation-dependent.

These are treated as design gaps; no requirements were invented in this bootstrap pass.
