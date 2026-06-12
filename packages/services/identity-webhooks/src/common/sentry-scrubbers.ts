/**
 * Shared PII scrubbers for Sentry error events and log entries.
 *
 * KTD8: `sendDefaultPii` is off everywhere, but identity-adjacent data can still reach Sentry
 * through error context and log attributes. These scrubbers strip a concrete denylist of keys and
 * redact bearer-token-shaped strings before anything leaves the host. The denylist and matcher are
 * exported so every surface (and its tests) can assert against the same contract.
 */

/** Keys whose values are always redacted, matched case-insensitively. */
export const DENYLIST_KEYS: readonly string[] = [
    'email',
    'password',
    'token',
    'authorization',
    'name',
    'picture',
    'avatarurl',
    'imageurl',
];

const DENYLIST = new Set(DENYLIST_KEYS);

/** Three dot-separated base64url segments — a JWT / bearer token shape. */
const BEARER_PATTERN = /[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/;

const REDACTED = '[redacted]';

/** True when a key name should have its value redacted regardless of content. */
export const isDeniedKey = (key: string): boolean => DENYLIST.has(key.toLowerCase());

/** True when a string looks like a JWT / bearer token. */
export const looksLikeBearerToken = (value: string): boolean => BEARER_PATTERN.test(value);

const scrubUnknown = (value: unknown): unknown => {
    if (typeof value === 'string') {
        return looksLikeBearerToken(value) ? REDACTED : value;
    }

    if (Array.isArray(value)) {
        return value.map(scrubUnknown);
    }

    if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};

        for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
            out[key] = isDeniedKey(key) ? REDACTED : scrubUnknown(nested);
        }

        return out;
    }

    return value;
};

/** Deep-scrub an arbitrary structure: redact denied keys and bearer-shaped strings. Pure. */
export const scrubAttributes = <T>(value: T): T => scrubUnknown(value) as T;

/**
 * Structural shape of the parts of a Sentry error event we scrub. Declared locally rather than
 * imported because `@sentry/aws-serverless` re-exports runtime values from `@sentry/node` but not
 * the `Event`/`ErrorEvent` types.
 */
interface ScrubbableEvent {
    extra?: Record<string, unknown>;
    contexts?: Record<string, unknown>;
    tags?: Record<string, unknown>;
    request?: { data?: unknown };
    user?: { id?: string | number } & Record<string, unknown>;
}

/**
 * `beforeSend` hook: scrub the user-data-bearing parts of an error event without disturbing SDK
 * metadata. Preserves `user.id` (opaque) while scrubbing the rest of the user object.
 *
 * @sideEffect mutates and returns the event, as the Sentry `beforeSend` contract expects.
 */
export const scrubEvent = <T extends ScrubbableEvent>(event: T): T => {
    if (event.extra) {
        event.extra = scrubAttributes(event.extra);
    }

    if (event.contexts) {
        event.contexts = scrubAttributes(event.contexts);
    }

    if (event.tags) {
        event.tags = scrubAttributes(event.tags);
    }

    if (event.request?.data) {
        event.request.data = scrubAttributes(event.request.data);
    }

    if (event.user) {
        const id = event.user.id;
        event.user = { ...scrubAttributes(event.user), id };
    }

    return event;
};
