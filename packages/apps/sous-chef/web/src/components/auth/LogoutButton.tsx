'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
    children?: React.ReactNode;
}

export function LogoutButton({ children }: LogoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        setIsLoading(true);

        router.push('/api/auth/logout');
    };

    return (
        <button type="button" onClick={handleLogout} disabled={isLoading} aria-busy={isLoading}>
            {children ?? 'Sign out of your account'}
        </button>
    );
}
