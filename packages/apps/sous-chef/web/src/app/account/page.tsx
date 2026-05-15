import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import { buildApiClient } from '@/lib/api-client';
import type { UserProfile } from '@kitchensink/auth-types';
import { AccountEditForm } from '@/components/auth/AccountEditForm';
import { AccountDeleteForm } from '@/components/auth/AccountDeleteForm';

export const metadata: Metadata = {
    title: 'Account Settings | Sous Chef',
    description: 'Manage your account settings',
};

async function getUserProfile(accessToken: string): Promise<UserProfile> {
    const api = buildApiClient(accessToken);

    return api.get<UserProfile>('/v1/users/me');
}

async function AccountContent({ accessToken, userId }: { accessToken: string; userId: string }) {
    const profile = await getUserProfile(accessToken);

    return (
        <main>
            <h1>Account Settings</h1>
            <section aria-labelledby="edit-heading">
                <h2 id="edit-heading">Edit Profile</h2>
                <AccountEditForm accessToken={accessToken} initialProfile={profile} />
            </section>
            <section aria-labelledby="delete-heading">
                <h2 id="delete-heading">Danger Zone</h2>
                <AccountDeleteForm accessToken={accessToken} userId={userId} />
            </section>
        </main>
    );
}

export default async function AccountPage() {
    const session = await auth0.getSession();

    if (!session) {
        redirect('/api/auth/login?returnTo=/account');
    }

    const { token } = await auth0.getAccessToken();

    return <AccountContent accessToken={token} userId={session.user.sub} />;
}
