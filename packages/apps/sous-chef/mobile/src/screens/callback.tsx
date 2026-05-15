import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import type { Auth0Config } from '../types/auth.js';
import { useAuth } from '../hooks/useAuth.js';

const AUTH0_CONFIG: Auth0Config = {
    domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? 'sous-chef.us.auth0.com',
    clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '',
    callbackScheme: 'souschef',
    audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? 'https://api.sous-chef.io',
};

export default function CallbackScreen() {
    const { loginWithCode } = useAuth({ config: AUTH0_CONFIG });

    useEffect(() => {
        const handleDeepLink = async () => {
            const url = await Linking.getInitialURL();

            if (url) {
                const parsed = new URL(url);
                const code = parsed.searchParams.get('code');
                const error = parsed.searchParams.get('error');

                if (error) {
                    return;
                }

                if (code) {
                    await loginWithCode(code);
                }
            }
        };

        const subscription = Linking.addEventListener('url', (event) => {
            const parsed = new URL(event.url);
            const code = parsed.searchParams.get('code');
            const error = parsed.searchParams.get('error');

            if (error) {
                return;
            }

            if (code) {
                void loginWithCode(code);
            }
        });

        void handleDeepLink();

        return () => {
            subscription.remove();
        };
    }, [loginWithCode]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.message}>Completing sign in...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    message: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#dc3545',
        textAlign: 'center',
        paddingHorizontal: 32,
    },
});
