import type { JWTPayload } from 'jose';

/** @implements REQ-009 FR-009 ARCH-024 MOD-024 */
export interface Auth0JwtPayload extends JWTPayload {
    sub: string;
    scope?: string;
    permissions?: string[];
    email?: string;
    gty?: string;
}

/** @implements REQ-009 FR-009 ARCH-024 MOD-024 */
export interface VerifyTokenOptions {
    jwksUri: string;
    audience: string | string[];
    issuer: string;
}
