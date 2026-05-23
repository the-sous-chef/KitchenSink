import Auth0 from 'react-native-auth0';
import * as Crypto from 'expo-crypto';
import type { AuthSession, TokenRefreshResult, Auth0Config, Auth0AuthorizeOptions } from '../types/auth.js';
import { isImpersonatedClaims } from '../types/auth.js';

let auth0Client: Auth0 | null = null;
let codeVerifier: string | null = null;

export function getAuth0Client(config: Auth0Config): Auth0 {
    if (auth0Client) {
        return auth0Client;
    }

    auth0Client = new Auth0({
        domain: config.domain,
        clientId: config.clientId,
    });

    return auth0Client;
}

export async function generateCodeVerifier(): Promise<string> {
    const bytes = await Crypto.getRandomBytesAsync(32);
    return Buffer.from(bytes).toString('base64url');
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        verifier,
        { encoding: Crypto.CryptoEncoding.BASE64 },
    );
    // Convert standard base64 to base64url
    return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function getRedirectUri(config: Auth0Config): string {
    return `${config.callbackScheme}://callback`;
}

function getAuthorizeScope(): string {
    return 'openid profile email offline_access';
}

function buildSession(result: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    idToken?: string;
    sub?: string;
}): AuthSession {
    // Extract sub from the SDK result directly; fall back to parsing idToken only for sub
    let sub = result.sub ?? '';

    if (!sub && result.idToken) {
        // Minimal parse: extract sub from idToken payload without trusting it for identity decisions
        try {
            const parts = result.idToken.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1] ?? '', 'base64').toString('utf-8')) as Record<string, unknown>;
                sub = typeof payload.sub === 'string' ? payload.sub : '';
            }
        } catch {
            // ignore parse errors — sub will remain empty
        }
    }

    if (!sub) {
        throw new Error('Missing sub in Auth0 response');
    }

    // Check for impersonation using idToken claims
    if (result.idToken) {
        try {
            const parts = result.idToken.split('.');
            if (parts.length === 3) {
                const claims = JSON.parse(Buffer.from(parts[1] ?? '', 'base64').toString('utf-8')) as Record<string, unknown>;
                if (isImpersonatedClaims(claims)) {
                    throw new Error('Administrator impersonation is blocked in the mobile app.');
                }
            }
        } catch (err) {
            if (err instanceof Error && err.message.includes('impersonation')) {
                throw err;
            }
            // ignore other parse errors
        }
    }

    if (!result.refreshToken) {
        throw new Error('Missing refresh token from Auth0 response');
    }

    return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: new Date((result.expiresAt ?? 0) * 1000).toISOString(),
        sub,
    };
}

export async function startAuthFlow(config: Auth0Config): Promise<string> {
    codeVerifier = await generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const authUrl = `https://${config.domain}/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(getRedirectUri(config))}&scope=${encodeURIComponent(getAuthorizeScope())}&audience=${encodeURIComponent(config.audience)}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    return authUrl;
}

export async function authorizeWithAuth0(
    config: Auth0Config,
    options: Auth0AuthorizeOptions = {},
): Promise<AuthSession> {
    const client = getAuth0Client(config);
    const credentials = await client.webAuth.authorize({
        audience: config.audience,
        scope: getAuthorizeScope(),
        redirectUrl: getRedirectUri(config),
        connection: options.connection,
        additionalParameters: {
            ...(options.loginHint ? { login_hint: options.loginHint } : {}),
            ...(options.screenHint ? { screen_hint: options.screenHint } : {}),
        },
    });

    return buildSession(credentials);
}

export async function exchangeCodeForTokens(config: Auth0Config, code: string): Promise<AuthSession> {
    if (!codeVerifier) {
        throw new Error('Auth flow not started');
    }

    const client = getAuth0Client(config);
    const result = await client.auth.exchange({
        code,
        redirectUri: getRedirectUri(config),
        audience: config.audience,
        scope: getAuthorizeScope(),
        verifier: codeVerifier,
    });

    codeVerifier = null;

    return buildSession(result);
}

export async function refreshAccessToken(
    config: Auth0Config,
    refreshToken: string,
    previousSession?: AuthSession,
): Promise<TokenRefreshResult> {
    const client = getAuth0Client(config);
    const result = await client.auth.refreshToken({
        refreshToken,
        audience: config.audience,
        scope: getAuthorizeScope(),
    });

    const session = buildSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken ?? previousSession?.refreshToken ?? refreshToken,
        expiresAt: result.expiresAt,
        idToken: result.idToken,
    });

    return {
        session,
    };
}

export async function revokeRefreshToken(config: Auth0Config, refreshToken: string): Promise<void> {
    const client = getAuth0Client(config);

    await client.auth.revoke({ refreshToken });
}

export async function clearAuth0BrowserSession(config: Auth0Config): Promise<void> {
    const client = getAuth0Client(config);

    await client.webAuth.clearSession({ returnToUrl: `${config.callbackScheme}://logout` });
}
