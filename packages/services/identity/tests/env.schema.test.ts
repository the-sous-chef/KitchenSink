import { describe, expect, it } from 'vitest';

import { EnvironmentSchema } from '../src/config/env.schema.js';

const base = {
    DATABASE_URL: 'postgres://user:pass@host:5432/db',
    DELETION_QUEUE_URL: 'https://sqs.example.com/queue',
};

describe('EnvironmentSchema', () => {
    it('parses without Sentry vars (all optional)', () => {
        const result = EnvironmentSchema.parse(base);

        expect(result.SENTRY_DSN).toBeUndefined();
        expect(result.STAGE).toBe('dev');
    });

    it('parses with Sentry vars and a real deploy stage', () => {
        const result = EnvironmentSchema.parse({
            ...base,
            SENTRY_DSN: 'https://key@o1.ingest.sentry.io/1',
            SENTRY_TRACES_SAMPLE_RATE: '0.1',
            SENTRY_RELEASE: 'abc123',
            STAGE: 'prod',
        });

        expect(result.SENTRY_DSN).toBe('https://key@o1.ingest.sentry.io/1');
        expect(result.SENTRY_RELEASE).toBe('abc123');
        expect(result.STAGE).toBe('prod');
    });

    it('rejects a non-URL SENTRY_DSN', () => {
        expect(() => EnvironmentSchema.parse({ ...base, SENTRY_DSN: 'not-a-url' })).toThrow();
    });
});
