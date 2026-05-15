/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
export type AuthErrorCode =
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'TOKEN_EXPIRED'
    | 'TOKEN_INVALID'
    | 'USER_NOT_FOUND'
    | 'USER_SUSPENDED'
    | 'ACCOUNT_NOT_FOUND'
    | 'PROFILE_NOT_FOUND'
    | 'INTERNAL_ERROR';

/** @implements REQ-IF-006 NFR-012 NFR-013 NFR-014 NFR-016 NFR-017 ARCH-027 ARCH-028 ARCH-029 MOD-027 MOD-028 MOD-029 */
export interface AuthErrorEnvelope {
    code: AuthErrorCode;
    message: string;
    requestId: string;
    cause?: unknown;
}
