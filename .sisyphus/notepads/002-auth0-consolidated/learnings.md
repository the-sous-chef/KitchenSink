## T8 completed [2026-05-22]
- Created packages/infra/identity/auth0-action/post-login.js (Action v13)
- Created docs/runbooks/auth0-action-routing.md
- Auth0 CLI NOT installed — staging deploy is manual via Dashboard
- Action uses event.client.name.startsWith('KitchenSink') for routing
- Action Secrets: KITCHENSINK_WEBHOOK_URL, KITCHENSINK_M2M_CLIENT_ID, KITCHENSINK_M2M_CLIENT_SECRET, KITCHENSINK_M2M_AUDIENCE, AUTH0_DOMAIN
- Claims CLAIM_NS = 'https://kitchensink.app/claims/'
