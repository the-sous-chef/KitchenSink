import type { UserSub } from './user.js';

export type AccountId = string & { readonly __brand: 'AccountId' };

export type AccountTier = 'free' | 'premium';

export interface AccountModel {
    id: AccountId;
    ownerSub: UserSub;
    tier: AccountTier;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAccountDto {
    ownerSub: UserSub;
    tier?: AccountTier;
}

export interface UpdateAccountDto {
    tier?: AccountTier;
}

export interface UserProfileAccountDto {
    readonly id: string;
    readonly ownerSub: UserSub;
    tier: AccountTier;
    readonly createdAt: string;
    updatedAt: string;
}
