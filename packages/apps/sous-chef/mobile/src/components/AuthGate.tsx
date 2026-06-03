import type { JSX, ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/login';

interface AuthGateProps {
    children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps): JSX.Element {
    const { state } = useAuth();

    switch (state.status) {
        case 'loading':
            return (
                <View style={styles.center}>
                    <ActivityIndicator />
                </View>
            );
        case 'unauthenticated':
            return <LoginScreen />;
        case 'blocked':
            return (
                <View style={styles.center}>
                    <Text style={styles.title}>{state.reason.title}</Text>
                    <Text style={styles.body}>{state.reason.body}</Text>
                </View>
            );
        case 'error':
            return (
                <View style={styles.center}>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.body}>{state.error.message}</Text>
                </View>
            );
        case 'authenticated':
            return <>{children}</>;
    }
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
    body: { fontSize: 14, textAlign: 'center', color: '#555' },
});
