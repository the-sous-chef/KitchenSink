import { Auth0Client } from '@auth0/nextjs-auth0/server';

const appBaseUrl = process.env.APP_BASE_URL ?? process.env.AUTH0_BASE_URL ?? 'http://localhost:3000';
const auth0Domain = process.env.AUTH0_DOMAIN ?? process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//u, '');
const identityAudience = process.env.AUTH0_AUDIENCE ?? process.env.NEXT_PUBLIC_API_AUDIENCE;
const clientId = process.env.AUTH0_CLIENT_ID;
const clientSecret = process.env.AUTH0_CLIENT_SECRET;

export const auth0 = new Auth0Client({
    domain: auth0Domain,
    clientId,
    clientSecret,
    appBaseUrl,
    secret: process.env.AUTH0_SECRET,
    authorizationParameters: {
        audience: identityAudience,
        scope: 'openid profile email offline_access',
    },
    enableAccessTokenEndpoint: false,
    session: {
        rolling: true,
        absoluteDuration: 60 * 60 * 24 * 30,
        inactivityDuration: 60 * 60 * 24,
        cookie: {
            name: 'appSession',
            sameSite: 'lax',
            secure: appBaseUrl.startsWith('https://') || process.env.NODE_ENV === 'production',
        },
    },
    routes: {
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        callback: '/api/auth/callback',
        backChannelLogout: '/api/auth/backchannel-logout',
    },
});

export async function revokeRefreshToken(refreshToken?: string): Promise<void> {
    if (!refreshToken || !auth0Domain || !clientId || !clientSecret) {
        return;
    }

    const response = await fetch(`https://${auth0Domain}/oauth/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            token: refreshToken,
        }),
    });

    if (!response.ok) {
        console.warn('Auth0 refresh token revocation failed', response.status);
    }
}
