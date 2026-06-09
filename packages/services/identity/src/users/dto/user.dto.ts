import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';
import type { UserStatus } from '../../types/index.js';

export class GetUserMeResponseDto {
    readonly id!: string;
    readonly email!: string;
    displayName!: string;
    avatarUrl!: string | null;
    status!: UserStatus;
    readonly createdAt!: string;
    updatedAt!: string;
}

export class AccountDto {
    readonly id!: string;
    readonly userId!: string;
    subscriptionTier!: string;
    readonly createdAt!: string;
    updatedAt!: string;
}

export class UserProfileResponseDto {
    user!: GetUserMeResponseDto;
    account!: AccountDto;
}

export class PatchUserMeBodyDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    displayName?: string;

    @IsOptional()
    @IsUrl()
    avatarUrl?: string | null;
}

export class DeleteUserMeResponseDto {
    readonly sub!: string;
    readonly deletedAt!: string;
    readonly message!: string;
}
