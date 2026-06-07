import { SignIn } from '@clerk/nextjs';
import { clerkAppearance } from '@kitchensink/ui';

export default function SignInPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-12">
            <SignIn appearance={clerkAppearance} />
        </main>
    );
}
