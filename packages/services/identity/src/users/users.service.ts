import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

import { users, accounts, profiles } from '../database/index.js';
import { DrizzleProvider } from '../database/database.module.js';
import { SqsService } from '../queue/sqs.service.js';
import type { AuthorizerContext } from '../auth/decorators/current-user.decorator.js';
import { ResolveUserService } from './resolveUser.js';
import { newUserId } from '../types/index.js';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @Inject(DrizzleProvider) private readonly db: NodePgDatabase,
        private readonly sqs: SqsService,
        private readonly resolver: ResolveUserService,
    ) {}

    async upsertUser(
        _ctx: AuthorizerContext,
        input: { identityId: string; email: string; name?: string; picture?: string },
    ): Promise<{ id: string; created: boolean }> {
        const now = new Date();
        const id = newUserId();

        const [row] = await this.db
            .insert(users)
            .values({
                id,
                identityId: input.identityId,
                email: input.email,
                name: input.name ?? null,
                picture: input.picture ?? null,
                createdAt: now,
                updatedAt: now,
            })
            .onConflictDoUpdate({
                target: users.identityId,
                set: {
                    email: input.email,
                    name: input.name ?? null,
                    picture: input.picture ?? null,
                    updatedAt: now,
                },
            })
            .returning();

        const created = row.createdAt.getTime() === row.updatedAt.getTime();

        if (created) {
            await this.db.insert(accounts).values({ userId: row.id }).onConflictDoNothing();
            await this.db
                .insert(profiles)
                .values({ userId: row.id, displayName: input.name ?? '' })
                .onConflictDoNothing();
        }

        return { id: row.id, created };
    }

    async getUserMe(ctx: AuthorizerContext) {
        const userId = ctx.userId;
        const { user, account } = await this.resolver.resolveUser(userId);
        const [profile] = await this.db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

        return {
            user: {
                id: user.id,
                email: user.email,
                status: user.status,
                displayName: profile?.displayName ?? '',
                avatarUrl: profile?.avatarUrl ?? null,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            },
            account: {
                id: account.id,
                userId: account.userId,
                subscriptionTier: account.subscriptionTier,
                createdAt: account.createdAt.toISOString(),
                updatedAt: account.updatedAt.toISOString(),
            },
        };
    }

    async patchUserMe(ctx: AuthorizerContext, input: { displayName?: string; avatarUrl?: string | null }) {
        const userId = ctx.userId;

        const [existing] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!existing) {
            throw new NotFoundException('User not found');
        }

        const now = new Date();

        if (input.displayName !== undefined || input.avatarUrl !== undefined) {
            await this.db
                .update(profiles)
                .set({
                    ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
                    ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
                    updatedAt: now,
                })
                .where(eq(profiles.userId, userId));
        }

        const [updatedProfile] = await this.db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
        const [updatedAccount] = await this.db.select().from(accounts).where(eq(accounts.userId, userId)).limit(1);

        return {
            user: {
                id: existing.id,
                email: existing.email,
                status: existing.status,
                displayName: updatedProfile?.displayName ?? '',
                avatarUrl: updatedProfile?.avatarUrl ?? null,
                createdAt: existing.createdAt.toISOString(),
                updatedAt: now.toISOString(),
            },
            account: {
                id: updatedAccount?.id,
                userId: updatedAccount?.userId,
                subscriptionTier: updatedAccount?.subscriptionTier ?? 'free',
                createdAt: updatedAccount?.createdAt.toISOString(),
                updatedAt: updatedAccount?.updatedAt.toISOString(),
            },
        };
    }

    async deleteUserMe(ctx: AuthorizerContext) {
        const userId = ctx.userId;
        const clerkUserId = ctx.clerkUserId;

        const [existing] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!existing) {
            throw new NotFoundException('User not found');
        }

        const deletedAt = new Date();

        await this.db.transaction(async (tx) => {
            await tx.delete(accounts).where(eq(accounts.userId, userId));
            await tx.delete(profiles).where(eq(profiles.userId, userId));
            await tx.delete(users).where(eq(users.id, userId));
        });

        try {
            await this.sqs.enqueueDeletion(clerkUserId, userId, 'user-initiated');
        } catch (err) {
            this.logger.warn('Failed to enqueue deletion', { userId, error: String(err) });
        }

        return {
            sub: userId,
            deletedAt: deletedAt.toISOString(),
            message: 'Account deletion initiated',
        };
    }
}
