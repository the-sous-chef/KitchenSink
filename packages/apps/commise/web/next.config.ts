import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    typedRoutes: true,
};

export default withSentryConfig(nextConfig, {
    org: 'radicle-co',
    project: 'commise-web',
    // Source-map upload at build (Vercel). Token is a build-time env var, never committed (U11).
    authToken: process.env['SENTRY_AUTH_TOKEN'],
    // Proxy Sentry through the app to dodge ad blockers. Kept out of the Clerk matcher (see middleware).
    tunnelRoute: '/sentry-tunnel',
    widenClientFileUpload: true,
    silent: !process.env['CI'],
});
