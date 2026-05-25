import { Module, Global } from '@nestjs/common';

import { Auth0Service } from './auth0.service.js';
import { AuthMiddleware } from './middleware/auth.middleware.js';

@Global()
@Module({
    providers: [Auth0Service, AuthMiddleware],
    exports: [Auth0Service, AuthMiddleware],
})
export class AuthModule {}
