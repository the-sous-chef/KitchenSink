import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, ilike } from 'drizzle-orm';

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

    async listUsers(
        adminCtx: AuthorizerContext,
        filters: { email?: string; name?: string; sub?: string; limit?: number; offset?: number },
    ) {
        this.assertAdmin(adminCtx);

        const predicates = [
            filters.email ? ilike(users.email, `%${filters.email}%`) : undefined,
            filters.name ? ilike(users.name, `%${filters.name}%`) : undefined,
            filters.sub ? eq(users.id, filters.sub) : undefined,
        ].filter((predicate) => predicate !== undefined);

        const query = this.db
            .select({
                sub: users.id,
                email: users.email,
                name: users.name,
                picture: users.picture,
                status: users.status,
            })
            .from(users)
            .$dynamic();

        if (predicates.length > 0) {
            query.where(and(...predicates));
        }

        const limit = filters.limit ?? 50;
        const offset = filters.offset ?? 0;
        const rows = await query.limit(limit).offset(offset);

        return { users: rows, limit, offset };
    }

    async suspendUser(
        targetSub: string,
        adminCtx: AuthorizerContext,
    ): Promise<{ sub: string; status: 'suspended'; suspendedAt: string }> {
        this.assertAdmin(adminCtx);

        const [existing] = await this.db.select().from(users).where(eq(users.id, targetSub)).limit(1);

        if (!existing) {
            throw new NotFoundException(`User ${targetSub} not found`);
        }

        const now = new Date();
        await this.db.update(users).set({ status: 'suspended', updatedAt: now }).where(eq(users.id, targetSub));

        await this.auth0.blockUser(existing.id);

        this.logger.warn('user suspended', { adminSub: adminCtx.sub, targetSub, id: existing.id });

        return { sub: targetSub, status: 'suspended', suspendedAt: now.toISOString() };
    }

    async unsuspendUser(
        targetSub: string,
        adminCtx: AuthorizerContext,
    ): Promise<{ sub: string; status: 'active'; unsuspendedAt: string }> {
        this.assertAdmin(adminCtx);

        const [existing] = await this.db.select().from(users).where(eq(users.id, targetSub)).limit(1);

        if (!existing) {
            throw new NotFoundException(`User ${targetSub} not found`);
        }

        const now = new Date();
        await this.db.update(users).set({ status: 'active', updatedAt: now }).where(eq(users.id, targetSub));

        await this.auth0.unblockUser(existing.id);

        this.logger.warn('user unsuspended', { adminSub: adminCtx.sub, targetSub, id: existing.id });

        return { sub: targetSub, status: 'active', unsuspendedAt: now.toISOString() };
    }

    async startImpersonation(
        targetSub: string,
        adminCtx: AuthorizerContext,
    ): Promise<{ impersonatorSub: string; impersonatedSub: string; sessionId: string; startedAt: string }> {
        this.assertAdmin(adminCtx);

        const [existing] = await this.db.select().from(users).where(eq(users.id, targetSub)).limit(1);

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
        this.assertAdmin(adminCtx);

        const [existing] = await this.db.select().from(users).where(eq(users.id, targetSub)).limit(1);

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

    private assertAdmin(ctx: AuthorizerContext): void {
        if (!ctx.scopes.includes('admin:users') && !ctx.permissions.includes('admin:users')) {
            throw new ForbiddenException('Admin user scope required');
        }
    }
}
