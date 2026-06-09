import { Controller, Get, Patch, Delete, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CurrentAuthorizerContext } from '../auth/decorators/current-user.decorator.js';
import type { AuthorizerContext } from '../auth/decorators/current-user.decorator.js';
import { PatchUserMeBodyDto, DeleteUserMeResponseDto } from './dto/user.dto.js';

@Controller('v1/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('upsert')
    @HttpCode(HttpStatus.OK)
    async upsertUser(
        @CurrentAuthorizerContext() ctx: AuthorizerContext,
        @Body() body: { identityId: string; email: string; name?: string; picture?: string },
    ): Promise<{ id: string; created: boolean }> {
        return this.usersService.upsertUser(ctx, body);
    }

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
}
