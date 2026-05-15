import { GetQueueAttributesCommand, SQSClient } from '@aws-sdk/client-sqs';

/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
const sqsClient = new SQSClient({});

/** @implements REQ-025 REQ-026 REQ-IF-005 REQ-CN-001 FR-025 FR-026 ARCH-017 MOD-017 */
export const getDeletionQueueReceiveStats = async (
    queueUrl: string,
): Promise<{
    visible: number;
    inFlight: number;
}> => {
    const response = await sqsClient.send(
        new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible'],
        }),
    );

    return {
        visible: Number(response.Attributes?.ApproximateNumberOfMessages ?? '0'),
        inFlight: Number(response.Attributes?.ApproximateNumberOfMessagesNotVisible ?? '0'),
    };
};
