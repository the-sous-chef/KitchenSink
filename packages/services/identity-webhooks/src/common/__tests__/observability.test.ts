import type { Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSetAttributes, mockSentryLogger } = vi.hoisted(() => ({
    mockSetAttributes: vi.fn(),
    mockSentryLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@sentry/aws-serverless', () => ({
    init: vi.fn(),
    logger: mockSentryLogger,
    getIsolationScope: () => ({ setAttributes: mockSetAttributes }),
    wrapHandler: <T>(handler: T): T => handler,
}));

import { emitMetric, logger, withObservability } from '../observability.js';

const makeContext = (): Context =>
    ({
        awsRequestId: 'req-1',
        functionName: 'identity-webhook',
        functionVersion: '7',
    }) as unknown as Context;

describe('observability', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('logger facade', () => {
        it('forwards purposeful logs to Sentry.logger with their attributes', () => {
            logger.info('user synced', { identityId: 'abc' });
            logger.warn('retrying', { attempt: 2 });
            logger.error('failed', { code: 'X' });

            expect(mockSentryLogger.info).toHaveBeenCalledWith('user synced', { identityId: 'abc' });
            expect(mockSentryLogger.warn).toHaveBeenCalledWith('retrying', { attempt: 2 });
            expect(mockSentryLogger.error).toHaveBeenCalledWith('failed', { code: 'X' });
        });
    });

    describe('emitMetric', () => {
        it('writes an EMF payload to stdout and not to Sentry.logger', () => {
            const writeSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

            emitMetric('ReconciliationDrift', 3, { stage: 'prod' });

            expect(writeSpy).toHaveBeenCalledTimes(1);
            const line = writeSpy.mock.calls[0]?.[0] as string;
            const parsed = JSON.parse(line) as {
                _aws: { CloudWatchMetrics: Array<{ Metrics: Array<{ Name: string }> }> };
            };
            expect(parsed._aws.CloudWatchMetrics[0]?.Metrics[0]?.Name).toBe('ReconciliationDrift');
            expect(mockSentryLogger.info).not.toHaveBeenCalled();

            writeSpy.mockRestore();
        });
    });

    describe('withObservability', () => {
        it('sets the Lambda context on the isolation scope and invokes the inner handler', async () => {
            const inner = vi.fn().mockResolvedValue('ok');
            const wrapped = withObservability(inner) as (event: unknown, context: Context) => Promise<unknown>;

            const result = await wrapped({}, makeContext());

            expect(mockSetAttributes).toHaveBeenCalledWith(
                expect.objectContaining({
                    aws_request_id: 'req-1',
                    function_name: 'identity-webhook',
                    function_version: '7',
                    serviceName: 'identity-webhooks',
                }),
            );
            expect(inner).toHaveBeenCalledOnce();
            expect(result).toBe('ok');
        });
    });
});
