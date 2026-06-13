import { describe, expect, it } from 'vitest';

import {
    isDeniedKey,
    looksLikeBearerToken,
    scrubEvent,
    scrubLog,
    scrubText,
    scrubAttributes,
} from '../sentry-scrubbers.js';

describe('sentry-scrubbers', () => {
    describe('isDeniedKey', () => {
        it('matches the denylist case-insensitively', () => {
            expect(isDeniedKey('Email')).toBe(true);
            expect(isDeniedKey('AUTHORIZATION')).toBe(true);
            expect(isDeniedKey('avatarUrl')).toBe(true);
            expect(isDeniedKey('id')).toBe(false);
            expect(isDeniedKey('identityId')).toBe(false);
        });
    });

    describe('looksLikeBearerToken', () => {
        it('detects JWT-shaped strings and ignores ordinary text', () => {
            expect(looksLikeBearerToken('aaaaaaaa.bbbbbbbb.cccccccc')).toBe(true);
            expect(looksLikeBearerToken('hello world')).toBe(false);
            expect(looksLikeBearerToken('a.b.c')).toBe(false);
        });
    });

    describe('scrubAttributes', () => {
        it('redacts denied keys and bearer-shaped strings, recursing nested structures', () => {
            const input = {
                email: 'a@b.com',
                id: 'u1',
                nested: { token: 'secret', note: 'ok' },
                list: ['plain', 'aaaaaaaa.bbbbbbbb.cccccccc'],
            };

            const out = scrubAttributes(input);

            expect(out.email).toBe('[redacted]');
            expect(out.id).toBe('u1');
            expect(out.nested.token).toBe('[redacted]');
            expect(out.nested.note).toBe('ok');
            expect(out.list[0]).toBe('plain');
            expect(out.list[1]).toBe('[redacted]');
        });
    });

    describe('scrubEvent', () => {
        it('scrubs extra and user fields but preserves the opaque user id', () => {
            const event = {
                extra: { email: 'a@b.com', ok: 1 },
                user: { id: 'u1', email: 'a@b.com', name: 'Bob' },
            } as unknown as Parameters<typeof scrubEvent>[0];

            const out = scrubEvent(event);

            expect(out.extra?.['email']).toBe('[redacted]');
            expect(out.extra?.['ok']).toBe(1);
            expect(out.user?.id).toBe('u1');
            expect(out.user?.['email']).toBe('[redacted]');
            expect(out.user?.['name']).toBe('[redacted]');
        });
    });

    describe('scrubText', () => {
        it('redacts email and bearer-shaped substrings inside free text', () => {
            expect(scrubText('contact me at a@b.com please')).toBe('contact me at [redacted] please');
            expect(scrubText('token aaaaaaaa.bbbbbbbb.cccccccc rejected')).toBe('token [redacted] rejected');
            expect(scrubText('nothing sensitive here')).toBe('nothing sensitive here');
        });
    });

    describe('scrubEvent message + exception', () => {
        it('redacts PII in the event message and exception values', () => {
            const event = {
                message: 'failed for a@b.com',
                exception: { values: [{ value: 'token aaaaaaaa.bbbbbbbb.cccccccc invalid' }] },
            } as unknown as Parameters<typeof scrubEvent>[0];

            const out = scrubEvent(event);

            expect(out.message).toBe('failed for [redacted]');
            expect(out.exception?.values?.[0]?.value).toBe('token [redacted] invalid');
        });
    });

    describe('scrubLog', () => {
        it('drops debug logs and redacts the message body + attributes', () => {
            expect(scrubLog({ level: 'debug', message: 'x' })).toBeNull();

            const out = scrubLog({ level: 'info', message: 'user a@b.com synced', attributes: { token: 'x' } });
            expect(out?.message).toBe('user [redacted] synced');
            expect(out?.attributes?.['token']).toBe('[redacted]');
        });
    });
});
