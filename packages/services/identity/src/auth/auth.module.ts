import { Module, Global, Provider } from '@nestjs/common';
import { ManagementClient } from 'auth0';

import { Auth0Service } from './auth0.service.js';

export const AUTH0_CLIENT = 'AUTH0_CLIENT';

const auth0ClientProvider: Provider = {
    provide: AUTH0_CLIENT,
    useFactory() {
        return new ManagementClient({
            domain: process.env.AUTH0_DOMAIN ?? '',
            audience: process.env.AUTH0_AUDIENCE ?? '',
            clientId: process.env.AUTH0_CLIENT_ID ?? '',
            clientSecret: process.env.AUTH0_CLIENT_SECRET ?? '',
        });
    },
};

@Global()
@Module({
    providers: [auth0ClientProvider, Auth0Service],
    exports: [AUTH0_CLIENT, Auth0Service],
})
export class AuthModule {}
