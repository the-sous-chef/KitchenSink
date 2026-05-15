import { Module, Global } from '@nestjs/common';
import { users, profiles } from './schema.js';
import { accounts } from './schema.js';
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
                    host: process.env.DB_HOST,
                    port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
                    database: process.env.DB_NAME,
                    user: process.env.DB_USERNAME,
                    password: process.env.DB_PASSWORD,
                    max: 20,
                    idleTimeoutMillis: 30_000,
                    connectionTimeoutMillis: 5_000,
                });

                const db = drizzle(pool, { schema: { users, accounts, profiles } });

                return db;
            },
        },
    ],
    exports: [DrizzleProvider],
})
export class DatabaseModule {}
