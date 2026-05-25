import type { UserReadDto, UserStatus } from '@kitchensink/auth-types';

export type { UserReadDto, UserStatus };

export interface AuthSession {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly expiresAt: string;
    readonly sub: string;
}

export interface TokenRefreshResult {
    session: AuthSession;
}

export interface Auth0LoginResult {
    session: AuthSession;
    isFreshLogin: boolean;
}

export interface Auth0Config {
    readonly domain: string;
    readonly clientId: string;
    readonly callbackScheme: string;
    readonly audience: string;
}

export interface Auth0AuthorizeOptions {
    readonly loginHint?: string;
    readonly connection?: string;
    readonly screenHint?: 'login' | 'signup';
}

export type AuthBlockReason = 'suspended' | 'impersonation';

export interface AuthBlockMessage {
    readonly reason: AuthBlockReason;
    readonly title: string;
    readonly message: string;
}

export type AuthState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'authenticated'; session: AuthSession }
    | { status: 'unauthenticated' }
    | { status: 'blocked'; block: AuthBlockMessage }
    | { status: 'error'; message: string };

export class TokenRefreshError extends Error {
    constructor(message = 'Token refresh failed. Please log in again.') {
        super(message);
        this.name = 'TokenRefreshError';
    }
}

export class AccountSuspendedError extends Error {
    constructor(
        message = 'Your account has been suspended. Please contact support.',
        public readonly userId?: string,
    ) {
        super(message);
        this.name = 'AccountSuspendedError';
    }
}

export class ImpersonationBlockedError extends Error {
    constructor(
        message = 'This session cannot be used for impersonation.',
        public readonly sessionId?: string,
    ) {
        super(message);
        this.name = 'ImpersonationBlockedError';
    }
}

export function isAccountSuspendedError(error: unknown): error is AccountSuspendedError {
    return error instanceof AccountSuspendedError;
}

export function isImpersonationBlockedError(error: unknown): error is ImpersonationBlockedError {
    return error instanceof ImpersonationBlockedError;
}

export function isTokenRefreshError(error: unknown): error is TokenRefreshError {
    return error instanceof TokenRefreshError;
}

export function isImpersonatedClaims(claims: Record<string, unknown>): boolean {
    const value = claims['https://sous-chef.io/impersonation'];

    return value === true || value === 'true';
}
