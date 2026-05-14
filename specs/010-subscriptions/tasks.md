# Tasks: Feature 010 — Subscriptions & Monetization

**Generated**: 2026-05-09
**Last updated**: 2026-05-10 (added TASK-028; closed open decisions)
**Source artifacts**: plan.md (311 lines), spec.md, research.md
**Status**: Ready for implementation

---

## Dependency Order

```
US-1 (Tiers & Gating) ──→ US-2 (Checkout & Billing) ──→ US-3 (Webhooks & Lifecycle)
        │                                                           │
        └──────────────────────────────────────────────────────────┘
                                    ↓
                          US-4 (Upgrade Prompts & UI)
```

---

## User Story 1 — Free and Premium Subscription Tiers (P3)

> Gate premium features; free tier delivers full core value.

### TASK-001 · Install & configure `@golevelup/nestjs-stripe`

- **Type**: Setup
- **Effort**: S
- **Depends on**: —
- Add `@golevelup/nestjs-stripe@^3.0.0` and `stripe` to `package.json`
- Add env vars to Zod config schema: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_ANNUAL`
- Update `src/main.ts` to enable `rawBody: true` on `NestFactory.create`
- **Acceptance**: `npm run build` passes; env schema validates new vars

### TASK-002 · Extend `Account` entity with subscription columns

- **Type**: Data model
- **Effort**: S
- **Depends on**: TASK-001
- Add to existing `Account` entity (from 002-auth0-user-auth):
    - `plan: 'free' | 'premium'` (default `'free'`)
    - `subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'` (default `'inactive'`)
    - `stripeCustomerId: string | null`
    - `stripeSubscriptionId: string | null`
    - `currentPeriodEnd: Date | null`
    - `cancelAtPeriodEnd: boolean` (default `false`)
    - `trialEndsAt: Date | null`
- Write Drizzle migration for new columns
- **Acceptance**: Migration runs cleanly; existing accounts default to `plan='free'`, `subscriptionStatus='inactive'`

### TASK-003 · Create `webhook_events` idempotency table

- **Type**: Data model
- **Effort**: S
- **Depends on**: TASK-001
- Create `webhook_events` table: `id` (Stripe event ID, PK), `type`, `processedAt`
- Write Drizzle migration
- **Acceptance**: Migration runs; duplicate event IDs are rejected by PK constraint

### TASK-004 · Implement `@RequirePremium()` decorator

- **Type**: Feature
- **Effort**: S
- **Depends on**: TASK-002
- Create `src/billing/decorators/require-plan.decorator.ts`
- `@RequirePremium()` sets metadata key `PLAN_REQUIRED = 'premium'`
- **Acceptance**: Decorator compiles; metadata readable via `Reflector`

### TASK-005 · Implement `PlanGuard`

- **Type**: Feature
- **Effort**: M
- **Depends on**: TASK-004
- Create `src/billing/guards/plan.guard.ts`
- Guard reads `PLAN_REQUIRED` metadata; if set, checks `request.user.plan === 'premium'`
- Grace period logic: `past_due` + within 7 days of `currentPeriodEnd` → allow access
- On denial: throw `ForbiddenException` with body `{ statusCode: 403, error: 'Forbidden', message: 'This feature requires a premium subscription.', code: 'PREMIUM_REQUIRED', upgradeUrl: '/billing/upgrade' }`
- **Acceptance**: Unit tests cover: free user denied, premium user allowed, past_due within grace allowed, past_due beyond grace denied

### TASK-006 · Apply `@RequirePremium()` to all gated endpoints

- **Type**: Feature
- **Effort**: M
- **Depends on**: TASK-005
- Apply decorator to all endpoints per Feature Gating Map (plan.md §4):
    - `PATCH /recipes/:id/visibility` (FR-003)
    - `POST /recipes/import` with `visibility=private` param (FR-011)
    - `POST /ai/generate` (FR-016)
    - `POST /ai/optimize-instructions` (FR-019)
    - `POST /meal-plans/suggest` (FR-025)
    - `POST /meal-plans/auto-generate` (FR-026)
    - `POST /meal-plans/waste-optimize` (FR-027)
    - `POST /grocery-lists/:id/order` (FR-031)
    - `POST /nutrition/client-plans` (FR-038)
- Register `PlanGuard` in each relevant module
- **Acceptance**: Each gated endpoint returns `403 PREMIUM_REQUIRED` for free-tier users; premium users pass through

### TASK-007 · Unit tests for `PlanGuard` and `@RequirePremium()`

- **Type**: Test
- **Effort**: M
- **Depends on**: TASK-005, TASK-006
- Test file: `src/billing/guards/plan.guard.spec.ts`
- Cover: free denied, premium allowed, past_due grace window, past_due expired, missing metadata (no guard applied)
- **Acceptance**: All tests pass; coverage ≥ 90% on guard file

---

## User Story 2 — Checkout & Billing Management (P3)

> Users can subscribe via Stripe Checkout and manage via Customer Portal.

### TASK-008 · Scaffold `BillingModule`

- **Type**: Setup
- **Effort**: S
- **Depends on**: TASK-001
- Create `src/billing/billing.module.ts` with `StripeModule.forRootAsync` config (plan.md §5)
- Register `BillingController`, `WebhookController`, `BillingService`, `WebhookService`, `PlanGuard`
- Export `BillingService`
- Import `BillingModule` in `AppModule`
- **Acceptance**: App bootstraps without error; `BillingModule` visible in module graph

### TASK-009 · Implement `BillingService` — checkout session

- **Type**: Feature
- **Effort**: M
- **Depends on**: TASK-008, TASK-002
- `createCheckoutSession(userId: string): Promise<{ checkoutUrl: string }>`
- Look up or create Stripe Customer for user (store `stripeCustomerId` on first creation)
- Create `stripe.checkout.sessions.create` with:
    - `mode: 'subscription'`
    - `line_items`: monthly or annual price ID
    - `trial_period_days: 14`
    - `subscription_data.proration_behavior: 'always_invoice'`
    - `success_url`, `cancel_url`
- Return `{ checkoutUrl: session.url }`
- **Acceptance**: Integration test (Stripe test mode) creates session and returns URL

### TASK-010 · Implement `BillingService` — customer portal session

- **Type**: Feature
- **Effort**: S
- **Depends on**: TASK-009
- `createPortalSession(userId: string): Promise<{ portalUrl: string }>`
- Require `stripeCustomerId` on account; throw `BadRequestException` if missing
- Create `stripe.billingPortal.sessions.create`
- Return `{ portalUrl: session.url }`
- **Acceptance**: Returns portal URL for users with active subscription

### TASK-011 · Implement `BillingService` — get subscription status

- **Type**: Feature
- **Effort**: S
- **Depends on**: TASK-002
- `getSubscriptionStatus(userId: string): Promise<SubscriptionStatusDto>`
- Read from DB (no Stripe API call): `plan`, `subscriptionStatus`, `currentPeriodEnd`, `cancelAtPeriodEnd`, `trialEndsAt`
- **Acceptance**: Returns correct DTO; free users return `plan='free'`, `status='inactive'`

### TASK-012 · Implement `BillingController`

- **Type**: Feature
- **Effort**: S
- **Depends on**: TASK-009, TASK-010, TASK-011
- `POST /v1/billing/checkout` → `BillingService.createCheckoutSession` (JWT auth required)
- `POST /v1/billing/portal` → `BillingService.createPortalSession` (JWT auth required)
- `GET /v1/billing/subscription` → `BillingService.getSubscriptionStatus` (JWT auth required)
- Add `@UseGuards(JwtAuthGuard)` to all three
- **Acceptance**: E2E tests confirm 401 without token, correct responses with valid token

### TASK-013 · Unit tests for `BillingService`

- **Type**: Test
- **Effort**: M
- **Depends on**: TASK-009, TASK-010, TASK-011
- Mock Stripe SDK; test checkout session creation, portal session creation, status retrieval
- Test error paths: missing `stripeCustomerId` for portal, Stripe API errors
- **Acceptance**: All tests pass; coverage ≥ 85% on `billing.service.ts`

---

## User Story 3 — Subscription Lifecycle & Webhook Handling (P3)

> Stripe webhooks keep DB in sync; subscription state transitions are reliable.

### TASK-014 · Implement `WebhookController`

- **Type**: Feature
- **Effort**: S
- **Depends on**: TASK-008
- Create `src/billing/webhook/webhook.controller.ts`
- `POST /v1/billing/webhook` — no JWT auth; Stripe signature verified by `@golevelup/nestjs-stripe`
- Route to `WebhookService.handleEvent(event)`
- **Acceptance**: Controller registered; invalid signatures return 400

### TASK-015 · Implement `WebhookService` with idempotency

- **Type**: Feature
- **Effort**: M
- **Depends on**: TASK-003, TASK-014
- Create `src/billing/webhook/webhook.service.ts`
- Check `webhook_events` table for `event.id`; if exists, return early (idempotent)
- Insert `event.id` before processing
- Route to correct handler based on `event.type`
- **Acceptance**: Duplicate event IDs are silently skipped; new events are processed once

### TASK-016 · Implement `checkout.handler.ts` — provision subscription

- **Type**: Feature
- **Effort**: M
- **Depends on**: TASK-015
- Handle `checkout.session.completed`
- Look up account by `stripeCustomerId` (or `metadata.userId`)
- Set: `plan='premium'`, `subscriptionStatus='active'` (or `'trialing'` if trial), `stripeCustomerId`, `stripeSubscriptionId`, `currentPeriodEnd`
- **Acceptance**: After event, account has `plan='premium'`; free-tier user gains premium access

### TASK-017 · Implement `invoice.handler.ts` — renewal & payment failure

- **Type**: Feature
- **Effort**: M
- **Depends on**: TASK-015
- Handle `invoice.paid`: update `currentPeriodEnd`, set `subscriptionStatus='active'`
- Handle `invoice.payment_failed`: set `subscriptionStatus='past_due'`; trigger email notification (log stub acceptable for v1)
- **Acceptance**: `invoice.paid` resets status to active; `invoice.payment_failed` sets past_due

### TASK-018 · Implement `subscription.handler.ts` — sync & cancellation

- **Type**: Feature
- **Effort**: M
- **Depends on**: TASK-015
- Handle `customer.subscription.updated`: sync `plan`, `subscriptionStatus`, `currentPeriodEnd`, `cancelAtPeriodEnd`
- Handle `customer.subscription.deleted`: set `plan='free'`, `subscriptionStatus='canceled'`, clear `stripeCustomerId`/`stripeSubscriptionId`; retain all user data (FR-043)
- **Acceptance**: Deleted subscription downgrades user to free; all recipes/data retained

### TASK-019 · Implement `trial-ending.handler.ts` — trial notification

- **Type**: Feature
- **Effort**: S
- **Depends on**: TASK-015
- Handle `customer.subscription.trial_will_end` (fires 3 days before trial end)
- Log notification event; stub email send (real email integration deferred)
- **Acceptance**: Handler invoked; notification logged with user ID and trial end date

### TASK-020 · Integration tests for webhook handlers

- **Type**: Test
- **Effort**: L
- **Depends on**: TASK-016, TASK-017, TASK-018, TASK-019
- Use Stripe test fixtures for each event type
- Test idempotency: send same event twice, verify DB updated once
- Test state transitions: free → premium, active → past_due, active → canceled
- Test data retention on cancellation (FR-043)
- **Acceptance**: All state transitions verified; idempotency confirmed; data retention confirmed

---

## User Story 4 — Upgrade Prompts & Frontend Integration (P3)

> Free-tier users see contextual upgrade prompts; 403 responses are intercepted.

### TASK-021 · Frontend HTTP interceptor for `403 PREMIUM_REQUIRED`

- **Type**: Feature
- **Effort**: M
- **Depends on**: TASK-005
- In Next.js web app: add Axios/fetch interceptor that detects `{ code: 'PREMIUM_REQUIRED' }`
- Show upgrade CTA modal/banner instead of generic error
- CTA links to `POST /v1/billing/checkout` flow
- **Acceptance**: Attempting a premium action as free user shows upgrade prompt, not error toast

### TASK-022 · Upgrade prompt components (web)

- **Type**: Feature
- **Effort**: M
- **Depends on**: TASK-021
- Create reusable `<UpgradePrompt>` component with:
    - Feature name and value proposition copy
    - "Start Free Trial" CTA button
    - Accessible name via `aria-label` (NFR-003)
    - Icon + text label (not color-only) for premium badge (NFR-004)
- Apply to all gated feature entry points (FR-042)
- **Acceptance**: Component renders; Playwright `getByRole` finds CTA; color is not sole state indicator

### TASK-023 · Subscription status banner for `past_due` accounts

- **Type**: Feature
- **Effort**: S
- **Depends on**: TASK-011
- Show persistent banner on all pages when `subscriptionStatus === 'past_due'`
- Banner: "Your payment failed. Update your payment method to keep premium access." + link to portal
- **Acceptance**: Banner visible for past_due users; hidden for active/free users

### TASK-024 · Mobile upgrade prompts (React Native / Expo)

- **Type**: Feature
- **Effort**: M
- **Depends on**: TASK-021
- In Expo app: intercept `403 PREMIUM_REQUIRED` responses
- Show bottom sheet or modal with upgrade CTA
- Deep-link to web checkout (Stripe Checkout not embeddable in RN)
- **Acceptance**: Premium action on mobile shows upgrade sheet; tapping CTA opens browser to checkout URL

### TASK-025 · E2E tests — upgrade flow (Playwright)

- **Type**: Test
- **Effort**: M
- **Depends on**: TASK-022, TASK-023
- Test: free user hits gated feature → upgrade prompt appears
- Test: past_due banner visible on dashboard
- Test: premium user accesses gated feature without prompt
- **Acceptance**: All Playwright scenarios pass; `getByRole` assertions on CTA buttons succeed

---

## User Story 5 — Data Retention on Subscription Lapse (P3)

> All user data is retained when premium lapses; only premium actions are gated.

### TASK-026 · Verify data retention policy in cancellation handler

- **Type**: Feature / Compliance
- **Effort**: S
- **Depends on**: TASK-018
- Confirm `customer.subscription.deleted` handler does NOT delete any user data
- Confirm private recipes remain in DB (visibility gated, not deleted)
- Add explicit comment in handler referencing FR-043
- **Acceptance**: Code review confirms no data deletion; integration test verifies recipe count unchanged after cancellation

### TASK-027 · Read-only access for lapsed premium content

- **Type**: Feature
- **Effort**: M
- **Depends on**: TASK-006, TASK-026
- Private recipes: lapsed user can still READ their own private recipes (visibility gated for others, not owner)
- AI-generated content: readable but new generation blocked
- Confirm `PlanGuard` only gates write/action endpoints, not read endpoints for owned content
- **Acceptance**: Lapsed user can view their private recipes; cannot create new private recipes or use AI features

### TASK-028 · Mobile subscription status display and portal deep-link

- **Type**: Feature
- **Effort**: S
- **Depends on**: TASK-011, TASK-024
- In the Expo app, add an "Account / Subscription" screen that:
    - Calls `GET /v1/billing/subscription` and displays current plan, status, and period end date
    - Shows a "Manage Subscription" button that calls `POST /v1/billing/portal` and opens the returned `portalUrl` in the system browser (`Linking.openURL`)
    - Shows a "Upgrade to Premium" button for free-tier users that opens the web checkout URL in the system browser
    - Displays a persistent in-app banner when `subscriptionStatus === 'past_due'` (mirrors TASK-023 web behavior)
- **Acceptance**: Free user sees upgrade CTA; active premium user sees plan details and manage button; past_due user sees recovery banner; all buttons open correct URLs in system browser

---

## Summary

| #        | Task                                                       | Type       | Effort | Story |
| -------- | ---------------------------------------------------------- | ---------- | ------ | ----- |
| TASK-001 | Install & configure `@golevelup/nestjs-stripe`             | Setup      | S      | US-1  |
| TASK-002 | Extend `Account` entity with subscription columns          | Data model | S      | US-1  |
| TASK-003 | Create `webhook_events` idempotency table                  | Data model | S      | US-1  |
| TASK-004 | Implement `@RequirePremium()` decorator                    | Feature    | S      | US-1  |
| TASK-005 | Implement `PlanGuard`                                      | Feature    | M      | US-1  |
| TASK-006 | Apply `@RequirePremium()` to all gated endpoints           | Feature    | M      | US-1  |
| TASK-007 | Unit tests for `PlanGuard` and `@RequirePremium()`         | Test       | M      | US-1  |
| TASK-008 | Scaffold `BillingModule`                                   | Setup      | S      | US-2  |
| TASK-009 | Implement `BillingService` — checkout session              | Feature    | M      | US-2  |
| TASK-010 | Implement `BillingService` — customer portal session       | Feature    | S      | US-2  |
| TASK-011 | Implement `BillingService` — get subscription status       | Feature    | S      | US-2  |
| TASK-012 | Implement `BillingController`                              | Feature    | S      | US-2  |
| TASK-013 | Unit tests for `BillingService`                            | Test       | M      | US-2  |
| TASK-014 | Implement `WebhookController`                              | Feature    | S      | US-3  |
| TASK-015 | Implement `WebhookService` with idempotency                | Feature    | M      | US-3  |
| TASK-016 | Implement `checkout.handler.ts` — provision subscription   | Feature    | M      | US-3  |
| TASK-017 | Implement `invoice.handler.ts` — renewal & payment failure | Feature    | M      | US-3  |
| TASK-018 | Implement `subscription.handler.ts` — sync & cancellation  | Feature    | M      | US-3  |
| TASK-019 | Implement `trial-ending.handler.ts` — trial notification   | Feature    | S      | US-3  |
| TASK-020 | Integration tests for webhook handlers                     | Test       | L      | US-3  |
| TASK-021 | Frontend HTTP interceptor for `403 PREMIUM_REQUIRED`       | Feature    | M      | US-4  |
| TASK-022 | Upgrade prompt components (web)                            | Feature    | M      | US-4  |
| TASK-023 | Subscription status banner for `past_due` accounts         | Feature    | S      | US-4  |
| TASK-024 | Mobile upgrade prompts (React Native / Expo)               | Feature    | M      | US-4  |
| TASK-025 | E2E tests — upgrade flow (Playwright)                      | Test       | M      | US-4  |
| TASK-026 | Verify data retention policy in cancellation handler       | Feature    | S      | US-5  |
| TASK-027 | Read-only access for lapsed premium content                | Feature    | M      | US-5  |
| TASK-028 | Mobile subscription status display and portal deep-link    | Feature    | S      | US-4  |

**Total tasks: 28**
**Effort breakdown**: 11× Small, 14× Medium, 1× Large, 2× Setup
**Test tasks**: TASK-007, TASK-013, TASK-020, TASK-025 (4 dedicated test tasks)

---

## Functional Requirements Coverage

| FR     | Requirement                          | Covered by                             |
| ------ | ------------------------------------ | -------------------------------------- |
| FR-040 | Free tier access to core features    | TASK-005, TASK-006                     |
| FR-041 | Premium tier unlocks gated features  | TASK-004, TASK-005, TASK-006           |
| FR-042 | Upgrade prompts for free-tier users  | TASK-021, TASK-022, TASK-024, TASK-028 |
| FR-043 | Data retention on subscription lapse | TASK-018, TASK-026, TASK-027           |
