import type { UserId, UuidV4 } from './user.js';
import type { UserProfileAccountDto } from './account.js';
import type { UserProfileUserDto } from './user.js';

/** @implements REQ-014 REQ-015 REQ-019 FR-014 FR-015 FR-019 ARCH-015 MOD-015 */
export type ProfileId = UuidV4 & { readonly __brand: 'ProfileId' };

/** @implements REQ-005 REQ-006 REQ-039 FR-005 FR-006 FR-039 ARCH-003 MOD-003 */
export interface ProfileReadDto {
    id: ProfileId;
    userId: UserId;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    updatedAt: string;
}

/** @implements REQ-005 FR-005 ARCH-003 MOD-003 */
export interface CreateProfileDto {
    userId: UserId;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
}

/** @implements REQ-006 FR-006 ARCH-003 MOD-003 */
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
