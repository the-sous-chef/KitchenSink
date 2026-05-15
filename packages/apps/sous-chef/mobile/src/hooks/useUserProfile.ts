import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AccountReadDto, ProfileReadDto, UpdateProfileDto, UserReadDto } from '@kitchensink/auth-types';
import type { AuthSession } from '../types/auth.js';
import type { Auth0Config } from '../types/auth.js';
import {
    getUserMe,
    patchUserMe,
    deleteUserMe,
    requestPasswordReset,
    enrollMfa,
    unenrollMfa,
    linkSocialAccount,
    unlinkSocialAccount,
    getAccount,
} from '../services/api.js';

export interface UserProfileResponse {
    user: UserReadDto;
    profile: ProfileReadDto | null;
    accounts: readonly AccountReadDto[];
}

export function useUserProfile(config: Auth0Config, session: AuthSession | null) {
    return useQuery({
        queryKey: ['user', 'me'],
        queryFn: () => {
            if (!session) {
                throw new Error('No session');
            }

            return getUserMe(config, session) as Promise<UserProfileResponse>;
        },
        enabled: !!session,
        staleTime: 2 * 60 * 1000,
    });
}

export function useUpdateProfile(config: Auth0Config, session: AuthSession | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateProfileDto) => {
            if (!session) {
                throw new Error('No session');
            }

            return patchUserMe(config, session, data) as Promise<ProfileReadDto>;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
        },
    });
}

export function useDeleteAccount(config: Auth0Config, session: AuthSession | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => {
            if (!session) {
                throw new Error('No session');
            }

            return deleteUserMe(config, session);
        },
        onSuccess: () => {
            void queryClient.clear();
        },
    });
}

export function usePasswordReset(config: Auth0Config, session: AuthSession | null) {
    return useMutation({
        mutationFn: () => {
            if (!session) {
                throw new Error('No session');
            }

            return requestPasswordReset(config, session);
        },
    });
}

export function useMfaEnrollment(config: Auth0Config, session: AuthSession | null) {
    return useMutation({
        mutationFn: () => {
            if (!session) {
                throw new Error('No session');
            }

            return enrollMfa(config, session);
        },
    });
}

export function useMfaUnenrollment(config: Auth0Config, session: AuthSession | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (enrollmentId: string) => {
            if (!session) {
                throw new Error('No session');
            }

            return unenrollMfa(config, session, enrollmentId);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
        },
    });
}

export function useLinkSocial(config: Auth0Config, session: AuthSession | null) {
    return useMutation({
        mutationFn: ({ provider, accountId }: { provider: string; accountId: string }) => {
            if (!session) {
                throw new Error('No session');
            }

            return linkSocialAccount(config, session, provider, accountId);
        },
    });
}

export function useUnlinkSocial(config: Auth0Config, session: AuthSession | null) {
    return useMutation({
        mutationFn: ({ provider, accountId }: { provider: string; accountId: string }) => {
            if (!session) {
                throw new Error('No session');
            }

            return unlinkSocialAccount(config, session, provider, accountId);
        },
    });
}

export function useAccount(config: Auth0Config, session: AuthSession | null) {
    return useQuery({
        queryKey: ['account', 'me'],
        queryFn: () => {
            if (!session) {
                throw new Error('No session');
            }

            return getAccount(config, session) as Promise<readonly AccountReadDto[]>;
        },
        enabled: !!session,
        staleTime: 5 * 60 * 1000,
    });
}
