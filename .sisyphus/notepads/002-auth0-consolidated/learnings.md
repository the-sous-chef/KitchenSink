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

## T5 completed [2026-05-22]
- Rewrote schema/accounts.ts to billing entity (ownerSub UNIQUE FK, tier varchar(32) default 'free')
- Updated account.ts types (no provider/providerAccountId; added AccountTier, ownerSub)
- Created dao/account.dao.ts (AccountDAO: findByOwnerSub, createForUser, upsert, updateTier, delete)
- Extended dao/index.ts to export AccountDAO
- Exported varcharCollateC from schema/users.ts
- typecheck: 0 errors; tests: all pass

## T10 completed [2026-05-22]
- Wired NestJS identity service to @kitchensink/auth-types: AuthorizerContext decorator, shared Drizzle schema, DATABASE_URL config
- Replaced DB_HOST/PORT/NAME/USERNAME/PASSWORD + AUTH0_CLIENT_ID/SECRET with single DATABASE_URL in env.schema.ts
- Created AppConfigModule (config.module.ts) using ConfigModule.forRoot with Zod validate
- database.module.ts: imports users/accounts/profiles from @kitchensink/auth-types/schema; uses DATABASE_URL
- auth.module.ts: removed ManagementClient; auth0.service.ts methods stubbed as no-ops
- users.service.ts + admin.service.ts: ctx.userId→ctx.sub, users.id→users.sub, accounts.userId→accounts.ownerSub, profiles.userId→profiles.userSub
- Orphaned local schema files (schema.ts, accounts.schema.ts) replaced with re-exports from @kitchensink/auth-types/schema
- integration.test.ts: updated ctx fixtures to AuthorizerContext shape (sub/email/isM2M/tokenType), mock data to new field names, assertions to new return shapes
- typecheck: 0 errors; tests: 14 passed (1 file)

## T9 completed [2026-05-22]
- Created src/handlers/post-login.ts: M2M-gated upsert handler keyed on sub (UserDAO + AccountDAO)
- Removed updateUserMetadataUserId from auth0.ts; removed all legacy db helpers from db.ts (only getDb remains)
- post-registration.ts stubbed to 410 Gone (superseded by post-login)
- deletion-worker.ts updated: UserDAO.findBySub(message.userSub) replaces lookupUserByIdAndAuth0Sub; UserId import removed
- reconciliation.ts updated: DAO-based upsert replaces ensureUserAccountProfile
- auth-types must be rebuilt (npm run build) before typechecking dependents — AccountDAO was missing from dist
- DAO class mock pattern: use `function` keyword in vi.fn().mockImplementation to avoid Vitest warning
- requireEnv reads process.env directly — set process.env in beforeEach rather than mocking the module
- typecheck: 0 errors; tests: 12 passed (2 files)
