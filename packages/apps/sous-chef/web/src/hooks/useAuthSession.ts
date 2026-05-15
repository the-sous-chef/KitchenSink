import { getAccessToken, useUser } from '@auth0/nextjs-auth0';
import type { AuthSession } from '@kitchensink/auth-types';
import { navigateTo } from '@/lib/navigation';

export function useAuthSession(): AuthSession | undefined {
    const { user, isLoading, error } = useUser();

    if (isLoading || error || !user) {
        return undefined;
    }

    return {
        accessToken: '',
        refreshToken: '',
        expiresAt: '',
        userId: user.sub,
        auth0Id: user.sub,
    };
}

export function useAuthRefresh() {
    const { isLoading } = useUser();

    return {
        isRefreshing: isLoading,
        refresh: async () => {
            const response = await fetch('/api/session/refresh', {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                navigateTo(`/api/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}`);

                return;
            }

            await getAccessToken();
        },
    };
}
