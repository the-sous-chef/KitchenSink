import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    storeSession,
    getStoredSession,
    clearSession,
    hasStoredCredentials,
    isTokenExpired,
    getTokenTTL,
    SECURE_STORAGE_SESSION_KEYS,
} from '../src/storage/secureStorage.js';
import type { AuthSession } from '../src/types/auth.js';

vi.mock('expo-secure-store', () => ({
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    getItemAsync: vi.fn(),
    setItemAsync: vi.fn(),
    deleteItemAsync: vi.fn(),
}));

const baseSession: AuthSession = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    userId: 'user-123',
    auth0Id: 'auth0|user-123',
};

describe('Secure storage behavior coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('UTS-008-A1 [MOD-008]: storeSession writes all fields with device-only accessibility', async () => {
        const SecureStore = await import('expo-secure-store');
        vi.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);

        await storeSession(baseSession);

        expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(SECURE_STORAGE_SESSION_KEYS.length);
        for (const key of SECURE_STORAGE_SESSION_KEYS) {
            expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
                key,
                expect.any(String),
                expect.objectContaining({ keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
            );
        }
    });

    it('UTS-008-A2 [MOD-008/error]: storeSession throws if any write fails', async () => {
        const SecureStore = await import('expo-secure-store');
        vi.mocked(SecureStore.setItemAsync)
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce(new Error('write failed'))
            .mockResolvedValue(undefined);

        await expect(storeSession(baseSession)).rejects.toThrow('Failed to store session');
    });

    it('UTS-008-A3 [MOD-008/session-restoration]: getStoredSession returns null when any key missing', async () => {
        const SecureStore = await import('expo-secure-store');
        vi.mocked(SecureStore.getItemAsync).mockImplementation(async (key: string) =>
            key === 'auth_refresh_token' ? null : 'value',
        );

        const result = await getStoredSession();

        expect(result).toBeNull();
    });

    it('UTS-008-A4 [MOD-008/session-restoration]: getStoredSession returns complete session when all values exist', async () => {
        const SecureStore = await import('expo-secure-store');
        vi.mocked(SecureStore.getItemAsync).mockImplementation(async (key: string) => {
            switch (key) {
                case 'auth_access_token':
                    return 'stored-access';
                case 'auth_refresh_token':
                    return 'stored-refresh';
                case 'auth_expires_at':
                    return '2030-01-01T00:00:00.000Z';
                case 'auth_user_id':
                    return 'stored-user';
                case 'auth_auth0_id':
                    return 'auth0|stored';
                default:
                    return null;
            }
        });

        const result = await getStoredSession();

        expect(result).toEqual({
            accessToken: 'stored-access',
            refreshToken: 'stored-refresh',
            expiresAt: '2030-01-01T00:00:00.000Z',
            userId: 'stored-user',
            auth0Id: 'auth0|stored',
        });
    });

    it('UTS-008-A5 [MOD-008/session-restoration]: hasStoredCredentials requires all keys to be present', async () => {
        const SecureStore = await import('expo-secure-store');
        vi.mocked(SecureStore.getItemAsync)
            .mockResolvedValueOnce('present')
            .mockResolvedValueOnce('present')
            .mockResolvedValueOnce('present')
            .mockResolvedValueOnce('present')
            .mockResolvedValueOnce(null);

        expect(await hasStoredCredentials()).toBe(false);
    });

    it('UTS-008-A6 [MOD-008/logout]: clearSession deletes all session keys to avoid stale credentials', async () => {
        const SecureStore = await import('expo-secure-store');
        vi.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);

        await clearSession();

        expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(SECURE_STORAGE_SESSION_KEYS.length);
        for (const key of SECURE_STORAGE_SESSION_KEYS) {
            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(key);
        }
    });

    it('UTS-008-A7 [MOD-008/refresh]: isTokenExpired returns true when expiry missing', async () => {
        const SecureStore = await import('expo-secure-store');
        vi.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

        expect(await isTokenExpired()).toBe(true);
    });

    it('UTS-008-A8 [MOD-008/refresh]: isTokenExpired returns false for future expiry', async () => {
        const SecureStore = await import('expo-secure-store');
        vi.mocked(SecureStore.getItemAsync).mockResolvedValue(new Date(Date.now() + 60_000).toISOString());

        expect(await isTokenExpired()).toBe(false);
    });

    it('UTS-008-A9 [MOD-008/refresh]: getTokenTTL returns bounded positive milliseconds and zero when expired', async () => {
        const SecureStore = await import('expo-secure-store');
        vi.mocked(SecureStore.getItemAsync)
            .mockResolvedValueOnce(new Date(Date.now() + 3_000).toISOString())
            .mockResolvedValueOnce(new Date(Date.now() - 1_000).toISOString());

        const ttlPositive = await getTokenTTL();
        const ttlExpired = await getTokenTTL();

        expect(ttlPositive).toBeGreaterThan(0);
        expect(ttlPositive).toBeLessThanOrEqual(3_000);
        expect(ttlExpired).toBe(0);
    });
});
