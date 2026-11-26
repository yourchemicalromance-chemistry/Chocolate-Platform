import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
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

import { colors, radii, spacing } from '../../theme';
import { Text } from '../../components/Text';
import { ChocolateLogo } from '../components/ChocolateLogo/ChocolateLogo';
import { getDiscoveryFeed, getDiscoveryStats, getDiscoveryMatches, getDiscoverySaved, getDiscoveryPhotoUrl, getVideoAccessHeaders, getDatingIntents, saveDatingIntents, getDiscoveryModes, saveDiscoveryModes, recordProfileAction, saveDiscoveryProfile, removeSavedDiscoveryProfile, type DiscoveryMode, type DiscoveryProfile } from '../../auth-api';
import { profilesForDiscoveryMode } from '../../discovery-mode';

type DashboardFilterType = 'discovery' | 'intent';

type DashboardProps = {
    onLogout?: () => void;
    onOpenProfile?: () => void;
    onOpenOtherProfile?: (profileId: string) => void;
    onOpenNearby?: () => void;
    onOpenLocationSearch?: () => void;
    onOpenPrivacyLock?: () => void;
    onOpenDashboardFilter?: (filterType: DashboardFilterType) => void;
    onOpenVideoVerification?: () => void;
    onOpenVideoReviews?: () => void;
    isVideoReviewer?: boolean;
    videoReviewPending?: boolean;
    activeDiscoveryMode?: string;
    activeSearchIntent?: string;
    initialDiscoveryProfiles?: DiscoveryProfile[];
};

type Profile = {
    id: string;
    name: string;
    age: number;
    distance: string;
    profession: string;
    location: string;
    interests: string;
    about: string;
    image: string;
    online?: boolean;
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// ── Chocolate palette (matches landing / login / signup) ──
const GOLD = '#F8DCC6';
const ESPRESSO = '#160D08';
const COCOA = '#4B2017';
const CHAMPAGNE = '#F8DCC6';
const CREAM = '#FFF0DF';
const PROFILE_CARD_WIDTH = Math.min(Dimensions.get('window').width * 0.72, 310);
const PROFILE_CARD_GAP = 14;
const CARD_SNAP_INTERVAL = PROFILE_CARD_WIDTH + PROFILE_CARD_GAP;

const DISCOVERY_MODE_OPTIONS = [
    { id: 'algorithmic', title: 'Algorithmic Recommendations', icon: 'flame-outline' as IconName },
    { id: 'browse', title: 'Self Search / Browse', icon: 'people-outline' as IconName },
    { id: 'kismat', title: 'KISMAT', icon: 'sparkles-outline' as IconName },
] as const;

const modeTitle = (mode: DiscoveryMode) => DISCOVERY_MODE_OPTIONS.find(option => option.id === mode)!.title;
const modeId = (title: string): DiscoveryMode | undefined => DISCOVERY_MODE_OPTIONS.find(option => option.title === title)?.id;

const SEARCH_INTENT_OPTIONS = [
    { id: 'serious', title: 'Serious Relationship', icon: 'heart-outline' as IconName },
    { id: 'casual', title: 'Casual Dating', icon: 'cafe-outline' as IconName },
    { id: 'flirting', title: 'Fun & Flirting', icon: 'sparkles-outline' as IconName },
    { id: 'exploring', title: 'Open to Exploring', icon: 'compass-outline' as IconName },
    { id: 'marriage', title: 'Marriage', icon: 'infinite-outline' as IconName },
] as const;

const drawerItems = [
    { label: 'Home', icon: 'home-outline' },
    { label: 'Kismat', icon: 'sparkles-outline' },
    { label: 'Matches', icon: 'heart-outline' },
    { label: 'Messages', icon: 'chatbubbles-outline' },
    { label: 'Premium', icon: 'diamond-outline' },
    { label: 'Appearance', icon: 'color-palette-outline' },
    { label: 'Settings', icon: 'settings-outline' },
    { label: 'Safety & Privacy', icon: 'shield-checkmark-outline' },
    { label: 'Video Verification', icon: 'videocam-outline' },
    { label: 'Help & Support', icon: 'help-circle-outline' },
    { label: 'Log Out', icon: 'log-out-outline' },
] as const;

const bottomItems = [
    { label: 'Home', icon: 'home' },
    { label: 'Likes', icon: 'heart-outline' },
    { label: 'Chats', icon: 'chatbubble-ellipses-outline' },
    { label: 'Profile', icon: 'person-outline' },
] as const;

const plans = [
    {
        name: 'Free',
        tag: 'Discover',
        description: 'Discover people and express interest.',
        features: [
            { text: 'Browse profiles and basic discovery' },
            { text: 'Limited likes and mutual matches' },
            { text: 'No sending, reading or replying to messages', unavailable: true },
        ],
    },
    {
        name: 'Standard',
        tag: 'Connect',
        description: 'Turn mutual interest into conversations.',
        features: [
            { text: 'Everything in Free' },
            { text: 'Send, receive and read messages' },
            { text: 'More likes, standard search filters and saved profiles' },
        ],
    },
    {
        name: 'Premium',
        tag: 'Advanced',
        premium: true,
        description: 'More discovery power, visibility and discretion.',
        features: [
            { text: 'Everything in Standard' },
            { text: 'See who liked you' },
            { text: 'Advanced search filters, profile boost and priority visibility' },
            { text: 'Advanced Privacy & Discoverability, including the contact Exception List' },
        ],
    },
] as const;

export function UserDashboardScreen({
    onLogout,
    onOpenProfile,
    onOpenOtherProfile,
    onOpenNearby,
    onOpenLocationSearch,
    onOpenPrivacyLock,
    onOpenDashboardFilter,
    onOpenVideoVerification,
    onOpenVideoReviews,
    isVideoReviewer = false,
    videoReviewPending = false,
    activeDiscoveryMode = 'Algorithmic Recommendations',
    activeSearchIntent = 'Serious Relationship',
    initialDiscoveryProfiles,
}: DashboardProps) {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('Home');
    const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
    const [superLikedProfiles, setSuperLikedProfiles] = useState<string[]>([]);
    const [savedProfiles, setSavedProfiles] = useState<string[]>([]);
    const [passedProfiles, setPassedProfiles] = useState<string[]>([]);
    const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
    const [intentDropdownVisible, setIntentDropdownVisible] = useState(false);
    const [selectedSearchIntent, setSelectedSearchIntent] = useState(activeSearchIntent);
    const [discoveryDropdownVisible, setDiscoveryDropdownVisible] = useState(false);
    const [selectedDiscoveryMode, setSelectedDiscoveryMode] = useState(activeDiscoveryMode);
    const [notificationVisible, setNotificationVisible] = useState(false);
    // New, UI-only state for the deck and the collapsed plan list
    const [deckIndex, setDeckIndex] = useState(0);
    const [plansOpen, setPlansOpen] = useState(false);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [mutualMatches, setMutualMatches] = useState<Profile[]>([]);
    const [discoveryStats, setDiscoveryStats] = useState<{ likes: number; matches: number; messages: number | null } | null>(null);
    const [imageHeaders, setImageHeaders] = useState<Record<string, string>>({});
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
    const [profileActionBusy, setProfileActionBusy] = useState(false);
    const carouselRef = useRef<ScrollView>(null);
    const [carouselReady, setCarouselReady] = useState(false);
    const actionLock = useRef(false);
    const modeChangeLock = useRef(false);
    const skipAutoRefresh = useRef(false);
    const swipeActioned = useRef(new Set<string>());
    const refreshFeed = useCallback(async (query?: string, modeTitle = selectedDiscoveryMode) => {
        const mode = modeId(modeTitle);
        if (!mode) throw new Error('Select a discovery mode before refreshing the feed.');
        const rows = await getDiscoveryFeed(mode, query);
        setProfiles(profilesForDiscoveryMode(rows, mode).map(row => ({ ...row, image: getDiscoveryPhotoUrl(row.image), distance: row.distanceBand ?? 'Distance hidden' })));
        setDeckIndex(0);
        setCarouselReady(false);
    }, [selectedDiscoveryMode]);
    useEffect(() => {
        let active = true;
        const convert = (row: DiscoveryProfile): Profile => ({ ...row, image: getDiscoveryPhotoUrl(row.image), distance: row.distanceBand ?? 'Distance hidden' });
        void Promise.all([getVideoAccessHeaders(), getDiscoveryModes().catch(() => null)]).then(async ([headers, modes]) => {
            if (!active) return;
            setImageHeaders(headers);
            const savedMode = modes?.mode ?? modeId(selectedDiscoveryMode) ?? 'algorithmic';
            setSelectedDiscoveryMode(modeTitle(savedMode));
            if (active && initialDiscoveryProfiles !== undefined) {
                setProfiles(initialDiscoveryProfiles.map(convert));
            } else {
                const feed = await getDiscoveryFeed(savedMode);
                if (active) setProfiles(profilesForDiscoveryMode(feed, savedMode).map(convert));
            }
        }).catch(error => { if (active) Alert.alert('Unable to load discovery', error instanceof Error ? error.message : 'Please try again.'); })
            .finally(() => { if (active) { skipAutoRefresh.current = true; setIsLoadingProfiles(false); } });
        void getDiscoveryStats().then(value => { if (active) setDiscoveryStats(value); }).catch(() => undefined);
        void getDiscoveryMatches().then(value => { if (active) setMutualMatches(value.map(convert)); }).catch(() => undefined);
        void getDiscoverySaved().then(value => { if (active) setSavedProfiles(value.map(profile => profile.id)); }).catch(() => undefined);
        void getDatingIntents().then(value => {
            const intent = SEARCH_INTENT_OPTIONS.find(option => option.id === value.intents[0]);
            if (active && intent) setSelectedSearchIntent(intent.title);
        }).catch(() => undefined);
        return () => { active = false; };
    // Initial feed and supporting lists load once; mode/query refreshes use the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        if (isLoadingProfiles) return;
        if (skipAutoRefresh.current) { skipAutoRefresh.current = false; return; }
        const timer = setTimeout(() => { void refreshFeed(partnerSearchQuery.trim() || undefined).catch(() => undefined); }, 350);
        return () => clearTimeout(timer);
    }, [partnerSearchQuery, selectedDiscoveryMode, isLoadingProfiles, refreshFeed]);

    const selectMode = async (mode: DiscoveryMode) => {
        if (modeChangeLock.current) return;
        modeChangeLock.current = true;
        const title = modeTitle(mode);
        const changed = title !== selectedDiscoveryMode;
        if (changed) skipAutoRefresh.current = true;
        try {
            await saveDiscoveryModes(mode);
            setSelectedDiscoveryMode(title);
            setDiscoveryDropdownVisible(false);
            await refreshFeed(partnerSearchQuery.trim() || undefined, title);
        } catch (error) {
            if (changed) skipAutoRefresh.current = false;
            Alert.alert('Unable to save discovery mode', error instanceof Error ? error.message : 'Please try again.');
        } finally { modeChangeLock.current = false; }
    };

    const openFeature = (feature: string) => {
        setDrawerVisible(false);

        if (feature === 'Home') {
            setActiveTab('Home');
            return;
        }

        if (feature === 'Kismat' || feature === 'KISMAT' || feature === 'Kismat Connect') {
            void selectMode('kismat');
            return;
        }

        if (feature === 'Matches') {
            Alert.alert('Mutual Matches', mutualMatches.length ? mutualMatches.map(profile => `${profile.name}, ${profile.age}`).join('\n') : 'No mutual matches yet.');
            return;
        }

        if (feature === 'Safety & Privacy') { onOpenPrivacyLock?.(); return; }
        if (feature === 'Video Verification') { onOpenVideoVerification?.(); return; }

        if (feature === 'Log Out') {
            Alert.alert('Log out', 'Connect this action to authentication when available.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Continue', onPress: () => onLogout?.() },
            ]);
            return;
        }

        if (feature === 'Profile' || feature === 'My Profile') {
            setActiveTab('Home');
            onOpenProfile?.();
            return;
        }

        Alert.alert(
            feature,
            'This feature is planned for CHOCOLATE. Its screen and backend integration are pending.',
            [{ text: 'Got it' }],
        );
    };

    const visibleProfiles = profiles.filter((profile) => !passedProfiles.includes(profile.id));
    const deckSize = visibleProfiles.length;
    const safeIndex = deckSize ? deckIndex % deckSize : 0;
    const current = deckSize ? visibleProfiles[safeIndex] : undefined;
    const carouselProfiles = deckSize > 1
        ? [visibleProfiles[deckSize - 1], ...visibleProfiles, visibleProfiles[0]]
        : visibleProfiles;
    const performAction = async (profile: Profile, action: 'LIKE' | 'SUPER_LIKE' | 'PASS' | 'VIEW') => {
        if (action === 'VIEW') {
            onOpenOtherProfile?.(profile.id);
            void recordProfileAction(profile.id, 'VIEW').catch(() => undefined);
            return;
        }
        if (actionLock.current) return;
        actionLock.current = true; setProfileActionBusy(true);
        try {
            const result = await recordProfileAction(profile.id, action);
            if (action === 'PASS') {
                setPassedProfiles(current => current.includes(profile.id) ? current : [...current, profile.id]);
                if (modeId(selectedDiscoveryMode) === 'kismat') {
                    void refreshFeed(undefined, selectedDiscoveryMode).catch(error => Alert.alert('Unable to draw another KISMAT profile', error instanceof Error ? error.message : 'Please try again.'));
                }
            }
            if (action === 'LIKE' || action === 'SUPER_LIKE') {
                setLikedProfiles(current => current.includes(profile.id) ? current : [...current, profile.id]);
                if (action === 'SUPER_LIKE') setSuperLikedProfiles(current => current.includes(profile.id) ? current : [...current, profile.id]);
                setDeckIndex(index => index + 1);
                if (result.mutualMatch) { const matches = await getDiscoveryMatches(); setMutualMatches(matches.map(row => ({ ...row, image: getDiscoveryPhotoUrl(row.image), distance: row.distanceBand ?? 'Distance hidden' }))); }
            }
        } catch (error) { Alert.alert('Action not saved', error instanceof Error ? error.message : 'Please try again.'); }
        finally { actionLock.current = false; setProfileActionBusy(false); }
    };

    const handleSuperLike = (profile: Profile) => { void performAction(profile, 'SUPER_LIKE'); };
    const handleLike = (profile: Profile) => { void performAction(profile, 'LIKE'); };
    const toggleSaved = async (profile: Profile) => {
        if (actionLock.current) return;
        actionLock.current = true;
        try {
            const wasSaved = savedProfiles.includes(profile.id);
            if (wasSaved) await removeSavedDiscoveryProfile(profile.id); else await saveDiscoveryProfile(profile.id);
            setSavedProfiles(current => wasSaved ? current.filter(id => id !== profile.id) : [...current, profile.id]);
        } catch (error) { Alert.alert('Unable to save profile', error instanceof Error ? error.message : 'Please try again.'); }
        finally { actionLock.current = false; }
    };

    useEffect(() => {
        if (deckSize > 1 && !carouselReady) {
            requestAnimationFrame(() => {
                carouselRef.current?.scrollTo({ x: CARD_SNAP_INTERVAL, animated: false });
                setCarouselReady(true);
            });
        }
    }, [deckSize, carouselReady]);

    const resetDeck = () => { setPassedProfiles([]); void refreshFeed().catch(error => Alert.alert('Unable to refresh discovery', error instanceof Error ? error.message : 'Please try again.')); };



    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={ESPRESSO} />
            <LinearGradient
                colors={['#2A160D', '#1D0E08', '#160905', '#211008']}
                locations={[0, 0.34, 0.72, 1]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            {/* Header */}
            <LinearGradient
                colors={['#FFE6D2', 'rgba(248,220,198,0.82)', 'rgba(248,220,198,0.34)', 'rgba(248,220,198,0)']}
                locations={[0, 0.30, 0.68, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.headerAmbientFade}
                pointerEvents="none"
            />
            <View style={styles.header}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open navigation menu"
                    onPress={() => setDrawerVisible(true)}
                    hitSlop={10}
                    style={styles.menuButton}
                >
                    <Ionicons name="menu-outline" size={29} color={COCOA} />
                </Pressable>

                <View style={styles.headerActions}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Privacy settings"
                        onPress={() => onOpenPrivacyLock?.()}
                        style={styles.headerIcon}
                    >
                        <Ionicons name="shield-checkmark-outline" size={23} color={COCOA} />
                    </Pressable>

                    <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => setNotificationVisible(true)} style={styles.headerIcon}>
                        <Ionicons name="notifications-outline" size={23} color={COCOA} />
                        <View style={styles.notificationDot} />
                    </Pressable>

                </View>
            </View>

            <LinearGradient
                colors={['rgba(248,220,198,0)', 'rgba(248,220,198,0.34)', 'rgba(248,220,198,0.82)', '#F2C9A8']}
                locations={[0, 0.34, 0.72, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.bottomAmbientFade}
                pointerEvents="none"
            />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Context pills — what you're looking for, and how */}
                <View style={styles.contextRow}>
                    <View style={styles.intentDropdownAnchor}>
                        <Pressable
                            style={styles.contextPill}
                            onPress={() => {
                                setDiscoveryDropdownVisible(false);
                                setIntentDropdownVisible((visible) => !visible);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Looking for: ${selectedSearchIntent}. Show search intents`}
                            accessibilityState={{ expanded: intentDropdownVisible }}
                        >
                            <LinearGradient
                                colors={['#2B1A12', '#21140E', ESPRESSO]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                                pointerEvents="none"
                            />
                            <Ionicons name="heart-outline" size={13} color={CREAM} />
                            <Text variant="label" color={CREAM} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={styles.contextText}>
                                {selectedSearchIntent}
                            </Text>
                            <Ionicons name={intentDropdownVisible ? 'chevron-up' : 'chevron-down'} size={12} color={GOLD} />
                        </Pressable>

                        {intentDropdownVisible && (
                            <>
                                <Pressable
                                    style={styles.intentDropdownDismiss}
                                    onPress={() => setIntentDropdownVisible(false)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Close search intent menu"
                                />
                                <View style={styles.intentDropdown}>
                                    <LinearGradient
                                        colors={['#2B1A12', '#21140E', ESPRESSO]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={StyleSheet.absoluteFill}
                                        pointerEvents="none"
                                    />
                                    {SEARCH_INTENT_OPTIONS.map((option) => {
                                        const selected = selectedSearchIntent === option.title;
                                        return (
                                            <Pressable
                                                key={option.id}
                                                style={[styles.intentDropdownOption, selected && styles.intentDropdownOptionSelected]}
                                                onPress={() => { void (async () => {
                                                    try { await saveDatingIntents([option.id]); setSelectedSearchIntent(option.title); setIntentDropdownVisible(false); }
                                                    catch (error) { Alert.alert('Unable to save search intent', error instanceof Error ? error.message : 'Please try again.'); }
                                                })(); }}
                                                accessibilityRole="button"
                                                accessibilityState={{ selected }}
                                            >
                                                <Ionicons name={option.icon} size={15} color={CREAM} />
                                                <Text variant="label" color={CREAM} style={styles.intentDropdownOptionText}>
                                                    {option.title}
                                                </Text>
                                                {selected && <Ionicons name="checkmark" size={15} color={GOLD} />}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </>
                        )}
                    </View>

                    <View style={styles.discoveryDropdownAnchor}>
                        <Pressable
                            style={styles.contextPill}
                            onPress={() => {
                                setIntentDropdownVisible(false);
                                setDiscoveryDropdownVisible((visible) => !visible);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Discovery mode: ${selectedDiscoveryMode}. Show discovery modes`}
                            accessibilityState={{ expanded: discoveryDropdownVisible }}
                        >
                            <LinearGradient
                                colors={['#2B1A12', '#21140E', ESPRESSO]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                                pointerEvents="none"
                            />
                            <Ionicons name="compass-outline" size={13} color={CREAM} />
                            <Text variant="label" color={CREAM} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={styles.contextText}>
                                {selectedDiscoveryMode}
                            </Text>
                            <Ionicons name={discoveryDropdownVisible ? 'chevron-up' : 'chevron-down'} size={12} color={GOLD} />
                        </Pressable>

                        {discoveryDropdownVisible && (
                            <>
                                <Pressable
                                    style={styles.discoveryDropdownDismiss}
                                    onPress={() => setDiscoveryDropdownVisible(false)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Close discovery mode menu"
                                />
                                <View style={styles.discoveryDropdown}>
                                    <LinearGradient
                                        colors={['#2B1A12', '#21140E', ESPRESSO]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={StyleSheet.absoluteFill}
                                        pointerEvents="none"
                                    />
                                    {DISCOVERY_MODE_OPTIONS.map((option) => {
                                        const selected = selectedDiscoveryMode === option.title;
                                        return (
                                            <Pressable
                                                key={option.id}
                                                style={[styles.intentDropdownOption, selected && styles.intentDropdownOptionSelected]}
                                                onPress={() => { void (async () => {
                                                    await selectMode(option.id);
                                                })(); }}
                                                accessibilityRole="button"
                                                accessibilityState={{ selected }}
                                            >
                                                <Ionicons name={option.icon} size={15} color={CREAM} />
                                                <Text variant="label" color={CREAM} style={styles.intentDropdownOptionText}>
                                                    {option.title}
                                                </Text>
                                                {selected && <Ionicons name="checkmark" size={15} color={GOLD} />}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Photo-led profile carousel */}
                {current ? (
                    <View>
                        <ScrollView
                            ref={carouselRef}
                            style={styles.profileCarousel}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            decelerationRate="fast"
                            // The content has equal side padding to centre each card.
                            // Snap to the padded item start; 'center' would apply a
                            // second alignment offset and shift the active card.
                            snapToAlignment="start"
                            snapToInterval={CARD_SNAP_INTERVAL}
                            disableIntervalMomentum
                            contentContainerStyle={styles.profileCarouselContent}
                            onMomentumScrollEnd={(event) => {
                                const trackIndex = Math.round(event.nativeEvent.contentOffset.x / CARD_SNAP_INTERVAL);
                                let nextIndex = trackIndex - 1;

                                // Seamlessly wrap the cloned edge cards back to the real track.
                                if (trackIndex === 0 && deckSize > 1) {
                                    carouselRef.current?.scrollTo({ x: deckSize * CARD_SNAP_INTERVAL, animated: false });
                                    nextIndex = deckSize - 1;
                                } else if (trackIndex === deckSize + 1 && deckSize > 1) {
                                    carouselRef.current?.scrollTo({ x: CARD_SNAP_INTERVAL, animated: false });
                                    nextIndex = 0;
                                }

                                if (nextIndex >= 0 && nextIndex < deckSize && nextIndex !== safeIndex) {
                                    if (!likedProfiles.includes(current!.id) && !superLikedProfiles.includes(current!.id) && !swipeActioned.current.has(current!.id)) {
                                        swipeActioned.current.add(current!.id);
                                        void recordProfileAction(current!.id, 'PASS').catch(error => Alert.alert('Pass not saved', error instanceof Error ? error.message : 'Please try again.'));
                                    }
                                    setDeckIndex(nextIndex);
                                }
                            }}
                        >
                            {carouselProfiles.map((profile, trackIndex) => (
                                <View key={`${profile.id}-${trackIndex}`} style={styles.profileCarouselItem}>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={`View ${profile.name}'s profile`}
                                        onPress={() => { void performAction(profile, 'VIEW'); }}
                                        style={styles.photoProfileCard}
                                    >
                                        <Image source={{ uri: profile.image, headers: imageHeaders }} style={styles.photoProfileImage} />
                                        <LinearGradient
                                            colors={['rgba(15,8,5,0.02)', 'rgba(15,8,5,0.08)', 'rgba(15,8,5,0.88)']}
                                            locations={[0, 0.48, 1]}
                                            style={StyleSheet.absoluteFill}
                                        />

                                        <View style={styles.photoProfileTopRow}>
                                            {profile.online ? (
                                                <View style={styles.photoOnlinePill}>
                                                    <View style={styles.onlineDotSmall} />
                                                    <Text variant="caption" color={CREAM}>Online</Text>
                                                </View>
                                            ) : <View />}
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`More options for ${profile.name}`}
                                                onPress={() => openFeature(`Profile options: ${profile.name}`)}
                                                style={styles.photoProfileMore}
                                            >
                                                <Ionicons name="ellipsis-horizontal" size={21} color={CREAM} />
                                            </Pressable>
                                        </View>

                                        <View style={styles.profileActionRail}>
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`Pass on ${profile.name}`}
                                                onPress={(event) => { event.stopPropagation(); void performAction(profile, 'PASS'); }}
                                                disabled={profileActionBusy}
                                                style={styles.profileActionButton}
                                            >
                                                <Ionicons name="close" size={23} color={CREAM} />
                                            </Pressable>
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`Like ${profile.name}`}
                                                onPress={(event) => { event.stopPropagation(); handleLike(profile); }}
                                                disabled={profileActionBusy}
                                                style={[styles.profileActionButton, likedProfiles.includes(profile.id) && styles.profileActionButtonActive]}
                                            >
                                                <Ionicons name={likedProfiles.includes(profile.id) ? 'heart' : 'heart-outline'} size={21} color={likedProfiles.includes(profile.id) ? '#F28B9A' : CREAM} />
                                            </Pressable>
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`Super like ${profile.name}`}
                                                onPress={(event) => { event.stopPropagation(); handleSuperLike(profile); }}
                                                disabled={profileActionBusy}
                                                style={[styles.profileActionButton, superLikedProfiles.includes(profile.id) && styles.profileActionButtonActive]}
                                            >
                                                <Ionicons name="star" size={20} color={superLikedProfiles.includes(profile.id) ? GOLD : CREAM} />
                                            </Pressable>
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`${savedProfiles.includes(profile.id) ? 'Unsave' : 'Save'} ${profile.name}`}
                                                onPress={(event) => { event.stopPropagation(); void toggleSaved(profile); }}
                                                disabled={profileActionBusy}
                                                style={[styles.profileActionButton, savedProfiles.includes(profile.id) && styles.profileActionButtonActive]}
                                            >
                                                <Ionicons name={savedProfiles.includes(profile.id) ? 'bookmark' : 'bookmark-outline'} size={20} color={savedProfiles.includes(profile.id) ? GOLD : CREAM} />
                                            </Pressable>
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`Open ${profile.name}'s profile`}
                                                onPress={(event) => { event.stopPropagation(); void performAction(profile, 'VIEW'); }}
                                                style={styles.profileActionButton}
                                            >
                                                <Ionicons name="person-outline" size={20} color={CREAM} />
                                            </Pressable>
                                        </View>

                                        <View style={styles.photoProfileInfo}>
                                            <View style={styles.photoProfileNameRow}>
                                                <Text style={styles.photoProfileName} numberOfLines={1}>
                                                    {profile.name}, {profile.age}
                                                </Text>
                                                <Ionicons name="checkmark-circle" size={19} color="#E8BE79" />
                                            </View>
                                            <View style={styles.photoProfileMetaLine}>
                                                <Ionicons name="location-outline" size={14} color="#F8DCC6" />
                                                <Text style={styles.photoProfileMetaText} numberOfLines={1}>
                                                    {profile.location} · {profile.distance}
                                                </Text>
                                            </View>
                                            <Text style={styles.photoProfileInterests} numberOfLines={2}>
                                                {profile.interests}
                                            </Text>
                                        </View>
                                    </Pressable>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.carouselHintRow}>
                            <Ionicons name="arrow-back" size={13} color={GOLD} />
                            <Text variant="caption" color={colors.moonlight.silver}>Swipe to explore more profiles</Text>
                            <Ionicons name="arrow-forward" size={13} color={GOLD} />
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyCard}>
                        <Ionicons name="sparkles-outline" size={30} color={GOLD} />
                        <Text variant="heading3" color={CREAM}>You&apos;ve met everyone for now</Text>
                        <Text variant="bodySmall" color={colors.moonlight.silver}>
                            Bring the demo profiles back to explore them again.
                        </Text>
                        <Pressable onPress={resetDeck} style={styles.resetButton}>
                            <Text variant="label" color={GOLD}>Reset demo profiles</Text>
                        </Pressable>
                    </View>
                )}

                {/* Activity */}
                <View style={styles.statsRow}>
                    {[
                        { n: discoveryStats ? String(discoveryStats.likes) : '—', label: 'Likes', feature: 'Likes & Connections' },
                        { n: discoveryStats ? String(discoveryStats.matches) : '—', label: 'Matches', feature: 'Matches' },
                        { n: discoveryStats?.messages === null || !discoveryStats ? '—' : String(discoveryStats.messages), label: 'Messages', feature: 'Chats' },
                    ].map((stat) => (
                        <Pressable
                            key={stat.label}
                            style={styles.stat}
                            onPress={() => openFeature(stat.feature)}
                            accessibilityRole="button"
                            accessibilityLabel={`${stat.n} ${stat.label.toLowerCase()}, open ${stat.feature}`}
                        >
                            <LinearGradient
                                colors={['#2B1A12', '#21140E', ESPRESSO]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                                pointerEvents="none"
                            />
                            <Text style={styles.statNumber}>{stat.n}</Text>
                            <Text variant="bodySmall" color={colors.moonlight.silver}>{stat.label}</Text>
                        </Pressable>
                    ))}
                </View>

                {/* Just matched */}
                <View style={styles.section}>
                    <View style={styles.sectionHeading}>
                        <SectionTitle first="Mutual" rest="Matches" />
                        <Pressable onPress={() => openFeature('Matches')} hitSlop={8} style={styles.seeAll}>
                            <Text variant="label" color={GOLD}>See all</Text>
                            <Ionicons name="chevron-forward" size={15} color={GOLD} />
                        </Pressable>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchesRow}>
                        {mutualMatches.map((profile) => (
                            <Pressable key={profile.id} style={styles.matchItem} onPress={() => { void performAction(profile, 'VIEW'); }}>
                                <View style={styles.matchRing}>
                                    <Image source={{ uri: profile.image, headers: imageHeaders }} style={styles.matchPhoto} />
                                    {profile.online && <View style={styles.onlineDot} />}
                                </View>
                                <Text variant="label" color={CREAM}>{profile.name}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                {/* Find your partner */}
                <View style={styles.findPartnerSearch}>
                    <Ionicons name="search-outline" size={20} color={GOLD} />
                    <TextInput
                        value={partnerSearchQuery}
                        onChangeText={setPartnerSearchQuery}
                        placeholder="Find your partner..."
                        placeholderTextColor={colors.moonlight.silver}
                        style={styles.findPartnerInput}
                        returnKeyType="search"
                        accessibilityLabel="Find your partner"
                    />
                </View>

                {/* Places */}
                <View style={styles.section}>
                    <SectionTitle first="Meet" rest="Somewhere" />
                    <View style={styles.placeRow}>
                        <Pressable
                            style={styles.placeCard}
                            onPress={() => onOpenNearby?.()}
                            accessibilityRole="button"
                            accessibilityLabel="Nearby, explore this area"
                        >
                            <LinearGradient colors={['#2B1A12', '#21140E', ESPRESSO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.placeGradient}>
                                <View style={styles.placeIcon}>
                                    <Ionicons name="navigate-outline" size={18} color={GOLD} />
                                </View>
                                <Text style={styles.placeTitle}>Nearby</Text>
                                <Text variant="bodySmall" color={colors.moonlight.silver} style={styles.placeSubtitle}>Explore this area</Text>
                            </LinearGradient>
                        </Pressable>

                        <Pressable
                            style={styles.placeCard}
                            onPress={() => onOpenLocationSearch?.()}
                            accessibilityRole="button"
                            accessibilityLabel="Location Search, explore anywhere"
                        >
                            <LinearGradient colors={['#FFE6D2', CHAMPAGNE, '#F2C9A8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.placeGradient}>
                                <View style={[styles.placeIcon, styles.placeIconLight]}>
                                    <Ionicons name="earth-outline" size={18} color={COCOA} />
                                </View>
                                <Text style={[styles.placeTitle, { color: COCOA }]}>Location Search</Text>
                                <Text variant="bodySmall" color="#704537" style={styles.placeSubtitle}>Explore anywhere</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>

                    <View style={styles.chipRow}>
                        {([
                            { title: 'KISMAT', icon: 'sparkles-outline' },
                            { title: 'Saved Profiles', icon: 'bookmark-outline' },
                        ] as { title: string; icon: IconName }[]).map((chip) => (
                            <Pressable key={chip.title} onPress={() => openFeature(chip.title)} style={styles.chip}>
                                <LinearGradient
                                    colors={['#2B1A12', '#21140E', ESPRESSO]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={StyleSheet.absoluteFill}
                                    pointerEvents="none"
                                />
                                <Ionicons name={chip.icon} size={13} color={GOLD} />
                                <Text variant="label" color={CREAM} style={styles.chipText}>{chip.title}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Privacy controls */}
                <View style={styles.membershipCard}>
                    <LinearGradient colors={['#FFE6D2', CHAMPAGNE, '#F2C9A8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    <Pressable
                        onPress={() => onOpenPrivacyLock?.()}
                        style={styles.membershipHeader}
                        accessibilityRole="button"
                        accessibilityLabel="Open Privacy Controls"
                    >
                        <View style={[styles.membershipIcon, styles.placeIconLight]}>
                            <Ionicons name="shield-checkmark-outline" size={21} color={COCOA} />
                        </View>
                        <View style={styles.membershipCopy}>
                            <Text style={[styles.membershipTitle, { color: COCOA }]}>Privacy Controls</Text>
                            <Text variant="bodySmall" color="#704537">
                                Manage who can discover you and where you appear.
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={COCOA} />
                    </Pressable>
                </View>

                {/* Premium */}
                <View style={styles.membershipCard}>
                    <LinearGradient colors={['#2B1A12', '#21140E', ESPRESSO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    <Pressable
                        onPress={() => setPlansOpen((open) => !open)}
                        style={styles.membershipHeader}
                        accessibilityRole="button"
                        accessibilityLabel="Show or hide membership plans"
                    >
                        <View style={styles.membershipIcon}>
                            <Ionicons name="diamond-outline" size={21} color={GOLD} />
                        </View>
                        <View style={styles.membershipCopy}>
                            <Text style={styles.membershipTitle}>Find your perfect plan</Text>
                            <Text variant="bodySmall" color={colors.moonlight.silver}>
                                Choose how far you want to take your experience.
                            </Text>
                        </View>
                        <Ionicons name={plansOpen ? 'chevron-up' : 'chevron-down'} size={20} color={GOLD} />
                    </Pressable>

                    {plansOpen && (
                        <View style={styles.planList}>
                            {plans.map((plan) => {
                                const isPremium = 'premium' in plan && plan.premium;
                                return (
                                    <View key={plan.name} style={[styles.plan, isPremium && styles.planPremium]}>
                                        <View style={styles.planHeading}>
                                            <Text style={[styles.planName, isPremium && { color: GOLD }]}>{plan.name}</Text>
                                            <Text variant="label" color={GOLD}>{plan.tag}</Text>
                                        </View>
                                        <Text variant="bodySmall" color={colors.moonlight.silver}>{plan.description}</Text>
                                        {plan.features.map((feature) => {
                                            const off = 'unavailable' in feature && feature.unavailable;
                                            return (
                                                <View key={feature.text} style={styles.feature}>
                                                    <Ionicons
                                                        name={off ? 'close-circle-outline' : 'checkmark-circle'}
                                                        size={15}
                                                        color={off ? '#A39BAF' : GOLD}
                                                    />
                                                    <Text variant="bodySmall" color={off ? '#A39BAF' : CREAM} style={styles.featureText}>
                                                        {feature.text}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            })}
                            <View style={styles.safetyNote}>
                                <Ionicons name="shield-checkmark-outline" size={16} color={GOLD} />
                                <Text variant="bodySmall" color={colors.moonlight.silver} style={styles.featureText}>
                                    Basic safety tools, including blocking and reporting, are available to everyone.
                                </Text>
                            </View>
                            <Text variant="caption" color={colors.moonlight.silver} style={styles.pricingNote}>
                                Membership prices and final plan limits will be announced later.
                            </Text>
                        </View>
                    )}

                    <Pressable
                        onPress={() => openFeature('Membership & Plans')}
                        style={styles.compareButton}
                        accessibilityRole="button"
                        accessibilityLabel="Compare all CHOCOLATE membership plans"
                    >
                        <LinearGradient
                            colors={['#FFE6D2', CHAMPAGNE, '#F2C9A8']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                            pointerEvents="none"
                        />
                        <Text variant="label" color={COCOA}>Compare all plans</Text>
                        <Ionicons name="arrow-forward" size={16} color={COCOA} />
                    </Pressable>
                </View>

                <View style={styles.footer}>
                </View>
            </ScrollView>

            {/* Bottom navigation */}
            <View style={styles.bottomNav}>
                {bottomItems.map((item) => {
                    const active = activeTab === item.label;
                    return (
                        <Pressable
                            key={item.label}
                            onPress={() => {
                                setActiveTab(item.label);
                                if (item.label !== 'Home') openFeature(item.label);
                            }}
                            style={styles.bottomItem}
                        >
                            <View style={styles.bottomIconWrap}>
                                <Ionicons name={item.icon as IconName} size={22} color={active ? COCOA : 'rgba(84,39,25,0.68)'} />
                            </View>
                        </Pressable>
                    );
                })}
            </View>

            {/* Navigation drawer */}
            <Modal
                visible={drawerVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={() => setDrawerVisible(false)}
            >
                <View style={styles.drawerRoot}>
                    <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerVisible(false)} />
                    <View style={styles.drawer}>
                        <LinearGradient colors={['#FFE6D2', CHAMPAGNE, '#F2C9A8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

                        <View style={styles.drawerHeader}>
                            <View style={styles.drawerLogoWrap}>
                                <ChocolateLogo size={230} />
                            </View>
                        </View>


                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerItems}>
                            {[...drawerItems, ...(isVideoReviewer ? [{ label: 'Video Reviews', icon: 'eye-outline' }] : [])].map((item) => (
                                <Pressable
                                    key={item.label}
                                    onPress={() => {
                                        if (item.label === 'Video Verification') { setDrawerVisible(false); onOpenVideoVerification?.(); return; }
                                        if (item.label === 'Video Reviews') { setDrawerVisible(false); onOpenVideoReviews?.(); return; }
                                        openFeature(item.label);
                                    }}
                                    style={[
                                        styles.drawerItem,
                                        item.label === 'Home' && styles.drawerItemActive,
                                        item.label === 'Log Out' && styles.logoutItem,
                                    ]}
                                >
                                    <Ionicons
                                        name={item.icon as IconName}
                                        size={21}
                                        color={COCOA}
                                    />
                                    <Text variant="label" color={COCOA} style={styles.drawerItemText}>
                                        {item.label}
                                    </Text>
                                    {item.label === 'Video Verification' && videoReviewPending && <Text variant="caption" color="#8A5B23">Pending review</Text>}
                                    {item.label === 'Premium' && <Ionicons name="sparkles" size={16} color={GOLD} />}
                                </Pressable>
                            ))}
                        </ScrollView>

                        <Text variant="caption" color="#704537" style={styles.drawerFooter}>
                            Made for connections.
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Notifications placeholder */}
            <Modal visible={notificationVisible} transparent animationType="fade" onRequestClose={() => setNotificationVisible(false)}>
                <View style={styles.simpleModalRoot}>
                    <Pressable style={styles.simpleModalBackdrop} onPress={() => setNotificationVisible(false)} />
                    <View style={styles.simpleModalCard}>
                        <View style={styles.modalTitleRow}>
                            <Text variant="heading3" style={styles.modalHeading}>Notifications</Text>
                            <Pressable onPress={() => setNotificationVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.ivory} />
                            </Pressable>
                        </View>
                        <View style={styles.emptyNotification}>
                            <Ionicons name="notifications-outline" size={36} color={GOLD} />
                            <Text variant="label">Your notifications will appear here</Text>
                            <Text variant="bodySmall" color={colors.moonlight.silver}>
                                Real match alerts and messages require backend integration.
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function SectionTitle({ first, rest }: { first: string; rest: string }) {
    return (
        <Text style={styles.sectionTitle}>
            <Text style={styles.sectionTitleLight}>{first} </Text>
            <Text style={styles.sectionTitleGold}>{rest}</Text>
        </Text>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#160905' },

    // Header
    headerAmbientFade: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 170,
        zIndex: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingTop: 6,
        paddingBottom: 12,
        borderBottomWidth: 0,
    },
    menuButton: {
        width: 40,
        height: 38,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
    headerIcon: { width: 36, height: 38, alignItems: 'center', justifyContent: 'center' },
    notificationDot: {
        position: 'absolute',
        top: 7,
        right: 7,
        width: 8,
        height: 8,
        borderRadius: radii.pill,
        backgroundColor: COCOA,
    },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 28, gap: spacing.lg },

    // Context pills
    contextRow: { flexDirection: 'row', gap: 10 },
    contextPill: {
        flex: 1,
        minWidth: 0,
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 11,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: 'rgba(248,220,198,0.18)',
        backgroundColor: ESPRESSO,
        overflow: 'hidden',
    },
    contextText: { flex: 1, minWidth: 0, flexShrink: 1, fontSize: 11.5 },
    intentDropdownAnchor: { flex: 1, minWidth: 0, zIndex: 20 },
    discoveryDropdownAnchor: { flex: 1, minWidth: 0, zIndex: 19 },
    discoveryDropdownDismiss: {
        position: 'absolute',
        top: 0,
        left: -spacing.md,
        right: -Dimensions.get('window').width,
        bottom: -Dimensions.get('window').height,
        zIndex: 1,
    },
    discoveryDropdown: {
        position: 'absolute',
        top: 42,
        left: 0,
        right: 0,
        minWidth: 190,
        padding: 6,
        borderRadius: 15,
        backgroundColor: 'transparent',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(248,220,198,0.22)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
        zIndex: 2,
    },
    intentDropdownDismiss: {
        position: 'absolute',
        top: 0,
        left: -spacing.md,
        right: -Dimensions.get('window').width,
        bottom: -Dimensions.get('window').height,
        zIndex: 1,
    },
    intentDropdown: {
        position: 'absolute',
        top: 42,
        left: 0,
        right: 0,
        minWidth: 190,
        padding: 6,
        borderRadius: 15,
        backgroundColor: 'transparent',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(248,220,198,0.22)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 12,
        zIndex: 2,
    },
    intentDropdownOption: {
        minHeight: 38,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        paddingHorizontal: 9,
        borderRadius: 10,
    },
    intentDropdownOptionSelected: { backgroundColor: 'rgba(248,220,198,0.12)' },
    intentDropdownOptionText: { flex: 1, fontSize: 11.5 },

    // Original photo-led profile carousel
    profileCarousel: {
        // Extend to the screen edges so the neighbouring card preview has room,
        // while keeping the active card centred at its original width.
        marginHorizontal: -spacing.md,
    },
    profileCarouselContent: {
        // The ScrollView extends to the full screen width via negative margins.
        // Equal side padding centres the active card at every snap position.
        paddingLeft: (Dimensions.get('window').width - PROFILE_CARD_WIDTH) / 2,
        paddingRight: (Dimensions.get('window').width - PROFILE_CARD_WIDTH) / 2,
        gap: PROFILE_CARD_GAP,
    },
    profileCarouselItem: {
        width: PROFILE_CARD_WIDTH,
    },
    photoProfileCard: {
        width: '100%',
        height: 410,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#2A170F',
        borderWidth: 1,
        borderColor: 'rgba(248,220,198,0.18)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 9 },
        shadowOpacity: 0.34,
        shadowRadius: 16,
        elevation: 8,
    },
    photoProfileImage: {
        ...StyleSheet.absoluteFill,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    photoProfileTopRow: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    photoOnlinePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(22,13,8,0.72)',
    },
    onlineDotSmall: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ADE80',
    },
    photoProfileMore: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(22,13,8,0.55)',
    },
    photoProfileInfo: {
        position: 'absolute',
        left: 17,
        right: 58,
        bottom: 18,
        gap: 7,
    },
    profileActionRail: {
        position: 'absolute',
        right: 10,
        top: '34%',
        alignItems: 'center',
        gap: 10,
    },
    profileActionButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(22,13,8,0.78)',
        borderWidth: 0,
        borderColor: 'transparent',
    },
    profileActionButtonActive: {
        backgroundColor: 'rgba(75,32,23,0.96)',
        borderWidth: 0,
        borderColor: 'transparent',
    },
    photoProfileNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    photoProfileName: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 31,
        lineHeight: 36,
        color: '#FFF0DF',
        flexShrink: 1,
    },
    photoProfileMetaLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    photoProfileMetaText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 11,
        lineHeight: 16,
        color: '#F8E8D8',
        flexShrink: 1,
    },
    photoProfileInterests: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 11,
        lineHeight: 16,
        color: '#F8DCC6',
    },
    carouselHintRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingTop: 8,
    },
    upNextRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 12, paddingHorizontal: 4 },
    upNextChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingVertical: 4,
        paddingLeft: 4,
        paddingRight: 12,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: 'rgba(213,181,140,0.3)',
        backgroundColor: 'rgba(43,26,18,0.9)',
    },
    upNextPhoto: { width: 30, height: 30, borderRadius: 15 },
    emptyCard: {
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.xl,
        backgroundColor: 'rgba(43,26,18,0.9)',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(213,181,140,0.25)',
    },
    resetButton: { paddingVertical: 8, paddingHorizontal: 14 },

    // Stats
    statsRow: { flexDirection: 'row', gap: 8 },
    stat: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: 'rgba(248,220,198,0.18)',
        backgroundColor: ESPRESSO,
        overflow: 'hidden',
    },
    statNumber: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 23,
        lineHeight: 26,
        color: CREAM,
    },

    // Sections
    section: { gap: spacing.md },
    sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 26, lineHeight: 32 },
    sectionTitleLight: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 26, lineHeight: 32, color: '#F8F4F0' },
    sectionTitleGold: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 26, lineHeight: 32, color: GOLD },
    seeAll: { flexDirection: 'row', alignItems: 'center', gap: 3 },

    matchesRow: { gap: spacing.md, paddingRight: spacing.md },
    findPartnerSearch: {
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: spacing.md,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: 'rgba(248,220,198,0.24)',
        backgroundColor: 'rgba(35,19,13,0.78)',
        marginTop: spacing.sm,
    },
    findPartnerInput: {
        flex: 1,
        minWidth: 0,
        paddingVertical: 0,
        color: CREAM,
        fontSize: 14,
    },
    matchItem: { width: 78, alignItems: 'center', gap: 6 },
    matchRing: {
        width: 74,
        height: 74,
        borderRadius: radii.pill,
        padding: 2.5,
        borderWidth: 1.5,
        borderColor: 'rgba(248,220,198,0.78)',
    },
    matchPhoto: { width: '100%', height: '100%', borderRadius: radii.pill },
    onlineDot: {
        position: 'absolute',
        right: 0,
        bottom: 1,
        width: 14,
        height: 14,
        borderRadius: radii.pill,
        backgroundColor: '#4ADE80',
        borderWidth: 2,
        borderColor: ESPRESSO,
    },

    // Places
    placeRow: { flexDirection: 'row', gap: 12 },
    placeCard: {
        flex: 1,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(248,220,198,0.28)',
    },
    placeGradient: { minHeight: 92, padding: 9, gap: 2, justifyContent: 'flex-end' },
    placeIcon: {
        width: 29,
        height: 29,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
        backgroundColor: 'rgba(213,181,140,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(213,181,140,0.28)',
    },
    placeIconLight: { backgroundColor: 'rgba(84,39,25,0.08)', borderColor: 'rgba(84,39,25,0.25)' },
    placeTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 17, lineHeight: 19, color: CREAM },
    placeSubtitle: { fontSize: 11, lineHeight: 14 },
    chipRow: { flexDirection: 'row', gap: 10, width: '100%' },
    chip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        minHeight: 40,
        paddingHorizontal: 8,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: 'rgba(248,220,198,0.18)',
        overflow: 'hidden',
    },
    chipText: { fontSize: 11.5 },

    // Membership
    membershipCard: {
        overflow: 'hidden',
        gap: 12,
        padding: spacing.md,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(248,220,198,0.22)',
    },
    membershipHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    membershipIcon: {
        width: 29,
        height: 29,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(213,181,140,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(213,181,140,0.28)',
    },
    membershipCopy: { flex: 1, gap: 2 },
    membershipTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 22, lineHeight: 27, color: CREAM },
    planList: { gap: 10 },
    plan: {
        gap: 7,
        padding: 12,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.035)',
        borderWidth: 1,
        borderColor: 'rgba(199,203,217,0.14)',
    },
    planPremium: { backgroundColor: 'rgba(213,181,140,0.07)', borderColor: 'rgba(213,181,140,0.4)' },
    planHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    planName: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 20, lineHeight: 24, color: CREAM },
    feature: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    featureText: { flex: 1 },
    safetyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 2 },
    pricingNote: { textAlign: 'center' },
    compareButton: {
        minHeight: 46,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: radii.pill,
        backgroundColor: CHAMPAGNE,
        overflow: 'hidden',
    },
    footer: { alignItems: 'center', paddingTop: spacing.sm },

    // Bottom nav
    bottomAmbientFade: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 190,
        zIndex: 0,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 9,
        paddingBottom: 10,
        paddingHorizontal: 5,
        backgroundColor: 'transparent',
        borderTopWidth: 0,
    },
    bottomItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 3 },
    bottomIconWrap: { minWidth: 48, minHeight: 30, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },

    // Drawer
    drawerRoot: { ...StyleSheet.absoluteFill, flexDirection: 'row' },
    drawerBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)' },
    drawer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        height: '100%',
        width: '76%',
        maxWidth: 310,
        paddingTop: 24,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        borderRightWidth: 1,
        borderRightColor: 'rgba(84,39,25,0.25)',
        overflow: 'hidden',
    },
    drawerHeader: {
        height: 138,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(84,39,25,0.20)',
    },
    drawerLogoWrap: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    drawerItems: { paddingVertical: spacing.md, gap: 5 },
    drawerItem: { minHeight: 46, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderRadius: radii.md },
    drawerItemActive: { backgroundColor: 'rgba(84,39,25,0.12)' },
    drawerItemText: { flex: 1, marginLeft: 13 },
    logoutItem: {
        marginTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(84,39,25,0.20)',
        paddingTop: spacing.sm,
    },
    drawerFooter: { textAlign: 'center', paddingTop: spacing.sm },

    // Placeholder modals
    simpleModalRoot: { flex: 1, justifyContent: 'center', padding: spacing.lg },
    simpleModalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.72)' },
    simpleModalCard: {
        width: '90%',
        maxHeight: '88%',
        alignSelf: 'center',
        backgroundColor: '#1D110B',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(213,181,140,0.45)',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxl,
        gap: spacing.md,
    },
    modalHeading: { fontFamily: 'CormorantGaramond_500Medium', fontSize: 32, lineHeight: 38, color: colors.ivory },
    modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    placeholderSearch: {
        minHeight: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: 'rgba(199,203,217,0.23)',
        backgroundColor: 'rgba(16,11,22,0.72)',
    },
    emptyNotification: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },

    drawerLogo: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
},
});
