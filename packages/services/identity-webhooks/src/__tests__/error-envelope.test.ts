import { describe, expect, it } from 'vitest';

import { buildErrorEnvelope, getErrorCause, resolveRequestId } from '../common/error-envelope.js';

describe('error-envelope helpers', () => {
    it('UTS-032-A1 [MOD-032]: builds envelope without optional cause when none provided', () => {
        expect(buildErrorEnvelope('TEST_CODE', 'Test message', 'req-1')).toEqual({
            code: 'TEST_CODE',
            message: 'Test message',
            requestId: 'req-1',
        });
    });

    it('UTS-032-A1 [MOD-032/cause]: builds envelope with cause payload when provided', () => {
        expect(buildErrorEnvelope('TEST_CODE', 'Test message', 'req-2', { detail: 'extra' })).toEqual({
            code: 'TEST_CODE',
            message: 'Test message',
            requestId: 'req-2',
            cause: { detail: 'extra' },
        });
    });

    it('UTS-032-A1 [MOD-032/request-id]: prefers explicit request id over lambda context id', () => {
        const context = {
            awsRequestId: 'aws-req-id',
        } as import('aws-lambda').Context;

        expect(resolveRequestId(context, 'upstream-id')).toBe('upstream-id');
    });

    it('UTS-032-A2 [MOD-032/fallback-id]: falls back to lambda context request id when upstream candidate is absent', () => {
        const context = {
            awsRequestId: 'aws-req-id',
        } as import('aws-lambda').Context;

        expect(resolveRequestId(context)).toBe('aws-req-id');
        expect(resolveRequestId(context, '')).toBe('aws-req-id');
    });

    it('UTS-032-A1 [MOD-032/error-shape]: extracts sanitized error shape from Error instances', () => {
        const cause = getErrorCause(new Error('boom')) as { name: string; message: string; stack?: string };

        expect(cause.name).toBe('Error');
        expect(cause.message).toBe('boom');
        expect(typeof cause.stack).toBe('string');
    });

    it('UTS-032-A2 [MOD-032/non-error]: returns non-error causes unchanged', () => {
        const raw = { code: 'x' };

        expect(getErrorCause(raw)).toBe(raw);
    });
});
