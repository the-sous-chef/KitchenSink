/**
 * Identity Service — Unit Tests (T15)
 *
 * V-Model scenario IDs:
 *   REQ-005 REQ-006 REQ-009 REQ-013 REQ-014 REQ-015 REQ-017 REQ-018 REQ-019 REQ-025
 *   FR-005  FR-006  FR-009  FR-013  FR-014  FR-015  FR-017  FR-018  FR-019  FR-025
 *   NFR-012 NFR-013 NFR-014 NFR-016 NFR-017
 *   ARCH-003 ARCH-011 ARCH-012 ARCH-015 ARCH-024 ARCH-027 ARCH-028 ARCH-029
 *   MOD-003  MOD-011  MOD-012  MOD-015  MOD-024  MOD-027  MOD-028  MOD-029
 *
 * Strategy: deterministic in-memory mocks — no live AWS/Auth0/DB resources.
 * All DB interactions are mocked via a chainable Drizzle-shaped mock object.
 * SQS is mocked via a plain object with a `send` spy.
 * Auth0 is mocked via a plain object with per-method spies.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthErrorEnvelope, AuthErrorCode } from '@kitchensink/auth-types';

// ---------------------------------------------------------------------------
// Module-level mocks (must be hoisted before any dynamic imports)
// ---------------------------------------------------------------------------

vi.mock('@aws-sdk/client-sqs', () => ({
    SQSClient: vi.fn(),
    SendMessageCommand: vi.fn(),
}));

vi.mock('pg', () => {
    const mockPool = { connect: vi.fn(), query: vi.fn(), end: vi.fn() };
    return { default: { Pool: vi.fn(() => mockPool) } };
});

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Build a Drizzle-shaped select chain that resolves to `result`. */
function makeChain<T>(result: T) {
    return {
        from: () => ({
            where: () => ({
                limit: () => Promise.resolve(result),
            }),
        }),
    };
}

/** Build a Drizzle-shaped update chain (set → where → resolves). */
function makeUpdateChain() {
    return {
        set: () => ({ where: () => Promise.resolve() }),
    };
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const userCtx = {
    userId: 'user-123',
    auth0Sub: 'auth0|abc123',
    email: 'test@example.com',
    status: 'active' as const,
    isImpersonating: false,
};

const adminCtx = {
    userId: 'admin-1',
    auth0Sub: 'auth0|admin',
    email: 'admin@example.com',
    status: 'active' as const,
    isImpersonating: false,
};

const mockUser = {
    id: 'user-123',
    auth0Sub: 'auth0|abc123',
    email: 'test@example.com',
    status: 'active',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null,
};

const mockProfile = {
    id: 'p-1',
    userId: 'user-123',
    displayName: 'Test User',
    avatarUrl: 'https://example.com/avatar.png',
    bio: null,
    updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const mockAccount = {
    id: 'a-1',
    userId: 'user-123',
    subscriptionTier: 'free',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
};

// ---------------------------------------------------------------------------
// UsersService — patchUserMe
// ---------------------------------------------------------------------------

describe('UsersService.patchUserMe', () => {
    let usersService: any;
    let mockDb: any;
    let mockAuth0: any;
    let mockSqs: any;

    beforeEach(async () => {
        mockDb = {
            select: vi.fn(),
            update: vi.fn().mockReturnValue(makeUpdateChain()),
            transaction: vi.fn(async (cb: (tx: any) => Promise<void>) => {
                const tx = {
                    delete: vi.fn().mockReturnValue({ where: () => Promise.resolve() }),
                };
                await cb(tx);
            }),
        };

        mockAuth0 = {
            blockUser: vi.fn().mockResolvedValue(undefined),
            unblockUser: vi.fn().mockResolvedValue(undefined),
            deleteUser: vi.fn().mockResolvedValue(undefined),
            createPasswordResetTicket: vi.fn().mockResolvedValue({ ticket: 'https://example.com/ticket' }),
            enrollMFA: vi.fn().mockResolvedValue({ uri: 'otpauth://test' }),
            unenrollMFA: vi.fn().mockResolvedValue(undefined),
            linkAccounts: vi.fn().mockResolvedValue(undefined),
            unlinkAccount: vi.fn().mockResolvedValue(undefined),
        };

        mockSqs = { enqueueDeletion: vi.fn().mockResolvedValue(undefined) };

        const { UsersService } = await import('../src/users/users.service.js');
        usersService = new UsersService(mockDb, mockAuth0, mockSqs);
    });

    it('UTS-015-A1 [MOD-015] TC-U-001: patchUserMe updates displayName only', async () => {
        // @implements REQ-006 FR-006 ARCH-003 MOD-003
        const updatedProfile = { ...mockProfile, displayName: 'New Name' };

        mockDb.select = vi
            .fn()
            .mockReturnValueOnce(makeChain([mockUser])) // existence check
            .mockReturnValueOnce(makeChain([updatedProfile])) // fetch updated profile
            .mockReturnValueOnce(makeChain([mockAccount])); // fetch updated account

        const result = await usersService.patchUserMe(userCtx, { displayName: 'New Name' });

        expect(mockDb.update).toHaveBeenCalledOnce();
        expect(result.user.displayName).toBe('New Name');
        expect(result.user.id).toBe('user-123');
    });

    it('UTS-015-A1 [MOD-015] TC-U-002: patchUserMe updates avatarUrl to a URL string', async () => {
        // @implements REQ-006 FR-006 ARCH-003 MOD-003
        const updatedProfile = { ...mockProfile, avatarUrl: 'https://cdn.example.com/new.png' };

        mockDb.select = vi
            .fn()
            .mockReturnValueOnce(makeChain([mockUser]))
            .mockReturnValueOnce(makeChain([updatedProfile]))
            .mockReturnValueOnce(makeChain([mockAccount]));

        const result = await usersService.patchUserMe(userCtx, { avatarUrl: 'https://cdn.example.com/new.png' });

        expect(result.user.avatarUrl).toBe('https://cdn.example.com/new.png');
    });

    it('UTS-015-A1 [MOD-015] TC-U-003: patchUserMe clears avatarUrl when set to null', async () => {
        // @implements REQ-006 FR-006 ARCH-003 MOD-003 — avatarUrl: null is a valid clear operation
        const updatedProfile = { ...mockProfile, avatarUrl: null };

        mockDb.select = vi
            .fn()
            .mockReturnValueOnce(makeChain([mockUser]))
            .mockReturnValueOnce(makeChain([updatedProfile]))
            .mockReturnValueOnce(makeChain([mockAccount]));

        const result = await usersService.patchUserMe(userCtx, { avatarUrl: null });

        expect(result.user.avatarUrl).toBeNull();
    });

    it('UTS-015-A1 [MOD-015] TC-U-004: patchUserMe updates both displayName and avatarUrl together', async () => {
        // @implements REQ-006 FR-006 ARCH-003 MOD-003
        const updatedProfile = {
            ...mockProfile,
            displayName: 'Both Updated',
            avatarUrl: 'https://cdn.example.com/x.png',
        };

        mockDb.select = vi
            .fn()
            .mockReturnValueOnce(makeChain([mockUser]))
            .mockReturnValueOnce(makeChain([updatedProfile]))
            .mockReturnValueOnce(makeChain([mockAccount]));

        const result = await usersService.patchUserMe(userCtx, {
            displayName: 'Both Updated',
            avatarUrl: 'https://cdn.example.com/x.png',
        });

        expect(result.user.displayName).toBe('Both Updated');
        expect(result.user.avatarUrl).toBe('https://cdn.example.com/x.png');
    });

    it('UTS-015-A2 [MOD-015] TC-U-005: patchUserMe skips DB update when no fields provided', async () => {
        // @implements REQ-006 FR-006 — no-op patch should not call update
        const updatedProfile = { ...mockProfile };

        mockDb.select = vi
            .fn()
            .mockReturnValueOnce(makeChain([mockUser]))
            .mockReturnValueOnce(makeChain([updatedProfile]))
            .mockReturnValueOnce(makeChain([mockAccount]));

        await usersService.patchUserMe(userCtx, {});

        expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('UTS-015-A2 [MOD-015] TC-U-006: patchUserMe throws NotFoundException when user missing', async () => {
        // @implements REQ-006 NFR-012 — error envelope: USER_NOT_FOUND
        mockDb.select = vi.fn().mockReturnValue(makeChain([]));

        await expect(usersService.patchUserMe(userCtx, { displayName: 'X' })).rejects.toThrow();
    });

    it('UTS-015-A1 [MOD-015] TC-U-007: patchUserMe returns ISO timestamp strings', async () => {
        // @implements REQ-006 FR-006 ARCH-003 — dates must be ISO strings in response
        mockDb.select = vi
            .fn()
            .mockReturnValueOnce(makeChain([mockUser]))
            .mockReturnValueOnce(makeChain([mockProfile]))
            .mockReturnValueOnce(makeChain([mockAccount]));

        const result = await usersService.patchUserMe(userCtx, { displayName: 'ISO Test' });

        expect(result.user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(result.user.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
});

// ---------------------------------------------------------------------------
// UsersService — deleteUserMe (extended paths)
// ---------------------------------------------------------------------------

describe('UsersService.deleteUserMe (extended)', () => {
    let usersService: any;
    let mockDb: any;
    let mockAuth0: any;
    let mockSqs: any;

    beforeEach(async () => {
        mockDb = {
            select: vi.fn(),
            update: vi.fn().mockReturnValue(makeUpdateChain()),
            transaction: vi.fn(async (cb: (tx: any) => Promise<void>) => {
                const tx = {
                    delete: vi.fn().mockReturnValue({ where: () => Promise.resolve() }),
                };
                await cb(tx);
            }),
        };

        mockAuth0 = {
            deleteUser: vi.fn().mockResolvedValue(undefined),
            blockUser: vi.fn().mockResolvedValue(undefined),
            unblockUser: vi.fn().mockResolvedValue(undefined),
            createPasswordResetTicket: vi.fn().mockResolvedValue({ ticket: 'https://example.com/ticket' }),
            enrollMFA: vi.fn().mockResolvedValue({ uri: 'otpauth://test' }),
            unenrollMFA: vi.fn().mockResolvedValue(undefined),
            linkAccounts: vi.fn().mockResolvedValue(undefined),
            unlinkAccount: vi.fn().mockResolvedValue(undefined),
        };

        mockSqs = { enqueueDeletion: vi.fn().mockResolvedValue(undefined) };

        const { UsersService } = await import('../src/users/users.service.js');
        usersService = new UsersService(mockDb, mockAuth0, mockSqs);
    });

    it('UTS-017-A2 [MOD-017] TC-U-008: deleteUserMe throws NotFoundException when user missing', async () => {
        // @implements REQ-025 FR-025 NFR-012 — USER_NOT_FOUND error path
        mockDb.select = vi.fn().mockReturnValue(makeChain([]));

        await expect(usersService.deleteUserMe(userCtx)).rejects.toThrow();
    });

    it('UTS-017-A1 [MOD-017] TC-U-009: deleteUserMe falls back to SQS enqueue when auth0.deleteUser throws', async () => {
        // @implements REQ-025 FR-025 ARCH-024 MOD-024 — async deletion fallback
        mockDb.select = vi.fn().mockReturnValue(makeChain([mockUser]));
        mockAuth0.deleteUser = vi.fn().mockRejectedValue(new Error('Auth0 unavailable'));

        const result = await usersService.deleteUserMe(userCtx);

        expect(mockSqs.enqueueDeletion).toHaveBeenCalledWith('auth0|abc123', 'user-123', 'user_request');
        expect(result.userId).toBe('user-123');
        expect(result.message).toBe('Account deletion initiated');
    });

    it('UTS-017-A1 [MOD-017] TC-U-010: deleteUserMe returns ISO deletedAt timestamp', async () => {
        // @implements REQ-025 FR-025 ARCH-024 — response shape
        mockDb.select = vi.fn().mockReturnValue(makeChain([mockUser]));

        const result = await usersService.deleteUserMe(userCtx);

        expect(result.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('UTS-017-A1 [MOD-017] TC-U-011: deleteUserMe does NOT call SQS when auth0.deleteUser succeeds', async () => {
        // @implements REQ-025 FR-025 — SQS only used as fallback
        mockDb.select = vi.fn().mockReturnValue(makeChain([mockUser]));

        await usersService.deleteUserMe(userCtx);

        expect(mockSqs.enqueueDeletion).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// UsersService — error paths for MFA and social account operations
// ---------------------------------------------------------------------------

describe('UsersService — MFA and social account error paths', () => {
    let usersService: any;
    let mockDb: any;
    let mockAuth0: any;
    let mockSqs: any;

    beforeEach(async () => {
        mockDb = {
            select: vi.fn(),
            update: vi.fn().mockReturnValue(makeUpdateChain()),
            transaction: vi.fn(),
        };

        mockAuth0 = {
            blockUser: vi.fn().mockResolvedValue(undefined),
            unblockUser: vi.fn().mockResolvedValue(undefined),
            deleteUser: vi.fn().mockResolvedValue(undefined),
            createPasswordResetTicket: vi.fn().mockResolvedValue({ ticket: 'https://example.com/ticket' }),
            enrollMFA: vi.fn().mockRejectedValue(new Error('Auth0 MFA error')),
            unenrollMFA: vi.fn().mockRejectedValue(new Error('Auth0 unenroll error')),
            linkAccounts: vi.fn().mockRejectedValue(new Error('Auth0 link error')),
            unlinkAccount: vi.fn().mockRejectedValue(new Error('Auth0 unlink error')),
        };

        mockSqs = { enqueueDeletion: vi.fn().mockResolvedValue(undefined) };

        const { UsersService } = await import('../src/users/users.service.js');
        usersService = new UsersService(mockDb, mockAuth0, mockSqs);
    });

    it('UTS-020-A2 [MOD-020] TC-U-012: enrollMFA returns empty enrollmentUri when auth0 throws', async () => {
        // @implements REQ-009 FR-009 NFR-012 — graceful degradation
        const result = await usersService.enrollMFA('auth0|abc123');

        expect(result.message).toBe('MFA enrollment failed');
        expect(result.enrollmentUri).toBe('');
    });

    it('UTS-020-A2 [MOD-020] TC-U-013: unenrollMFA returns failure message when auth0 throws', async () => {
        // @implements REQ-009 FR-009 NFR-012 — graceful degradation
        const result = await usersService.unenrollMFA('enroll-1');

        expect(result.message).toBe('MFA unenroll failed');
    });

    it('UTS-020-A1 [MOD-020] TC-U-014: linkSocialAccount returns failure message when auth0 throws', async () => {
        // @implements REQ-009 FR-009 NFR-012 — graceful degradation
        const result = await usersService.linkSocialAccount('auth0|abc123', 'google-oauth2', 'acc-1');

        expect(result.message).toBe('Account link failed');
    });

    it('UTS-020-A2 [MOD-020] TC-U-015: unlinkSocialAccount returns failure message when auth0 throws', async () => {
        // @implements REQ-009 FR-009 NFR-012 — graceful degradation
        const result = await usersService.unlinkSocialAccount('auth0|abc123', 'google-oauth2', 'acc-1');

        expect(result.message).toBe('Account unlink failed');
    });
});

// ---------------------------------------------------------------------------
// AdminService — extended error paths
// ---------------------------------------------------------------------------

describe('AdminService — extended error paths', () => {
    let adminService: any;
    let mockDb: any;
    let mockAuth0: any;

    beforeEach(async () => {
        mockDb = {
            select: vi.fn().mockReturnValue(makeChain([])), // default: user not found
            update: vi.fn().mockReturnValue(makeUpdateChain()),
        };

        mockAuth0 = {
            blockUser: vi.fn().mockResolvedValue(undefined),
            unblockUser: vi.fn().mockResolvedValue(undefined),
        };

        const { AdminService } = await import('../src/admin/admin.service.js');
        adminService = new AdminService(mockDb, mockAuth0);
    });

    it('UTS-026-A2 [MOD-026] TC-A-001: unsuspendUser throws NotFoundException when target missing', async () => {
        // @implements REQ-013 FR-013 NFR-012 — USER_NOT_FOUND
        await expect(adminService.unsuspendUser('missing', adminCtx)).rejects.toThrow();
    });

    it('UTS-022-A2 [MOD-022] TC-A-002: startImpersonation throws NotFoundException when target missing', async () => {
        // @implements REQ-017 FR-017 NFR-012 — USER_NOT_FOUND
        await expect(adminService.startImpersonation('missing', adminCtx)).rejects.toThrow();
    });

    it('UTS-022-A2 [MOD-022] TC-A-003: stopImpersonation throws NotFoundException when target missing', async () => {
        // @implements REQ-018 FR-018 NFR-012 — USER_NOT_FOUND
        await expect(adminService.stopImpersonation('missing', adminCtx)).rejects.toThrow();
    });

    it('UTS-026-A1 [MOD-026] TC-A-004: suspendUser returns ISO suspendedAt timestamp', async () => {
        // @implements REQ-013 FR-013 ARCH-011 — response shape
        mockDb.select = vi.fn().mockReturnValue(makeChain([mockUser]));

        const result = await adminService.suspendUser('user-123', adminCtx);

        expect(result.suspendedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('UTS-026-A1 [MOD-026] TC-A-005: unsuspendUser returns ISO unsuspendedAt timestamp', async () => {
        // @implements REQ-014 FR-014 ARCH-011 — response shape
        mockDb.select = vi.fn().mockReturnValue(makeChain([mockUser]));

        const result = await adminService.unsuspendUser('user-123', adminCtx);

        expect(result.unsuspendedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('UTS-022-A1 [MOD-022] TC-A-006: startImpersonation sessionId contains impersonator and target IDs', async () => {
        // @implements REQ-017 FR-017 ARCH-015 MOD-015 — session ID format
        mockDb.select = vi.fn().mockReturnValue(makeChain([mockUser]));

        const result = await adminService.startImpersonation('user-123', adminCtx);

        expect(result.sessionId).toContain('admin-1');
        expect(result.sessionId).toContain('user-123');
    });

    it('UTS-022-A1 [MOD-022] TC-A-007: stopImpersonation returns expected message string', async () => {
        // @implements REQ-018 FR-018 ARCH-015 — stop response shape
        mockDb.select = vi.fn().mockReturnValue(makeChain([mockUser]));

        const result = await adminService.stopImpersonation('user-123', adminCtx);

        expect(result.message).toBe('Impersonation session ended');
        expect(result.stoppedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('UTS-026-A1 [MOD-026] TC-A-008: suspendUser calls auth0.blockUser with correct auth0Sub', async () => {
        // @implements REQ-013 FR-013 ARCH-011 — auth0 integration
        mockDb.select = vi.fn().mockReturnValue(makeChain([mockUser]));

        await adminService.suspendUser('user-123', adminCtx);

        expect(mockAuth0.blockUser).toHaveBeenCalledWith('auth0|abc123');
    });

    it('UTS-026-A1 [MOD-026] TC-A-009: unsuspendUser calls auth0.unblockUser with correct auth0Sub', async () => {
        // @implements REQ-014 FR-014 ARCH-011 — auth0 integration
        mockDb.select = vi.fn().mockReturnValue(makeChain([mockUser]));

        await adminService.unsuspendUser('user-123', adminCtx);

        expect(mockAuth0.unblockUser).toHaveBeenCalledWith('auth0|abc123');
    });
});

// ---------------------------------------------------------------------------
// SqsService — deletion reason variants
// ---------------------------------------------------------------------------

describe('SqsService.enqueueDeletion — reason variants', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('UTS-023-A1 [MOD-023] TC-S-001: enqueues with reason=admin_request', async () => {
        // @implements REQ-025 FR-025 ARCH-024 MOD-024
        const mockSend = vi.fn().mockResolvedValue({});
        const { SqsService } = await import('../src/queue/sqs.service.js');
        const { SendMessageCommand } = await import('@aws-sdk/client-sqs');
        const svc = new SqsService({ send: mockSend } as any);

        process.env.DELETION_QUEUE_URL = 'https://sqs.example.com/queue';

        await svc.enqueueDeletion('auth0|admin-target', 'user-456', 'admin_request');

        expect(mockSend).toHaveBeenCalledOnce();
        const constructorArg = vi.mocked(SendMessageCommand).mock.calls[0][0];
        const body = JSON.parse(constructorArg.MessageBody as string);

        expect(body.reason).toBe('admin_request');
        expect(body.userId).toBe('user-456');
        expect(body.auth0Sub).toBe('auth0|admin-target');
        expect(body.source).toBe('identity-service');

        delete process.env.DELETION_QUEUE_URL;
    });

    it('UTS-023-A1 [MOD-023] TC-S-002: enqueues with reason=compliance', async () => {
        // @implements REQ-025 FR-025 ARCH-024 MOD-024
        const mockSend = vi.fn().mockResolvedValue({});
        const { SqsService } = await import('../src/queue/sqs.service.js');
        const { SendMessageCommand } = await import('@aws-sdk/client-sqs');
        const svc = new SqsService({ send: mockSend } as any);

        process.env.DELETION_QUEUE_URL = 'https://sqs.example.com/queue';

        await svc.enqueueDeletion('auth0|compliance-target', 'user-789', 'compliance');

        expect(mockSend).toHaveBeenCalledOnce();
        const constructorArg = vi.mocked(SendMessageCommand).mock.calls[0][0];
        const body = JSON.parse(constructorArg.MessageBody as string);

        expect(body.reason).toBe('compliance');
        expect(body.correlationId).toMatch(/^[0-9a-f-]{36}$/);
        expect(body.requestedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

        delete process.env.DELETION_QUEUE_URL;
    });

    it('UTS-023-A2 [MOD-023] TC-S-003: message body conforms to UserDeletionQueueMessage shape', async () => {
        // @implements REQ-025 FR-025 ARCH-024 MOD-024 — full shape validation
        const mockSend = vi.fn().mockResolvedValue({});
        const { SqsService } = await import('../src/queue/sqs.service.js');
        const { SendMessageCommand } = await import('@aws-sdk/client-sqs');
        const svc = new SqsService({ send: mockSend } as any);

        process.env.DELETION_QUEUE_URL = 'https://sqs.example.com/queue';

        await svc.enqueueDeletion('auth0|shape-test', 'user-shape', 'user_request');

        const constructorArg = vi.mocked(SendMessageCommand).mock.calls[0][0];
        const body = JSON.parse(constructorArg.MessageBody as string);

        // All required fields from UserDeletionQueueMessage
        expect(body).toHaveProperty('userId');
        expect(body).toHaveProperty('auth0Sub');
        expect(body).toHaveProperty('requestedAt');
        expect(body).toHaveProperty('correlationId');
        expect(body).toHaveProperty('reason');
        expect(body).toHaveProperty('source');
        expect(['user_request', 'admin_request', 'compliance']).toContain(body.reason);
        expect(['identity-service', 'identity-webhooks']).toContain(body.source);

        delete process.env.DELETION_QUEUE_URL;
    });
});

// ---------------------------------------------------------------------------
// AuthErrorEnvelope — shared type shape validation
// ---------------------------------------------------------------------------

describe('AuthErrorEnvelope — shared type contract', () => {
    it('UTS-031-A1 [MOD-031] TC-E-001: AuthErrorEnvelope has required fields with correct types', () => {
        // @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017
        // @implements ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029
        const envelope: AuthErrorEnvelope = {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            requestId: 'req-abc-123',
        };

        expect(envelope.code).toBe('USER_NOT_FOUND');
        expect(envelope.message).toBeDefined();
        expect(envelope.requestId).toBeDefined();
        expect(envelope.cause).toBeUndefined();
    });

    it('UTS-031-A1 [MOD-031] TC-E-002: AuthErrorEnvelope accepts all valid AuthErrorCode values', () => {
        // @implements NFR-012 NFR-013 NFR-014 NFR-016 NFR-017
        const validCodes: AuthErrorCode[] = [
            'UNAUTHORIZED',
            'FORBIDDEN',
            'TOKEN_EXPIRED',
            'TOKEN_INVALID',
            'USER_NOT_FOUND',
            'USER_SUSPENDED',
            'ACCOUNT_NOT_FOUND',
            'PROFILE_NOT_FOUND',
            'INTERNAL_ERROR',
        ];

        for (const code of validCodes) {
            const envelope: AuthErrorEnvelope = {
                code,
                message: `Error: ${code}`,
                requestId: 'req-test',
            };
            expect(envelope.code).toBe(code);
        }
    });

    it('UTS-031-A1 [MOD-031] TC-E-003: AuthErrorEnvelope accepts optional cause field', () => {
        // @implements NFR-012 — cause is optional for internal debugging
        const envelope: AuthErrorEnvelope = {
            code: 'INTERNAL_ERROR',
            message: 'Unexpected failure',
            requestId: 'req-xyz',
            cause: new Error('underlying error'),
        };

        expect(envelope.cause).toBeInstanceOf(Error);
    });

    it('UTS-031-A2 [MOD-031] TC-E-004: USER_SUSPENDED error code maps to suspended user scenario', () => {
        // @implements REQ-013 FR-013 NFR-012 — suspension error path
        const envelope: AuthErrorEnvelope = {
            code: 'USER_SUSPENDED',
            message: 'Account is suspended',
            requestId: 'req-suspend-test',
        };

        expect(envelope.code).toBe('USER_SUSPENDED');
    });
});

// ---------------------------------------------------------------------------
// UsersService — getUserMe profile field completeness
// ---------------------------------------------------------------------------

describe('UsersService.getUserMe — profile field completeness', () => {
    let usersService: any;
    let mockDb: any;
    let mockAuth0: any;
    let mockSqs: any;

    beforeEach(async () => {
        mockDb = {
            select: vi.fn(),
            update: vi.fn().mockReturnValue(makeUpdateChain()),
            transaction: vi.fn(),
        };

        mockAuth0 = {
            blockUser: vi.fn(),
            unblockUser: vi.fn(),
            deleteUser: vi.fn(),
            createPasswordResetTicket: vi.fn(),
            enrollMFA: vi.fn(),
            unenrollMFA: vi.fn(),
            linkAccounts: vi.fn(),
            unlinkAccount: vi.fn(),
        };

        mockSqs = { enqueueDeletion: vi.fn() };

        const { UsersService } = await import('../src/users/users.service.js');
        usersService = new UsersService(mockDb, mockAuth0, mockSqs);
    });

    it('UTS-015-A1 [MOD-015] TC-U-016: getUserMe returns avatarUrl=null when profile has no avatar', async () => {
        // @implements REQ-005 FR-005 ARCH-003 — avatarUrl: null is valid
        const profileNoAvatar = { ...mockProfile, avatarUrl: null };

        mockDb.select = vi
            .fn()
            .mockReturnValueOnce(makeChain([mockUser]))
            .mockReturnValueOnce(makeChain([mockAccount]))
            .mockReturnValueOnce(makeChain([profileNoAvatar]));

        const result = await usersService.getUserMe(userCtx);

        expect(result.user.avatarUrl).toBeNull();
    });

    it('UTS-015-A2 [MOD-015] TC-U-017: getUserMe returns empty displayName when profile missing', async () => {
        // @implements REQ-005 FR-005 ARCH-003 — missing profile graceful default
        mockDb.select = vi
            .fn()
            .mockReturnValueOnce(makeChain([mockUser]))
            .mockReturnValueOnce(makeChain([mockAccount]))
            .mockReturnValueOnce(makeChain([])); // no profile

        const result = await usersService.getUserMe(userCtx);

        expect(result.user.displayName).toBe('');
        expect(result.user.avatarUrl).toBeNull();
    });

    it('UTS-015-A2 [MOD-015] TC-U-018: getUserMe returns subscriptionTier=free when account missing', async () => {
        // @implements REQ-005 FR-005 ARCH-012 — missing account graceful default
        mockDb.select = vi
            .fn()
            .mockReturnValueOnce(makeChain([mockUser]))
            .mockReturnValueOnce(makeChain([])) // no account
            .mockReturnValueOnce(makeChain([mockProfile]));

        const result = await usersService.getUserMe(userCtx);

        expect(result.account.subscriptionTier).toBe('free');
    });

    it('UTS-015-A1 [MOD-015] TC-U-019: getUserMe response user shape matches UserProfileUserDto contract', async () => {
        // @implements REQ-005 FR-005 ARCH-003 MOD-003 — DTO contract alignment
        mockDb.select = vi
            .fn()
            .mockReturnValueOnce(makeChain([mockUser]))
            .mockReturnValueOnce(makeChain([mockAccount]))
            .mockReturnValueOnce(makeChain([mockProfile]));

        const result = await usersService.getUserMe(userCtx);

        // Verify all UserProfileUserDto fields are present
        expect(result.user).toHaveProperty('id');
        expect(result.user).toHaveProperty('auth0Sub');
        expect(result.user).toHaveProperty('email');
        expect(result.user).toHaveProperty('displayName');
        expect(result.user).toHaveProperty('avatarUrl');
        expect(result.user).toHaveProperty('status');
        expect(result.user).toHaveProperty('createdAt');
        expect(result.user).toHaveProperty('updatedAt');
    });
});
