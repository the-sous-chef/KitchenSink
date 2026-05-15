import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';
import { Pool } from 'pg';

import type { UserId, UserStatus } from '@kitchensink/auth-types';
// eslint-disable-next-line no-restricted-imports
import { accounts, profiles, users } from '@kitchensink/auth-types/schema';

import { getJsonSecret } from './secrets.js';

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-017 REQ-IF-008 REQ-IF-010 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 FR-017 ARCH-010 ARCH-011 ARCH-012 MOD-010 MOD-011 MOD-012 */
type DbSecret = {
    username: string;
    password: string;
    host: string;
    port: number | string;
    dbname?: string;
    database?: string;
};

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-017 REQ-IF-008 REQ-IF-010 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 FR-017 ARCH-010 ARCH-011 ARCH-012 MOD-010 MOD-011 MOD-012 */
type IdentityDb = ReturnType<
    typeof drizzle<{ users: typeof users; accounts: typeof accounts; profiles: typeof profiles }>
>;

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-017 REQ-IF-008 REQ-IF-010 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 FR-017 ARCH-010 ARCH-011 ARCH-012 MOD-010 MOD-011 MOD-012 */
let pool: Pool | null = null;

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-017 REQ-IF-008 REQ-IF-010 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 FR-017 ARCH-010 ARCH-011 ARCH-012 MOD-010 MOD-011 MOD-012 */
let dbInstance: IdentityDb | null = null;

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-017 REQ-IF-008 REQ-IF-010 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 FR-017 ARCH-010 ARCH-011 ARCH-012 MOD-010 MOD-011 MOD-012 */
export const getDb = async (dbSecretArn: string) => {
    if (dbInstance) {
        return dbInstance;
    }

    const secret = (await getJsonSecret(dbSecretArn)) as unknown as DbSecret;
    const database = secret.dbname ?? secret.database;

    if (!database) {
        throw new Error(`Database secret '${dbSecretArn}' missing dbname/database`);
    }

    pool = new Pool({
        user: secret.username,
        password: secret.password,
        host: secret.host,
        port: Number(secret.port),
        database,
        ssl: process.env.STAGE === 'local' ? false : { rejectUnauthorized: false },
        max: Number(process.env.DB_POOL_MAX ?? '5'),
    });

    dbInstance = drizzle<{ users: typeof users; accounts: typeof accounts; profiles: typeof profiles }>(pool, {
        schema: {
            users,
            accounts,
            profiles,
        },
        casing: 'snake_case',
    });

    return dbInstance;
};

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
export const getUserStatusByAuth0Sub = async (
    dbSecretArn: string,
    auth0Sub: string,
): Promise<{ userId: UserId; status: UserStatus } | null> => {
    const db = await getDb(dbSecretArn);
    const rows = await db
        .select({
            id: users.id,
            status: users.status,
        })
        .from(users)
        .where(eq(users.auth0Sub, auth0Sub))
        .limit(1);

    const row = rows[0];

    if (!row) {
        return null;
    }

    return {
        userId: row.id as UserId,
        status: row.status,
    };
};

/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
export const lookupUserByIdAndAuth0Sub = async (
    dbSecretArn: string,
    userId: UserId,
    auth0Sub: string,
): Promise<{ userId: UserId; auth0Sub: string } | null> => {
    const db = await getDb(dbSecretArn);
    const rows = await db
        .select({
            id: users.id,
            auth0Sub: users.auth0Sub,
        })
        .from(users)
        .where(and(eq(users.id, userId), eq(users.auth0Sub, auth0Sub)))
        .limit(1);

    const row = rows[0];

    if (!row) {
        return null;
    }

    return {
        userId: row.id as UserId,
        auth0Sub: row.auth0Sub,
    };
};

/** @implements REQ-017 REQ-IF-010 FR-017 ARCH-012 MOD-012 */
export const listDbAuth0Subs = async (dbSecretArn: string): Promise<Set<string>> => {
    const db = await getDb(dbSecretArn);
    const rows = await db.select({ auth0Sub: users.auth0Sub }).from(users);

    return new Set(rows.map((row) => row.auth0Sub));
};

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-017 REQ-IF-008 REQ-IF-010 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 FR-017 ARCH-010 ARCH-011 ARCH-012 MOD-010 MOD-011 MOD-012 */
export const ensureUserAccountProfile = async (params: {
    dbSecretArn: string;
    auth0Sub: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    provider: string;
    providerAccountId: string;
    preferredUserId?: UserId | null;
}): Promise<{ userId: UserId; created: boolean }> => {
    const db = await getDb(params.dbSecretArn);

    return db.transaction(async (tx) => {
        const existingUsers = await tx
            .select({
                id: users.id,
            })
            .from(users)
            .where(eq(users.auth0Sub, params.auth0Sub))
            .limit(1);

        const existingUser = existingUsers[0];

        if (existingUser) {
            await tx
                .insert(accounts)
                .values({
                    userId: existingUser.id,
                    provider: params.provider,
                    providerAccountId: params.providerAccountId,
                })
                .onConflictDoNothing();

            await tx
                .insert(profiles)
                .values({
                    userId: existingUser.id,
                    displayName: params.displayName,
                    avatarUrl: params.avatarUrl,
                })
                .onConflictDoNothing();

            return {
                userId: existingUser.id as UserId,
                created: false,
            };
        }

        const insertedUsers = await tx
            .insert(users)
            .values({
                ...(params.preferredUserId ? { id: params.preferredUserId } : {}),
                auth0Sub: params.auth0Sub,
                email: params.email,
                status: 'active',
            })
            .onConflictDoNothing()
            .returning({ id: users.id });

        const resolvedUserId =
            insertedUsers[0]?.id ??
            (
                await tx
                    .select({
                        id: users.id,
                    })
                    .from(users)
                    .where(eq(users.auth0Sub, params.auth0Sub))
                    .limit(1)
            )[0]?.id;

        if (!resolvedUserId) {
            throw new Error(`Unable to resolve user id for ${params.auth0Sub}`);
        }

        await tx
            .insert(accounts)
            .values({
                userId: resolvedUserId,
                provider: params.provider,
                providerAccountId: params.providerAccountId,
            })
            .onConflictDoNothing();

        await tx
            .insert(profiles)
            .values({
                userId: resolvedUserId,
                displayName: params.displayName,
                avatarUrl: params.avatarUrl,
            })
            .onConflictDoNothing();

        return {
            userId: resolvedUserId as UserId,
            created: true,
        };
    });
};
