import { useState, useEffect, useCallback } from 'react';
import type { AuthSession } from '../types/auth.js';
import type { Auth0AuthorizeOptions, Auth0Config, AuthBlockMessage, AuthState } from '../types/auth.js';
import { hasStoredCredentials, getStoredSession, storeSession, clearSession } from '../storage/secureStorage.js';
import {
    authorizeWithAuth0,
    clearAuth0BrowserSession,
    exchangeCodeForTokens,
    refreshAccessToken,
    revokeRefreshToken,
} from '../auth/auth0.js';

const SILENT_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export interface UseAuthOptions {
    config: Auth0Config;
    onSessionExpired?: () => void;
}

const suspendedBlock: AuthBlockMessage = {
    reason: 'suspended',
    title: 'Account suspended',
    message: 'Your account is suspended. You cannot access Sous Chef until support restores your account.',
};

const impersonationBlock: AuthBlockMessage = {
    reason: 'impersonation',
    title: 'Impersonation unavailable on mobile',
    message: 'Administrator impersonation sessions are blocked in the mobile app for your safety.',
};

export function useAuth(options: UseAuthOptions) {
    const { config, onSessionExpired } = options;

    const [authState, setAuthState] = useState<AuthState>({ status: 'idle' });

    const attemptSilentRefresh = useCallback(
        async (session: AuthSession) => {
            try {
                const result = await refreshAccessToken(config, session.refreshToken, session);
                const newSession = result.session;
                await storeSession(newSession);
                setAuthState({ status: 'authenticated', session: newSession });

                return newSession;
            } catch {
                await clearSession();
                onSessionExpired?.();
                setAuthState({ status: 'unauthenticated' });

                return null;
            }
        },
        [config, onSessionExpired],
    );

    const loadStoredSession = useCallback(async () => {
        setAuthState({ status: 'loading' });

        const hasCreds = await hasStoredCredentials();

        if (!hasCreds) {
            setAuthState({ status: 'unauthenticated' });

            return;
        }

        const session = await getStoredSession();

        if (!session) {
            setAuthState({ status: 'unauthenticated' });

            return;
        }

        setAuthState({ status: 'authenticated', session });
    }, []);

    const login = useCallback(
        async (options: Auth0AuthorizeOptions = {}) => {
            setAuthState({ status: 'loading' });

            try {
                const session = await authorizeWithAuth0(config, options);
                await storeSession(session);
                setAuthState({ status: 'authenticated', session });

                return session;
            } catch (err) {
                setAuthState({ status: 'error', message: err instanceof Error ? err.message : 'Login failed' });

                return null;
            }
        },
        [config],
    );

    const loginWithCode = useCallback(
        async (code: string) => {
            setAuthState({ status: 'loading' });

            try {
                const session = await exchangeCodeForTokens(config, code);
                await storeSession(session);
                setAuthState({ status: 'authenticated', session });

                return session;
            } catch (err) {
                setAuthState({ status: 'error', message: err instanceof Error ? err.message : 'Login failed' });

                return null;
            }
        },
        [config],
    );

    const logout = useCallback(async () => {
        const session = authState.status === 'authenticated' ? authState.session : await getStoredSession();

        if (session?.refreshToken) {
            try {
                await revokeRefreshToken(config, session.refreshToken);
            } catch {
                // Continue local logout even if Auth0 revocation fails offline.
            }
        }

        try {
            await clearAuth0BrowserSession(config);
        } catch {
            // Continue local logout even if the browser session is already cleared.
        }

        await clearSession();
        setAuthState({ status: 'unauthenticated' });
    }, [authState, config]);

    const blockSuspendedAccount = useCallback(async () => {
        await clearSession();
        setAuthState({ status: 'blocked', block: suspendedBlock });
    }, []);

    const blockImpersonation = useCallback(async () => {
        await clearSession();
        setAuthState({ status: 'blocked', block: impersonationBlock });
    }, []);

    useEffect(() => {
        loadStoredSession();
    }, [loadStoredSession]);

    const ensureValidToken = useCallback(async () => {
        if (authState.status !== 'authenticated') {
            return null;
        }

        const session = authState.session;
        const expiresAtMs = Date.parse(session.expiresAt);
        const now = Date.now();

        if (now >= expiresAtMs) {
            return await attemptSilentRefresh(session);
        }

        const ttl = expiresAtMs - now;

        if (ttl < SILENT_REFRESH_THRESHOLD_MS) {
            return await attemptSilentRefresh(session);
        }

        return session;
    }, [authState, attemptSilentRefresh]);

    return {
        authState,
        login,
        loginWithCode,
        logout,
        loadStoredSession,
        ensureValidToken,
        blockSuspendedAccount,
        blockImpersonation,
    };
}
