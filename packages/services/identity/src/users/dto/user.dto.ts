import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';
import type { UserStatus } from '@kitchensink/auth-types';

export class GetUserMeResponseDto {
    readonly sub!: string;
    readonly email!: string;
    displayName!: string;
    avatarUrl!: string | null;
    status!: UserStatus;
    readonly createdAt!: string;
    updatedAt!: string;
}

export class AccountDto {
    readonly id!: string;
    readonly ownerSub!: string;
    tier!: string;
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

export class PasswordResetResponseDto {
    readonly message!: string;
}

export class MfaEnrollResponseDto {
    readonly message!: string;
    readonly enrollmentUri!: string;
}

export class MfaUnenrollResponseDto {
    readonly message!: string;
}

export class SocialLinkResponseDto {
    readonly message!: string;
}
