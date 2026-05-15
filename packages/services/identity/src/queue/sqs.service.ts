import { Inject, Injectable, Logger } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';
import type { UserDeletionQueueMessage } from '@kitchensink/auth-types';

export const SQS_CLIENT = 'SQS_CLIENT';

@Injectable()
export class SqsService {
    private readonly logger = new Logger(SqsService.name);

    constructor(@Inject(SQS_CLIENT) private readonly sqs: SQSClient) {}

    async enqueueDeletion(
        auth0Sub: string,
        userId: string,
        reason: UserDeletionQueueMessage['reason'] = 'user_request',
    ): Promise<void> {
        const queueUrl = process.env.DELETION_QUEUE_URL;

        if (!queueUrl) {
            this.logger.warn('DELETION_QUEUE_URL not configured, skipping enqueue');

            return;
        }

        const message: UserDeletionQueueMessage = {
            userId: userId as UserDeletionQueueMessage['userId'],
            auth0Sub,
            requestedAt: new Date().toISOString(),
            correlationId: randomUUID(),
            reason,
            source: 'identity-service',
        };

        await this.sqs.send(
            new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: JSON.stringify(message),
            }),
        );

        this.logger.log('enqueued deletion message', JSON.stringify({ auth0Sub, userId }));
    }
}
