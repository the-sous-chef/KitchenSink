import { describe, expect, it, vi } from 'vitest';

import type { UserId } from '../../user.js';
import { UserDAO } from '../user.dao.js';

const makeUserId = (s: string) => s as UserId;

const makeUserRow = (overrides: Record<string, unknown> = {}) => ({
    id: makeUserId('auth0|test123'),
    email: 'test@example.com',
    name: 'Test User',
    picture: null,
    status: 'active' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides,
});

describe('UserDAO', () => {
    describe('findById', () => {
        it('queries users table with eq filter on id and returns first row', async () => {
            const row = makeUserRow();
            const mockDb = {
                select: vi.fn().mockReturnValue({
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([row]),
                    }),
                }),
            };

            const dao = new UserDAO(mockDb as never);
            const result = await dao.findById(makeUserId('auth0|test123'));

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

            const dao = new UserDAO(mockDb as never);
            const result = await dao.findById(makeUserId('auth0|nobody'));

            expect(result).toBeUndefined();
        });
    });

    describe('upsert', () => {
        it('calls insert with onConflictDoUpdate and returns the upserted row', async () => {
            const row = makeUserRow();
            const returningMock = vi.fn().mockResolvedValue([row]);
            const onConflictMock = vi.fn().mockReturnValue({ returning: returningMock });
            const valuesMock = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictMock });
            const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

            const mockDb = { insert: insertMock };
            const dao = new UserDAO(mockDb as never);

            const result = await dao.upsert({
                id: makeUserId('auth0|test123'),
                email: 'test@example.com',
                name: 'Test User',
            });

            expect(insertMock).toHaveBeenCalledOnce();
            expect(valuesMock).toHaveBeenCalledOnce();
            expect(onConflictMock).toHaveBeenCalledOnce();
            expect(returningMock).toHaveBeenCalledOnce();
            expect(result).toEqual(row);
        });
    });

    describe('updateProfile', () => {
        it('calls update/set/where/returning with patch data and returns updated row', async () => {
            const row = makeUserRow({ name: 'New Name' });
            const returningMock = vi.fn().mockResolvedValue([row]);
            const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
            const setMock = vi.fn().mockReturnValue({ where: whereMock });
            const updateMock = vi.fn().mockReturnValue({ set: setMock });

            const mockDb = { update: updateMock };
            const dao = new UserDAO(mockDb as never);

            const result = await dao.updateProfile(makeUserId('auth0|test123'), { name: 'New Name' });

            expect(updateMock).toHaveBeenCalledOnce();
            expect(setMock).toHaveBeenCalledOnce();
            expect(whereMock).toHaveBeenCalledOnce();
            expect(returningMock).toHaveBeenCalledOnce();
            expect(result).toEqual(row);
        });

        it('returns undefined when id does not exist', async () => {
            const returningMock = vi.fn().mockResolvedValue([]);
            const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
            const setMock = vi.fn().mockReturnValue({ where: whereMock });
            const updateMock = vi.fn().mockReturnValue({ set: setMock });

            const mockDb = { update: updateMock };
            const dao = new UserDAO(mockDb as never);

            const result = await dao.updateProfile(makeUserId('auth0|missing'), { name: 'New Name' });

            expect(result).toBeUndefined();
        });
    });

    describe('delete', () => {
        it('calls delete with eq filter on id', async () => {
            const mockDb = {
                delete: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined),
                }),
            };

            const dao = new UserDAO(mockDb as never);
            await dao.delete(makeUserId('auth0|test123'));

            expect(mockDb.delete).toHaveBeenCalledOnce();
        });
    });
});
