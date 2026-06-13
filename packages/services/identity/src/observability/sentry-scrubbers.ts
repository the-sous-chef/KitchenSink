/**
 * Shared PII scrubbers for the identity service's Sentry error events and log entries (KTD8).
 *
 * Parallel to the identity-webhooks scrubber: `sendDefaultPii` is off, but the service handles user
 * email, name, and profile data, so these strip a concrete denylist and redact bearer-shaped strings
 * before anything leaves the host. Exported pieces let every init and its tests assert one contract.
 */

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

const BEARER_PATTERN = /[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/;

const REDACTED = '[redacted]';

export const isDeniedKey = (key: string): boolean => DENYLIST.has(key.toLowerCase());

export const looksLikeBearerToken = (value: string): boolean => BEARER_PATTERN.test(value);

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const BEARER_GLOBAL = /[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;

/** Redact email- and bearer-token-shaped substrings from free text (error messages, log bodies). */
export const scrubText = (text: string): string =>
    text.replace(BEARER_GLOBAL, REDACTED).replace(EMAIL_PATTERN, REDACTED);

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

interface ScrubbableEvent {
    message?: string;
    exception?: { values?: Array<{ value?: string }> };
    extra?: Record<string, unknown>;
    contexts?: Record<string, unknown>;
    tags?: Record<string, unknown>;
    request?: { data?: unknown };
    user?: { id?: string | number } & Record<string, unknown>;
}

/**
 * `beforeSend` hook: scrub user-data-bearing parts of an error event, preserving the opaque
 * `user.id` while redacting the rest of the user object.
 *
 * @sideEffect mutates and returns the event, per the Sentry `beforeSend` contract.
 */
export const scrubEvent = <T extends ScrubbableEvent>(event: T): T => {
    if (typeof event.message === 'string') {
        event.message = scrubText(event.message);
    }

    if (event.exception?.values) {
        for (const entry of event.exception.values) {
            if (typeof entry.value === 'string') {
                entry.value = scrubText(entry.value);
            }
        }
    }

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

interface ScrubbableLog {
    level?: string;
    message?: string;
    attributes?: Record<string, unknown>;
}

/**
 * `beforeSendLog` hook: drop debug logs, then redact PII from the message body and attributes.
 *
 * @sideEffect mutates and returns the log, as the Sentry `beforeSendLog` contract expects.
 */
export const scrubLog = <T extends ScrubbableLog>(log: T): T | null => {
    if (log.level === 'debug') {
        return null;
    }

    if (typeof log.message === 'string') {
        log.message = scrubText(log.message);
    }

    if (log.attributes) {
        log.attributes = scrubAttributes(log.attributes);
    }

    return log;
};
