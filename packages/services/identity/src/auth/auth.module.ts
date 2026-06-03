import { Module, Global } from '@nestjs/common';

import { AuthMiddleware } from './middleware/auth.middleware.js';

@Global()
@Module({
    providers: [AuthMiddleware],
    exports: [AuthMiddleware],
})
export class AuthModule {}
