import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';

/** @implements REQ-013 REQ-014 REQ-015 REQ-017 REQ-018 REQ-019 REQ-025 REQ-CN-003 FR-013 FR-014 FR-015 FR-017 FR-018 FR-019 FR-025 ARCH-011 ARCH-012 ARCH-015 MOD-011 MOD-012 MOD-015 */
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended']);

/** @implements REQ-013 REQ-014 REQ-015 REQ-017 REQ-018 REQ-019 REQ-025 REQ-CN-003 FR-013 FR-014 FR-015 FR-017 FR-018 FR-019 FR-025 ARCH-011 ARCH-012 ARCH-015 MOD-011 MOD-012 MOD-015 */
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
        uniqueIndex('users_email_lower_unique').on(sql`lower(${table.email})`),
        index('users_auth0_sub_idx').on(table.auth0Sub),
    ],
);

/** @implements REQ-013 REQ-014 REQ-015 FR-013 FR-014 FR-015 ARCH-011 MOD-011 */
export type UserRow = InferSelectModel<typeof users>;

/** @implements REQ-013 REQ-014 REQ-015 FR-013 FR-014 FR-015 ARCH-011 MOD-011 */
export type NewUserRow = InferInsertModel<typeof users>;
