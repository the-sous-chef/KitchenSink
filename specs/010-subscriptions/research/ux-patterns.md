# UX Patterns: Subscription Conversion and Retention

**Branch**: `010-subscriptions` | **Date**: 2026-05-09
**Status**: Complete | **Source**: [spec.md](../spec.md), [plan.md](../plan.md), [research.md](../research.md)

---

## 1. Paywall Placement Hierarchy

### 1.1 Contextual First, Global Second

For premium-gated actions, use this hierarchy:

1. **Inline contextual hint** near disabled or locked control
2. **Action-triggered paywall modal** when user attempts gated action
3. **Dedicated pricing page** for full comparison and checkout choice

This matches `FR-042` (clear upgrade prompts) while minimizing hard-interrupt friction.

---

### 1.2 Recommended Trigger Moments

| User Action                         | Prompt Pattern                    | Why                                  |
| ----------------------------------- | --------------------------------- | ------------------------------------ |
| Toggle recipe visibility to private | Inline lock + modal on submit     | High intent, immediate value framing |
| Tap AI generate / optimize          | Modal with example output preview | Demonstrates premium differentiation |
| Attempt auto meal planning          | Tier comparison drawer            | Helps user map value to workflow     |
| Attempt online grocery ordering     | Inline card + CTA                 | Commerce intent is already high      |

---

## 2. Tier Comparison Table Pattern

Use a persistent table with:

- **Rows = capabilities** grouped by workflow (recipes, AI, planning, commerce, nutrition)
- **Columns = Free / Premium**
- Explicit references to product behaviors in `FR-040` vs `FR-041`
- CTA variants: `Start trial`, `Upgrade monthly`, `Upgrade annual`

Design requirement: do not rely on color-only differences (aligns to `NFR-004`).

---

## 3. Trial Onboarding Pattern

### 3.1 Trial Entry

When user starts trial:

1. Confirm trial length and renewal date.
2. Present premium capability checklist with first actions.
3. Guide to one high-value action in each premium cluster:
    - private visibility
    - AI generation
    - auto-planning
    - online ordering (where applicable)

### 3.2 Trial Progress Nudges

- Day 1: “Set one recipe private.”
- Day 3: “Try AI meal suggestions.”
- Day 7/11 (depending on trial policy): “See what you’ll keep after trial.”

This supports conversion target (`SC-006`) without dark-pattern pressure.

---

## 4. Dunning and Grace-Period UX

From plan lifecycle (`past_due` + grace), dunning UX should include:

- persistent but non-blocking banner for payment failure
- countdown to grace-period end
- one-click “Update payment method” via billing portal
- explicit statement: “Your data remains safe” (supports `FR-043`)

Avoid immediate hard lock unless grace expires.

---

## 5. Cancellation and Downgrade UX

### 5.1 Cancellation Confirmation Pattern

Before cancellation finalization:

- summarize what remains on free tier (`FR-040`)
- summarize what is lost (`FR-041` premium-only actions)
- restate data retention contract (`FR-043`)

### 5.2 Downgrade State Messaging

After downgrade:

- keep existing private data inaccessible for new private actions unless upgraded again
- show upgrade affordance where premium controls now disabled
- provide billing history and renewal path

---

## 6. Restore Purchase on Mobile Pattern

For cross-device confidence, include “Restore purchase” entry point in billing settings with:

- current account identity confirmation
- refresh subscription entitlement state
- success/failure messaging with support fallback

Even with Stripe-first backend, UX should reserve pathway for store-based restoration parity when mobile billing is introduced.

---

## 7. Accessibility and Interaction Rules

- Every upgrade CTA must be reachable by keyboard and announced by accessible label (`NFR-003`).
- Locked-state indicators require icon + text, not color-only (`NFR-004`).
- Modal dismissal must preserve user context so users can continue on free-tier path.

---

## 8. Pattern-to-Requirement Mapping

| Pattern                                    | Requirement Link     |
| ------------------------------------------ | -------------------- |
| Contextual paywall + modal + pricing page  | `FR-042`             |
| Free-tier baseline flows remain usable     | `FR-040`             |
| Premium capability framing                 | `FR-041`             |
| Cancellation/downgrade data-safe messaging | `FR-043`             |
| Accessible prompt interactions             | `NFR-003`, `NFR-004` |
