import type { UserId } from './user.js';

export interface ClerkSessionClaims {
    sub: string;
    app_user_id: UserId;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    iat: number;
    exp: number;
    iss: string;
    azp?: string;
}

export type ClerkClaims = ClerkSessionClaims;

export interface AuthorizerContext {
    userId: UserId;
    email: string;
    clerkUserId: string;
    scopes: string[];
    permissions: string[];
    tokenType: 'user';
}

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
