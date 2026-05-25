import type { APIGatewayRequestAuthorizerEvent, APIGatewayAuthorizerResult, Context } from 'aws-lambda';

import type { AuthorizerContext } from '@kitchensink/auth-types';

import { requireEnv } from '../common/config.js';
import { verifyToken } from './jwt.js';

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const unauthorized = (): never => {
    throw new Error('Unauthorized');
};

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const parseBearerToken = (event: APIGatewayRequestAuthorizerEvent): string => {
    const raw = event.headers?.Authorization ?? event.headers?.authorization;

    if (!raw) {
        return unauthorized();
    }

    const [scheme, token] = raw.trim().split(/\s+/);

    if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
        return unauthorized();
    }

    return token;
};

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const buildPolicy = (
    principalId: string,
    effect: 'Allow' | 'Deny',
    methodArn: string,
    context?: Record<string, string | number | boolean>,
): APIGatewayAuthorizerResult => ({
    principalId,
    policyDocument: {
        Version: '2012-10-17',
        Statement: [
            {
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: methodArn,
            },
        ],
    },
    ...(context ? { context } : {}),
});

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const serializeContext = (ctx: AuthorizerContext): Record<string, string | number | boolean> => ({
    sub: ctx.sub,
    ...(ctx.email !== undefined ? { email: ctx.email } : {}),
    scopes: JSON.stringify(ctx.scopes),
    permissions: JSON.stringify(ctx.permissions),
    isM2M: ctx.isM2M,
    tokenType: ctx.tokenType,
});

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
export const handler = async (
    event: APIGatewayRequestAuthorizerEvent,
    _context: Context,
): Promise<APIGatewayAuthorizerResult> => {
    try {
        const auth0Domain = requireEnv('AUTH0_DOMAIN');
        const audience = requireEnv('AUTH0_AUDIENCE');

        const issuer = `https://${auth0Domain}/`;
        const jwksUri = `https://${auth0Domain}/.well-known/jwks.json`;

        const token = parseBearerToken(event);

        const payload = await verifyToken(token, { jwksUri, audience, issuer });

        if (!payload.sub) {
            return unauthorized();
        }

        const isM2M = payload.gty === 'client-credentials' || payload.sub.endsWith('@clients');

        const authContext: AuthorizerContext = {
            sub: payload.sub,
            ...(payload.email !== undefined ? { email: payload.email } : {}),
            scopes: (payload.scope ?? '').split(' ').filter(Boolean),
            permissions: payload.permissions ?? [],
            isM2M,
            tokenType: isM2M ? 'm2m' : 'user',
        };

        return buildPolicy(payload.sub, 'Allow', event.methodArn, serializeContext(authContext));
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            throw err;
        }

        throw new Error('Unauthorized');
    }
};
