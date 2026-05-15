# Identity Performance and Reliability Checklist

This checklist documents the Phase 7 hardening targets for the API Gateway REQUEST authorizer and async account-deletion worker. It is a manual validation guide only; do not run live AWS calls from this document.

## Authorizer latency and reliability targets

Measure the Lambda authorizer duration at the function boundary, excluding upstream client latency. Use CloudWatch Logs Insights or an equivalent observability export after a staging smoke run.

| Metric        | Target                                                            | Gate                                                                                    |
| ------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| p50 latency   | `<= 25 ms` for warm invocations                                   | Healthy cache/JWKS path and no database lookup regression.                              |
| p95 latency   | `<= 100 ms`                                                       | Acceptable protected-route latency for normal traffic.                                  |
| p99 latency   | `<= 250 ms`                                                       | No sustained long-tail failures under token-validation load.                            |
| Error rate    | `< 0.1%` over the validation window                               | Errors must be attributable to invalid tokens or expected denies, not handler failures. |
| Deny behavior | Suspended users and malformed/expired JWTs return `Deny` policies | No unhandled exception should leak as an allow.                                         |

Checklist:

- [ ] Validate issuer and audience match the environment tenant.
- [ ] Verify JWKS cache hits after the first successful key fetch.
- [ ] Confirm expired, malformed, wrong-audience, and suspended-user tokens produce deny policies.
- [ ] Confirm a valid active-user token produces an allow policy with the canonical user context.
- [ ] Review p50/p95/p99 and error-rate metrics after the smoke window.
- [ ] Roll back if p95 exceeds `100 ms`, p99 exceeds `250 ms`, or handler errors exceed `0.1%`.

## Deletion-worker retry and DLQ behavior

The account-deletion path is asynchronous. The identity service queues a deletion request; the worker deletes the Auth0 user and cascades local records. Failures should retry through SQS redelivery before moving to the DLQ.

Expected behavior:

- Transient Auth0 Management API failures are retried by leaving the message unacknowledged.
- Database or Auth0 throttling failures should be logged with correlation identifiers and retried through the queue visibility timeout.
- Poison messages eventually move to the deletion DLQ after the configured max receive count.
- Duplicate messages are idempotent: a missing Auth0 user or already-deleted local record is treated as terminal success when the requested deletion is already complete.
- DLQ alarms page the owning team before manual replay.

Checklist:

- [ ] Worker logs include the queued user ID, Auth0 subject, request ID, attempt count, and terminal outcome.
- [ ] Retryable failures do not delete or mutate unrelated users.
- [ ] Non-retryable validation failures are logged and isolated for operator review.
- [ ] DLQ redrive procedure is documented for staging/prod operations.
- [ ] E2E deletion-worker coverage remains green before release.

## Lightweight failure-injection runbook

Use this runbook in a non-production environment. The steps are intentionally procedural and contain no live AWS commands.

### Authorizer injection

1. Select the staging tenant and confirm `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, and `AUTH0_JWKS_URI` point to staging.
2. Capture a valid access token for a seeded active user.
3. Send protected-route requests with these token variants:
    - valid active-user token;
    - expired token;
    - token signed for the wrong audience;
    - malformed bearer token;
    - valid token for a suspended user.
4. Record allow/deny policy outcomes and Lambda duration percentiles.
5. Pass only if valid active-user traffic is allowed, all invalid/suspended cases are denied, and p50/p95/p99 stay within the targets above.

### Deletion-worker injection

1. Seed a staging user with matching Auth0 and Sous Chef database records.
2. Queue an account-deletion request through the identity service staging API.
3. Temporarily force a retryable Auth0 Management API failure by using a staging-only invalid M2M secret or a denylisted Management API scope in the secret store.
4. Confirm the worker logs a retryable failure and the message remains eligible for redelivery instead of being acknowledged.
5. Restore the valid secret/scope and allow the message to redeliver.
6. Confirm the worker completes deletion, removes local records according to cascade rules, and does not create a DLQ message.
7. Repeat with a deliberately invalid poison payload in staging; confirm it reaches the DLQ after the configured max receive count and is not replayed automatically.

### Evidence to attach to release notes

- Authorizer latency table with p50/p95/p99 and error-rate window.
- Sample allow and deny policy outcomes with user identifiers redacted.
- Deletion-worker retry log excerpt with correlation ID.
- DLQ observation for the poison-message test.
- Confirmation that no production tenant, queue, database, or Auth0 Management API resource was used for injection.
