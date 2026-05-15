'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoginButtonProps {
    returnTo?: string;
    children?: React.ReactNode;
}

export function LoginButton({ returnTo = '/profile', children }: LoginButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        setIsLoading(true);

        router.push(`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    };

    return (
        <button type="button" onClick={handleLogin} disabled={isLoading} aria-busy={isLoading}>
            {children ?? 'Sign in with Auth0'}
        </button>
    );
}
