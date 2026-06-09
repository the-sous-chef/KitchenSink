# Research: Recipe Importing

**Branch**: `004-recipe-importing` | **Date**: 2026-05-09
**Status**: Complete | **Input**: [spec.md](../spec.md), [plan.md](../plan.md), [tasks.md](../tasks.md), [research.md](./research.md)

---

This directory contains Product Forge Phase 1 research artifacts for feature 004. Artifacts augment the existing `research/research.md` baseline and reframe it into domain-focused documents used by Product Forge product-spec generation.

## File Index

### [competitors.md](./competitors.md)

Competitive landscape focused on requested comparators: **Paprika, Mealie, Tandoor, and Plan To Eat**. Includes import capability matrix, attribution/legal posture differences, duplicate handling patterns, and differentiation opportunities for Commise import workflows.

### [ux-patterns.md](./ux-patterns.md)

UX patterns for recipe importing including URL import, manual paste, parse-and-confirm preview, duplicate conflict handling, and import error recovery. Maps patterns directly to `FR-008..FR-014a` and NFR accessibility constraints.

### [codebase-analysis.md](./codebase-analysis.md)

Monorepo and implementation-surface analysis grounded in root `package.json`, `AGENTS.md`, and 004 plan/tasks. Documents expected package placement for API extractors, DTO validation, UI import flows, and test integration points.

### [tech-stack.md](./tech-stack.md)

Technology rationale for extraction/parsing, URL fetch resilience, Instagram oEmbed integration, file import validation, and OCR optioning. Consolidates RQ-1..RQ-8 from existing `research/research.md` plus architecture decisions from `plan.md`.

### [metrics-roi.md](./metrics-roi.md)

Portfolio-level success metrics and ROI hypotheses for import funnel performance, parsing quality, duplicate prevention, legal-compliance error handling, and operational cost/risk controls.

---

## Relationship to Existing Research

- Existing baseline: [research.md](./research.md)
- Product Forge augmentation: this directory set

`research.md` remains canonical for detailed RQ writeups and external references. The five generated files normalize that material into Product Forge-ready structure.
