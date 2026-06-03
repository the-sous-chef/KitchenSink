import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoginButton } from '@/components/auth/LoginButton';

vi.mock('@clerk/nextjs', () => ({
    SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('LoginButton', () => {
    it('renders with default text', () => {
        render(<LoginButton />);
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    });

    it('renders with custom children', () => {
        render(<LoginButton>Login with Email</LoginButton>);
        expect(screen.getByRole('button', { name: 'Login with Email' })).toBeInTheDocument();
    });
});
