import { Controller, Get, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CurrentAuthorizerContext } from '../auth/decorators/current-user.decorator';
import type { AuthorizerContext } from '../auth/decorators/current-user.decorator';
import {
    AdminGetUserResponseDto,
    AdminSuspendUserResponseDto,
    AdminUnsuspendUserResponseDto,
    ImpersonationStartResponseDto,
    ImpersonationStopResponseDto,
} from './dto/admin.dto';

@Controller('v1/admin/users')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get(':userId')
    async getUser(
        @Param('userId') userId: string,
        @CurrentAuthorizerContext() ctx: AuthorizerContext,
    ): Promise<AdminGetUserResponseDto> {
        return this.adminService.getUser(userId, ctx);
    }

    @Post(':userId/suspend')
    @HttpCode(HttpStatus.OK)
    async suspendUser(
        @Param('userId') userId: string,
        @CurrentAuthorizerContext() ctx: AuthorizerContext,
    ): Promise<AdminSuspendUserResponseDto> {
        return this.adminService.suspendUser(userId, ctx);
    }

    @Post(':userId/unsuspend')
    @HttpCode(HttpStatus.OK)
    async unsuspendUser(
        @Param('userId') userId: string,
        @CurrentAuthorizerContext() ctx: AuthorizerContext,
    ): Promise<AdminUnsuspendUserResponseDto> {
        return this.adminService.unsuspendUser(userId, ctx);
    }

    @Post(':userId/impersonation/start')
    @HttpCode(HttpStatus.OK)
    async startImpersonation(
        @Param('userId') userId: string,
        @CurrentAuthorizerContext() ctx: AuthorizerContext,
    ): Promise<ImpersonationStartResponseDto> {
        return this.adminService.startImpersonation(userId, ctx);
    }

    @Post(':userId/impersonation/stop')
    @HttpCode(HttpStatus.OK)
    async stopImpersonation(
        @Param('userId') userId: string,
        @CurrentAuthorizerContext() ctx: AuthorizerContext,
    ): Promise<ImpersonationStopResponseDto> {
        return this.adminService.stopImpersonation(userId, ctx);
    }
}
