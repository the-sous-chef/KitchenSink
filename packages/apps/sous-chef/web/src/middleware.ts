import type { NextRequest } from 'next/server';
import { auth0, revokeRefreshToken } from '@/lib/auth0';

const protectedPaths = ['/profile', '/account', '/settings'];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname === '/api/auth/logout') {
        const session = await auth0.getSession(req);
        await revokeRefreshToken(session?.tokenSet.refreshToken);

        return auth0.middleware(req);
    }

    const authResponse = await auth0.middleware(req);

    const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

    if (isProtected) {
        const session = await auth0.getSession(req);

        if (!session) {
            const loginUrl = new URL('/api/auth/login', req.url);
            loginUrl.searchParams.set('returnTo', `${pathname}${req.nextUrl.search}`);

            return Response.redirect(loginUrl);
        }
    }

    return authResponse;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|public/).*)'],
};
