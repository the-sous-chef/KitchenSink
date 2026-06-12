import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/profile(.*)', '/account(.*)', '/settings(.*)']);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    // `sentry-tunnel` is excluded so Clerk middleware never intercepts Sentry's tunnel route — a
    // known Clerk + @sentry/nextjs interaction that breaks middleware detection (U9 / KTD pitfall).
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|public/|sentry-tunnel).*)',
        '/(api|trpc)(.*)',
    ],
};
