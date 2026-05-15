import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

import { users, accounts, profiles } from '../database/index.js';
import { DrizzleProvider } from '../database/database.module.js';
import { Auth0Service } from '../auth/auth0.service.js';
import { SqsService } from '../queue/sqs.service.js';
import { AuthorizerContext } from '../auth/decorators/current-user.decorator';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @Inject(DrizzleProvider) private readonly db: NodePgDatabase,
        private readonly auth0: Auth0Service,
        private readonly sqs: SqsService,
    ) {}

    async getUserMe(ctx: AuthorizerContext) {
        const userId = ctx.userId;

        const [user] = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const [account] = await this.db.select().from(accounts).where(eq(accounts.userId, userId)).limit(1);
        const [profile] = await this.db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

        return {
            user: {
                id: user.id,
                auth0Sub: user.auth0Sub,
                email: user.email,
                status: user.status,
                displayName: profile?.displayName ?? '',
                avatarUrl: profile?.avatarUrl ?? null,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            },
            account: {
                id: account?.id,
                userId: account?.userId,
                subscriptionTier: (account?.subscriptionTier as 'free' | 'premium') ?? 'free',
                createdAt: account?.createdAt.toISOString(),
                updatedAt: account?.updatedAt.toISOString(),
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
                auth0Sub: existing.auth0Sub,
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
                subscriptionTier: (updatedAccount?.subscriptionTier as 'free' | 'premium') ?? 'free',
                createdAt: updatedAccount?.createdAt.toISOString(),
                updatedAt: updatedAccount?.updatedAt.toISOString(),
            },
        };
    }

    async deleteUserMe(ctx: AuthorizerContext) {
        const userId = ctx.userId;
        const auth0Sub = ctx.auth0Sub;

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
            await this.auth0.deleteUser(auth0Sub);
        } catch (err) {
            await this.sqs.enqueueDeletion(auth0Sub, userId, String(err));
        }

        return {
            userId,
            deletedAt: deletedAt.toISOString(),
            message: 'Account deletion initiated',
        };
    }

    async requestPasswordReset(email: string): Promise<{ message: string }> {
        const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user) {
            return { message: 'If the email exists, a reset link has been sent' };
        }

        try {
            await this.auth0.createPasswordResetTicket(user.auth0Sub, 'https://app.sous-chef.io/auth/callback');
        } catch (err) {
            this.logger.warn('password reset ticket failed', { email, error: String(err) });
        }

        return { message: 'If the email exists, a reset link has been sent' };
    }

    async enrollMFA(auth0Sub: string): Promise<{ message: string; enrollmentUri: string }> {
        try {
            const result = await this.auth0.enrollMFA(auth0Sub);

            return {
                message: 'MFA enrollment initiated',
                enrollmentUri: (result as { uri?: string }).uri ?? '',
            };
        } catch (err) {
            this.logger.error('MFA enroll failed', { auth0Sub, error: String(err) });

            return { message: 'MFA enrollment failed', enrollmentUri: '' };
        }
    }

    async unenrollMFA(enrollmentId: string): Promise<{ message: string }> {
        try {
            await this.auth0.unenrollMFA(enrollmentId);

            return { message: 'MFA device unenrolled' };
        } catch (err) {
            this.logger.error('MFA unenroll failed', { enrollmentId, error: String(err) });

            return { message: 'MFA unenroll failed' };
        }
    }

    async linkSocialAccount(auth0Sub: string, provider: string, accountId: string): Promise<{ message: string }> {
        try {
            await this.auth0.linkAccounts(auth0Sub, provider, accountId);

            return { message: 'Account linked' };
        } catch (err) {
            this.logger.error('Account link failed', { auth0Sub, error: String(err) });

            return { message: 'Account link failed' };
        }
    }

    async unlinkSocialAccount(auth0Sub: string, provider: string, accountId: string): Promise<{ message: string }> {
        try {
            await this.auth0.unlinkAccount(auth0Sub, provider, accountId);

            return { message: 'Account unlinked' };
        } catch (err) {
            this.logger.error('Account unlink failed', { auth0Sub, error: String(err) });

            return { message: 'Account unlink failed' };
        }
    }
}
