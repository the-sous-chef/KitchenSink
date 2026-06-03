# Research: Clerk AWS Architecture

> **Migration Note (2026-05-26):** This feature was migrated from Auth0 to Clerk. References to Auth0 below are historical context retained for architectural decision traceability. See `spec.md` for the current Clerk-based design.

**Feature**: `002-user-auth`
**Date**: 2026-04-14
**Status**: Complete
**Scope**: Production-grade AWS infrastructure for Clerk authentication layer — authorizer, async deletion, reconciliation, observability, distributed tracing, CDK patterns.

---

## 1. API Gateway Authorizer: REST Lambda REQUEST vs HTTP API Lambda Authorizer

### Decision: REST API + Lambda REQUEST Authorizer

**The core problem with HTTP API JWT authorizer** is that it validates the token's standard claims (`iss`, `aud`, `exp`, `nbf`, `iat`, `scope`/`scp`) and passes all token claims downstream via `$request.context.authorizer.jwt.claims` — including custom namespaced claims from Clerk `app_metadata` (e.g., `https://sous-chef.io/userId`). However, it **cannot enforce custom claim values at the authorizer level** to shape an IAM policy, deny access based on a `status: suspended` flag, or inject context values per-route. It is a binary pass/fail on standard OAuth claims only.

**HTTP API Lambda authorizer** (REQUEST type, not JWT type) is the missing comparison point: it allows custom logic and context injection while still using the HTTP API — potentially at lower cost and complexity than REST API. Evaluate this before committing to REST.

**REST API Lambda REQUEST authorizer** gives full control:

- Read any claim from the JWT, including `app_metadata` custom claims
- Return an IAM policy (allow/deny) shaped by claim values (e.g., deny `status: suspended` users with 403)
- Inject arbitrary key-value context into `$context.authorizer.*` for downstream Lambda functions — eliminating a DB lookup per request for the user ID
- Support multiple authorization methods (token + headers + query params) for internal admin impersonation detection

**When HTTP API JWT is sufficient**: If all routes need is "is this token valid for this audience?" with no custom claim logic, no context injection, and no suspension enforcement — HTTP API JWT is cheaper and simpler. For this feature, we need all three, so JWT alone is insufficient.

**When HTTP API Lambda authorizer suffices**: If custom claim logic and context injection are needed but a simpler integration is preferred, HTTP API + Lambda REQUEST authorizer may be a better fit than REST API. The spec should evaluate this option explicitly before locking in REST.

### JWKS Caching: Two-Layer Strategy

**Layer 1 — In-process per-client, per-`kid` LRU cache (Lambda lifetime)**
Use `jwks-rsa` with `cache: true`. The library caches keys-by-`kid` (not the full JWKS set) using an LRU with TTL `cacheMaxAge: 600_000` (10 minutes). The cache lives on each `JwksClient` instance; storing the client in module scope allows a warm Lambda container to reuse it. For a new or missing `kid`, or after cache expiry, a network fetch occurs. Do not rely on "JWKS fetched once per cold start" as the sole caching behavior — new `kid`s, cache evictions, and multiple client instances can trigger additional fetches.

```typescript
// Initialized once at module scope — survives across invocations in the same container
const jwksClient = jwksRsa.default({
    jwksUri: process.env.IDP_JWKS_URL!,
    cache: true,
    cacheMaxAge: 600_000, // 10 minutes
    rateLimit: true,
    jwksRequestsPerMinute: 10,
});
```

**Layer 2 — API Gateway policy cache (cross-Lambda)**
API Gateway caches the IAM policy returned by the authorizer, keyed on the Authorization header value (for TOKEN authorizers) or on a configurable identity source (for REQUEST authorizers). Set `resultsCacheTtl: Duration.seconds(300)` (5 minutes). Within that window, no Lambda invocation occurs for the same token — the cached policy is applied directly.

**Cache invalidation risk**: If a user is suspended in Clerk between policy cache TTL windows, a currently valid cached policy will continue to allow access for up to the TTL duration. For suspension enforcement: reduce TTL to `Duration.seconds(60)` for the authorizer. Note: JWTs are self-contained and cannot be individually revoked — Clerk recommends short-lived tokens (e.g., 1 hour) combined with short authorizer TTL for prompt revocation. Suspension lag = token lifetime + authorizer cache TTL.

**Recommendation**: Use `resultsCacheTtl: Duration.seconds(300)` for normal operation. If instantaneous suspension enforcement is required (security posture), drop to `Duration.seconds(0)` to disable caching — at the cost of one Lambda invocation per request.

### Context Injection

The authorizer returns a `context` object with scalar values only (strings, numbers, booleans — no nested objects). Downstream Lambda functions receive these as `event.requestContext.authorizer.<key>`. JSON-serialize complex values if needed.

```typescript
// Returned by the REQUEST authorizer
const context = {
    userId: payload.sub, // string — canonical Sous Chef user ID
    identityId: payload['https://sous-chef.io/identityId'], // string
    email: payload['https://sous-chef.io/email'], // string
    status: payload['https://sous-chef.io/status'], // string: 'active' | 'suspended'
    isImpersonating: 'false', // string (booleans as strings)
};
```

---

## 2. Async Deletion Queue: SQS + Lambda + DLQ

### Pattern

When account deletion succeeds in the Sous Chef database but the Clerk Backend API call fails, the Clerk deletion is queued for async retry rather than blocking the user.

```
DELETE /users/{id}
  │
  ├─► DB delete (User + Account + cascade)  ← Synchronous — must succeed
  │
  └─► Clerk delete attempt
        ├─ SUCCESS: Done
        └─ FAILURE: Enqueue { identityId, userId, attemptedAt, reason }
                      │
                      └─► SQS Standard Queue
                              │
                              ├─ visibilityTimeout = 6 × Lambda timeout
                              ├─ Lambda consumer (reads ApproximateReceiveCount)
                               │   ├─ Attempt IdP Backend API delete
                              │   ├─ SUCCESS → message deleted from queue
                              │   └─ FAILURE → changeMessageVisibility(exponential backoff)
                              │
                              └─ After maxReceiveCount (5) → DLQ
                                   retentionPeriod = 14 days
                                   CloudWatch Alarm → SNS → alert on DLQ depth > 0
```

### Exponential Backoff Implementation

SQS does not implement exponential backoff natively. After each failed processing attempt, the message re-enters the queue with the configured `visibilityTimeout`. For true exponential backoff, the Lambda must call `changeMessageVisibility` with a computed delay before throwing (which triggers the SQS retry).

```typescript
// Inside the SQS consumer Lambda
const receiveCount = Number(record.attributes.ApproximateReceiveCount);
const maxAttempts = 5;

if (receiveCount >= maxAttempts) {
    // Let the message go to DLQ — do not changeMessageVisibility
    throw new IdpDeletionMaxRetriesError(identityId);
}

try {
    await deleteIdpUser(identityId, managementApiToken);
    // Message auto-deleted on successful return
} catch (error) {
    // Exponential backoff: 30s, 60s, 120s, 240s, 480s
    const delaySeconds = Math.min(30 * Math.pow(2, receiveCount - 1), 900);

    await sqsClient.send(
        new ChangeMessageVisibilityCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: record.receiptHandle,
            VisibilityTimeout: delaySeconds,
        }),
    );

    throw error; // Signal failure to SQS event source mapping
}
```

### Partial Batch Failure

Use `reportBatchItemFailures: true` on the SQS event source mapping. This allows successfully-processed messages to be deleted while failed messages retry independently, rather than the entire batch retrying.

### DLQ Alarm

```typescript
const dlqAlarm = new cloudwatch.Alarm(this, 'DlqDepthAlarm', {
    metric: dlq.metricApproximateNumberOfMessagesVisible(),
    threshold: 1,
    evaluationPeriods: 1,
    alarmDescription: 'Identity deletion DLQ has unprocessed messages — manual intervention required',
});
```

---

## 3. Reconciliation Job: EventBridge Scheduler + Lambda

### EventBridge Scheduler vs Rules

EventBridge Scheduler (2022+) is preferred over EventBridge Rules for scheduled Lambda invocations because:

- Per-schedule retry policy with DLQ (Rules lack this)
- Flexible time windows (`flexibleTimeWindow`) to spread load
- Time zone–aware cron expressions
- Configurable `maximumEventAgeInSeconds` and `maximumRetryAttempts`
- No need for a Rule + Target + permissions construct chain

### Reconciliation Algorithm

The reconciliation job detects Clerk users without a corresponding Sous Chef database record and creates the missing records. This covers:

1. Post-registration action timeout during signup (Clerk user created, DB write never happened)
2. Failed initial DB write that exhausted all retries

**Efficient diffing strategy (up to ~1M users)**:

```
1. Fetch all Clerk user IDs (paginated, 100 per page via /api/v2/users?fields=user_id,app_metadata)
   - Filter to users created in the last 7 days (reconciliation window)
   - Use app_metadata.userId to get our canonical ID (if it exists)
   - Users with no app_metadata.userId are always orphaned

2. Fetch all active user IDs from our DB for the same 7-day window
   - SELECT id, identity_id FROM users WHERE created_at > NOW() - INTERVAL '7 days'

3. Set difference: IdP users NOT IN our DB users (by identity_id)
   → These are orphaned IdP users → create User + Account records + update app_metadata

4. Set difference: our DB users NOT IN IdP (by identity_id)
   → These should not exist (IdP is authoritative) → log for manual review, do not auto-delete
```

**Clerk Backend API pagination**: The `/api/v2/users` endpoint returns 100 users per page. Use `page` and `per_page` parameters. For large tenants, prefer checkpoint-based reconciliation (run every hour, check last 24h) over full scans.

**Rate limit handling**: Clerk Backend API has per-tenant rate limits (varies by plan). Use `p-limit` or `bottleneck` to cap concurrent requests. On 429, honor the `Retry-After` header and use the EventBridge Scheduler `maximumRetryAttempts` for Lambda-level retries.

### Schedule Configuration

Run nightly at 02:00 UTC (low-traffic window):

```typescript
const reconciliationSchedule = new scheduler.Schedule(this, 'ReconciliationSchedule', {
    schedule: scheduler.ScheduleExpression.cron({
        minute: '0',
        hour: '2',
        timeZone: TimeZone.UTC,
    }),
    flexibleTimeWindow: {
        mode: scheduler.FlexibleTimeWindowMode.FLEXIBLE,
        maximumWindowInMinutes: 15, // Spread invocation within 15-min window
    },
    target: new schedulerTargets.LambdaInvoke(reconciliationFn, {
        retryAttempts: 3,
        maxEventAge: Duration.hours(1),
    }),
});
```

---

## 4. CloudWatch Structured Logging with Sentry Drain

### Structured Log Format

All Lambda functions emit JSON to stdout. `@aws-lambda-powertools/logger` or `pino` provides structured JSON with zero config.

**Canonical log shape**:

```json
{
    "level": "INFO",
    "message": "User signup complete",
    "timestamp": "2026-04-14T02:00:00.000Z",
    "service": "auth-layer",
    "correlationId": "trace-id-from-apigw",
    "userId": "uuid-v4",
    "identityId": "idp|abc123",
    "environment": "production",
    "functionName": "identity user.created webhook",
    "xRayTraceId": "1-abc123"
}
```

### Sentry Drain Architecture (January 2026 State)

**Critical finding**: Sentry does **not** provide a native CloudWatch log drain endpoint. The Sentry "Log Drains" feature (released early 2026) targets HTTP webhooks, not CloudWatch Logs subscriptions.

**Two viable approaches**:

#### Option A: CloudWatch Subscription Filter → Lambda Forwarder (Recommended for this project)

```
CloudWatch Log Group
    │
    └─► Subscription Filter (JSON: level = "ERROR" OR "WARN")
              │
              └─► Lambda Forwarder
                      ├─ Decode Kinesis/CWL records
                      ├─ Parse structured JSON log
                      └─ Sentry.captureEvent() with full context
```

- Simple, low-cost for low-to-medium volume
- Limitation: **2 subscription filters per log group** (hard AWS limit)
- If X-Ray also uses a subscription filter, only 1 slot remains for Sentry

#### Option B: OTel Collector (`otelcol-contrib`) — Future-proof

```
CloudWatch Log Groups
    │
    └─► `awscloudwatchreceiver` (polls CWL API)
              │
              └─► OTel Collector pipeline
                      ├─ Filter/transform processor
                      └─► `otlphttp/sentry` exporter → Sentry OTLP endpoint
```

- Cloud-agnostic, supports future LogRocket/NewRelic without app changes (NFR-017)
- More complex to operate (ECS task or Lambda extension)
- Polling is not real-time (configurable interval, min ~30s)

**Recommendation for this project**: Start with **Option A** (Lambda forwarder) for simplicity. The 2-filter limit is not a constraint here since CloudWatch does not use subscription filters for X-Ray (X-Ray uses the X-Ray daemon/SDK directly, not CWL). Migrate to Option B (OTel Collector) if LogRocket or NewRelic integration is added (NFR-017).

---

## 5. Distributed Tracing: ADOT + X-Ray + Sentry

### ADOT Layer Migration (March 2026)

**Breaking change**: The CDK `adotInstrumentation` property and `AdotLayerVersion.*` helpers are **deprecated as of March 2026** (CDK PR #37209, merged 2026-03-09). The legacy `LambdaAdotExtensionLayer` ARNs still work but are no longer recommended.

**Current recommendation**: Use the optimized `AWSOpenTelemetryDistro*` layer ARNs directly via `LayerVersion.fromLayerVersionArn()`.

**Layer ARN pattern (us-east-1)**:

```
arn:aws:lambda:us-east-1:901920570463:layer:AWSOpenTelemetryDistroJs:5
```

Region-specific ARNs: https://aws-otel.github.io/docs/getting-started/lambda#adot-lambda-layer-arns

**Required environment variables**:

```
AWS_LAMBDA_EXEC_WRAPPER=/opt/otel-instrument
OTEL_SERVICE_NAME=auth-layer
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp.sentry.io:443
OTEL_EXPORTER_OTLP_HEADERS=sentry-dsn=https://<key>@o0.ingest.sentry.io/<id>
OTEL_PROPAGATORS=tracecontext,baggage,xray
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production
```

### Trace Propagation

API Gateway injects `X-Amzn-Trace-Id: Root=1-abc;Parent=def;Sampled=1` into all Lambda invocations automatically when X-Ray active tracing is enabled on the stage. The ADOT layer picks this up and propagates it as both W3C `traceparent` (OTel) and X-Ray format headers.

```
Client Request
    │ (no trace headers)
    ▼
API Gateway Stage (X-Ray active tracing ON)
    │ injects X-Amzn-Trace-Id
    ▼
Lambda Authorizer
    │ ADOT reads X-Amzn-Trace-Id, creates span
    │ propagates traceparent downstream
    ▼
Business Lambda
    │ ADOT continues trace
    │ Sentry SDK reads traceparent → links error to trace
    ▼
Aurora DSQL (via aws-sdk — auto-instrumented by ADOT)
```

### Sentry + OTel Integration

Sentry's JavaScript SDK (v8+) uses OTel under the hood when `openTelemetryInstrumentation` is enabled. When ADOT is active on the Lambda, the Sentry SDK reads the OTel trace context and attaches errors to the correct trace span automatically — no additional configuration required.

```typescript
import * as Sentry from '@sentry/aws-serverless';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENVIRONMENT,
    tracesSampleRate: 1.0,
    integrations: [Sentry.openTelemetryInstrumentation()],
});
```

---

## 6. CDK Patterns (CDK v2 TypeScript)

### Lambda REQUEST Authorizer with ADOT

```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

// ADOT optimized layer (March 2026+ recommended approach — NOT adotInstrumentation)
const adotLayer = lambda.LayerVersion.fromLayerVersionArn(
    this,
    'AdotLayer',
    `arn:aws:lambda:${this.region}:901920570463:layer:AWSOpenTelemetryDistroJs:5`,
);

const authorizerFn = new lambda.Function(this, 'AuthorizerFn', {
    runtime: lambda.Runtime.NODEJS_22_X,
    handler: 'index.handler',
    code: lambda.Code.fromAsset('dist/authorizer'),
    layers: [adotLayer],
    environment: {
        IDP_JWKS_URL: process.env.IDP_JWKS_URL!,
        IDP_AUDIENCE: process.env.IDP_AUDIENCE!,
        ENVIRONMENT: props.environment,
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/otel-instrument',
        OTEL_SERVICE_NAME: 'auth-authorizer',
        OTEL_PROPAGATORS: 'tracecontext,baggage,xray',
        SENTRY_DSN: process.env.SENTRY_DSN!,
    },
    tracing: lambda.Tracing.ACTIVE,
    timeout: Duration.seconds(10),
    memorySize: 256,
});

// Application Signals IAM policy (required for ADOT layer)
authorizerFn.addToRolePolicy(
    new iam.PolicyStatement({
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords', 'cloudwatch:PutMetricData'],
        resources: ['*'],
    }),
);

const authorizer = new apigateway.RequestAuthorizer(this, 'IdentityAuthorizer', {
    handler: authorizerFn,
    identitySources: [apigateway.IdentitySource.header('Authorization')],
    resultsCacheTtl: Duration.seconds(300), // 5-minute policy cache
});
```

### SQS Deletion Queue with DLQ

```typescript
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

const deletionDlq = new sqs.Queue(this, 'IdentityDeletionDlq', {
    retentionPeriod: Duration.days(14),
    encryption: sqs.QueueEncryption.SQS_MANAGED,
});

const deletionQueue = new sqs.Queue(this, 'IdentityDeletionQueue', {
    visibilityTimeout: Duration.seconds(60), // 6× Lambda timeout (10s × 6)
    retentionPeriod: Duration.days(4),
    encryption: sqs.QueueEncryption.SQS_MANAGED,
    deadLetterQueue: {
        queue: deletionDlq,
        maxReceiveCount: 5,
    },
});

const deletionWorkerFn = new lambda.Function(this, 'IdentityDeletionWorker', {
    runtime: lambda.Runtime.NODEJS_22_X,
    handler: 'index.handler',
    code: lambda.Code.fromAsset('dist/identity-deletion-worker'),
    timeout: Duration.seconds(10),
    memorySize: 128,
    environment: {
        QUEUE_URL: deletionQueue.queueUrl,
        IDP_JWKS_URL: process.env.IDP_JWKS_URL!,
        AUTH_SECRET_ARN: m2mSecret.secretArn,
    },
});

deletionWorkerFn.addEventSource(
    new lambdaEventSources.SqsEventSource(deletionQueue, {
        batchSize: 5,
        reportBatchItemFailures: true,
    }),
);

// DLQ depth alarm
new cloudwatch.Alarm(this, 'DlqDepthAlarm', {
    metric: deletionDlq.metricApproximateNumberOfMessagesVisible(),
    threshold: 1,
    evaluationPeriods: 1,
    alarmDescription: 'Identity deletion DLQ depth > 0 — manual IdP deletion required',
    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
});
```

### EventBridge Scheduler for Reconciliation

```typescript
import * as scheduler from '@aws-cdk-lib/aws-scheduler';
import * as schedulerTargets from '@aws-cdk-lib/aws-scheduler-targets';
import { TimeZone } from 'aws-cdk-lib';

const reconciliationFn = new lambda.Function(this, 'ReconciliationFn', {
    runtime: lambda.Runtime.NODEJS_22_X,
    handler: 'index.handler',
    code: lambda.Code.fromAsset('dist/reconciliation'),
    timeout: Duration.minutes(15),
    memorySize: 512,
    environment: {
        IDP_JWKS_URL: process.env.IDP_JWKS_URL!,
        AUTH_SECRET_ARN: m2mSecret.secretArn,
        DB_SECRET_ARN: dbSecret.secretArn,
    },
});

new scheduler.Schedule(this, 'ReconciliationSchedule', {
    schedule: scheduler.ScheduleExpression.cron({
        minute: '0',
        hour: '2',
        timeZone: TimeZone.UTC,
    }),
    flexibleTimeWindow: {
        mode: scheduler.FlexibleTimeWindowMode.FLEXIBLE,
        maximumWindowInMinutes: 15,
    },
    target: new schedulerTargets.LambdaInvoke(reconciliationFn, {
        retryAttempts: 3,
        maxEventAge: Duration.hours(1),
    }),
});
```

### CloudWatch Log Group + Subscription Filter (Sentry Forwarder)

```typescript
import * as logs from 'aws-cdk-lib/aws-logs';
import * as logsDest from 'aws-cdk-lib/aws-logs-destinations';

const logGroup = new logs.LogGroup(this, 'AuthLayerLogs', {
    logGroupName: '/sous-chef/auth-layer',
    retention: logs.RetentionDays.THREE_MONTHS,
    removalPolicy: RemovalPolicy.RETAIN,
});

const sentryForwarderFn = new lambda.Function(this, 'SentryForwarder', {
    runtime: lambda.Runtime.NODEJS_22_X,
    handler: 'index.handler',
    code: lambda.Code.fromAsset('dist/sentry-forwarder'),
    timeout: Duration.seconds(30),
    environment: {
        SENTRY_DSN: process.env.SENTRY_DSN!,
        ENVIRONMENT: props.environment,
    },
});

// Forward only ERROR and above to Sentry (filter pattern: JSON field match)
new logs.SubscriptionFilter(this, 'SentrySubscription', {
    logGroup,
    destination: new logsDest.LambdaDestination(sentryForwarderFn),
    filterPattern: logs.FilterPattern.stringValue('$.level', '=', 'ERROR'),
});
```

---

## 7. Key Gotchas and Production Warnings

| Gotcha                                                                 | Detail                                                                                                                                                           |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2 subscription filters per log group**                               | Hard AWS limit. If you need Sentry + another drain, use OTel Collector polling instead.                                                                          |
| **Authorizer context values are scalar only**                          | `context` object returned by REQUEST authorizer accepts only `string \| number \| boolean`. Nested objects are silently dropped. JSON-stringify complex values.  |
| **SQS `visibilityTimeout` ≥ 6× Lambda timeout**                        | If Lambda timeout = 10s, set queue `visibilityTimeout` = 60s. Otherwise a slow invocation re-queues while still processing.                                      |
| **ADOT `adotInstrumentation` CDK prop is legacy**                      | As of March 2026 (CDK PR #37209), use `LayerVersion.fromLayerVersionArn()` with optimized layer ARNs. Old `AdotLayerVersion` still works but is not maintained.  |
| **HTTP API JWT authorizer cannot deny suspended users**                | Cannot enforce `status: suspended` claim at the authorizer level. Must use REST API + Lambda authorizer.                                                         |
| **EventBridge Rules lack per-target retry DLQ**                        | Use EventBridge Scheduler for scheduled Lambda tasks. Rules do not support per-target retry policy or DLQ.                                                       |
| **Clerk user.created webhook action timeout is 20s**                   | If the action times out, Clerk retries once. If both attempts fail, the reconciliation job is the safety net.                                                    |
| **Clerk Backend API rate limits**                                      | Developer plan: ~2 req/s. Free plan: lower. Implement `p-limit` or `bottleneck` in the reconciliation Lambda.                                                    |
| **Policy cache staleness on suspension**                               | API Gateway policy cache TTL default 300s. Suspended users can still access for up to 5 minutes after blocking. Reduce TTL if immediate enforcement is required. |
| **`reportBatchItemFailures` requires partial success response format** | Lambda must return `{ batchItemFailures: [{ itemIdentifier: messageId }] }` for failed items. Not returning this causes the entire batch to retry.               |

---

## 8. Service Selection Summary

| Component                    | Selected Service                           | Alternative Rejected    | Rationale                                                                                             |
| ---------------------------- | ------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| **API authorizer**           | REST API + Lambda REQUEST authorizer       | HTTP API JWT authorizer | Custom claims, context injection, suspension enforcement (§1)                                         |
| **JWKS cache**               | `jwks-rsa` module scope + APIGW 300s TTL   | Secrets Manager cache   | Two-layer minimizes Clerk fetches and Lambda invocations (§1)                                         |
| **Clerk deletion retry**     | SQS Standard + Lambda + DLQ                | SNS+SQS, Step Functions | Cheaper, built-in retry via `maxReceiveCount`, exponential backoff via `changeMessageVisibility` (§2) |
| **Reconciliation scheduler** | EventBridge Scheduler                      | EventBridge Rules       | Per-target DLQ, retry policy, flexible time windows (§3)                                              |
| **Sentry log drain**         | CWL Subscription Filter → Lambda forwarder | OTel Collector          | Simpler for launch; migrate to OTel when LogRocket/NewRelic needed (§4)                               |
| **Distributed tracing**      | ADOT optimized layer + X-Ray + Sentry SDK  | DataDog, Lumigo         | Native AWS integration, OTel standard, Sentry SDK OTel support (§5)                                   |
| **CDK version**              | CDK v2 with TypeScript                     | CDK v1 (EOL)            | Required (§6)                                                                                         |
