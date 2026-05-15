import type { APIGatewayRequestAuthorizerEvent, APIGatewayAuthorizerResult, Context } from 'aws-lambda';

import type { AuthorizerContext, UserId } from '@kitchensink/auth-types';

import { getUserStatusByAuth0Sub } from '../common/db.js';
import { buildErrorEnvelope, getErrorCause, resolveRequestId } from '../common/error-envelope.js';
import { verifyAuth0Jwt } from '../common/jwt.js';
import { emitMetric, logger, withObservability } from '../common/observability.js';

/**
 * Existing invoker: API Gateway REQUEST authorizer (`functions.authorizer` in `packages/infra/identity/serverless.yml`).
 * @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025
 */

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const unauthorized = (): never => {
    throw new Error('Unauthorized');
};

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const redactSensitiveText = (value: string): string =>
    value
        .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
        .replace(/\b[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED_JWT]');

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const sanitizeErrorCause = (error: unknown): unknown => {
    const cause = getErrorCause(error);

    if (cause && typeof cause === 'object') {
        const { stack: _stack, ...rest } = cause as Record<string, unknown>;

        if (typeof rest.message === 'string') {
            return {
                ...rest,
                message: redactSensitiveText(rest.message),
            };
        }

        return rest;
    }

    if (typeof cause === 'string') {
        return redactSensitiveText(cause);
    }

    return cause;
};

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const createPolicy = (params: {
    principalId: string;
    effect: 'Allow' | 'Deny';
    methodArn: string;
    context?: Record<string, string | number | boolean>;
}): APIGatewayAuthorizerResult => ({
    principalId: params.principalId,
    policyDocument: {
        Version: '2012-10-17',
        Statement: [
            {
                Action: 'execute-api:Invoke',
                Effect: params.effect,
                Resource: params.methodArn,
            },
        ],
    },
    ...(params.context ? { context: params.context } : {}),
});

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

    if (raw.trim().split(/\s+/).length !== 2) {
        return unauthorized();
    }

    if (token.length === 0) {
        return unauthorized();
    }

    return token;
};

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const innerHandler = async (
    event: APIGatewayRequestAuthorizerEvent,
    context: Context,
): Promise<APIGatewayAuthorizerResult> => {
    const requestId = resolveRequestId(context, event.requestContext.requestId);

    try {
        const auth0ManagementSecretArn = process.env.AUTH0_MANAGEMENT_SECRET_ARN;
        const dbSecretArn = process.env.DB_SECRET_ARN;

        if (!auth0ManagementSecretArn || !dbSecretArn) {
            throw new Error('Missing AUTH0_MANAGEMENT_SECRET_ARN or DB_SECRET_ARN');
        }

        const token = parseBearerToken(event);
        const verified = await verifyAuth0Jwt({
            token,
            auth0SecretArn: auth0ManagementSecretArn,
        });

        const auth0Sub = verified.payload.sub;

        if (!auth0Sub) {
            return unauthorized();
        }

        const userRecord = await getUserStatusByAuth0Sub(dbSecretArn, auth0Sub);

        if (!userRecord) {
            return unauthorized();
        }

        if (userRecord.status === 'suspended') {
            emitMetric('AuthorizerDeniedSuspended', 1, { stage: process.env.STAGE ?? 'dev' });
            logger.warn('authorizer denied suspended user', {
                requestId,
                auth0Sub,
                userId: userRecord.userId,
            });

            return createPolicy({
                principalId: auth0Sub,
                effect: 'Deny',
                methodArn: event.methodArn,
            });
        }

        const userIdClaim = verified.payload['https://kitchensink.dev/userId'];
        const userId =
            typeof userIdClaim === 'string' && userIdClaim.length > 0 ? (userIdClaim as UserId) : userRecord.userId;

        const scope = typeof verified.payload.scope === 'string' ? verified.payload.scope.split(' ') : [];
        const audience = Array.isArray(verified.payload.aud)
            ? verified.payload.aud.filter((value): value is string => typeof value === 'string')
            : typeof verified.payload.aud === 'string'
              ? [verified.payload.aud]
              : [];

        const authContext: AuthorizerContext = {
            principalId: auth0Sub,
            userId,
            auth0Sub,
            scope,
            audience,
            issuedAt: verified.payload.iat ?? 0,
            expiresAt: verified.payload.exp ?? 0,
            status: userRecord.status,
        };

        emitMetric('AuthorizerAllow', 1, { stage: process.env.STAGE ?? 'dev' });
        logger.info('authorizer allow', {
            requestId,
            auth0Sub,
            userId,
        });

        return createPolicy({
            principalId: auth0Sub,
            effect: 'Allow',
            methodArn: event.methodArn,
            context: {
                userId: authContext.userId,
                auth0Sub: authContext.auth0Sub,
                status: authContext.status,
                scope: authContext.scope.join(' '),
                audience: authContext.audience.join(','),
                issuedAt: authContext.issuedAt,
                expiresAt: authContext.expiresAt,
                principalId: authContext.principalId,
            },
        });
    } catch (error) {
        const envelope = buildErrorEnvelope(
            'AUTHORIZER_VALIDATION_FAILED',
            'Failed to validate request authorization token',
            requestId,
            sanitizeErrorCause(error),
        );

        logger.warn('authorizer unauthorized', { ...envelope });
        emitMetric('AuthorizerUnauthorized', 1, { stage: process.env.STAGE ?? 'dev' });

        return unauthorized();
    }
};

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
export const handler = withObservability(innerHandler);
