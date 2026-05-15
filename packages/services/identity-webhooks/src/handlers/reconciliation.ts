import type { Context, ScheduledEvent } from 'aws-lambda';

import { listAuth0Users } from '../common/auth0.js';
import { ensureUserAccountProfile, listDbAuth0Subs } from '../common/db.js';
import { buildErrorEnvelope, getErrorCause, resolveRequestId } from '../common/error-envelope.js';
import { emitMetric, logger, withObservability } from '../common/observability.js';
import { getExponentialDelayMs, withExponentialRetry } from '../common/retry.js';

/**
 * Existing invoker: EventBridge schedule (`functions.reconciliation` cron) from `packages/infra/identity/serverless.yml`.
 * @implements REQ-017 REQ-IF-010 FR-017 ARCH-012 MOD-012
 */

/** @implements REQ-017 REQ-IF-010 FR-017 ARCH-012 MOD-012 */
type ReconciliationCounters = {
    scanned: number;
    repaired: number;
    skipped: number;
    errors: number;
};

/** @implements REQ-017 REQ-IF-010 FR-017 ARCH-012 MOD-012 */
const isTransientDbError = (error: unknown): boolean => {
    if (!(error instanceof Error)) {
        return false;
    }

    const transientCodes = new Set(['40001', '40P01', '53300', '57P01', '08006', '08000']);
    const dbErrorCode = (error as Error & { code?: string }).code;

    if (dbErrorCode && transientCodes.has(dbErrorCode)) {
        return true;
    }

    return /timeout|temporar|connection reset|connection terminated/i.test(error.message);
};

/** @implements REQ-017 REQ-IF-010 FR-017 ARCH-012 MOD-012 */
const providerFromSub = (auth0Sub: string): { provider: string; providerAccountId: string } => {
    const [provider = 'auth0', providerAccountId = auth0Sub] = auth0Sub.split('|');

    return { provider, providerAccountId };
};

/** @implements REQ-017 REQ-IF-010 FR-017 ARCH-012 MOD-012 */
const innerHandler = async (event: ScheduledEvent, context: Context): Promise<ReconciliationCounters> => {
    const requestId = resolveRequestId(context, event.id);
    const dbSecretArn = process.env.DB_SECRET_ARN;
    const auth0SecretArn = process.env.AUTH0_MANAGEMENT_SECRET_ARN;

    if (!dbSecretArn || !auth0SecretArn) {
        const envelope = buildErrorEnvelope(
            'RECONCILIATION_MISSING_ENV',
            'Missing DB_SECRET_ARN or AUTH0_MANAGEMENT_SECRET_ARN',
            requestId,
        );
        logger.error('reconciliation invalid config', { ...envelope });
        throw new Error(JSON.stringify(envelope));
    }

    const counters: ReconciliationCounters = {
        scanned: 0,
        repaired: 0,
        skipped: 0,
        errors: 0,
    };
    const stage = process.env.STAGE ?? 'dev';

    const auth0Users = await listAuth0Users({ auth0SecretArn });
    const dbAuth0Subs = await listDbAuth0Subs(dbSecretArn);

    for (const auth0User of auth0Users) {
        counters.scanned += 1;

        if (dbAuth0Subs.has(auth0User.sub)) {
            counters.skipped += 1;
            continue;
        }

        try {
            const provider = providerFromSub(auth0User.sub);
            const result = await withExponentialRetry({
                maxAttempts: 3,
                baseDelayMs: 200,
                capDelayMs: 2_000,
                run: async (attempt) => {
                    if (attempt > 1) {
                        const delayMs = getExponentialDelayMs(attempt - 1, 200, 2_000);
                        emitMetric('ReconciliationRetry', 1, { stage });
                        logger.warn('reconciliation retry', {
                            requestId,
                            auth0Sub: auth0User.sub,
                            attempt,
                            backoffMs: delayMs,
                        });
                    }

                    return ensureUserAccountProfile({
                        dbSecretArn,
                        auth0Sub: auth0User.sub,
                        email: auth0User.email,
                        displayName: auth0User.name?.trim() || auth0User.email,
                        avatarUrl: auth0User.picture,
                        provider: provider.provider,
                        providerAccountId: provider.providerAccountId,
                        preferredUserId: null,
                    });
                },
                shouldRetry: isTransientDbError,
            });

            if (result.created) {
                counters.repaired += 1;
            } else {
                counters.skipped += 1;
            }
        } catch (error) {
            counters.errors += 1;
            logger.error('reconciliation failed for user', {
                ...buildErrorEnvelope('RECONCILIATION_USER_FAILED', 'Failed repairing missing Auth0 user', requestId, {
                    auth0Sub: auth0User.sub,
                    error: getErrorCause(error),
                }),
            });
        }
    }

    emitMetric('ReconciliationScanned', counters.scanned, { stage });
    emitMetric('ReconciliationRepaired', counters.repaired, { stage });
    emitMetric('ReconciliationSkipped', counters.skipped, { stage });
    emitMetric('ReconciliationErrors', counters.errors, { stage });

    logger.info('reconciliation completed', {
        requestId,
        ...counters,
    });

    return counters;
};

/** @implements REQ-017 REQ-IF-010 FR-017 ARCH-012 MOD-012 */
export const handler = withObservability(innerHandler);
