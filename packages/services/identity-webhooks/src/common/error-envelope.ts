import type { Context } from 'aws-lambda';

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
export interface ErrorEnvelope {
    code: string;
    message: string;
    requestId: string;
    cause?: unknown;
}

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
export const buildErrorEnvelope = (
    code: string,
    message: string,
    requestId: string,
    cause?: unknown,
): ErrorEnvelope => ({
    code,
    message,
    requestId,
    ...(cause === undefined ? {} : { cause }),
});

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
export const resolveRequestId = (context: Context, candidate?: string | undefined): string => {
    if (candidate && candidate.length > 0) {
        return candidate;
    }

    return context.awsRequestId;
};

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
export const getErrorCause = (error: unknown): unknown => {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
        };
    }

    return error;
};
