import { describe, expect, it } from 'vitest';

interface AuthState {
    status: 'loading' | 'unauthenticated' | 'authenticated' | 'blocked' | 'error';
    userId?: string;
    reason?: { code: string };
}

function deriveAuthState(input: {
    isLoaded: boolean;
    isSignedIn: boolean | null | undefined;
    userId: string | null | undefined;
    sessionClaims: Record<string, unknown> | null | undefined;
    userPublicMetadata: Record<string, unknown> | null | undefined;
}): AuthState {
    const { isLoaded, isSignedIn, userId, sessionClaims, userPublicMetadata } = input;

    if (!isLoaded) {
        return { status: 'loading' };
    }

    if (!isSignedIn || !userId) {
        return { status: 'unauthenticated' };
    }

    if (sessionClaims && 'act' in sessionClaims && sessionClaims.act) {
        return { status: 'blocked', reason: { code: 'impersonation_blocked' } };
    }

    const status = userPublicMetadata?.status as string | undefined;

    if (status === 'suspended') {
        return { status: 'blocked', reason: { code: 'account_suspended' } };
    }

    return { status: 'authenticated', userId };
}

describe('e2e: mobile auth state', () => {
    it('returns loading when Clerk is not loaded', () => {
        const state = deriveAuthState({
            isLoaded: false,
            isSignedIn: false,
            userId: null,
            sessionClaims: null,
            userPublicMetadata: null,
        });

        expect(state.status).toBe('loading');
    });

    it('returns unauthenticated when not signed in', () => {
        const state = deriveAuthState({
            isLoaded: true,
            isSignedIn: false,
            userId: null,
            sessionClaims: null,
            userPublicMetadata: null,
        });

        expect(state.status).toBe('unauthenticated');
    });

    it('returns authenticated when signed in', () => {
        const state = deriveAuthState({
            isLoaded: true,
            isSignedIn: true,
            userId: 'user_123',
            sessionClaims: null,
            userPublicMetadata: null,
        });

        expect(state.status).toBe('authenticated');
        expect(state.userId).toBe('user_123');
    });

    it('returns blocked for impersonation sessions', () => {
        const state = deriveAuthState({
            isLoaded: true,
            isSignedIn: true,
            userId: 'user_123',
            sessionClaims: { act: true },
            userPublicMetadata: null,
        });

        expect(state.status).toBe('blocked');
        expect(state.reason?.code).toBe('impersonation_blocked');
    });

    it('returns blocked for suspended accounts', () => {
        const state = deriveAuthState({
            isLoaded: true,
            isSignedIn: true,
            userId: 'user_123',
            sessionClaims: null,
            userPublicMetadata: { status: 'suspended' },
        });

        expect(state.status).toBe('blocked');
        expect(state.reason?.code).toBe('account_suspended');
    });
});
