import { IsString, IsOptional, MaxLength, IsUrl, IsIn } from 'class-validator';
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
    @IsIn(['email'])
    readonly method!: 'email';
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

export class AdminSuspendUserResponseDto {
    readonly userId!: string;
    readonly status!: 'suspended';
    readonly suspendedAt!: string;
}

export class AdminUnsuspendUserResponseDto {
    readonly userId!: string;
    readonly status!: 'active';
    readonly unsuspendedAt!: string;
}

export class ImpersonationStartResponseDto {
    readonly impersonatorId!: string;
    readonly impersonatedUserId!: string;
    readonly sessionId!: string;
    readonly startedAt!: string;
}

export class ImpersonationStopResponseDto {
    readonly impersonatorId!: string;
    readonly impersonatedUserId!: string;
    readonly stoppedAt!: string;
    readonly message!: string;
}
