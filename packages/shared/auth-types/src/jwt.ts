import type { UserId, UserStatus } from './user.js';

/** @implements REQ-001 REQ-009 REQ-CN-008 FR-001 FR-009 ARCH-001 MOD-001 */
export interface Auth0AccessTokenClaims {
    iss: string;
    sub: string;
    aud: string | string[];
    iat: number;
    exp: number;
    azp?: string;
    scope?: string;
    permissions?: string[];
    'https://kitchensink.dev/userId'?: UserId;
}

/** @implements REQ-001 REQ-009 FR-001 FR-009 ARCH-024 MOD-024 */
export interface Auth0TokenValidationInput {
    token: string;
    expectedAudience: string | string[];
    requiredScopes?: string[];
}

/** @implements REQ-009 FR-009 ARCH-024 MOD-024 */
export interface AuthorizerContext {
    principalId: string;
    userId: UserId;
    auth0Sub: string;
    scope: string[];
    audience: string[];
    issuedAt: number;
    expiresAt: number;
    status: UserStatus;
}

/** @implements REQ-001 REQ-009 FR-001 FR-009 ARCH-024 MOD-024 */
export interface ApiGatewayAuthorizerResult {
    principalId: string;
    policyDocument: {
        Version: '2012-10-17';
        Statement: Array<{
            Action: 'execute-api:Invoke';
            Effect: 'Allow' | 'Deny';
            Resource: string | string[];
        }>;
    };
    context: AuthorizerContext;
}
