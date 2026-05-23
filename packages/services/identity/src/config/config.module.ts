import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvironmentSchema } from './env.schema.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: (config: Record<string, unknown>) => EnvironmentSchema.parse(config),
        }),
    ],
    exports: [ConfigModule],
})
export class AppConfigModule {}
