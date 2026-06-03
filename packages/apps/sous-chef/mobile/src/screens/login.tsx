import { useSignIn } from '@clerk/react/legacy';
import type { JSX } from 'react';
import { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';

export function LoginScreen(): JSX.Element {
    const { signIn, setActive, isLoaded } = useSignIn();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function handleSignIn() {
        if (!isLoaded) {
            return;
        }

        setBusy(true);
        setError(null);

        try {
            const result = await signIn.create({ identifier: email, password });

            if (result.status === 'complete' && result.createdSessionId) {
                await setActive({ session: result.createdSessionId });
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
        <View style={styles.container}>
            <Text style={styles.title}>Sous Chef</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {busy ? <ActivityIndicator /> : <Button title="Sign in" onPress={handleSignIn} disabled={!isLoaded} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    error: { color: '#c00', marginBottom: 12, textAlign: 'center' },
});
