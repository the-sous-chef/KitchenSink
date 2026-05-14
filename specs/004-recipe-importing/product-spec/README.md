# Product Spec: Recipe Importing

**Branch**: `004-recipe-importing`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [spec.md](../spec.md)

---

## Index

This directory contains Product Forge product specification artifacts for recipe importing.

| Artifact      | File                                  | Description                                                                                                                       |
| ------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Product Spec  | [product-spec.md](./product-spec.md)  | Vision, personas, epics, and MoSCoW story map with strict FR traceability to `FR-008..FR-014a`.                                   |
| User Journeys | [user-journey.md](./user-journey.md)  | End-to-end flows for URL import, Instagram import, manual paste fallback, duplicate conflict handling, and import error recovery. |
| Wireframes    | [wireframes/](./wireframes/README.md) | ASCII conceptual wireframes for required screens: import-url, import-paste, import-preview, import-conflict, import-error.        |
| Metrics       | [metrics.md](./metrics.md)            | Story-level measurable outcomes for Must/Should/Could stories in this feature.                                                    |

---

## Quick Links

- [product-spec.md](./product-spec.md) — scope and FR-traceable story map
- [user-journey.md](./user-journey.md) — behavior flows and sequence diagrams
- [wireframes/](./wireframes/README.md) — conceptual UI screen structure
- [metrics.md](./metrics.md) — per-story product metrics
- [../spec.md](../spec.md) — canonical FR source (`FR-008..FR-014a`)
- [../plan.md](../plan.md) — technical architecture and endpoint definitions
- [../v-model/requirements.md](../v-model/requirements.md) — REQ-level breakdown

---

## Artifact Cross-Reference

```
product-spec.md
    |
    +-- MoSCoW stories (US-401..US-410)
    |       Each story references FR-008..FR-014a
    |
    +-- Personas (Importer, Planner, Compliance-conscious user)
    |
    v
user-journey.md
    |
    +-- URL import flow
    +-- Instagram import flow
    +-- Manual paste + OCR-optional flow
    +-- Duplicate conflict and error recovery
    |
    v
wireframes/
    |
    +-- import-url.md
    +-- import-paste.md
    +-- import-preview.md
    +-- import-conflict.md
    +-- import-error.md
    |
    v
metrics.md
    |
    +-- Story-level metrics (activation, quality, compliance)
```
