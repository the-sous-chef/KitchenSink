import { z } from 'zod';

import type { UserSub } from './user.js';

/** @implements REQ-001 REQ-009 REQ-CN-008 FR-001 FR-009 ARCH-001 MOD-001 */
export const CLAIM_NAMESPACE = 'https://kitchensink.app/claims/' as const;

/** @implements REQ-001 REQ-009 REQ-CN-008 FR-001 FR-009 ARCH-001 MOD-001 */
export type UserRole = 'user' | 'admin' | 'support';

/** @implements REQ-001 REQ-009 REQ-CN-008 FR-001 FR-009 ARCH-001 MOD-001 */
export interface Auth0Claims {
    iss: string;
    sub: UserSub;
    aud: string | string[];
    iat: number;
    exp: number;
    azp?: string;
    scope?: string;
    permissions?: string[];
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    'https://kitchensink.app/claims/roles'?: UserRole[];
    'https://kitchensink.app/claims/isM2M'?: boolean;
}

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
export const Auth0PostLoginPayloadSchema = z.object({
    sub: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    picture: z.string().url().optional(),
    identities: z
        .array(
            z.object({
                provider: z.string().optional(),
                user_id: z.string().optional(),
            }),
        )
        .optional(),
});

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
export type Auth0PostLoginPayload = z.infer<typeof Auth0PostLoginPayloadSchema>;

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
    'https://kitchensink.app/claims/sub'?: UserSub;
}

/** @implements REQ-001 REQ-009 FR-001 FR-009 ARCH-024 MOD-024 */
export interface Auth0TokenValidationInput {
    token: string;
    expectedAudience: string | string[];
    requiredScopes?: string[];
}

/** @implements REQ-009 FR-009 ARCH-024 MOD-024 */
export interface AuthorizerContext {
    sub: string;
    email?: string;
    scopes: string[];
    permissions: string[];
    isM2M: boolean;
    tokenType: 'user' | 'm2m';
}

/** @implements REQ-009 FR-009 ARCH-024 MOD-024 */
export type M2MContext = AuthorizerContext & {
    tokenType: 'm2m';
    isM2M: true;
};

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
