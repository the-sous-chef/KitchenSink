import { Module, Global } from '@nestjs/common';
import { users, accounts, profiles } from './schema/index.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const { Pool } = pg;

export const DrizzleProvider = 'DRIZZLE_CONNECTION';

@Global()
@Module({
    providers: [
        {
            provide: DrizzleProvider,
            async useFactory() {
                const pool = new Pool({
                    connectionString: process.env.DATABASE_URL,
                    max: 20,
                    idleTimeoutMillis: 30_000,
                    connectionTimeoutMillis: 5_000,
                });

                return drizzle(pool, { schema: { users, accounts, profiles } });
            },
        },
    ],
    exports: [DrizzleProvider],
})
export class DatabaseModule {}
