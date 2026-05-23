import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../common/db.js', () => ({
    getDb: vi.fn(),
}));

vi.mock('@kitchensink/auth-types/dao', () => {
    const UserDAO = vi.fn().mockImplementation(function () {
        return {
            upsert: vi.fn().mockResolvedValue({ sub: 'auth0|user1', email: 'user@example.com' }),
        };
    });
    const AccountDAO = vi.fn().mockImplementation(function () {
        return {
            upsert: vi.fn().mockResolvedValue({ id: 'acct-1', tier: 'free' }),
        };
    });
    return { UserDAO, AccountDAO };
});

vi.mock('../../common/observability.js', () => ({
    emitMetric: vi.fn(),
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    withObservability: <T, R>(fn: (event: T, ctx: unknown) => Promise<R>) => fn,
}));

import { handler as rawHandler } from '../post-login.js';
import { getDb } from '../../common/db.js';

type TestHandler = (event: APIGatewayProxyEvent, ctx: Context) => Promise<APIGatewayProxyResult>;
const handler = rawHandler as unknown as TestHandler;

const mockGetDb = vi.mocked(getDb);

const makeContext = (): Context => ({ awsRequestId: 'test-req-id' }) as unknown as Context;

const makeEvent = (body: Record<string, unknown>, authorizer?: Record<string, unknown> | null): APIGatewayProxyEvent =>
    ({
        body: JSON.stringify(body),
        requestContext: {
            requestId: 'test-req-id',
            authorizer:
                authorizer === null
                    ? undefined
                    : (authorizer ?? {
                          sub: 'svc-client@clients',
                          isM2M: true,
                          tokenType: 'm2m',
                      }),
        },
    }) as unknown as APIGatewayProxyEvent;

beforeEach(() => {
    vi.clearAllMocks();
    mockGetDb.mockResolvedValue({} as never);
    process.env.DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:123:secret:db';
});

describe('post-login handler', () => {
    it('valid M2M payload → 200 with sub and accountId', async () => {
        const result = await handler(makeEvent({ sub: 'auth0|user1', email: 'user@example.com' }), makeContext());

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body) as Record<string, unknown>;
        expect(body.sub).toBe('auth0|user1');
        expect(body.accountId).toBe('acct-1');
        expect(body.tier).toBe('free');
    });

    it('payload with legacyId → 400', async () => {
        const result = await handler(
            makeEvent({ sub: 'auth0|user1', email: 'user@example.com', legacyId: 'old-123' }),
            makeContext(),
        );

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body) as Record<string, unknown>;
        expect(body.error).toMatch(/legacyId/i);
    });

    it('missing authorizer context → 401', async () => {
        const event = {
            body: JSON.stringify({ sub: 'auth0|user1', email: 'user@example.com' }),
            requestContext: { requestId: 'test-req-id' },
        } as unknown as APIGatewayProxyEvent;

        const result = await handler(event, makeContext());
        expect(result.statusCode).toBe(401);
    });

    it('non-M2M token → 403', async () => {
        const result = await handler(
            makeEvent(
                { sub: 'auth0|user1', email: 'user@example.com' },
                {
                    sub: 'auth0|user1',
                    isM2M: false,
                    tokenType: 'user',
                },
            ),
            makeContext(),
        );

        expect(result.statusCode).toBe(403);
    });

    it('missing email → 400', async () => {
        const result = await handler(makeEvent({ sub: 'auth0|user1' }), makeContext());

        expect(result.statusCode).toBe(400);
    });
});
