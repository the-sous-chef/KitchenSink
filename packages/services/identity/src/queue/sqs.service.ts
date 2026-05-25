import { Inject, Injectable, Logger } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

export const SQS_CLIENT = 'SQS_CLIENT';

@Injectable()
export class SqsService {
    private readonly logger = new Logger(SqsService.name);

    constructor(@Inject(SQS_CLIENT) private readonly sqs: SQSClient) {}

    async enqueueDeletion(auth0Id: string, userId: string, failureReason: string): Promise<void> {
        const queueUrl = process.env.DELETION_QUEUE_URL;

        if (!queueUrl) {
            this.logger.warn('DELETION_QUEUE_URL not configured, skipping enqueue');

            return;
        }

        const message = {
            auth0Id,
            userId,
            enqueuedAt: new Date().toISOString(),
            failureReason,
        };

        await this.sqs.send(
            new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: JSON.stringify(message),
            }),
        );

        this.logger.log('enqueued deletion message', JSON.stringify({ auth0Id, userId }));
    }
}
