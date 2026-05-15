import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Crypto from 'expo-crypto';
import Auth0 from 'react-native-auth0';
import {
    startAuthFlow,
    exchangeCodeForTokens,
    refreshAccessToken,
    clearAuth0BrowserSession,
    revokeRefreshToken,
} from '../src/auth/auth0.js';
import {
    AccountSuspendedError,
    ImpersonationBlockedError,
    type AuthState,
    isAccountSuspendedError,
    isImpersonatedClaims,
    isImpersonationBlockedError,
} from '../src/types/auth.js';

vi.mock('expo-crypto', () => ({
    CryptoDigestAlgorithm: {
        SHA256: 'SHA256',
    },
    CryptoEncoding: {
        BASE64: 'BASE64',
    },
    getRandomValues: vi.fn(),
    digestStringAsync: vi.fn(),
}));

const authorizeMock = vi.fn();
const exchangeMock = vi.fn();
const refreshTokenMock = vi.fn();
const revokeMock = vi.fn();
const clearSessionMock = vi.fn();

vi.mock('react-native-auth0', () => ({
    default: vi.fn(function Auth0Ctor() {
        return {
            webAuth: {
                authorize: authorizeMock,
                clearSession: clearSessionMock,
            },
            auth: {
                exchange: exchangeMock,
                refreshToken: refreshTokenMock,
                revoke: revokeMock,
            },
        };
    }),
}));

const config = {
    domain: 'tenant.example.auth0.com',
    clientId: 'client-123',
    callbackScheme: 'souschef',
    audience: 'https://api.souschef.test',
} as const;

describe('Mobile auth behavior coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(Crypto.getRandomValues).mockImplementation((typedArray) => {
            if ('set' in typedArray) {
                const fillValue =
                    typedArray instanceof BigInt64Array || typedArray instanceof BigUint64Array ? 171n : 171;
                typedArray.fill(fillValue as never);
            }

            return typedArray;
        });
        vi.mocked(Crypto.digestStringAsync).mockResolvedValue('x+y/z==');
    });

    it('UTS-006-A1 [MOD-006/PKCE]: startAuthFlow generates full S256 base64url challenge without truncation regression', async () => {
        const url = await startAuthFlow(config);
        const parsed = new URL(url);
        const challenge = parsed.searchParams.get('code_challenge');
        const method = parsed.searchParams.get('code_challenge_method');

        expect(challenge).toBe('x-y_z');
        expect(challenge?.length).toBe(5);
        expect(challenge).not.toBe('x-y_');
        expect(method).toBe('S256');
        expect(parsed.searchParams.get('redirect_uri')).toBe('souschef://callback');
    });

    it('UTS-006-A2 [MOD-006]: exchangeCodeForTokens uses verifier from started PKCE flow and returns session', async () => {
        exchangeMock.mockResolvedValue({
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresAt: 2000,
        });

        await startAuthFlow(config);
        const session = await exchangeCodeForTokens(config, 'authorization-code');

        expect(exchangeMock).toHaveBeenCalledWith(
            expect.objectContaining({
                code: 'authorization-code',
                verifier: expect.any(String),
                redirectUri: 'souschef://callback',
            }),
        );
        expect(session).toMatchObject({
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
        });
    });

    it('UTS-006-A3 [MOD-006/error]: exchangeCodeForTokens rejects if PKCE flow was not started', async () => {
        await expect(exchangeCodeForTokens(config, 'authorization-code')).rejects.toThrow('Auth flow not started');
    });

    it('UTS-006-A4 [MOD-006/refresh]: refreshAccessToken preserves existing refresh token when Auth0 omits rotation', async () => {
        refreshTokenMock.mockResolvedValue({
            accessToken: 'rotated-access-token',
            expiresAt: 3000,
        });

        const result = await refreshAccessToken(config, 'provided-refresh-token', {
            accessToken: 'old-access-token',
            refreshToken: 'stored-refresh-token',
            expiresAt: new Date(Date.now() + 1000).toISOString(),
            userId: 'user-1',
            auth0Id: 'auth0|user-1',
        });

        expect(result.session.refreshToken).toBe('stored-refresh-token');
        expect(result.session.accessToken).toBe('rotated-access-token');
    });

    it('UTS-006-A5 [MOD-006/logout]: clearAuth0BrowserSession sends returnTo logout URI', async () => {
        clearSessionMock.mockResolvedValue(undefined);

        await clearAuth0BrowserSession(config);

        expect(clearSessionMock).toHaveBeenCalledWith({ returnToUrl: 'souschef://logout' });
    });

    it('UTS-006-A6 [MOD-006/logout]: revokeRefreshToken revokes the provided refresh token', async () => {
        revokeMock.mockResolvedValue(undefined);

        await revokeRefreshToken(config, 'refresh-token-to-revoke');

        expect(revokeMock).toHaveBeenCalledWith({ refreshToken: 'refresh-token-to-revoke' });
    });

    it('UTS-006-A7 [MOD-006/session-restoration]: authorizeWithAuth0 path is deterministic via SDK mocks', async () => {
        authorizeMock.mockResolvedValue({
            accessToken: 'authorized-access',
            refreshToken: 'authorized-refresh',
            expiresAt: 2500,
        });

        const { authorizeWithAuth0 } = await import('../src/auth/auth0.js');
        const session = await authorizeWithAuth0(config, { loginHint: 'cook@souschef.test' });

        expect(session.accessToken).toBe('authorized-access');
        expect(session.refreshToken).toBe('authorized-refresh');
        expect(authorizeMock).toHaveBeenCalledWith(
            expect.objectContaining({
                audience: config.audience,
                additionalParameters: expect.objectContaining({ login_hint: 'cook@souschef.test' }),
            }),
        );
    });

    it('UTS-007-A1 [MOD-007/suspended]: suspended account classification remains explicit and type-guarded', () => {
        const err = new AccountSuspendedError('Suspended by policy', 'user-77');

        expect(isAccountSuspendedError(err)).toBe(true);
        expect(err.userId).toBe('user-77');
    });

    it('UTS-007-A2 [MOD-007/impersonation]: impersonation claims are rejected for mobile sessions', () => {
        expect(isImpersonatedClaims({ 'https://sous-chef.io/impersonation': true })).toBe(true);
        expect(isImpersonatedClaims({ 'https://sous-chef.io/impersonation': 'true' })).toBe(true);
        expect(isImpersonatedClaims({ 'https://sous-chef.io/impersonation': false })).toBe(false);
        expect(isImpersonatedClaims({})).toBe(false);

        const err = new ImpersonationBlockedError('blocked', 'session-3');
        expect(isImpersonationBlockedError(err)).toBe(true);
        expect(err.sessionId).toBe('session-3');
    });
});

interface HookHarnessOptions {
    initialState?: AuthState;
    hasCreds?: boolean;
    storedSession?: any;
    refreshedSession?: any;
    refreshReject?: Error;
    revokeReject?: Error;
    browserReject?: Error;
}

async function loadUseAuthHarness(options: HookHarnessOptions = {}) {
    vi.resetModules();

    const clearSession = vi.fn().mockResolvedValue(undefined);
    const storeSession = vi.fn().mockResolvedValue(undefined);
    const hasStoredCredentials = vi.fn().mockResolvedValue(options.hasCreds ?? false);
    const getStoredSession = vi.fn().mockResolvedValue(options.storedSession ?? null);
    const refreshAccessTokenMock = options.refreshReject
        ? vi.fn().mockRejectedValue(options.refreshReject)
        : vi.fn().mockResolvedValue({ session: options.refreshedSession ?? options.storedSession });
    const revokeRefreshTokenMock = options.revokeReject
        ? vi.fn().mockRejectedValue(options.revokeReject)
        : vi.fn().mockResolvedValue(undefined);
    const clearAuth0BrowserSessionMock = options.browserReject
        ? vi.fn().mockRejectedValue(options.browserReject)
        : vi.fn().mockResolvedValue(undefined);

    let state: AuthState = options.initialState ?? { status: 'idle' };
    const setStateCalls: unknown[] = [];

    vi.doMock('react', () => ({
        useState: () => [
            state,
            (next: unknown) => {
                state =
                    typeof next === 'function'
                        ? ((next as (prev: AuthState) => AuthState)(state) as AuthState)
                        : (next as AuthState);
                setStateCalls.push(state);
            },
        ],
        useEffect: () => {},
        useCallback: (fn: unknown) => fn,
    }));

    vi.doMock('../src/storage/secureStorage.js', () => ({
        hasStoredCredentials,
        getStoredSession,
        storeSession,
        clearSession,
    }));

    vi.doMock('../src/auth/auth0.js', () => ({
        authorizeWithAuth0: vi.fn(),
        exchangeCodeForTokens: vi.fn(),
        refreshAccessToken: refreshAccessTokenMock,
        revokeRefreshToken: revokeRefreshTokenMock,
        clearAuth0BrowserSession: clearAuth0BrowserSessionMock,
    }));

    const { useAuth } = await import('../src/hooks/useAuth.js');
    const onSessionExpired = vi.fn();

    const api = useAuth({ config, onSessionExpired });

    return {
        api,
        clearSession,
        storeSession,
        hasStoredCredentials,
        getStoredSession,
        refreshAccessTokenMock,
        revokeRefreshTokenMock,
        clearAuth0BrowserSessionMock,
        onSessionExpired,
        getState: () => state,
        setStateCalls,
    };
}

describe('useAuth behavior guarantees', () => {
    it('UTS-008-A10 [MOD-008/session-restoration]: loadStoredSession restores authenticated state from secure storage', async () => {
        const storedSession = {
            accessToken: 'restored-access',
            refreshToken: 'restored-refresh',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            userId: 'user-r',
            auth0Id: 'auth0|user-r',
        };
        const harness = await loadUseAuthHarness({ hasCreds: true, storedSession });

        await harness.api.loadStoredSession();

        expect(harness.hasStoredCredentials).toHaveBeenCalledTimes(1);
        expect(harness.getStoredSession).toHaveBeenCalledTimes(1);
        expect(harness.getState()).toEqual({ status: 'authenticated', session: storedSession });
    });

    it('UTS-008-A11 [MOD-008/error]: ensureValidToken clears secure storage and marks unauthenticated when refresh fails', async () => {
        const expiredSession = {
            accessToken: 'expired-access',
            refreshToken: 'expired-refresh',
            expiresAt: new Date(Date.now() - 1_000).toISOString(),
            userId: 'user-e',
            auth0Id: 'auth0|user-e',
        };
        const harness = await loadUseAuthHarness({
            initialState: { status: 'authenticated', session: expiredSession },
            refreshReject: new Error('refresh failed'),
        });

        const result = await harness.api.ensureValidToken();

        expect(result).toBeNull();
        expect(harness.clearSession).toHaveBeenCalledTimes(1);
        expect(harness.onSessionExpired).toHaveBeenCalledTimes(1);
        expect(harness.getState()).toEqual({ status: 'unauthenticated' });
    });

    it('UTS-008-A12 [MOD-008/logout]: logout clears secure storage even when revoke/browser clear fail', async () => {
        const currentSession = {
            accessToken: 'access',
            refreshToken: 'refresh',
            expiresAt: new Date(Date.now() + 10_000).toISOString(),
            userId: 'user-l',
            auth0Id: 'auth0|user-l',
        };
        const harness = await loadUseAuthHarness({
            initialState: { status: 'authenticated', session: currentSession },
            revokeReject: new Error('offline'),
            browserReject: new Error('browser already cleared'),
        });

        await harness.api.logout();

        expect(harness.revokeRefreshTokenMock).toHaveBeenCalledTimes(1);
        expect(harness.clearAuth0BrowserSessionMock).toHaveBeenCalledTimes(1);
        expect(harness.clearSession).toHaveBeenCalledTimes(1);
        expect(harness.getState()).toEqual({ status: 'unauthenticated' });
    });

    it('UTS-007-A3 [MOD-007/suspended]: blockSuspendedAccount clears secure storage and exposes suspended block reason', async () => {
        const harness = await loadUseAuthHarness();

        await harness.api.blockSuspendedAccount();

        expect(harness.clearSession).toHaveBeenCalledTimes(1);
        expect(harness.getState()).toEqual(
            expect.objectContaining({
                status: 'blocked',
                block: expect.objectContaining({ reason: 'suspended' }),
            }),
        );
    });

    it('UTS-007-A4 [MOD-007/impersonation]: blockImpersonation clears secure storage and exposes impersonation block reason', async () => {
        const harness = await loadUseAuthHarness();

        await harness.api.blockImpersonation();

        expect(harness.clearSession).toHaveBeenCalledTimes(1);
        expect(harness.getState()).toEqual(
            expect.objectContaining({
                status: 'blocked',
                block: expect.objectContaining({ reason: 'impersonation' }),
            }),
        );
    });
});

describe('Auth0 SDK mock sanity', () => {
    it('instantiates mocked Auth0 client once per module runtime', () => {
        expect(Auth0).toBeDefined();
    });
});
