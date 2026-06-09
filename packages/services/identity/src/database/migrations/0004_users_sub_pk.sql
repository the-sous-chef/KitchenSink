-- 0004: rebuild identity schema with Auth0 sub PK
-- Supersedes 0001-0003 (never applied to prod)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing tables if they exist (prod is empty)
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;

-- users: Auth0 sub is the PK
CREATE TYPE user_status AS ENUM ('active', 'suspended');
CREATE TABLE users (
    sub        VARCHAR(255) COLLATE "C" PRIMARY KEY,
    email      VARCHAR(320) NOT NULL,
    name       TEXT,
    picture    TEXT,
    status     user_status  NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX users_email_unique ON users (email);
CREATE INDEX users_email_idx ON users (email);

-- accounts: 1:1 billing entity (NOT OAuth social connections)
CREATE TABLE accounts (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_sub  VARCHAR(255) COLLATE "C" UNIQUE NOT NULL REFERENCES users(sub) ON DELETE CASCADE,
    tier       VARCHAR(32)  NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX accounts_owner_sub_idx ON accounts (owner_sub);

-- profiles: 1:1 user display profile
CREATE TABLE profiles (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_sub     VARCHAR(255) NOT NULL REFERENCES users(sub) ON DELETE CASCADE,
    display_name TEXT        NOT NULL,
    avatar_url   TEXT,
    bio          TEXT,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX profiles_user_sub_unique ON profiles (user_sub);
