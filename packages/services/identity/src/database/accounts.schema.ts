import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
// eslint-disable-next-line no-restricted-imports
import { users } from '@kitchensink/auth-types/schema';

export const accounts = pgTable('accounts', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    subscriptionTier: text('subscription_tier').notNull().default('free'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
