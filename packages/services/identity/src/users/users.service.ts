import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

import { users, accounts, profiles } from '../database/index.js';
import { DrizzleProvider } from '../database/database.module.js';
import { Auth0Service } from '../auth/auth0.service.js';
import { SqsService } from '../queue/sqs.service.js';
import type { AuthorizerContext } from '../auth/decorators/current-user.decorator.js';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @Inject(DrizzleProvider) private readonly db: NodePgDatabase,
        private readonly auth0: Auth0Service,
        private readonly sqs: SqsService,
    ) {}

    async getUserMe(ctx: AuthorizerContext) {
        const sub = ctx.sub;

        const [user] = await this.db.select().from(users).where(eq(users.sub, sub)).limit(1);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const [account] = await this.db.select().from(accounts).where(eq(accounts.ownerSub, sub)).limit(1);
        const [profile] = await this.db.select().from(profiles).where(eq(profiles.userSub, sub)).limit(1);

        return {
            user: {
                sub: user.sub,
                email: user.email,
                status: user.status,
                displayName: profile?.displayName ?? '',
                avatarUrl: profile?.avatarUrl ?? null,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            },
            account: {
                id: account?.id,
                ownerSub: account?.ownerSub,
                tier: account?.tier ?? 'free',
                createdAt: account?.createdAt.toISOString(),
                updatedAt: account?.updatedAt.toISOString(),
            },
        };
    }

    async patchUserMe(ctx: AuthorizerContext, input: { displayName?: string; avatarUrl?: string | null }) {
        const sub = ctx.sub;

        const [existing] = await this.db.select().from(users).where(eq(users.sub, sub)).limit(1);

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
                .where(eq(profiles.userSub, sub));
        }

        const [updatedProfile] = await this.db.select().from(profiles).where(eq(profiles.userSub, sub)).limit(1);
        const [updatedAccount] = await this.db.select().from(accounts).where(eq(accounts.ownerSub, sub)).limit(1);

        return {
            user: {
                sub: existing.sub,
                email: existing.email,
                status: existing.status,
                displayName: updatedProfile?.displayName ?? '',
                avatarUrl: updatedProfile?.avatarUrl ?? null,
                createdAt: existing.createdAt.toISOString(),
                updatedAt: now.toISOString(),
            },
            account: {
                id: updatedAccount?.id,
                ownerSub: updatedAccount?.ownerSub,
                tier: updatedAccount?.tier ?? 'free',
                createdAt: updatedAccount?.createdAt.toISOString(),
                updatedAt: updatedAccount?.updatedAt.toISOString(),
            },
        };
    }

    async deleteUserMe(ctx: AuthorizerContext) {
        const sub = ctx.sub;

        const [existing] = await this.db.select().from(users).where(eq(users.sub, sub)).limit(1);

        if (!existing) {
            throw new NotFoundException('User not found');
        }

        const deletedAt = new Date();

        await this.db.transaction(async (tx) => {
            await tx.delete(accounts).where(eq(accounts.ownerSub, sub));
            await tx.delete(profiles).where(eq(profiles.userSub, sub));
            await tx.delete(users).where(eq(users.sub, sub));
        });

        try {
            await this.auth0.deleteUser(sub);
        } catch (err) {
            await this.sqs.enqueueDeletion(sub, sub, String(err));
        }

        return {
            sub,
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
            await this.auth0.createPasswordResetTicket(user.sub, 'https://app.sous-chef.io/auth/callback');
        } catch (err) {
            this.logger.warn('password reset ticket failed', { email, error: String(err) });
        }

        return { message: 'If the email exists, a reset link has been sent' };
    }

    async enrollMFA(sub: string): Promise<{ message: string; enrollmentUri: string }> {
        try {
            const result = await this.auth0.enrollMFA(sub);

            return {
                message: 'MFA enrollment initiated',
                enrollmentUri: (result as { uri?: string }).uri ?? '',
            };
        } catch (err) {
            this.logger.error('MFA enroll failed', { sub, error: String(err) });

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

    async linkSocialAccount(sub: string, provider: string, accountId: string): Promise<{ message: string }> {
        try {
            await this.auth0.linkAccounts(sub, provider, accountId);

            return { message: 'Account linked' };
        } catch (err) {
            this.logger.error('Account link failed', { sub, error: String(err) });

            return { message: 'Account link failed' };
        }
    }

    async unlinkSocialAccount(sub: string, provider: string, accountId: string): Promise<{ message: string }> {
        try {
            await this.auth0.unlinkAccount(sub, provider, accountId);

            return { message: 'Account unlinked' };
        } catch (err) {
            this.logger.error('Account unlink failed', { sub, error: String(err) });

            return { message: 'Account unlink failed' };
        }
    }
}
