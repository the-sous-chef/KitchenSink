export const SECRET_PATHS = {
    prod: 'kitchensink/prod/auth/keys',
    sandbox: 'kitchensink/sandbox/auth/keys',
} as const;

export const SSM_BASE_PATHS = {
    jwksUrl: '/kitchensink/clerk/jwks-url',
    issuer: '/kitchensink/clerk/issuer',
    audience: '/kitchensink/clerk/audience',
} as const;

export function getAuthSecretName(stage: string): string {
    return stage === 'prod' ? SECRET_PATHS.prod : SECRET_PATHS.sandbox;
}
