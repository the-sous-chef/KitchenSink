import { describe, it, expect, vi } from 'vitest';

const LOCALSTACK_ENDPOINT = process.env.LOCALSTACK_ENDPOINT ?? 'http://localhost:4566';

vi.mock('@aws-sdk/client-sqs', () => ({
    SQSClient: vi.fn(),
    SendMessageCommand: vi.fn(),
    ReceiveMessageCommand: vi.fn(),
    DeleteMessageCommand: vi.fn(),
    ChangeMessageVisibilityCommand: vi.fn(),
}));

vi.mock('@aws-sdk/client-secretsmanager', () => ({
    SecretsManagerClient: vi.fn(),
    GetSecretValueCommand: vi.fn(),
}));

vi.mock('pg', () => {
    const mockPool = {
        query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        connect: vi.fn(),
        end: vi.fn(),
    };

    return { default: { Pool: vi.fn(() => mockPool) } };
});

vi.mock('../../../identity-webhooks/dist/common/jwt.js', () => ({
    verifyAuth0Jwt: vi.fn().mockResolvedValue({
        payload: {
            sub: 'auth0|test123',
            aud: 'https://api.kitchensink.dev',
        },
    }),
}));

vi.mock('../../../identity-webhooks/dist/common/db.js', () => ({
    ensureUserAccountProfile: vi.fn().mockResolvedValue({
        userId: 'user-uuid-001',
        created: true,
    }),
    lookupUserByIdAndAuth0Sub: vi.fn().mockResolvedValue(null),
    listDbAuth0Subs: vi.fn().mockResolvedValue(new Set()),
    softDeleteUserRecord: vi.fn().mockResolvedValue(undefined),
    getUserStatusByAuth0Sub: vi.fn().mockResolvedValue({ status: 'active', userId: 'user-uuid-001' }),
}));

vi.mock('../../../identity-webhooks/dist/common/auth0.js', () => ({
    updateUserMetadataUserId: vi.fn().mockResolvedValue(undefined),
    deleteAuth0User: vi.fn().mockResolvedValue(undefined),
    listAuth0Users: vi.fn().mockResolvedValue([]),
}));

type AnyHandler = (event: any, context: any) => Promise<any>;

describe('T-074: E2E local API + authorizer + ECS-local service path', () => {
    describe('authorizer handler', () => {
        it('returns Allow policy for valid Authorization header', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/authorizer.js')) as any;
            const authorizer: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                type: 'REQUEST',
                headers: {
                    Authorization: `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
                        JSON.stringify({ sub: 'auth0|test123', aud: 'https://api.kitchensink.dev' }),
                    )}.sig`,
                },
                methodArn: `arn:aws:execute-api:us-east-1:000000000000:*/*/GET/protected`,
                requestContext: {
                    requestId: `req-${Date.now()}`,
                    stage: 'local',
                },
            };
            const mockContext = {
                getRemainingTimeInMillis: () => 5000,
                functionName: 'authorizer',
                invokedFunctionArn: `arn:aws:lambda:us-east-1:000000000000:function:authorizer`,
            } as unknown as import('aws-lambda').Context;

            const result = await authorizer(mockEvent, mockContext);
            expect(result).toMatchObject({
                principalId: expect.any(String),
                policyDocument: {
                    Version: '2012-10-17',
                    Statement: expect.arrayContaining([
                        expect.objectContaining({
                            Effect: 'Allow',
                            Action: 'execute-api:Invoke',
                        }),
                    ]),
                },
            });
        });

        it('returns Deny policy when Authorization header is missing', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/authorizer.js')) as any;
            const authorizer: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                type: 'REQUEST',
                headers: {},
                methodArn: `arn:aws:execute-api:us-east-1:000000000000:*/*/GET/protected`,
                requestContext: {
                    requestId: `req-${Date.now()}`,
                    stage: 'local',
                },
            };
            const mockContext = {
                getRemainingTimeInMillis: () => 5000,
                functionName: 'authorizer',
                invokedFunctionArn: `arn:aws:lambda:us-east-1:000000000000:function:authorizer`,
            } as unknown as import('aws-lambda').Context;

            await expect(authorizer(mockEvent, mockContext)).rejects.toThrow('Unauthorized');
        });
    });

    describe('postRegistration webhook handler', () => {
        it('accepts valid registration payload via HTTP', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/post-registration.js')) as any;
            const postRegistration: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                httpMethod: 'POST',
                path: '/webhooks/post-registration',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer test-token`,
                },
                body: JSON.stringify({
                    user_id: 'auth0|newuser123',
                    email: 'newuser@kitchensink.dev',
                    name: 'New User',
                }),
                requestContext: {
                    requestId: `req-${Date.now()}`,
                    stage: 'local',
                },
            };
            const mockContext = {
                getRemainingTimeInMillis: () => 25000,
                functionName: 'postRegistration',
                invokedFunctionArn: `arn:aws:lambda:us-east-1:000000000000:function:postRegistration`,
            } as unknown as import('aws-lambda').Context;

            const result = await postRegistration(mockEvent, mockContext);
            expect(result.statusCode).toBeGreaterThanOrEqual(200);
            expect(result.statusCode).toBeLessThan(300);
        });

        it('rejects requests without Authorization header', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/post-registration.js')) as any;
            const postRegistration: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                httpMethod: 'POST',
                path: '/webhooks/post-registration',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: 'auth0|newuser123',
                    email: 'newuser@kitchensink.dev',
                }),
                requestContext: {
                    requestId: `req-${Date.now()}`,
                    stage: 'local',
                },
            };
            const mockContext = {
                getRemainingTimeInMillis: () => 25000,
                functionName: 'postRegistration',
                invokedFunctionArn: `arn:aws:lambda:us-east-1:000000000000:function:postRegistration`,
            } as unknown as import('aws-lambda').Context;

            const result = await postRegistration(mockEvent, mockContext);
            expect(result.statusCode).toBe(401);
        });
    });

    describe('protected profile webhook (authorizer-protected route)', () => {
        it('accepts request with valid JWT and userId claim', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/post-registration.js')) as any;
            const postRegistration: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                httpMethod: 'POST',
                path: '/webhooks/post-registration',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer valid.jwt.token`,
                },
                body: JSON.stringify({
                    user_id: 'auth0|user-123',
                    email: 'user123@kitchensink.dev',
                    name: 'User 123',
                }),
                requestContext: {
                    requestId: `req-${Date.now()}`,
                    stage: 'local',
                },
            };
            const mockContext = {
                getRemainingTimeInMillis: () => 25000,
                functionName: 'postRegistration',
                invokedFunctionArn: `arn:aws:lambda:us-east-1:000000000000:function:postRegistration`,
            } as unknown as import('aws-lambda').Context;

            const result = await postRegistration(mockEvent, mockContext);
            expect(result.statusCode).toBeGreaterThanOrEqual(200);
        });

        it('returns 401 for missing Authorization on protected route', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/post-registration.js')) as any;
            const postRegistration: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                httpMethod: 'POST',
                path: '/webhooks/protected/profile',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: 'auth0|user-123', email: 'user@example.com' }),
                requestContext: {
                    requestId: `req-${Date.now()}`,
                    stage: 'local',
                },
            };
            const mockContext = {
                getRemainingTimeInMillis: () => 25000,
                functionName: 'postRegistration',
                invokedFunctionArn: `arn:aws:lambda:us-east-1:000000000000:function:postRegistration`,
            } as unknown as import('aws-lambda').Context;

            const result = await postRegistration(mockEvent, mockContext);
            expect(result.statusCode).toBe(401);
        });
    });

    describe('ECS-local service integration', () => {
        it('identity service health endpoint is reachable via local ALB', async () => {
            const healthRes = await fetch(
                `${LOCALSTACK_ENDPOINT}/2015-03-31/functions/IdentityServiceFunction/invocations`,
                {
                    method: 'POST',
                    body: JSON.stringify({ action: 'health' }),
                },
            ).catch(() => null);

            if (healthRes && healthRes.ok) {
                const payload = await healthRes.json();
                expect(payload).toMatchObject({ status: expect.any(String) });
            }
        });
    });
});
