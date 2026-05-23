import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

const mockSession: AuthSession = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    sub: 'auth0|test-auth0-id',
};

describe('SecureStorage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('storeSession', () => {
        it('should store all session fields in secure storage', async () => {
            const SecureStore = await import('expo-secure-store');
            vi.mocked(SecureStore.setItemAsync).mockResolvedValue();

            await storeSession(mockSession);

            expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(4);
        });

        it('should use device-only secure-store options for every token field', async () => {
            const SecureStore = await import('expo-secure-store');
            vi.mocked(SecureStore.setItemAsync).mockResolvedValue();

            await storeSession(mockSession);

            for (const key of SECURE_STORAGE_SESSION_KEYS) {
                expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
                    key,
                    expect.any(String),
                    expect.objectContaining({ keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
                );
            }
        });

        it('should throw error if any storage operation fails', async () => {
            const SecureStore = await import('expo-secure-store');
            vi.mocked(SecureStore.setItemAsync)
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('Storage failed'));

            await expect(storeSession(mockSession)).rejects.toThrow();
        });
    });

    describe('getStoredSession', () => {
        it('should return null if any stored field is missing', async () => {
            const SecureStore = await import('expo-secure-store');
            vi.mocked(SecureStore.getItemAsync).mockImplementation((key: string) => {
                if (key === 'auth_access_token') {
                    return Promise.resolve(null);
                }

                return Promise.resolve('value');
            });

            const result = await getStoredSession();
            expect(result).toBeNull();
        });

        it('should return full session if all fields exist', async () => {
            const SecureStore = await import('expo-secure-store');
            vi.mocked(SecureStore.getItemAsync).mockResolvedValue('stored-value');

            const result = await getStoredSession();
            expect(result).not.toBeNull();
            expect(result?.accessToken).toBe('stored-value');
        });
    });

    describe('hasStoredCredentials', () => {
        it('should return true when all keys have values', async () => {
            const SecureStore = await import('expo-secure-store');
            vi.mocked(SecureStore.getItemAsync).mockResolvedValue('some-value');

            const result = await hasStoredCredentials();
            expect(result).toBe(true);
        });

        it('should return false when any key is missing', async () => {
            const SecureStore = await import('expo-secure-store');
            vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('value').mockResolvedValueOnce(null);

            const result = await hasStoredCredentials();
            expect(result).toBe(false);
        });
    });

    describe('clearSession', () => {
        it('should delete all stored keys', async () => {
            const SecureStore = await import('expo-secure-store');
            vi.mocked(SecureStore.deleteItemAsync).mockResolvedValue();

            await clearSession();

            expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(4);
            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_access_token');
            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_refresh_token');
        });
    });

    describe('isTokenExpired', () => {
        it('should return true when no expiry is stored', async () => {
            const SecureStore = await import('expo-secure-store');
            vi.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

            const result = await isTokenExpired();
            expect(result).toBe(true);
        });

        it('should return true when token is past expiry', async () => {
            const SecureStore = await import('expo-secure-store');
            vi.mocked(SecureStore.getItemAsync).mockResolvedValue(new Date(Date.now() - 1000).toISOString());

            const result = await isTokenExpired();
            expect(result).toBe(true);
        });

        it('should return false when token is still valid', async () => {
            const SecureStore = await import('expo-secure-store');
            vi.mocked(SecureStore.getItemAsync).mockResolvedValue(new Date(Date.now() + 3600 * 1000).toISOString());

            const result = await isTokenExpired();
            expect(result).toBe(false);
        });
    });

    describe('getTokenTTL', () => {
        it('should return 0 when no expiry is stored', async () => {
            const SecureStore = await import('expo-secure-store');
            vi.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

            const result = await getTokenTTL();
            expect(result).toBe(0);
        });

        it('should return remaining time in milliseconds', async () => {
            const SecureStore = await import('expo-secure-store');
            const futureDate = new Date(Date.now() + 5000);
            vi.mocked(SecureStore.getItemAsync).mockResolvedValue(futureDate.toISOString());

            const result = await getTokenTTL();
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThanOrEqual(5000);
        });

        it('should return 0 for expired tokens', async () => {
            const SecureStore = await import('expo-secure-store');
            vi.mocked(SecureStore.getItemAsync).mockResolvedValue(new Date(Date.now() - 1000).toISOString());

            const result = await getTokenTTL();
            expect(result).toBe(0);
        });
    });
});
