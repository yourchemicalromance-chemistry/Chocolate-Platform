import React, { useEffect, useRef, useState } from 'react';
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

type DashboardFilterType = 'discovery' | 'intent';

type DashboardProps = {
    onLogout?: () => void;
    onOpenProfile?: () => void;
    onOpenNearby?: () => void;
    onOpenLocationSearch?: () => void;
    onOpenPrivacyLock?: () => void;
    onOpenDashboardFilter?: (filterType: DashboardFilterType) => void;
    activeDiscoveryMode?: string;
    activeSearchIntent?: string;
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
const GOLD = '#D5B58C';
const CARAMEL = '#B88952';
const ESPRESSO = '#160D08';
const COCOA = '#4B2017';
const CHAMPAGNE = '#F8DCC6';
const CREAM = '#FFF0DF';
const PROFILE_CARD_WIDTH = Math.min(Dimensions.get('window').width * 0.72, 310);
const PROFILE_CARD_GAP = 14;
const CARD_SNAP_INTERVAL = PROFILE_CARD_WIDTH + PROFILE_CARD_GAP;

const demoProfiles: Profile[] = [
    { id: '1', name: 'Aarohi', age: 27, distance: '3 km away', profession: 'Creative Director', location: 'Delhi', interests: 'Music · Travel · Wellness', about: 'Creative soul, coffee enthusiast and passionate traveller. I enjoy meaningful conversations and discovering new places.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop', online: true },
    { id: '2', name: 'Meera', age: 25, distance: '5 km away', profession: 'Architect', location: 'New Delhi', interests: 'Art · Books · Design', about: 'Usually sketching a new idea, finding a quiet café or planning my next weekend escape.', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=700&auto=format&fit=crop', online: true },
    { id: '3', name: 'Ananya', age: 29, distance: '8 km away', profession: 'Brand Strategist', location: 'Gurugram', interests: 'Nature · Cinema · Food', about: 'Curious by nature. I love independent films, long walks and conversations that go beyond small talk.', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=700&auto=format&fit=crop' },
    { id: '4', name: 'Ishita', age: 26, distance: '10 km away', profession: 'Fitness Coach', location: 'Noida', interests: 'Fitness · Food · Music', about: 'A morning workout, good food and live music make an almost perfect day.', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700&auto=format&fit=crop' },
    { id: '5', name: 'Kiara', age: 28, distance: '4 km away', profession: 'Photographer', location: 'South Delhi', interests: 'Dance · Travel · Photography', about: 'I collect moments, not things. Always looking for a new street, story or dance floor.', image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=700&auto=format&fit=crop', online: true },
    { id: '6', name: 'Sana', age: 26, distance: '6 km away', profession: 'Product Designer', location: 'East Delhi', interests: 'Coffee · Music · Design', about: 'Design-minded, playlist-obsessed and happiest when discovering a new neighbourhood.', image: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=700&auto=format&fit=crop' },
    { id: '7', name: 'Riya', age: 30, distance: '9 km away', profession: 'Writer', location: 'Ghaziabad', interests: 'Books · Art · Culture', about: 'A little introverted, very curious, and always carrying a book I may or may not finish.', image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=700&auto=format&fit=crop', online: true },
    { id: '8', name: 'Tara', age: 27, distance: '12 km away', profession: 'Travel Consultant', location: 'Gurugram', interests: 'Nature · Films · Travel', about: 'Weekend hikes, thoughtful films and spontaneous road trips are my kind of plans.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop' },
];

const drawerItems = [
    { label: 'Home', icon: 'home-outline' },
    { label: 'Discover', icon: 'compass-outline' },
    { label: 'Kismat', icon: 'sparkles-outline' },
    { label: 'Matches', icon: 'heart-outline' },
    { label: 'Messages', icon: 'chatbubbles-outline' },
    { label: 'Premium', icon: 'diamond-outline' },
    { label: 'Preferences', icon: 'options-outline' },
    { label: 'Appearance', icon: 'color-palette-outline' },
    { label: 'Settings', icon: 'settings-outline' },
    { label: 'Safety & Privacy', icon: 'shield-checkmark-outline' },
    { label: 'Help & Support', icon: 'help-circle-outline' },
    { label: 'Log Out', icon: 'log-out-outline' },
] as const;

const bottomItems = [
    { label: 'Home', icon: 'home' },
    { label: 'Discover', icon: 'compass-outline' },
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
    onOpenNearby,
    onOpenLocationSearch,
    onOpenPrivacyLock,
    onOpenDashboardFilter,
    activeDiscoveryMode = 'Algorithmic Match',
    activeSearchIntent = 'Serious Relationship',
}: DashboardProps) {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('Home');
    const [likedProfiles, setLikedProfiles] = useState<string[]>([]);
    const [superLikedProfiles, setSuperLikedProfiles] = useState<string[]>([]);
    const [savedProfiles, setSavedProfiles] = useState<string[]>([]);
    const [passedProfiles, setPassedProfiles] = useState<string[]>([]);
    const [searchVisible, setSearchVisible] = useState(false);
    const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
    const [notificationVisible, setNotificationVisible] = useState(false);
    // New, UI-only state for the deck and the collapsed plan list
    const [deckIndex, setDeckIndex] = useState(0);
    const [plansOpen, setPlansOpen] = useState(false);

    const openFeature = (feature: string) => {
        setDrawerVisible(false);

        if (feature === 'Home') {
            setActiveTab('Home');
            return;
        }

        if (feature === 'Log Out') {
            Alert.alert('Log out', 'Connect this action to authentication when available.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Continue', onPress: () => onLogout?.() },
            ]);
            return;
        }

        if (feature === 'Profile' || feature === 'My Profile') {
            onOpenProfile?.();
        }

        Alert.alert(
            feature,
            'This feature is planned for CHOCOLATE. Its screen and backend integration are pending.',
            [{ text: 'Got it' }],
        );
    };

    const toggleLike = (id: string) => {
        setLikedProfiles((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
        setPassedProfiles((current) => current.filter((item) => item !== id));
    };

    const passProfile = (id: string) => {
        setPassedProfiles((current) => (current.includes(id) ? current : [...current, id]));
        setLikedProfiles((current) => current.filter((item) => item !== id));
    };

    const visibleProfiles = demoProfiles.filter((profile) => !passedProfiles.includes(profile.id));
    const deckSize = visibleProfiles.length;
    const safeIndex = deckSize ? deckIndex % deckSize : 0;
    const current = deckSize ? visibleProfiles[safeIndex] : undefined;
    const carouselRef = useRef<ScrollView>(null);
    const [carouselReady, setCarouselReady] = useState(false);
    const carouselProfiles = deckSize > 1
        ? [visibleProfiles[deckSize - 1], ...visibleProfiles, visibleProfiles[0]]
        : visibleProfiles;
    const upNext = deckSize > 1
        ? [1, 2]
            .map((offset) => visibleProfiles[(safeIndex + offset) % deckSize])
            .filter((p, i, arr) => p.id !== current?.id && arr.findIndex((x) => x.id === p.id) === i)
        : [];

    const handleSuperLike = (profile: Profile) => {
        setSuperLikedProfiles((current) => current.includes(profile.id) ? current : [...current, profile.id]);
        setLikedProfiles((current) => current.includes(profile.id) ? current : [...current, profile.id]);
        setDeckIndex(safeIndex + 1);
    };

    const toggleSaved = (profile: Profile) => {
        setSavedProfiles((current) => current.includes(profile.id) ? current.filter((id) => id !== profile.id) : [...current, profile.id]);
    };

    const handleLike = (profile: Profile) => {
        const wasLiked = likedProfiles.includes(profile.id);
        toggleLike(profile.id);
        if (!wasLiked) setDeckIndex(safeIndex + 1); // move on after a new like
    };

    useEffect(() => {
        if (deckSize > 1 && !carouselReady) {
            requestAnimationFrame(() => {
                carouselRef.current?.scrollTo({ x: CARD_SNAP_INTERVAL, animated: false });
                setCarouselReady(true);
            });
        }
    }, [deckSize, carouselReady]);

    const resetDeck = () => {
        setPassedProfiles([]);
        setDeckIndex(0);
        setCarouselReady(false);
    };



    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={ESPRESSO} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open navigation menu"
                    onPress={() => setDrawerVisible(true)}
                    hitSlop={10}
                    style={styles.menuButton}
                >
                    <Ionicons name="menu-outline" size={29} color={GOLD} />
                </Pressable>

                <View style={styles.headerActions}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={() => setSearchVisible(true)} style={styles.headerIcon}>
                        <Ionicons name="search-outline" size={23} color={colors.ivory} />
                    </Pressable>

                    <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => setNotificationVisible(true)} style={styles.headerIcon}>
                        <Ionicons name="notifications-outline" size={23} color={colors.ivory} />
                        <View style={styles.notificationDot} />
                    </Pressable>

                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Premium membership"
                        onPress={() => openFeature('Premium')}
                        hitSlop={10}
                        style={styles.headerIcon}
                    >
                        <Ionicons name="diamond-outline" size={25} color={GOLD} />
                    </Pressable>
                </View>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Context pills — what you're looking for, and how */}
                <View style={styles.contextRow}>
                    <Pressable
                        style={styles.contextPill}
                        onPress={() => onOpenDashboardFilter?.('intent')}
                        accessibilityRole="button"
                        accessibilityLabel={`Looking for: ${activeSearchIntent}. Change`}
                    >
                        <Ionicons name="heart-outline" size={13} color={COCOA} />
                        <Text variant="label" color={COCOA} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={styles.contextText}>
                            {activeSearchIntent}
                        </Text>
                        <Ionicons name="chevron-down" size={12} color={COCOA} />
                    </Pressable>

                    <Pressable
                        style={styles.contextPill}
                        onPress={() => onOpenDashboardFilter?.('discovery')}
                        accessibilityRole="button"
                        accessibilityLabel={`Discovery mode: ${activeDiscoveryMode}. Change`}
                    >
                        <Ionicons name="compass-outline" size={13} color={COCOA} />
                        <Text variant="label" color={COCOA} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={styles.contextText}>
                            {activeDiscoveryMode}
                        </Text>
                        <Ionicons name="chevron-down" size={12} color={COCOA} />
                    </Pressable>
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
                                    setDeckIndex(nextIndex);
                                }
                            }}
                        >
                            {carouselProfiles.map((profile, trackIndex) => (
                                <View key={`${profile.id}-${trackIndex}`} style={styles.profileCarouselItem}>
                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel={`View ${profile.name}'s profile`}
                                        onPress={() => openFeature(`Profile: ${profile.name}`)}
                                        style={styles.photoProfileCard}
                                    >
                                        <Image source={{ uri: profile.image }} style={styles.photoProfileImage} />
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
                                                accessibilityLabel={`Like ${profile.name}`}
                                                onPress={(event) => { event.stopPropagation(); handleLike(profile); }}
                                                style={[styles.profileActionButton, likedProfiles.includes(profile.id) && styles.profileActionButtonActive]}
                                            >
                                                <Ionicons name={likedProfiles.includes(profile.id) ? 'heart' : 'heart-outline'} size={21} color={likedProfiles.includes(profile.id) ? '#F28B9A' : CREAM} />
                                            </Pressable>
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`Super like ${profile.name}`}
                                                onPress={(event) => { event.stopPropagation(); handleSuperLike(profile); }}
                                                style={[styles.profileActionButton, superLikedProfiles.includes(profile.id) && styles.profileActionButtonActive]}
                                            >
                                                <Ionicons name="star" size={20} color={superLikedProfiles.includes(profile.id) ? GOLD : CREAM} />
                                            </Pressable>
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`${savedProfiles.includes(profile.id) ? 'Unsave' : 'Save'} ${profile.name}`}
                                                onPress={(event) => { event.stopPropagation(); toggleSaved(profile); }}
                                                style={[styles.profileActionButton, savedProfiles.includes(profile.id) && styles.profileActionButtonActive]}
                                            >
                                                <Ionicons name={savedProfiles.includes(profile.id) ? 'bookmark' : 'bookmark-outline'} size={20} color={savedProfiles.includes(profile.id) ? GOLD : CREAM} />
                                            </Pressable>
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel={`Open ${profile.name}'s profile`}
                                                onPress={(event) => { event.stopPropagation(); Alert.alert('Profile details', 'Profile details are coming soon.'); }}
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
                        <Text variant="heading3" color={CREAM}>You've met everyone for now</Text>
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
                        { n: '24', label: 'Likes', feature: 'Likes & Connections' },
                        { n: '54', label: 'Matches', feature: 'Matches' },
                        { n: '4', label: 'Messages', feature: 'Chats' },
                    ].map((stat) => (
                        <Pressable
                            key={stat.label}
                            style={styles.stat}
                            onPress={() => openFeature(stat.feature)}
                            accessibilityRole="button"
                            accessibilityLabel={`${stat.n} ${stat.label.toLowerCase()}, open ${stat.feature}`}
                        >
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
                        {demoProfiles.map((profile) => (
                            <Pressable key={profile.id} style={styles.matchItem} onPress={() => openFeature(`Profile: ${profile.name}`)}>
                                <View style={styles.matchRing}>
                                    <Image source={{ uri: profile.image }} style={styles.matchPhoto} />
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

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {([
                            { title: 'Discovery', icon: 'compass-outline' },
                            { title: 'Kismat Connect', icon: 'sparkles-outline' },
                            { title: 'Saved Profiles', icon: 'bookmark-outline' },
                        ] as { title: string; icon: IconName }[]).map((chip) => (
                            <Pressable key={chip.title} onPress={() => openFeature(chip.title)} style={styles.chip}>
                                <Ionicons name={chip.icon} size={13} color={GOLD} />
                                <Text variant="label" color={CREAM} style={styles.chipText}>{chip.title}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
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
                        <Text variant="label" color={ESPRESSO}>Compare all plans</Text>
                        <Ionicons name="arrow-forward" size={16} color={ESPRESSO} />
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text variant="caption" color={colors.moonlight.silver}>CHOCOLATE · Where Connection Grows</Text>
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
                            <View style={[styles.bottomIconWrap, active && styles.bottomIconActive]}>
                                <Ionicons name={item.icon as IconName} size={22} color={active ? GOLD : colors.moonlight.silver} />
                            </View>
                            <Text variant="caption" numberOfLines={1} style={styles.bottomLabel} color={active ? GOLD : colors.moonlight.silver}>
                                {item.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Navigation drawer */}
            <Modal visible={drawerVisible} transparent animationType="fade" onRequestClose={() => setDrawerVisible(false)}>
                <View style={styles.drawerRoot}>
                    <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerVisible(false)} />
                    <View style={styles.drawer}>
                        <LinearGradient colors={['#2B1A12', '#21140E', ESPRESSO]} style={StyleSheet.absoluteFill} />

                        <View style={styles.drawerHeader}>
                            <View>
                                <Text variant="heading3" color={GOLD}>CHOCOLATE</Text>
                                <Text variant="caption" color={colors.moonlight.silver}>Where Connection Grows</Text>
                            </View>
                            <Pressable onPress={() => setDrawerVisible(false)}>
                                <Ionicons name="close" size={25} color={colors.ivory} />
                            </Pressable>
                        </View>

                        <View style={styles.drawerProfile}>
                            <Image source={{ uri: demoProfiles[0].image }} style={styles.drawerAvatar} />
                            <View style={{ flex: 1 }}>
                                <Text variant="heading3">Your profile</Text>
                                <Text variant="caption" color={colors.moonlight.silver}>Demo account · Setup complete</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={19} color={colors.moonlight.silver} />
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerItems}>
                            {drawerItems.map((item) => (
                                <Pressable
                                    key={item.label}
                                    onPress={() => openFeature(item.label)}
                                    style={[
                                        styles.drawerItem,
                                        item.label === 'Home' && styles.drawerItemActive,
                                        item.label === 'Log Out' && styles.logoutItem,
                                    ]}
                                >
                                    <Ionicons
                                        name={item.icon as IconName}
                                        size={21}
                                        color={item.label === 'Log Out' || item.label === 'Home' ? GOLD : colors.moonlight.silver}
                                    />
                                    <Text variant="label" color={item.label === 'Log Out' ? GOLD : colors.ivory} style={styles.drawerItemText}>
                                        {item.label}
                                    </Text>
                                    {item.label === 'Premium' && <Ionicons name="sparkles" size={16} color={GOLD} />}
                                </Pressable>
                            ))}
                        </ScrollView>

                        <Text variant="caption" color={colors.moonlight.silver} style={styles.drawerFooter}>
                            Made for connections.
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Search placeholder */}
            <Modal visible={searchVisible} transparent animationType="fade" onRequestClose={() => setSearchVisible(false)}>
                <View style={styles.simpleModalRoot}>
                    <Pressable style={styles.simpleModalBackdrop} onPress={() => setSearchVisible(false)} />
                    <View style={styles.simpleModalCard}>
                        <View style={styles.modalTitleRow}>
                            <Text variant="heading3" style={styles.modalHeading}>Search CHOCOLATE</Text>
                            <Pressable onPress={() => setSearchVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.ivory} />
                            </Pressable>
                        </View>
                        <View style={styles.placeholderSearch}>
                            <Ionicons name="search-outline" size={20} color={colors.moonlight.silver} />
                            <Text variant="bodySmall" color={colors.moonlight.silver}>
                                Search by interests, location or connection type
                            </Text>
                        </View>
                        <Text variant="caption" color={GOLD}>Search functionality pending</Text>
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
    screen: { flex: 1, backgroundColor: ESPRESSO },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingTop: 6,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(213,181,140,0.25)',
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
        backgroundColor: GOLD,
    },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 28, gap: spacing.lg },

    // Context pills
    contextRow: { flexDirection: 'row', gap: 10 },
    contextPill: {
        flex: 1,
        minWidth: 0,
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: 'rgba(112,69,55,0.28)',
        backgroundColor: CHAMPAGNE,
    },
    contextText: { flex: 1, minWidth: 0, flexShrink: 1, fontSize: 11.5 },

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
        backgroundColor: '#3A2116',
        borderWidth: 1,
        borderColor: 'rgba(213,181,140,0.2)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
        elevation: 7,
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
        borderColor: 'rgba(213,181,140,0.2)',
        backgroundColor: 'rgba(255,255,255,0.04)',
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
        borderColor: 'rgba(213,181,140,0.38)',
        backgroundColor: 'rgba(48,29,21,0.62)',
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
        borderColor: GOLD,
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
        borderColor: 'rgba(213,181,140,0.4)',
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
    chipRow: { gap: 10, paddingRight: spacing.md },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        minHeight: 36,
        paddingHorizontal: 8,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: 'rgba(213,181,140,0.32)',
        backgroundColor: 'rgba(43,26,18,0.9)',
    },
    chipText: { fontSize: 11.5 },

    // Membership
    membershipCard: {
        overflow: 'hidden',
        gap: 12,
        padding: spacing.md,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(213,181,140,0.4)',
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
        backgroundColor: GOLD,
    },
    footer: { alignItems: 'center', paddingTop: spacing.sm },

    // Bottom nav
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 9,
        paddingBottom: 10,
        paddingHorizontal: 5,
        backgroundColor: '#1D110B',
        borderTopWidth: 1,
        borderTopColor: 'rgba(213,181,140,0.22)',
    },
    bottomItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 3 },
    bottomLabel: { width: '100%', textAlign: 'center', fontSize: 11, lineHeight: 14 },
    bottomIconWrap: { minWidth: 48, minHeight: 30, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
    bottomIconActive: { backgroundColor: 'rgba(213,181,140,0.16)' },

    // Drawer
    drawerRoot: { flex: 1, flexDirection: 'row' },
    drawerBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)' },
    drawer: {
        width: '82%',
        maxWidth: 340,
        height: '100%',
        paddingTop: 52,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        borderRightWidth: 1,
        borderRightColor: 'rgba(213,181,140,0.3)',
        overflow: 'hidden',
    },
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(199,203,217,0.15)',
    },
    drawerProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(199,203,217,0.15)',
    },
    drawerAvatar: { width: 49, height: 49, borderRadius: radii.pill, borderWidth: 1.5, borderColor: GOLD },
    drawerItems: { paddingVertical: spacing.md, gap: 5 },
    drawerItem: { minHeight: 46, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderRadius: radii.md },
    drawerItemActive: { backgroundColor: 'rgba(213,181,140,0.10)' },
    drawerItemText: { flex: 1, marginLeft: 13 },
    logoutItem: {
        marginTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(199,203,217,0.15)',
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
});
