import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

import { users, DrizzleProvider } from '../database/index.js';
import { Auth0Service } from '../auth/auth0.service.js';
import type { AuthorizerContext } from '../auth/decorators/current-user.decorator.js';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        @Inject(DrizzleProvider) private readonly db: NodePgDatabase,
        private readonly auth0: Auth0Service,
    ) {}

    async suspendUser(
        targetSub: string,
        adminCtx: AuthorizerContext,
    ): Promise<{ sub: string; status: 'suspended'; suspendedAt: string }> {
        const [existing] = await this.db.select().from(users).where(eq(users.sub, targetSub)).limit(1);

        if (!existing) {
            throw new NotFoundException(`User ${targetSub} not found`);
        }

        const now = new Date();
        await this.db.update(users).set({ status: 'suspended', updatedAt: now }).where(eq(users.sub, targetSub));

        await this.auth0.blockUser(existing.sub);

        this.logger.warn('user suspended', { adminSub: adminCtx.sub, targetSub, sub: existing.sub });

        return { sub: targetSub, status: 'suspended', suspendedAt: now.toISOString() };
    }

    async unsuspendUser(
        targetSub: string,
        adminCtx: AuthorizerContext,
    ): Promise<{ sub: string; status: 'active'; unsuspendedAt: string }> {
        const [existing] = await this.db.select().from(users).where(eq(users.sub, targetSub)).limit(1);

        if (!existing) {
            throw new NotFoundException(`User ${targetSub} not found`);
        }

        const now = new Date();
        await this.db.update(users).set({ status: 'active', updatedAt: now }).where(eq(users.sub, targetSub));

        await this.auth0.unblockUser(existing.sub);

        this.logger.warn('user unsuspended', { adminSub: adminCtx.sub, targetSub, sub: existing.sub });

        return { sub: targetSub, status: 'active', unsuspendedAt: now.toISOString() };
    }

    async startImpersonation(
        targetSub: string,
        adminCtx: AuthorizerContext,
    ): Promise<{ impersonatorSub: string; impersonatedSub: string; sessionId: string; startedAt: string }> {
        const [existing] = await this.db.select().from(users).where(eq(users.sub, targetSub)).limit(1);

        if (!existing) {
            throw new NotFoundException(`User ${targetSub} not found`);
        }

        const sessionId = `imp-${adminCtx.sub}-${targetSub}-${Date.now()}`;
        const now = new Date();

        this.logger.warn('impersonation started', {
            impersonatorSub: adminCtx.sub,
            impersonatedSub: targetSub,
            sessionId,
        });

        return {
            impersonatorSub: adminCtx.sub,
            impersonatedSub: targetSub,
            sessionId,
            startedAt: now.toISOString(),
        };
    }

    async stopImpersonation(
        targetSub: string,
        adminCtx: AuthorizerContext,
    ): Promise<{ impersonatorSub: string; impersonatedSub: string; stoppedAt: string; message: string }> {
        const [existing] = await this.db.select().from(users).where(eq(users.sub, targetSub)).limit(1);

        if (!existing) {
            throw new NotFoundException(`User ${targetSub} not found`);
        }

        const now = new Date();

        this.logger.warn('impersonation stopped', {
            impersonatorSub: adminCtx.sub,
            impersonatedSub: targetSub,
        });

        return {
            impersonatorSub: adminCtx.sub,
            impersonatedSub: targetSub,
            stoppedAt: now.toISOString(),
            message: 'Impersonation session ended',
        };
    }
}
