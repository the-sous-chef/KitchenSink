import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MFAEnrollmentButton, PasswordResetButton, SocialLinkButton } from '@/components/auth/SettingsActions';

const mockNavigateTo = vi.fn();

vi.mock('@/lib/navigation', () => ({
    navigateTo: (url: string) => mockNavigateTo(url),
}));

describe('SettingsActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('UTS-018-A1 [MOD-018]: requests password reset and announces the API response', async () => {
        const user = userEvent.setup();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ message: 'If the email exists, a reset link has been sent' }),
        } as Response);

        render(<PasswordResetButton accessToken="test-token" />);

        await user.click(screen.getByRole('button', { name: 'Reset your password' }));

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:4000/v1/users/me/password-reset',
            expect.objectContaining({ method: 'POST' }),
        );
        expect(await screen.findByRole('status')).toHaveTextContent('reset link has been sent');
    });

    it('UTS-019-A1 [MOD-019]: opens MFA enrollment URI from the identity API', async () => {
        const user = userEvent.setup();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ enrollmentUri: 'otpauth://issuer/account' }),
        } as Response);

        render(<MFAEnrollmentButton accessToken="test-token" />);

        await user.click(screen.getByRole('button', { name: 'Enable multi-factor authentication' }));

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:4000/v1/users/me/mfa/enroll',
            expect.objectContaining({ method: 'POST' }),
        );
        expect(mockNavigateTo).toHaveBeenCalledWith('otpauth://issuer/account');
    });

    it('UTS-021-A1 [MOD-021]: renders social link and unlink actions with role selectors', async () => {
        const user = userEvent.setup();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ message: 'Account linked' }),
        } as Response);

        render(<SocialLinkButton accessToken="test-token" />);

        await user.click(screen.getByRole('button', { name: 'Link google account' }));
        await user.click(screen.getByRole('button', { name: 'Unlink google account' }));

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:4000/v1/users/me/social/link',
            expect.objectContaining({ method: 'POST' }),
        );
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:4000/v1/users/me/social/unlink',
            expect.objectContaining({ method: 'POST' }),
        );
    });
});
