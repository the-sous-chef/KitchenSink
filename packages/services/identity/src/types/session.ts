import type { UserId } from './user.js';

export interface WebSessionPayload {
    userId: UserId;
    accessToken: string;
    refreshToken: string;
    audience: string[];
    scope: string[];
    issuedAt: number;
    expiresAt: number;
}

export interface MobileSessionPayload {
    userId: UserId;
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
    readonly userId: UserId;
}
