import type { AuthSession } from '../types/auth.js';
import type { Auth0Config } from '../types/auth.js';
import type { UpdateProfileDto } from '@kitchensink/auth-types';
import { isTokenRefreshError } from '../types/auth.js';
import { refreshAccessToken } from '../auth/auth0.js';
import { storeSession } from '../storage/secureStorage.js';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.sous-chef.io';

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly code?: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

function getAuthorizationHeader(session: AuthSession): string {
    return `Bearer ${session.accessToken}`;
}

async function refreshSession(config: Auth0Config, session: AuthSession): Promise<AuthSession> {
    const result = await refreshAccessToken(config, session.refreshToken);
    const newSession = result.session;
    await storeSession(newSession);

    return newSession;
}

export async function apiRequest<T>(
    config: Auth0Config,
    session: AuthSession,
    path: string,
    options: RequestInit = {},
): Promise<T> {
    let currentSession = session;

    const makeRequest = async (authSession: AuthSession): Promise<Response> => {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: getAuthorizationHeader(authSession),
                ...options.headers,
            },
        });

        return response;
    };

    let response = await makeRequest(currentSession);

    if (response.status === 401) {
        try {
            currentSession = await refreshSession(config, currentSession);
            response = await makeRequest(currentSession);
        } catch (refreshError) {
            if (isTokenRefreshError(refreshError)) {
                throw refreshError;
            }

            throw new ApiError('Unauthorized', 401);
        }
    }

    if (!response.ok) {
        let errorMessage = `API request failed: ${response.statusText}`;

        try {
            const errorData = await response.json();
            errorMessage = errorData.message ?? errorMessage;
        } catch {
            // ignore parse error
        }

        throw new ApiError(errorMessage, response.status);
    }

    return response.json() as Promise<T>;
}

export async function getUserMe(config: Auth0Config, session: AuthSession) {
    return apiRequest(config, session, '/v1/users/me');
}

export async function patchUserMe(config: Auth0Config, session: AuthSession, body: UpdateProfileDto) {
    return apiRequest(config, session, '/v1/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}

export async function deleteUserMe(config: Auth0Config, session: AuthSession) {
    return apiRequest(config, session, '/v1/users/me', {
        method: 'DELETE',
    });
}

export async function requestPasswordReset(config: Auth0Config, session: AuthSession) {
    return apiRequest(config, session, '/v1/users/me/password-reset', {
        method: 'POST',
    });
}

export async function enrollMfa(config: Auth0Config, session: AuthSession) {
    return apiRequest(config, session, '/v1/users/me/mfa/enroll', {
        method: 'POST',
    });
}

export async function unenrollMfa(config: Auth0Config, session: AuthSession, enrollmentId: string) {
    return apiRequest(config, session, '/v1/users/me/mfa/unenroll', {
        method: 'POST',
        body: JSON.stringify({ enrollmentId }),
    });
}

export async function linkSocialAccount(
    config: Auth0Config,
    session: AuthSession,
    provider: string,
    accountId: string,
) {
    return apiRequest(config, session, '/v1/users/me/social/link', {
        method: 'POST',
        body: JSON.stringify({ provider, accountId }),
    });
}

export async function unlinkSocialAccount(
    config: Auth0Config,
    session: AuthSession,
    provider: string,
    accountId: string,
) {
    return apiRequest(config, session, '/v1/users/me/social/unlink', {
        method: 'POST',
        body: JSON.stringify({ provider, accountId }),
    });
}

export async function getAccount(config: Auth0Config, session: AuthSession) {
    return apiRequest(config, session, '/v1/accounts/me');
}
