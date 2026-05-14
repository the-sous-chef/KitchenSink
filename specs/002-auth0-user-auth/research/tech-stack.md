# Tech Stack Rationale

**Branch**: `002-auth0-user-auth` | **Date**: 2026-05-09
**Status**: Complete | **Sources**: [plan.md](../plan.md), [research.md](../research.md)

---

## Overview

The tech stack for feature 002 is derived from explicit architecture decisions in [research.md](../research.md) and implementation decomposition in [plan.md](../plan.md). Each section captures chosen technology, rationale, and operational implications.

---

## Identity Provider and SDK Layer

### Choice

**Auth0** as primary identity provider across web and mobile.

### Rationale

- Required feature set includes social login, MFA, lifecycle APIs (block/unblock/delete/link/unlink), and hosted reset/enrollment flows.
- Existing spec/plan artifacts are already written around Auth0 Actions + Management API patterns.

### Dependencies

- Web: `@auth0/nextjs-auth0` v4.x
- Mobile: `react-native-auth0` v5.5.0

---

## Token and JWT Validation Layer

### Choice

**`jwks-rsa` + `jose`** for Lambda-side JWT verification and key retrieval.

### Rationale

- `jwks-rsa` provides `kid`-scoped key retrieval with in-process cache controls.
- `jose` provides robust verification semantics for signature/claim validation.
- Source artifacts define two-layer caching posture: in-process key cache + API Gateway authorizer result cache.

### Operational Implication

Short authorizer cache TTL balances latency/cost and suspension enforcement lag.

---

## Session Storage Strategy

### Choice

- **Mobile**: Keychain/Keystore via `expo-secure-store`
- **Web**: httpOnly/Secure/SameSite session cookies

### Rationale

- Minimizes token exfiltration risk and aligns with FR-006 and NFR security posture.
- Preserves consistent refresh semantics across platforms while using storage appropriate to each runtime.

---

## API Authorization Boundary

### Choice

**API Gateway + Lambda REQUEST authorizer** with policy/context output.

### Rationale

- Needed for custom authorization decisions (suspension `403`) and context injection (`userId`) beyond plain JWT structural validation.
- Supports centralized gate for all protected API routes (FR-038..FR-042).

### Decision Note

Research explicitly notes that HTTP API Lambda authorizer remains an evaluation alternative; current plan is REST + Lambda REQUEST authorizer.

---

## Data Persistence and ORM

### Choice

PostgreSQL-compatible relational store + Drizzle ORM for `User` and `Account` entities.

### Rationale

- Strong fit for identity/account relational integrity and cascade delete semantics.
- Drizzle gives typed schema/migration workflow aligned with TypeScript strictness requirements.

---

## Async Reliability Components

### Choice

- **SQS deletion queue + DLQ** for Auth0 deletion retries
- **EventBridge Scheduler** for nightly Auth0↔DB reconciliation

### Rationale

- Handles transient Management API failures without blocking user-visible account deletion completion.
- Provides deterministic recovery path for post-registration/write-failure orphan scenarios.

---

## Observability and Operations

### Choice

- `@aws-lambda-powertools/logger`
- CloudWatch metrics/alarms
- AWS X-Ray tracing
- `@sentry/aws-serverless`

### Rationale

- Meets explicit full-observability clarification requirement in `spec.md` and NFR-012..NFR-015 coverage.
- Supports incident response across synchronous auth paths and async lifecycle workers.

---

## Platform and Tooling Context

| Layer         | Stack                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Language      | TypeScript 5.x                                                            |
| Runtime       | Node.js 22.x (Lambda runtime context), Node.js 24+ (monorepo root engine) |
| Test stack    | Vitest + Playwright                                                       |
| Infra-as-code | CDK v2 (`aws-cdk-lib`)                                                    |

---

## Trade-Off Summary

| Decision                       | Benefit                                   | Cost                                                |
| ------------------------------ | ----------------------------------------- | --------------------------------------------------- |
| Auth0-managed identity         | Fast delivery of complex auth flows       | Vendor dependency and rate-limit management         |
| Lambda authorizer custom logic | Fine-grained policy/context control       | Extra authorizer complexity vs simple JWT-only path |
| Async deletion/reconciliation  | Reliability under third-party/API failure | Additional queue/scheduler operational surfaces     |
| Cross-platform SDK split       | Native UX parity web/mobile               | Two SDK integration surfaces to maintain            |

---

## Conclusion

The selected stack is coherent with the existing feature specification and implementation plan: it prioritizes secure identity lifecycle correctness, cross-platform UX parity, and operational resilience over minimal-complexity auth setup.
