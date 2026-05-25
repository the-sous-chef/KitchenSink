import type { Context, ScheduledEvent } from 'aws-lambda';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { UserSub } from '@kitchensink/auth-types';
import { AccountDAO, UserDAO } from '@kitchensink/auth-types/dao';

import { listAuth0Users } from '../common/auth0.js';
import { getDb } from '../common/db.js';
import { buildErrorEnvelope, getErrorCause, resolveRequestId } from '../common/error-envelope.js';
import { emitMetric, logger, withObservability } from '../common/observability.js';

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

    const auth0Users = await listAuth0Users({ auth0SecretArn });

    const db = await getDb(dbSecretArn);
    const userDao = new UserDAO(db as unknown as PostgresJsDatabase<Record<string, never>>);
    const accountDao = new AccountDAO(db as unknown as PostgresJsDatabase<Record<string, never>>);

    for (const auth0User of auth0Users) {
        counters.scanned += 1;

        const existing = await userDao.findById(auth0User.sub as UserSub);

        if (existing) {
            counters.skipped += 1;
            continue;
        }

        try {
            await userDao.upsert({
                id: auth0User.sub as UserSub,
                email: auth0User.email,
                name: auth0User.name ?? undefined,
                picture: auth0User.picture ?? undefined,
            });
            await accountDao.upsert(auth0User.sub as UserSub, 'free');
            counters.repaired += 1;
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

    emitMetric('ReconciliationScanned', counters.scanned, { stage: process.env.STAGE ?? 'dev' });
    emitMetric('ReconciliationRepaired', counters.repaired, { stage: process.env.STAGE ?? 'dev' });
    emitMetric('ReconciliationSkipped', counters.skipped, { stage: process.env.STAGE ?? 'dev' });
    emitMetric('ReconciliationErrors', counters.errors, { stage: process.env.STAGE ?? 'dev' });

    logger.info('reconciliation completed', {
        requestId,
        ...counters,
    });

    return counters;
};

/** @implements REQ-017 REQ-IF-010 FR-017 ARCH-012 MOD-012 */
export const handler = withObservability(innerHandler);
