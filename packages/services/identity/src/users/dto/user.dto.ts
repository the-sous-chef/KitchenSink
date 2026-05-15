import { IsString, IsOptional, MaxLength, IsUrl, ValidateIf } from 'class-validator';
import type { UserStatus } from '@kitchensink/auth-types';

export class GetUserMeResponseDto {
    readonly id!: string;
    readonly auth0Sub!: string;
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
    subscriptionTier!: 'free' | 'premium';
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
    @ValidateIf((o: PatchUserMeBodyDto) => o.avatarUrl !== null)
    @IsUrl()
    avatarUrl?: string | null;
}

export class DeleteUserMeResponseDto {
    readonly userId!: string;
    readonly deletedAt!: string;
    readonly message!: string;
}

export class PasswordResetRequestDto {
    @IsString()
    readonly method!: 'email';
}

export class PasswordResetResponseDto {
    readonly message!: string;
}

export class MfaEnrollResponseDto {
    readonly message!: string;
    readonly enrollmentUri!: string;
}

export class MfaUnenrollBodyDto {
    @IsString()
    enrollmentId!: string;
}

export class MfaUnenrollResponseDto {
    readonly message!: string;
}

export class SocialLinkResponseDto {
    readonly message!: string;
}

export class SocialAccountBodyDto {
    @IsString()
    provider!: string;

    @IsString()
    accountId!: string;
}
