import { describe, expect, it, vi } from 'vitest';

import type { UserId } from '../../user.js';
import type { AccountRow } from '../../schema/accounts.js';
import { AccountDAO } from '../account.dao.js';

const makeUserId = (s: string) => s as UserId;

const makeAccountRow = (overrides: Partial<AccountRow> = {}): AccountRow => ({
    id: 'uuid-1234',
    userId: makeUserId('auth0|test123'),
    subscriptionTier: 'free',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
});

describe('AccountDAO', () => {
    describe('findByUserId', () => {
        it('returns the matching account row', async () => {
            const row = makeAccountRow();
            const mockDb = {
                select: vi.fn().mockReturnValue({
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([row]),
                    }),
                }),
            };

            const dao = new AccountDAO(mockDb as never);
            const result = await dao.findByUserId(makeUserId('auth0|test123'));

            expect(mockDb.select).toHaveBeenCalledOnce();
            expect(result).toEqual(row);
        });

        it('returns undefined when no rows match', async () => {
            const mockDb = {
                select: vi.fn().mockReturnValue({
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([]),
                    }),
                }),
            };

            const dao = new AccountDAO(mockDb as never);
            const result = await dao.findByUserId(makeUserId('auth0|nobody'));

            expect(result).toBeUndefined();
        });
    });

    describe('createForUser', () => {
        it('calls insert with userId and default subscriptionTier free', async () => {
            const row = makeAccountRow();
            const returningMock = vi.fn().mockResolvedValue([row]);
            const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
            const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

            const mockDb = { insert: insertMock };
            const dao = new AccountDAO(mockDb as never);

            const result = await dao.createForUser(makeUserId('auth0|test123'));

            expect(insertMock).toHaveBeenCalledOnce();
            expect(valuesMock).toHaveBeenCalledWith({ userId: makeUserId('auth0|test123'), subscriptionTier: 'free' });
            expect(result).toEqual(row);
        });
    });

    describe('upsert', () => {
        it('calls insert with onConflictDoUpdate target userId', async () => {
            const row = makeAccountRow();
            const returningMock = vi.fn().mockResolvedValue([row]);
            const onConflictMock = vi.fn().mockReturnValue({ returning: returningMock });
            const valuesMock = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictMock });
            const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

            const mockDb = { insert: insertMock };
            const dao = new AccountDAO(mockDb as never);

            const result = await dao.upsert(makeUserId('auth0|test123'), 'premium');

            expect(insertMock).toHaveBeenCalledOnce();
            expect(valuesMock).toHaveBeenCalledWith({ userId: makeUserId('auth0|test123'), subscriptionTier: 'premium' });
            expect(result).toEqual(row);
        });
    });
});
