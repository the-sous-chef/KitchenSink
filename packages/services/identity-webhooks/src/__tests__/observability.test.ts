import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    sentryInit: vi.fn(),
    sentryWrapHandler: vi.fn(),
    loggerInfo: vi.fn(),
    loggerCtor: vi.fn(),
}));

vi.mock('@sentry/aws-serverless', () => ({
    init: mocks.sentryInit,
    wrapHandler: mocks.sentryWrapHandler,
}));

vi.mock('@aws-lambda-powertools/logger', () => ({
    Logger: class {
        constructor(params: unknown) {
            mocks.loggerCtor(params);
        }

        info = mocks.loggerInfo;
    },
}));

describe('observability helpers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        delete process.env.SENTRY_DSN;
        delete process.env.SENTRY_TRACES_SAMPLE_RATE;
        delete process.env.STAGE;

        mocks.sentryWrapHandler.mockImplementation((handler) => handler);
    });

    it('UTS-029-A1 [MOD-029]: initializes Sentry when DSN is configured', async () => {
        process.env.SENTRY_DSN = 'https://example@sentry.io/123';
        process.env.STAGE = 'test';
        process.env.SENTRY_TRACES_SAMPLE_RATE = '0.25';

        await import('../common/observability.js');

        expect(mocks.sentryInit).toHaveBeenCalledWith({
            dsn: 'https://example@sentry.io/123',
            environment: 'test',
            tracesSampleRate: 0.25,
        });
    });

    it('UTS-029-A2 [MOD-029/no-dsn]: does not initialize Sentry without DSN', async () => {
        await import('../common/observability.js');

        expect(mocks.sentryInit).not.toHaveBeenCalled();
    });

    it('UTS-029-A1 [MOD-029/wrap]: wraps handlers via Sentry wrapper', async () => {
        const { withObservability } = await import('../common/observability.js');

        const handler = vi.fn();
        withObservability(handler as never);

        expect(mocks.sentryWrapHandler).toHaveBeenCalledWith(handler);
    });

    it('UTS-028-A1 [MOD-028]: emits CloudWatch metric structure through logger', async () => {
        const { emitMetric } = await import('../common/observability.js');

        emitMetric('AuthorizerAllow', 1, { stage: 'test' });

        expect(mocks.loggerInfo).toHaveBeenCalledWith(
            'metric',
            expect.objectContaining({
                metricName: 'AuthorizerAllow',
                metricValue: 1,
                metricUnit: 'Count',
                dimensions: { stage: 'test' },
                service: 'identity-webhooks',
                metric: 'AuthorizerAllow',
                dimensionsJson: JSON.stringify({ stage: 'test' }),
                _aws: expect.objectContaining({
                    CloudWatchMetrics: [
                        expect.objectContaining({
                            Namespace: 'KitchenSink/IdentityWebhooks',
                        }),
                    ],
                }),
            }),
        );
    });
});
