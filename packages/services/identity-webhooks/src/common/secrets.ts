import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
const secretsClient = new SecretsManagerClient({});

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
const secretCache = new Map<string, Record<string, unknown>>();

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
export const getJsonSecret = async (secretArn: string): Promise<Record<string, unknown>> => {
    const cached = secretCache.get(secretArn);

    if (cached) {
        return cached;
    }

    const response = await secretsClient.send(
        new GetSecretValueCommand({
            SecretId: secretArn,
        }),
    );

    if (!response.SecretString) {
        throw new Error(`Secret ${secretArn} has no SecretString payload`);
    }

    const parsed = JSON.parse(response.SecretString) as Record<string, unknown>;
    secretCache.set(secretArn, parsed);

    return parsed;
};

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
export const readSecretStringField = async (secretArn: string, field: string): Promise<string> => {
    const secret = await getJsonSecret(secretArn);
    const value = secret[field];

    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`Secret ${secretArn} missing string field '${field}'`);
    }

    return value;
};
