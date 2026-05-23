import type { APIGatewayRequestAuthorizerEvent, Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handler } from '../handler.js';

vi.mock('../jwt.js', () => ({
    verifyToken: vi.fn(),
}));

import { verifyToken } from '../jwt.js';

const mockVerifyToken = vi.mocked(verifyToken);

const makeEvent = (authorization?: string): APIGatewayRequestAuthorizerEvent =>
    ({
        type: 'REQUEST',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:api/stage/GET/resource',
        headers: authorization ? { Authorization: authorization } : {},
        requestContext: { requestId: 'test-request-id' },
    }) as unknown as APIGatewayRequestAuthorizerEvent;

const makeContext = (): Context => ({}) as unknown as Context;

beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH0_DOMAIN = 'test.auth0.com';
    process.env.AUTH0_AUDIENCE = 'https://api.test.com';
});

describe('handler', () => {
    it('valid user token → Allow policy with correct context', async () => {
        mockVerifyToken.mockResolvedValueOnce({
            sub: 'auth0|user123',
            email: 'user@example.com',
            scope: 'openid profile',
            permissions: ['read:data'],
            iss: 'https://test.auth0.com/',
            aud: 'https://api.test.com',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
        });

        const result = await handler(makeEvent('Bearer valid.user.token'), makeContext());

        expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
        expect(result.principalId).toBe('auth0|user123');
        expect(result.context?.sub).toBe('auth0|user123');
        expect(result.context?.email).toBe('user@example.com');
        expect(result.context?.isM2M).toBe(false);
        expect(result.context?.tokenType).toBe('user');
        expect(result.context?.scopes).toBe(JSON.stringify(['openid', 'profile']));
        expect(result.context?.permissions).toBe(JSON.stringify(['read:data']));
    });

    it('valid M2M token (gty=client-credentials) → Allow policy with isM2M=true', async () => {
        mockVerifyToken.mockResolvedValueOnce({
            sub: 'client123@clients',
            gty: 'client-credentials',
            scope: 'read:all write:all',
            permissions: [],
            iss: 'https://test.auth0.com/',
            aud: 'https://api.test.com',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
        });

        const result = await handler(makeEvent('Bearer valid.m2m.token'), makeContext());

        expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
        expect(result.context?.isM2M).toBe(true);
        expect(result.context?.tokenType).toBe('m2m');
    });

    it('expired token → throws Unauthorized', async () => {
        mockVerifyToken.mockRejectedValueOnce(new Error('JWT expired'));

        await expect(handler(makeEvent('Bearer expired.token'), makeContext())).rejects.toThrow('Unauthorized');
    });

    it('wrong audience → throws Unauthorized', async () => {
        mockVerifyToken.mockRejectedValueOnce(new Error('unexpected "aud" claim value'));

        await expect(handler(makeEvent('Bearer wrong.audience.token'), makeContext())).rejects.toThrow('Unauthorized');
    });

    it('missing Authorization header → throws Unauthorized', async () => {
        await expect(handler(makeEvent(), makeContext())).rejects.toThrow('Unauthorized');
    });

    it('M2M token detected via @clients sub suffix → isM2M=true', async () => {
        mockVerifyToken.mockResolvedValueOnce({
            sub: 'service-account@clients',
            scope: 'read:metrics',
            permissions: [],
            iss: 'https://test.auth0.com/',
            aud: 'https://api.test.com',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
        });

        const result = await handler(makeEvent('Bearer m2m.sub.token'), makeContext());

        expect(result.context?.isM2M).toBe(true);
        expect(result.context?.tokenType).toBe('m2m');
    });

    it('malformed Authorization header (no Bearer scheme) → throws Unauthorized', async () => {
        await expect(handler(makeEvent('Basic dXNlcjpwYXNz'), makeContext())).rejects.toThrow('Unauthorized');
    });
});
