'use client';

import { SignInButton } from '@clerk/nextjs';

interface LoginButtonProps {
    returnTo?: string;
    children?: React.ReactNode;
}

export function LoginButton({ returnTo = '/profile', children }: LoginButtonProps) {
    return (
        <SignInButton mode="modal" forceRedirectUrl={returnTo}>
            <button type="button">{children ?? 'Sign in'}</button>
        </SignInButton>
    );
}
