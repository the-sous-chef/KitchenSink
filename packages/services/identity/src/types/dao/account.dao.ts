import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { accounts } from '../schema/accounts.js';
import type { AccountRow, NewAccountRow } from '../schema/accounts.js';
import type { UserId } from '../user.js';
import type { AccountTier } from '../account.js';

export class AccountDAO {
    constructor(private readonly db: PostgresJsDatabase<Record<string, never>>) {}

    async findByUserId(userId: UserId): Promise<AccountRow | undefined> {
        const rows = await this.db.select().from(accounts).where(eq(accounts.userId, userId));

        return rows[0];
    }

    async createForUser(userId: UserId, subscriptionTier: AccountTier = 'free'): Promise<AccountRow> {
        const values: NewAccountRow = { userId, subscriptionTier };
        const rows = await this.db.insert(accounts).values(values).returning();

        return rows[0]!;
    }

    async upsert(userId: UserId, subscriptionTier: AccountTier = 'free'): Promise<AccountRow> {
        const values: NewAccountRow = { userId, subscriptionTier };
        const rows = await this.db
            .insert(accounts)
            .values(values)
            .onConflictDoUpdate({
                target: accounts.userId,
                set: { subscriptionTier, updatedAt: new Date() },
            })
            .returning();

        return rows[0]!;
    }

    async updateSubscriptionTier(userId: UserId, subscriptionTier: AccountTier): Promise<AccountRow | undefined> {
        const rows = await this.db
            .update(accounts)
            .set({ subscriptionTier, updatedAt: new Date() })
            .where(eq(accounts.userId, userId))
            .returning();

        return rows[0];
    }

    async delete(userId: UserId): Promise<void> {
        await this.db.delete(accounts).where(eq(accounts.userId, userId));
    }
}
