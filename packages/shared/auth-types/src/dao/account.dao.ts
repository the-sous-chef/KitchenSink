import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { accounts } from '../schema/accounts.js';
import type { AccountRow, NewAccountRow } from '../schema/accounts.js';
import type { UserSub } from '../user.js';
import type { AccountTier } from '../account.js';

export class AccountDAO {
    constructor(private readonly db: PostgresJsDatabase<Record<string, never>>) {}

    async findByOwnerSub(ownerSub: UserSub): Promise<AccountRow | undefined> {
        const rows = await this.db.select().from(accounts).where(eq(accounts.ownerSub, ownerSub));
        return rows[0];
    }

    async createForUser(ownerSub: UserSub, tier: AccountTier = 'free'): Promise<AccountRow> {
        const values: NewAccountRow = { ownerSub, tier };
        const rows = await this.db.insert(accounts).values(values).returning();
        return rows[0]!;
    }

    async upsert(ownerSub: UserSub, tier: AccountTier = 'free'): Promise<AccountRow> {
        const values: NewAccountRow = { ownerSub, tier };
        const rows = await this.db
            .insert(accounts)
            .values(values)
            .onConflictDoUpdate({
                target: accounts.ownerSub,
                set: { tier, updatedAt: new Date() },
            })
            .returning();
        return rows[0]!;
    }

    async updateTier(ownerSub: UserSub, tier: AccountTier): Promise<AccountRow | undefined> {
        const rows = await this.db
            .update(accounts)
            .set({ tier, updatedAt: new Date() })
            .where(eq(accounts.ownerSub, ownerSub))
            .returning();
        return rows[0];
    }

    async delete(ownerSub: UserSub): Promise<void> {
        await this.db.delete(accounts).where(eq(accounts.ownerSub, ownerSub));
    }
}
