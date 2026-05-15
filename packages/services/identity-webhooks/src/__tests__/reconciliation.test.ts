import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    listAuth0Users: vi.fn(),
    listDbAuth0Subs: vi.fn(),
    ensureUserAccountProfile: vi.fn(),
    withExponentialRetry: vi.fn(),
    getExponentialDelayMs: vi.fn(),
    emitMetric: vi.fn(),
    loggerInfo: vi.fn(),
    loggerWarn: vi.fn(),
    loggerError: vi.fn(),
}));

vi.mock('../common/auth0.js', () => ({
    listAuth0Users: mocks.listAuth0Users,
}));

vi.mock('../common/db.js', () => ({
    listDbAuth0Subs: mocks.listDbAuth0Subs,
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

const baseContext = {
    awsRequestId: 'aws-request-id',
} as import('aws-lambda').Context;

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

describe('reconciliation handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:db';
        process.env.AUTH0_MANAGEMENT_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:auth0';
        process.env.STAGE = 'test';

        mocks.getExponentialDelayMs.mockReturnValue(400);
        mocks.withExponentialRetry.mockImplementation(runRetryWithoutSleeping);
    });

    it('repairs missing DB user and retries transient db errors deterministically', async () => {
        mocks.listAuth0Users.mockResolvedValue([
            {
                sub: 'auth0|existing',
                email: 'existing@test.dev',
                name: 'Existing',
                picture: null,
            },
            {
                sub: 'google-oauth2|missing',
                email: 'missing@test.dev',
                name: 'Missing User',
                picture: 'https://cdn.dev/avatar.png',
            },
        ]);
        mocks.listDbAuth0Subs.mockResolvedValue(new Set(['auth0|existing']));
        const transient = Object.assign(new Error('connection reset by peer'), { code: '08006' });
        mocks.ensureUserAccountProfile.mockRejectedValueOnce(transient).mockResolvedValueOnce({
            userId: '00000000-0000-4000-8000-000000000002',
            created: true,
        });

        const { handler } = await import('../handlers/reconciliation.js');

        const result = await handler(
            {
                id: 'event-id',
            } as import('aws-lambda').ScheduledEvent,
            baseContext,
            (() => undefined) as import('aws-lambda').Callback,
        );

        expect(result).toEqual({
            scanned: 2,
            repaired: 1,
            skipped: 1,
            errors: 0,
        });
        expect(mocks.ensureUserAccountProfile).toHaveBeenCalledTimes(2);
        expect(mocks.ensureUserAccountProfile.mock.calls[0]?.[0]).toMatchObject({
            auth0Sub: 'google-oauth2|missing',
            provider: 'google-oauth2',
            providerAccountId: 'missing',
            preferredUserId: null,
        });
        expect(mocks.emitMetric).toHaveBeenCalledWith('ReconciliationRetry', 1, { stage: 'test' });
    });

    it('tracks non-transient failures without retrying', async () => {
        mocks.listAuth0Users.mockResolvedValue([
            {
                sub: 'auth0|missing',
                email: 'missing@test.dev',
                name: null,
                picture: null,
            },
        ]);
        mocks.listDbAuth0Subs.mockResolvedValue(new Set());
        const nonTransient = Object.assign(new Error('duplicate key value violates unique constraint'), {
            code: '23505',
        });
        mocks.ensureUserAccountProfile.mockRejectedValue(nonTransient);

        const { handler } = await import('../handlers/reconciliation.js');

        const result = await handler(
            {
                id: 'event-id',
            } as import('aws-lambda').ScheduledEvent,
            baseContext,
            (() => undefined) as import('aws-lambda').Callback,
        );

        expect(result).toEqual({
            scanned: 1,
            repaired: 0,
            skipped: 0,
            errors: 1,
        });
        expect(mocks.ensureUserAccountProfile).toHaveBeenCalledTimes(1);
        expect(mocks.emitMetric).not.toHaveBeenCalledWith(
            'ReconciliationRetry',
            expect.any(Number),
            expect.any(Object),
        );
    });
});
