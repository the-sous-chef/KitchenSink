import { afterEach, describe, expect, it, vi } from 'vitest';

import { EnvironmentSchema, resolveEnvironment } from '../env.js';

describe('EnvironmentSchema', () => {
    it('parses valid IdP env', () => {
        const parsed = EnvironmentSchema.parse({
            IDP_SECRET_KEY: 'sk_test_123',
            IDP_PUBLISHABLE_KEY: 'pk_test_123',
            IDP_WEBHOOK_SECRET: 'whsec_test_123',
            IDP_JWKS_URL: 'https://example.idp.example.com/.well-known/jwks.json',
            IDP_ISSUER: 'https://example.idp.example.com',
        });

        expect(parsed).toMatchObject({
            IDP_SECRET_KEY: 'sk_test_123',
            IDP_PUBLISHABLE_KEY: 'pk_test_123',
            IDP_WEBHOOK_SECRET: 'whsec_test_123',
            IDP_JWKS_URL: 'https://example.idp.example.com/.well-known/jwks.json',
            IDP_ISSUER: 'https://example.idp.example.com',
        });
    });

    it('throws when a required IdP env var is missing', () => {
        expect(() =>
            EnvironmentSchema.parse({
                IDP_PUBLISHABLE_KEY: 'pk_test_123',
                IDP_WEBHOOK_SECRET: 'whsec_test_123',
                IDP_JWKS_URL: 'https://example.idp.example.com/.well-known/jwks.json',
                IDP_ISSUER: 'https://example.idp.example.com',
            }),
        ).toThrow();
    });

    it('accepts AUTH_SECRET_ARN instead of IDP_SECRET_KEY', () => {
        expect(() =>
            EnvironmentSchema.parse({
                AUTH_SECRET_ARN: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:kitchensink/auth/test',
                IDP_PUBLISHABLE_KEY: 'pk_test_123',
                IDP_WEBHOOK_SECRET: 'whsec_test_123',
                IDP_JWKS_URL: 'https://example.idp.example.com/.well-known/jwks.json',
                IDP_ISSUER: 'https://example.idp.example.com',
            }),
        ).not.toThrow();
    });
});

describe('resolveEnvironment', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('parses process.env with IdP env vars', () => {
        vi.stubEnv('IDP_SECRET_KEY', 'sk_test_123');
        vi.stubEnv('IDP_PUBLISHABLE_KEY', 'pk_test_123');
        vi.stubEnv('IDP_WEBHOOK_SECRET', 'whsec_test_123');
        vi.stubEnv('IDP_JWKS_URL', 'https://example.idp.example.com/.well-known/jwks.json');
        vi.stubEnv('IDP_ISSUER', 'https://example.idp.example.com');

        expect(resolveEnvironment()).toMatchObject({
            IDP_SECRET_KEY: 'sk_test_123',
            IDP_PUBLISHABLE_KEY: 'pk_test_123',
            IDP_WEBHOOK_SECRET: 'whsec_test_123',
            IDP_JWKS_URL: 'https://example.idp.example.com/.well-known/jwks.json',
            IDP_ISSUER: 'https://example.idp.example.com',
        });
    });
});
