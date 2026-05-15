import { pgTable, text, timestamp, uuid, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', ['active', 'suspended']);

export const users = pgTable(
    'users',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        auth0Sub: text('auth0_sub').notNull(),
        email: text('email').notNull(),
        status: userStatusEnum('status').notNull().default('active'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
        deletedAt: timestamp('deleted_at', { withTimezone: true }),
    },
    (table) => [
        uniqueIndex('users_auth0_sub_unique').on(table.auth0Sub),
        index('users_auth0_sub_idx').on(table.auth0Sub),
    ],
);

export const accounts = pgTable(
    'accounts',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        subscriptionTier: text('subscription_tier').notNull().default('free'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index('accounts_user_id_idx').on(table.userId)],
);

export const profiles = pgTable(
    'profiles',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        displayName: text('display_name').notNull(),
        avatarUrl: text('avatar_url'),
        bio: text('bio'),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [uniqueIndex('profiles_user_id_unique').on(table.userId)],
);
