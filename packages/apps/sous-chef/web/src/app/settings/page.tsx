import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import { PasswordResetButton, MFAEnrollmentButton, SocialLinkButton } from '@/components/auth/SettingsActions';
import { LogoutButton } from '@/components/auth/LogoutButton';

export const metadata: Metadata = {
    title: 'Settings | Sous Chef',
    description: 'Account security and settings',
};

export default async function SettingsPage() {
    const session = await auth0.getSession();

    if (!session) {
        redirect('/api/auth/login?returnTo=/settings');
    }

    const { token } = await auth0.getAccessToken();

    return (
        <main>
            <h1>Settings</h1>
            <section aria-labelledby="security-heading">
                <h2 id="security-heading">Security</h2>
                <PasswordResetButton accessToken={token} />
                <MFAEnrollmentButton accessToken={token} />
            </section>
            <section aria-labelledby="social-heading">
                <h2 id="social-heading">Social Accounts</h2>
                <SocialLinkButton accessToken={token} />
            </section>
            <section aria-labelledby="session-heading">
                <h2 id="session-heading">Session</h2>
                <LogoutButton />
            </section>
        </main>
    );
}
