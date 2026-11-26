import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/Text';
import { VideoVerificationFlow } from './ChocolateVideoVerificationFlow';
import {
  createVerificationSession,
  getVideoVerificationStatus,
  uploadMedia,
  type VerificationSession,
  type VerificationSubmission,
} from '../../auth-api';

type Props = { onBack: () => void; onContinue?: () => Promise<void>; onStatusChange?: (status: VerificationSubmission[]) => void };

const LABELS: Record<VerificationSubmission['status'], string> = {
  PENDING: 'Pending review', MANUAL_REVIEW: 'Pending review', VERIFIED: 'Approved', FAILED: 'Rejected',
};

export function ChocolateVideoVerificationStatusScreen({ onBack, onContinue, onStatusChange }: Props) {
  const [submissions, setSubmissions] = useState<VerificationSubmission[]>([]);
  const [session, setSession] = useState<VerificationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try { const status = await getVideoVerificationStatus(); setError(''); setSubmissions(status); onStatusChange?.(status); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load verification status.'); }
    finally { setLoading(false); }
  }, [onStatusChange]);

  useEffect(() => {
    let active = true;
    getVideoVerificationStatus().then((status) => {
      if (active) { setSubmissions(status); onStatusChange?.(status); setLoading(false); }
    }).catch((cause: unknown) => {
      if (active) { setError(cause instanceof Error ? cause.message : 'Unable to load verification status.'); setLoading(false); }
    });
    return () => { active = false; };
  }, [onStatusChange]);

  const latest = submissions[0];
  const canSubmit = !latest || latest.status === 'FAILED';

  return (
    <View style={styles.page}>
      <Pressable onPress={onBack} style={styles.back}><Ionicons name="arrow-back" size={22} color="#FFF0DF" /><Text style={styles.backText}>Back</Text></Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Video Verification</Text>
        <Text style={styles.copy}>Your video is stored privately and reviewed by a person.</Text>
        {loading ? <Text style={styles.copy}>Loading status…</Text> : latest ? (
          <View style={styles.card}>
            <Text style={styles.status}>{LABELS[latest.status]}</Text>
            <Text style={styles.copy}>{latest.status === 'PENDING' || latest.status === 'MANUAL_REVIEW' ? 'We will update your account after review.' : latest.reviewedAt ? `Reviewed ${new Date(latest.reviewedAt).toLocaleDateString()}` : ''}</Text>
            {latest.status === 'FAILED' && <Text style={styles.reason}>This submission was not approved. You may start a new verification session and submit a new recording.</Text>}
          </View>
        ) : <View style={styles.card}><Text style={styles.status}>Not submitted</Text><Text style={styles.copy}>Record a short video to submit it for review.</Text></View>}
        {!!error && <Text style={styles.error}>{error}</Text>}
        {canSubmit && !session && <Pressable style={styles.button} onPress={() => { setError(''); void createVerificationSession().then(setSession).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to start verification.')); }}><Text style={styles.buttonText}>{latest ? 'Submit a new video' : 'Start video verification'}</Text></Pressable>}
        {onContinue && latest && latest.status !== 'FAILED' && <Pressable style={styles.button} onPress={() => { setError(''); void onContinue().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to continue onboarding.')); }}><Text style={styles.buttonText}>Continue onboarding</Text></Pressable>}
        <Pressable style={styles.refresh} onPress={() => { setLoading(true); void refresh(); }}><Text style={styles.refreshText}>Refresh status</Text></Pressable>
        {submissions.slice(1).map((item) => <Text key={item.id} style={styles.history}>{LABELS[item.status]} · {new Date(item.createdAt).toLocaleDateString()}</Text>)}
      </ScrollView>
      {session && <VideoVerificationFlow
        key={session.id}
        challengeInstructions={session.challengeInstructions.actions}
        onRetake={async () => setSession(await createVerificationSession())}
        onComplete={async (uri, progress) => {
          const upload = await uploadMedia(uri, 'AGE_INTERVIEW_VIDEO', session, progress);
          if (upload.verificationStatus) {
            const next = [{ id: upload.assetId, status: upload.verificationStatus, createdAt: new Date().toISOString(), reviewedAt: null }];
            setSubmissions(next);
            onStatusChange?.(next);
          }
          await refresh();
        }}
        onClose={() => setSession(null)}
      />}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#160D08', paddingTop: 52 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  backText: { color: '#FFF0DF' },
  content: { padding: 24, gap: 16 },
  title: { color: '#F8DCC6', fontSize: 27, fontWeight: '700' },
  copy: { color: '#E7CCB7', lineHeight: 22 },
  card: { padding: 18, borderRadius: 16, backgroundColor: '#2B1A12', gap: 7 },
  status: { color: '#F8DCC6', fontSize: 18, fontWeight: '700' },
  reason: { color: '#FFE0C2', lineHeight: 21 },
  error: { color: '#FFB7A9' },
  button: { backgroundColor: '#B88952', padding: 15, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#160D08', fontWeight: '700' },
  refresh: { padding: 12, alignItems: 'center' },
  refreshText: { color: '#F8DCC6', textDecorationLine: 'underline' },
  history: { color: '#C7AA93', paddingVertical: 4 },
});
