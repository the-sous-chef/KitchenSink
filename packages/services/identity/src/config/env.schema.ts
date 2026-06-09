import { z } from 'zod';

const DatabaseConfigSchema = z.object({
    DATABASE_URL: z.string().url(),
});

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
    ...DatabaseConfigSchema.shape,
    ...QueueConfigSchema.shape,
});

export type Environment = z.infer<typeof EnvironmentSchema>;

export function resolveEnvironment(): Environment {
    return EnvironmentSchema.parse(process.env);
}
