import type { Route } from 'next';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';

export const metadata: Metadata = {
    title: 'Home | Sous Chef',
    description: 'Your personal AI-powered recipe assistant',
};

export default async function HomePage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in' as Route);
    }

    redirect('/profile');
}
