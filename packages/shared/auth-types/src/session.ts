import type { UserId } from './user.js';

/** @implements REQ-005 REQ-006 FR-005 FR-006 ARCH-003 MOD-003 */
export interface WebSessionPayload {
    userId: UserId;
    auth0Sub: string;
    accessToken: string;
    refreshToken: string;
    audience: string[];
    scope: string[];
    issuedAt: number;
    expiresAt: number;
}

/** @implements REQ-001 REQ-005 REQ-006 FR-001 FR-005 FR-006 ARCH-003 MOD-003 */
export interface MobileSessionPayload {
    userId: UserId;
    auth0Sub: string;
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    audience: string[];
    scope: string[];
    issuedAt: number;
    expiresAt: number;
}

export interface AuthSession {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly expiresAt: string;
    readonly userId: string;
    readonly auth0Id: string;
}
