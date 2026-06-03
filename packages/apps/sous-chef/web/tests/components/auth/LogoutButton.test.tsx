import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoutButton } from '@/components/auth/LogoutButton';

const mockSignOut = vi.fn();

vi.mock('@clerk/nextjs', () => ({
    useClerk: () => ({ signOut: mockSignOut }),
}));

describe('LogoutButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSignOut.mockResolvedValue(undefined);
    });

    it('renders with default text', () => {
        render(<LogoutButton />);
        expect(screen.getByRole('button', { name: 'Sign out of your account' })).toBeInTheDocument();
    });

    it('renders with custom children', () => {
        render(<LogoutButton>Log Out</LogoutButton>);
        expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument();
    });

    it('calls IdP signOut with redirect on click', async () => {
        const user = userEvent.setup();
        render(<LogoutButton />);

        await user.click(screen.getByRole('button'));

        expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: '/' });
    });

    it('shows loading state when clicked', async () => {
        const user = userEvent.setup();
        mockSignOut.mockImplementation(() => new Promise(() => {}));
        render(<LogoutButton />);

        await user.click(screen.getByRole('button'));

        expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });
});
