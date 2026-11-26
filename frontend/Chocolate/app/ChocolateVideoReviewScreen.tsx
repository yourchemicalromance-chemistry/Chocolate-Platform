import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/Text';
import {
  decideVideoReview, getPendingVideoReviews, getVideoAccessHeaders, getVideoContentUrl,
  type PendingVideoReview,
} from '../../auth-api';

function ReviewerVideo({ assetId }: { assetId: string }) {
  const [source, setSource] = useState<{ uri: string; headers: Record<string, string> } | null>(null);
  useEffect(() => {
    let active = true;
    void getVideoAccessHeaders().then((headers) => { if (active) setSource({ uri: getVideoContentUrl(assetId), headers }); });
    return () => { active = false; };
  }, [assetId]);
  const player = useVideoPlayer(null);
  useEffect(() => {
    if (source) void player.replaceAsync(source).then(() => player.play());
  }, [player, source]);
  if (!source) return <Text style={styles.secondary}>Loading secure video…</Text>;
  return <VideoView player={player} style={styles.video} nativeControls />;
}

export function ChocolateVideoReviewScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<PendingVideoReview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selected = items.find((item) => item.id === selectedId);

  const refresh = useCallback(async () => {
    try { const pending = await getPendingVideoReviews(); setError(''); setItems(pending); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load review queue.'); }
  }, []);
  useEffect(() => {
    let active = true;
    getPendingVideoReviews().then((pending) => { if (active) setItems(pending); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load review queue.'); });
    return () => { active = false; };
  }, []);

  const decide = async (status: 'VERIFIED' | 'FAILED') => {
    if (!selected || busy || (status === 'FAILED' && !reason.trim())) return;
    setBusy(true);
    try {
      await decideVideoReview(selected.id, status, status === 'FAILED' ? reason.trim() : undefined);
      setSelectedId(null); setReason(''); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save the review decision.'); }
    finally { setBusy(false); }
  };

  return <View style={styles.page}>
    <Pressable onPress={onBack} style={styles.back}><Ionicons name="arrow-back" size={22} color="#FFF0DF" /><Text style={styles.titleSmall}>Video reviews</Text></Pressable>
    <ScrollView contentContainerStyle={styles.content}>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {selected ? <View style={styles.card}>
        <Text style={styles.title}>{selected.owner.fullName}</Text>
        <Text style={styles.secondary}>Submitted {new Date(selected.createdAt).toLocaleString()}</Text>
        <Text style={styles.secondary}>Challenge: {selected.session.challengeInstructions.actions?.join(' · ') ?? 'Recorded challenge'}</Text>
        <ReviewerVideo assetId={selected.mediaAsset.id} />
        <TextInput value={reason} onChangeText={setReason} placeholder="Reason required for rejection" placeholderTextColor="#A98D77" style={styles.input} multiline />
        <View style={styles.actions}>
          <Pressable disabled={busy} onPress={() => void decide('VERIFIED')} style={styles.approve}><Text style={styles.buttonText}>Approve</Text></Pressable>
          <Pressable disabled={busy || !reason.trim()} onPress={() => void decide('FAILED')} style={styles.reject}><Text style={styles.buttonText}>Reject</Text></Pressable>
        </View>
        <Pressable onPress={() => { setSelectedId(null); setReason(''); }}><Text style={styles.link}>Back to queue</Text></Pressable>
      </View> : <>
        <Text style={styles.title}>Pending video reviews</Text>
        <Pressable onPress={() => void refresh()}><Text style={styles.link}>Refresh</Text></Pressable>
        {items.length === 0 && <Text style={styles.secondary}>There are no videos waiting for review.</Text>}
        {items.map((item) => <Pressable key={item.id} style={styles.card} onPress={() => { setReason(''); setSelectedId(item.id); }}>
          <Text style={styles.titleSmall}>{item.owner.fullName}</Text>
          <Text style={styles.secondary}>Submitted {new Date(item.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.link}>Open video</Text>
        </Pressable>)}
      </>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#160D08', paddingTop: 52 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 },
  content: { padding: 20, gap: 14 },
  title: { color: '#F8DCC6', fontSize: 22, fontWeight: '700' },
  titleSmall: { color: '#F8DCC6', fontSize: 17, fontWeight: '600' },
  secondary: { color: '#E7CCB7', lineHeight: 21 },
  card: { backgroundColor: '#2B1A12', padding: 17, borderRadius: 15, gap: 12 },
  video: { width: '100%', height: 250, borderRadius: 12, overflow: 'hidden' },
  input: { minHeight: 76, color: '#FFF0DF', borderWidth: 1, borderColor: '#B88952', borderRadius: 10, padding: 12, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 12 },
  approve: { flex: 1, backgroundColor: '#7B9A68', padding: 13, borderRadius: 10, alignItems: 'center' },
  reject: { flex: 1, backgroundColor: '#A65B4D', padding: 13, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFF8F0', fontWeight: '700' },
  link: { color: '#F8DCC6', textDecorationLine: 'underline' },
  error: { color: '#FFB7A9' },
});
