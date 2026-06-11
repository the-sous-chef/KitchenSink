import { z } from 'zod';

const DatabaseConfigSchema = z.union([
    z.object({
        DATABASE_URL: z.string().url(),
    }),
    z.object({
        DB_HOST: z.string(),
        DB_PORT: z.string().transform(Number).pipe(z.number().int().positive()),
        DB_NAME: z.string(),
        DB_USERNAME: z.string(),
        DB_PASSWORD: z.string(),
    }),
]);

const QueueConfigSchema = z.object({
    DELETION_QUEUE_URL: z.string().url(),
});

const AppConfigSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3001'),
    STAGE: z.enum(['dev', 'staging', 'production']).default('dev'),
});

export const EnvironmentSchema = z.object({
    ...AppConfigSchema.shape,
    ...QueueConfigSchema.shape,
}).and(DatabaseConfigSchema);

export type Environment = z.infer<typeof EnvironmentSchema>;

export function resolveEnvironment(): Environment {
    return EnvironmentSchema.parse(process.env);
}
