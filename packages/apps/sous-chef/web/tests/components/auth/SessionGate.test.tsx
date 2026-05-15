import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionGate } from '@/components/auth/SessionGate';

const mockUseUser = vi.fn();

vi.mock('@auth0/nextjs-auth0', () => ({
    useUser: () => mockUseUser(),
}));

describe('SessionGate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('UTS-005-A1 [MOD-005]: renders children when user is authenticated', () => {
        mockUseUser.mockReturnValue({
            user: { sub: 'user123', email: 'test@example.com' },
            isLoading: false,
            error: undefined,
        });

        render(
            <SessionGate>
                <span>Protected Content</span>
            </SessionGate>,
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('UTS-005-A2 [MOD-005]: renders fallback when user is not authenticated', () => {
        mockUseUser.mockReturnValue({
            user: undefined,
            isLoading: false,
            error: undefined,
        });

        render(
            <SessionGate fallback={<span>Not authenticated</span>}>
                <span>Protected Content</span>
            </SessionGate>,
        );

        expect(screen.getByText('Not authenticated')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('UTS-005-A1 [MOD-005/loading]: shows loading state with proper aria attributes', () => {
        mockUseUser.mockReturnValue({
            user: undefined,
            isLoading: true,
            error: undefined,
        });

        render(<SessionGate fallback={<span>Loading...</span>} />);

        const loadingElement = screen.getByRole('status');
        expect(loadingElement).toBeInTheDocument();
        expect(loadingElement).toHaveAttribute('aria-label', 'Loading session');
    });

    it('UTS-005-A3 [MOD-005]: renders null fallback by default when not authenticated', () => {
        mockUseUser.mockReturnValue({
            user: undefined,
            isLoading: false,
            error: undefined,
        });

        const { container } = render(
            <SessionGate>
                <span>Protected Content</span>
            </SessionGate>,
        );

        expect(container).toBeEmptyDOMElement();
    });
});
