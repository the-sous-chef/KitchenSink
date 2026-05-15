import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth.js';
import type { Auth0Config } from '../types/auth.js';

const AUTH0_CONFIG: Auth0Config = {
    domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? 'sous-chef.us.auth0.com',
    clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '',
    callbackScheme: 'souschef',
    audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? 'https://api.sous-chef.io',
};

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { authState, login } = useAuth({ config: AUTH0_CONFIG });

    const handleLogin = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');

            return;
        }

        setIsLoading(true);

        try {
            await login({ loginHint: email.trim() });
        } catch {
            Alert.alert('Error', 'Failed to start login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Sous Chef</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                />

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>{isLoading ? 'Signing in...' : 'Continue with Email'}</Text>
                </TouchableOpacity>
            </View>

            {authState.status === 'blocked' && (
                <View style={styles.blockedPanel} accessibilityRole="alert">
                    <Text style={styles.blockedTitle}>{authState.block.title}</Text>
                    <Text style={styles.errorText}>{authState.block.message}</Text>
                </View>
            )}

            {authState.status === 'error' && <Text style={styles.errorText}>{authState.message}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
        backgroundColor: '#fff',
    },
    header: {
        marginBottom: 48,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    form: {
        gap: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        marginTop: 16,
        color: '#dc3545',
        fontSize: 14,
        textAlign: 'center',
    },
    blockedPanel: {
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#fff3e0',
    },
    blockedTitle: {
        marginBottom: 8,
        fontSize: 16,
        fontWeight: '700',
        color: '#e65100',
        textAlign: 'center',
    },
});
