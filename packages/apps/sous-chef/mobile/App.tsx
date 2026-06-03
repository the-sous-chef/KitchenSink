import { ClerkProvider } from '@clerk/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import type { JSX } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthGate } from './src/components/AuthGate.js';
import { ProfileScreen } from './src/screens/profile.js';
import { tokenCache } from './src/storage/tokenCache.js';

const queryClient = new QueryClient();

const publishableKey = process.env.EXPO_PUBLIC_IDP_PUBLISHABLE_KEY;

if (!publishableKey) {
    throw new Error('Missing EXPO_PUBLIC_IDP_PUBLISHABLE_KEY environment variable');
}

export default function App(): JSX.Element {
    return (
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
            <QueryClientProvider client={queryClient}>
                <SafeAreaProvider>
                    <StatusBar style="auto" />
                    <AuthGate>
                        <ProfileScreen />
                    </AuthGate>
                </SafeAreaProvider>
            </QueryClientProvider>
        </ClerkProvider>
    );
}
