# Technical Plan: Feature 010 — Subscriptions & Monetization

**Feature**: `010-subscriptions`
**Status**: Active — product decisions closed 2026-05-10; implementation not yet started

---

## 1. Architecture Overview

### System Context

```
User clicks "Upgrade" → Backend creates Stripe Checkout Session
    ↓
Stripe-hosted payment page
    ↓
checkout.session.completed webhook → provision subscription in DB
    ↓
User on premium: @RequirePremium() decorator gates all FR-041 features
    ↓
Ongoing: invoice.paid / updated / deleted webhooks keep DB in sync
    ↓
User manages via Stripe Customer Portal (no custom UI needed)
```

### Stripe Billing Stack

| Component               | Technology                                  | Rationale                                                 |
| ----------------------- | ------------------------------------------- | --------------------------------------------------------- |
| Checkout                | Stripe Checkout (hosted)                    | PCI-compliant; no custom payment UI                       |
| Subscription management | Stripe Customer Portal                      | Handles upgrade/downgrade/cancel; no custom UI            |
| Webhook handling        | `@golevelup/nestjs-stripe` v3.0.0           | NestJS DI, auto signature verification, decorator routing |
| Idempotency             | `webhook_events` table                      | Stripe retries for 72h; must be deduplicated              |
| Feature gating          | `@RequirePremium()` decorator + `PlanGuard` | Composable with `JwtAuthGuard`, testable                  |

### Subscription States

```
free ──────────────────────────────────────────────────→ premium
  │                                                               │
  │  checkout.session.completed                                   │ customer.subscription.deleted
  │                                                               │
  ▼                                                               │
trialing (14 days) ──────→ active ──────→ past_due (grace 7d) ──→ canceled
                            │                    │
                            │ invoice.payment_    │ user updates
                            │ failed              │ payment method
                            ▼                    ▼
                       active               active
```

---

## 2. Data Model

### Account Entity Additions (002-user-auth)

```typescript
// Add to existing Account entity
@Column({ type: 'varchar', default: 'free' })
plan: 'free' | 'premium';

@Column({ type: 'varchar', default: 'inactive' })
subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive';

@Column({ type: 'varchar', nullable: true })
stripeCustomerId: string | null;

@Column({ type: 'varchar', nullable: true })
stripeSubscriptionId: string | null;

@Column({ type: 'timestamptz', nullable: true })
currentPeriodEnd: Date | null;

@Column({ type: 'boolean', default: false })
cancelAtPeriodEnd: boolean;

@Column({ type: 'timestamptz', nullable: true })
trialEndsAt: Date | null;
```

### webhook_events Table (Idempotency)

```sql
CREATE TABLE webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id  VARCHAR(255) UNIQUE NOT NULL,
  event_type      VARCHAR(100) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'processing',  -- processing | processed | failed
  error           TEXT,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_accounts_stripe_customer_id ON accounts(stripe_customer_id);
CREATE INDEX idx_accounts_stripe_subscription_id ON accounts(stripe_subscription_id);
```

---

## 3. API Contracts

### Billing Endpoints

| Method | Path                       | Auth             | Description                                                |
| ------ | -------------------------- | ---------------- | ---------------------------------------------------------- |
| `POST` | `/v1/billing/checkout`     | Required         | Create Stripe Checkout Session → redirect to Stripe        |
| `POST` | `/v1/billing/portal`       | Required         | Create Stripe Customer Portal session → redirect to Stripe |
| `GET`  | `/v1/billing/subscription` | Required         | Get current subscription status                            |
| `POST` | `/v1/billing/webhook`      | Stripe signature | Handle all Stripe webhook events                           |

### Request/Response Shapes

```typescript
// POST /v1/billing/checkout
Request (empty body — uses user's existing Stripe customer or creates one):
{}

Response:
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/..."
}

// POST /v1/billing/portal
Request (empty body):
{}

Response:
{
  "portalUrl": "https://billing.stripe.com/session/..."
}

// GET /v1/billing/subscription
Response:
{
  "plan": "premium",
  "status": "active",
  "currentPeriodEnd": "2026-07-09T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "trialEndsAt": null
}
```

### Webhook Event Routing

| Stripe Event                           | Handler                     | Action                                                                                              |
| -------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| `checkout.session.completed`           | `handleCheckoutCompleted`   | Provision: set `plan='premium'`, store `stripeCustomerId`/`stripeSubscriptionId`, `status='active'` |
| `invoice.paid`                         | `handleInvoicePaid`         | Confirm renewal: update `currentPeriodEnd`, `status='active'`                                       |
| `invoice.payment_failed`               | `handlePaymentFailed`       | Set `status='past_due'`; send failure email                                                         |
| `customer.subscription.updated`        | `handleSubscriptionUpdated` | Sync plan, status, `currentPeriodEnd`, `cancelAtPeriodEnd`                                          |
| `customer.subscription.deleted`        | `handleSubscriptionDeleted` | Downgrade: set `plan='free'`, `status='canceled'`, clear Stripe IDs                                 |
| `customer.subscription.trial_will_end` | `handleTrialEnding`         | Send trial-ending notification (fires 3 days before end)                                            |

---

## 4. Feature Gating Map

### @RequirePremium() Applied Per Feature

| Feature                     | Spec | FR     | Endpoint                                  | Guard               |
| --------------------------- | ---- | ------ | ----------------------------------------- | ------------------- |
| Private recipe visibility   | 001  | FR-003 | `PATCH /recipes/:id/visibility`           | `@RequirePremium()` |
| Clone-to-private (imported) | 004  | FR-011 | `POST /recipes/import` (visibility param) | `@RequirePremium()` |
| AI recipe generation        | 005  | FR-016 | `POST /ai/generate`                       | `@RequirePremium()` |
| AI instruction optimization | 005  | FR-019 | `POST /ai/optimize-instructions`          | `@RequirePremium()` |
| AI meal suggestions         | 006  | FR-025 | `POST /meal-plans/suggest`                | `@RequirePremium()` |
| Auto-generated meal plans   | 006  | FR-026 | `POST /meal-plans/generate`               | `@RequirePremium()` |
| Food waste optimization     | 006  | FR-027 | `POST /meal-plans/optimize-waste`         | `@RequirePremium()` |
| Online grocery ordering     | 007  | FR-031 | `POST /grocery-lists/:id/order`           | `@RequirePremium()` |
| Trainer nutrition planning  | 009  | FR-038 | `POST /nutrition/client-plans`            | `@RequirePremium()` |

### PlanGuard Implementation

```typescript
// billing/guards/plan.guard.ts
@Injectable()
export class PlanGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredPlan = this.reflector.getAllAndOverride<string>(REQUIRED_PLAN_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredPlan) return true;

        const { user } = context.switchToHttp().getRequest();
        const isActive = ['active', 'trialing'].includes(user.subscriptionStatus);
        const isPastDueWithinGrace = this.withinGracePeriod(user);

        if (user.plan === requiredPlan && (isActive || isPastDueWithinGrace)) return true;

        throw new ForbiddenException({
            code: 'PREMIUM_REQUIRED',
            message: 'This feature requires a premium subscription.',
            upgradeUrl: '/billing/upgrade',
        });
    }

    private withinGracePeriod(user: Account): boolean {
        if (user.subscriptionStatus !== 'past_due' || !user.currentPeriodEnd) return false;
        const gracePeriodDays = 7;
        return differenceInDays(new Date(), user.currentPeriodEnd) <= gracePeriodDays;
    }
}
```

### Upgrade Prompt Response (for UI)

When `PlanGuard` throws `ForbiddenException`, the NestJS exception layer formats it as:

```json
{
    "statusCode": 403,
    "error": "Forbidden",
    "message": "This feature requires a premium subscription.",
    "code": "PREMIUM_REQUIRED",
    "upgradeUrl": "/billing/upgrade"
}
```

Frontend intercepts `403 PREMIUM_REQUIRED` and shows upgrade CTA instead of generic error.

---

## 5. Module Structure

```
src/
├── billing/
│   ├── billing.module.ts
│   ├── billing.controller.ts      -- checkout, portal, subscription endpoints
│   ├── billing.service.ts          -- Stripe checkout/portal session creation
│   ├── webhook/
│   │   ├── webhook.controller.ts   -- /v1/billing/webhook (Stripe signature verified)
│   │   ├── webhook.service.ts     -- routes events to handlers, idempotency check
│   │   └── handlers/
│   │       ├── checkout.handler.ts
│   │       ├── invoice.handler.ts
│   │       ├── subscription.handler.ts
│   │       └── trial-ending.handler.ts
│   ├── decorators/
│   │   └── require-plan.decorator.ts   -- @RequirePremium()
│   └── guards/
│       └── plan.guard.ts
│
├── auth/
│   └── jwt-auth.guard.ts          -- from 002; composed with PlanGuard
```

### BillingModule Setup

```typescript
// billing/billing.module.ts
@Module({
    imports: [
        StripeModule.forRootAsync({
            useFactory: (config: ConfigService) => ({
                apiKey: config.get('STRIPE_SECRET_KEY'),
                webhookConfig: {
                    stripeSecrets: {
                        account: config.get('STRIPE_WEBHOOK_SECRET'),
                    },
                    requestBodyProperty: 'rawBody',
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [BillingController, WebhookController],
    providers: [BillingService, WebhookService, PlanGuard],
    exports: [BillingService],
})
export class BillingModule {}
```

### main.ts Requirement

```typescript
// src/main.ts
const app = await NestFactory.create(AppModule, { rawBody: true });
// Enables raw body for Stripe webhook signature verification
```

---

## 6. Open Questions (OQ from Research)

| #    | Question                         | Decision                                         |
| ---- | -------------------------------- | ------------------------------------------------ |
| OQ-1 | Free tier recipe count limit?    | Unlimited public recipes (no count cap)          |
| OQ-2 | Family/household plan?           | Future consideration; not in v1 scope            |
| OQ-3 | Annual-only vs monthly+annual?   | Both: $6.99/mo and $59.99/yr                     |
| OQ-4 | Past-due silent vs notification? | Show banner on all pages when `past_due`         |
| OQ-5 | Stripe Tax (EU/UK)?              | Defer; implement when expanding to EU/UK markets |

---

## 7. Key Decisions

| Decision          | Choice                                  | Rationale                                                 |
| ----------------- | --------------------------------------- | --------------------------------------------------------- |
| Pricing           | $6.99/mo or $59.99/yr                   | Competitive with Mealime/Sabor; reflects AI feature depth |
| Trial             | 14-day free trial                       | Stripe native support; industry standard                  |
| Checkout          | Stripe Checkout (hosted)                | No PCI scope; fastest to ship                             |
| Portal            | Stripe Customer Portal                  | Handles plan switch, cancel, payment update; no custom UI |
| Upgrade proration | `always_invoice`                        | User pays and gets access immediately                     |
| Downgrade timing  | `schedule_at_period_end`                | User retains premium until period end                     |
| Grace period      | 7 days `past_due`                       | Reduces churn from transient payment failures             |
| Data on lapse     | Retain all data; gate actions not reads | FR-043 compliance                                         |
