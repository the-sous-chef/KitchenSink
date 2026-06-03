import type { AuthorizerContext } from '../../types/index.js';

export interface AuthorizerContextSocket {
    readonly handshake?: {
        readonly headers?: Record<string, string | string[] | undefined>;
        readonly auth?: Record<string, unknown>;
    };
    auth?: AuthorizerContext;
}

export function resolveWsAuthorizerContext(socket: AuthorizerContextSocket): AuthorizerContext {
    const fromAuth = socket.handshake?.auth?.authorizerContext;
    const fromHeader = socket.handshake?.headers?.['x-authorizer-context'];
    const candidate = typeof fromHeader === 'string' ? decodeHeader(fromHeader) : fromAuth;

    if (!isAuthorizerContext(candidate)) {
        throw new Error('Missing authorizer context');
    }

    socket.auth = candidate;

    return candidate;
}

function decodeHeader(header: string): unknown {
    try {
        return JSON.parse(Buffer.from(header, 'base64').toString('utf-8')) as unknown;
    } catch {
        return undefined;
    }
}

function isAuthorizerContext(value: unknown): value is AuthorizerContext {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const ctx = value as Partial<AuthorizerContext>;

    return (
        typeof ctx.userId === 'string' &&
        Array.isArray(ctx.scopes) &&
        Array.isArray(ctx.permissions) &&
        ctx.tokenType === 'user'
    );
}
