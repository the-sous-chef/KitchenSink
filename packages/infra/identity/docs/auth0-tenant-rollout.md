# Auth0 Tenant Rollout Plan

This runbook hardens the Auth0 rollout for the identity topology in `002-auth0-user-auth`. It covers the three long-lived Auth0 tenants, the environment variables each package consumes, and the rule that Actions and Triggers are reused from the approved `tenant-template` instead of authored in this repository.

## Tenant strategy

| Environment | Auth0 tenant          | Purpose                                                                                                  | Deploy source                                                                   | Promotion gate                                                                                                     |
| ----------- | --------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `dev`       | `kitchensink-dev`     | Local and shared developer validation. Safe for destructive tests and LocalStack-backed identity checks. | Manual tenant-template import plus environment secrets in the dev secret store. | Identity web/mobile smoke tests pass against dev callback and logout URLs.                                         |
| `staging`   | `kitchensink-staging` | Production-shaped rehearsal tenant with staging API audience and staging database/SQS targets.           | Promote the same tenant-template version used in dev after checklist sign-off.  | API authorizer, post-registration sync, deletion worker, and reconciliation checks pass using staging secrets.     |
| `prod`      | `kitchensink-prod`    | Live Sous Chef authentication and lifecycle tenant.                                                      | Promote the signed tenant-template release already validated in staging.        | Change approval confirms callback URLs, Management API scopes, webhook secrets, and monitoring alerts are present. |

## Environment-variable matrix

| Variable                         | Dev                                  | Staging                                  | Prod                                  | Used by                                     | Notes                                                                  |
| -------------------------------- | ------------------------------------ | ---------------------------------------- | ------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| `AUTH0_DOMAIN`                   | `kitchensink-dev.<region>.auth0.com` | `kitchensink-staging.<region>.auth0.com` | `kitchensink-prod.<region>.auth0.com` | web, mobile, identity-webhooks authorizer   | Issuer is derived as `https://${AUTH0_DOMAIN}/`.                       |
| `AUTH0_AUDIENCE`                 | Dev API identifier                   | Staging API identifier                   | Production API identifier             | web, mobile, authorizer                     | Must match the API Gateway/Sous Chef API audience configured in Auth0. |
| `AUTH0_CLIENT_ID`                | Dev web client ID                    | Staging web client ID                    | Prod web client ID                    | `packages/apps/sous-chef/web`               | Web application registration from tenant-template.                     |
| `AUTH0_CLIENT_SECRET`            | Dev web client secret                | Staging web client secret                | Prod web client secret                | `packages/apps/sous-chef/web`               | Store only in environment secret storage; never commit.                |
| `AUTH0_SECRET`                   | Dev session secret                   | Staging session secret                   | Prod session secret                   | `packages/apps/sous-chef/web`               | Rotate per environment; web cookie encryption depends on it.           |
| `AUTH0_BASE_URL`                 | Dev web base URL                     | Staging web base URL                     | Prod web base URL                     | `packages/apps/sous-chef/web`               | Must align with allowed callback/logout URLs.                          |
| `EXPO_PUBLIC_AUTH0_DOMAIN`       | Dev tenant domain                    | Staging tenant domain                    | Prod tenant domain                    | `packages/apps/sous-chef/mobile`            | Public mobile config only; no secrets.                                 |
| `EXPO_PUBLIC_AUTH0_CLIENT_ID`    | Dev native client ID                 | Staging native client ID                 | Prod native client ID                 | `packages/apps/sous-chef/mobile`            | Native application registration from tenant-template.                  |
| `EXPO_PUBLIC_AUTH0_AUDIENCE`     | Dev API identifier                   | Staging API identifier                   | Prod API identifier                   | `packages/apps/sous-chef/mobile`            | Must match `AUTH0_AUDIENCE`.                                           |
| `AUTH0_M2M_CLIENT_ID`            | Dev M2M client ID                    | Staging M2M client ID                    | Prod M2M client ID                    | identity-webhooks deletion/reconciliation   | Management API client from tenant-template.                            |
| `AUTH0_M2M_CLIENT_SECRET`        | Dev M2M secret                       | Staging M2M secret                       | Prod M2M secret                       | identity-webhooks deletion/reconciliation   | Secret-store only; rotate before prod cutover.                         |
| `AUTH0_POST_REGISTRATION_SECRET` | Dev webhook secret                   | Staging webhook secret                   | Prod webhook secret                   | identity-webhooks post-registration handler | Shared with the reused Action secret binding.                          |
| `AUTH0_JWKS_URI`                 | Dev JWKS URI                         | Staging JWKS URI                         | Prod JWKS URI                         | identity-webhooks authorizer                | Expected form: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`.        |
| `DATABASE_URL`                   | Dev RDS/local URL                    | Staging RDS URL                          | Prod RDS URL                          | identity service, identity-webhooks         | Tenant-specific users sync into the matching environment database.     |
| `DELETION_QUEUE_URL`             | Dev SQS URL                          | Staging SQS URL                          | Prod SQS URL                          | identity service, deletion worker           | Queue/DLQ are environment-scoped by the identity infra stack.          |

## Actions and Triggers reuse

- Reuse the `tenant-template` Auth0 Actions package for post-registration sync, MFA assignment, social-linking support, suspension/reactivation hooks, and any trigger wiring already defined there.
- Bind tenant-specific secrets and URLs through the Auth0 tenant configuration layer; do not fork Action source in this repository.
- Keep Action code ownership with the tenant-template release process. This identity repo consumes the resulting tenant contract through environment variables and webhook/API endpoints only.
- If a missing Action behavior is discovered, open a tenant-template change request instead of adding a new Action here.

## Rollout checklist

Complete the checklist once per environment before promotion:

- [ ] Tenant exists with expected name: `kitchensink-dev`, `kitchensink-staging`, or `kitchensink-prod`.
- [ ] Web and native Auth0 applications are imported from the approved `tenant-template` version.
- [ ] API audience matches `AUTH0_AUDIENCE` and the API Gateway authorizer configuration.
- [ ] Allowed callback URLs, logout URLs, and mobile deep-link callbacks match the deployed environment.
- [ ] Management API M2M application has only the required lifecycle scopes for deletion, reconciliation, and metadata updates.
- [ ] Post-registration Action points at the environment identity webhook URL and uses `AUTH0_POST_REGISTRATION_SECRET`.
- [ ] Authorizer has the correct issuer, audience, and JWKS URI for the tenant.
- [ ] Deletion queue and DLQ URLs belong to the same environment as the tenant.
- [ ] Smoke tests cover login, callback exchange, protected-route access, logout, signup sync, and account deletion queueing.
- [ ] No new Auth0 Actions are authored in this repository; all Actions/Triggers are reused from `tenant-template`.
