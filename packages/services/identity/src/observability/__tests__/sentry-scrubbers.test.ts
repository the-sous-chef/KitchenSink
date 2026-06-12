import { describe, expect, it } from 'vitest';

import { isDeniedKey, looksLikeBearerToken, scrubAttributes, scrubEvent } from '../sentry-scrubbers.js';

describe('sentry-scrubbers', () => {
    describe('isDeniedKey', () => {
        it('matches the denylist case-insensitively', () => {
            expect(isDeniedKey('Email')).toBe(true);
            expect(isDeniedKey('picture')).toBe(true);
            expect(isDeniedKey('id')).toBe(false);
        });
    });

    describe('looksLikeBearerToken', () => {
        it('detects JWT-shaped strings and ignores ordinary text', () => {
            expect(looksLikeBearerToken('aaaaaaaa.bbbbbbbb.cccccccc')).toBe(true);
            expect(looksLikeBearerToken('hello world')).toBe(false);
        });
    });

    describe('scrubAttributes', () => {
        it('redacts denied keys and bearer-shaped strings recursively', () => {
            const out = scrubAttributes({
                email: 'a@b.com',
                id: 'u1',
                nested: { name: 'Bob', note: 'ok' },
            });

            expect(out.email).toBe('[redacted]');
            expect(out.id).toBe('u1');
            expect(out.nested.name).toBe('[redacted]');
            expect(out.nested.note).toBe('ok');
        });
    });

    describe('scrubEvent', () => {
        it('scrubs extra and user but preserves the opaque user id', () => {
            const event = {
                extra: { email: 'a@b.com', ok: 1 },
                user: { id: 'u1', email: 'a@b.com' },
            } as unknown as Parameters<typeof scrubEvent>[0];

            const out = scrubEvent(event);

            expect(out.extra?.['email']).toBe('[redacted]');
            expect(out.extra?.['ok']).toBe(1);
            expect(out.user?.id).toBe('u1');
            expect(out.user?.['email']).toBe('[redacted]');
        });
    });
});
