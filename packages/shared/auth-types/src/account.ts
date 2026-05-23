import type { UserSub } from './user.js';

/** @implements REQ-013 REQ-014 REQ-017 REQ-018 FR-013 FR-014 FR-017 FR-018 ARCH-012 MOD-012 */
export type AccountId = string & { readonly __brand: 'AccountId' };

/** @implements REQ-005 REQ-006 REQ-039 FR-005 FR-006 FR-039 ARCH-003 MOD-003 */
export interface AccountModel {
    id: AccountId;
    userSub: UserSub;
    provider: string;
    providerAccountId: string;
    createdAt: string;
    updatedAt: string;
}

/** @implements REQ-005 REQ-039 FR-005 FR-039 ARCH-003 MOD-003 */
export interface CreateAccountDto {
    userSub: UserSub;
    provider: string;
    providerAccountId: string;
}

/** @implements REQ-006 FR-006 ARCH-003 MOD-003 */
export interface UpdateAccountDto {
    provider?: string;
    providerAccountId?: string;
    updatedAt?: string;
}

export interface UserProfileAccountDto {
    readonly id: string;
    readonly userSub: UserSub;
    subscriptionTier: 'free' | 'premium';
    readonly createdAt: string;
    updatedAt: string;
}
