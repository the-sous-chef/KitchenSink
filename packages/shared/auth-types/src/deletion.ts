import type { UserSub } from './user.js';

/** @implements REQ-025 FR-025 ARCH-024 MOD-024 */
export interface UserDeletionQueueMessage {
    userSub: UserSub;
    requestedAt: string;
    correlationId: string;
    reason: 'user_request' | 'admin_request' | 'compliance';
    source: 'identity-service' | 'identity-webhooks';
}
