import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockInit } = vi.hoisted(() => ({ mockInit: vi.fn() }));

vi.mock('@sentry/react-native', () => ({
    init: mockInit,
    wrap: <T>(component: T): T => component,
}));

import { initSentry, scrubAttributes, scrubLog } from '../src/observability/sentry';

describe('mobile sentry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    });

    it('initializes with PII off and logs enabled when a DSN is present', () => {
        process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://key@o1.ingest.sentry.io/1';

        initSentry();

        expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ enableLogs: true, sendDefaultPii: false }));
    });

    it('is inert without a DSN (local dev)', () => {
        initSentry();

        expect(mockInit).not.toHaveBeenCalled();
    });

    it('scrubs denied keys and drops debug logs', () => {
        expect(scrubAttributes({ email: 'a@b.com', id: 'u1' }).email).toBe('[redacted]');
        expect(scrubAttributes({ email: 'a@b.com', id: 'u1' }).id).toBe('u1');
        expect(scrubLog({ level: 'debug' })).toBeNull();
        expect(scrubLog({ level: 'info', attributes: { token: 'x' } })?.attributes?.['token']).toBe('[redacted]');
    });
});
