import { Logger } from '@aws-lambda-powertools/logger';
import * as Sentry from '@sentry/aws-serverless';
import type { Handler } from 'aws-lambda';

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
export const logger = new Logger({
    serviceName: 'identity-webhooks',
});

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
const sentryDsn = process.env.SENTRY_DSN;

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
if (sentryDsn) {
    Sentry.init({
        dsn: sentryDsn,
        environment: process.env.STAGE ?? 'dev',
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0'),
    });
}

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
export const withObservability = <TEvent, TResult>(handler: Handler<TEvent, TResult>): Handler<TEvent, TResult> =>
    Sentry.wrapHandler(handler);

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
export const emitMetric = (metricName: string, value: number, dimensions: Record<string, string> = {}): void => {
    const dimensionsJson = JSON.stringify(dimensions);
    logger.info('metric', {
        metricName,
        metricValue: value,
        metricUnit: 'Count',
        dimensions,
        _aws: {
            Timestamp: Date.now(),
            CloudWatchMetrics: [
                {
                    Namespace: 'KitchenSink/IdentityWebhooks',
                    Dimensions: [['service', 'metric', ...Object.keys(dimensions)]],
                    Metrics: [{ Name: metricName, Unit: 'Count' }],
                },
            ],
        },
        service: 'identity-webhooks',
        metric: metricName,
        dimensionsJson,
    });
};
