# Tech Stack Rationale: Nutrition Planning

**Branch**: `009-nutrition-planning` | **Date**: 2026-05-09
**Status**: Complete | **Sources**: [plan.md](../plan.md), [research.md](../research.md), [spec.md](../spec.md)

---

## Overview

Feature 009 intentionally reuses the established stack and data pipelines from core recipe and meal-planning features. The main decisions are about **data shape**, **compliance logic**, and **privacy constraints**, not introducing new foundational infrastructure.

---

## Backend and Domain Services

### Choice

Use existing TypeScript backend stack (NestJS + strict TS conventions) for nutrition target CRUD, meal-plan linkage, compliance analysis, trainer-client assignment, and premium recipe-swap orchestration.

### Rationale

- `plan.md` defines REST contracts and domain entities already aligned with NestJS-style API boundaries.
- Existing auth and premium dependencies (`002-user-auth`, `010-subscriptions`) are already in ecosystem.
- Keeping the domain in the existing API reduces cross-service latency and consistency risk.

### Trade-offs

| Trade-off                                | Mitigation                                              |
| ---------------------------------------- | ------------------------------------------------------- |
| Domain complexity growth in existing API | Isolate nutrition module boundaries and DTO schemas     |
| Premium logic spread across endpoints    | Centralize entitlement checks at guard/middleware layer |

---

## Data Layer

### Choice

PostgreSQL + Drizzle schema evolution for nutrition plans, linkage, and compliance snapshots.

### Rationale

- Relational model in `plan.md` directly matches target and compliance use cases.
- 006 already provides normalized + snapshot nutrition data from meal plans.
- SQL rollups support deterministic adherence reporting.

### Modeling Notes

- Fixed gram targets are canonical for `FR-036`.
- Ratio-based representation may be maintained as optional UI input mode, converted to canonical grams before persistence.
- Deficiency-alert and micronutrient data should remain additive fields/views unless promoted to explicit FR scope.

---

## Frontend (Web + Mobile)

### Choice

Implement nutrition dashboard and goal flows in both web and mobile clients with parity constraints from core platform direction.

### Rationale

- Domain usage spans trainer (often web) and client/user (often mobile).
- `NFR-003` and `NFR-004` impose accessible semantic UI patterns suitable across both surfaces.

### UX-Critical Technical Requirements

- Components expose stable accessibility labels (`getByRole`/`getByLabel`).
- Progress visualization uses redundant semantics beyond color.

---

## Privacy and Compliance Stack

### Choice

Use explicit consent-gated processing model for trainer-client nutrition workflows.

### Rationale

- `research.md` identifies GDPR Article 9 handling as mandatory for nutrition health-adjacent data.
- `v-model/requirements.md` includes explicit consent requirement (`REQ-008`).

### Implementation Constraints

- Persist consent artifacts (timestamp/version/reference) before trainer access.
- Ensure right-to-erasure pathways can remove nutrition plan and compliance records.

---

## Integration Surfaces

| Dependency         | Used For                                    | Interface Expectation                            |
| ------------------ | ------------------------------------------- | ------------------------------------------------ |
| 003 USDA Food Data | Nutrient source provenance                  | Indirect via recipe/meal snapshots               |
| 006 Meal Planning  | Actual intake rollups for compliance        | Daily/weekly rollup queries on meal plan entries |
| 001 Recipe App     | Recipe identity and swap candidates         | Recipe lookup/suggestion APIs                    |
| 010 Subscriptions  | Premium gates for trainer and swap features | Entitlement checks at API edge                   |

---

## Decision Summary

Keep stack continuity, maximize reuse of 006 nutrition rollups, and treat advanced nutrition intelligence (deficiency alerts, broader micronutrient modeling) as extension layers unless promoted upstream to explicit FR coverage.
