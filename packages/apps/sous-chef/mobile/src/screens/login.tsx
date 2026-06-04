import { useClerk, useSignIn } from '@clerk/expo';
import type { JSX } from 'react';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, Input, SizableText, YStack } from 'tamagui';

export function LoginScreen(): JSX.Element {
    const { setActive } = useClerk();
    const { signIn } = useSignIn();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function handleSignIn() {
        if (!signIn) {
            return;
        }

        setBusy(true);
        setError(null);

        try {
            const createResult = await signIn.create({ identifier: email });

            if (createResult.error) {
                setError(
                    typeof createResult.error === 'string'
                        ? createResult.error
                        : (createResult.error.message ?? 'Sign-in failed'),
                );

                return;
            }

            const pwResult = await signIn.password({ password });

            if (pwResult.error) {
                setError(
                    typeof pwResult.error === 'string' ? pwResult.error : (pwResult.error.message ?? 'Sign-in failed'),
                );

                return;
            }

            if (signIn.status === 'complete' && signIn.createdSessionId) {
                await setActive({ session: signIn.createdSessionId });
            } else {
                setError('Additional verification required');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Sign-in failed');
        } finally {
            setBusy(false);
        }
    }

    return (
        <YStack flex={1} justifyContent="center" backgroundColor="$background" padding="$5" gap="$4">
            <SizableText
                fontFamily="$heading"
                fontSize={36}
                fontWeight="700"
                color="$color"
                textAlign="center"
                marginBottom="$3"
            >
                Sous Chef
            </SizableText>

            <YStack gap="$3">
                <Input
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    borderColor="$borderColor"
                    borderWidth={1}
                    borderRadius="$2"
                    padding="$3"
                    fontSize={16}
                    backgroundColor="white"
                    color="$color"
                />
                <Input
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    borderColor="$borderColor"
                    borderWidth={1}
                    borderRadius="$2"
                    padding="$3"
                    fontSize={16}
                    backgroundColor="white"
                    color="$color"
                />
            </YStack>

            {error ? (
                <SizableText color="$destructive" fontSize={14} textAlign="center">
                    {error}
                </SizableText>
            ) : null}

            {busy ? (
                <ActivityIndicator color="#5BA8A0" />
            ) : (
                <Button
                    onPress={handleSignIn}
                    disabled={!signIn || busy}
                    backgroundColor="$primary"
                    color="white"
                    borderRadius="$5"
                    padding="$3"
                    fontSize={16}
                    fontWeight="600"
                    pressStyle={{ backgroundColor: '#3D8B85' }}
                >
                    Sign in
                </Button>
            )}
        </YStack>
    );
}
