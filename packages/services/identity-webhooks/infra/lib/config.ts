export const SECRET_PATHS = {
    prod: 'kitchensink/prod/identity/keys',
    sandbox: 'kitchensink/sandbox/identity/keys',
} as const;

/**
 * Org-standard stage-first SSM layout — `/kitchensink/{stage}/{service}/{key}` — matching Secrets
 * Manager (`kitchensink/{stage}/identity/keys`). Covers both the clerk JWT-validation params and the
 * sentry DSNs.
 */
export function ssmParamPath(stage: string, service: 'clerk' | 'sentry', key: string): string {
    return `/kitchensink/${stage}/${service}/${key}`;
}

export function getAuthSecretName(stage: string): string {
    return stage === 'prod' ? SECRET_PATHS.prod : SECRET_PATHS.sandbox;
}
