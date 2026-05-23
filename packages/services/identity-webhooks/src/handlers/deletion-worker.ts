import type { Context, SQSEvent, SQSRecord } from 'aws-lambda';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { UserDeletionQueueMessage } from '@kitchensink/auth-types';
import { UserDAO } from '@kitchensink/auth-types/dao';

import { deleteAuth0User } from '../common/auth0.js';
import { getDb } from '../common/db.js';
import { buildErrorEnvelope, getErrorCause, resolveRequestId } from '../common/error-envelope.js';
import { emitMetric, logger, withObservability } from '../common/observability.js';
import { getExponentialDelayMs, withExponentialRetry } from '../common/retry.js';
import { getDeletionQueueReceiveStats } from '../common/sqs.js';

/**
 * Existing invoker: `functions.deletionWorker` SQS event source mapping on the deletion queue in `packages/infra/identity/serverless.yml`.
 * DLQ handoff is infra-managed (redrive policy maxReceiveCount=5).
 * @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017
 */

/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
type DeletionWorkerStats = {
    processed: number;
    deleted: number;
    skipped: number;
    errors: number;
};

/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
const parseDeletionMessage = (record: SQSRecord): UserDeletionQueueMessage => {
    return JSON.parse(record.body) as UserDeletionQueueMessage;
};

/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
const getApproximateReceiveCount = (record: SQSRecord): number => {
    const raw = record.attributes.ApproximateReceiveCount;
    const parsed = Number(raw);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
const isAuth0Transient = (error: unknown): boolean => {
    if (!(error instanceof Error)) {
        return false;
    }

    const maybeStatus = Number((error as Error & { statusCode?: number }).statusCode ?? NaN);

    if (Number.isFinite(maybeStatus) && (maybeStatus >= 500 || maybeStatus === 429)) {
        return true;
    }

    return /timeout|temporar|throttl|rate limit|econnreset/i.test(error.message);
};

/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
const processRecord = async (
    record: SQSRecord,
    requestId: string,
    dbSecretArn: string,
    auth0SecretArn: string,
    stats: DeletionWorkerStats,
): Promise<void> => {
    const message = parseDeletionMessage(record);
    const receiveCount = getApproximateReceiveCount(record);
    const stage = process.env.STAGE ?? 'dev';

    stats.processed += 1;

    const persisted = await (async () => {
        const db = await getDb(dbSecretArn);
        const userDao = new UserDAO(db as unknown as PostgresJsDatabase<Record<string, never>>);
        return userDao.findBySub(message.userSub);
    })();

    if (!persisted) {
        stats.skipped += 1;
        emitMetric('DeletionWorkerSkipped', 1, { stage });
        logger.info('deletion-worker skipped stale message', {
            requestId,
            messageId: record.messageId,
            userSub: message.userSub,
            receiveCount,
        });

        return;
    }

    const maxAttempts = 5;
    await withExponentialRetry({
        maxAttempts,
        baseDelayMs: 250,
        capDelayMs: 5_000,
        run: async (attempt) => {
            if (attempt > 1) {
                const delayMs = getExponentialDelayMs(attempt - 1, 250, 5_000);
                emitMetric('DeletionWorkerRetry', 1, { stage });
                logger.warn('deletion-worker retry', {
                    requestId,
                    messageId: record.messageId,
                    userSub: message.userSub,
                    attempt,
                    receiveCount,
                    backoffMs: delayMs,
                });
            }

            await deleteAuth0User({
                auth0SecretArn,
                auth0Sub: message.userSub,
            });
        },
        shouldRetry: isAuth0Transient,
    });

    stats.deleted += 1;
    emitMetric('DeletionWorkerDeleted', 1, { stage });
    logger.info('deletion-worker auth0 deletion completed', {
        requestId,
        messageId: record.messageId,
        userSub: message.userSub,
        receiveCount,
        dlqContract: 'SQS redrive maxReceiveCount=5 managed by infra',
    });
};

/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
const innerHandler = async (event: SQSEvent, context: Context): Promise<void> => {
    const requestId = resolveRequestId(context);
    const dbSecretArn = process.env.DB_SECRET_ARN;
    const auth0SecretArn = process.env.AUTH0_MANAGEMENT_SECRET_ARN;

    if (!dbSecretArn || !auth0SecretArn) {
        const envelope = buildErrorEnvelope(
            'DELETION_WORKER_MISSING_ENV',
            'Missing DB_SECRET_ARN or AUTH0_MANAGEMENT_SECRET_ARN',
            requestId,
        );
        logger.error('deletion-worker invalid config', { ...envelope });
        throw new Error(JSON.stringify(envelope));
    }

    const stats: DeletionWorkerStats = {
        processed: 0,
        deleted: 0,
        skipped: 0,
        errors: 0,
    };

    for (const record of event.Records) {
        try {
            await processRecord(record, requestId, dbSecretArn, auth0SecretArn, stats);
        } catch (error) {
            stats.errors += 1;
            emitMetric('DeletionWorkerErrors', 1, { stage: process.env.STAGE ?? 'dev' });

            const envelope = buildErrorEnvelope(
                'DELETION_WORKER_RECORD_FAILED',
                'Failed to process deletion record',
                requestId,
                {
                    messageId: record.messageId,
                    receiveCount: getApproximateReceiveCount(record),
                    error: getErrorCause(error),
                },
            );

            logger.error('deletion-worker record failed', { ...envelope });
            throw error;
        }
    }

    logger.info('deletion-worker batch completed', {
        requestId,
        ...stats,
    });

    const queueUrl = process.env.DELETION_QUEUE_URL;

    if (queueUrl) {
        try {
            const queueStats = await getDeletionQueueReceiveStats(queueUrl);
            emitMetric('DeletionQueueVisible', queueStats.visible, { stage: process.env.STAGE ?? 'dev' });
            emitMetric('DeletionQueueInFlight', queueStats.inFlight, { stage: process.env.STAGE ?? 'dev' });
            logger.info('deletion-worker queue stats', {
                requestId,
                ...queueStats,
            });
        } catch (error) {
            logger.warn('deletion-worker queue stats failed', {
                ...buildErrorEnvelope(
                    'DELETION_WORKER_QUEUE_STATS_FAILED',
                    'Unable to collect deletion queue stats',
                    requestId,
                    getErrorCause(error),
                ),
            });
        }
    }
};

/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
export const handler = withObservability(innerHandler);
