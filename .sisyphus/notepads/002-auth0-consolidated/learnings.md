## T4 completed [2026-05-22]
- Created packages/shared/auth-types/src/dao/user.dao.ts (UserDAO class)
- Created packages/shared/auth-types/src/dao/index.ts
- Created packages/shared/auth-types/src/dao/__tests__/user.dao.test.ts (6 vitest tests)
- Added "./dao" export to auth-types package.json
- Note: listByAccount is a stub (no account_id on users table; accounts has owner_sub)
- Drizzle import: drizzle-orm/postgres-js (confirmed installed at ^0.45.2)
- Mock pattern: inline vi.fn() chains per method (no vi.mock() needed for pure class)

## T8 completed [2026-05-22]
- Created packages/infra/identity/auth0-action/post-login.js (Action v13)
- Created docs/runbooks/auth0-action-routing.md
- Auth0 CLI NOT installed — staging deploy is manual via Dashboard
- Action uses event.client.name.startsWith('KitchenSink') for routing
- Action Secrets: KITCHENSINK_WEBHOOK_URL, KITCHENSINK_M2M_CLIENT_ID, KITCHENSINK_M2M_CLIENT_SECRET, KITCHENSINK_M2M_AUDIENCE, AUTH0_DOMAIN
- Claims CLAIM_NS = 'https://kitchensink.app/claims/'
