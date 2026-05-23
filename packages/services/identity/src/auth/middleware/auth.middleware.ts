import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

import type { AuthorizerContext } from '@kitchensink/auth-types';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    public use(req: Request & { user?: AuthorizerContext & { scopes: string[] } }, _res: Response, next: NextFunction): void {
        const header = req.headers['x-authorizer-context'];

        if (typeof header === 'string') {
            try {
                const decoded = Buffer.from(header, 'base64').toString('utf-8');
                const ctx = JSON.parse(decoded) as AuthorizerContext & { scopes: string[] };

                if (ctx?.sub && ctx?.scopes?.length) {
                    req.user = ctx;
                }
            } catch {
                /* no-op — leave req.user undefined */
            }
        }

        next();
    }
}
