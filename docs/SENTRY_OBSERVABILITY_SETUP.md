# Sentry Observability — Operator Setup

The code for Sentry across all four deployables + the CloudWatch→Sentry log drain has shipped (see
the plan at `docs/plans/2026-06-11-001-feat-sentry-observability-rollout-plan.md`). The integrations
stay **inert until the external configuration below is in place** — each SDK no-ops without its DSN,
and the source-map upload step no-ops without its token. None of these values are committed to the
repo.

## 1. Sentry org / projects

- Confirm the Sentry org plan includes **Logs** and **OTLP log ingestion** (the drain rides the OTLP
  logs endpoint, which is open beta).
- Projects (org `radicle-co`): `commise-web`, `commise-mobile`, plus the backend identity-service,
  identity-webhooks, and the dedicated **log-drain** project. Note each project's DSN and slug.

## 2. AWS SSM parameters (per stage — `prod` and `sandbox`)

The CDK reads these at deploy; create them as `String` parameters (the drain credential as
`SecureString`):

| Parameter                                                         | Used by                               |
| ----------------------------------------------------------------- | ------------------------------------- |
| `/kitchensink/sentry/webhook-dsn/{prod,sandbox}`                  | identity-webhooks Lambdas + forwarder |
| `/kitchensink/sentry/identity-service-dsn/{prod,sandbox}`         | identity service (ECS)                |
| `/kitchensink/sentry/log-drain-dsn/{prod,sandbox}` (SecureString) | log forwarder (`LOG_DRAIN_DSN`)       |

## 3. GitHub Actions (prod-deploy)

- Secret `SENTRY_AUTH_TOKEN` — scoped minimally to `project:releases` + `sourcemaps:write` for the
  backend project(s). Without it, the Lambda source-map upload step is skipped.
- Repo variable `SENTRY_WEBHOOKS_PROJECT` — the webhook project slug (gates the upload step).
- `SENTRY_RELEASE` is already wired to the commit SHA on the webhooks deploy + the ECS image tag.

## 4. Vercel (web — source maps upload during `next build`)

- Env vars: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG=radicle-co`, `SENTRY_PROJECT=commise-web`,
  `SENTRY_AUTH_TOKEN`, and `SENTRY_RELEASE` (set to the deployed commit SHA so runtime and upload
  releases match).

## 5. EAS (mobile — source maps upload during the native build)

- EAS secret `SENTRY_AUTH_TOKEN`; `EXPO_PUBLIC_SENTRY_DSN` available to the build.
- Build with the new `production` EAS profile. Verify the Expo 53 native targets meet
  `@sentry/react-native` v8 minimums (iOS 15+).

## 6. Verification (staging)

- Trigger an unhandled error on each surface → exactly one **source-mapped** Issue in the correct
  per-service project.
- Confirm the log-drain project receives access/warning/error logs, with `START`/`END`/`REPORT` and
  EMF lines absent.
- Confirm `ReconciliationDrift` (and the user-event counts) still appear as CloudWatch metrics.
- Confirm runtime `release` equals the uploaded release on all four surfaces.

## DSN mapping

The concrete DSN values were provided out-of-band; place them in SSM (backend) / Vercel + EAS env
(web, mobile) / the apps' `.env.local`, never in source.
