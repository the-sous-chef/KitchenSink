import { Injectable, UnauthorizedException, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

import type { AuthorizerContext } from '../../types/index.js';

const PUBLIC_PATHS = new Set(['/health']);

function getPath(req: Request): string {
    return req.originalUrl?.split('?')[0]?.replace(/\/$/, '') || '/';
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    public use(req: Request & { user?: AuthorizerContext }, _res: Response, next: NextFunction): void {
        const path = getPath(req);

        if (PUBLIC_PATHS.has(path) || PUBLIC_PATHS.has(req.path)) {
            next();

            return;
        }

        const header = req.headers['x-authorizer-context'];

        if (typeof header === 'string') {
            try {
                const decoded = Buffer.from(header, 'base64').toString('utf-8');
                const ctx = JSON.parse(decoded) as AuthorizerContext;

                if (isAuthorizerContext(ctx)) {
                    req.user = {
                        ...ctx,
                        scopes: ctx.scopes,
                        permissions: ctx.permissions,
                    };
                }
            } catch {
                /* no-op — leave req.user undefined */
            }
        }

        if (!req.user) {
            throw new UnauthorizedException('Missing authorizer context');
        }

        next();
    }
}

function isAuthorizerContext(value: unknown): value is AuthorizerContext {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const ctx = value as Partial<AuthorizerContext>;

    return (
        typeof ctx.userId === 'string' &&
        Array.isArray(ctx.scopes) &&
        Array.isArray(ctx.permissions) &&
        ctx.tokenType === 'user'
    );
}
