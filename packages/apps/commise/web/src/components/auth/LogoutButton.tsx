'use client';

import { useState } from 'react';
import { useClerk } from '@clerk/nextjs';

interface LogoutButtonProps {
    children?: React.ReactNode;
}

export function LogoutButton({ children }: LogoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { signOut } = useClerk();

    const handleLogout = async () => {
        setIsLoading(true);
        await signOut({ redirectUrl: '/' });
    };

    return (
        <button type="button" onClick={handleLogout} disabled={isLoading} aria-busy={isLoading}>
            {children ?? 'Sign out of your account'}
        </button>
    );
}
