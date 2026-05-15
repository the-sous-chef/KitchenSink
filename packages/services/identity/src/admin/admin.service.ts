import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

import { users, accounts, DrizzleProvider } from '../database/index';
import { Auth0Service } from '../auth/auth0.service';
import { AuthorizerContext } from '../auth/decorators/current-user.decorator';
import type { AdminGetUserResponseDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        @Inject(DrizzleProvider) private readonly db: NodePgDatabase,
        private readonly auth0: Auth0Service,
    ) {}

    async getUser(targetUserId: string): Promise<AdminGetUserResponseDto> {
        const [user] = await this.db.select().from(users).where(eq(users.id, targetUserId)).limit(1);

        if (!user) {
            throw new NotFoundException(`User ${targetUserId} not found`);
        }

        const [account] = await this.db.select().from(accounts).where(eq(accounts.userId, targetUserId)).limit(1);

        return {
            id: user.id,
            auth0Sub: user.auth0Sub,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
            deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
            subscriptionTier: (account?.subscriptionTier as 'free' | 'premium') ?? 'free',
        };
    }

    async suspendUser(
        targetUserId: string,
        adminCtx: AuthorizerContext,
    ): Promise<{ userId: string; status: 'suspended'; suspendedAt: string }> {
        const [existing] = await this.db.select().from(users).where(eq(users.id, targetUserId)).limit(1);

        if (!existing) {
            throw new NotFoundException(`User ${targetUserId} not found`);
        }

        const now = new Date();
        await this.db.update(users).set({ status: 'suspended', updatedAt: now }).where(eq(users.id, targetUserId));

        await this.auth0.blockUser(existing.auth0Sub);

        this.logger.warn('user suspended', { adminId: adminCtx.userId, targetUserId, auth0Sub: existing.auth0Sub });

        return { userId: targetUserId, status: 'suspended', suspendedAt: now.toISOString() };
    }

    async unsuspendUser(
        targetUserId: string,
        adminCtx: AuthorizerContext,
    ): Promise<{ userId: string; status: 'active'; unsuspendedAt: string }> {
        const [existing] = await this.db.select().from(users).where(eq(users.id, targetUserId)).limit(1);

        if (!existing) {
            throw new NotFoundException(`User ${targetUserId} not found`);
        }

        const now = new Date();
        await this.db.update(users).set({ status: 'active', updatedAt: now }).where(eq(users.id, targetUserId));

        await this.auth0.unblockUser(existing.auth0Sub);

        this.logger.warn('user unsuspended', { adminId: adminCtx.userId, targetUserId, auth0Sub: existing.auth0Sub });

        return { userId: targetUserId, status: 'active', unsuspendedAt: now.toISOString() };
    }

    async startImpersonation(
        targetUserId: string,
        adminCtx: AuthorizerContext,
    ): Promise<{ impersonatorId: string; impersonatedUserId: string; sessionId: string; startedAt: string }> {
        const [existing] = await this.db.select().from(users).where(eq(users.id, targetUserId)).limit(1);

        if (!existing) {
            throw new NotFoundException(`User ${targetUserId} not found`);
        }

        const sessionId = `imp-${adminCtx.userId}-${targetUserId}-${Date.now()}`;
        const now = new Date();

        this.logger.warn('impersonation started', {
            impersonatorId: adminCtx.userId,
            impersonatedUserId: targetUserId,
            sessionId,
        });

        return {
            impersonatorId: adminCtx.userId,
            impersonatedUserId: targetUserId,
            sessionId,
            startedAt: now.toISOString(),
        };
    }

    async stopImpersonation(
        targetUserId: string,
        adminCtx: AuthorizerContext,
    ): Promise<{ impersonatorId: string; impersonatedUserId: string; stoppedAt: string; message: string }> {
        const [existing] = await this.db.select().from(users).where(eq(users.id, targetUserId)).limit(1);

        if (!existing) {
            throw new NotFoundException(`User ${targetUserId} not found`);
        }

        const now = new Date();

        this.logger.warn('impersonation stopped', {
            impersonatorId: adminCtx.userId,
            impersonatedUserId: targetUserId,
        });

        return {
            impersonatorId: adminCtx.userId,
            impersonatedUserId: targetUserId,
            stoppedAt: now.toISOString(),
            message: 'Impersonation session ended',
        };
    }
}
