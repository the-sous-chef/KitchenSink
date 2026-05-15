import { z } from 'zod';

/**
 * @module config
 * @description Zod environment variable schema for the identity service.
 * All config is validated at bootstrap; invalid env causes fatal startup error.
 * @implements REQ-035 ARCH-015 MOD-015
 */

/** @implements REQ-035 ARCH-015 MOD-015 */
const DatabaseConfigSchema = z.object({
    DB_HOST: z.string().min(1),
    DB_PORT: z.string().transform(Number).pipe(z.number().int().positive()),
    DB_NAME: z.string().min(1),
    DB_USERNAME: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
});

/** @implements REQ-035 ARCH-015 MOD-015 */
const Auth0ConfigSchema = z.object({
    AUTH0_DOMAIN: z.string().min(1),
    AUTH0_AUDIENCE: z.string().min(1),
    AUTH0_CLIENT_ID: z.string().min(1),
    AUTH0_CLIENT_SECRET: z.string().min(1),
});

/** @implements REQ-035 ARCH-015 MOD-015 */
const QueueConfigSchema = z.object({
    DELETION_QUEUE_URL: z.string().url(),
});

/** @implements REQ-035 ARCH-015 MOD-015 */
const AppConfigSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3001'),
    STAGE: z.enum(['dev', 'staging', 'production']).default('dev'),
});

/** @implements REQ-035 ARCH-015 MOD-015 */
export const EnvironmentSchema = z.object({
    ...AppConfigSchema.shape,
    ...DatabaseConfigSchema.shape,
    ...Auth0ConfigSchema.shape,
    ...QueueConfigSchema.shape,
});

/** @implements REQ-035 ARCH-015 MOD-015 */
export type Environment = z.infer<typeof EnvironmentSchema>;

/**
 * Validates and returns the full resolved environment object.
 * @throws {z.ZodError} if any required variable is missing or invalid.
 * @implements REQ-035 ARCH-015 MOD-015
 */
export function resolveEnvironment(): Environment {
    return EnvironmentSchema.parse(process.env);
}
