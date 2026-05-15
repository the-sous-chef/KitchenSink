import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    lookupUserByIdAndAuth0Sub: vi.fn(),
    deleteAuth0User: vi.fn(),
    withExponentialRetry: vi.fn(),
    getExponentialDelayMs: vi.fn(),
    getDeletionQueueReceiveStats: vi.fn(),
    emitMetric: vi.fn(),
    loggerInfo: vi.fn(),
    loggerWarn: vi.fn(),
    loggerError: vi.fn(),
}));

vi.mock('../common/db.js', () => ({
    lookupUserByIdAndAuth0Sub: mocks.lookupUserByIdAndAuth0Sub,
}));

vi.mock('../common/auth0.js', () => ({
    deleteAuth0User: mocks.deleteAuth0User,
}));

vi.mock('../common/retry.js', () => ({
    withExponentialRetry: mocks.withExponentialRetry,
    getExponentialDelayMs: mocks.getExponentialDelayMs,
}));

vi.mock('../common/sqs.js', () => ({
    getDeletionQueueReceiveStats: mocks.getDeletionQueueReceiveStats,
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

const baseContext = {
    awsRequestId: 'aws-request-id',
} as import('aws-lambda').Context;

const baseRecord = {
    messageId: 'msg-1',
    receiptHandle: 'rh-1',
    body: JSON.stringify({
        userId: '00000000-0000-4000-8000-000000000001',
        auth0Sub: 'auth0|abc123',
        correlationId: 'corr-1',
        requestedAt: '2026-01-01T00:00:00.000Z',
        reason: 'user_request',
        source: 'identity-service',
    }),
    attributes: {
        ApproximateReceiveCount: '2',
    },
    messageAttributes: {},
    md5OfBody: 'abc',
    eventSource: 'aws:sqs',
    eventSourceARN: 'arn:aws:sqs:us-east-1:123:deletion-queue',
    awsRegion: 'us-east-1',
} as import('aws-lambda').SQSRecord;

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

describe('deletion-worker handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:db';
        process.env.AUTH0_MANAGEMENT_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:auth0';
        process.env.STAGE = 'test';
        process.env.DELETION_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123/deletion-queue';

        mocks.withExponentialRetry.mockImplementation(runRetryWithoutSleeping);
        mocks.getExponentialDelayMs.mockReturnValue(500);
        mocks.getDeletionQueueReceiveStats.mockResolvedValue({ visible: 0, inFlight: 1 });
    });

    it('UTS-017-A1 [MOD-017]: retries transient Auth0 failure and completes delete', async () => {
        mocks.lookupUserByIdAndAuth0Sub.mockResolvedValue({
            userId: '00000000-0000-4000-8000-000000000001',
            auth0Sub: 'auth0|abc123',
        });
        const transient = Object.assign(new Error('rate limit exceeded'), { statusCode: 429 });
        mocks.deleteAuth0User.mockRejectedValueOnce(transient).mockResolvedValueOnce(undefined);

        const { handler } = await import('../handlers/deletion-worker.js');

        await handler(
            {
                Records: [baseRecord],
            },
            baseContext,
            (() => undefined) as import('aws-lambda').Callback,
        );

        expect(mocks.deleteAuth0User).toHaveBeenCalledTimes(2);
        expect(mocks.emitMetric).toHaveBeenCalledWith('DeletionWorkerRetry', 1, { stage: 'test' });
        expect(mocks.emitMetric).toHaveBeenCalledWith('DeletionWorkerDeleted', 1, { stage: 'test' });
    });

    it('UTS-017-A2 [MOD-017/invalid-contract]: throws on invalid message contract to preserve deterministic DLQ behavior', async () => {
        const { handler } = await import('../handlers/deletion-worker.js');

        const invalidRecord = {
            ...baseRecord,
            body: JSON.stringify({
                userId: '',
                auth0Sub: 'auth0|abc123',
                correlationId: '',
                requestedAt: '',
            }),
        } as import('aws-lambda').SQSRecord;

        await expect(
            handler(
                {
                    Records: [invalidRecord],
                },
                baseContext,
                (() => undefined) as import('aws-lambda').Callback,
            ),
        ).rejects.toThrow();

        expect(mocks.emitMetric).toHaveBeenCalledWith('DeletionWorkerInvalidMessage', 1, { stage: 'test' });
        expect(mocks.deleteAuth0User).not.toHaveBeenCalled();
    });

    it('UTS-017-A1 [MOD-017/stale]: skips stale deletion messages when user+sub no longer match', async () => {
        mocks.lookupUserByIdAndAuth0Sub.mockResolvedValue(null);
        const { handler } = await import('../handlers/deletion-worker.js');

        await handler(
            {
                Records: [baseRecord],
            },
            baseContext,
            (() => undefined) as import('aws-lambda').Callback,
        );

        expect(mocks.emitMetric).toHaveBeenCalledWith('DeletionWorkerSkipped', 1, { stage: 'test' });
        expect(mocks.deleteAuth0User).not.toHaveBeenCalled();
    });

    it('UTS-017-A2 [MOD-017/non-transient]: rethrows non-transient deletion failures to preserve retry + DLQ redrive', async () => {
        mocks.lookupUserByIdAndAuth0Sub.mockResolvedValue({
            userId: '00000000-0000-4000-8000-000000000001',
            auth0Sub: 'auth0|abc123',
        });
        const nonTransient = Object.assign(new Error('forbidden'), { statusCode: 403 });
        mocks.deleteAuth0User.mockRejectedValueOnce(nonTransient);

        const { handler } = await import('../handlers/deletion-worker.js');

        await expect(
            handler(
                {
                    Records: [baseRecord],
                },
                baseContext,
                (() => undefined) as import('aws-lambda').Callback,
            ),
        ).rejects.toThrow('forbidden');

        expect(mocks.withExponentialRetry).toHaveBeenCalledOnce();
        expect(mocks.deleteAuth0User).toHaveBeenCalledTimes(1);
        expect(mocks.emitMetric).toHaveBeenCalledWith('DeletionWorkerErrors', 1, { stage: 'test' });
    });

    it('UTS-017-A1 [MOD-017/queue-stats]: emits queue stats warning but does not fail completed batch when queue lookup fails', async () => {
        mocks.lookupUserByIdAndAuth0Sub.mockResolvedValue(null);
        mocks.getDeletionQueueReceiveStats.mockRejectedValueOnce(new Error('sqs unavailable'));

        const { handler } = await import('../handlers/deletion-worker.js');

        await expect(
            handler(
                {
                    Records: [baseRecord],
                },
                baseContext,
                (() => undefined) as import('aws-lambda').Callback,
            ),
        ).resolves.toBeUndefined();

        expect(mocks.loggerWarn).toHaveBeenCalledWith(
            'deletion-worker queue stats failed',
            expect.objectContaining({
                code: 'DELETION_WORKER_QUEUE_STATS_FAILED',
            }),
        );
    });
});
