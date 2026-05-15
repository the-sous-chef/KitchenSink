import { importSPKI, jwtVerify, type JWTPayload, type JWTVerifyResult } from 'jose';
import jwksClient from 'jwks-rsa';

import type { Auth0AccessTokenClaims } from '@kitchensink/auth-types';

import { getJsonSecret } from './secrets.js';

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
type Auth0Secret = {
    domain: string;
    audience?: string;
};

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
let jwksProvider: ReturnType<typeof jwksClient> | null = null;

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
let cachedIssuerAudience: Promise<{ issuer: string; audience: string }> | null = null;

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const allowedSigningAlgorithms = new Set(['RS256']);

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const decodeJwtHeader = (token: string): { kid?: string; alg?: string } => {
    const [headerSegment] = token.split('.');

    if (!headerSegment) {
        throw new Error('Malformed JWT: missing header');
    }

    const normalized = headerSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = Buffer.from(padded, 'base64').toString('utf8');

    return JSON.parse(json) as { kid?: string; alg?: string };
};

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const getIssuerAudience = async (auth0SecretArn: string): Promise<{ issuer: string; audience: string }> => {
    if (cachedIssuerAudience) {
        return cachedIssuerAudience;
    }

    cachedIssuerAudience = (async () => {
        const fromEnvIssuer = process.env.AUTH0_ISSUER;
        const fromEnvAudience = process.env.AUTH0_AUDIENCE;

        if (fromEnvIssuer && fromEnvAudience) {
            return {
                issuer: fromEnvIssuer,
                audience: fromEnvAudience,
            };
        }

        const secret = (await getJsonSecret(auth0SecretArn)) as unknown as Auth0Secret;

        if (!secret.domain) {
            throw new Error(`Secret ${auth0SecretArn} missing domain`);
        }

        const issuer = `https://${secret.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}/`;
        const audience = fromEnvAudience ?? secret.audience;

        if (!audience) {
            throw new Error(`Unable to resolve AUTH0 audience from env or secret ${auth0SecretArn}`);
        }

        return {
            issuer,
            audience,
        };
    })();

    return cachedIssuerAudience;
};

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const getJwksClient = (issuer: string) => {
    if (jwksProvider) {
        return jwksProvider;
    }

    jwksProvider = jwksClient({
        jwksUri: `${issuer}.well-known/jwks.json`,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 10 * 60 * 1000,
        rateLimit: true,
    });

    return jwksProvider;
};

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
export const verifyAuth0Jwt = async (params: {
    token: string;
    auth0SecretArn: string;
}): Promise<JWTVerifyResult<Auth0AccessTokenClaims & JWTPayload>> => {
    const { issuer, audience } = await getIssuerAudience(params.auth0SecretArn);
    const decodedHeader = decodeJwtHeader(params.token);

    if (!decodedHeader.kid) {
        throw new Error('JWT header missing kid');
    }

    if (!decodedHeader.alg) {
        throw new Error('JWT header missing alg');
    }

    if (!allowedSigningAlgorithms.has(decodedHeader.alg)) {
        throw new Error('JWT header uses unsupported alg');
    }

    const client = getJwksClient(issuer);
    const key = await client.getSigningKey(decodedHeader.kid);
    const publicKey = await importSPKI(key.getPublicKey(), decodedHeader.alg);

    return jwtVerify(params.token, publicKey, {
        issuer,
        audience,
    });
};
