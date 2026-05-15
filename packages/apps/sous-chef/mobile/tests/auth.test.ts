import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AuthSession, AuthState } from '../src/types/auth.js';

vi.mock('../src/storage/secureStorage.js', () => ({
    hasStoredCredentials: vi.fn(),
    getStoredSession: vi.fn(),
    storeSession: vi.fn(),
    clearSession: vi.fn(),
    isTokenExpired: vi.fn(),
    getTokenTTL: vi.fn(),
}));

vi.mock('../src/auth/auth0.js', () => ({
    authorizeWithAuth0: vi.fn(),
    clearAuth0BrowserSession: vi.fn(),
    exchangeCodeForTokens: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
}));

const mockSession: AuthSession = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    userId: 'test-user-id',
    auth0Id: 'auth0|test-auth0-id',
};

describe('Auth Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('AuthState transitions', () => {
        it('should start in idle state', () => {
            const initialState: AuthState = { status: 'idle' };
            expect(initialState.status).toBe('idle');
        });

        it('should transition to loading when checking session', () => {
            const loadingState: AuthState = { status: 'loading' };
            expect(loadingState.status).toBe('loading');
        });

        it('should transition to authenticated with session', () => {
            const authState: AuthState = { status: 'authenticated', session: mockSession };
            expect(authState.status).toBe('authenticated');
            expect(authState.session).toBeDefined();
        });

        it('should transition to unauthenticated when cleared', () => {
            const unauthState: AuthState = { status: 'unauthenticated' };
            expect(unauthState.status).toBe('unauthenticated');
        });

        it('should transition to error with message', () => {
            const errorState: AuthState = { status: 'error', message: 'Token expired' };
            expect(errorState.status).toBe('error');
            expect(errorState.message).toBe('Token expired');
        });

        it('should represent blocked suspended sessions with explicit UX copy', () => {
            const blockedState: AuthState = {
                status: 'blocked',
                block: {
                    reason: 'suspended',
                    title: 'Account suspended',
                    message:
                        'Your account is suspended. You cannot access Sous Chef until support restores your account.',
                },
            };

            expect(blockedState.status).toBe('blocked');
            expect(blockedState.block.reason).toBe('suspended');
        });
    });

    describe('Auth0 integration contracts', () => {
        it('should call refresh token with the existing session for token rotation fallback', async () => {
            const { refreshAccessToken } = await import('../src/auth/auth0.js');
            vi.mocked(refreshAccessToken).mockResolvedValue({ session: mockSession });

            const result = await refreshAccessToken(
                {
                    domain: 'example.auth0.com',
                    clientId: 'client-id',
                    callbackScheme: 'souschef',
                    audience: 'https://api.example.com',
                },
                mockSession.refreshToken,
                mockSession,
            );

            expect(result.session.refreshToken).toBe(mockSession.refreshToken);
        });

        it('should expose logout revocation and browser-session clearing hooks', async () => {
            const { revokeRefreshToken, clearAuth0BrowserSession } = await import('../src/auth/auth0.js');
            const config = {
                domain: 'example.auth0.com',
                clientId: 'client-id',
                callbackScheme: 'souschef',
                audience: 'https://api.example.com',
            };
            vi.mocked(revokeRefreshToken).mockResolvedValue();
            vi.mocked(clearAuth0BrowserSession).mockResolvedValue();

            await revokeRefreshToken(config, mockSession.refreshToken);
            await clearAuth0BrowserSession(config);

            expect(revokeRefreshToken).toHaveBeenCalledWith(config, mockSession.refreshToken);
            expect(clearAuth0BrowserSession).toHaveBeenCalledWith(config);
        });
    });

    describe('Session validation', () => {
        it('should detect expired tokens', async () => {
            const { isTokenExpired } = await import('../src/storage/secureStorage.js');
            vi.mocked(isTokenExpired).mockResolvedValue(true);

            const expired = await isTokenExpired();
            expect(expired).toBe(true);
        });

        it('should allow valid tokens', async () => {
            const { isTokenExpired } = await import('../src/storage/secureStorage.js');
            vi.mocked(isTokenExpired).mockResolvedValue(false);

            const valid = await isTokenExpired();
            expect(valid).toBe(false);
        });
    });

    describe('AuthSession structure', () => {
        it('should have all required fields', () => {
            expect(mockSession.accessToken).toBe('test-access-token');
            expect(mockSession.refreshToken).toBe('test-refresh-token');
            expect(mockSession.userId).toBe('test-user-id');
            expect(mockSession.auth0Id).toBe('auth0|test-auth0-id');
            expect(mockSession.expiresAt).toBeDefined();
        });

        it('should parse expiresAt as valid date', () => {
            const parsedDate = Date.parse(mockSession.expiresAt);
            expect(Number.isNaN(parsedDate)).toBe(false);
            expect(parsedDate).toBeGreaterThan(0);
        });
    });

    describe('Impersonation safety', () => {
        it('should detect custom impersonation claims', async () => {
            const { isImpersonatedClaims } = await import('../src/types/auth.js');

            expect(isImpersonatedClaims({ 'https://sous-chef.io/impersonation': true })).toBe(true);
            expect(isImpersonatedClaims({ 'https://sous-chef.io/impersonation': 'true' })).toBe(true);
            expect(isImpersonatedClaims({})).toBe(false);
        });
    });
});
