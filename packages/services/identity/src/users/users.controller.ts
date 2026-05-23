import { Controller, Get, Patch, Delete, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CurrentAuthorizerContext } from '../auth/decorators/current-user.decorator.js';
import type { AuthorizerContext } from '../auth/decorators/current-user.decorator.js';
import {
    PatchUserMeBodyDto,
    DeleteUserMeResponseDto,
    PasswordResetResponseDto,
    MfaEnrollResponseDto,
    MfaUnenrollBodyDto,
    MfaUnenrollResponseDto,
    SocialLinkResponseDto,
    SocialAccountBodyDto,
} from './dto/user.dto.js';

@Controller('v1/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('me')
    async getUserMe(@CurrentAuthorizerContext() ctx: AuthorizerContext) {
        return this.usersService.getUserMe(ctx);
    }

    @Patch('me')
    async patchUserMe(@CurrentAuthorizerContext() ctx: AuthorizerContext, @Body() body: PatchUserMeBodyDto) {
        return this.usersService.patchUserMe(ctx, body);
    }

    @Delete('me')
    @HttpCode(HttpStatus.ACCEPTED)
    async deleteUserMe(@CurrentAuthorizerContext() ctx: AuthorizerContext): Promise<DeleteUserMeResponseDto> {
        return this.usersService.deleteUserMe(ctx);
    }

    @Post('me/password-reset')
    @HttpCode(HttpStatus.OK)
    async requestPasswordReset(@CurrentAuthorizerContext() ctx: AuthorizerContext): Promise<PasswordResetResponseDto> {
        return this.usersService.requestPasswordReset(ctx.email ?? '');
    }

    @Post('me/mfa/enroll')
    @HttpCode(HttpStatus.OK)
    async enrollMFA(@CurrentAuthorizerContext() ctx: AuthorizerContext): Promise<MfaEnrollResponseDto> {
        return this.usersService.enrollMFA(ctx.sub);
    }

    @Post('me/mfa/unenroll')
    @HttpCode(HttpStatus.OK)
    async unenrollMFA(
        @CurrentAuthorizerContext() _ctx: AuthorizerContext,
        @Body() body: MfaUnenrollBodyDto,
    ): Promise<MfaUnenrollResponseDto> {
        return this.usersService.unenrollMFA(body.enrollmentId);
    }

    @Post('me/social/link')
    @HttpCode(HttpStatus.OK)
    async linkSocialAccount(
        @CurrentAuthorizerContext() ctx: AuthorizerContext,
        @Body() body: SocialAccountBodyDto,
    ): Promise<SocialLinkResponseDto> {
        return this.usersService.linkSocialAccount(ctx.sub, body.provider, body.accountId);
    }

    @Post('me/social/unlink')
    @HttpCode(HttpStatus.OK)
    async unlinkSocialAccount(
        @CurrentAuthorizerContext() ctx: AuthorizerContext,
        @Body() body: SocialAccountBodyDto,
    ): Promise<SocialLinkResponseDto> {
        return this.usersService.unlinkSocialAccount(ctx.sub, body.provider, body.accountId);
    }
}
