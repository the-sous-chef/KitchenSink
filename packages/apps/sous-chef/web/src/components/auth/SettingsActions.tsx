'use client';

import { useState, useTransition } from 'react';
import { buildApiClient } from '@/lib/api-client';
import { navigateTo } from '@/lib/navigation';

interface SettingsActionProps {
    accessToken: string;
}

export function PasswordResetButton({ accessToken }: SettingsActionProps) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);

    const handleResetPassword = async () => {
        if (!accessToken) {
            return;
        }

        startTransition(async () => {
            const api = buildApiClient(accessToken);
            const result = await api.post<{ message: string }>('/v1/users/me/password-reset');

            setMessage(result.message);
        });
    };

    return (
        <div>
            <button
                type="button"
                onClick={handleResetPassword}
                disabled={isPending}
                aria-busy={isPending}
                aria-describedby={message ? 'password-reset-status' : undefined}
            >
                {isPending ? 'Sending password reset...' : 'Reset your password'}
            </button>
            {message && (
                <p id="password-reset-status" role="status">
                    {message}
                </p>
            )}
        </div>
    );
}

export function MFAEnrollmentButton({ accessToken }: SettingsActionProps) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);

    const handleEnrollMFA = async () => {
        if (!accessToken) {
            return;
        }

        startTransition(async () => {
            const api = buildApiClient(accessToken);
            const result = await api.post<{ enrollmentUri: string }>('/v1/users/me/mfa/enroll');

            if (result.enrollmentUri) {
                navigateTo(result.enrollmentUri);

                return;
            }

            setMessage('MFA enrollment is unavailable right now.');
        });
    };

    return (
        <div>
            <button
                type="button"
                onClick={handleEnrollMFA}
                disabled={isPending}
                aria-busy={isPending}
                aria-describedby={message ? 'mfa-status' : undefined}
            >
                {isPending ? 'Opening MFA enrollment...' : 'Enable multi-factor authentication'}
            </button>
            {message && (
                <p id="mfa-status" role="status">
                    {message}
                </p>
            )}
        </div>
    );
}

export function SocialLinkButton({ accessToken }: SettingsActionProps) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);

    const providers = ['google', 'github', 'apple'];

    const handleLinkSocial = async (providerId: string) => {
        if (!accessToken) {
            return;
        }

        startTransition(async () => {
            const api = buildApiClient(accessToken);
            await api.post(`/v1/users/me/social/link`, {
                provider: providerId,
                accountId: providerId,
            });
            setMessage(`${providerId} account link requested.`);
        });
    };

    const handleUnlinkSocial = async (providerId: string) => {
        if (!accessToken) {
            return;
        }

        startTransition(async () => {
            const api = buildApiClient(accessToken);
            await api.post(`/v1/users/me/social/unlink`, {
                provider: providerId,
                accountId: providerId,
            });
            setMessage(`${providerId} account unlink requested.`);
        });
    };

    return (
        <div aria-labelledby="social-heading">
            {providers.map((p) => (
                <div key={p}>
                    <span id={`${p}-provider`}>{p}</span>
                    <button
                        type="button"
                        onClick={() => handleLinkSocial(p)}
                        disabled={isPending}
                        aria-label={`Link ${p} account`}
                        aria-describedby={`${p}-provider`}
                    >
                        Link {p}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleUnlinkSocial(p)}
                        disabled={isPending}
                        aria-label={`Unlink ${p} account`}
                        aria-describedby={`${p}-provider`}
                    >
                        Unlink {p}
                    </button>
                </div>
            ))}
            {message && <p role="status">{message}</p>}
        </div>
    );
}
