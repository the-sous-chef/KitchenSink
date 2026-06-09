import { describe, expect, it } from 'vitest';
import { Webhook } from 'svix';

const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';

function makeSignedHeaders(body: string): Record<string, string> {
    const wh = new Webhook(SECRET);
    const msgId = 'msg_test_' + Date.now();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signed = (wh as unknown as { sign: (id: string, ts: Date, payload: string) => string }).sign(
        msgId,
        new Date(Number(timestamp) * 1000),
        body,
    );

    return {
        'svix-id': msgId,
        'svix-timestamp': timestamp,
        'svix-signature': signed,
    };
}

describe('verifyWebhook', () => {
    it('returns parsed event for a valid signature', async () => {
        const { verifyWebhook } = await import('../svix.js');

        const payload = JSON.stringify({
            type: 'user.created',
            data: { id: 'user_abc' },
            object: 'event',
        });

        const headers = makeSignedHeaders(payload);
        const result = verifyWebhook(headers, payload, SECRET);

        expect(result).toMatchObject({
            type: 'user.created',
            data: { id: 'user_abc' },
            object: 'event',
        });
        expect(result.data).toHaveProperty('id');
    });

    it('throws on tampered body', async () => {
        const { verifyWebhook } = await import('../svix.js');

        const originalPayload = JSON.stringify({
            type: 'user.created',
            data: { id: 'user_abc' },
            object: 'event',
        });

        const headers = makeSignedHeaders(originalPayload);

        const tamperedPayload = JSON.stringify({
            type: 'user.deleted',
            data: { id: 'user_abc' },
            object: 'event',
        });

        expect(() => verifyWebhook(headers, tamperedPayload, SECRET)).toThrow();
    });

    it('throws when svix-signature header is missing', async () => {
        const { verifyWebhook } = await import('../svix.js');

        const payload = JSON.stringify({ type: 'user.created', data: {}, object: 'event' });
        const headers = {
            'svix-id': 'msg_test_123',
            'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
        };

        expect(() => verifyWebhook(headers, payload, SECRET)).toThrow();
    });

    it('throws on wrong secret', async () => {
        const { verifyWebhook } = await import('../svix.js');

        const payload = JSON.stringify({ type: 'user.created', data: {}, object: 'event' });
        const headers = makeSignedHeaders(payload);

        expect(() => verifyWebhook(headers, payload, 'whsec_wrongsecretwrongsecretwrongsecretwrong==')).toThrow();
    });
});
