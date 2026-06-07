# Feature 014: Notification Service

**Branch**: `014-notification-service`
**Status**: Bootstrap — initial product context only
**Created**: 2026-05-10

---

## Why this feature exists

Multiple features publish events that should reach users (or systems acting on behalf of users):

- **003 — USDA Food Data**: `food.backfill.completed`, fetch-failure events.
- **001 — Commise**: recipe lifecycle events referenced in product-spec.
- **005 — AI Integration**: AI-generated content disclosures.
- **008 — Cooking Mode**: timer alerts.
- **009 — Nutrition Planning**: compliance-gap notifications.

Per `specs/cross-feature-consistency-report.md` §5.3 and warning **WA-004**, no existing feature owns notification delivery. Five features reference notifications with no owner — every feature would otherwise reinvent transport, recipient targeting, and dispatch.

This feature owns that infrastructure.

---

## Scope at a glance

**In scope (launch)**

- Generic publish API for any backend service to emit a message.
- Recipient descriptor model: single user, group, or global.
- Subscription model for clients to receive messages whose recipient matches their identity / group membership.
- `messageType` keyword on every message; receiving clients dispatch behavior based on that keyword.
- In-app surface only.

**Deferred**

- Email and push (mobile) transports.
- User-facing notification preferences and opt-out.
- Templating / localization.
- Read receipts, delivery receipts, retry policy beyond a basic default.
- Cross-organization or multi-tenant routing semantics.

**Explicit non-goals**

- Owning the events themselves. Producers define their own `messageType` namespace.
- Replacing transactional email (USDA confirmation, auth flows, etc.).

---

## Index

| Artifact            | File                                                             | Description                                                   |
| ------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| Product Spec        | [product-spec/product-spec.md](./product-spec/product-spec.md)   | Vision, personas, story map, contract sketch, open questions. |
| Product Spec README | [product-spec/README.md](./product-spec/README.md)               | Index into the product-spec subfolder.                        |
| Research            | [research/README.md](./research/README.md)                       | Index into the research subfolder.                            |
| Codebase analysis   | [research/codebase-analysis.md](./research/codebase-analysis.md) | Snapshot of consuming features and existing infra references. |
| Review log          | [review.md](./review.md)                                         | Iterative revalidation log.                                   |

---

## Status

**Bootstrap only.** This folder currently contains:

- Product-spec foundation (vision, personas, story map, open questions).
- Light research scaffolding pointing at the cross-feature evidence.
- An empty review log ready for the first revalidation pass.

It does **not** yet contain:

- `spec.md` (SpecKit FR-NNN decomposition)
- `plan.md` (architecture / sequencing)
- `tasks.md`
- `v-model/` artifacts
- `research/competitors.md`, `research/ux-patterns.md`, `research/tech-stack.md`, `research/metrics-roi.md`

These should be authored in a follow-up Product Forge cycle once the open questions in the product spec are resolved.

---

## Source decisions

This feature was created in response to the resolution of [feature 003 Q-001](../003-usda-food-data/product-spec/product-spec.md#open-questions). See [feature 003 Revision 1](../003-usda-food-data/review.md) for the decision trail.
