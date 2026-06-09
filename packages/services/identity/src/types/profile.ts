import type { UserId } from './user.js';
import type { UserProfileAccountDto } from './account.js';
import type { UserProfileUserDto } from './user.js';

export type ProfileId = string & { readonly __brand: 'ProfileId' };

export interface ProfileReadDto {
    id: ProfileId;
    userId: UserId;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    updatedAt: string;
}

export interface CreateProfileDto {
    userId: UserId;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
}

export interface UpdateProfileDto {
    displayName?: string;
    avatarUrl?: string | null;
    bio?: string | null;
    updatedAt?: string;
}

export interface UserProfile {
    user: UserProfileUserDto;
    account: UserProfileAccountDto;
}
