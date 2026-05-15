import { ManagementClient, type Management } from 'auth0';

import type { UserId } from '@kitchensink/auth-types';

import { getJsonSecret } from './secrets.js';

type Auth0Secret = {
    domain: string;
    audience?: string;
    clientId: string;
    clientSecret: string;
};

let clientPromise: Promise<ManagementClient> | null = null;

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
export const getAuth0ManagementClient = async (auth0SecretArn: string): Promise<ManagementClient> => {
    if (clientPromise) {
        return clientPromise;
    }

    clientPromise = (async () => {
        const secret = (await getJsonSecret(auth0SecretArn)) as unknown as Auth0Secret;

        return new ManagementClient({
            domain: secret.domain,
            audience: secret.audience,
            clientId: secret.clientId,
            clientSecret: secret.clientSecret,
        });
    })();

    return clientPromise;
};

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
export const updateUserMetadataUserId = async (params: {
    auth0SecretArn: string;
    auth0Sub: string;
    userId: UserId;
}): Promise<void> => {
    const client = await getAuth0ManagementClient(params.auth0SecretArn);
    await client.users.update(params.auth0Sub, {
        app_metadata: {
            userId: params.userId,
        },
    });
};

/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
export const deleteAuth0User = async (params: { auth0SecretArn: string; auth0Sub: string }): Promise<void> => {
    const client = await getAuth0ManagementClient(params.auth0SecretArn);
    await client.users.delete(params.auth0Sub);
};

/** @implements REQ-017 REQ-IF-010 FR-017 ARCH-012 MOD-012 */
export const listAuth0Users = async (params: {
    auth0SecretArn: string;
}): Promise<Array<{ sub: string; email: string; name: string | null; picture: string | null }>> => {
    const client = await getAuth0ManagementClient(params.auth0SecretArn);
    const page = await client.users.list({
        search_engine: 'v3',
        per_page: 100,
        fields: 'user_id,email,name,picture,identities',
    });

    const users: Array<{ sub: string; email: string; name: string | null; picture: string | null }> = [];

    for await (const auth0User of page) {
        const typed = auth0User as Management.UserResponseSchema;
        const sub = typed.user_id;

        if (!sub || !typed.email) {
            continue;
        }

        users.push({
            sub,
            email: typed.email,
            name: typed.name ?? null,
            picture: typed.picture ?? null,
        });
    }

    return users;
};
