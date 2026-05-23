import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { users } from '../schema/users.js';
import type { NewUserRow, UserRow } from '../schema/users.js';
import type { UserSub } from '../user.js';

/** @implements REQ-013 REQ-014 REQ-015 REQ-017 REQ-018 REQ-019 REQ-025 FR-013 FR-014 FR-015 FR-017 FR-018 FR-019 FR-025 ARCH-011 ARCH-012 MOD-011 MOD-012 */
export class UserDAO {
    constructor(private readonly db: PostgresJsDatabase<Record<string, never>>) {}

    async findBySub(sub: UserSub): Promise<UserRow | undefined> {
        const rows = await this.db.select().from(users).where(eq(users.sub, sub));
        return rows[0];
    }

    /**
     * Insert or update a user record keyed on `sub`.
     * On conflict, updates email, name, picture, and updatedAt.
     */
    async upsert(data: {
        sub: UserSub;
        email: string;
        name?: string;
        picture?: string;
    }): Promise<UserRow> {
        const values: NewUserRow = {
            sub: data.sub,
            email: data.email,
            name: data.name ?? null,
            picture: data.picture ?? null,
        };

        const rows = await this.db
            .insert(users)
            .values(values)
            .onConflictDoUpdate({
                target: users.sub,
                set: {
                    email: data.email,
                    name: data.name ?? null,
                    picture: data.picture ?? null,
                    updatedAt: new Date(),
                },
            })
            .returning();

        return rows[0]!;
    }

    async updateProfile(
        sub: UserSub,
        patch: Partial<Pick<UserRow, 'name' | 'picture'>>,
    ): Promise<UserRow | undefined> {
        const rows = await this.db
            .update(users)
            .set({ ...patch, updatedAt: new Date() })
            .where(eq(users.sub, sub))
            .returning();

        return rows[0];
    }

    async delete(sub: UserSub): Promise<void> {
        await this.db.delete(users).where(eq(users.sub, sub));
    }

    /**
     * Return users associated with an account.
     *
     * NOTE: The current schema has no `account_id` column on `users`; the
     * `accounts` table stores `owner_sub` instead.  Until T5 adds a proper
     * join table this method treats `accountId` as a `UserSub` and returns
     * the single matching user (if any).
     *
     * @todo Replace with a real join once the accounts↔users relation is added.
     */
    async listByAccount(accountId: string): Promise<UserRow[]> {
        const row = await this.findBySub(accountId as UserSub);
        return row ? [row] : [];
    }
}
