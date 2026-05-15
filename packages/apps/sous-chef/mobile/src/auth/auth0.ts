import Auth0 from 'react-native-auth0';
import * as Crypto from 'expo-crypto';
import type { AuthSession, TokenRefreshResult, Auth0Config, Auth0AuthorizeOptions } from '../types/auth.js';
import { isImpersonatedClaims } from '../types/auth.js';

const CLAIM_USER_ID = 'https://sous-chef.io/userId';

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

function generateCodeVerifier(): string {
    const randomBytes = new Uint8Array(32);
    Crypto.getRandomValues(randomBytes);

    return toBase64Url(Buffer.from(randomBytes).toString('base64'));
}

function toBase64Url(base64Value: string): string {
    return base64Value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
        encoding: Crypto.CryptoEncoding.BASE64,
    });

    return toBase64Url(digest);
}

export function extractUserIdFromClaims(claims: Record<string, unknown>): string {
    const userId = claims[CLAIM_USER_ID] as string | undefined;

    if (!userId) {
        throw new Error(`Missing or invalid "${CLAIM_USER_ID}" claim`);
    }

    return userId;
}

function decodeTokenClaims(token: string): Record<string, unknown> {
    const parts = token.split('.');

    if (parts.length !== 3) {
        return {};
    }

    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');

    return JSON.parse(decoded) as Record<string, unknown>;
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
}): AuthSession {
    const claims = result.idToken ? decodeTokenClaims(result.idToken) : {};

    if (isImpersonatedClaims(claims)) {
        throw new Error('Administrator impersonation is blocked in the mobile app.');
    }

    const userId = extractUserIdFromClaims(claims);
    const auth0Id = typeof claims.sub === 'string' ? claims.sub : '';

    if (!result.refreshToken) {
        throw new Error('Missing refresh token from Auth0 response');
    }

    return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: new Date((result.expiresAt ?? 0) * 1000).toISOString(),
        userId,
        auth0Id,
    };
}

export async function startAuthFlow(config: Auth0Config): Promise<string> {
    codeVerifier = generateCodeVerifier();
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
