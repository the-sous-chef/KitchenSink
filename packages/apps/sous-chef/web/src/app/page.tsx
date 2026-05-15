import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth0 } from '@/lib/auth0';

export const metadata: Metadata = {
    title: 'Home | Sous Chef',
    description: 'Your personal AI-powered recipe assistant',
};

export default async function HomePage() {
    const session = await auth0.getSession();

    if (!session) {
        redirect('/api/auth/login?returnTo=/profile');
    }

    redirect('/profile');
}
