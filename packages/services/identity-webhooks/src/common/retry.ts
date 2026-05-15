/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
const sleep = async (ms: number): Promise<void> => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
export const getExponentialDelayMs = (attempt: number, baseMs: number, capMs: number): number => {
    const exp = Math.max(0, attempt - 1);

    return Math.min(capMs, baseMs * 2 ** exp);
};

/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
export const withExponentialRetry = async <T>(params: {
    maxAttempts: number;
    baseDelayMs: number;
    capDelayMs: number;
    run: (attempt: number) => Promise<T>;
    shouldRetry: (error: unknown) => boolean;
}): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= params.maxAttempts; attempt += 1) {
        try {
            return await params.run(attempt);
        } catch (error) {
            lastError = error;

            const canRetry = attempt < params.maxAttempts && params.shouldRetry(error);

            if (!canRetry) {
                throw error;
            }

            const delayMs = getExponentialDelayMs(attempt, params.baseDelayMs, params.capDelayMs);
            await sleep(delayMs);
        }
    }

    throw lastError;
};
