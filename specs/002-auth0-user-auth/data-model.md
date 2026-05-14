# Data Model: Auth0 User Authentication

**Feature**: `002-auth0-user-auth`
**Date**: 2026-04-14
**Storage**: Aurora DSQL (PostgreSQL-compatible)
**Source spec**: [spec.md](./spec.md) — Key Entities section

---

## Entities

### User

Represents a registered Sous Chef user. The canonical identifier across all systems. Created by the Auth0 post-registration Action.

| Column         | Type          | Constraints                                | Description                                                                                                |
| -------------- | ------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `id`           | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Canonical Sous Chef user ID (UUIDv4). Stored in Auth0 `app_metadata.userId`. Never changes after creation. |
| `auth0_id`     | `TEXT`        | `UNIQUE NOT NULL`                          | Auth0 `sub` claim (e.g., `auth0\|abc123`). Used only for Auth0 Management API calls.                       |
| `email`        | `TEXT`        | `UNIQUE NOT NULL`                          | Synced from Auth0 at registration. Read-only in Sous Chef; changes require Auth0 email flow.               |
| `display_name` | `TEXT`        | `NOT NULL`                                 | User-editable display name. Validated: non-empty, max 100 chars.                                           |
| `avatar_url`   | `TEXT`        | `NULL`                                     | URL to stored avatar image. Null if no avatar set.                                                         |
| `status`       | `TEXT`        | `NOT NULL DEFAULT 'active'`                | Enum: `'active'` \| `'suspended'`. Suspended users are blocked in Auth0 and denied API access (FR-041).    |
| `created_at`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                   | ISO 8601 string in application layer.                                                                      |
| `updated_at`   | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                   | Updated by trigger on every row change.                                                                    |

**Indexes**:

- `idx_users_auth0_id ON users(auth0_id)` — used by authorizer and reconciliation job
- `idx_users_status ON users(status)` — used by suspension queries
- `idx_users_created_at ON users(created_at DESC)` — used by reconciliation job 7-day window

**Cascade**: All user-owned data references `users.id` with `ON DELETE CASCADE` (recipes, meal plans, grocery lists, nutrition plans, AI provider configs, agent authorizations — FR-025).

---

### Account

Extension point for subscription and profile details. Created alongside User at signup. One Account per User.

| Column              | Type          | Constraints                                              | Description                                                                               |
| ------------------- | ------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `id`                | `UUID`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`               | Account identifier.                                                                       |
| `user_id`           | `UUID`        | `UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE` | Foreign key to User. The `UNIQUE` constraint enforces one-to-one relationship.            |
| `subscription_tier` | `TEXT`        | `NOT NULL DEFAULT 'free'`                                | Enum: `'free'` \| `'premium'`. Managed by subscription feature (Sous Chef FR-040/FR-041). |
| `created_at`        | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                 |                                                                                           |
| `updated_at`        | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                 |                                                                                           |

**Notes**: Account is a separate entity to avoid overloading User with subscription-domain concerns. When User is deleted, Account is cascade-deleted (FK with `ON DELETE CASCADE`).

---

### AuthSession (client-side — not a database table)

Represents in-memory / secure-storage auth state on the client. Not persisted in our database — lives in Keychain/Keystore (mobile) or httpOnly cookies (web).

| Field          | Type     | Description                                                                                             |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `accessToken`  | `string` | JWT access token. Included as `Authorization: Bearer <token>` on all API requests.                      |
| `refreshToken` | `string` | Opaque refresh token. Used to silently refresh access token. Revoked on logout.                         |
| `expiresAt`    | `string` | ISO 8601 timestamp when the access token expires.                                                       |
| `userId`       | `string` | Extracted from the access token's `https://sous-chef.io/userId` custom claim. Canonical Sous Chef UUID. |
| `auth0Id`      | `string` | Extracted from `sub` claim. Used only for client-side Auth0 API calls.                                  |

---

## Access Token Claim Structure

Auth0 access tokens include custom namespaced claims populated by the post-registration Action:

```json
{
    "iss": "https://<tenant>.auth0.com/",
    "sub": "auth0|abc123",
    "aud": ["https://api.sous-chef.io"],
    "exp": 1744000000,
    "iat": 1743996400,
    "https://sous-chef.io/userId": "uuid-v4",
    "https://sous-chef.io/auth0Id": "auth0|abc123",
    "https://sous-chef.io/email": "user@example.com",
    "https://sous-chef.io/status": "active"
}
```

**Namespace**: `https://sous-chef.io/` — required by Auth0 for custom claims in access tokens (OIDC spec compliance).

---

## Database Schema (SQL)

```sql
-- Users table
CREATE TABLE users (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    auth0_id     TEXT        NOT NULL UNIQUE,
    email        TEXT        NOT NULL UNIQUE,
    display_name TEXT        NOT NULL,
    avatar_url   TEXT,
    status       TEXT        NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active', 'suspended')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_auth0_id  ON users (auth0_id);
CREATE INDEX idx_users_status    ON users (status);
CREATE INDEX idx_users_created_at ON users (created_at DESC);

-- Accounts table
CREATE TABLE accounts (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    subscription_tier TEXT        NOT NULL DEFAULT 'free'
                                  CHECK (subscription_tier IN ('free', 'premium')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_accounts_user_id ON accounts (user_id);

-- updated_at trigger (apply to both tables)
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
```

---

## Entity Lifecycle

```
Auth0 signup
  │
  └─► post-registration Action
        ├─ Generate UUIDv4
        ├─ INSERT users (id, auth0_id, email, display_name, status='active')
        ├─ INSERT accounts (user_id, subscription_tier='free')
        └─ PATCH Auth0 app_metadata.userId = uuid

User active session
  │  (access token carries userId, status)
  │
  └─► Lambda authorizer reads claims → injects context
        Downstream Lambdas read context.userId — no DB lookup needed

User suspends
  │
  ├─► Auth0 Management API: block user
  └─► UPDATE users SET status = 'suspended' WHERE id = userId

User deletes account
  │
  ├─► DELETE users WHERE id = userId  (cascade → accounts, recipes, etc.)
  ├─► Auth0 delete attempt
  │     ├─ SUCCESS: done
  │     └─ FAILURE: enqueue to SQS deletion queue
  └─► Clear local session (logout)

Reconciliation job (nightly)
  │
  ├─► Fetch Auth0 users created in last 7 days
  ├─► Fetch DB users created in last 7 days
  ├─► Find Auth0 users with no matching DB user (by auth0_id)
  └─► INSERT users + accounts for orphaned Auth0 users
```

---

## Mapping to Requirements

| Entity / Field                      | FR             | Notes                                                    |
| ----------------------------------- | -------------- | -------------------------------------------------------- |
| `users.id` (UUIDv4)                 | FR-013, FR-015 | Canonical ID, stored in Auth0 `app_metadata`             |
| `users.auth0_id`                    | FR-013         | Auth0 `sub`, used for Management API calls only          |
| `accounts` creation at signup       | FR-014         | Created atomically with User in post-registration Action |
| `users.status = 'suspended'`        | FR-041, FR-042 | Dual mechanism: Auth0 block + DB status                  |
| `users` + `accounts` cascade delete | FR-025         | `ON DELETE CASCADE` on all user-owned tables             |
| Access token custom claim `userId`  | FR-040         | Eliminates DB lookup per API request                     |
| `AuthSession.refreshToken`          | FR-007, FR-008 | Silent refresh; redirect to login on expiry              |
| `AuthSession` secure storage        | FR-006         | Keychain/Keystore (mobile), httpOnly cookie (web)        |
