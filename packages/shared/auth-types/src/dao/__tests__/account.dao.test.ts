import { describe, expect, it, vi } from 'vitest';

import type { UserSub } from '../../user.js';
import type { AccountRow } from '../../schema/accounts.js';
import { AccountDAO } from '../account.dao.js';

const makeSub = (s: string) => s as UserSub;

const makeAccountRow = (overrides: Partial<AccountRow> = {}): AccountRow => ({
    id: 'uuid-1234',
    ownerSub: makeSub('auth0|test123'),
    tier: 'free',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
});

describe('AccountDAO', () => {
    describe('findByOwnerSub', () => {
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
            const result = await dao.findByOwnerSub(makeSub('auth0|test123'));

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
            const result = await dao.findByOwnerSub(makeSub('auth0|nobody'));

            expect(result).toBeUndefined();
        });
    });

    describe('createForUser', () => {
        it('calls insert with ownerSub and default tier free', async () => {
            const row = makeAccountRow();
            const returningMock = vi.fn().mockResolvedValue([row]);
            const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
            const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

            const mockDb = { insert: insertMock };
            const dao = new AccountDAO(mockDb as never);

            const result = await dao.createForUser(makeSub('auth0|test123'));

            expect(insertMock).toHaveBeenCalledOnce();
            expect(valuesMock).toHaveBeenCalledWith({ ownerSub: makeSub('auth0|test123'), tier: 'free' });
            expect(result).toEqual(row);
        });
    });

    describe('upsert', () => {
        it('calls insert with onConflictDoUpdate keyed on ownerSub', async () => {
            const row = makeAccountRow();
            const returningMock = vi.fn().mockResolvedValue([row]);
            const onConflictMock = vi.fn().mockReturnValue({ returning: returningMock });
            const valuesMock = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictMock });
            const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

            const mockDb = { insert: insertMock };
            const dao = new AccountDAO(mockDb as never);

            const result = await dao.upsert(makeSub('auth0|test123'));

            expect(insertMock).toHaveBeenCalledOnce();
            expect(onConflictMock).toHaveBeenCalledOnce();
            const conflictArgs = onConflictMock.mock.calls[0]![0] as { target: unknown; set: Record<string, unknown> };
            expect(conflictArgs.set).toMatchObject({ tier: 'free' });
            expect(result).toEqual(row);
        });
    });

    describe('updateTier', () => {
        it('calls update and returns updated row', async () => {
            const row = makeAccountRow({ tier: 'premium' });
            const returningMock = vi.fn().mockResolvedValue([row]);
            const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
            const setMock = vi.fn().mockReturnValue({ where: whereMock });
            const updateMock = vi.fn().mockReturnValue({ set: setMock });

            const mockDb = { update: updateMock };
            const dao = new AccountDAO(mockDb as never);

            const result = await dao.updateTier(makeSub('auth0|test123'), 'premium');

            expect(updateMock).toHaveBeenCalledOnce();
            const setArgs = setMock.mock.calls[0]![0] as Record<string, unknown>;
            expect(setArgs.tier).toBe('premium');
            expect(result).toEqual(row);
        });
    });
});
