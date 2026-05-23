import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { users, varcharCollateC } from './users.js';

/** @implements REQ-014 REQ-017 REQ-018 REQ-025 FR-014 FR-017 FR-018 FR-025 ARCH-012 MOD-012 */
export const accounts = pgTable(
    'accounts',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        ownerSub: varcharCollateC('owner_sub').notNull()
            .unique()
            .references(() => users.sub, { onDelete: 'cascade' }),
        tier: varchar('tier', { length: 32 }).notNull().default('free'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('accounts_owner_sub_idx').on(table.ownerSub),
        uniqueIndex('accounts_owner_sub_unique').on(table.ownerSub),
    ],
);

/** @implements REQ-014 REQ-017 FR-014 FR-017 ARCH-012 MOD-012 */
export type AccountRow = InferSelectModel<typeof accounts>;

/** @implements REQ-014 REQ-017 FR-014 FR-017 ARCH-012 MOD-012 */
export type NewAccountRow = InferInsertModel<typeof accounts>;
