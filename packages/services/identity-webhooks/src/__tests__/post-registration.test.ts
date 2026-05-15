import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    updateUserMetadataUserId: vi.fn(),
    ensureUserAccountProfile: vi.fn(),
    emitMetric: vi.fn(),
    loggerInfo: vi.fn(),
    loggerWarn: vi.fn(),
    loggerError: vi.fn(),
    withExponentialRetry: vi.fn(),
    getExponentialDelayMs: vi.fn(),
}));

vi.mock('../common/auth0.js', () => ({
    updateUserMetadataUserId: mocks.updateUserMetadataUserId,
}));

vi.mock('../common/db.js', () => ({
    ensureUserAccountProfile: mocks.ensureUserAccountProfile,
}));

vi.mock('../common/retry.js', () => ({
    withExponentialRetry: mocks.withExponentialRetry,
    getExponentialDelayMs: mocks.getExponentialDelayMs,
}));

vi.mock('../common/observability.js', () => ({
    emitMetric: mocks.emitMetric,
    logger: {
        info: mocks.loggerInfo,
        warn: mocks.loggerWarn,
        error: mocks.loggerError,
    },
    withObservability: <TEvent, TResult>(
        handler: (event: TEvent, context: import('aws-lambda').Context) => Promise<TResult>,
    ) => handler,
}));

const context = {
    awsRequestId: 'aws-request-id',
} as import('aws-lambda').Context;

const baseEvent = {
    requestContext: {
        requestId: 'request-id',
    },
} as Partial<import('aws-lambda').APIGatewayProxyEvent>;

const invokePostRegistration = async (
    handler: import('aws-lambda').Handler<
        import('aws-lambda').APIGatewayProxyEvent,
        import('aws-lambda').APIGatewayProxyResult
    >,
    event: import('aws-lambda').APIGatewayProxyEvent,
): Promise<import('aws-lambda').APIGatewayProxyResult> => {
    return (await handler(
        event,
        context,
        (() => undefined) as import('aws-lambda').Callback,
    )) as import('aws-lambda').APIGatewayProxyResult;
};

const runRetryWithoutSleeping = async <T>(params: {
    maxAttempts: number;
    run: (attempt: number) => Promise<T>;
    shouldRetry: (error: unknown) => boolean;
}): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= params.maxAttempts; attempt += 1) {
        try {
            return await params.run(attempt);
        } catch (error) {
            lastError = error;

            if (attempt >= params.maxAttempts || !params.shouldRetry(error)) {
                throw error;
            }
        }
    }

    throw lastError;
};

describe('post-registration handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:db';
        process.env.AUTH0_MANAGEMENT_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:auth0';
        process.env.STAGE = 'test';

        mocks.getExponentialDelayMs.mockReturnValue(400);
        mocks.withExponentialRetry.mockImplementation(runRetryWithoutSleeping);
    });

    it('UTS-010-A1 [MOD-010]: ignores unverified app_metadata userId and retries transient DB failures', async () => {
        const transient = Object.assign(new Error('connection terminated'), { code: '08006' });
        mocks.ensureUserAccountProfile.mockRejectedValueOnce(transient).mockResolvedValueOnce({
            userId: '00000000-0000-4000-8000-000000000001',
            created: true,
        });

        const { handler } = await import('../handlers/post-registration.js');

        const result = await invokePostRegistration(handler, {
            ...baseEvent,
            body: JSON.stringify({
                user_id: 'google-oauth2|abc123',
                email: 'worker@test.dev',
                name: 'Worker User',
                app_metadata: {
                    userId: '11111111-1111-4111-8111-111111111111',
                },
                identities: [
                    {
                        provider: 'google-oauth2',
                        user_id: 'abc123',
                    },
                ],
            }),
        } as import('aws-lambda').APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        expect(mocks.ensureUserAccountProfile).toHaveBeenCalledTimes(2);
        expect(mocks.ensureUserAccountProfile.mock.calls[0]?.[0]).toMatchObject({
            preferredUserId: null,
            provider: 'google-oauth2',
            providerAccountId: 'abc123',
        });
        expect(mocks.updateUserMetadataUserId).toHaveBeenCalledWith({
            auth0SecretArn: process.env.AUTH0_MANAGEMENT_SECRET_ARN,
            auth0Sub: 'google-oauth2|abc123',
            userId: '00000000-0000-4000-8000-000000000001',
        });
        expect(mocks.emitMetric).toHaveBeenCalledWith('PostRegistrationRetry', 1, { stage: 'test' });
        expect(mocks.loggerWarn).toHaveBeenCalledWith(
            'post-registration ignored unverified preferred userId from payload',
            expect.objectContaining({ auth0Sub: 'google-oauth2|abc123' }),
        );
    });

    it('UTS-010-A2 [MOD-010/missing-env]: returns 500 when required env is missing', async () => {
        delete process.env.DB_SECRET_ARN;

        const { handler } = await import('../handlers/post-registration.js');

        const result = await invokePostRegistration(handler, {
            ...baseEvent,
            body: JSON.stringify({
                user_id: 'auth0|abc',
                email: 'user@test.dev',
            }),
        } as import('aws-lambda').APIGatewayProxyEvent);

        expect(result.statusCode).toBe(500);
        expect(mocks.ensureUserAccountProfile).not.toHaveBeenCalled();
    });

    it('UTS-010-A2 [MOD-010/non-transient]: does not retry non-transient DB errors', async () => {
        const nonTransient = Object.assign(new Error('duplicate key value violates unique constraint'), {
            code: '23505',
        });
        mocks.ensureUserAccountProfile.mockRejectedValueOnce(nonTransient);

        const { handler } = await import('../handlers/post-registration.js');

        const result = await invokePostRegistration(handler, {
            ...baseEvent,
            body: JSON.stringify({
                user_id: 'auth0|abc123',
                email: 'user@test.dev',
                identities: [],
            }),
        } as import('aws-lambda').APIGatewayProxyEvent);

        expect(result.statusCode).toBe(500);
        expect(mocks.ensureUserAccountProfile).toHaveBeenCalledTimes(1);
        expect(mocks.emitMetric).not.toHaveBeenCalledWith(
            'PostRegistrationRetry',
            expect.any(Number),
            expect.any(Object),
        );
    });

    it('UTS-010-A2 [MOD-010/missing-body]: returns structured error envelope when payload body is missing', async () => {
        const { handler } = await import('../handlers/post-registration.js');

        const result = await invokePostRegistration(handler, {
            ...baseEvent,
            body: null,
        } as unknown as import('aws-lambda').APIGatewayProxyEvent);

        expect(result.statusCode).toBe(500);
        const envelope = JSON.parse(result.body) as {
            code: string;
            message: string;
            requestId: string;
            cause?: { message?: string };
        };
        expect(envelope.code).toBe('POST_REGISTRATION_SYNC_FAILED');
        expect(envelope.requestId).toBe('request-id');
        expect(envelope.cause?.message).toContain('Missing post-registration payload body');
        expect(mocks.emitMetric).toHaveBeenCalledWith('PostRegistrationErrors', 1, { stage: 'test' });
    });
});
