import { useUser } from '@auth0/nextjs-auth0';
import type { ReactNode } from 'react';

interface SessionGateProps {
    children?: ReactNode;
    fallback?: ReactNode;
}

export function SessionGate({ children, fallback = null }: SessionGateProps) {
    const { user, isLoading, error } = useUser();

    if (isLoading) {
        return (
            <div role="status" aria-label="Loading session">
                <span className="sr-only">Loading...</span>
            </div>
        );
    }

    if (error || !user) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
