import { SignUp } from '@clerk/nextjs';
import { clerkAppearance } from '@kitchensink/ui';

export default function SignUpPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-12">
            <SignUp appearance={clerkAppearance} />
        </main>
    );
}
