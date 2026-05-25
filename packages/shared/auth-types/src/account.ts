import type { UserId } from './user.js';

export type AccountId = string & { readonly __brand: 'AccountId' };

export type AccountTier = 'free' | 'premium';

export interface AccountModel {
    id: AccountId;
    userId: UserId;
    subscriptionTier: AccountTier;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAccountDto {
    userId: UserId;
    subscriptionTier?: AccountTier;
}

export interface UpdateAccountDto {
    subscriptionTier?: AccountTier;
}

export interface UserProfileAccountDto {
    readonly id: string;
    readonly userId: UserId;
    subscriptionTier: AccountTier;
    readonly createdAt: string;
    updatedAt: string;
}
