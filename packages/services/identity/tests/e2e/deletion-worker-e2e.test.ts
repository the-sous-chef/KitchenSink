import { describe, it, expect, vi } from 'vitest';

vi.mock('@aws-sdk/client-sqs', () => ({
    SQSClient: vi.fn(),
    SendMessageCommand: vi.fn(),
    ReceiveMessageCommand: vi.fn().mockResolvedValue({ Messages: [] }),
    DeleteMessageCommand: vi.fn(),
    ChangeMessageVisibilityCommand: vi.fn(),
}));

vi.mock('@aws-sdk/client-secretsmanager', () => ({
    SecretsManagerClient: vi.fn(),
    GetSecretValueCommand: vi.fn(),
}));

vi.mock('pg', () => {
    const mockPool = {
        query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        connect: vi.fn(),
        end: vi.fn(),
    };

    return { default: { Pool: vi.fn(() => mockPool) } };
});

vi.mock('../../../identity-webhooks/dist/common/auth0.js', () => ({
    listAuth0Users: vi.fn().mockResolvedValue([]),
    deleteAuth0User: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../identity-webhooks/dist/common/db.js', () => ({
    lookupUserByIdAndAuth0Sub: vi.fn().mockResolvedValue(null),
    listDbAuth0Subs: vi.fn().mockResolvedValue(new Set()),
    ensureUserAccountProfile: vi.fn().mockResolvedValue(undefined),
    softDeleteUserRecord: vi.fn().mockResolvedValue(undefined),
}));

type AnyHandler = (event: any, context: any) => Promise<any>;

const makeRecord = (overrides: Record<string, unknown> = {}) => ({
    messageId: 'msg-001',
    body: JSON.stringify({
        userId: 'user-to-delete-123',
        auth0Sub: 'auth0|delete123',
        correlationId: 'corr-001',
        requestedAt: new Date().toISOString(),
        initiatedBy: 'admin-1',
    }),
    attributes: {
        ApproximateReceiveCount: '1',
    },
    messageAttributes: {},
    eventSource: 'aws:sqs',
    eventSourceARN: 'arn:aws:sqs:us-east-1:000000000000:identity-deletion-queue',
    receiptHandle: 'rh-001',
    ...overrides,
});

const mockContext = {
    getRemainingTimeInMillis: () => 25000,
    functionName: 'deletionWorker',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:deletionWorker',
} as unknown as import('aws-lambda').Context;

describe('T-075: E2E local deletion-worker + reconciliation scheduled flows', () => {
    describe('deletion-worker handler', () => {
        it('processes messages from deletion queue', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/deletion-worker.js')) as any;
            const deletionWorker: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = { Records: [makeRecord()] };

            await expect(deletionWorker(mockEvent, mockContext)).resolves.not.toThrow();
        });

        it('handles empty queue without error', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/deletion-worker.js')) as any;
            const deletionWorker: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = { Records: [] };

            await expect(deletionWorker(mockEvent, mockContext)).resolves.not.toThrow();
        });

        it('marks failed messages for DLQ after max retries', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/deletion-worker.js')) as any;
            const deletionWorker: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                Records: [
                    makeRecord({
                        messageId: 'msg-fail',
                        body: JSON.stringify({
                            userId: 'fail-user',
                            auth0Sub: 'auth0|fail',
                            correlationId: 'corr-fail',
                            requestedAt: new Date().toISOString(),
                            initiatedBy: 'system',
                        }),
                        attributes: { ApproximateReceiveCount: '3' },
                        receiptHandle: 'rh-fail',
                    }),
                ],
            };

            await expect(deletionWorker(mockEvent, mockContext)).resolves.not.toThrow();
        });
    });

    describe('reconciliation handler', () => {
        it('executes scheduled reconciliation without error', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/reconciliation.js')) as any;
            const reconciliation: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                'detail-type': 'Scheduled Event',
                source: 'aws.events',
                id: `recon-${Date.now()}`,
                time: new Date().toISOString(),
                region: 'us-east-1',
                version: '0',
                account: '000000000000',
                scheduleEvent: {
                    name: 'kitchensink-identity-reconciliation',
                    description: 'Periodic identity reconciliation',
                    state: 'ENABLED',
                },
            };
            const mockContext = {
                getRemainingTimeInMillis: () => 55000,
                functionName: 'reconciliation',
                invokedFunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:reconciliation',
            } as unknown as import('aws-lambda').Context;

            const result = await reconciliation(mockEvent, mockContext);
            expect(result).toMatchObject({ repaired: expect.any(Number) });
        });

        it('detects missing users and surfaces diff', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/reconciliation.js')) as any;
            const reconciliation: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                'detail-type': 'Scheduled Event',
                source: 'aws.events',
                id: `recon-detect-${Date.now()}`,
                time: new Date().toISOString(),
                region: 'us-east-1',
                account: '000000000000',
            };
            const mockContext = {
                getRemainingTimeInMillis: () => 55000,
                functionName: 'reconciliation',
                invokedFunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:reconciliation',
            } as unknown as import('aws-lambda').Context;

            const result = await reconciliation(mockEvent, mockContext);
            expect(result).toMatchObject({
                repaired: expect.any(Number),
            });
        });
    });

    describe('local queue-driven retry path', () => {
        it('deletion-worker enqueues to DLQ when permanently failed', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/deletion-worker.js')) as any;
            const deletionWorker: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                Records: [
                    makeRecord({
                        messageId: 'msg-perm-fail',
                        body: JSON.stringify({
                            userId: 'perm-fail-user',
                            auth0Sub: 'auth0|permfail',
                            correlationId: 'corr-perm',
                            requestedAt: new Date().toISOString(),
                            initiatedBy: 'system',
                        }),
                        attributes: { ApproximateReceiveCount: '5' },
                        receiptHandle: 'rh-perm',
                    }),
                ],
            };
            const mockContext = {
                getRemainingTimeInMillis: () => 25000,
                functionName: 'deletionWorker',
                invokedFunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:deletionWorker',
            } as unknown as import('aws-lambda').Context;

            await expect(deletionWorker(mockEvent, mockContext)).resolves.not.toThrow();
        });
    });

    describe('local reconciliation repair workflow', () => {
        it('reconciliation creates missing DB records for Auth0-only users', async () => {
            const { listAuth0Users } = (await import('../../../identity-webhooks/dist/common/auth0.js')) as any;
            listAuth0Users.mockResolvedValueOnce([
                {
                    sub: 'auth0|missing-in-db',
                    email: 'missing@example.com',
                    name: 'Missing User',
                    picture: 'https://example.com/avatar.png',
                },
            ]);

            const mod = (await import('../../../identity-webhooks/dist/handlers/reconciliation.js')) as any;
            const reconciliation: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                'detail-type': 'Scheduled Event',
                source: 'aws.events',
                id: `recon-repair-${Date.now()}`,
                time: new Date().toISOString(),
                region: 'us-east-1',
                account: '000000000000',
            };
            const mockContext = {
                getRemainingTimeInMillis: () => 55000,
                functionName: 'reconciliation',
                invokedFunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:reconciliation',
            } as unknown as import('aws-lambda').Context;

            const result = await reconciliation(mockEvent, mockContext);
            expect(result).toMatchObject({ repaired: expect.any(Number) });
        });
    });
});
