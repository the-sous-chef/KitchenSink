import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoutButton } from '@/components/auth/LogoutButton';

const mockUseRouter = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => mockUseRouter(),
}));

describe('LogoutButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseRouter.mockReturnValue({ push: mockPush });
    });

    it('UTS-001-A2 [MOD-001/logout-ui]: renders with default text', () => {
        render(<LogoutButton />);
        expect(screen.getByRole('button', { name: 'Sign out of your account' })).toBeInTheDocument();
    });

    it('UTS-001-A2 [MOD-001/logout-ui-custom]: renders with custom children', () => {
        render(<LogoutButton>Log Out</LogoutButton>);
        expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument();
    });

    it('UTS-001-A2 [MOD-001/logout-redirect]: redirects to logout on click', async () => {
        const user = userEvent.setup();
        render(<LogoutButton />);

        await user.click(screen.getByRole('button'));

        expect(mockPush).toHaveBeenCalledWith('/api/auth/logout');
    });

    it('UTS-001-A2 [MOD-001/logout-loading]: shows loading state when clicked', async () => {
        const user = userEvent.setup();
        render(<LogoutButton />);

        await user.click(screen.getByRole('button'));

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-busy', 'true');
    });
});
