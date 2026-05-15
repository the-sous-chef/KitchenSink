import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginButton } from '@/components/auth/LoginButton';

const mockUseRouter = vi.fn();
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => mockUseRouter(),
}));

describe('LoginButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseRouter.mockReturnValue({ push: mockPush });
    });

    it('UTS-001-A1 [MOD-001/login-ui]: renders with default text', () => {
        render(<LoginButton />);
        expect(screen.getByRole('button', { name: 'Sign in with Auth0' })).toBeInTheDocument();
    });

    it('UTS-001-A1 [MOD-001/login-ui-custom]: renders with custom children', () => {
        render(<LoginButton>Login with Email</LoginButton>);
        expect(screen.getByRole('button', { name: 'Login with Email' })).toBeInTheDocument();
    });

    it('UTS-001-A1 [MOD-001/login-redirect]: redirects to login on click', async () => {
        const user = userEvent.setup();
        render(<LoginButton returnTo="/profile" />);

        await user.click(screen.getByRole('button'));

        expect(mockPush).toHaveBeenCalledWith('/api/auth/login?returnTo=%2Fprofile');
    });

    it('UTS-001-A2 [MOD-001/login-loading]: shows loading state when clicked', async () => {
        const user = userEvent.setup();
        render(<LoginButton />);

        await user.click(screen.getByRole('button'));

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-busy', 'true');
    });
});
