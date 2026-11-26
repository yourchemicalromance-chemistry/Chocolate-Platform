import React from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';


import { spacing } from '../../theme';
import { Text } from '../../components/Text/Text';

export type PrivacyLockSettings = {
    contactLockEnabled: boolean;
    neighbourhoodLockEnabled: boolean;
    areaExclusionEnabled: boolean;
    undiscoverableEnabled: boolean;
    excludedArea: string;
};

type PrivacyLockScreenProps = {
    onBack: () => void;
    settings: PrivacyLockSettings;
    onSettingsChange: (nextSettings: PrivacyLockSettings) => void;
    onSaveSettings?: (settings: PrivacyLockSettings, extra?: { contacts?: string[]; excludedLatitude?: number; excludedLongitude?: number }) => Promise<void>;
};

type PrivacyToggleProps = {
    title: string;
    detail: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    value: boolean;
    onToggle: () => void;
};

function PrivacyToggle({ title, detail, icon, value, onToggle }: PrivacyToggleProps) {
    return (
        <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
                <Ionicons name={icon} size={19} color="#D5B58C" />
            </View>
            <View style={styles.settingCopy}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingDescription}>{detail}</Text>
            </View>
            <Pressable
                accessibilityRole="switch"
                accessibilityLabel={title}
                accessibilityState={{ checked: value }}
                onPress={onToggle}
                style={[styles.toggle, value && styles.toggleOn]}
            >
                <View style={[styles.toggleKnob, value && styles.toggleKnobOn]} />
            </Pressable>
        </View>
    );
}

export function PrivacyLockScreen({
    onBack,
    settings,
    onSettingsChange,
    onSaveSettings,
}: PrivacyLockScreenProps) {
    const [saving, setSaving] = React.useState(false);
    const updateSetting = <K extends keyof PrivacyLockSettings>(
        key: K,
        value: PrivacyLockSettings[K],
    ) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const handleSave = async () => {
        if (!onSaveSettings || saving) return;
        setSaving(true);
        try {
            const extra: { contacts?: string[]; excludedLatitude?: number; excludedLongitude?: number } = {};
            if (settings.contactLockEnabled) {
                const permission = await Contacts.requestPermissionsAsync();
                if (permission.status !== 'granted') throw new Error('Contact permission is required to enable Contact Lock.');
                const values: string[] = [];
                let pageOffset = 0;
                let hasNextPage = true;
                while (hasNextPage) {
                    const page = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers], pageSize: 500, pageOffset });
                    values.push(...page.data.flatMap(contact => [
                        ...(contact.emails ?? []).map(item => item.email),
                        ...(contact.phoneNumbers ?? []).map(item => item.number && `phone[IN]:${item.number}`),
                    ]).filter((value): value is string => Boolean(value)));
                    pageOffset += page.data.length;
                    hasNextPage = page.hasNextPage;
                    if (page.data.length === 0) break;
                }
                extra.contacts = [...new Set(values)];
            }
            if (settings.areaExclusionEnabled) {
                if (!settings.excludedArea.trim()) throw new Error('Enter a city or area to exclude.');
                const locations = await Location.geocodeAsync(settings.excludedArea.trim());
                if (!locations.length) throw new Error('That area could not be found. Please enter a city or region.');
                extra.excludedLatitude = locations[0].latitude;
                extra.excludedLongitude = locations[0].longitude;
            }
            await onSaveSettings(settings, extra);
            Alert.alert('Privacy choices saved', 'Your discovery privacy settings are now active.');
        } catch (error) {
            Alert.alert('Unable to save privacy choices', error instanceof Error ? error.message : 'Please try again.');
        } finally { setSaving(false); }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <LinearGradient
                colors={['#2B1A12', '#21140E', '#160905']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <StatusBar barStyle="light-content" backgroundColor="#160905" />
                <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerCopy}>
                        <Text style={styles.eyebrow}>YOUR SPACE · YOUR RULES</Text>
                        <View style={styles.titleRow}>
                            <Text style={styles.heading}>Privacy </Text>
                            <Text style={styles.headingAccent}>Lock</Text>
                        </View>
                        <Text style={styles.subtitle}>
                            Choose where and how people can discover you.
                        </Text>
                    </View>
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.groupCard}>
                        <View style={styles.groupHeading}>
                            <View style={styles.groupIcon}>
                                <Ionicons name="people-outline" size={14} color="#D5B58C" />
                            </View>
                            <Text style={styles.groupTitle}>Personal Privacy</Text>
                            <Ionicons name="chevron-down" size={14} color="rgba(213,181,140,0.72)" />
                        </View>

                        <PrivacyToggle
                            title="Contact Lock"
                            detail="Hide your profile from people in your phone contacts."
                            icon="people-outline"
                            value={settings.contactLockEnabled}
                            onToggle={() => updateSetting('contactLockEnabled', !settings.contactLockEnabled)}
                        />
                        <View style={styles.settingDivider} />
                        <PrivacyToggle
                            title="Area Exclusion"
                            detail="Choose places where you do not want to appear."
                            icon="map-outline"
                            value={settings.areaExclusionEnabled}
                            onToggle={() => updateSetting('areaExclusionEnabled', !settings.areaExclusionEnabled)}
                        />

                        {settings.areaExclusionEnabled && (
                            <View style={styles.areaInputWrap}>
                                <Text style={styles.settingTitle}>Area to exclude</Text>
                                <TextInput
                                    value={settings.excludedArea}
                                    onChangeText={(value) => updateSetting('excludedArea', value)}
                                    placeholder="e.g. my neighbourhood or city"
                                    placeholderTextColor="#B99E88"
                                    style={styles.areaInput}
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.groupCard}>
                        <View style={styles.groupHeading}>
                            <View style={styles.groupIcon}>
                                <Ionicons name="compass-outline" size={14} color="#D5B58C" />
                            </View>
                            <Text style={styles.groupTitle}>Discovery Visibility</Text>
                            <Ionicons name="chevron-down" size={14} color="rgba(213,181,140,0.72)" />
                        </View>

                        <PrivacyToggle
                            title="Neighbourhood Lock"
                            detail="Limit discovery from your local neighbourhood."
                            icon="home-outline"
                            value={settings.neighbourhoodLockEnabled}
                            onToggle={() => updateSetting('neighbourhoodLockEnabled', !settings.neighbourhoodLockEnabled)}
                        />
                        <View style={styles.settingDivider} />
                        <PrivacyToggle
                            title="Undiscoverable Mode"
                            detail="Pause showing your profile in discovery."
                            icon="eye-off-outline"
                            value={settings.undiscoverableEnabled}
                            onToggle={() => updateSetting('undiscoverableEnabled', !settings.undiscoverableEnabled)}
                        />
                    </View>

                    <Pressable onPress={() => { void handleSave(); }} style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save privacy choices'}</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFF0DF" />
                    </Pressable>
                    <Text style={styles.footer}>
                        Frontend preview only — privacy protections activate after backend integration.
                    </Text>
                </ScrollView>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#2B1A12',
    },
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 13,
        paddingBottom: spacing.lg,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2B1A12',
        borderWidth: 1,
        borderColor: 'rgba(213,181,140,0.22)',
        marginTop: 3,
    },
    headerCopy: {
        flex: 1,
        paddingTop: 1,
    },
    eyebrow: {
        fontFamily: 'System',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1.7,
        color: '#D5B58C',
        marginBottom: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    heading: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 38,
        lineHeight: 42,
        color: '#FFF0DF',
    },
    headingAccent: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 38,
        lineHeight: 42,
        color: '#D5B58C',
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 19,
        color: '#CDB9A7',
        marginTop: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        gap: 14,
        paddingBottom: 30,
    },
    groupCard: {
        borderRadius: 20,
        paddingHorizontal: 13,
        paddingTop: 13,
        paddingBottom: 9,
        backgroundColor: '#2B1A12',
        borderWidth: 1,
        borderColor: 'rgba(213,181,140,0.18)',
    },
    groupHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 9,
    },
    groupIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(213,181,140,0.12)',
    },
    groupTitle: {
        flex: 1,
        fontFamily: 'System',
        fontSize: 13,
        fontWeight: '600',
        color: '#D5B58C',
        letterSpacing: 0.1,
    },
    settingRow: {
        minHeight: 68,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 9,
    },
    settingIcon: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(213,181,140,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(213,181,140,0.18)',
    },
    settingCopy: {
        flex: 1,
        gap: 3,
    },
    settingTitle: {
        fontFamily: 'System',
        fontSize: 13,
        lineHeight: 17,
        fontWeight: '600',
        color: '#FFF0DF',
    },
    settingDescription: {
        fontFamily: 'System',
        fontSize: 11,
        lineHeight: 15,
        color: '#CDB9A7',
    },
    toggle: {
        width: 42,
        height: 24,
        borderRadius: 12,
        padding: 3,
        justifyContent: 'center',
        backgroundColor: 'rgba(213,181,140,0.24)',
        borderWidth: 1,
        borderColor: 'rgba(213,181,140,0.24)',
    },
    toggleOn: {
        backgroundColor: '#4B2017',
        borderColor: '#D5B58C',
    },
    toggleKnob: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#F8F4F0',
        alignSelf: 'flex-start',
    },
    toggleKnobOn: {
        alignSelf: 'flex-end',
    },
    settingDivider: {
        height: 1,
        marginLeft: 44,
        backgroundColor: 'rgba(213,181,140,0.18)',
    },
    areaInputWrap: {
        marginLeft: 44,
        paddingTop: 6,
        paddingBottom: 8,
        gap: 7,
    },
    areaInput: {
        minHeight: 46,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: 'rgba(213,181,140,0.24)',
        backgroundColor: '#160905',
        paddingHorizontal: 13,
        color: '#FFF0DF',
        fontSize: 13,
    },
    saveButton: {
        minHeight: 50,
        borderRadius: 16,
        paddingHorizontal: 17,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#4B2017',
        marginTop: 2,
    },
    saveButtonText: {
        fontFamily: 'System',
        fontSize: 13,
        fontWeight: '700',
        color: '#FFF0DF',
    },
    footer: {
        fontFamily: 'System',
        fontSize: 10,
        lineHeight: 15,
        color: '#B99E88',
        textAlign: 'center',
        paddingHorizontal: 12,
    },
});
