import './instrument.js';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { NestSentryLogger } from './observability/sentry-logging.js';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule, { logger: new NestSentryLogger() });
    const port = Number.parseInt(process.env['PORT'] ?? '3001', 10);

    await app.listen(port);
}

await bootstrap();
