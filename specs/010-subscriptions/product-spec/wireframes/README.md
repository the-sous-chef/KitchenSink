# Wireframes: Subscriptions & Monetization

**Branch**: `010-subscriptions`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](../product-spec.md), [spec.md](../../spec.md)

---

## Index

| File                                               | Description                                                               | Key FRs                |
| -------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------- |
| [pricing-page.md](./pricing-page.md)               | Dedicated free vs premium comparison and checkout entry points            | FR-040, FR-041, FR-042 |
| [paywall-modal.md](./paywall-modal.md)             | Contextual modal shown when free users hit gated actions                  | FR-041, FR-042         |
| [subscription-manage.md](./subscription-manage.md) | Subscription status, plan details, payment method/update/cancel actions   | FR-041, FR-043         |
| [billing-history.md](./billing-history.md)         | Invoice history, receipts, payment failure visibility, recovery CTA       | FR-043                 |
| [restore-purchase.md](./restore-purchase.md)       | Mobile restore purchase flow for entitlement resync                       | FR-043                 |
| [tier-upgrade-flow.md](./tier-upgrade-flow.md)     | Multi-step flow from gated action -> checkout -> entitlement confirmation | FR-041, FR-042         |

---

## FR Reference Key

- **FR-040**: Free tier includes core recipe/sharing/import/manual-planning/grocery-list/cooking-mode access.
- **FR-041**: Premium tier unlocks private visibility, AI generation/suggestions/optimization, auto meal plans, waste optimization, online ordering, trainer nutrition planning.
- **FR-042**: Premium features are gated with clear upgrade prompts and value preview.
- **FR-043**: Data and non-premium functionality are retained on lapse/cancellation.
- **NFR-003**: Accessible labels for interactive elements.
- **NFR-004**: Non-color-only state communication.
