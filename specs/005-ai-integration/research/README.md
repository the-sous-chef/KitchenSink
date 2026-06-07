# Research: AI Integration

**Branch**: `005-ai-integration` | **Date**: 2026-05-09
**Status**: Complete | **Input**: [spec.md](../spec.md), [plan.md](../plan.md), [research.md](../research.md)

---

This directory contains the Product Forge Phase 1 research artifacts for feature 005. Each file **augments** the existing research baseline in [research.md](../research.md) and synthesizes it into implementation-facing domain documents.

## File Index

### [competitors.md](./competitors.md)

Competitive landscape for AI-enabled recipe products with focus set requested for this feature: ChefGPT, SideChef AI, DishGen, and Whisk AI. Includes capability matrix, monetization posture, trust/safety posture, and differentiation thesis for Commise's BYOK + OAuth external-agent model.

### [ux-patterns.md](./ux-patterns.md)

UX pattern reference for AI recipe chat, AI suggestion cards, generation flow states, confidence indicators, hallucination guardrails, and robust fallback behavior. Anchored to `FR-015..FR-021` and plan-level streaming/async patterns.

### [codebase-analysis.md](./codebase-analysis.md)

Monorepo and implementation-fit analysis based on root `package.json`, `AGENTS.md`, `plan.md`, and `tasks.md`. Covers required backend modules (AiModule, ByokModule, McpModule), workspace impact, and rollout sequencing constraints.

### [tech-stack.md](./tech-stack.md)

Technology rationale for Vercel AI SDK orchestration, BYOK key storage in AWS Secrets Manager, OAuth 2.1 + PKCE for MCP, async processing with queues/streaming, and NestJS module boundaries.

### [metrics-roi.md](./metrics-roi.md)

Operational and product success frame for AI integration. Includes SC-003 latency target, NFR compliance mapping, cost controls for BYOK/no-platform-token-spend, and adoption/retention hypotheses.

---

## Relationship to Existing `research.md`

- `research.md` remains the canonical long-form research record.
- Files in `research/` are distilled, execution-oriented derivatives for Product Forge usage.
- No source facts were replaced; gaps are flagged as warnings in [../verify-report.md](../verify-report.md).
