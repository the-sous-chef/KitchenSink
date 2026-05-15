import { View, ActivityIndicator, StyleSheet } from 'react-native';
import LoginScreen from '../screens/login.js';
import type { AuthState } from '../types/auth.js';

interface AuthGateProps {
    children: React.ReactNode;
    authState: AuthState;
}

export function AuthGate({ children, authState }: AuthGateProps) {
    if (authState.status === 'loading' || authState.status === 'idle') {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (authState.status === 'unauthenticated' || authState.status === 'error' || authState.status === 'blocked') {
        return <LoginScreen />;
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
