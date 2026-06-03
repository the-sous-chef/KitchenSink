import type { APIGatewayProxyEvent, APIGatewayRequestAuthorizerEvent, Context } from 'aws-lambda';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

/**
 * E2E: identity-webhooks Lambdas exercised end-to-end against an in-process
 * JWKS server, mocked AWS SDK clients, and a mocked Postgres pool.
 *
 * Covers:
 *   - authorizer: JWT verification → Allow / Deny / JIT user creation
 *   - identityWebhook: Svix signature verify → user.created / user.deleted dispatch
 *
 * @implements REQ-013..REQ-017 REQ-038..REQ-040 FR-013..FR-017 FR-038..FR-040
 *             ARCH-024 ARCH-025 MOD-024 MOD-025
 */

const JWKS_URL = 'https://idp.test/.well-known/jwks.json';
const ISSUER = 'https://idp.test';
const KID = 'e2e-key-1';

let privateKey: CryptoKey;
let publicJwk: Record<string, unknown>;

const jwksServer = setupServer();

const mockUpsert = vi.fn();
const mockFindByIdentityId = vi.fn();
const mockRecordOnce = vi.fn();
const mockSetExternalId = vi.fn();
const mockGetUser = vi.fn();
const mockSqsSend = vi.fn().mockResolvedValue({});
const mockDbInsertReturning = vi.fn().mockResolvedValue([{ id: 'profile-1' }]);

const buildDb = () => ({
    insert: vi.fn(() => ({
        values: () => ({
            onConflictDoUpdate: () => ({ returning: mockDbInsertReturning }),
            onConflictDoNothing: () => Promise.resolve(),
            returning: mockDbInsertReturning,
        }),
    })),
    update: vi.fn(() => ({ set: () => ({ where: () => Promise.resolve() }) })),
    select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) })),
});

vi.mock('../../../src/common/db.js', () => ({
    getDb: vi.fn(async () => buildDb()),
}));
vi.mock('../../../src/common/svix.js', () => ({
    verifyWebhook: vi.fn((_headers: unknown, body: string) => JSON.parse(body)),
}));
vi.mock('../../../src/common/identityClient.js', () => ({
    setExternalId: mockSetExternalId,
    getUser: mockGetUser,
    listUsers: vi.fn().mockResolvedValue([]),
    deleteUser: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@kitchensink/identity-service/database/dao', () => ({
    UserDAO: vi.fn(function () {
        return {
            upsertByIdentityId: mockUpsert,
            findByIdentityId: mockFindByIdentityId,
            softDeleteByIdentityId: vi.fn(),
        };
    }),
    AccountDAO: vi.fn(function () {
        return {};
    }),
    recordOnce: mockRecordOnce,
}));
vi.mock('@aws-sdk/client-sqs', () => ({
    SQSClient: vi.fn(function () {
        return { send: mockSqsSend };
    }),
    SendMessageCommand: vi.fn(function (input: unknown) {
        return { input };
    }),
}));
vi.mock('../../../src/common/observability.js', () => ({
    emitMetric: vi.fn(),
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    withObservability: <T, R>(fn: (e: T, c: unknown) => Promise<R>) => fn,
}));

beforeAll(async () => {
    const { privateKey: priv, publicKey: pub } = await generateKeyPair('RS256');
    privateKey = priv;
    publicJwk = { ...(await exportJWK(pub)), kid: KID, use: 'sig', alg: 'RS256' };
    jwksServer.use(http.get(JWKS_URL, () => HttpResponse.json({ keys: [publicJwk] })));
    jwksServer.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
    vi.clearAllMocks();
    mockSqsSend.mockResolvedValue({});
    mockDbInsertReturning.mockResolvedValue([{ id: 'profile-1' }]);
});

beforeEach(() => {
    process.env.CLERK_JWKS_URL = JWKS_URL;
    process.env.CLERK_ISSUER = ISSUER;
    process.env.AUTH_SECRET_ARN = 'sk_test_dummy';
    process.env.IDP_WEBHOOK_SECRET = 'whsec_dummy';
    process.env.DB_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:000:secret:db';
    process.env.DELETION_QUEUE_URL = 'http://localhost:4566/queue/identity-deletions';
});

const signToken = (claims: Record<string, unknown>): Promise<string> => {
    const now = Math.floor(Date.now() / 1000);

    return new SignJWT({
        iat: now,
        exp: now + 600,
        nbf: now,
        iss: ISSUER,
        ...claims,
    })
        .setProtectedHeader({ alg: 'RS256', kid: KID })
        .sign(privateKey);
};

const makeAuthorizerEvent = (auth?: string): APIGatewayRequestAuthorizerEvent =>
    ({
        type: 'REQUEST',
        methodArn: 'arn:aws:execute-api:us-east-1:000:api/local/GET/protected',
        headers: auth ? { Authorization: auth } : {},
        requestContext: { requestId: `req-${Date.now()}` },
    }) as unknown as APIGatewayRequestAuthorizerEvent;

const ctx = { getRemainingTimeInMillis: () => 5000 } as Context;

describe('e2e: authorizer Lambda', () => {
    it('returns Allow policy for a valid JWT with app_user_id', async () => {
        const TEST_USER_ID = '01HXYZ1234567890ABCDEFGHIJ';
        const { handler } = await import('../../../src/authorizer/handler.js');
        const token = await signToken({
            sub: 'user_e2e_123',
            app_user_id: TEST_USER_ID,
            email: 'e2e@example.com',
        });

        const result = await handler(makeAuthorizerEvent(`Bearer ${token}`), ctx);

        expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
        expect(result.principalId).toBe('user_e2e_123');
        expect(result.context?.userId).toBe(TEST_USER_ID);
        expect(result.context?.clerkUserId).toBe('user_e2e_123');
    });

    it('JIT-creates a user when token has no app_user_id claim', async () => {
        const JIT_ID = '01HJIT0123456789ABCDEFGHIJ';

        mockGetUser.mockResolvedValueOnce({
            id: 'user_e2e_jit',
            emailAddresses: [{ emailAddress: 'jit@example.com' }],
            firstName: 'Jit',
            lastName: 'User',
            imageUrl: 'https://i.example/p.jpg',
        });
        mockUpsert.mockResolvedValueOnce({ id: JIT_ID });

        const { handler } = await import('../../../src/authorizer/handler.js');
        const token = await signToken({ sub: 'user_e2e_jit', email: 'jit@example.com' });

        const result = await handler(makeAuthorizerEvent(`Bearer ${token}`), ctx);

        expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
        expect(mockGetUser).toHaveBeenCalledWith('user_e2e_jit');
        expect(mockUpsert).toHaveBeenCalled();
        expect(mockSetExternalId).toHaveBeenCalledWith('user_e2e_jit', JIT_ID);
        expect(result.context?.userId).toBe(JIT_ID);
    });

    it('throws Unauthorized when Authorization header is missing', async () => {
        const { handler } = await import('../../../src/authorizer/handler.js');
        await expect(handler(makeAuthorizerEvent(), ctx)).rejects.toThrow('Unauthorized');
    });

    it('throws Unauthorized for a token signed by a different issuer', async () => {
        const { handler } = await import('../../../src/authorizer/handler.js');
        const badToken = await signToken({ sub: 'attacker', iss: 'https://evil.example' });
        await expect(handler(makeAuthorizerEvent(`Bearer ${badToken}`), ctx)).rejects.toThrow('Unauthorized');
    });
});

const makeWebhookEvent = (svixId: string, body: object): APIGatewayProxyEvent =>
    ({
        body: JSON.stringify(body),
        headers: {
            'svix-id': svixId,
            'svix-timestamp': String(Date.now()),
            'svix-signature': 'v1,sig-dummy',
        },
        requestContext: { requestId: `req-${svixId}` },
    }) as unknown as APIGatewayProxyEvent;

const userPayload = (id: string) => ({
    id,
    email_addresses: [{ id: 'email-1', email_address: `${id}@example.com` }],
    first_name: 'E2E',
    last_name: 'User',
    image_url: 'https://i.example/p.jpg',
});

describe('e2e: identityWebhook Lambda', () => {
    it('processes user.created → upserts user, syncs external id, inserts profile', async () => {
        mockRecordOnce.mockResolvedValueOnce(true);
        mockUpsert.mockResolvedValueOnce({ id: '01USERCREATED0000000000000' });
        const { handler } = await import('../../../src/handlers/identityWebhook.js');

        const event = makeWebhookEvent('svix-create-1', {
            type: 'user.created',
            data: userPayload('user_created_e2e'),
        });
        const result = await handler(event, ctx);

        expect(result.statusCode).toBe(200);
        expect(mockUpsert).toHaveBeenCalledWith(
            expect.objectContaining({
                identityId: 'user_created_e2e',
                email: 'user_created_e2e@example.com',
            }),
        );
        expect(mockSetExternalId).toHaveBeenCalledWith('user_created_e2e', '01USERCREATED0000000000000');
    });

    it('processes user.deleted → enqueues deletion job to SQS', async () => {
        mockRecordOnce.mockResolvedValueOnce(true);
        const { handler } = await import('../../../src/handlers/identityWebhook.js');

        const event = makeWebhookEvent('svix-delete-1', {
            type: 'user.deleted',
            data: { id: 'user_to_delete_e2e' },
        });
        const result = await handler(event, ctx);

        expect(result.statusCode).toBe(200);
        expect(mockSqsSend).toHaveBeenCalledOnce();
        const sentInput = (mockSqsSend.mock.calls[0][0] as { input: { MessageBody: string; QueueUrl: string } }).input;
        expect(sentInput.QueueUrl).toBe('http://localhost:4566/queue/identity-deletions');
        expect(JSON.parse(sentInput.MessageBody)).toEqual({ userId: 'user_to_delete_e2e' });
    });

    it('is idempotent on duplicate svix-id (no re-processing)', async () => {
        mockRecordOnce.mockResolvedValueOnce(false);
        const { handler } = await import('../../../src/handlers/identityWebhook.js');

        const event = makeWebhookEvent('svix-dup-1', {
            type: 'user.created',
            data: userPayload('user_dup_e2e'),
        });
        const result = await handler(event, ctx);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toMatchObject({ dedup: true });
        expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('rejects requests with invalid Svix signature (401)', async () => {
        const svix = await import('../../../src/common/svix.js');

        vi.mocked(svix.verifyWebhook).mockImplementationOnce(() => {
            throw new Error('signature mismatch');
        });
        const { handler } = await import('../../../src/handlers/identityWebhook.js');

        const event = makeWebhookEvent('svix-bad-1', {
            type: 'user.created',
            data: userPayload('user_bad_sig'),
        });
        const result = await handler(event, ctx);

        expect(result.statusCode).toBe(401);
        expect(mockRecordOnce).not.toHaveBeenCalled();
    });
});
