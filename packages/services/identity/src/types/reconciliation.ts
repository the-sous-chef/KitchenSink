import type { UserStatus } from './user.js';
import type { UserId } from './user.js';

export interface ReconciliationUserDrift {
    userId: UserId;
    emailMismatch: {
        expected: string;
        actual: string;
    } | null;
    statusMismatch: {
        expected: UserStatus;
        actual: UserStatus;
    } | null;
    missingInAuth0: boolean;
    missingInIdentityStore: boolean;
}

export interface ReconciliationDiffPayload {
    generatedAt: string;
    totalCompared: number;
    driftCount: number;
    drifts: ReconciliationUserDrift[];
}

export interface ReconciliationQueueMessage {
    generatedAt: string;
    correlationId: string;
    payload: ReconciliationDiffPayload;
}
