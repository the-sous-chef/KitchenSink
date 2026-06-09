# IdP Backend API Retry Strategy

**Scope**: `packages/services/identity-webhooks/src/common/retry.ts` | **Updated**: 2026-06-01

## Retry Policy

All outbound IdP Backend API calls (user lookup, user update, user deletion) use the following policy:

| Parameter                  | Value                   | Rationale                                   |
| -------------------------- | ----------------------- | ------------------------------------------- |
| **Max attempts**           | 3                       | Balance resiliency against IdP rate limits  |
| **Base delay**             | 100ms                   | Fast retry on transient errors              |
| **Backoff multiplier**     | 2x exponential          | `100ms → 200ms → 400ms`                     |
| **Max delay**              | 5s                      | Cap to avoid IdP rate limit penalties       |
| **Jitter**                 | ±25%                    | Spread retries to reduce thundering herd    |
| **Retryable status codes** | 429, 502, 503, 504      | Rate limited or IdP temporarily unavailable |
| **Non-retryable**          | 400, 401, 403, 404, 410 | Client error or permanent failure           |

## Implementation

Located in [`retry.ts`](./retry.ts):

```typescript
/**
 * @implements REQ-016 REQ-IF-009 FR-016 FR-025 FR-026 ARCH-011 MOD-011
 */
export const retry = async <T>(
    operation: () => Promise<T>,
    options?: { maxAttempts?: number; baseDelayMs?: number },
): Promise<T> => {
    /* ... */
};
```

## Circuit Breaker (Future)

If failure rate exceeds 50% over 1 minute, IdP calls are temporarily bypassed and events queued for later reconciliation. This prevents cascading failures during IdP outages.

## References

- [plan.md](../../../../specs/002-user-auth/plan.md) §Integration Points
- [spec.md](../../../../specs/002-user-auth/spec.md) §NFR-011a
