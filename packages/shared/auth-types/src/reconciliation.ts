import type { UserStatus, UserSub } from './user.js';

/** @implements REQ-040 FR-040 ARCH-024 MOD-024 */
export interface ReconciliationUserDrift {
    userSub: UserSub;
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

/** @implements REQ-040 FR-040 ARCH-024 MOD-024 */
export interface ReconciliationDiffPayload {
    generatedAt: string;
    totalCompared: number;
    driftCount: number;
    drifts: ReconciliationUserDrift[];
}

/** @implements REQ-040 FR-040 ARCH-024 MOD-024 */
export interface ReconciliationQueueMessage {
    generatedAt: string;
    correlationId: string;
    payload: ReconciliationDiffPayload;
}
