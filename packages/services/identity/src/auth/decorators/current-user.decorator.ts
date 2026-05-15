import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { UserStatus } from '@kitchensink/auth-types';

export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.headers['x-kitchensink-user-id'] as string;

    if (!userId) {
        throw new UnauthorizedException('Missing identity context');
    }

    return userId;
});

export interface AuthorizerContext {
    userId: string;
    auth0Sub: string;
    email: string;
    status: UserStatus;
    isImpersonating: boolean;
}

export const CurrentAuthorizerContext = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): AuthorizerContext => {
        const request = ctx.switchToHttp().getRequest();

        const userId = request.headers['x-kitchensink-user-id'] as string | undefined;
        const auth0Sub = request.headers['x-kitchensink-auth0-sub'] as string | undefined;
        const email = request.headers['x-kitchensink-email'] as string | undefined;

        if (!userId || !auth0Sub || !email) {
            throw new UnauthorizedException('Missing required identity context headers');
        }

        const rawStatus = request.headers['x-kitchensink-status'] as string | undefined;
        const status: UserStatus = rawStatus === 'suspended' ? 'suspended' : 'active';
        const isImpersonating = request.headers['x-kitchensink-is-impersonating'] === 'true';

        return { userId, auth0Sub, email, status, isImpersonating };
    },
);

export function getAuthorizerContext(request: { headers: Record<string, unknown> }): AuthorizerContext {
    const userId = request.headers['x-kitchensink-user-id'] as string | undefined;
    const auth0Sub = request.headers['x-kitchensink-auth0-sub'] as string | undefined;
    const email = request.headers['x-kitchensink-email'] as string | undefined;

    if (!userId || !auth0Sub || !email) {
        throw new UnauthorizedException('Missing required identity context headers');
    }

    const rawStatus = request.headers['x-kitchensink-status'] as string | undefined;
    const status: UserStatus = rawStatus === 'suspended' ? 'suspended' : 'active';
    const isImpersonating = request.headers['x-kitchensink-is-impersonating'] === 'true';

    return { userId, auth0Sub, email, status, isImpersonating };
}
