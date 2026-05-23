import { IsUUID } from 'class-validator';
import type { UserStatus } from '@kitchensink/auth-types';

export class AdminUserIdParamDto {
    @IsUUID(4)
    userId!: string;
}

export class AdminGetUserResponseDto {
    readonly id!: string;
    readonly auth0Sub!: string;
    readonly email!: string;
    readonly status!: UserStatus;
    readonly createdAt!: string;
    readonly updatedAt!: string;
    readonly deletedAt!: string | null;
    readonly subscriptionTier!: 'free' | 'premium';
}

export class AdminSuspendUserResponseDto {
    sub!: string;
    status!: 'suspended';
    suspendedAt!: string;
}

export class AdminUnsuspendUserResponseDto {
    sub!: string;
    status!: 'active';
    unsuspendedAt!: string;
}

export class ImpersonationStartResponseDto {
    impersonatorSub!: string;
    impersonatedSub!: string;
    sessionId!: string;
    startedAt!: string;
}

export class ImpersonationStopResponseDto {
    impersonatorSub!: string;
    impersonatedSub!: string;
    stoppedAt!: string;
    message!: string;
}

export class AdminAuditLogDto {
    readonly impersonatorSub!: string;
    readonly impersonatedSub!: string;
    readonly action!: string;
    readonly timestamp!: string;
    readonly success!: boolean;
    readonly failureReason?: string;
}
