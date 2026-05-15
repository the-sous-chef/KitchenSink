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
        it('redirects unauthenticated user to login with safe returnTo', async () => {
            mocks.getSession.mockResolvedValue(null);
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/profile');

            const response = await middleware(req);

            expect(response.status).toBe(307);
            const location = response.headers.get('location') ?? '';
            expect(location).toContain('/api/auth/login');
            expect(location).toContain('returnTo=%2Fprofile');
        });

        it('preserves query string in returnTo', async () => {
            mocks.getSession.mockResolvedValue(null);
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/settings', '?tab=security');

            const response = await middleware(req);

            const location = response.headers.get('location') ?? '';
            expect(decodeURIComponent(location)).toContain('returnTo=/settings?tab=security');
        });

        it('rejects open-redirect returnTo with absolute URL', async () => {
            expect(safeReturnTo('//evil.com', '')).toBe('/');
            expect(safeReturnTo('//evil.com', '/steal')).toBe('/');
            expect(safeReturnTo('http://evil.com', '')).toBe('/');
        });

        it('passes through authenticated user on protected route', async () => {
            mocks.getSession.mockResolvedValue({ user: { sub: 'auth0|123' }, tokenSet: {} });
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/profile');

            const response = await middleware(req);

            expect(response.status).toBe(200);
        });

        it('passes through public routes without session check', async () => {
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/');

            await middleware(req);

            expect(mocks.getSession).not.toHaveBeenCalled();
        });
    });

    describe('logout path', () => {
        it('revokes refresh token then delegates to auth0 middleware', async () => {
            const fakeSession = { tokenSet: { refreshToken: 'rt_abc' } };
            mocks.getSession.mockResolvedValue(fakeSession);
            mocks.revokeRefreshToken.mockResolvedValue(undefined);
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/api/auth/logout');

            await middleware(req);

            expect(mocks.revokeRefreshToken).toHaveBeenCalledWith('rt_abc');
            expect(mocks.middleware).toHaveBeenCalledWith(req);
        });

        it('completes logout even when revocation throws', async () => {
            mocks.getSession.mockResolvedValue({ tokenSet: { refreshToken: 'rt_xyz' } });
            mocks.revokeRefreshToken.mockRejectedValue(new Error('network error'));
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/api/auth/logout');

            const response = await middleware(req);

            expect(mocks.middleware).toHaveBeenCalledWith(req);
            expect(response).toBeDefined();
        });

        it('completes logout when no session exists', async () => {
            mocks.getSession.mockResolvedValue(null);
            const { middleware } = await import('@/middleware');
            const req = makeRequest('/api/auth/logout');

            const response = await middleware(req);

            expect(mocks.middleware).toHaveBeenCalledWith(req);
            expect(response).toBeDefined();
        });
    });
});
