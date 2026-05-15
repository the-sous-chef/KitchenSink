import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
    getSession: vi.fn(),
    getAccessToken: vi.fn(),
}));

vi.mock('@/lib/auth0', () => ({
    auth0: {
        getSession: mocks.getSession,
        getAccessToken: mocks.getAccessToken,
    },
}));

function makeRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/session/refresh', { method: 'POST' });
}

describe('POST /api/session/refresh', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('UTS-008-A1 [MOD-008]: returns status ok with expiresAt when session is valid and token refreshes', async () => {
        mocks.getSession.mockResolvedValue({ user: { sub: 'auth0|1' }, tokenSet: {} });
        mocks.getAccessToken.mockResolvedValue({ token: 'new_token', expiresAt: 9999 });

        const { POST } = await import('@/app/api/session/refresh/route');
        const response = await POST(makeRequest());
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.status).toBe('ok');
        expect(body.expiresAt).toBe(9999);
    });

    it('UTS-008-A2 [MOD-008/no-session]: returns 401 with status no_session when no session exists', async () => {
        mocks.getSession.mockResolvedValue(null);

        const { POST } = await import('@/app/api/session/refresh/route');
        const response = await POST(makeRequest());
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.status).toBe('no_session');
        expect(mocks.getAccessToken).not.toHaveBeenCalled();
    });

    it('UTS-008-A2 [MOD-008/expired]: returns 401 with status expired when token refresh fails', async () => {
        mocks.getSession.mockResolvedValue({ user: { sub: 'auth0|1' }, tokenSet: {} });
        mocks.getAccessToken.mockRejectedValue(new Error('token expired'));

        const { POST } = await import('@/app/api/session/refresh/route');
        const response = await POST(makeRequest());
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.status).toBe('expired');
    });

    it('UTS-008-A1 [MOD-008/no-leak]: does not leak token value into response body', async () => {
        mocks.getSession.mockResolvedValue({ user: { sub: 'auth0|1' }, tokenSet: {} });
        mocks.getAccessToken.mockResolvedValue({ token: 'secret_access_token', expiresAt: 9999 });

        const { POST } = await import('@/app/api/session/refresh/route');
        const response = await POST(makeRequest());
        const body = await response.json();

        expect(JSON.stringify(body)).not.toContain('secret_access_token');
    });
});
