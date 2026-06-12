import { describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
    clerkMiddleware: (handler: unknown): unknown => handler,
    createRouteMatcher: () => (): boolean => false,
}));

import { config } from '@/middleware';

describe('clerk middleware matcher', () => {
    it('excludes the Sentry tunnel route so Clerk does not intercept it', () => {
        expect(config.matcher[0]).toContain('sentry-tunnel');
    });
});
