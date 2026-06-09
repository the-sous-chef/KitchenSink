import { z } from 'zod';

const IdpConfigSchema = z.object({
    IDP_SECRET_KEY: z.string().startsWith('sk_').optional(),
    AUTH_SECRET_ARN: z.string().min(1).optional(),
    IDP_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
    IDP_WEBHOOK_SECRET: z.string().min(1),
    IDP_JWKS_URL: z.string().url(),
    IDP_ISSUER: z.string().url(),
});

export const EnvironmentSchema = z
    .object({
        ...IdpConfigSchema.shape,
    })
    .refine((data) => data.IDP_SECRET_KEY || data.AUTH_SECRET_ARN, {
        message: 'Either IDP_SECRET_KEY or AUTH_SECRET_ARN must be provided',
        path: ['IDP_SECRET_KEY'],
    });

export type Environment = z.infer<typeof EnvironmentSchema>;

export function resolveEnvironment(): Environment {
    return EnvironmentSchema.parse(process.env);
}
