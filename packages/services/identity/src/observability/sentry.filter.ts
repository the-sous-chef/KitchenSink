import { Catch, HttpException, type ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

/**
 * Whether an exception should be reported to Sentry. `HttpException`s (404, 401, 400, …) are
 * intentional control flow, not failures, so they are not captured (R12 / AE2).
 */
export const shouldCaptureException = (exception: unknown): boolean => !(exception instanceof HttpException);

/**
 * Global exception filter that reports unexpected exceptions to Sentry and then delegates to Nest's
 * default handling so the HTTP response is unchanged. Registered as `APP_FILTER` (the thin-subclass
 * alternative to `SentryGlobalFilter`), which keeps the capture decision testable.
 */
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
    public override catch(exception: unknown, host: ArgumentsHost): void {
        if (shouldCaptureException(exception)) {
            Sentry.captureException(exception);
        }

        super.catch(exception, host);
    }
}
