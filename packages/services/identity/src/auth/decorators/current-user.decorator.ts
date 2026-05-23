import type { AuthorizerContext } from '@kitchensink/auth-types';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type { AuthorizerContext };

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthorizerContext => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthorizerContext }>();
    return request.user as AuthorizerContext;
});

export const CurrentAuthorizerContext = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): AuthorizerContext => {
        const request = ctx.switchToHttp().getRequest<{ user?: AuthorizerContext }>();
        return request.user as AuthorizerContext;
    },
);
