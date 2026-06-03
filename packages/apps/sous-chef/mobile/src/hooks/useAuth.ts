import { useAuth as useIdpAuth, useUser } from '@clerk/expo';
import { useMemo } from 'react';
import { type AuthState, IMPERSONATION_BLOCK, SUSPENDED_BLOCK } from '../types/auth.js';

export function deriveAuthState(input: {
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
        return { status: 'blocked', reason: IMPERSONATION_BLOCK };
    }

    const status = userPublicMetadata?.status as string | undefined;

    if (status === 'suspended') {
        return { status: 'blocked', reason: SUSPENDED_BLOCK };
    }

    return { status: 'authenticated', userId };
}

export function useAuth(): {
    state: AuthState;
    getToken: () => Promise<string | null>;
    signOut: () => Promise<void>;
} {
    const { isLoaded, isSignedIn, userId, sessionClaims, getToken, signOut } = useIdpAuth();
    const { user } = useUser();

    const state = useMemo<AuthState>(
        () =>
            deriveAuthState({
                isLoaded,
                isSignedIn,
                userId,
                sessionClaims: sessionClaims as Record<string, unknown> | null,
                userPublicMetadata: user?.publicMetadata as Record<string, unknown> | null,
            }),
        [isLoaded, isSignedIn, userId, sessionClaims, user],
    );

    return { state, getToken, signOut };
}
