# Task 6 — Remove unsafe client-side JWT claim trust (mobile)

## Scope

- Reviewed required files:
  - `packages/apps/sous-chef/mobile/src/auth/auth0.ts`
  - `packages/apps/sous-chef/mobile/src/hooks/useAuth.ts`
  - `packages/apps/sous-chef/mobile/src/hooks/useUserProfile.ts`
- Searched all mobile source for JWT decode patterns and related token parsing:
  - `grep -rn "jwt\|decode\|atob\|split.*\.\." packages/apps/sous-chef/mobile/src/ --include="*.ts" --include="*.tsx"`
  - Additional targeted checks for `.split('.')`, `atob(`, `JSON.parse(`, and base64 payload decode usage.

## Findings

### F1 — Unsafe JWT claim trust used for session identity/auth decisions

- **File:** `packages/apps/sous-chef/mobile/src/auth/auth0.ts:43`
- **What existed:** `idToken` was manually decoded with `token.split('.')`, `Buffer.from(..., 'base64')`, and `JSON.parse(...)`; custom claims were then used to:
  - block impersonation
  - derive `userId`
  - derive `auth0Id`
- **Risk:** client-side decoded JWT payload was trusted for identity/auth decisions without server-side verification boundary.

## Changes made

### C1 — Removed client-side JWT payload decoding and claim-based trust

- **File changed:** `packages/apps/sous-chef/mobile/src/auth/auth0.ts`
- **Updated locations:**
  - Removed `isImpersonatedClaims` import and custom claim constant.
  - Removed `extractUserIdFromClaims(...)` helper.
  - Removed `decodeTokenClaims(...)` helper (`split('.')`, base64 decode, `JSON.parse`).
  - Updated `buildSession(...)` signature to no longer accept/use `idToken` claims.
  - Removed `idToken` propagation in refresh path.
  - Session identity fields now do not originate from raw JWT decoding:
    - `userId: ''`
    - `auth0Id: ''`

## Authorization trust boundary status

- Mobile app no longer decodes JWT payloads and no longer uses decoded claims for authorization/identity decisions.
- Authorization remains backend-enforced via bearer token to API/Lambda authorizer boundary.
- No display-only JWT decoding remains, so no `DISPLAY ONLY` annotation was required.

## Verification evidence

- JWT decode pattern scan after fix:
  - `grep -rn "jwt\|decode\|atob\|split.*\.\." packages/apps/sous-chef/mobile/src/ --include="*.ts" --include="*.tsx"`
  - **Result:** no matches
- Type diagnostics:
  - `lsp_diagnostics` on `packages/apps/sous-chef/mobile/src/auth/auth0.ts`
  - **Result:** no diagnostics
- Mobile typecheck:
  - `npm run typecheck --workspace=@kitchensink/mobile`
  - **Result:** pass
- Mobile build:
  - `npm run build --workspace=@kitchensink/mobile`
  - **Result:** fails due to existing environment/dependency issue unrelated to this change:
    - `ERR_MODULE_NOT_FOUND: ... node_modules/expo-auth-session/build/AuthRequest`
