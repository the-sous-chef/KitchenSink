import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import type { UserId } from '@kitchensink/auth-types';

import { updateUserMetadataUserId } from '../common/auth0.js';
import { ensureUserAccountProfile } from '../common/db.js';
import { buildErrorEnvelope, getErrorCause, resolveRequestId } from '../common/error-envelope.js';
import { emitMetric, logger, withObservability } from '../common/observability.js';
import { getExponentialDelayMs, withExponentialRetry } from '../common/retry.js';

/**
 * Existing invoker: Auth0 post-registration Action/Trigger chain routed to `functions.postRegistration` (`/webhooks/post-registration`).
 * No new Auth0 Actions/Triggers created in this package.
 * @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011
 */

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
type PostRegistrationWebhookBody = {
    user_id?: string;
    email?: string;
    name?: string;
    picture?: string | null;
    app_metadata?: {
        userId?: string;
    };
    identities?: Array<{
        provider?: string;
        user_id?: string;
    }>;
};

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
const parsePayload = (event: APIGatewayProxyEvent): PostRegistrationWebhookBody => {
    if (!event.body) {
        throw new Error('Missing post-registration payload body');
    }

    return JSON.parse(event.body) as PostRegistrationWebhookBody;
};

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
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

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
const executeCreateWithRetry = async (params: {
    dbSecretArn: string;
    auth0Sub: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    provider: string;
    providerAccountId: string;
    preferredUserId: UserId | null;
}): Promise<{ userId: UserId; created: boolean }> => {
    const stage = process.env.STAGE ?? 'dev';

    return withExponentialRetry({
        maxAttempts: 3,
        baseDelayMs: 200,
        capDelayMs: 2_000,
        run: async (attempt) => {
            if (attempt > 1) {
                const delayMs = getExponentialDelayMs(attempt - 1, 200, 2_000);
                emitMetric('PostRegistrationRetry', 1, { stage });
                logger.warn('post-registration retry', {
                    auth0Sub: params.auth0Sub,
                    attempt,
                    backoffMs: delayMs,
                });
            }

            return ensureUserAccountProfile({
                dbSecretArn: params.dbSecretArn,
                auth0Sub: params.auth0Sub,
                email: params.email,
                displayName: params.displayName,
                avatarUrl: params.avatarUrl,
                provider: params.provider,
                providerAccountId: params.providerAccountId,
                preferredUserId: params.preferredUserId,
            });
        },
        shouldRetry: isTransientDbError,
    });
};

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
const toProvider = (
    auth0Sub: string,
    identities: PostRegistrationWebhookBody['identities'],
): { provider: string; providerAccountId: string } => {
    const firstIdentity = identities?.[0];

    if (firstIdentity?.provider && firstIdentity.user_id) {
        return {
            provider: firstIdentity.provider,
            providerAccountId: firstIdentity.user_id,
        };
    }

    const [provider = 'auth0', providerAccountId = auth0Sub] = auth0Sub.split('|');

    return { provider, providerAccountId };
};

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
const innerHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const requestId = resolveRequestId(context, event.requestContext.requestId);

    const authHeader = event.headers?.['Authorization'] ?? event.headers?.['authorization'];

    if (!authHeader) {
        const envelope = buildErrorEnvelope(
            'POST_REGISTRATION_UNAUTHORIZED',
            'Missing Authorization header',
            requestId,
        );
        logger.warn('post-registration missing auth header', { requestId });

        return {
            statusCode: 401,
            body: JSON.stringify(envelope),
        };
    }

    const dbSecretArn = process.env.DB_SECRET_ARN;
    const auth0SecretArn = process.env.AUTH0_MANAGEMENT_SECRET_ARN;

    if (!dbSecretArn || !auth0SecretArn) {
        const envelope = buildErrorEnvelope(
            'POST_REGISTRATION_MISSING_ENV',
            'Missing DB_SECRET_ARN or AUTH0_MANAGEMENT_SECRET_ARN',
            requestId,
        );
        logger.error('post-registration invalid config', { ...envelope });

        return {
            statusCode: 500,
            body: JSON.stringify(envelope),
        };
    }

    try {
        const payload = parsePayload(event);

        if (!payload.user_id || !payload.email) {
            throw new Error('Payload missing user_id or email');
        }

        const providerMapping = toProvider(payload.user_id, payload.identities);
        const preferredUserId: UserId | null = null;
        const displayName = payload.name?.trim() || payload.email;

        if (payload.app_metadata?.userId) {
            logger.warn('post-registration ignored unverified preferred userId from payload', {
                requestId,
                auth0Sub: payload.user_id,
            });
        }

        const upserted = await executeCreateWithRetry({
            dbSecretArn,
            auth0Sub: payload.user_id,
            email: payload.email,
            displayName,
            avatarUrl: payload.picture ?? null,
            provider: providerMapping.provider,
            providerAccountId: providerMapping.providerAccountId,
            preferredUserId,
        });

        await updateUserMetadataUserId({
            auth0SecretArn,
            auth0Sub: payload.user_id,
            userId: upserted.userId,
        });

        emitMetric('PostRegistrationSynced', 1, { stage: process.env.STAGE ?? 'dev' });
        logger.info('post-registration sync completed', {
            requestId,
            auth0Sub: payload.user_id,
            userId: upserted.userId,
            created: upserted.created,
            invocationSource: 'existing Auth0 post-registration Action/Trigger chain',
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                requestId,
                userId: upserted.userId,
                created: upserted.created,
            }),
        };
    } catch (error) {
        const envelope = buildErrorEnvelope(
            'POST_REGISTRATION_SYNC_FAILED',
            'Failed to process post-registration sync',
            requestId,
            getErrorCause(error),
        );

        emitMetric('PostRegistrationErrors', 1, { stage: process.env.STAGE ?? 'dev' });
        logger.error('post-registration sync failed', { ...envelope });

        return {
            statusCode: 500,
            body: JSON.stringify(envelope),
        };
    }
};

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
export const handler = withObservability(innerHandler);
