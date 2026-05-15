import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getJsonSecret: vi.fn(),
    jwtVerify: vi.fn(),
    importSPKI: vi.fn(),
    getSigningKey: vi.fn(),
    jwksClient: vi.fn(),
}));

vi.mock('../common/secrets.js', () => ({
    getJsonSecret: mocks.getJsonSecret,
}));

vi.mock('jose', () => ({
    jwtVerify: mocks.jwtVerify,
    importSPKI: mocks.importSPKI,
}));

vi.mock('jwks-rsa', () => ({
    default: mocks.jwksClient,
}));

const toJwt = (header: Record<string, unknown>, payload: Record<string, unknown> = {}): string => {
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    return `${encodedHeader}.${encodedPayload}.signature`;
};

describe('jwt helper', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        delete process.env.AUTH0_ISSUER;
        delete process.env.AUTH0_AUDIENCE;

        mocks.getJsonSecret.mockResolvedValue({
            domain: 'tenant.example.auth0.com',
            audience: 'https://api.kitchensink.dev',
        });

        mocks.jwksClient.mockReturnValue({
            getSigningKey: mocks.getSigningKey,
        });

        mocks.getSigningKey.mockResolvedValue({
            getPublicKey: () =>
                '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr\n-----END PUBLIC KEY-----',
        });
        mocks.importSPKI.mockResolvedValue('public-key');
        mocks.jwtVerify.mockResolvedValue({
            payload: {
                sub: 'auth0|abc',
                aud: ['https://api.kitchensink.dev'],
                iss: 'https://tenant.example.auth0.com/',
            },
            protectedHeader: {
                alg: 'RS256',
                kid: 'kid-1',
            },
        });
    });

    it('UTS-024-A1 [MOD-024/jwt]: verifies token using issuer/audience from env and JWKS signing key', async () => {
        process.env.AUTH0_ISSUER = 'https://issuer-from-env.example/';
        process.env.AUTH0_AUDIENCE = 'https://audience-from-env.example';

        const { verifyAuth0Jwt } = await import('../common/jwt.js');
        const token = toJwt({ alg: 'RS256', kid: 'kid-1' });

        await verifyAuth0Jwt({
            token,
            auth0SecretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:auth0',
        });

        expect(mocks.getJsonSecret).not.toHaveBeenCalled();
        expect(mocks.jwksClient).toHaveBeenCalledWith(
            expect.objectContaining({
                jwksUri: 'https://issuer-from-env.example/.well-known/jwks.json',
            }),
        );
        expect(mocks.getSigningKey).toHaveBeenCalledWith('kid-1');
        expect(mocks.importSPKI).toHaveBeenCalledWith(expect.any(String), 'RS256');
        expect(mocks.jwtVerify).toHaveBeenCalledWith(token, 'public-key', {
            issuer: 'https://issuer-from-env.example/',
            audience: 'https://audience-from-env.example',
        });
    });

    it('UTS-024-A2 [MOD-024/jwt-malformed]: rejects malformed JWT header', async () => {
        const { verifyAuth0Jwt } = await import('../common/jwt.js');

        await expect(
            verifyAuth0Jwt({
                token: '.payload.signature',
                auth0SecretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:auth0',
            }),
        ).rejects.toThrow();

        expect(mocks.getSigningKey).not.toHaveBeenCalled();
        expect(mocks.jwtVerify).not.toHaveBeenCalled();
    });

    it('UTS-024-A2 [MOD-024/jwt-no-kid]: rejects JWT header missing kid', async () => {
        const { verifyAuth0Jwt } = await import('../common/jwt.js');

        await expect(
            verifyAuth0Jwt({
                token: toJwt({ alg: 'RS256' }),
                auth0SecretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:auth0',
            }),
        ).rejects.toThrow('JWT header missing kid');
    });

    it('UTS-024-A2 [MOD-024/jwt-no-alg]: rejects JWT header missing alg', async () => {
        const { verifyAuth0Jwt } = await import('../common/jwt.js');

        await expect(
            verifyAuth0Jwt({
                token: toJwt({ kid: 'kid-1' }),
                auth0SecretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:auth0',
            }),
        ).rejects.toThrow('JWT header missing alg');
    });

    it('UTS-024-A2 [MOD-024/jwt-bad-alg]: rejects unsupported signing algorithm', async () => {
        const { verifyAuth0Jwt } = await import('../common/jwt.js');

        await expect(
            verifyAuth0Jwt({
                token: toJwt({ alg: 'HS256', kid: 'kid-1' }),
                auth0SecretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:auth0',
            }),
        ).rejects.toThrow('JWT header uses unsupported alg');
    });

    it('UTS-024-A1 [MOD-024/jwt-secret]: resolves issuer/audience from secret when env is absent', async () => {
        const { verifyAuth0Jwt } = await import('../common/jwt.js');
        const token = toJwt({ alg: 'RS256', kid: 'kid-1' });

        await verifyAuth0Jwt({
            token,
            auth0SecretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:auth0',
        });

        expect(mocks.getJsonSecret).toHaveBeenCalledWith('arn:aws:secretsmanager:us-east-1:123:secret:auth0');
        expect(mocks.jwksClient).toHaveBeenCalledWith(
            expect.objectContaining({
                jwksUri: 'https://tenant.example.auth0.com/.well-known/jwks.json',
            }),
        );
        expect(mocks.jwtVerify).toHaveBeenCalledWith(token, 'public-key', {
            issuer: 'https://tenant.example.auth0.com/',
            audience: 'https://api.kitchensink.dev',
        });
    });

    it('UTS-024-A2 [MOD-024/jwt-no-domain]: rejects secret missing domain', async () => {
        mocks.getJsonSecret.mockResolvedValueOnce({
            audience: 'https://api.kitchensink.dev',
        });
        const { verifyAuth0Jwt } = await import('../common/jwt.js');

        await expect(
            verifyAuth0Jwt({
                token: toJwt({ alg: 'RS256', kid: 'kid-1' }),
                auth0SecretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:auth0',
            }),
        ).rejects.toThrow('missing domain');
    });

    it('UTS-024-A2 [MOD-024/jwt-no-audience]: rejects when audience cannot be resolved from env or secret', async () => {
        mocks.getJsonSecret.mockResolvedValueOnce({
            domain: 'tenant.example.auth0.com',
        });
        const { verifyAuth0Jwt } = await import('../common/jwt.js');

        await expect(
            verifyAuth0Jwt({
                token: toJwt({ alg: 'RS256', kid: 'kid-1' }),
                auth0SecretArn: 'arn:aws:secretsmanager:us-east-1:123:secret:auth0',
            }),
        ).rejects.toThrow('Unable to resolve AUTH0 audience');
    });
});
