
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text as RNText,
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radii, spacing } from '../theme';
import { Text } from '../components/Text';
import { GradientText } from '../components/GradientText';
import type { DashboardFilterType } from './DashboardFilterScreen';

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
    interests: string;
    image: string;
    online?: boolean;
};

const discoveryCardWidth = (Dimensions.get('window').width - spacing.md * 2 - 16) / 3;

const demoProfiles: Profile[] = [
    {
        id: '1',
        name: 'Aarohi',
        age: 27,
        distance: '3 km away',
        interests: 'Music · Travel',
        image:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
        online: true,
    },
    {
        id: '2',
        name: 'Meera',
        age: 25,
        distance: '5 km away',
        interests: 'Art · Books',
        image:
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop',
        online: true,
    },
    {
        id: '3',
        name: 'Ananya',
        age: 29,
        distance: '8 km away',
        interests: 'Nature · Cinema',
        image:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop',
    },
    {
        id: '4',
        name: 'Ishita',
        age: 26,
        distance: '10 km away',
        interests: 'Fitness · Food',
        image:
            'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop',
    },
    {
        id: '5',
        name: 'Kiara',
        age: 28,
        distance: '4 km away',
        interests: 'Dance · Travel',
        image:
            'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&auto=format&fit=crop',
        online: true,
    },
    {
        id: '6',
        name: 'Sana',
        age: 26,
        distance: '6 km away',
        interests: 'Coffee · Music',
        image:
            'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=600&auto=format&fit=crop',
    },
    {
        id: '7',
        name: 'Riya',
        age: 30,
        distance: '9 km away',
        interests: 'Books · Art',
        image:
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop',
        online: true,
    },
    {
        id: '8',
        name: 'Tara',
        age: 27,
        distance: '12 km away',
        interests: 'Nature · Films',
        image:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop',
    },
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
    const [passedProfiles, setPassedProfiles] = useState<string[]>([]);
    const [searchVisible, setSearchVisible] = useState(false);
    const [notificationVisible, setNotificationVisible] = useState(false);

    const openFeature = (feature: string) => {
        setDrawerVisible(false);

        if (feature === 'Home') {
            setActiveTab('Home');
            return;
        }

        if (feature === 'Log Out') {
            Alert.alert('Log out', 'Connect this action to authentication when available.', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue',
                    onPress: () => onLogout?.(),
                },
            ]);
            return;
        }

        if (feature === 'Profile' || feature === 'My Profile') {
            onOpenProfile?.();
        }

        Alert.alert(
            feature,
            'This feature is planned for CHEMISTREE. Its screen and backend integration are pending.',
            [{ text: 'Got it' }],
        );
    };

    const toggleLike = (id: string) => {
        setLikedProfiles((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        );

        setPassedProfiles((current) => current.filter((item) => item !== id));
    };

    const passProfile = (id: string) => {
        setPassedProfiles((current) =>
            current.includes(id) ? current : [...current, id],
        );
        setLikedProfiles((current) => current.filter((item) => item !== id));
    };

    const visibleProfiles = demoProfiles.filter(
        (profile) => !passedProfiles.includes(profile.id),
    );

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.midnight} />

            {/* Darkened CHEMISTREE background */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Image
                    source={require('../assets/backgrounds/userDash-bg.png')}
                    resizeMode="cover"
                    style={StyleSheet.absoluteFill}
                />
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: 'rgba(0, 0, 0, 0.70)' },
                    ]}
                />
            </View>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.brand}>
                    <View style={styles.brandTitle}>
                        <GradientText variant="heading3" align="flex-start">
                            CHEMISTREE
                        </GradientText>
                    </View>

                    <Text
                        variant="caption"
                        color={colors.moonlight.silver}
                        style={styles.brandTagline}
                    >
                        Where Connection Grows
                    </Text>
                </View>

                <View style={styles.headerActions}>
                    <Pressable
                        accessibilityLabel="Search"
                        onPress={() => setSearchVisible(true)}
                        style={styles.headerIcon}
                    >
                        <Ionicons name="search-outline" size={22} color={colors.ivory} />
                    </Pressable>

                    <Pressable
                        accessibilityLabel="Notifications"
                        onPress={() => setNotificationVisible(true)}
                        style={styles.headerIcon}
                    >
                        <Ionicons
                            name="notifications-outline"
                            size={22}
                            color={colors.ivory}
                        />
                        <View style={styles.notificationDot} />
                    </Pressable>

                    <Pressable
                        accessibilityLabel="Open profile menu"
                        onPress={() => setDrawerVisible(true)}
                        hitSlop={10}
                    >
                        <Image
                            source={require('../assets/branding/chemistry-atom-heart.png')}
                            style={styles.headerAtomHeart}
                            resizeMode="contain"
                        />
                    </Pressable>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Personalized greeting banner */}
                <View style={styles.personalBanner}>
                    <LinearGradient
                        colors={['#11152B', '#21102B', '#35102D']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.bannerAvatarWrap}>
                        <Image
                            source={{ uri: demoProfiles[0].image }}
                            style={styles.bannerAvatar}
                        />
                        <Pressable
                            style={styles.bannerEditBadge}
                            onPress={() => openFeature('My Profile')}
                        >
                            <Ionicons name="pencil" size={13} color={colors.ivory} />
                        </Pressable>
                    </View>

                    <View style={styles.bannerCopy}>
                        <Pressable
                            style={styles.bannerMode}
                            onPress={() => onOpenDashboardFilter?.('discovery')}
                            accessibilityRole="button"
                            accessibilityLabel={`Discovery mode: ${activeDiscoveryMode}`}
                        >
                            <Text
                                variant="bodySmall"
                                color={colors.moonlight.silver}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                style={styles.bannerModeText}
                            >
                                {activeSearchIntent} · {activeDiscoveryMode}
                            </Text>
                            <Ionicons
                                name="chevron-forward"
                                size={15}
                                color={colors.moonlight.pink}
                            />
                        </Pressable>

                        <View style={styles.bannerStatsRow}>
                            <Pressable
                                style={styles.bannerStat}
                                onPress={() => openFeature('Likes & Connections')}
                                accessibilityRole="button"
                                accessibilityLabel="24 likes, open Likes and Connections"
                            >
                                <Text style={styles.bannerStatNumber}>24</Text>
                                <Text style={styles.bannerStatLabel}>Likes</Text>
                            </Pressable>
                            <Pressable
                                style={styles.bannerStat}
                                onPress={() => openFeature('Matches')}
                                accessibilityRole="button"
                                accessibilityLabel="54 matches, open Matches"
                            >
                                <Text style={styles.bannerStatNumber}>54</Text>
                                <Text style={styles.bannerStatLabel}>Matches</Text>
                            </Pressable>
                            <Pressable
                                style={styles.bannerStat}
                                onPress={() => openFeature('Chats')}
                                accessibilityRole="button"
                                accessibilityLabel="4 messages, open Chats"
                            >
                                <Text style={styles.bannerStatNumber}>4</Text>
                                <Text style={styles.bannerStatLabel}>Messages</Text>
                            </Pressable>
                        </View>
                        <Text style={styles.bannerMatchNote} numberOfLines={1}>
                            Matches based on your discovery mode
                        </Text>
                        <Pressable
                            style={styles.bannerAboutMe}
                            onPress={() => openFeature('My Profile')}
                            accessibilityRole="button"
                            accessibilityLabel="About Me preview. Tap to view or edit your profile"
                        >
                            <Text style={styles.bannerAboutMeLabel}>ABOUT ME</Text>
                            <Text style={styles.bannerAboutMeText} numberOfLines={2} ellipsizeMode="tail">
                                Add a little about yourself, what you love, and the connection you hope to find.
                            </Text>
                            <Text style={styles.bannerAboutMeLink}>View profile  ›</Text>
                        </Pressable>
                    </View>

                </View>

                {/* Quick actions */}
                <View style={[styles.section, styles.quickActionsSection]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.shortcutGrid}
                    >
                        <ShortcutCard
                            icon="shield-checkmark-outline"
                            title="Privacy Lock"
                            subtitle="Control visibility"
                            colors={['#57264F', '#A83D83']}
                            onPress={() => onOpenPrivacyLock?.()}
                        />
                        <ShortcutCard
                            icon="compass-outline"
                            title="Discovery"
                            subtitle="Find your way"
                            colors={['#243B70', '#5B7CFF']}
                            onPress={() => openFeature('Discovery')}
                        />
                        <ShortcutCard
                            icon="diamond-outline"
                            title="Premium"
                            subtitle="More possibilities"
                            colors={['#74345E', '#C026D3']}
                            onPress={() => openFeature('Premium')}
                        />
                        <ShortcutCard
                            icon="navigate-outline"
                            title="Nearby"
                            subtitle="Explore this area"
                            colors={['#174A4A', '#258B83']}
                            onPress={() => onOpenNearby?.()}
                        />
                        <ShortcutCard
                            icon="earth-outline"
                            title="Location Search"
                            subtitle="Explore anywhere"
                            colors={['#3B285F', '#8254B8']}
                            onPress={() => onOpenLocationSearch?.()}
                        />
                        <ShortcutCard
                            icon="sparkles-outline"
                            title="Kismat Connect"
                            subtitle="Let fate connect"
                            colors={['#5A2D46', '#B84A85']}
                            onPress={() => openFeature('Kismat Connect')}
                        />
                        <ShortcutCard
                            icon="bookmark-outline"
                            title="Saved Profiles"
                            subtitle="Keep them close"
                            colors={['#24465D', '#347DA5']}
                            onPress={() => openFeature('Saved Profiles')}
                        />
                    </ScrollView>
                </View>

                {/* Matches */}
                <View style={styles.section}>
                    <SectionHeading
                        title="New Matches"
                        action="See all"
                        onAction={() => openFeature('Matches')}
                    />

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.matchesRow}
                    >
                        {demoProfiles.map((profile) => (
                            <Pressable
                                key={profile.id}
                                style={styles.matchItem}
                                onPress={() => openFeature(`Profile: ${profile.name}`)}
                            >
                                <View style={styles.matchPhotoBorder}>
                                    <Image
                                        source={{ uri: profile.image }}
                                        style={styles.matchPhoto}
                                    />
                                    {profile.online && <View style={styles.onlineDot} />}
                                </View>
                                <Text variant="label" style={styles.matchName}>
                                    {profile.name}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                {/* Discovery feed — show one discovery mode at a time */}
                <View style={styles.section}>
                    <SectionHeading
                        title={activeDiscoveryMode === 'Algorithmic Match' ? 'Algorithmic Matches' : activeDiscoveryMode}
                        action="Filter"
                        onAction={() => onOpenDashboardFilter?.('discovery')}
                    />
                    {visibleProfiles.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="sparkles-outline" size={30} color={colors.moonlight.lavender} />
                            <Text variant="heading3">You've explored everyone!</Text>
                            <Text variant="bodySmall" color={colors.moonlight.silver}>
                                Reset the demo cards to explore them again.
                            </Text>
                            <Pressable onPress={() => setPassedProfiles([])} style={styles.resetButton}>
                                <Text variant="label" color={colors.moonlight.pink}>Reset demo profiles</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.discoveryGrid}
                        >
                            {visibleProfiles.map((profile) => (
                                <CompactProfileCard
                                    key={`mode-${activeDiscoveryMode}-${profile.id}`}
                                    profile={profile}
                                    liked={likedProfiles.includes(profile.id)}
                                    onPress={() => openFeature(`Profile: ${profile.name}`)}
                                    onPass={() => passProfile(profile.id)}
                                    onLike={() => toggleLike(profile.id)}
                                    onSuperLike={() => Alert.alert(
                                        'Super Like',
                                        'Super Likes are a planned feature. This demo does not send anything.',
                                    )}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Search-intent row — separate from discovery mode */}
                <View style={styles.section}>
                    <SectionHeading
                        title={activeSearchIntent}
                        action="Filter"
                        onAction={() => onOpenDashboardFilter?.('intent')}
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.discoveryGrid}
                    >
                        {visibleProfiles.map((profile) => (
                            <CompactProfileCard
                                key={`intent-${activeSearchIntent}-${profile.id}`}
                                profile={profile}
                                liked={likedProfiles.includes(profile.id)}
                                onPress={() => openFeature(`Profile: ${profile.name}`)}
                                onPass={() => passProfile(profile.id)}
                                onLike={() => toggleLike(profile.id)}
                                onSuperLike={() => Alert.alert('Super Like', 'This demo does not send Super Likes.')}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Membership comparison */}
                <View style={styles.membershipCard}>
                    <LinearGradient
                        colors={['#241332', '#171126', '#101020']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.membershipHeader}>
                        <View style={styles.membershipHeaderIcon}>
                            <Ionicons name="layers-outline" size={21} color="#F8D77A" />
                        </View>
                        <View style={styles.membershipHeaderCopy}>
                            <Text variant="label" color="#F8D77A">CHEMISTREE MEMBERSHIPS</Text>
                            <Text style={styles.membershipTitle}>Find Your Perfect Plan</Text>
                            <Text variant="caption" color={colors.moonlight.silver}>
                                Discover, connect and choose how far you want to take your experience.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.membershipPlan}>
                        <View style={styles.membershipPlanHeading}>
                            <Text style={styles.membershipPlanName}>FREE</Text>
                            <Text style={styles.membershipPlanTag}>Discover</Text>
                        </View>
                        <Text style={styles.membershipPlanDescription}>Discover people and express interest.</Text>
                        <View style={styles.membershipFeatureList}>
                            <MembershipFeature text="Browse profiles and basic discovery" />
                            <MembershipFeature text="Limited likes and mutual matches" />
                            <MembershipFeature text="No sending, reading or replying to messages" unavailable />
                        </View>
                    </View>

                    <View style={styles.membershipPlan}>
                        <View style={styles.membershipPlanHeading}>
                            <Text style={styles.membershipPlanName}>STANDARD</Text>
                            <Text style={[styles.membershipPlanTag, styles.standardPlanTag]}>Connect</Text>
                        </View>
                        <Text style={styles.membershipPlanDescription}>Turn mutual interest into conversations.</Text>
                        <View style={styles.membershipFeatureList}>
                            <MembershipFeature text="Everything in Free" />
                            <MembershipFeature text="Send, receive and read messages" />
                            <MembershipFeature text="More likes, standard search filters and saved profiles" />
                        </View>
                    </View>

                    <View style={[styles.membershipPlan, styles.premiumMembershipPlan]}>
                        <View style={styles.membershipPlanHeading}>
                            <Text style={[styles.membershipPlanName, styles.premiumPlanName]}>PREMIUM</Text>
                            <Text style={[styles.membershipPlanTag, styles.premiumPlanTag]}>Advanced</Text>
                        </View>
                        <Text style={styles.membershipPlanDescription}>More discovery power, visibility and discretion.</Text>
                        <View style={styles.membershipFeatureList}>
                            <MembershipFeature text="Everything in Standard" premium />
                            <MembershipFeature text="See who liked you" premium />
                            <MembershipFeature text="Advanced search filters, profile boost and priority visibility" premium />
                            <MembershipFeature text="Advanced Privacy & Discoverability, including the contact Exception List" premium />
                        </View>
                    </View>

                    <View style={styles.membershipSafetyNote}>
                        <Ionicons name="shield-checkmark-outline" size={15} color="#48DCCB" />
                        <Text variant="caption" color={colors.moonlight.silver} style={styles.membershipSafetyText}>
                            Basic safety tools, including blocking and reporting, are available to everyone.
                        </Text>
                    </View>

                    <Pressable
                        onPress={() => openFeature('Membership & Plans')}
                        style={styles.membershipCompareButton}
                        accessibilityRole="button"
                        accessibilityLabel="Compare all CHEMISTREE membership plans"
                    >
                        <Text variant="label" color="#100B16">Compare All Plans</Text>
                        <Ionicons name="arrow-forward" size={16} color="#100B16" />
                    </Pressable>
                    <Text variant="caption" color={colors.moonlight.silver} style={styles.membershipPricingNote}>
                        Membership prices and final plan limits will be announced later.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text variant="caption" color={colors.moonlight.silver}>
                        CHEMISTREE · Where Connection Grows
                    </Text>
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

                                if (item.label !== 'Home') {
                                    openFeature(item.label);
                                }
                            }}
                            style={styles.bottomItem}
                        >
                            <View style={[styles.bottomIconWrap, active && styles.bottomIconActive]}>
                                <Ionicons
                                    name={item.icon as React.ComponentProps<typeof Ionicons>['name']}
                                    size={21}
                                    color={
                                        active
                                            ? colors.moonlight.pink
                                            : colors.moonlight.silver
                                    }
                                />
                            </View>
                            <Text
                                variant="caption"
                                numberOfLines={2}
                                style={styles.bottomLabel}
                                color={
                                    active
                                        ? colors.moonlight.pink
                                        : colors.moonlight.silver
                                }
                            >
                                {item.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Navigation drawer */}
            <Modal
                visible={drawerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDrawerVisible(false)}
            >
                <View style={styles.drawerRoot}>
                    <Pressable
                        style={styles.drawerBackdrop}
                        onPress={() => setDrawerVisible(false)}
                    />

                    <View style={styles.drawer}>
                        <LinearGradient
                            colors={['#211432', '#151126', '#100B16']}
                            style={StyleSheet.absoluteFill}
                        />

                        <View style={styles.drawerHeader}>
                            <View>
                                <GradientText variant="heading3">CHEMISTREE</GradientText>
                                <Text
                                    variant="caption"
                                    color={colors.moonlight.silver}
                                >
                                    Where Connection Grows
                                </Text>
                            </View>
                            <Pressable onPress={() => setDrawerVisible(false)}>
                                <Ionicons
                                    name="close"
                                    size={25}
                                    color={colors.ivory}
                                />
                            </Pressable>
                        </View>

                        <View style={styles.drawerProfile}>
                            <Image
                                source={{ uri: demoProfiles[0].image }}
                                style={styles.drawerAvatar}
                            />
                            <View style={{ flex: 1 }}>
                                <Text variant="heading3">Your profile</Text>
                                <Text
                                    variant="caption"
                                    color={colors.moonlight.silver}
                                >
                                    Demo account · Setup complete
                                </Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={19}
                                color={colors.moonlight.silver}
                            />
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.drawerItems}
                        >
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
                                        name={item.icon as React.ComponentProps<typeof Ionicons>['name']}
                                        size={21}
                                        color={
                                            item.label === 'Log Out'
                                                ? '#F472B6'
                                                : item.label === 'Home'
                                                    ? colors.moonlight.pink
                                                    : colors.moonlight.silver
                                        }
                                    />
                                    <Text
                                        variant="label"
                                        color={
                                            item.label === 'Log Out'
                                                ? colors.moonlight.pink
                                                : colors.ivory
                                        }
                                        style={styles.drawerItemText}
                                    >
                                        {item.label}
                                    </Text>
                                    {item.label === 'Premium' && (
                                        <Ionicons
                                            name="sparkles"
                                            size={16}
                                            color={colors.moonlight.pink}
                                        />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>

                        <Text
                            variant="caption"
                            color={colors.moonlight.silver}
                            style={styles.drawerFooter}
                        >
                            Made for connections.
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Search placeholder */}
            <Modal
                visible={searchVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSearchVisible(false)}
            >
                <View style={styles.simpleModalRoot}>
                    <Pressable
                        style={styles.simpleModalBackdrop}
                        onPress={() => setSearchVisible(false)}
                    />
                    <View style={styles.simpleModalCard}>
                        <View style={styles.modalTitleRow}>
                            <Text variant="heading3" style={styles.modalHeading}>Search CHEMISTREE</Text>
                            <Pressable onPress={() => setSearchVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.ivory} />
                            </Pressable>
                        </View>
                        <View style={styles.placeholderSearch}>
                            <Ionicons
                                name="search-outline"
                                size={20}
                                color={colors.moonlight.silver}
                            />
                            <Text variant="bodySmall" color={colors.moonlight.silver}>
                                Search by interests, location or connection type
                            </Text>
                        </View>
                        <Text variant="caption" color={colors.moonlight.pink}>
                            Search functionality pending
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Notifications placeholder */}
            <Modal
                visible={notificationVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setNotificationVisible(false)}
            >
                <View style={styles.simpleModalRoot}>
                    <Pressable
                        style={styles.simpleModalBackdrop}
                        onPress={() => setNotificationVisible(false)}
                    />
                    <View style={styles.simpleModalCard}>
                        <View style={styles.modalTitleRow}>
                            <Text variant="heading3" style={styles.modalHeading}>Notifications</Text>
                            <Pressable onPress={() => setNotificationVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.ivory} />
                            </Pressable>
                        </View>
                        <View style={styles.emptyNotification}>
                            <Ionicons
                                name="notifications-outline"
                                size={36}
                                color={colors.moonlight.lavender}
                            />
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

function MembershipFeature({
    text,
    unavailable = false,
    premium = false,
}: {
    text: string;
    unavailable?: boolean;
    premium?: boolean;
}) {
    const color = unavailable ? '#A39BAF' : premium ? '#F8D77A' : '#48DCCB';

    return (
        <View style={styles.membershipFeature}>
            <Ionicons
                name={unavailable ? 'close-circle-outline' : 'checkmark-circle'}
                size={14}
                color={color}
            />
            <Text variant="caption" color={unavailable ? '#A39BAF' : colors.ivory} style={styles.membershipFeatureText}>
                {text}
            </Text>
        </View>
    );
}

function CompactProfileCard({
    profile,
    liked,
    onPress,
    onPass,
    onLike,
    onSuperLike,
}: {
    profile: Profile;
    liked: boolean;
    onPress: () => void;
    onPass: () => void;
    onLike: () => void;
    onSuperLike: () => void;
}) {
    const cardTiltById: Record<string, string> = {
        '1': '-1.4deg',
        '2': '1.2deg',
        '3': '-1deg',
        '4': '1.4deg',
        '5': '-1.2deg',
        '6': '1deg',
        '7': '-1.3deg',
        '8': '1.1deg',
    };

    return (
        <View
            style={[
                styles.compactProfileCard,
                {
                    width: discoveryCardWidth,
                    transform: [{ rotate: cardTiltById[profile.id] ?? '-1deg' }],
                },
            ]}
        >
            <Pressable onPress={onPress} style={styles.compactProfileVisual}>
                <Image source={{ uri: profile.image }} style={styles.compactProfileImage} />
                <LinearGradient
                    colors={['transparent', 'rgba(12,8,20,0.96)']}
                    style={styles.compactImageOverlay}
                />
                <View style={styles.compactDemoBadge}>
                    <Ionicons name="flask-outline" size={9} color={colors.ivory} />
                    <Text style={styles.compactBadgeText}>DEMO</Text>
                </View>
                {profile.online && <View style={styles.compactOnlineDot} />}
                <View style={styles.compactProfileInfo}>
                    <Text style={styles.compactProfileName} numberOfLines={1}>
                        {profile.name}, {profile.age}
                    </Text>
                    <View style={styles.compactDistanceRow}>
                        <Ionicons name="location-outline" size={10} color={colors.moonlight.silver} />
                        <Text style={styles.compactDistanceText} numberOfLines={1}>{profile.distance}</Text>
                    </View>
                    <Text style={styles.compactInterests} numberOfLines={1}>{profile.interests}</Text>
                </View>
            </Pressable>
            <View style={styles.compactActions}>
                <Pressable accessibilityLabel={`Pass on ${profile.name}`} onPress={onPass} style={styles.compactActionButton}>
                    <Ionicons name="close" size={17} color={colors.moonlight.silver} />
                </Pressable>
                <Pressable accessibilityLabel={`Super like ${profile.name}`} onPress={onSuperLike} style={[styles.compactActionButton, styles.compactStarButton]}>
                    <Ionicons name="star" size={15} color={colors.moonlight.lavender} />
                </Pressable>
                <Pressable accessibilityLabel={`Like ${profile.name}`} onPress={onLike} style={[styles.compactActionButton, styles.compactHeartButton, liked && styles.compactHeartButtonActive]}>
                    <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? colors.ivory : colors.moonlight.pink} />
                </Pressable>
            </View>
        </View>
    );
}

function SectionHeading({
    title,
    subtitle,
    action,
    onAction,
}: {
    title: string;
    subtitle?: string;
    action?: string;
    onAction?: () => void;
}) {
    return (
        <View style={styles.sectionHeading}>
            <View style={styles.sectionHeadingCopy}>
                {title === 'New Matches' ? (
                    <Text style={styles.matchesHeading}>
                        <Text style={styles.matchesHeadingWhite}>New </Text>
                        <Text style={styles.matchesHeadingPink}>Matches</Text>
                    </Text>
                ) : title === 'Algorithmic Matches' ? (
                    <Text style={styles.matchesHeading}>
                        <Text style={styles.matchesHeadingWhite}>Algorithmic </Text>
                        <Text style={styles.matchesHeadingPink}>Matches</Text>
                    </Text>
                ) : title === 'Serious Relationship' ||
                    title === 'Casual Dating' ||
                    title === 'Fun & Flirting' ||
                    title === 'Open to Exploring' ||
                    title === 'Marriage' ? (
                    <Text style={styles.matchesHeading}>
                        <Text style={styles.matchesHeadingWhite}>{title.split(' ')[0]} </Text>
                        <Text style={styles.matchesHeadingPink}>{title.split(' ').slice(1).join(' ')}</Text>
                    </Text>
                ) : (
                    <Text variant="heading3">{title}</Text>
                )}
                {subtitle ? (
                    <Text variant="bodySmall" color={colors.moonlight.silver}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>

            {action && (
                <Pressable
                    onPress={onAction}
                    hitSlop={8}
                    style={[styles.sectionAction, action === 'Filter' && styles.filterButton]}
                >
                    {action === 'Filter' && <Ionicons name="options-outline" size={15} color={colors.moonlight.pink} />}
                    <Text
                        variant="label"
                        color={colors.moonlight.pink}
                        style={title === 'New Matches' ? styles.matchesSeeAll : undefined}
                    >
                        {action}
                    </Text>
                    {title === 'New Matches' && (
                        <Ionicons
                            name="chevron-forward"
                            size={15}
                            color={colors.moonlight.pink}
                        />
                    )}
                </Pressable>
            )}
        </View>
    );
}

function ShortcutCard({
    icon,
    title,
    subtitle,
    onPress,
}: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    subtitle: string;
    colors: [string, string, ...string[]];
    onPress: () => void;
}) {
    const accent =
        title === 'Premium'
            ? '#F472B6'
            : title === 'Discovery'
                ? '#A78BFA'
                : title === 'Location Search'
                    ? '#48DCCB'
                    : title === 'Privacy Lock'
                        ? '#F472B6'
                        : title === 'Saved Profiles'
                            ? '#48DCCB'
                            : title === 'Kismat Connect'
                                ? '#F472B6'
                                : '#D85CE6';

    const cardSubtitle =
        title === 'My Profile'
            ? 'Complete 80%'
            : title === 'Privacy Lock'
                ? 'Control visibility'
                : title === 'Preferences'
                    ? 'Update anytime'
                    : title === 'Discovery'
                    ? 'Algorithmic Match'
                    : title === 'Premium'
                        ? 'Unlock more'
                        : subtitle;

    return (
        <Pressable onPress={onPress} style={styles.shortcutCard}>
            <LinearGradient
                colors={['#10101D', '#0B0A14', '#1B0D1D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shortcutGradient}
            >
                <Ionicons name={icon} size={23} color={accent} />
                <Text
                    variant="label"
                    color={colors.ivory}
                    numberOfLines={1}
                    style={styles.shortcutTitle}
                >
                    {title}
                </Text>
                <Text
                    variant="bodySmall"
                    color={colors.moonlight.silver}
                    numberOfLines={2}
                    style={styles.shortcutSubtitle}
                >
                    {cardSubtitle}
                </Text>
                {title === 'My Profile' ? (
                    <View style={styles.shortcutProgressTrack}>
                        <LinearGradient
                            colors={['#F472B6', '#D946EF']}
                            style={styles.shortcutProgressFill}
                        />
                    </View>
                ) : (
                    <View style={styles.shortcutArrow}>
                        <Ionicons name="chevron-forward" size={17} color={accent} />
                    </View>
                )}
            </LinearGradient>
        </Pressable>
    );
}

function DemoNote() {
    return (
        <View style={styles.demoNote}>
            <Ionicons
                name="flask-outline"
                size={14}
                color={colors.moonlight.lavender}
            />
            <Text variant="caption" color={colors.moonlight.silver}>
                Illustrative demo profiles · No real matches or location data
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#080914',
    },
    ambientGlow: {
        position: 'absolute',
        top: 60,
        right: -100,
        width: 230,
        height: 300,
        borderRadius: 160,
        backgroundColor: 'rgba(91,124,255,0.08)',
    },
    backgroundGlowUpper: {
        position: 'absolute',
        top: -78,
        left: '8%',
        width: 340,
        height: 250,
        opacity: 0.9,
        transform: [{ rotate: '-12deg' }],
    },
    backgroundGlowRight: {
        position: 'absolute',
        top: -35,
        right: -125,
        width: 330,
        height: 310,
        opacity: 0.88,
        transform: [{ rotate: '18deg' }],
    },
    backgroundGlowLeft: {
        position: 'absolute',
        top: 120,
        left: -205,
        width: 350,
        height: 280,
        opacity: 0.75,
        transform: [{ rotate: '22deg' }],
    },
    backgroundGlowLower: {
        position: 'absolute',
        bottom: 15,
        right: -190,
        width: 390,
        height: 330,
        opacity: 0.72,
        transform: [{ rotate: '-20deg' }],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 6,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(244,114,182,0.12)',
        gap: 6,
    },
    headerIcon: {
        width: 30,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    brand: {
        flex: 1,
        minWidth: 0,
        flexShrink: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 0,
    },
    brandTagline: {
        alignSelf: 'flex-start',
        marginTop: -3,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        flexShrink: 0,
    },
    headerAvatar: {
        width: 30,
        height: 30,
        borderRadius: radii.pill,
        borderWidth: 1.5,
        borderColor: colors.moonlight.pink,
    },
    headerAtomHeart: {
        width: 38,
        height: 38,
    },
    notificationDot: {
        position: 'absolute',
        top: 5,
        right: 4,
        width: 7,
        height: 7,
        borderRadius: radii.pill,
        backgroundColor: colors.moonlight.pink,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg,
        paddingBottom: 28,
        gap: spacing.xl,
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    greetingText: {
        flex: 1,
        gap: 5,
    },
    greetingTitle: {
        marginTop: 1,
    },
    greetingOrb: {
        width: 52,
        height: 52,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(248,244,240,0.35)',
    },
    completionCard: {
        borderRadius: radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(232,74,191,0.38)',
    },
    completionGradient: {
        padding: spacing.md,
        gap: 12,
    },
    completionTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
    },
    completionIcon: {
        width: 43,
        height: 43,
        borderRadius: radii.md,
        backgroundColor: 'rgba(248,244,240,0.09)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    completionCopy: {
        flex: 1,
        gap: 4,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressTrack: {
        height: 7,
        backgroundColor: 'rgba(16,11,22,0.65)',
        borderRadius: radii.pill,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: radii.pill,
    },
    section: {
        gap: spacing.md,
    },
    sectionHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    sectionAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    filterButton: {
        minHeight: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 11,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: 'rgba(232,74,191,0.32)',
        backgroundColor: 'rgba(16,11,22,0.55)',
    },
    matchesSeeAll: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 16,
        lineHeight: 20,
        fontWeight: '400',
    },
    sectionHeadingCopy: {
        flex: 1,
        gap: 3,
    },
    shortcutGrid: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 8,
        paddingRight: spacing.md,
        paddingBottom: 2,
    },
    shortcutIcon: {
        width: 36,
        height: 36,
        borderRadius: radii.md,
        backgroundColor: 'rgba(16,11,22,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 3,
    },
    matchesRow: {
        gap: spacing.md,
        paddingRight: spacing.md,
    },
    matchItem: {
        width: 76,
        alignItems: 'center',
        gap: 5,
    },
    matchPhotoBorder: {
        width: 72,
        height: 72,
        borderRadius: radii.pill,
        padding: 2,
        borderWidth: 1.5,
        borderColor: 'rgba(232,74,191,0.32)',
    },
    matchPhoto: {
        width: '100%',
        height: '100%',
        borderRadius: radii.pill,
    },
    matchName: {
        marginTop: 2,
    },
    onlineDot: {
        position: 'absolute',
        right: 0,
        bottom: 1,
        width: 13,
        height: 13,
        borderRadius: radii.pill,
        backgroundColor: '#4ADE80',
        borderWidth: 2,
        borderColor: colors.midnight,
    },
    demoNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    profileCard: {
        borderRadius: radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(232,74,191,0.28)',
        backgroundColor: 'rgba(12,10,22,0.96)',
    },
    profileImageContainer: {
        height: 330,
        position: 'relative',
        backgroundColor: colors.moonlight.indigo,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFill,
    },
    demoBadge: {
        position: 'absolute',
        top: 13,
        left: 13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(16,11,22,0.78)',
        borderRadius: radii.pill,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    onlineLabel: {
        position: 'absolute',
        top: 13,
        right: 13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(16,11,22,0.7)',
        borderRadius: radii.pill,
        paddingHorizontal: 9,
        paddingVertical: 6,
    },
    onlineDotSmall: {
        width: 6,
        height: 6,
        borderRadius: radii.pill,
        backgroundColor: '#4ADE80',
    },
    profileImageText: {
        position: 'absolute',
        left: spacing.md,
        right: spacing.md,
        bottom: spacing.md,
        gap: 5,
    },
    profileName: {
        color: colors.ivory,
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    interests: {
        marginTop: 2,
    },
    profileActions: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingVertical: 13,
    },
    actionCircle: {
        width: 45,
        height: 45,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(199,203,217,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(199,203,217,0.2)',
    },
    superLikeCircle: {
        borderColor: 'rgba(168,85,247,0.72)',
    },
    likeCircle: {
        borderColor: 'rgba(232,74,191,0.65)',
    },
    likedCircle: {
        backgroundColor: '#E91E8C',
        borderColor: colors.moonlight.pink,
    },
    localActionNote: {
        textAlign: 'center',
        paddingBottom: 10,
    },
    discoveryModeFilters: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingRight: spacing.md,
    },
    discoveryFilterChip: {
        minHeight: 29,
        paddingHorizontal: 10,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: 'rgba(199,203,217,0.24)',
        backgroundColor: 'rgba(16,11,22,0.72)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    discoveryFilterChipActive: {
        backgroundColor: colors.moonlight.pink,
        borderColor: colors.moonlight.pink,
    },
    discoveryFilterText: {
        fontSize: 10,
        lineHeight: 13,
    },
    discoveryGrid: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingRight: spacing.md,
    },
    compactProfileCard: {
        width: 112,
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(232,74,191,0.28)',
        backgroundColor: 'rgba(12,10,22,0.96)',
    },
    compactProfileVisual: {
        height: 154,
        position: 'relative',
        backgroundColor: colors.moonlight.indigo,
    },
    compactProfileImage: {
        ...StyleSheet.absoluteFill,
        width: '100%',
        height: '100%',
    },
    compactImageOverlay: {
        ...StyleSheet.absoluteFill,
    },
    compactDemoBadge: {
        position: 'absolute',
        top: 6,
        left: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 5,
        paddingVertical: 3,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(16,11,22,0.78)',
    },
    compactBadgeText: {
        color: colors.ivory,
        fontSize: 7,
        lineHeight: 9,
        letterSpacing: 0.3,
    },
    compactOnlineDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: radii.pill,
        backgroundColor: '#4ADE80',
        borderWidth: 1,
        borderColor: '#100B16',
    },
    compactProfileInfo: {
        position: 'absolute',
        left: 6,
        right: 5,
        bottom: 7,
        gap: 3,
    },
    compactProfileName: {
        color: colors.ivory,
        fontSize: 11,
        lineHeight: 13,
        fontWeight: '600',
    },
    compactDistanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    compactDistanceText: {
        color: colors.moonlight.silver,
        fontSize: 8,
        lineHeight: 10,
    },
    compactInterests: {
        color: colors.ivory,
        fontSize: 8,
        lineHeight: 10,
    },
    compactActions: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 2,
        gap: 2,
    },
    compactActionButton: {
        width: 27,
        height: 27,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(199,203,217,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(199,203,217,0.18)',
    },
    compactStarButton: {
        borderColor: 'rgba(168,85,247,0.72)',
    },
    compactHeartButton: {
        borderColor: 'rgba(232,74,191,0.65)',
    },
    compactHeartButtonActive: {
        backgroundColor: '#E91E8C',
        borderColor: colors.moonlight.pink,
    },
    demoFeedNote: {
        lineHeight: 14,
        opacity: 0.8,
    },
    emptyCard: {
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.xl,
        backgroundColor: 'rgba(49,42,104,0.2)',
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: 'rgba(232,74,191,0.25)',
    },
    resetButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    nearbyRow: {
        gap: spacing.md,
        paddingRight: spacing.md,
    },
    nearbyCard: {
        width: 160,
        height: 205,
        borderRadius: radii.lg,
        overflow: 'hidden',
        backgroundColor: colors.moonlight.indigo,
    },
    nearbyPhoto: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    nearbyOverlay: {
        ...StyleSheet.absoluteFill,
    },
    nearbyText: {
        position: 'absolute',
        left: 10,
        right: 8,
        bottom: 12,
        gap: 4,
    },
    connectionJourneyCard: {
        position: 'relative',
        overflow: 'hidden',
        gap: 9,
        padding: spacing.md,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: 'rgba(244,114,182,0.42)',
    },
    connectionJourneyTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },
    connectionJourneyIcon: {
        width: 36,
        height: 36,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(244,114,182,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(244,114,182,0.25)',
    },
    connectionJourneyTitle: {
        color: colors.ivory,
        fontSize: 21,
        lineHeight: 26,
        fontWeight: '600',
    },
    connectionJourneyBody: {
        lineHeight: 19,
    },
    connectionJourneyButton: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        minHeight: 36,
        marginTop: 2,
        paddingHorizontal: 13,
        borderRadius: radii.pill,
        backgroundColor: colors.moonlight.pink,
    },
    premiumPackageCard: {
        position: 'relative',
        overflow: 'hidden',
        gap: 12,
        padding: spacing.md,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: 'rgba(248,215,122,0.48)',
    },
    premiumPackageTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    premiumPackageIcon: {
        width: 38,
        height: 38,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(248,215,122,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(248,215,122,0.28)',
    },
    premiumPackageHeading: {
        flex: 1,
        gap: 2,
    },
    premiumPackageTitle: {
        color: colors.ivory,
        fontSize: 18,
        lineHeight: 23,
        fontWeight: '600',
    },
    premiumPackageBenefits: {
        gap: 8,
    },
    premiumBenefit: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    premiumPackageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 9,
        borderTopWidth: 1,
        borderTopColor: 'rgba(248,215,122,0.18)',
    },
    membershipCard: {
        position: 'relative',
        overflow: 'hidden',
        gap: 13,
        padding: spacing.md,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: 'rgba(248,215,122,0.42)',
    },
    membershipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        paddingBottom: 3,
    },
    membershipHeaderIcon: {
        width: 40,
        height: 40,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(248,215,122,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(248,215,122,0.28)',
    },
    membershipHeaderCopy: {
        flex: 1,
        gap: 3,
    },
    membershipTitle: {
        color: colors.ivory,
        fontSize: 22,
        lineHeight: 27,
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontWeight: '600',
    },
    membershipPlan: {
        gap: 6,
        padding: 11,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.035)',
        borderWidth: 1,
        borderColor: 'rgba(199,203,217,0.14)',
    },
    premiumMembershipPlan: {
        backgroundColor: 'rgba(248,215,122,0.055)',
        borderColor: 'rgba(248,215,122,0.35)',
    },
    membershipPlanHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    membershipPlanName: {
        color: colors.ivory,
        fontSize: 13,
        lineHeight: 17,
        fontWeight: '800',
        letterSpacing: 1,
    },
    premiumPlanName: {
        color: '#F8D77A',
    },
    membershipPlanTag: {
        color: '#48DCCB',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    standardPlanTag: {
        color: '#A78BFA',
    },
    premiumPlanTag: {
        color: '#F8D77A',
    },
    membershipPlanDescription: {
        color: colors.moonlight.silver,
        fontSize: 11,
        lineHeight: 15,
    },
    membershipFeatureList: {
        gap: 6,
        paddingTop: 2,
    },
    membershipFeature: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 7,
    },
    membershipFeatureText: {
        flex: 1,
        fontSize: 10,
        lineHeight: 14,
    },
    membershipSafetyNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 7,
        paddingHorizontal: 2,
    },
    membershipSafetyText: {
        flex: 1,
        fontSize: 10,
        lineHeight: 14,
    },
    membershipCompareButton: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: radii.pill,
        backgroundColor: '#F8D77A',
        marginTop: 1,
    },
    membershipPricingNote: {
        textAlign: 'center',
        fontSize: 9,
        lineHeight: 13,
    },
    footer: {
        alignItems: 'center',
        paddingTop: spacing.sm,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 9,
        paddingBottom: 10,
        paddingHorizontal: 5,
        backgroundColor: 'rgba(8,8,18,0.97)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(232,74,191,0.20)',
    },
    bottomItem: {
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingHorizontal: 1,
    },
    bottomLabel: {
        width: '100%',
        textAlign: 'center',
        fontSize: 9,
        lineHeight: 11,
    },
    bottomIconWrap: {
        minWidth: 45,
        minHeight: 30,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomIconActive: {
        backgroundColor: 'rgba(232,74,191,0.16)',
    },
    drawerRoot: {
        flex: 1,
        flexDirection: 'row',
    },
    drawerBackdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.65)',
    },
    drawer: {
        width: '82%',
        maxWidth: 340,
        height: '100%',
        paddingTop: 52,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        borderRightWidth: 1,
        borderRightColor: 'rgba(167,139,250,0.28)',
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
    drawerAvatar: {
        width: 49,
        height: 49,
        borderRadius: radii.pill,
        borderWidth: 1.5,
        borderColor: colors.moonlight.pink,
    },
    drawerItems: {
        paddingVertical: spacing.md,
        gap: 5,
    },
    drawerItem: {
        minHeight: 46,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderRadius: radii.md,
    },
    drawerItemActive: {
        backgroundColor: 'rgba(244,114,182,0.1)',
    },
    drawerItemText: {
        flex: 1,
        marginLeft: 13,
    },
    logoutItem: {
        marginTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(199,203,217,0.15)',
        paddingTop: spacing.sm,
    },
    drawerFooter: {
        textAlign: 'center',
        paddingTop: spacing.sm,
    },
    privacySettingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.035)',
        borderWidth: 1,
        borderColor: 'rgba(199,203,217,0.12)',
    },
    privacySettingIcon: {
        width: 36,
        height: 36,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(244,114,182,0.12)',
    },
    privacyToggle: {
        width: 42,
        height: 25,
        borderRadius: 14,
        padding: 3,
        justifyContent: 'center',
        backgroundColor: '#494454',
    },
    privacyToggleOn: {
        backgroundColor: '#D85CE6',
    },
    privacyToggleKnob: {
        width: 19,
        height: 19,
        borderRadius: 10,
        backgroundColor: '#F8F4F0',
        alignSelf: 'flex-start',
    },
    privacyToggleKnobOn: {
        alignSelf: 'flex-end',
    },
    privacySettingRowMoonlight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        paddingVertical: 12,
        paddingHorizontal: 11,
        borderRadius: 18,
        backgroundColor: 'rgba(77, 35, 75, 0.34)',
        borderWidth: 1,
        borderColor: 'rgba(192, 132, 252, 0.20)',
    },
    privacySettingIconMoonlight: {
        width: 40,
        height: 40,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(244, 114, 182, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(244, 114, 182, 0.22)',
    },
    privacyToggleMoonlight: {
        width: 44,
        height: 26,
        borderRadius: 15,
        padding: 3,
        justifyContent: 'center',
        backgroundColor: 'rgba(148, 139, 164, 0.48)',
        borderWidth: 1,
        borderColor: 'rgba(221, 214, 239, 0.18)',
    },
    privacyToggleMoonlightOn: {
        backgroundColor: '#EC63B5',
        borderColor: 'rgba(255, 170, 220, 0.75)',
        shadowColor: '#F472B6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 9,
        elevation: 5,
    },
    privacyToggleKnobMoonlight: {
        width: 18,
        height: 18,
        borderRadius: 10,
        backgroundColor: '#F8F4F0',
        alignSelf: 'flex-start',
    },
    privacyToggleKnobMoonlightOn: {
        alignSelf: 'flex-end',
    },
    privacySaveButtonMoonlight: {
        minHeight: 46,
        borderRadius: radii.pill,
        backgroundColor: '#F06DBB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: spacing.lg,
        marginTop: spacing.sm,
        shadowColor: '#F472B6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
        elevation: 6,
    },
    simpleModalRoot: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    simpleModalBackdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.72)',
    },
    simpleModalCard: {
        width: '90%',
        maxHeight: '88%',
        alignSelf: 'center',
        backgroundColor: 'rgba(8, 7, 20, 0.98)',
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.65)',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxl,
        gap: spacing.md,
    },
    modalHeading: {
        fontFamily: 'CormorantGaramond_500Medium',
        fontSize: 32,
        lineHeight: 38,
        color: colors.ivory,
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
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
    emptyNotification: {
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.lg,
    },

    // newstyles
    personalBanner: {
        minHeight: 190,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 9,
        paddingVertical: 10,
        gap: 14,
        borderRadius: radii.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(232,74,191,0.32)',
        position: 'relative',
    },
    bannerAccent: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: 3,
        backgroundColor: '#5B7CFF',
    },
    bannerAvatarWrap: {
        width: 68,
        height: 68,
        flexShrink: 0,
        position: 'relative',
    },
    bannerAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: radii.pill,
        borderWidth: 2,
        borderColor: colors.moonlight.pink,
    },
    bannerEditBadge: {
        position: 'absolute',
        bottom: -2,
        right: -3,
        width: 25,
        height: 25,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#211432',
        borderWidth: 1,
        borderColor: colors.moonlight.lavender,
    },
    bannerCopy: {
        flex: 1,
        minWidth: 0,
        gap: 7,
        zIndex: 1,
    },
    bannerRight: {
        width: 76,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerMode: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        minWidth: 0,
        gap: 2,
    },
    bannerModeText: {
        flex: 1,
        minWidth: 0,
        fontSize: 11,
        lineHeight: 14,
    },
    bannerStatsRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 5,
    },
    bannerStat: {
        flex: 1,
        minWidth: 0,
        paddingVertical: 4,
        paddingHorizontal: 5,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.055)',
        borderWidth: 1,
        borderColor: 'rgba(244,114,182,0.18)',
    },
    bannerStatNumber: {
        color: colors.ivory,
        fontSize: 15,
        lineHeight: 18,
        fontWeight: '700',
    },
    bannerStatLabel: {
        color: colors.moonlight.silver,
        fontSize: 9,
        lineHeight: 11,
    },
    bannerMatchNote: {
        color: colors.moonlight.silver,
        fontSize: 8,
        lineHeight: 10,
        opacity: 0.9,
    },
    bannerAboutMe: {
        marginTop: 2,
        paddingTop: 7,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.12)',
        gap: 3,
    },
    bannerAboutMeLabel: {
        color: colors.moonlight.pink,
        fontSize: 9,
        lineHeight: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    bannerAboutMeText: {
        color: colors.ivory,
        fontSize: 10,
        lineHeight: 14,
    },
    bannerAboutMeLink: {
        color: colors.moonlight.lavender,
        fontSize: 9,
        lineHeight: 12,
        fontWeight: '600',
    },
    bannerArtwork: {
        width: 70,
        height: 70,
        opacity: 0.9,
    },
    shortcutCard: {
        width: 100, // compact card width keeps the shortcut row balanced
        flexGrow: 0,
        flexShrink: 0,
        borderRadius: radii.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(232,74,191,0.32)',
    },
    shortcutGradient: {
        minHeight: 78, // was 98
        padding: 7,     // was 9
        gap: 3,         // was 4
    },
    shortcutTitle: {
        fontSize: 10, // was 12
        lineHeight: 13, // was 15
    },

    shortcutSubtitle: {
        fontSize: 8, // was 10
        lineHeight: 11, // was 13
    },

    shortcutArrow: {
        position: 'absolute',
        right: 7,
        top: 9,
    },
    shortcutProgressTrack: {
        height: 4,
        width: '100%',
        borderRadius: radii.pill,
        overflow: 'hidden',
        backgroundColor: 'rgba(199,203,217,0.2)',
        marginTop: 1,
    },
    shortcutProgressFill: {
        width: '80%',
        height: '100%',
        borderRadius: radii.pill,
    },
    brandTitle: {
        alignSelf: 'flex-start',
        width: '100%',
        alignItems: 'flex-start',
    },

    quickActionsSection: {
        marginTop: -12,
    },


    matchesHeading: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '600',
},

matchesHeadingWhite: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 25,
    lineHeight: 36,
    fontWeight: '600',
    color: '#F8F4F0',
},

matchesHeadingPink: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 25,
    lineHeight: 36,
    fontWeight: '600',
    color: '#F472B6',
},
});