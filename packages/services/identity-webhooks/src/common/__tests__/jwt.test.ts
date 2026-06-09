import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { SignJWT, generateKeyPair, exportJWK } from 'jose';
import { verifyClerkJwt } from '../jwt.js';

const JWKS_URL = 'https://idp.test/.well-known/jwks.json';
const ISSUER = 'https://idp.test';
const AZP = 'pk_test_fake';

let publicJwk: Record<string, unknown>;
let privateKey: CryptoKey;
let keyId: string;

const server = setupServer();

beforeAll(async () => {
    keyId = 'test-key-1';
    const { privateKey: priv, publicKey: pub } = await generateKeyPair('RS256');
    privateKey = priv;
    publicJwk = { ...(await exportJWK(pub)), kid: keyId, use: 'sig', alg: 'RS256' };

    server.use(http.get(JWKS_URL, () => HttpResponse.json({ keys: [publicJwk] })));

    server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
    server.resetHandlers();
});

afterAll(() => server.close());

const makeToken = async (overrides: Record<string, unknown> = {}) => {
    const now = Math.floor(Date.now() / 1000);

    return new SignJWT({
        sub: 'user_abc123',
        iss: ISSUER,
        azp: AZP,
        iat: now,
        exp: now + 60,
        nbf: now,
        sid: 'sess_test',
        app_user_id: '01HZZZZZZZZZZZZZZZZZZZZZZ',
        ...overrides,
    })
        .setProtectedHeader({ alg: 'RS256', kid: keyId })
        .sign(privateKey);
};

describe('verifyClerkJwt', () => {
    beforeEach(() => {
        process.env.CLERK_JWKS_URL = JWKS_URL;
        process.env.CLERK_ISSUER = ISSUER;
    });

    it('returns claims for a valid token', async () => {
        const token = await makeToken();
        const claims = await verifyClerkJwt(token);

        expect(claims.sub).toBe('user_abc123');
        expect(claims.app_user_id).toBe('01HZZZZZZZZZZZZZZZZZZZZZZ');
        expect(claims.iss).toBe(ISSUER);
    });

    it('rejects an expired token', async () => {
        const now = Math.floor(Date.now() / 1000);
        const token = await makeToken({ iat: now - 120, exp: now - 60, nbf: now - 120 });

        await expect(verifyClerkJwt(token)).rejects.toThrow();
    });

    it('rejects a token with wrong issuer', async () => {
        const token = await makeToken({ iss: 'https://evil.example.com' });

        await expect(verifyClerkJwt(token)).rejects.toThrow();
    });

    it('verifies a token even when app_user_id is absent (JIT path)', async () => {
        const now = Math.floor(Date.now() / 1000);
        const token = await new SignJWT({
            sub: 'user_abc123',
            iss: ISSUER,
            azp: AZP,
            iat: now,
            exp: now + 60,
            nbf: now,
        })
            .setProtectedHeader({ alg: 'RS256', kid: keyId })
            .sign(privateKey);

        const claims = await verifyClerkJwt(token);
        expect(claims.sub).toBe('user_abc123');
        expect(claims).not.toHaveProperty('app_user_id');
    });
});
