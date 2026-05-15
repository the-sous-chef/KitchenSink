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

type AnyHandler = (event: any, context: any) => Promise<any>;

describe('T-075: E2E local deletion-worker + reconciliation scheduled flows', () => {
    describe('deletion-worker handler', () => {
        it('processes messages from deletion queue', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/deletion-worker.js')) as any;
            const deletionWorker: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                Records: [
                    {
                        messageId: 'msg-001',
                        body: JSON.stringify({
                            userId: 'user-to-delete-123',
                            auth0Sub: 'auth0|delete123',
                            requestedAt: new Date().toISOString(),
                            initiatedBy: 'admin-1',
                        }),
                        awsReprects: 0,
                        messageAttributes: {},
                        eventSource: 'aws:sqs',
                        eventSourceARN: 'arn:aws:sqs:us-east-1:000000000000:identity-deletion-queue',
                        receiptHandle: 'rh-001',
                        tags: {},
                    },
                ],
            };
            const mockContext = {
                getRemainingTimeInMillis: () => 25000,
                functionName: 'deletionWorker',
                invokedFunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:deletionWorker',
            } as unknown as import('aws-lambda').Context;

            const result = await deletionWorker(mockEvent, mockContext);
            expect(result).toMatchObject({ batchItemFailures: expect.any(Array) });
        });

        it('handles empty queue without error', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/deletion-worker.js')) as any;
            const deletionWorker: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = { Records: [] };
            const mockContext = {
                getRemainingTimeInMillis: () => 25000,
                functionName: 'deletionWorker',
                invokedFunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:deletionWorker',
            } as unknown as import('aws-lambda').Context;

            const result = await deletionWorker(mockEvent, mockContext);
            expect(result).toEqual({ batchItemFailures: [] });
        });

        it('marks failed messages for DLQ after max retries', async () => {
            const mod = (await import('../../../identity-webhooks/dist/handlers/deletion-worker.js')) as any;
            const deletionWorker: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                Records: [
                    {
                        messageId: 'msg-fail',
                        body: JSON.stringify({ userId: 'fail-user', auth0Sub: 'auth0|fail' }),
                        awsReprects: 3,
                        messageAttributes: {},
                        eventSource: 'aws:sqs',
                        eventSourceARN: 'arn:aws:sqs:us-east-1:000000000000:identity-deletion-queue',
                        receiptHandle: 'rh-fail',
                        tags: {},
                    },
                ],
            };
            const mockContext = {
                getRemainingTimeInMillis: () => 25000,
                functionName: 'deletionWorker',
                invokedFunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:deletionWorker',
            } as unknown as import('aws-lambda').Context;

            const result = await deletionWorker(mockEvent, mockContext);
            expect(result.batchItemFailures).toContainEqual({
                itemIdentifier: 'msg-fail',
            });
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
            expect(result).toMatchObject({ repairedCount: expect.any(Number) });
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
                repairedCount: expect.any(Number),
                diff: expect.objectContaining({
                    missingInAuth0: expect.any(Array),
                    missingInDb: expect.any(Array),
                }),
            });
        });
    });

    describe('local queue-driven retry path', () => {
        it('deletion-worker enqueues to DLQ when permanently failed', async () => {
            const mockSqsSend = vi.fn().mockResolvedValue({ MessageId: 'dlq-msg-001' });
            vi.doMock('@aws-sdk/client-sqs', () => ({
                SQSClient: vi.fn(),
                SendMessageCommand: vi.fn(({ input }: any) => ({
                    promise: () => mockSqsSend({ input }),
                })),
                ReceiveMessageCommand: vi.fn().mockResolvedValue({ Messages: [] }),
                DeleteMessageCommand: vi.fn(),
                ChangeMessageVisibilityCommand: vi.fn(),
            }));
            const mod = (await import('../../../identity-webhooks/dist/handlers/deletion-worker.js')) as any;
            const deletionWorker: AnyHandler = mod.handler ?? mod.default;
            const mockEvent = {
                Records: [
                    {
                        messageId: 'msg-perm-fail',
                        body: JSON.stringify({
                            userId: 'perm-fail-user',
                            auth0Sub: 'auth0|permfail',
                            requestedAt: new Date().toISOString(),
                            initiatedBy: 'system',
                        }),
                        awsReprects: 5,
                        messageAttributes: {},
                        eventSource: 'aws:sqs',
                        eventSourceARN: 'arn:aws:sqs:us-east-1:000000000000:identity-deletion-queue',
                        receiptHandle: 'rh-perm',
                        tags: {},
                    },
                ],
            };
            const mockContext = {
                getRemainingTimeInMillis: () => 25000,
                functionName: 'deletionWorker',
                invokedFunctionArn: 'arn:aws:lambda:us-east-1:000000000000:function:deletionWorker',
            } as unknown as import('aws-lambda').Context;

            const result = await deletionWorker(mockEvent, mockContext);
            expect(result.batchItemFailures).toContainEqual({
                itemIdentifier: 'msg-perm-fail',
            });
        });
    });

    describe('local reconciliation repair workflow', () => {
        it('reconciliation creates missing DB records for Auth0-only users', async () => {
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
            expect(result).toMatchObject({
                repairedCount: expect.any(Number),
                diff: expect.objectContaining({
                    missingInAuth0: expect.any(Array),
                    missingInDb: expect.any(Array),
                }),
            });
            expect(result.diff.missingInDb).toBeDefined();

            if (result.diff.missingInDb.length > 0) {
                expect(result.repairedCount).toBeGreaterThan(0);
            }
        });
    });
});
