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
    userId!: string;
    status!: 'suspended';
    suspendedAt!: string;
}

export class AdminUnsuspendUserResponseDto {
    userId!: string;
    status!: 'active';
    unsuspendedAt!: string;
}

export class ImpersonationStartResponseDto {
    impersonatorId!: string;
    impersonatedUserId!: string;
    sessionId!: string;
    startedAt!: string;
}

export class ImpersonationStopResponseDto {
    impersonatorId!: string;
    impersonatedUserId!: string;
    stoppedAt!: string;
    message!: string;
}

export class AdminAuditLogDto {
    readonly impersonatorId!: string;
    readonly impersonatedUserId!: string;
    readonly action!: string;
    readonly timestamp!: string;
    readonly success!: boolean;
    readonly failureReason?: string;
}
