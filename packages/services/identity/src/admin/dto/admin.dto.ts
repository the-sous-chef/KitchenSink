import { IsString } from 'class-validator';

export class AdminUserIdParamDto {
    @IsString()
    userId!: string;
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
