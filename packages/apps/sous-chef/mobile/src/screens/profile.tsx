import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useUserProfile, useUpdateProfile } from '../hooks/useUserProfile.js';
import type { Auth0Config } from '../types/auth.js';
import { SuspensionBanner } from '../components/SuspensionBanner.js';

const AUTH0_CONFIG: Auth0Config = {
    domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? 'sous-chef.us.auth0.com',
    clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '',
    callbackScheme: 'souschef',
    audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? 'https://api.sous-chef.io',
};

export default function ProfileScreen() {
    const { authState, logout, blockSuspendedAccount } = useAuth({ config: AUTH0_CONFIG });
    const session = authState.status === 'authenticated' ? authState.session : null;

    const { data: profileData, isLoading } = useUserProfile(AUTH0_CONFIG, session);
    const updateProfile = useUpdateProfile(AUTH0_CONFIG, session);

    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    useEffect(() => {
        if (profileData?.profile) {
            setDisplayName(profileData.profile.displayName);
            setAvatarUrl(profileData.profile.avatarUrl ?? '');
        }
    }, [profileData?.profile]);

    useEffect(() => {
        if (profileData?.user.status === 'suspended') {
            void blockSuspendedAccount();
        }
    }, [blockSuspendedAccount, profileData?.user.status]);

    const handleSave = async () => {
        try {
            await updateProfile.mutateAsync({
                displayName: displayName.trim() || undefined,
                avatarUrl: avatarUrl || null,
            });
            Alert.alert('Success', 'Profile updated');
        } catch {
            Alert.alert('Error', 'Failed to update profile');
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <Text>Loading profile...</Text>
            </View>
        );
    }

    if (!profileData) {
        return (
            <View style={styles.centered}>
                <Text>Not authenticated</Text>
            </View>
        );
    }

    const { user, profile, accounts } = profileData;
    const primaryAccount = accounts[0];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
                <Text style={styles.subtitle}>{user.email}</Text>
            </View>

            <SuspensionBanner status={user.status} />

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile Information</Text>

                <View style={styles.field}>
                    <Text style={styles.label}>Display Name</Text>
                    <TextInput
                        style={styles.input}
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder={profile?.displayName ?? 'Display name'}
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Avatar URL</Text>
                    <TextInput
                        style={styles.input}
                        value={avatarUrl}
                        onChangeText={setAvatarUrl}
                        placeholder={profile?.avatarUrl ?? 'No avatar'}
                    />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={updateProfile.isPending}>
                    <Text style={styles.saveButtonText}>{updateProfile.isPending ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Connected Account</Text>
                <Text style={styles.subscriptionTier}>{primaryAccount?.subscriptionTier ?? 'No linked account'}</Text>
                {primaryAccount && <Text style={styles.accountDetail}>{primaryAccount.userId}</Text>}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Status</Text>
                <View style={[styles.statusBadge, user.status === 'suspended' && styles.statusSuspended]}>
                    <Text style={[styles.statusText, user.status === 'suspended' && styles.statusTextSuspended]}>
                        {user.status}
                    </Text>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    field: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    subscriptionTier: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        textTransform: 'capitalize',
    },
    accountDetail: {
        marginTop: 4,
        fontSize: 14,
        color: '#666',
    },
    statusBadge: {
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    statusSuspended: {
        backgroundColor: '#ffebee',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2e7d32',
        textTransform: 'capitalize',
    },
    statusTextSuspended: {
        color: '#c62828',
    },
    logoutButton: {
        margin: 24,
        backgroundColor: '#dc3545',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
