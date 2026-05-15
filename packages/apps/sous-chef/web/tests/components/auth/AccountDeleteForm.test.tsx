import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountDeleteForm } from '@/components/auth/AccountDeleteForm';

const mockNavigateTo = vi.fn();

vi.mock('@/lib/navigation', () => ({
    navigateTo: (url: string) => mockNavigateTo(url),
}));

describe('AccountDeleteForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('reveals an accessible deletion confirmation dialog', async () => {
        const user = userEvent.setup();

        render(<AccountDeleteForm accessToken="test-token" userId="user-123" />);

        await user.click(screen.getByRole('button', { name: 'Delete your account' }));

        expect(screen.getByRole('dialog', { name: 'Confirm Account Deletion' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirm Deletion' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('calls DELETE /v1/users/me and logs out after confirmation', async () => {
        const user = userEvent.setup();
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202, json: vi.fn() });
        global.fetch = fetchMock;

        render(<AccountDeleteForm accessToken="test-token" userId="user-123" />);

        await user.click(screen.getByRole('button', { name: 'Delete your account' }));
        await user.click(screen.getByRole('button', { name: 'Confirm Deletion' }));

        expect(fetchMock).toHaveBeenCalledWith(
            'http://localhost:4000/v1/users/me',
            expect.objectContaining({ method: 'DELETE' }),
        );
        expect(mockNavigateTo).toHaveBeenCalledWith('/api/auth/logout');
    });
});
