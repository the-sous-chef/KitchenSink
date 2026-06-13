import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockInit } = vi.hoisted(() => ({ mockInit: vi.fn() }));

vi.mock('@sentry/react-native', () => ({
    init: mockInit,
    wrap: <T>(component: T): T => component,
}));

import { initSentry, scrubAttributes, scrubEvent, scrubLog } from '../src/observability/sentry';

describe('mobile sentry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env['EXPO_PUBLIC_SENTRY_DSN'];
    });

    it('initializes with PII off and logs enabled when a DSN is present', () => {
        process.env['EXPO_PUBLIC_SENTRY_DSN'] = 'https://key@o1.ingest.sentry.io/1';

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

    it('scrubEvent redacts extra/request.data but preserves the opaque user id', () => {
        const out = scrubEvent({
            extra: { email: 'a@b.com', ok: 1 },
            request: { data: { token: 'aaaaaaaa.bbbbbbbb.cccccccc' } },
            user: { id: 'u1', email: 'a@b.com' },
        } as unknown as Parameters<typeof scrubEvent>[0]);

        expect((out.extra as Record<string, unknown>)['email']).toBe('[redacted]');
        expect((out.request?.data as Record<string, unknown>)['token']).toBe('[redacted]');
        expect(out.user?.id).toBe('u1');
        expect((out.user as Record<string, unknown>)['email']).toBe('[redacted]');
    });
});
