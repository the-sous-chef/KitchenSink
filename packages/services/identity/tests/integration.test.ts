import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-sdk/client-sqs', () => ({
    SQSClient: vi.fn(),
    SendMessageCommand: vi.fn(),
}));

vi.mock('pg', () => {
    const mockPool = { connect: vi.fn(), query: vi.fn(), end: vi.fn() };

    return { default: { Pool: vi.fn(() => mockPool) } };
});

function makeChain<T>(result: T) {
    return {
        from: () => ({
            where: () => ({
                limit: () => Promise.resolve(result),
            }),
        }),
    };
}

const adminCtx = {
    userId: 'admin-1',
    auth0Sub: 'auth0|admin',
    email: 'admin@example.com',
    status: 'active',
    isImpersonating: 'false',
};

const userCtx = {
    userId: 'user-123',
    auth0Sub: 'auth0|abc123',
    email: 'test@example.com',
    status: 'active',
    isImpersonating: 'false',
};

const mockUser = {
    id: 'user-123',
    auth0Sub: 'auth0|abc123',
    email: 'test@example.com',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('UsersService', () => {
    let usersService: any;
    let mockDb: any;
    let mockAuth0: any;
    let mockSqs: any;

    beforeEach(async () => {
        mockDb = {
            select: vi.fn(),
            update: vi.fn().mockReturnValue({
                set: () => ({ where: () => Promise.resolve() }),
            }),
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

    it('getUserMe returns aggregated profile', async () => {
        const profile = {
            id: 'p-1',
            userId: 'user-123',
            displayName: 'Test',
            avatarUrl: null,
            bio: null,
            updatedAt: new Date(),
        };
        const account = {
            id: 'a-1',
            userId: 'user-123',
            subscriptionTier: 'free',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockDb.select = vi
            .fn()
            .mockReturnValueOnce(makeChain([mockUser]))
            .mockReturnValueOnce(makeChain([account]))
            .mockReturnValueOnce(makeChain([profile]));

        const result = await usersService.getUserMe(userCtx);

        expect(result.user.id).toBe('user-123');
        expect(result.account.subscriptionTier).toBe('free');
    });

    it('getUserMe throws when user missing', async () => {
        mockDb.select = vi.fn().mockReturnValue(makeChain([]));

        await expect(usersService.getUserMe(userCtx)).rejects.toThrow();
    });

    it('deleteUserMe deletes via auth0 and cascades', async () => {
        mockDb.select = vi.fn().mockReturnValue(makeChain([mockUser]));

        await usersService.deleteUserMe(userCtx);

        expect(mockAuth0.deleteUser).toHaveBeenCalledWith('auth0|abc123');
    });

    it('requestPasswordReset returns generic message even when user missing', async () => {
        mockDb.select = vi.fn().mockReturnValue(makeChain([]));

        const result = await usersService.requestPasswordReset('nobody@example.com');

        expect(result.message).toBeDefined();
        expect(mockAuth0.createPasswordResetTicket).not.toHaveBeenCalled();
    });

    it('requestPasswordReset triggers auth0 ticket when user exists', async () => {
        mockDb.select = vi.fn().mockReturnValue(makeChain([mockUser]));

        await usersService.requestPasswordReset('test@example.com');

        expect(mockAuth0.createPasswordResetTicket).toHaveBeenCalled();
    });

    it('enrollMFA delegates to auth0', async () => {
        const result = await usersService.enrollMFA('auth0|abc123');

        expect(mockAuth0.enrollMFA).toHaveBeenCalledWith('auth0|abc123');
        expect(result.enrollmentUri).toBe('otpauth://test');
    });

    it('unenrollMFA delegates to auth0', async () => {
        await usersService.unenrollMFA('enroll-1');

        expect(mockAuth0.unenrollMFA).toHaveBeenCalledWith('enroll-1');
    });

    it('linkSocialAccount delegates to auth0', async () => {
        await usersService.linkSocialAccount('auth0|abc123', 'google-oauth2', 'acc-1');

        expect(mockAuth0.linkAccounts).toHaveBeenCalled();
    });

    it('unlinkSocialAccount delegates to auth0', async () => {
        await usersService.unlinkSocialAccount('auth0|abc123', 'google-oauth2', 'acc-1');

        expect(mockAuth0.unlinkAccount).toHaveBeenCalled();
    });
});

describe('AdminService', () => {
    let adminService: any;
    let mockDb: any;
    let mockAuth0: any;

    beforeEach(async () => {
        mockDb = {
            select: vi.fn().mockReturnValue(makeChain([mockUser])),
            update: vi.fn().mockReturnValue({
                set: () => ({ where: () => Promise.resolve() }),
            }),
        };

        mockAuth0 = {
            blockUser: vi.fn().mockResolvedValue(undefined),
            unblockUser: vi.fn().mockResolvedValue(undefined),
        };

        const { AdminService } = await import('../src/admin/admin.service.js');

        adminService = new AdminService(mockDb, mockAuth0);
    });

    it('suspendUser blocks in auth0 and updates db', async () => {
        const result = await adminService.suspendUser('user-123', adminCtx);

        expect(mockAuth0.blockUser).toHaveBeenCalledWith('auth0|abc123');
        expect(result.status).toBe('suspended');
    });

    it('unsuspendUser unblocks in auth0 and updates db', async () => {
        const result = await adminService.unsuspendUser('user-123', adminCtx);

        expect(mockAuth0.unblockUser).toHaveBeenCalledWith('auth0|abc123');
        expect(result.status).toBe('active');
    });

    it('startImpersonation returns session metadata', async () => {
        const result = await adminService.startImpersonation('user-123', adminCtx);

        expect(result.impersonatorId).toBe('admin-1');
        expect(result.impersonatedUserId).toBe('user-123');
        expect(result.sessionId).toContain('imp-');
    });

    it('stopImpersonation returns stop metadata', async () => {
        const result = await adminService.stopImpersonation('user-123', adminCtx);

        expect(result.impersonatorId).toBe('admin-1');
        expect(result.impersonatedUserId).toBe('user-123');
    });

    it('suspendUser throws when target missing', async () => {
        mockDb.select = vi.fn().mockReturnValue(makeChain([]));

        await expect(adminService.suspendUser('missing', adminCtx)).rejects.toThrow();
    });
});
