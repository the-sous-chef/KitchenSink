import * as SecureStore from 'expo-secure-store';

interface TokenCache {
    getToken: (key: string) => Promise<string | null>;
    saveToken: (key: string, value: string) => Promise<void>;
    clearToken?: (key: string) => Promise<void>;
}

export const tokenCache: TokenCache = {
    async getToken(key: string): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(key);
        } catch {
            await SecureStore.deleteItemAsync(key).catch(() => undefined);

            return null;
        }
    },
    async saveToken(key: string, value: string): Promise<void> {
        await SecureStore.setItemAsync(key, value, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
    },
    async clearToken(key: string): Promise<void> {
        await SecureStore.deleteItemAsync(key);
    },
};
