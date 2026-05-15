import { Injectable } from '@nestjs/common';

export const AUTH0_CLIENT = 'AUTH0_CLIENT';

interface Auth0TokenResponse {
    access_token: string;
    expires_in: number;
}

@Injectable()
export class Auth0Service {
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    private async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        const domain = process.env.AUTH0_DOMAIN ?? '';
        const clientId = process.env.AUTH0_CLIENT_ID ?? '';
        const clientSecret = process.env.AUTH0_CLIENT_SECRET ?? '';

        const response = await fetch(`https://${domain}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
                audience: `https://${domain}/api/v2/`,
            }),
        });

        if (!response.ok) {
            throw new Error(`Auth0 token request failed: ${response.status}`);
        }

        const data = (await response.json()) as Auth0TokenResponse;
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

        return this.accessToken;
    }

    private async auth0Request(method: string, path: string, body?: unknown): Promise<unknown> {
        const domain = process.env.AUTH0_DOMAIN ?? '';
        const token = await this.getAccessToken();

        const response = await fetch(`https://${domain}/api/v2${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Auth0 API error ${response.status}: ${errorText}`);
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();
    }

    async blockUser(auth0Sub: string): Promise<void> {
        await this.auth0Request('PATCH', `/users/${encodeURIComponent(auth0Sub)}`, { blocked: true });
    }

    async unblockUser(auth0Sub: string): Promise<void> {
        await this.auth0Request('PATCH', `/users/${encodeURIComponent(auth0Sub)}`, { blocked: false });
    }

    async createPasswordResetTicket(auth0Sub: string, resultUrl: string): Promise<{ ticket: string }> {
        const domain = process.env.AUTH0_DOMAIN ?? '';
        const response = await fetch(`https://${domain}/api/v2/tickets/password-reset`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${await this.getAccessToken()}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: auth0Sub,
                result_url: resultUrl,
            }),
        });

        if (!response.ok) {
            throw new Error(`Password reset ticket failed: ${response.status}`);
        }

        return response.json() as Promise<{ ticket: string }>;
    }

    async enrollMFA(auth0Sub: string): Promise<{ uri: string }> {
        const response = (await this.auth0Request(
            'POST',
            `/users/${encodeURIComponent(auth0Sub)}/guardian-enrollments-token`,
        )) as { uri?: string };

        return { uri: (response as { uri?: string }).uri ?? '' };
    }

    async unenrollMFA(enrollmentId: string): Promise<void> {
        await this.auth0Request('DELETE', `/guardian-enrollments/${encodeURIComponent(enrollmentId)}`);
    }

    async linkAccounts(primaryAuth0Sub: string, secondaryProvider: string, secondaryAccountId: string): Promise<void> {
        await this.auth0Request('POST', `/users/${encodeURIComponent(primaryAuth0Sub)}/identities`, {
            provider: secondaryProvider,
            user_id: secondaryAccountId,
        });
    }

    async unlinkAccount(primaryAuth0Sub: string, secondaryProvider: string, secondaryAccountId: string): Promise<void> {
        await this.auth0Request(
            'DELETE',
            `/users/${encodeURIComponent(primaryAuth0Sub)}/identities/${encodeURIComponent(secondaryProvider)}/${encodeURIComponent(secondaryAccountId)}`,
        );
    }

    async deleteUser(auth0Sub: string): Promise<void> {
        await this.auth0Request('DELETE', `/users/${encodeURIComponent(auth0Sub)}`);
    }
}
