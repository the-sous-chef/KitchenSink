# Quickstart: Auth0 User Authentication

**Feature**: `002-auth0-user-auth`
**Date**: 2026-04-14

This guide gets a local development environment running for the auth feature: Auth0 tenant, local database, environment variables, and the Lambda functions running locally.

---

## Prerequisites

- Node.js 24+ (`.nvmrc` at repo root — run `nvm use`)
- AWS CLI configured with a dev account (`aws configure`)
- Auth0 account (free Developer plan is sufficient)
- Auth0 CLI: `brew install auth0` or `npm install -g auth0-cli`
- Docker (for local PostgreSQL)
- `direnv` (for `.envrc` auto-loading — `brew install direnv`)

---

## 1. Auth0 Tenant Setup

### Create Applications

In the [Auth0 Dashboard](https://manage.auth0.com):

**Web Application (Next.js)**

- Type: Regular Web Application
- Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
- Allowed Logout URLs: `http://localhost:3000`
- Allowed Web Origins: `http://localhost:3000`
- Refresh Token Rotation: Enabled
- Refresh Token Expiration: Absolute, 2592000s (30 days)

**Mobile Application (Expo)**

- Type: Native
- Allowed Callback URLs: `sous-chef://auth/callback`, `exp://localhost:8081/auth/callback`
- Allowed Logout URLs: `sous-chef://auth/logout`
- Refresh Token Rotation: Enabled

**M2M Application (Lambda backend — post-registration, deletion, reconciliation)**

- Type: Machine to Machine
- Authorized APIs: Sous Chef API (see below) + Auth0 Management API
- Auth0 Management API scopes: `read:users`, `update:users`, `delete:users`, `create:users`

### Create API

- **Identifier** (audience): `https://api.sous-chef.io`
- Signing algorithm: RS256
- Token expiration: 86400s (24h)
- Enable RBAC: off (we use custom claims, not roles)

### Add Custom Claims Action

In Auth0 Dashboard → Actions → Library → Create Action → Post-Login flow:

```javascript
// Action: Add Custom Claims
exports.onExecutePostLogin = async (event, api) => {
    const namespace = 'https://sous-chef.io/';
    const metadata = event.user.app_metadata || {};

    if (metadata.userId) {
        api.accessToken.setCustomClaim(`${namespace}userId`, metadata.userId);
        api.accessToken.setCustomClaim(`${namespace}auth0Id`, event.user.user_id);
        api.accessToken.setCustomClaim(`${namespace}email`, event.user.email);
        api.accessToken.setCustomClaim(`${namespace}status`, metadata.status || 'active');
    }
};
```

Attach to: **Login / Post Login** flow.

### Post-Registration Action (deployed separately)

The post-registration Action lives in `packages/functions/auth0-post-registration/`. Deploy via:

```bash
auth0 actions deploy --file packages/functions/auth0-post-registration/src/index.ts
```

For local development, the reconciliation job is used as a substitute (post-reg actions cannot be mocked locally in Auth0).

---

## 2. Local Database

```bash
# Start PostgreSQL in Docker
docker run -d \
  --name sous-chef-dev \
  -e POSTGRES_USER=sous_chef \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=sous_chef_dev \
  -p 5432:5432 \
  postgres:16-alpine

# Wait for ready
until docker exec sous-chef-dev pg_isready -U sous_chef; do sleep 1; done

# Run migrations (from packages/infra/auth-layer)
npm run db:migrate --workspace=packages/infra/auth-layer
```

Schema migration files will be in `packages/infra/auth-layer/migrations/`.

---

## 3. Environment Variables

Copy `.envrc.example` to `.envrc` at the repo root and fill in:

```bash
# Auth0
export AUTH0_DOMAIN="your-tenant.us.auth0.com"
export AUTH0_AUDIENCE="https://api.sous-chef.io"

# Web app (Next.js) — from Auth0 Web Application
export AUTH0_CLIENT_ID="<web-client-id>"
export AUTH0_CLIENT_SECRET="<web-client-secret>"
export AUTH0_BASE_URL="http://localhost:3000"
export AUTH0_SECRET="<32-byte-random-string>"   # openssl rand -hex 32

# M2M app (Lambda functions)
export AUTH0_M2M_CLIENT_ID="<m2m-client-id>"
export AUTH0_M2M_CLIENT_SECRET="<m2m-client-secret>"

# Database
export DATABASE_URL="postgresql://sous_chef:dev_password@localhost:5432/sous_chef_dev"

# Sentry (optional for local dev — can be empty)
export SENTRY_DSN=""

# AWS (local Lambda testing)
export AWS_REGION="us-east-1"
export ENVIRONMENT="development"
```

Then: `direnv allow`

---

## 4. Install Dependencies

```bash
# From repo root
npm install
```

---

## 5. Running the Web App

```bash
npm run dev --workspace=packages/apps/web
# → http://localhost:3000
```

The Next.js app uses `@auth0/nextjs-auth0` with the App Router. The auth routes are at `/api/auth/[...auth0]`.

---

## 6. Running the Mobile App

```bash
npm run start --workspace=packages/apps/mobile
# → Expo DevTools at http://localhost:8081
# Scan QR code with Expo Go app
```

---

## 7. Running Lambda Functions Locally

Lambda functions can be invoked locally using `vitest` integration tests or the AWS SAM CLI:

```bash
# Unit tests (fast, no external services)
npm run test --workspace=packages/functions/auth-authorizer

# Integration tests (require local DB + Auth0 sandbox tokens)
npm run test:integration --workspace=packages/functions/auth-authorizer
```

To test the authorizer locally with a real JWT:

```bash
# Get a test token from Auth0
curl -X POST https://${AUTH0_DOMAIN}/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "'${AUTH0_M2M_CLIENT_ID}'",
    "client_secret": "'${AUTH0_M2M_CLIENT_SECRET}'",
    "audience": "'${AUTH0_AUDIENCE}'",
    "grant_type": "client_credentials"
  }'
```

---

## 8. CDK Deployment (dev environment)

```bash
cd packages/infra/auth-layer

# Bootstrap (once per account/region)
npx cdk bootstrap aws://ACCOUNT-ID/us-east-1

# Deploy
npx cdk deploy AuthLayerStack --context environment=dev
```

**Required SSM/Secrets Manager values before deploy**:

- `AUTH0_DOMAIN` → SSM Parameter Store: `/sous-chef/dev/auth0/domain`
- `AUTH0_M2M_CLIENT_SECRET` → Secrets Manager: `sous-chef/dev/auth0/m2m`
- `SENTRY_DSN` → Secrets Manager: `sous-chef/dev/sentry/dsn`

---

## 9. Running All Checks

```bash
# From repo root
npm run typecheck   # turbo run typecheck
npm run lint        # turbo run lint format:check
npm run test        # turbo run test
```

All four must pass before any commit (enforced by `pre-commit` hook via husky).
