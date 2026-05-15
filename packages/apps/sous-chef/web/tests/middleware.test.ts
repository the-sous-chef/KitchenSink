import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { safeReturnTo } from '@/middleware';

const mocks = vi.hoisted(() => ({
    getSession: vi.fn(),
    middleware: vi.fn(),
    revokeRefreshToken: vi.fn(),
}));

vi.mock('@/lib/auth0', () => ({
    auth0: {
        getSession: mocks.getSession,
        middleware: mocks.middleware,
    },
    revokeRefreshToken: mocks.revokeRefreshToken,
}));

function makeRequest(path: string, search = ''): NextRequest {
    return new NextRequest(`http://localhost:3000${path}${search}`);
}

function makeAuthResponse(status = 200) {
    return new Response(null, { status });
}

describe('middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.middleware.mockResolvedValue(makeAuthResponse());
    });

    describe('protected route redirect', () => {
        it('UTS-002-A2 [MOD-002]: redirects unauthenticated user to login with safe returnTo', async () => {
            mocks.getSession.mockResolvedValue(null);
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/profile');

            const response = await middleware(req);

            expect(response.status).toBe(307);
            const location = response.headers.get('location') ?? '';
            expect(location).toContain('/api/auth/login');
            expect(location).toContain('returnTo=%2Fprofile');
        });

        it('UTS-002-A2 [MOD-002/returnTo]: preserves query string in returnTo', async () => {
            mocks.getSession.mockResolvedValue(null);
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/settings', '?tab=security');

            const response = await middleware(req);

            const location = response.headers.get('location') ?? '';
            expect(decodeURIComponent(location)).toContain('returnTo=/settings?tab=security');
        });

        it('UTS-002-A2 [MOD-002/account]: redirects unauthenticated user on /account path', async () => {
            mocks.getSession.mockResolvedValue(null);
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/account');

            const response = await middleware(req);

            expect(response.status).toBe(307);
            const location = response.headers.get('location') ?? '';
            expect(location).toContain('/api/auth/login');
            expect(location).toContain('returnTo=%2Faccount');
        });

        it('UTS-002-A2 [MOD-002/settings]: redirects unauthenticated user on /settings path', async () => {
            mocks.getSession.mockResolvedValue(null);
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/settings');

            const response = await middleware(req);

            expect(response.status).toBe(307);
            const location = response.headers.get('location') ?? '';
            expect(location).toContain('/api/auth/login');
            expect(location).toContain('returnTo=%2Fsettings');
        });

        it('UTS-002-A3 [MOD-002/open-redirect]: rejects open-redirect returnTo with absolute URL', async () => {
            expect(safeReturnTo('//evil.com', '')).toBe('/');
            expect(safeReturnTo('//evil.com', '/steal')).toBe('/');
            expect(safeReturnTo('http://evil.com', '')).toBe('/');
        });

        it('UTS-002-A3 [MOD-002/open-redirect-https]: rejects open-redirect returnTo with https absolute URL', async () => {
            expect(safeReturnTo('https://evil.com', '')).toBe('/');
            expect(safeReturnTo('https://evil.com/path', '')).toBe('/');
        });

        it('UTS-002-A3 [MOD-002/javascript-protocol]: rejects open-redirect returnTo with javascript: protocol', async () => {
            expect(safeReturnTo('javascript:alert(1)', '')).toBe('/');
        });

        it('UTS-002-A3 [MOD-002/no-slash]: rejects returnTo that does not start with slash', async () => {
            expect(safeReturnTo('evil.com', '')).toBe('/');
            expect(safeReturnTo('relative/path', '')).toBe('/');
        });

        it('UTS-002-A2 [MOD-002/safe-returnTo]: allows safe relative returnTo paths', async () => {
            expect(safeReturnTo('/profile', '')).toBe('/profile');
            expect(safeReturnTo('/settings', '?tab=security')).toBe('/settings?tab=security');
            expect(safeReturnTo('/', '')).toBe('/');
        });

        it('UTS-002-A4 [MOD-002]: passes through authenticated user on protected route', async () => {
            mocks.getSession.mockResolvedValue({ user: { sub: 'auth0|123' }, tokenSet: {} });
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/profile');

            const response = await middleware(req);

            expect(response.status).toBe(200);
        });

        it('UTS-002-A1 [MOD-002]: passes through public routes without session check', async () => {
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/');

            await middleware(req);

            expect(mocks.getSession).not.toHaveBeenCalled();
        });

        it('UTS-002-A2 [MOD-002/307]: uses 307 temporary redirect to preserve request method on login redirect', async () => {
            mocks.getSession.mockResolvedValue(null);
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/profile');

            const response = await middleware(req);

            expect(response.status).toBe(307);
        });
    });

    describe('logout path', () => {
        it('UTS-002-A5 [MOD-002/logout]: revokes refresh token then delegates to auth0 middleware', async () => {
            const fakeSession = { tokenSet: { refreshToken: 'rt_abc' } };
            mocks.getSession.mockResolvedValue(fakeSession);
            mocks.revokeRefreshToken.mockResolvedValue(undefined);
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/api/auth/logout');

            await middleware(req);

            expect(mocks.revokeRefreshToken).toHaveBeenCalledWith('rt_abc');
            expect(mocks.middleware).toHaveBeenCalledWith(req);
        });

        it('UTS-002-A5 [MOD-002/logout-error]: completes logout even when revocation throws', async () => {
            mocks.getSession.mockResolvedValue({ tokenSet: { refreshToken: 'rt_xyz' } });
            mocks.revokeRefreshToken.mockRejectedValue(new Error('network error'));
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/api/auth/logout');

            const response = await middleware(req);

            expect(mocks.middleware).toHaveBeenCalledWith(req);
            expect(response).toBeDefined();
            expect(response.status).toBeLessThan(500);
        });

        it('UTS-002-A5 [MOD-002/logout-no-session]: completes logout when no session exists', async () => {
            mocks.getSession.mockResolvedValue(null);
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/api/auth/logout');

            const response = await middleware(req);

            expect(mocks.middleware).toHaveBeenCalledWith(req);
            expect(response).toBeDefined();
        });

        it('UTS-002-A5 [MOD-002/logout-no-token]: calls revokeRefreshToken with undefined when session has no refreshToken', async () => {
            mocks.getSession.mockResolvedValue({ tokenSet: {} });
            mocks.revokeRefreshToken.mockResolvedValue(undefined);
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/api/auth/logout');

            await middleware(req);

            expect(mocks.revokeRefreshToken).toHaveBeenCalledWith(undefined);
            expect(mocks.middleware).toHaveBeenCalledWith(req);
        });

        it('UTS-002-A5 [MOD-002/logout-revoke-fail]: returns auth0 middleware response after revocation failure', async () => {
            const expectedResponse = makeAuthResponse(200);
            mocks.middleware.mockResolvedValue(expectedResponse);
            mocks.getSession.mockResolvedValue({ tokenSet: { refreshToken: 'rt_fail' } });
            mocks.revokeRefreshToken.mockRejectedValue(new Error('revocation failed'));
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/api/auth/logout');

            const response = await middleware(req);

            expect(response.status).toBe(200);
        });
    });
});
