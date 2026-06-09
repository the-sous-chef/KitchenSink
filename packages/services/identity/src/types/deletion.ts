import type { UserId } from './user.js';

export interface UserDeletionQueueMessage {
    userId: UserId;
    requestedAt: string;
    correlationId: string;
    reason: 'user_request' | 'admin_request' | 'compliance';
    source: 'identity-service' | 'identity-webhooks';
}
