import { Injectable } from '@nestjs/common';

@Injectable()
export class Auth0Service {
    async blockUser(_auth0Sub: string): Promise<void> {
        return;
    }

    async unblockUser(_auth0Sub: string): Promise<void> {
        return;
    }

    async deleteUser(_auth0Sub: string): Promise<void> {
        return;
    }

    async createPasswordResetTicket(_auth0Sub: string, _redirectUri: string): Promise<void> {
        return;
    }

    async enrollMFA(_auth0Sub: string): Promise<unknown> {
        return {};
    }

    async unenrollMFA(_enrollmentId: string): Promise<void> {
        return;
    }

    async linkAccounts(_auth0Sub: string, _provider: string, _accountId: string): Promise<void> {
        return;
    }

    async unlinkAccount(_auth0Sub: string, _provider: string, _accountId: string): Promise<void> {
        return;
    }
}
