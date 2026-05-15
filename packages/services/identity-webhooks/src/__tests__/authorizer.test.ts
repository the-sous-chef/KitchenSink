import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    verifyAuth0Jwt: vi.fn(),
    getUserStatusByAuth0Sub: vi.fn(),
    emitMetric: vi.fn(),
    loggerWarn: vi.fn(),
    loggerInfo: vi.fn(),
}));

vi.mock('../common/jwt.js', () => ({
    verifyAuth0Jwt: mocks.verifyAuth0Jwt,
}));

vi.mock('../common/db.js', () => ({
    getUserStatusByAuth0Sub: mocks.getUserStatusByAuth0Sub,
}));

vi.mock('../common/observability.js', () => ({
    emitMetric: mocks.emitMetric,
    logger: {
        warn: mocks.loggerWarn,
        info: mocks.loggerInfo,
    },
    withObservability: <TEvent, TResult>(
        handler: (event: TEvent, context: import('aws-lambda').Context) => Promise<TResult>,
    ) => handler,
}));

const baseEvent = {
    type: 'REQUEST',
    methodArn: 'arn:aws:execute-api:us-east-1:123456789012:api-id/dev/POST/webhooks/protected/profile',
    requestContext: {
        requestId: 'req-123',
    },
};

const baseContext = {
    awsRequestId: 'aws-req-123',
} as import('aws-lambda').Context;

const invokeAuthorizer = async (
    handler: import('aws-lambda').Handler<import('aws-lambda').APIGatewayRequestAuthorizerEvent>,
    event: import('aws-lambda').APIGatewayRequestAuthorizerEvent,
) =>
    (await handler(
        event,
        baseContext,
        (() => {}) as import('aws-lambda').Callback,
    )) as import('aws-lambda').APIGatewayAuthorizerResult;

describe('authorizer handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.AUTH0_MANAGEMENT_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:auth0';
        process.env.DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:db';
        process.env.STAGE = 'test';
    });

    it('UTS-024-A1 [MOD-024]: returns allow with minimal safe context for valid token', async () => {
        mocks.verifyAuth0Jwt.mockResolvedValue({
            payload: {
                sub: 'auth0|abc123',
                aud: ['https://api.kitchensink.dev'],
                scope: 'read:profile update:profile',
                iat: 1710000000,
                exp: 1710003600,
                'https://kitchensink.dev/userId': 'usr_123',
            },
        });
        mocks.getUserStatusByAuth0Sub.mockResolvedValue({
            userId: 'usr_123',
            status: 'active',
        });

        const { handler } = await import('../handlers/authorizer.js');

        const result = await invokeAuthorizer(handler, {
            ...baseEvent,
            headers: {
                Authorization: 'Bearer header.payload.signature',
            },
        } as unknown as import('aws-lambda').APIGatewayRequestAuthorizerEvent);

        expect(result.policyDocument.Statement[0]?.Effect).toBe('Allow');
        expect(result.context).toEqual({
            userId: 'usr_123',
            auth0Sub: 'auth0|abc123',
            status: 'active',
            scope: 'read:profile update:profile',
            audience: 'https://api.kitchensink.dev',
            issuedAt: 1710000000,
            expiresAt: 1710003600,
            principalId: 'auth0|abc123',
        });
        expect(Object.keys(result.context ?? {}).sort()).toEqual([
            'audience',
            'auth0Sub',
            'expiresAt',
            'issuedAt',
            'principalId',
            'scope',
            'status',
            'userId',
        ]);
        expect(JSON.stringify(result.context)).not.toContain('header.payload.signature');
    });

    it('UTS-025-A1 [MOD-025]: returns deny without context for suspended user', async () => {
        mocks.verifyAuth0Jwt.mockResolvedValue({
            payload: {
                sub: 'auth0|suspended',
                aud: 'https://api.kitchensink.dev',
            },
        });
        mocks.getUserStatusByAuth0Sub.mockResolvedValue({
            userId: 'usr_suspended',
            status: 'suspended',
        });

        const { handler } = await import('../handlers/authorizer.js');

        const result = await invokeAuthorizer(handler, {
            ...baseEvent,
            headers: {
                Authorization: 'Bearer header.payload.signature',
            },
        } as unknown as import('aws-lambda').APIGatewayRequestAuthorizerEvent);

        expect(result.policyDocument.Statement[0]?.Effect).toBe('Deny');
        expect(result.context).toBeUndefined();
    });

    it('UTS-024-A2 [MOD-024/malformed]: rejects malformed bearer header', async () => {
        const { handler } = await import('../handlers/authorizer.js');

        await expect(
            invokeAuthorizer(handler, {
                ...baseEvent,
                headers: {
                    Authorization: 'Bearer token extra',
                },
            } as unknown as import('aws-lambda').APIGatewayRequestAuthorizerEvent),
        ).rejects.toThrow('Unauthorized');
    });

    it('UTS-024-A2 [MOD-024/missing-header]: rejects missing bearer header', async () => {
        const { handler } = await import('../handlers/authorizer.js');

        await expect(
            invokeAuthorizer(handler, {
                ...baseEvent,
                headers: {},
            } as unknown as import('aws-lambda').APIGatewayRequestAuthorizerEvent),
        ).rejects.toThrow('Unauthorized');
    });

    it.each([
        ['invalid issuer', 'JWTClaimValidationFailed: unexpected "iss" claim value'],
        ['invalid audience', 'JWTClaimValidationFailed: unexpected "aud" claim value'],
        ['invalid signature', 'JWSSignatureVerificationFailed'],
        ['expired token', 'JWTExpired'],
        ['unknown kid', 'Unable to find a signing key that matches kid'],
    ])('rejects unauthorized for %s', async (_name, message) => {
        mocks.verifyAuth0Jwt.mockRejectedValueOnce(new Error(message));

        const { handler } = await import('../handlers/authorizer.js');

        await expect(
            invokeAuthorizer(handler, {
                ...baseEvent,
                headers: {
                    Authorization: 'Bearer header.payload.signature',
                },
            } as unknown as import('aws-lambda').APIGatewayRequestAuthorizerEvent),
        ).rejects.toThrow('Unauthorized');

        expect(mocks.verifyAuth0Jwt).toHaveBeenCalledWith({
            token: 'header.payload.signature',
            auth0SecretArn: process.env.AUTH0_MANAGEMENT_SECRET_ARN,
        });
        expect(mocks.emitMetric).toHaveBeenCalledWith('AuthorizerUnauthorized', 1, { stage: 'test' });
    });

    it('UTS-024-A2 [MOD-024/missing-sub]: rejects token with missing subject claim', async () => {
        mocks.verifyAuth0Jwt.mockResolvedValue({
            payload: {
                aud: ['https://api.kitchensink.dev'],
            },
        });

        const { handler } = await import('../handlers/authorizer.js');

        await expect(
            invokeAuthorizer(handler, {
                ...baseEvent,
                headers: {
                    Authorization: 'Bearer header.payload.signature',
                },
            } as unknown as import('aws-lambda').APIGatewayRequestAuthorizerEvent),
        ).rejects.toThrow('Unauthorized');

        expect(mocks.getUserStatusByAuth0Sub).not.toHaveBeenCalled();
    });

    it('UTS-025-A2 [MOD-025/unknown-user]: rejects unknown user from database lookup', async () => {
        mocks.verifyAuth0Jwt.mockResolvedValue({
            payload: {
                sub: 'auth0|missing',
                aud: ['https://api.kitchensink.dev'],
            },
        });
        mocks.getUserStatusByAuth0Sub.mockResolvedValue(null);

        const { handler } = await import('../handlers/authorizer.js');

        await expect(
            invokeAuthorizer(handler, {
                ...baseEvent,
                headers: {
                    Authorization: 'Bearer header.payload.signature',
                },
            } as unknown as import('aws-lambda').APIGatewayRequestAuthorizerEvent),
        ).rejects.toThrow('Unauthorized');

        expect(mocks.emitMetric).toHaveBeenCalledWith('AuthorizerUnauthorized', 1, { stage: 'test' });
    });

    it('UTS-024-A2 [MOD-024/sanitize]: sanitizes sensitive token material from warning logs', async () => {
        const leaked =
            'failed Bearer header.payload.signature for token header.payload.signature because signature is invalid';
        mocks.verifyAuth0Jwt.mockRejectedValueOnce(new Error(leaked));

        const { handler } = await import('../handlers/authorizer.js');

        await expect(
            invokeAuthorizer(handler, {
                ...baseEvent,
                headers: {
                    Authorization: 'Bearer header.payload.signature',
                },
            } as unknown as import('aws-lambda').APIGatewayRequestAuthorizerEvent),
        ).rejects.toThrow('Unauthorized');

        const warnCall = mocks.loggerWarn.mock.calls.find((call) => call[0] === 'authorizer unauthorized');
        expect(warnCall).toBeDefined();
        const envelope = warnCall?.[1] as { cause?: { message?: string } };
        expect(envelope.cause?.message).toContain('Bearer [REDACTED]');
        expect(envelope.cause?.message).toContain('[REDACTED_JWT]');
        expect(envelope.cause?.message).not.toContain('header.payload.signature');
    });
});
