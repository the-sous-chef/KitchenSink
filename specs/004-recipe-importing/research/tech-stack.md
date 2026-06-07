# Tech Stack Rationale: Recipe Importing

**Branch**: `004-recipe-importing` | **Date**: 2026-05-09
**Status**: Complete | **Sources**: [research.md](./research.md), [plan.md](../plan.md), [tasks.md](../tasks.md)

---

## Overview

Feature 004 extends the existing Commise stack with import-specific extraction, normalization, and policy controls. Technology selection is constrained by existing TypeScript/NestJS architecture and source-attribution requirements.

---

## 1. Extraction and Parsing Stack

### Primary choice: Schema.org-first extraction pipeline

- JSON-LD parsing for `Recipe` entities
- Ordered fallback chain: Microdata → RDFa → heuristic HTML

**Rationale**:

- Matches `plan.md` extraction strategy and `research.md` RQ-1/RQ-2 findings.
- Preserves deterministic behavior and clear test boundaries per extractor.

### Optional helper libraries

- `recipe-scrapers` for broad host compatibility bootstrap
- `cheerio` for DOM traversal
- `zod` for extraction result validation

---

## 2. Transport and Resilience Stack

### URL fetch controls

- 10s timeout
- bounded redirect chain
- per-user rate limiting
- circuit breaker after repeated failure

**Rationale**:

- Prevents parser pipeline from becoming unbounded on hostile or unstable pages.
- Provides stable user feedback windows for import UI loading states.

---

## 3. Platform Integrations

### Instagram import

- oEmbed metadata path for caption-based recipe extraction
- explicit unsupported-state handling for posts without recipe text

**Rationale**:

- Aligns to `FR-009` and task acceptance criteria while minimizing dependency scope.

### OCR (physical copy)

- AWS Textract preferred in baseline research, but launch-phase uncertain
- treated as phased rollout due to quality/cost and implementation uncertainty

**Rationale**:

- `FR-012` requires capability, but plan identifies OCR as later-order/open-question item.

---

## 4. Data Validation and Contract Layer

- Zod DTO/schema validation for imported structures
- strict typed response contracts for import outcomes (`imported`, `already_imported`, `paywalled_source`, `unsupported_source`)

**Rationale**:

- Supports predictable error-recovery UX and end-to-end traceability across API + clients.

---

## 5. Policy and Compliance Controls

- Domain blocklist for known paywalled sources (`FR-014`)
- attribution lock semantics for imported public recipes (`FR-010`, `FR-011`)
- legal-policy placeholder for manual paid-source paste (`FR-014a`)

**Rationale**:

- Converts legal/product constraints into explicit runtime behavior without overcommitting to unresolved enforcement heuristics.

---

## 6. Implementation Compatibility with Existing Monorepo

- TypeScript strict mode and JSDoc requirements remain inherited constraints (`NFR-001`, `NFR-002`).
- Existing build/lint/test/typecheck turbo workflows can validate import modules and UI surfaces without introducing a separate pipeline.
