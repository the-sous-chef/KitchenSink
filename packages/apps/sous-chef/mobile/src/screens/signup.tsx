import { useClerk, useSignUp } from '@clerk/expo';
import type { JSX } from 'react';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, Input, SizableText, YStack } from 'tamagui';

export interface SignUpScreenProps {
    onBack: () => void;
}

export function SignUpScreen({ onBack }: SignUpScreenProps): JSX.Element {
    const { setActive } = useClerk();
    const { signUp } = useSignUp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function handleSignUp() {
        if (!signUp) {
            return;
        }

        setBusy(true);
        setError(null);

        try {
            const createResult = await signUp.create({ emailAddress: email });

            if (createResult.error) {
                setError(
                    typeof createResult.error === 'string'
                        ? createResult.error
                        : (createResult.error.message ?? 'Sign-up failed'),
                );

                return;
            }

            const pwResult = await signUp.password({ password });

            if (pwResult.error) {
                setError(
                    typeof pwResult.error === 'string' ? pwResult.error : (pwResult.error.message ?? 'Sign-up failed'),
                );

                return;
            }

            if (signUp.status === 'complete' && signUp.createdSessionId) {
                await setActive({ session: signUp.createdSessionId });
            } else {
                setError('Additional verification required');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Sign-up failed');
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

            <SizableText color="$color" fontSize={16} textAlign="center" opacity={0.7} marginBottom="$2">
                Create your account
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
                    onPress={handleSignUp}
                    disabled={!signUp || busy}
                    backgroundColor="$primary"
                    color="white"
                    borderRadius="$5"
                    padding="$3"
                    fontSize={16}
                    fontWeight="600"
                    pressStyle={{ backgroundColor: '#3D8B85' }}
                >
                    Create account
                </Button>
            )}

            <Button
                onPress={onBack}
                backgroundColor="transparent"
                color="rgba(0,0,0,0.5)"
                fontSize={14}
                pressStyle={{ opacity: 0.8 }}
            >
                Already have an account?{' '}
                <SizableText color="rgba(0,0,0,0.7)" fontSize={14} fontWeight="600">
                    Sign in
                </SizableText>
            </Button>
        </YStack>
    );
}
