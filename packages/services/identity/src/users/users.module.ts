import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { AvatarUploadController } from './avatar-upload.controller.js';
import { UsersService } from './users.service.js';
import { ResolveUserService } from './resolveUser.js';

@Module({
    controllers: [UsersController, AvatarUploadController],
    providers: [UsersService, ResolveUserService],
    exports: [UsersService, ResolveUserService],
})
export class UsersModule {}
