import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

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
    status: string;
    isImpersonating: string;
}

export const CurrentAuthorizerContext = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): AuthorizerContext => {
        const request = ctx.switchToHttp().getRequest();

        return {
            userId: request.headers['x-kitchensink-user-id'] as string,
            auth0Sub: request.headers['x-kitchensink-auth0-sub'] as string,
            email: request.headers['x-kitchensink-email'] as string,
            status: request.headers['x-kitchensink-status'] as string,
            isImpersonating: request.headers['x-kitchensink-is-impersonating'] as string,
        };
    },
);

export function getAuthorizerContext(request: { headers: Record<string, unknown> }): AuthorizerContext {
    return {
        userId: request.headers['x-kitchensink-user-id'] as string,
        auth0Sub: request.headers['x-kitchensink-auth0-sub'] as string,
        email: request.headers['x-kitchensink-email'] as string,
        status: request.headers['x-kitchensink-status'] as string,
        isImpersonating: request.headers['x-kitchensink-is-impersonating'] as string,
    };
}
