import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { UserSub } from '@kitchensink/auth-types';
import { AccountDAO, UserDAO } from '@kitchensink/auth-types/dao';
import type { AuthorizerContext } from '@kitchensink/auth-types';

import { requireEnv } from '../common/config.js';
import { getDb } from '../common/db.js';
import { buildErrorEnvelope, getErrorCause, resolveRequestId } from '../common/error-envelope.js';
import { emitMetric, logger, withObservability } from '../common/observability.js';

/**
 * Post-login upsert handler — called by Auth0 post-login Action (T8) via M2M token.
 * Upserts user and account records keyed on `sub`.
 * @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011
 */

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
interface PostLoginPayload {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
}

const FORBIDDEN_FIELDS = ['internal_id', 'legacy_id', 'legacyId', 'auth0_id'] as const;

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
const parsePayload = (event: APIGatewayProxyEvent): PostLoginPayload => {
    if (!event.body) {
        throw new Error('Missing post-login payload body');
    }

    return JSON.parse(event.body) as PostLoginPayload;
};

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
const postLoginHandlerCore = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const requestId = resolveRequestId(context, event.requestContext?.requestId);

    // --- Authorizer context validation ---
    const ctx = event.requestContext?.authorizer as AuthorizerContext | undefined;

    if (!ctx?.sub) {
        logger.warn('post-login: missing authorizer context', { requestId });
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Unauthorized' }),
        };
    }

    if (!ctx.isM2M) {
        logger.warn('post-login: non-M2M token rejected', { requestId, sub: ctx.sub });
        return {
            statusCode: 403,
            body: JSON.stringify({ error: 'M2M token required' }),
        };
    }

    // --- Parse and validate payload ---
    let body: PostLoginPayload;
    try {
        body = parsePayload(event);
    } catch (err) {
        return {
            statusCode: 400,
            body: JSON.stringify(
                buildErrorEnvelope('INVALID_PAYLOAD', 'Invalid or missing request body', requestId, getErrorCause(err)),
            ),
        };
    }

    // Reject legacy id fields
    for (const field of FORBIDDEN_FIELDS) {
        if (field in (body as unknown as Record<string, unknown>)) {
            logger.warn('post-login: forbidden field in payload', { requestId, field });
            return {
                statusCode: 400,
                body: JSON.stringify({ error: `Forbidden field: ${field}` }),
            };
        }
    }

    if (!body.sub || !body.email) {
        return {
            statusCode: 400,
            body: JSON.stringify(buildErrorEnvelope('MISSING_FIELDS', 'sub and email are required', requestId)),
        };
    }

    // --- DAO upsert ---
    const dbSecretArn = requireEnv('DB_SECRET_ARN');
    const db = await getDb(dbSecretArn);

    // The DAOs are typed for PostgresJsDatabase; the node-postgres Drizzle instance
    // is structurally compatible at runtime — cast to satisfy the constructor.
    const userDao = new UserDAO(db as unknown as PostgresJsDatabase<Record<string, never>>);
    const accountDao = new AccountDAO(db as unknown as PostgresJsDatabase<Record<string, never>>);

    const sub = body.sub as UserSub;

    const [userRow, accountRow] = await Promise.all([
        userDao.upsert({
            sub,
            email: body.email,
            name: body.name,
            picture: body.picture,
        }),
        accountDao.upsert(sub, 'free'),
    ]);

    emitMetric('PostLoginUpsert', 1, { result: 'success' });
    logger.info('post-login: upsert complete', { requestId, sub });

    return {
        statusCode: 200,
        body: JSON.stringify({
            sub: userRow.sub,
            email: userRow.email,
            accountId: accountRow.id,
            tier: accountRow.tier,
        }),
    };
};

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
export const handler = withObservability(
    async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
        try {
            return await postLoginHandlerCore(event, context);
        } catch (err) {
            const requestId = resolveRequestId(context, event.requestContext?.requestId);
            logger.error('post-login: unhandled error', { requestId, error: getErrorCause(err) });
            emitMetric('PostLoginUpsert', 1, { result: 'error' });
            return {
                statusCode: 500,
                body: JSON.stringify(
                    buildErrorEnvelope('INTERNAL_ERROR', 'Internal server error', requestId, getErrorCause(err)),
                ),
            };
        }
    },
);
