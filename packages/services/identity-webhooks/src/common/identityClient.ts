import { createClerkClient } from '@clerk/backend';
import { readSecretStringField } from './secrets.js';

let _client: ReturnType<typeof createClerkClient> | null = null;

const getClient = async () => {
    if (!_client) {
        const secretArn = process.env.AUTH_SECRET_ARN ?? process.env.IDP_SECRET_KEY;

        if (!secretArn) {
            throw new Error('AUTH_SECRET_ARN or IDP_SECRET_KEY env var is required');
        }

        // If the env value looks like an ARN, resolve it from Secrets Manager;
        // otherwise treat it as the raw secret key (local dev / test).
        const secretKey = secretArn.startsWith('arn:aws:secretsmanager:')
            ? await readSecretStringField(secretArn, 'secretKey')
            : secretArn;
        _client = createClerkClient({ secretKey });
    }

    return _client;
};

export const setExternalId = async (userId: string, externalId: string): Promise<void> => {
    const client = await getClient();
    await client.users.updateUser(userId, { externalId });
};

export const getUser = async (userId: string) => {
    const client = await getClient();

    return client.users.getUser(userId);
};

export const deleteUser = async (userId: string): Promise<void> => {
    const client = await getClient();
    await client.users.deleteUser(userId);
};

export const listUsers = async () => {
    const client = await getClient();
    const pageSize = 100;
    const all = [];
    let offset = 0;

    for (;;) {
        const { data } = await client.users.getUserList({ limit: pageSize, offset });
        all.push(...data);

        if (data.length < pageSize) {
            break;
        }

        offset += pageSize;
    }

    return all;
};
