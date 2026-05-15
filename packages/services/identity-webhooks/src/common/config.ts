import type { Context } from 'aws-lambda';

import { buildErrorEnvelope, getErrorCause } from './error-envelope.js';

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
export class ConfigError extends Error {
    public readonly envelope: ReturnType<typeof buildErrorEnvelope>;

    public constructor(code: string, message: string, context: Context, cause?: unknown) {
        super(message);
        this.name = 'ConfigError';
        this.envelope = buildErrorEnvelope(code, message, context.awsRequestId, getErrorCause(cause));
    }
}

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
export const requireEnv = (name: string): string => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
};
