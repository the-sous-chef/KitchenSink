import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth0, revokeRefreshToken } from '@/lib/auth0';

const protectedPaths = ['/profile', '/account', '/settings'];

/**
 * Validates that a returnTo value is a safe relative path.
 * Rejects anything that could be used as an open redirect (absolute URLs,
 * protocol-relative URLs, or paths starting with double slashes).
 */
export function safeReturnTo(pathname: string, search: string): string {
    const candidate = `${pathname}${search}`;
    // Must start with a single '/' and not be protocol-relative (//host)
    if (!candidate.startsWith('/') || candidate.startsWith('//')) {
        return '/';
    }
    return candidate;
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname === '/api/auth/logout') {
        // Attempt refresh-token revocation; always proceed with logout even on failure.
        try {
            const session = await auth0.getSession(req);
            await revokeRefreshToken(session?.tokenSet.refreshToken);
        } catch {
            // Revocation failure must not block local session cleanup.
        }

        return auth0.middleware(req);
    }

    const authResponse = await auth0.middleware(req);

    const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

    if (isProtected) {
        const session = await auth0.getSession(req);

        if (!session) {
            const loginUrl = new URL('/api/auth/login', req.url);
            // Validate returnTo to prevent open-redirect attacks.
            loginUrl.searchParams.set('returnTo', safeReturnTo(pathname, req.nextUrl.search));

            // Preserve any auth0 middleware response headers (e.g. set-cookie) on the redirect.
            const redirectResponse = NextResponse.redirect(loginUrl);
            authResponse.headers.forEach((value, key) => {
                redirectResponse.headers.set(key, value);
            });
            return redirectResponse;
        }
    }

    return authResponse;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|public/).*)'],
};
