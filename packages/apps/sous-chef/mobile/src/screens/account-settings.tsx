import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Linking } from 'react-native';
import { useAuth } from '../hooks/useAuth.js';
import {
    usePasswordReset,
    useMfaEnrollment,
    useMfaUnenrollment,
    useLinkSocial,
    useUnlinkSocial,
} from '../hooks/useUserProfile.js';
import type { Auth0Config } from '../types/auth.js';

const AUTH0_CONFIG: Auth0Config = {
    domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? 'sous-chef.us.auth0.com',
    clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '',
    callbackScheme: 'souschef',
    audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? 'https://api.sous-chef.io',
};

const GOOGLE_CONNECTION = 'google-oauth2';
const APPLE_CONNECTION = 'apple';

interface MfaEnrollResult {
    enrollmentUri: string;
    message: string;
}

export default function AccountSettingsScreen() {
    const { authState } = useAuth({ config: AUTH0_CONFIG });
    const session = authState.status === 'authenticated' ? authState.session : null;

    const passwordReset = usePasswordReset(AUTH0_CONFIG, session);
    const mfaEnrollment = useMfaEnrollment(AUTH0_CONFIG, session);
    const mfaUnenrollment = useMfaUnenrollment(AUTH0_CONFIG, session);
    const linkSocial = useLinkSocial(AUTH0_CONFIG, session);
    const unlinkSocial = useUnlinkSocial(AUTH0_CONFIG, session);

    const openAuth0AccountManagement = async (path: string) => {
        await Linking.openURL(`https://${AUTH0_CONFIG.domain}${path}`);
    };

    const handlePasswordReset = async () => {
        try {
            await passwordReset.mutateAsync();
            Alert.alert('Success', 'Password reset email sent. Check your inbox.');
        } catch {
            Alert.alert('Error', 'Failed to send password reset email');
        }
    };

    const handleMfaEnroll = async () => {
        try {
            const result = (await mfaEnrollment.mutateAsync()) as MfaEnrollResult;
            Alert.alert('MFA Enrollment', result.message, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open enrollment', onPress: () => void Linking.openURL(result.enrollmentUri) },
            ]);
        } catch {
            Alert.alert('Error', 'Failed to enroll MFA');
        }
    };

    const handleMfaUnenroll = (enrollmentId: string) => {
        Alert.alert('Unenroll MFA', 'Are you sure you want to disable MFA?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Disable',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await mfaUnenrollment.mutateAsync(enrollmentId);
                        Alert.alert('Success', 'MFA disabled');
                    } catch {
                        Alert.alert('Error', 'Failed to disable MFA');
                    }
                },
            },
        ]);
    };

    const handleLinkSocial = (provider: string) => {
        Alert.alert('Link Social Account', `This would initiate Auth0 social login flow for ${provider}.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Continue',
                onPress: async () => {
                    try {
                        await linkSocial.mutateAsync({ provider, accountId: provider });
                        await openAuth0AccountManagement(`/authorize?connection=${encodeURIComponent(provider)}`);
                        Alert.alert('Success', `${provider} linked`);
                    } catch {
                        Alert.alert('Error', `Failed to link ${provider}`);
                    }
                },
            },
        ]);
    };

    const handleUnlinkSocial = (provider: string) => {
        Alert.alert('Unlink Social Account', `This would remove the ${provider} connection from your account.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Unlink',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await unlinkSocial.mutateAsync({ provider, accountId: provider });
                        Alert.alert('Success', `${provider} unlinked`);
                    } catch {
                        Alert.alert('Error', `Failed to unlink ${provider}`);
                    }
                },
            },
        ]);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security</Text>

                <TouchableOpacity
                    style={styles.actionRow}
                    onPress={handlePasswordReset}
                    disabled={passwordReset.isPending}
                >
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Reset Password</Text>
                        <Text style={styles.actionDescription}>Send a verified reset link to your email</Text>
                    </View>
                    <Text style={styles.chevron}>{'>'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionRow} onPress={handleMfaEnroll} disabled={mfaEnrollment.isPending}>
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Enable MFA</Text>
                        <Text style={styles.actionDescription}>Open secure enrollment for authenticator-based MFA</Text>
                    </View>
                    <Text style={styles.chevron}>{'>'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionRow} onPress={() => handleMfaUnenroll('demo-enrollment-id')}>
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Disable MFA</Text>
                        <Text style={styles.actionDescription}>Disable a registered MFA factor after confirmation</Text>
                    </View>
                    <Text style={styles.chevron}>{'>'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Connected Accounts</Text>

                <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => handleLinkSocial(GOOGLE_CONNECTION)}
                    disabled={linkSocial.isPending}
                >
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Link Google</Text>
                        <Text style={styles.actionDescription}>Connect a Google identity via Auth0</Text>
                    </View>
                    <Text style={styles.chevron}>{'>'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => handleLinkSocial(APPLE_CONNECTION)}
                    disabled={linkSocial.isPending}
                >
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Link Apple</Text>
                        <Text style={styles.actionDescription}>Connect an Apple identity via Auth0</Text>
                    </View>
                    <Text style={styles.chevron}>{'>'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionRow} onPress={() => handleUnlinkSocial(GOOGLE_CONNECTION)}>
                    <View style={styles.actionContent}>
                        <Text style={[styles.actionTitle, styles.dangerText]}>Unlink Google</Text>
                        <Text style={styles.actionDescription}>Remove Google from connected accounts</Text>
                    </View>
                    <Text style={[styles.chevron, styles.dangerText]}>{'>'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionRow} onPress={() => handleUnlinkSocial(APPLE_CONNECTION)}>
                    <View style={styles.actionContent}>
                        <Text style={[styles.actionTitle, styles.dangerText]}>Unlink Apple</Text>
                        <Text style={styles.actionDescription}>Remove Apple from connected accounts</Text>
                    </View>
                    <Text style={[styles.chevron, styles.dangerText]}>{'>'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Danger Zone</Text>

                <TouchableOpacity
                    style={[styles.actionRow, styles.dangerRow]}
                    onPress={() => Alert.alert('Account Deletion', 'Contact support to delete your account.')}
                >
                    <View style={styles.actionContent}>
                        <Text style={[styles.actionTitle, styles.dangerText]}>Delete Account</Text>
                        <Text style={styles.actionDescription}>Permanently delete your account and data</Text>
                    </View>
                    <Text style={[styles.chevron, styles.dangerText]}>{'>'}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    section: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 8,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    actionDescription: {
        fontSize: 13,
        color: '#666',
    },
    chevron: {
        fontSize: 18,
        color: '#ccc',
    },
    dangerRow: {
        borderTopWidth: 0,
    },
    dangerText: {
        color: '#dc3545',
    },
});
