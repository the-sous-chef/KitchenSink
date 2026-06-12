import * as Sentry from '@sentry/nestjs';

import { scrubAttributes, scrubEvent } from './observability/sentry-scrubbers.js';

/**
 * Sentry initialization for the identity service (KTD3).
 *
 * Loaded via `node --import ./dist/src/instrument.js` (see Dockerfile / start scripts) so it runs
 * before any instrumented module in this native-ESM service; also imported first in `main.ts` as a
 * belt-and-suspenders for manual capture + the global filter. Inert when `SENTRY_DSN` is absent,
 * preserving local-dev ergonomics.
 */

const sentryDsn = process.env['SENTRY_DSN'];

if (sentryDsn) {
    Sentry.init({
        dsn: sentryDsn,
        environment: process.env['STAGE'] ?? 'dev',
        release: process.env['SENTRY_RELEASE'],
        tracesSampleRate: Number(process.env['SENTRY_TRACES_SAMPLE_RATE'] ?? '0'),
        enableLogs: true,
        sendDefaultPii: false,
        beforeSend: scrubEvent,
        beforeSendLog: (log) => {
            if (log.level === 'debug') {
                return null;
            }

            if (log.attributes) {
                log.attributes = scrubAttributes(log.attributes);
            }

            return log;
        },
    });
}
