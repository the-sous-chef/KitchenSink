import { Webhook } from 'svix';

export type IdpWebhookEvent = {
    type: 'user.created' | 'user.updated' | 'user.deleted';
    data: Record<string, unknown>;
    object: 'event';
};

export function verifyWebhook(
    headers: Record<string, string>,
    rawBody: string | Buffer,
    secret: string,
): IdpWebhookEvent {
    const wh = new Webhook(secret);
    const payload = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    return wh.verify(payload, headers) as IdpWebhookEvent;
}
