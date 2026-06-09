-- 0005: rebuild identity schema with ULID PK + identity_id
-- Supersedes 0004 (never applied to prod)

CREATE EXTENSION IF NOT EXISTS citext;

-- Drop existing tables if they exist (prod is empty)
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;

-- users: ULID text PK + identity_id
CREATE TYPE user_status AS ENUM ('active', 'suspended');
CREATE TABLE users (
    id                          TEXT         PRIMARY KEY,
    identity_id                    TEXT         NOT NULL,
    email                       CITEXT       NOT NULL,
    name                        TEXT,
    picture                     TEXT,
    status                      user_status  NOT NULL DEFAULT 'active',
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at                  TIMESTAMPTZ,
    external_id_synced_at       TIMESTAMPTZ
);
CREATE UNIQUE INDEX users_identity_id_unique ON users (identity_id);
CREATE UNIQUE INDEX users_email_unique    ON users (email);
CREATE INDEX        users_email_idx       ON users (email);
CREATE INDEX        users_identity_id_idx    ON users (identity_id);

-- accounts: 1:1 billing entity
CREATE TABLE accounts (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           TEXT        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    subscription_tier TEXT        NOT NULL DEFAULT 'free',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX accounts_user_id_idx ON accounts (user_id);
CREATE UNIQUE INDEX accounts_user_id_unique ON accounts (user_id);

-- profiles: 1:1 user display profile
CREATE TABLE profiles (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT        NOT NULL,
    avatar_url   TEXT,
    bio          TEXT,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX profiles_user_id_unique ON profiles (user_id);
