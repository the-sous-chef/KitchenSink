export const SECRET_PATHS = {
    prod: 'kitchensink/prod/auth/keys',
    sandbox: 'kitchensink/sandbox/auth/keys',
} as const;

export const SSM_BASE_PATHS = {
    jwksUrl: '/kitchensink/clerk/jwks-url',
    issuer: '/kitchensink/clerk/issuer',
    audience: '/kitchensink/clerk/audience',
} as const;

/**
 * Sentry DSNs follow the org-standard stage-first SSM layout — `kitchensink/{stage}/{service}/{key}`
 * — matching Secrets Manager (`kitchensink/{stage}/auth/keys`). The clerk params above predate this
 * convention and keep their legacy `{service}/{key}/{stage}` layout.
 */
export function sentryDsnPath(stage: string, key: 'webhook-dsn' | 'log-drain-dsn'): string {
    return `/kitchensink/${stage}/sentry/${key}`;
}

export function getAuthSecretName(stage: string): string {
    return stage === 'prod' ? SECRET_PATHS.prod : SECRET_PATHS.sandbox;
}
