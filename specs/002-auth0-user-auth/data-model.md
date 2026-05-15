# Data Model: Auth0 User Authentication

**Feature**: `002-auth0-user-auth`
**Date**: 2026-05-13
**Storage**: RDS PostgreSQL 16 (`db.t4g.small`)
**Source spec**: [spec.md](./spec.md) — Key Entities section

---

## Ownership and access model

- This database is **owned by the Identity Service** (`packages/services/identity/`).
- Raw Lambda handlers in `packages/services/identity-webhooks/` access the same tables through a **shared Drizzle schema export** from `packages/shared/auth-types/` (or shared DB contract package boundary defined by the workspace).
- Authoritative write paths:
    - Identity Service: profile/account/admin lifecycle writes
    - Post-registration Lambda: user/account/profile bootstrap writes
    - Reconciliation Lambda: repair writes for orphaned Auth0 users

---

## Entities

### User

Represents a registered Sous Chef user. Canonical identity across all Sous Chef systems.

| Column         | Type          | Constraints                                | Description                                                                                  |
| -------------- | ------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `id`           | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Canonical Sous Chef user ID (UUIDv4). Stored in Auth0 `app_metadata.userId`; immutable.      |
| `auth0_id`     | `TEXT`        | `UNIQUE NOT NULL`                          | Auth0 `sub` (e.g., `auth0\|abc123`), used for Auth0 Management API correlation.              |
| `email`        | `TEXT`        | `UNIQUE NOT NULL`                          | Synced from Auth0 during registration. Read-only in Sous Chef scope for this feature.        |
| `display_name` | `TEXT`        | `NOT NULL`                                 | User-editable display name (validated non-empty, max length constraint at DTO/domain level). |
| `avatar_url`   | `TEXT`        | `NULL`                                     | Optional avatar URL.                                                                         |
| `status`       | `TEXT`        | `NOT NULL DEFAULT 'active'`                | Enum: `'active'` \| `'suspended'`. Suspended users denied by authorizer (FR-041, FR-042).    |
| `created_at`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                   | Creation timestamp (ISO 8601 in app layer).                                                  |
| `updated_at`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                   | Last update timestamp (trigger-managed).                                                     |

**Indexes**:

- `idx_users_auth0_id ON users(auth0_id)` — lookup by Auth0 subject for webhooks/reconciliation
- `idx_users_status ON users(status)` — suspension/admin queries
- `idx_users_created_at ON users(created_at DESC)` — reconciliation windows

**Cascade semantics**:

- `users.id` is root for user-owned records.
- Delete of User triggers cascade for Account, Profile, and downstream domain tables (recipes, meal plans, grocery lists, nutrition plans, AI provider configs, agent authorizations) per FR-025.

---

### Account

Account-scoped lifecycle + subscription anchor (subscription feature owns tier transitions).

| Column              | Type          | Constraints                                              | Description                                                                                          |
| ------------------- | ------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `id`                | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`               | Account identifier.                                                                                  |
| `user_id`           | `UUID`        | `UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE` | 1:1 FK to User (`UNIQUE` enforces one account per user).                                             |
| `subscription_tier` | `TEXT`        | `NOT NULL DEFAULT 'free'`                                | Enum: `'free'` \| `'premium'`; managed by subscription feature (Sous Chef FR-040/FR-041 dependency). |
| `created_at`        | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                 | Creation timestamp.                                                                                  |
| `updated_at`        | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                 | Last update timestamp.                                                                               |

**Notes**:

- Account is created atomically with User at signup bootstrap.
- Cascades with user deletion via FK.

---

### Profile

Profile record linked 1:1 with User for profile-oriented reads/updates in the Identity Service.

| Column         | Type          | Constraints                                              | Description                                                           |
| -------------- | ------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| `id`           | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`               | Profile identifier.                                                   |
| `user_id`      | `UUID`        | `UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE` | 1:1 FK to User.                                                       |
| `display_name` | `TEXT`        | `NOT NULL`                                               | Denormalized profile display name surface for profile module queries. |
| `avatar_url`   | `TEXT`        | `NULL`                                                   | Optional avatar URL for profile pages.                                |
| `created_at`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                 | Creation timestamp.                                                   |
| `updated_at`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                 | Last update timestamp.                                                |

**Indexes**:

- `idx_profiles_user_id ON profiles(user_id)` (implicitly covered by `UNIQUE`, explicit naming kept for migration clarity)

**Notes**:

- Profile can be initialized from signup data and updated via profile/account edit APIs.
- If implementations choose a single-table model for user profile fields, this entity remains the logical contract required by the module topology and requirements traceability.

---

### AuthSession (client-side contract — not a DB table)

Represents secure client session state.

| Field          | Type     | Description                                                               |
| -------------- | -------- | ------------------------------------------------------------------------- |
| `accessToken`  | `string` | JWT bearer token for API calls.                                           |
| `refreshToken` | `string` | Refresh token used for silent renewal.                                    |
| `expiresAt`    | `string` | ISO 8601 access token expiry timestamp.                                   |
| `userId`       | `string` | Canonical Sous Chef UUID from Auth0 custom claim (`app_metadata.userId`). |
| `auth0Id`      | `string` | Auth0 subject (`sub`) for management/reconciliation context only.         |

Storage policy remains platform-specific (FR-006, FR-007, FR-008):

- Web: httpOnly secure cookie via Auth0 SDK
- Mobile: Keychain/Keystore via `react-native-auth0` + secure storage

---

## SQL reference (Drizzle-aligned)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_auth0_id ON users(auth0_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER accounts_set_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## Entity lifecycle

```text
Auth0 signup
  |
  +--> existing post-registration Action/Trigger chain
          |
          +--> post-registration Lambda
                - Generate/confirm UUIDv4
                - UPSERT users
                - UPSERT accounts
                - UPSERT profiles
                - PATCH Auth0 app_metadata.userId

Authenticated API request
  |
  +--> API Gateway REQUEST authorizer Lambda
        - Verify JWT / claims / status
        - Inject context.userId
  |
  +--> Identity Service (ECS) uses context.userId for DB operations

Account deletion
  |
  +--> Identity Service DELETE user transaction
        - DELETE users (cascades accounts/profiles/owned data)
        - enqueue auth0 deletion message
  |
  +--> deletion-worker Lambda retries Auth0 delete (max 5) then DLQ

Nightly reconciliation
  |
  +--> EventBridge Scheduler triggers reconciliation Lambda
        - Diff Auth0 users vs DB users by auth0_id
        - Repair missing rows (users/accounts/profiles)
```

---

## Mapping to requirements

| Entity / Field                                      | Requirement coverage                                       | Notes                                                    |
| --------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| `users.id` (UUIDv4)                                 | REQ-013, REQ-015, FR-013, FR-015                           | Canonical ID written back to Auth0 `app_metadata.userId` |
| `users.auth0_id`                                    | REQ-013, FR-013                                            | Correlates Auth0 user to local row                       |
| Atomic create: `users + accounts + profiles`        | REQ-014, FR-014                                            | Signup bootstrap path                                    |
| `users.status`                                      | REQ-041, REQ-042, FR-041, FR-042                           | Suspension state enforced in authorizer                  |
| Cascading delete from `users`                       | REQ-025, FR-025                                            | Removes owned records on account deletion                |
| Reconciliation repair writes                        | REQ-017, FR-017                                            | Backfills missing records from Auth0                     |
| Token/user identity contract (`AuthSession.userId`) | REQ-006, REQ-007, REQ-008, REQ-040, FR-006..FR-008, FR-040 | Consumed by web/mobile clients and APIs                  |

---

## Notes and invariants

1. `users.id` is the only canonical user identifier across Sous Chef systems.
2. `auth0_id` is never used as internal PK and is reserved for Auth0 API operations.
3. Profile/account/user 1:1 boundaries are preserved for clear module ownership.
4. All timestamp fields are ISO 8601 at interface boundaries (NFR-010).
5. Storage engine remains RDS PostgreSQL 16 for this feature; Aurora DSQL is out of scope.
