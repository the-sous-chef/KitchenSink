import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { useUserProfile, useUpdateProfile } from '../hooks/useUserProfile';
import { SuspensionBanner } from '../components/SuspensionBanner';

export function ProfileScreen(): JSX.Element {
    const { data, isLoading, error } = useUserProfile();
    const updateProfile = useUpdateProfile();
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    useEffect(() => {
        if (data?.user) {
            setDisplayName(data.user.displayName ?? '');
            setAvatarUrl(data.user.avatarUrl ?? '');
        }
    }, [data]);

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={styles.center}>
                <Text>Failed to load profile.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SuspensionBanner status={data.user.status} />
            <Text style={styles.label}>Display name</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
            <Text style={styles.label}>Avatar URL</Text>
            <TextInput style={styles.input} value={avatarUrl} onChangeText={setAvatarUrl} autoCapitalize="none" />
            <Button
                title={updateProfile.isPending ? 'Saving…' : 'Save'}
                disabled={updateProfile.isPending}
                onPress={() => updateProfile.mutate({ displayName, avatarUrl })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 4 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
    },
});
