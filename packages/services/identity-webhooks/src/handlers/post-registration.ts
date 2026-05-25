import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { buildErrorEnvelope, resolveRequestId } from '../common/error-envelope.js';
import { logger, withObservability } from '../common/observability.js';

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
const innerHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const requestId = resolveRequestId(context, event.requestContext.requestId);

    logger.warn('post-registration: endpoint superseded by post-login upsert handler', { requestId });

    return {
        statusCode: 410,
        body: JSON.stringify(
            buildErrorEnvelope(
                'ENDPOINT_SUPERSEDED',
                'This endpoint is superseded. Use /webhooks/post-login instead.',
                requestId,
            ),
        ),
    };
};

/** @implements REQ-013 REQ-014 REQ-015 REQ-016 REQ-IF-008 REQ-CN-003 FR-013 FR-014 FR-015 FR-016 ARCH-010 ARCH-011 MOD-010 MOD-011 */
export const handler = withObservability(innerHandler);
