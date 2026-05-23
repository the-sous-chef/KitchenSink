# Auth0 Post-Login Action Routing — Deployment Runbook

## Action Metadata

| Field           | Value                                                |
| --------------- | ---------------------------------------------------- |
| Action ID       | `57dc6f06-f2bf-41b0-ba11-9cec06f3de83`               |
| Current version | v12                                                  |
| Target version  | v13                                                  |
| Runtime         | Node 22                                              |
| Trigger         | Post-Login                                           |
| Source file     | `packages/infra/identity/auth0-action/post-login.js` |

---

## Overview

This action is shared between the **KitchenSink** and **Armoury** tenants. It routes login events based on the Auth0 client name:

- **KitchenSink clients** (`client.name` starts with `"KitchenSink"`): upserts the user in the identity-webhooks service and injects namespaced JWT claims.
- **All other clients** (Armoury, etc.): routes to the Armoury path. No KitchenSink claims are injected.

---

## Claims Injected

### KitchenSink clients

| Claim                                       | Value                                                               |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `https://kitchensink.app/claims/sub`        | `event.user.user_id`                                                |
| `https://kitchensink.app/claims/account_id` | `userData.accountId` from identity-webhooks response                |
| `https://kitchensink.app/claims/tier`       | `userData.tier` from identity-webhooks response (default: `"free"`) |

### Armoury clients

None. No new claims are added for Armoury clients.

---

## Required Action Secrets

Configure all secrets in **Auth0 Dashboard → Actions → Library → Action `57dc6f06-f2bf-41b0-ba11-9cec06f3de83` → Secrets**.

| Secret Key                      | Description                                               | Example                                                |
| ------------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| `AUTH0_DOMAIN`                  | Auth0 tenant domain (no `https://`)                       | `your-tenant.us.auth0.com`                             |
| `KITCHENSINK_WEBHOOK_URL`       | Full URL to identity-webhooks upsert endpoint             | `https://api.identity.kitchensink.app/v1/users/upsert` |
| `KITCHENSINK_M2M_CLIENT_ID`     | M2M application client ID for identity-webhooks           | _(from Auth0 Dashboard → Applications)_                |
| `KITCHENSINK_M2M_CLIENT_SECRET` | M2M application client secret                             | _(from Auth0 Dashboard → Applications)_                |
| `KITCHENSINK_M2M_AUDIENCE`      | API audience for identity-webhooks                        | `https://identity.kitchensink.app/`                    |
| `ARMOURY_WEBHOOK_URL`           | Existing Armoury webhook URL (optional; skip if not used) | `https://api.armoury.app/auth/webhook`                 |

> **Security**: Never commit secret values to source control. All values must be set exclusively through the Auth0 Dashboard Secrets UI.

---

## Armoury Team Preflight Checklist

**This checklist must be completed before deploying to staging or production.**

- [ ] Notify Armoury team in **#platform-alerts** Slack with at least **24 hours advance notice** before any staging or production deploy.
- [ ] Confirm the `ARMOURY_WEBHOOK_URL` secret is correctly set in the target environment before deploying.
- [ ] Verify that the Armoury routing branch (`else` path) has not been modified — diff `post-login.js` against v12 to confirm.
- [ ] Confirm Armoury staging routes correctly after test deploy (see smoke tests below).
- [ ] Smoke test both KitchenSink and Armoury logins on staging before promoting to production.
- [ ] Rollback plan confirmed: revert to v12 via **Auth0 Dashboard → Actions → Library → action → Version History → v12 → Restore**.

---

## Deploy Procedure

> Auth0 CLI is not available. All deploys are manual via the Auth0 Dashboard.

### Step 1 — Prepare secrets

Ensure all secrets listed in [Required Action Secrets](#required-action-secrets) are configured in the target environment (staging or production) before deploying code.

### Step 2 — Copy action code

Open `packages/infra/identity/auth0-action/post-login.js` and copy the full file contents.

### Step 3 — Paste into Auth0 Dashboard

1. Navigate to **Auth0 Dashboard → Actions → Library**.
2. Search for action ID `57dc6f06-f2bf-41b0-ba11-9cec06f3de83` or name **Post-Login Routing**.
3. Click the action to open the editor.
4. Replace the existing code with the copied contents.
5. Bump the version label to **v13** in the version notes field.
6. Click **Deploy**.

### Step 4 — Verify secrets

In the action editor, open the **Secrets** tab and confirm all required secrets are present and non-empty.

### Step 5 — Run staging smoke tests

See [Smoke Tests](#smoke-tests) below.

### Step 6 — Promote to production

Repeat Steps 2–5 against the production Auth0 tenant after staging smoke tests pass.

---

## Smoke Tests

### KitchenSink login

1. Log in with a user via a client whose name starts with `KitchenSink`.
2. Decode the returned access token (e.g. via [jwt.io](https://jwt.io)).
3. Verify the following claims are present:
    - `https://kitchensink.app/claims/sub` — matches the user's `sub`
    - `https://kitchensink.app/claims/account_id` — non-null string
    - `https://kitchensink.app/claims/tier` — `"free"` or a valid tier value
4. Verify the identity-webhooks service received the upsert request (check service logs).

### Armoury login

1. Log in with a user via an Armoury client (name does **not** start with `KitchenSink`).
2. Decode the returned access token.
3. Verify **none** of the `https://kitchensink.app/claims/*` claims are present.
4. Verify Armoury-specific behavior is unchanged (check Armoury application logs).

---

## Rollback

If either smoke test fails or an incident is detected post-deploy:

1. Navigate to **Auth0 Dashboard → Actions → Library → action `57dc6f06-f2bf-41b0-ba11-9cec06f3de83`**.
2. Open **Version History**.
3. Select **v12**.
4. Click **Restore** and then **Deploy**.
5. Notify Armoury team in **#platform-alerts** that the rollback has been executed.

---

## Error Handling

The action is designed to **fail open** — errors from the identity-webhooks upsert or M2M token fetch are logged but do not block user login. If the webhook is unavailable, the user will still be authenticated; custom claims will simply be absent from the token.

Monitor Auth0 action logs (**Dashboard → Monitoring → Logs**) for `[post-login]` prefixed error entries after each deploy.
