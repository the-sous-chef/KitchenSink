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
    // Permissive: deploy stages include `prod` and `sandbox-*`/`mr-*`/`pr-*`, which a fixed enum
    // would reject now that STAGE is injected into the running container (U8).
    STAGE: z.string().min(1).default('dev'),
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_TRACES_SAMPLE_RATE: z.string().optional(),
    SENTRY_RELEASE: z.string().optional(),
});

export const EnvironmentSchema = z
    .object({
        ...AppConfigSchema.shape,
        ...QueueConfigSchema.shape,
    })
    .and(DatabaseConfigSchema);

export type Environment = z.infer<typeof EnvironmentSchema>;

export function resolveEnvironment(): Environment {
    return EnvironmentSchema.parse(process.env);
}
