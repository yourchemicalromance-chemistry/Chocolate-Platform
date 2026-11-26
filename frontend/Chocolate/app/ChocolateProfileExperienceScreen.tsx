import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../components/Text';
import { attachProfilePhoto, getDatingIntents, getDiscoveryModes, getDiscoveryPhotoUrl, getDiscoveryProfile, getOnboardingProfile, getVideoAccessHeaders, recordProfileAction, removeProfilePhoto, removeSavedDiscoveryProfile, saveDatingIntents, saveDiscoveryModes, saveDiscoveryProfile, saveProfileBasics, saveProfileChemistry, saveProfileStory, setMainProfilePhoto, uploadMedia, type DatingIntent, type DiscoveryMode, type DiscoveryProfileDetail, type OnboardingProfile, type SavedProfilePhoto } from '../../auth-api';

type Props = { mode: 'mine' | 'other'; targetId?: string; onBack: () => void };
type OwnerProfile = OnboardingProfile & { age?: number | null };
const CREAM = '#FFF0DF';
const GOLD = '#F8DCC6';
const ESPRESSO = '#160D08';
const PROMPT_OPTIONS = [
  'A little thing that makes me happy...',
  'My ideal weekend looks like...',
  "Something I'd love to share with someone...",
] as const;
const INTENT_OPTIONS: { value: DatingIntent; label: string }[] = [
  { value: 'serious', label: 'Serious relationship' }, { value: 'casual', label: 'Casual dating' },
  { value: 'flirting', label: 'Fun & flirting' }, { value: 'exploring', label: 'Open to exploring' },
  { value: 'marriage', label: 'Marriage' },
];
const MODE_OPTIONS: { value: DiscoveryMode; label: string }[] = [
  { value: 'algorithmic', label: 'Algorithmic Recommendations' }, { value: 'browse', label: 'Self Search / Browse' },
  { value: 'kismat', label: 'KISMAT' },
];
const blankOwner = (): OwnerProfile => ({ displayName: null, age: null, genderIdentity: null, interestedIn: [], bio: null, selectedPrompt: null, languages: [], interests: [], lifestyles: [], values: [], conversationStyles: [], photos: [], completed: false });
const split = (value: string) => [...new Set(value.split(',').map(item => item.trim()).filter(Boolean))];

export function ChocolateProfileExperienceScreen({ mode, targetId, onBack }: Props) {
  const mine = mode === 'mine';
  const [owner, setOwner] = useState<OwnerProfile>(blankOwner);
  const [detail, setDetail] = useState<DiscoveryProfileDetail | null>(null);
  const [intents, setIntents] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [edit, setEdit] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [genderIdentity, setGenderIdentity] = useState('');
  const [interestedIn, setInterestedIn] = useState('');
  const [bio, setBio] = useState('');
  const [prompt, setPrompt] = useState('');
  const [languages, setLanguages] = useState('');
  const [interests, setInterests] = useState('');
  const [lifestyles, setLifestyles] = useState('');
  const [values, setValues] = useState('');
  const [conversationStyles, setConversationStyles] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoOperationLock = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setError(''); setDetail(null);
    try {
      const authHeaders = await getVideoAccessHeaders(); setHeaders(authHeaders);
      if (mine) {
        const [profile, dating, discovery] = await Promise.all([getOnboardingProfile(), getDatingIntents(), getDiscoveryModes()]);
        setOwner(profile); setIntents(dating.intents); setModes(discovery.mode ? [discovery.mode] : []);
        setDisplayName(profile.displayName ?? ''); setGenderIdentity(profile.genderIdentity ?? ''); setInterestedIn(profile.interestedIn.join(', '));
        const actualLanguages = profile.storedLanguages ?? profile.languages;
        setBio(profile.bio ?? ''); setPrompt(profile.selectedPrompt ?? ''); setLanguages(actualLanguages.join(', '));
        setInterests(profile.interests.join(', ')); setLifestyles(profile.lifestyles.join(', ')); setValues(profile.values.join(', '));
        setConversationStyles(profile.conversationStyles.join(', '));
      } else {
        if (!targetId) throw new Error('This profile is unavailable.');
        const profile = await getDiscoveryProfile(targetId);
        setDetail(profile); setGalleryIndex(0);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load this profile.'); }
    finally { setLoading(false); }
  }, [mine, targetId]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const save = async (section: string) => {
    setBusy(true);
    try {
      if (section === 'basics') {
        const basics: Parameters<typeof saveProfileBasics>[0] = { genderIdentity: genderIdentity.trim() || null, interestedIn: split(interestedIn) };
        if (displayName.trim()) basics.displayName = displayName.trim();
        await saveProfileBasics(basics);
      }
      if (section === 'story') {
        const story: Parameters<typeof saveProfileStory>[0] = { selectedPrompt: prompt || null };
        const nextLanguages = split(languages);
        const storedLanguages = owner.storedLanguages ?? owner.languages;
        if (JSON.stringify(nextLanguages) !== JSON.stringify(storedLanguages)) story.languages = nextLanguages;
        if (bio.trim()) story.bio = bio.trim();
        await saveProfileStory(story);
      }
      if (section === 'chemistry') await saveProfileChemistry({ interests: split(interests), lifestyles: split(lifestyles), values: split(values), conversationStyles: split(conversationStyles) });
      if (section === 'intents') await saveDatingIntents(intents as DatingIntent[]);
      if (section === 'modes' && modes[0]) await saveDiscoveryModes(modes[0] as DiscoveryMode);
      await load();
      if (section === 'story' && !bio.trim() && owner.bio) Alert.alert('Profile updated', 'Your other story changes were saved. The existing biography was kept because the current API does not support clearing it.');
      else Alert.alert('Profile updated', 'Your changes have been saved.');
    } catch (e) { Alert.alert('Unable to save profile', e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  };

  const runPhotoOperation = async (operation: () => Promise<void>, errorTitle: string) => {
    if (photoOperationLock.current) return;
    photoOperationLock.current = true; setPhotoBusy(true);
    try { await operation(); }
    catch (e) { Alert.alert(errorTitle, e instanceof Error ? e.message : 'Please try again.'); }
    finally { photoOperationLock.current = false; setPhotoBusy(false); }
  };

  const addPhoto = () => runPhotoOperation(async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { Alert.alert('Photo access needed', 'Allow photo library access to add profile photos.'); return; }
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.85 });
      if (picked.canceled || !picked.assets[0]) return;
      const asset = await uploadMedia(picked.assets[0].uri, 'PROFILE_PHOTO');
      await attachProfilePhoto(asset.assetId); await load();
      Alert.alert('Photo added', 'Your profile photo is ready.');
  }, 'Unable to add photo');

  const managePhoto = (photo: SavedProfilePhoto) => {
    Alert.alert('Manage photo', photo.isMain ? 'This is your main profile photo.' : 'Choose an action for this photo.', [
      { text: 'Cancel', style: 'cancel' },
      ...(!photo.isMain ? [{ text: 'Make main', onPress: () => { void runPhotoOperation(async () => { await setMainProfilePhoto(photo.id); await load(); }, 'Unable to update photo'); } }] : []),
      { text: 'Delete', style: 'destructive', onPress: () => { void runPhotoOperation(async () => { await removeProfilePhoto(photo.id); await load(); }, 'Unable to delete photo'); } },
    ]);
  };

  const toggleIntent = (value: DatingIntent) => {
    if (intents.includes(value) && intents.length === 1) { Alert.alert('Keep at least one intention', 'The current API requires at least one dating intention.'); return; }
    setIntents(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  };
  const toggleMode = (value: DiscoveryMode) => setModes([value]);

  const act = async (action: 'LIKE' | 'SUPER_LIKE') => {
    if (!detail) return; setBusy(true);
    try { const result = await recordProfileAction(detail.id, action); Alert.alert(result.mutualMatch ? 'It’s a match' : action === 'LIKE' ? 'Like sent' : 'Super Like sent', result.mutualMatch ? 'You both like each other.' : 'Your action has been saved.'); }
    catch (e) { Alert.alert('Action not saved', e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  const toggleSave = async () => {
    if (!detail) return; setBusy(true);
    try {
      if (detail.isSaved) await removeSavedDiscoveryProfile(detail.id); else await saveDiscoveryProfile(detail.id);
      setDetail(current => current ? { ...current, isSaved: !current.isSaved } : current);
    } catch (e) { Alert.alert('Unable to update saved profiles', e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  };

  const name = mine ? owner.displayName || 'Your profile' : detail?.name ?? 'Profile';
  const age = mine ? owner.age : detail?.age;
  const photos = mine ? owner.photos.filter(photo => photo.ready).map(photo => ({ uri: photo.uri, isMain: photo.isMain })) : detail?.photos.map(photo => ({ ...photo, uri: getDiscoveryPhotoUrl(photo.uri) })) ?? [];
  const activePhoto = photos.length ? photos[Math.min(galleryIndex, photos.length - 1)] : null;
  const tagSection = (title: string, items: string[], icon: React.ComponentProps<typeof Ionicons>['name']) => items.length ? <View style={styles.section}><View style={styles.sectionTitle}><Ionicons name={icon} size={17} color={GOLD} /><Text variant="label" color={GOLD}>{title}</Text></View><View style={styles.tags}>{items.map(item => <View key={item} style={styles.tag}><Text variant="caption" color={CREAM}>{item}</Text></View>)}</View></View> : null;
  const field = (label: string, value: string, setter: (text: string) => void, multiline = false) => <View style={styles.field}><Text variant="caption" color={GOLD}>{label}</Text><TextInput value={value} onChangeText={setter} multiline={multiline} placeholder={multiline ? 'Add a little about yourself' : 'Separate entries with commas'} placeholderTextColor="#A88F7C" style={[styles.input, multiline && styles.multiline]} /></View>;
  const saveButton = (label: string, section: string, disabled = false) => <Pressable disabled={busy || disabled} style={[styles.primaryButton, (busy || disabled) && styles.disabledButton]} onPress={() => void save(section)}><Text variant="label" color={ESPRESSO}>{busy ? 'Saving…' : label}</Text></Pressable>;
  const selectableOptions = <T extends string,>(title: string, options: { value: T; label: string }[], selected: T[], toggle: (value: T) => void, saveSection: string) => <View style={styles.section}><Text variant="heading3" color={CREAM}>{title}</Text>{options.map(option => { const active = selected.includes(option.value); return <Pressable key={option.value} disabled={busy} accessibilityRole="checkbox" accessibilityState={{ checked: active }} onPress={() => toggle(option.value)} style={[styles.option, active && styles.optionSelected, busy && styles.disabledButton]}><Ionicons name={active ? 'checkbox' : 'square-outline'} size={19} color={active ? GOLD : '#CBB8A5'} /><Text variant="bodySmall" color={CREAM}>{option.label}</Text></Pressable>; })}<Text variant="caption" color="#CBB8A5">Choose at least one. Multiple selections are supported.</Text>{saveButton(`SAVE ${title.toUpperCase()}`, saveSection, selected.length === 0)}</View>;
  const discoveryModeOptions = <View style={styles.section}><Text variant="heading3" color={CREAM}>Discovery mode</Text>{MODE_OPTIONS.map(option => { const active = modes[0] === option.value; return <Pressable key={option.value} disabled={busy} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => toggleMode(option.value)} style={[styles.option, active && styles.optionSelected, busy && styles.disabledButton]}><Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={19} color={active ? GOLD : '#CBB8A5'} /><Text variant="bodySmall" color={CREAM}>{option.label}</Text></Pressable>; })}<Text variant="caption" color="#CBB8A5">Choose one discovery mode.</Text>{saveButton('SAVE DISCOVERY MODE', 'modes', modes.length === 0)}</View>;

  return <SafeAreaView style={styles.screen} edges={['top']}>
    <LinearGradient colors={['#2A160D', '#160905', '#211008']} style={StyleSheet.absoluteFill} />
    <View style={styles.header}><Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" style={styles.back}><Ionicons name="arrow-back" size={22} color={CREAM} /></Pressable><Text variant="label" color={CREAM}>{mine ? 'MY PROFILE' : 'PROFILE'}</Text>{mine ? <Pressable onPress={() => setEdit(value => !value)}><Text variant="label" color={GOLD}>{edit ? 'DONE' : 'EDIT'}</Text></Pressable> : <View style={{ width: 42 }} />}</View>
    {loading ? <View style={styles.center}><ActivityIndicator color={GOLD} /><Text variant="bodySmall" color={CREAM}>Loading profile…</Text></View> : error ? <View style={styles.center}><Ionicons name="alert-circle-outline" size={34} color={GOLD} /><Text variant="body" color={CREAM}>{error}</Text><Pressable style={styles.secondaryButton} onPress={() => void load()}><Text variant="label" color={GOLD}>TRY AGAIN</Text></Pressable></View> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        {activePhoto ? <Image source={{ uri: activePhoto.uri, headers }} style={styles.heroImage} /> : <View style={[styles.heroImage, styles.noPhoto]}><Ionicons name="person-outline" size={48} color={GOLD} /><Text variant="caption" color={CREAM}>Add a profile photo</Text></View>}
        <LinearGradient colors={['transparent', 'rgba(18,9,5,0.86)']} style={styles.heroShade} pointerEvents="none" />
        <View style={styles.heroText}><Text variant="heading1" color={CREAM}>{name}{age ? `, ${age}` : ''}</Text>{!mine && <Text variant="caption" color={GOLD}>{[detail?.distanceBand, detail?.verified ? 'Verified profile' : null].filter(Boolean).join('  ·  ')}</Text>}</View>
        {photos.length > 1 && <View style={styles.galleryControls}><Pressable onPress={() => setGalleryIndex((galleryIndex - 1 + photos.length) % photos.length)} style={styles.roundButton}><Ionicons name="chevron-back" size={20} color={CREAM} /></Pressable><Text variant="caption" color={CREAM}>{galleryIndex + 1} / {photos.length}</Text><Pressable onPress={() => setGalleryIndex((galleryIndex + 1) % photos.length)} style={styles.roundButton}><Ionicons name="chevron-forward" size={20} color={CREAM} /></Pressable></View>}
      </View>
      {mine && <View style={styles.photoTools}><Text variant="caption" color={GOLD}>{owner.photos.length} of 5 photos · {owner.photos.some(photo => photo.isMain) ? 'Main photo selected' : 'Choose a main photo'}</Text><View style={styles.photoRail}>{owner.photos.map(photo => <Pressable key={photo.id} disabled={photoBusy} onPress={() => managePhoto(photo)}><Image source={{ uri: photo.uri, headers }} style={[styles.thumb, photo.isMain && styles.thumbMain, photoBusy && styles.disabledPhoto]} /></Pressable>)}{owner.photos.length < 5 && <Pressable disabled={photoBusy} style={[styles.addPhoto, photoBusy && styles.disabledButton]} onPress={() => void addPhoto()}><Ionicons name="add" size={27} color={GOLD} /></Pressable>}</View>{photoBusy ? <View style={styles.photoProgress}><ActivityIndicator size="small" color={GOLD} /><Text variant="caption" color={CREAM}>Working on your photo…</Text></View> : <Text variant="caption" color="#CBB8A5">Tap a photo to make it main or delete it.</Text>}</View>}
      {mine && edit ? <>
        <View style={styles.section}><Text variant="heading3" color={CREAM}>Basics</Text>{field('DISPLAY NAME', displayName, setDisplayName)}{field('GENDER IDENTITY', genderIdentity, setGenderIdentity)}{field('WHO YOU WANT TO MEET', interestedIn, setInterestedIn)}{saveButton('SAVE BASICS', 'basics')}</View>
        <View style={styles.section}><Text variant="heading3" color={CREAM}>Your story</Text>{field('BIOGRAPHY', bio, setBio, true)}{!bio.trim() && owner.bio && <Text variant="caption" color="#CBB8A5">A blank biography is not sent, so your existing biography will be kept. The current API does not support clearing it.</Text>}<Text variant="caption" color={GOLD}>PROFILE PROMPT</Text><Pressable style={[styles.option, !prompt && styles.optionSelected]} onPress={() => setPrompt('')}><Ionicons name={!prompt ? 'radio-button-on' : 'radio-button-off'} size={19} color={GOLD} /><Text variant="bodySmall" color={CREAM}>No prompt</Text></Pressable>{PROMPT_OPTIONS.map(option => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ selected: prompt === option }} style={[styles.option, prompt === option && styles.optionSelected]} onPress={() => setPrompt(option)}><Ionicons name={prompt === option ? 'radio-button-on' : 'radio-button-off'} size={19} color={GOLD} /><Text variant="bodySmall" color={CREAM}>{option}</Text></Pressable>)}{field('LANGUAGES', languages, setLanguages)}{saveButton('SAVE STORY', 'story')}</View>
        <View style={styles.section}><Text variant="heading3" color={CREAM}>Interests & lifestyle</Text>{field('INTERESTS', interests, setInterests)}{field('LIFESTYLE', lifestyles, setLifestyles)}{field('VALUES', values, setValues)}{field('CONVERSATION PREFERENCES', conversationStyles, setConversationStyles)}{saveButton('SAVE PROFILE DETAILS', 'chemistry')}</View>
        {selectableOptions('Dating intentions', INTENT_OPTIONS, intents as DatingIntent[], toggleIntent, 'intents')}
        {discoveryModeOptions}
      </> : <>
        {mine && <View style={styles.section}><Text variant="caption" color={GOLD}>PROFILE STATUS</Text><Text variant="heading3" color={CREAM}>{owner.completed ? 'Profile complete' : 'Profile in progress'}</Text></View>}
        {mine ? tagSection('Gender identity', owner.genderIdentity ? [owner.genderIdentity] : [], 'person-outline') : tagSection('Gender identity', detail?.genderIdentity ? [detail.genderIdentity] : [], 'person-outline')}
        {mine ? tagSection('Dating preferences', owner.interestedIn, 'heart-outline') : tagSection('Dating preferences', detail?.interestedIn ?? [], 'heart-outline')}
        {(mine ? owner.bio : detail?.about) ? <View style={styles.section}><Text variant="label" color={GOLD}>ABOUT</Text><Text variant="body" color={CREAM}>{mine ? owner.bio : detail?.about}</Text></View> : null}
        {((mine ? owner.selectedPrompt : detail?.prompt) ?? '') ? <View style={styles.prompt}><Text variant="caption" color={GOLD}>PROMPT</Text><Text variant="heading3" color={CREAM}>{mine ? owner.selectedPrompt : detail?.prompt}</Text></View> : null}
        {tagSection('Interests', mine ? owner.interests : (detail?.interests ? detail.interests.split(' · ') : []), 'sparkles-outline')}
        {tagSection('Languages', mine ? owner.languages : detail?.languages ?? [], 'chatbubble-ellipses-outline')}
        {tagSection('Lifestyle', mine ? owner.lifestyles : detail?.lifestyles ?? [], 'leaf-outline')}
        {tagSection('Values', mine ? owner.values : detail?.values ?? [], 'diamond-outline')}
        {tagSection('Conversation preferences', mine ? owner.conversationStyles : detail?.conversationStyles ?? [], 'chatbubbles-outline')}
        {!mine && tagSection('Dating intentions', detail?.datingIntents ?? [], 'heart-circle-outline')}
        {mine && tagSection('Dating intentions', intents, 'heart-circle-outline')}
        {mine && tagSection('Discovery preferences', modes, 'compass-outline')}
        {!mine && <View style={styles.actions}><Pressable disabled={busy} style={styles.primaryButton} onPress={() => void act('LIKE')}><Ionicons name="heart" size={18} color={ESPRESSO} /><Text variant="label" color={ESPRESSO}>LIKE</Text></Pressable><Pressable disabled={busy} style={styles.secondaryButton} onPress={() => void act('SUPER_LIKE')}><Ionicons name="star" size={18} color={GOLD} /><Text variant="label" color={GOLD}>SUPER LIKE</Text></Pressable><Pressable disabled={busy} style={styles.secondaryButton} onPress={() => void toggleSave()}><Ionicons name={detail?.isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={GOLD} /><Text variant="label" color={GOLD}>{detail?.isSaved ? 'SAVED' : 'SAVE'}</Text></Pressable></View>}
      </>}
    </ScrollView>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ESPRESSO }, header: { minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#4A2C20' }, back: { width: 42, height: 42, alignItems: 'flex-start', justifyContent: 'center' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26, gap: 16 }, content: { paddingBottom: 40 }, hero: { height: 470, position: 'relative', backgroundColor: '#2B1A12' }, heroImage: { width: '100%', height: '100%' }, noPhoto: { alignItems: 'center', justifyContent: 'center', gap: 10 }, heroShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, heroText: { position: 'absolute', left: 22, right: 22, bottom: 25, gap: 6 }, galleryControls: { position: 'absolute', top: 18, right: 18, flexDirection: 'row', alignItems: 'center', gap: 10 }, roundButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#160D08AA', alignItems: 'center', justifyContent: 'center' }, photoTools: { paddingHorizontal: 20, paddingTop: 18, gap: 10 }, photoRail: { flexDirection: 'row', gap: 10, alignItems: 'center' }, thumb: { width: 66, height: 82, borderRadius: 12, borderWidth: 1, borderColor: '#674B37' }, thumbMain: { borderColor: GOLD, borderWidth: 2 }, disabledPhoto: { opacity: 0.45 }, photoProgress: { flexDirection: 'row', alignItems: 'center', gap: 8 }, addPhoto: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: GOLD, alignItems: 'center', justifyContent: 'center' }, section: { marginHorizontal: 20, marginTop: 24, padding: 18, gap: 12, borderRadius: 18, borderWidth: 1, borderColor: '#4A2C20', backgroundColor: '#24130D' }, sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, tag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#77533B', backgroundColor: '#382116' }, option: { minHeight: 42, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1, borderColor: '#674B37', backgroundColor: '#2D190F' }, optionSelected: { borderColor: GOLD, backgroundColor: '#3A2418' }, disabledButton: { opacity: 0.55 }, prompt: { marginHorizontal: 20, marginTop: 20, padding: 20, borderLeftWidth: 2, borderLeftColor: GOLD, gap: 8, backgroundColor: '#24130D' }, field: { gap: 6 }, input: { minHeight: 44, borderWidth: 1, borderColor: '#77533B', borderRadius: 10, color: CREAM, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Montserrat_400Regular' }, multiline: { minHeight: 90, textAlignVertical: 'top' }, primaryButton: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: GOLD, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, secondaryButton: { minHeight: 44, paddingHorizontal: 15, borderRadius: 22, borderWidth: 1, borderColor: GOLD, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, actions: { marginHorizontal: 20, marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
});
