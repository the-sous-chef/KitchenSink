import { index, pgTable, text, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { users } from './users.js';

/** @implements REQ-014 REQ-017 REQ-018 REQ-025 FR-014 FR-017 FR-018 FR-025 ARCH-012 MOD-012 */
export const accounts = pgTable(
    'accounts',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userSub: varchar('user_sub', { length: 255 })
            .notNull()
            .references(() => users.sub, { onDelete: 'cascade' }),
        provider: text('provider').notNull(),
        providerAccountId: text('provider_account_id').notNull(),
    },
    (table) => [
        index('accounts_user_sub_idx').on(table.userSub),
        uniqueIndex('accounts_provider_provider_account_id_unique').on(table.provider, table.providerAccountId),
    ],
);

/** @implements REQ-014 REQ-017 FR-014 FR-017 ARCH-012 MOD-012 */
export type AccountRow = InferSelectModel<typeof accounts>;

/** @implements REQ-014 REQ-017 FR-014 FR-017 ARCH-012 MOD-012 */
export type NewAccountRow = InferInsertModel<typeof accounts>;
