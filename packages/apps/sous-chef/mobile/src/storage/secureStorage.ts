import * as SecureStore from 'expo-secure-store';
import type { AuthSession } from '../types/auth.js';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const EXPIRES_AT_KEY = 'auth_expires_at';
const SUB_KEY = 'auth_sub';
const SESSION_KEYS = [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, EXPIRES_AT_KEY, SUB_KEY] as const;

export const SECURE_STORAGE_SESSION_KEYS: readonly string[] = SESSION_KEYS;

export async function hasStoredCredentials(): Promise<boolean> {
    const results = await Promise.all(SESSION_KEYS.map((key) => SecureStore.getItemAsync(key)));

    return results.every((value) => value !== null);
}

function getSecureStoreOptions(): SecureStore.SecureStoreOptions {
    return {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    };
}

export async function storeSession(session: AuthSession): Promise<void> {
    const entries = [
        [ACCESS_TOKEN_KEY, session.accessToken],
        [REFRESH_TOKEN_KEY, session.refreshToken],
        [EXPIRES_AT_KEY, session.expiresAt],
        [SUB_KEY, session.sub],
    ] as const;
    const results = await Promise.allSettled(
        entries.map(([key, value]) => SecureStore.setItemAsync(key, value, getSecureStoreOptions())),
    );

    const failures = results.filter((r) => r.status === 'rejected');

    if (failures.length > 0) {
        throw new Error(`Failed to store session: ${failures.length} operations failed`);
    }
}

export async function getStoredSession(): Promise<AuthSession | null> {
    const results = await Promise.allSettled(SESSION_KEYS.map((key) => SecureStore.getItemAsync(key)));

    const values = results.map((r) => (r.status === 'fulfilled' ? r.value : null));

    if (values.some((v) => v === null)) {
        return null;
    }

    const [accessToken, refreshToken, expiresAt, sub] = values as [string, string, string, string];

    return { accessToken, refreshToken, expiresAt, sub };
}

export async function clearSession(): Promise<void> {
    await Promise.allSettled(SESSION_KEYS.map((key) => SecureStore.deleteItemAsync(key)));
}

export async function isTokenExpired(): Promise<boolean> {
    const expiresAt = await SecureStore.getItemAsync(EXPIRES_AT_KEY);

    if (!expiresAt) {
        return true;
    }

    return Date.now() > Date.parse(expiresAt);
}

export async function getTokenTTL(): Promise<number> {
    const expiresAt = await SecureStore.getItemAsync(EXPIRES_AT_KEY);

    if (!expiresAt) {
        return 0;
    }

    return Math.max(0, Date.parse(expiresAt) - Date.now());
}
