import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';

import { AppConfigModule } from './config/config.module.js';
import { HealthModule } from './health/health.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { QueueModule } from './queue/queue.module.js';
import { UsersModule } from './users/users.module.js';
import { AdminModule } from './admin/admin.module.js';
import { AuthMiddleware } from './auth/middleware/auth.middleware.js';

@Module({
    imports: [AppConfigModule, HealthModule, DatabaseModule, AuthModule, QueueModule, UsersModule, AdminModule],
    controllers: [],
    providers: [
        {
            provide: ValidationPipe,
            useValue: new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        },
    ],
})
export class AppModule implements NestModule {
    public configure(consumer: MiddlewareConsumer): void {
        consumer.apply(AuthMiddleware).forRoutes('*');
    }
}
