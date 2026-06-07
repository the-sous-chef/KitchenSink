import { describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => {
    return {
        clerkMiddleware: (handler: unknown) => handler,
        createRouteMatcher: (patterns: string[]) => {
            return (req: { nextUrl: { pathname: string } }) =>
                patterns.some((p) => {
                    const prefix = p.replace('(.*)', '');

                    return req.nextUrl.pathname.startsWith(prefix);
                });
        },
    };
});

describe('middleware (IdP)', () => {
    it('exports a middleware function and matcher config', async () => {
        const mod = await import('@/middleware');

        expect(typeof mod.default).toBe('function');
        expect(mod.config).toBeDefined();
        expect(Array.isArray(mod.config.matcher)).toBe(true);
    });

    it('protects /profile, /account, /settings routes', async () => {
        const mod = await import('@/middleware');
        const protect = vi.fn();
        const fakeAuth = Object.assign(() => Promise.resolve({ protect }), { protect });

        await (mod.default as unknown as (a: unknown, r: unknown) => Promise<unknown>)(fakeAuth, {
            nextUrl: { pathname: '/profile' },
        });
        expect(protect).toHaveBeenCalled();

        protect.mockClear();
        await (mod.default as unknown as (a: unknown, r: unknown) => Promise<unknown>)(fakeAuth, {
            nextUrl: { pathname: '/account' },
        });
        expect(protect).toHaveBeenCalled();

        protect.mockClear();
        await (mod.default as unknown as (a: unknown, r: unknown) => Promise<unknown>)(fakeAuth, {
            nextUrl: { pathname: '/settings' },
        });
        expect(protect).toHaveBeenCalled();
    });

    it('does not protect public routes', async () => {
        const mod = await import('@/middleware');
        const protect = vi.fn();
        const fakeAuth = Object.assign(() => Promise.resolve({ protect }), { protect });

        await (mod.default as unknown as (a: unknown, r: unknown) => Promise<unknown>)(fakeAuth, {
            nextUrl: { pathname: '/' },
        });

        expect(protect).not.toHaveBeenCalled();
    });
});
