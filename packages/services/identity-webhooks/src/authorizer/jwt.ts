import { createRemoteJWKSet, jwtVerify } from 'jose';

import type { Auth0JwtPayload, VerifyTokenOptions } from './types.js';

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const JWKS_CACHE_TTL_MS = 3_600_000;

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
const getJwks = (jwksUri: string): ReturnType<typeof createRemoteJWKSet> => {
    const cached = jwksCache.get(jwksUri);

    if (cached) {
        return cached;
    }

    const jwks = createRemoteJWKSet(new URL(jwksUri), {
        cacheMaxAge: JWKS_CACHE_TTL_MS,
    });

    jwksCache.set(jwksUri, jwks);

    return jwks;
};

/** @implements REQ-038 REQ-039 REQ-040 REQ-041 REQ-042 REQ-IF-004 REQ-CN-001 FR-038 FR-039 FR-040 FR-041 FR-042 ARCH-024 ARCH-025 MOD-024 MOD-025 */
export const verifyToken = async (token: string, options: VerifyTokenOptions): Promise<Auth0JwtPayload> => {
    const jwks = getJwks(options.jwksUri);

    const { payload } = await jwtVerify(token, jwks, {
        audience: options.audience,
        issuer: options.issuer,
    });

    return payload as Auth0JwtPayload;
};
