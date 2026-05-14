# Research: Meal Planning

**Branch**: `006-meal-planning` | **Date**: 2026-05-09
**Status**: Complete | **Input**: [spec.md](../spec.md), [plan.md](../plan.md), [research.md](../research.md), [tasks.md](../tasks.md)

---

This directory contains Product Forge Phase 1 research artifacts for feature 006. These files **augment** existing `research.md` (they do not replace it) and reorganize findings into implementation-facing documents.

## File Index

### [competitors.md](./competitors.md)

Meal planning competitor landscape focused on requested set: Plan To Eat, Mealime, PlateJoy, and eMeals. Includes feature-parity matrix for weekly/monthly planners, drag-drop scheduling, template reuse, leftovers workflow, and shopping handoff.

### [ux-patterns.md](./ux-patterns.md)

UX pattern reference for planner-week/planner-month interactions, drag-and-drop meal scheduling, recurring meals, template application, nutrition goal overlays, family sizing controls, leftovers handling, and grocery handoff states.

### [codebase-analysis.md](./codebase-analysis.md)

Monorepo and feature-fit analysis based on root `package.json`, `AGENTS.md`, `plan.md`, and `tasks.md`. Documents likely workspace impact, API/DB boundaries, integration dependencies (001/003/005/007/009), and unresolved implementation constraints.

### [tech-stack.md](./tech-stack.md)

Technology choices and rationale for meal planning derived from existing `research.md` and `plan.md`: React + `@dnd-kit`, calendar view strategy, Drizzle/PostgreSQL schema, nutrition aggregation strategy, SQS-assisted async paths, and AI integration with premium gating.

### [metrics-roi.md](./metrics-roi.md)

Portfolio-level metrics and ROI framing for feature 006. Covers constitution-derived NFRs (NFR-001..004), SC-008 workflow objective, activation and retention metrics, and efficiency/cost hypotheses. Explicitly flags metrics requiring future product instrumentation decisions.

## Relationship to Other Artifacts

- `../research.md`: canonical deep research Q&A (RQ-1..RQ-9).
- `../product-spec/`: user-facing synthesis (stories, journeys, wireframes, story metrics).
- `../spec.md`: source-of-truth FR/NFR/SC IDs.
- `../plan.md`: technical implementation constraints and APIs.
- `../tasks.md`: delivery decomposition and coverage mapping.

## What Is Grounded vs. TBD

**Grounded (from existing artifacts):**

- FR-022..027 scope and premium split (`spec.md`).
- NFR-001..004 constraints (`spec.md`).
- SC-008 workflow target (`spec.md`).
- Data model/API boundaries (`plan.md`).
- Implementation sequencing (`tasks.md`).

**TBD / WARNING surface (not invented):**

- Formal FR(s) for templates/recurring meals/leftovers/family-size controls (currently represented as UX patterns and implementation assumptions).
- Exact metric thresholds for retention/conversion beyond SC-008.
- Final decision on template persistence model (open question in `plan.md`).
