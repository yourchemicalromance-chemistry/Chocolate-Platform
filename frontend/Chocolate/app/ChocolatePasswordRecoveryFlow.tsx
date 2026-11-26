import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../components/Text';
import { LoginInput } from '../components/Input/LoginInput';
import { LoginButton } from '../components/Button/LoginButton';
import { requestPasswordReset, resetPassword, verifyPasswordResetOtp } from '../../auth-api';

type Stage = 'identifier' | 'otp' | 'password';

export function ChocolatePasswordRecoveryFlow({ onBackToLogin, onComplete }: { onBackToLogin: () => void; onComplete: () => void }) {
  const [stage, setStage] = useState<Stage>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
      setExpiresIn((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function sendCode() {
    if (!identifier.trim()) { setError('Enter your email address or mobile number.'); return; }
    setBusy(true); setError('');
    try {
      const result = await requestPasswordReset(identifier.trim());
      setCooldown(result.resendAfterSeconds);
      setExpiresIn(result.expiresInSeconds);
      setStage('otp');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to request a recovery code.');
    } finally { setBusy(false); }
  }

  async function verifyCode() {
    if (!/^\d{6}$/.test(code)) { setError('Enter the six-digit recovery code.'); return; }
    if (expiresIn <= 0) { setError('This recovery code has expired. Request a new code.'); return; }
    setBusy(true); setError('');
    try {
      const result = await verifyPasswordResetOtp(identifier.trim(), code);
      setResetToken(result.resetToken);
      setExpiresIn(result.expiresInSeconds);
      setStage('password');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The code is invalid or expired.');
    } finally { setBusy(false); }
  }

  async function submitPassword() {
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,128}$/.test(newPassword)) {
      setError('Use at least 8 characters with a letter, number, and symbol.'); return;
    }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (expiresIn <= 0) { setError('This reset session has expired. Request a new code.'); return; }
    setBusy(true); setError('');
    try {
      await resetPassword(resetToken, newPassword, confirmPassword);
      onComplete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reset your password.');
    } finally { setBusy(false); }
  }

  return (
    <LinearGradient colors={['#2A160D', '#160905']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <RNText style={styles.title}>{stage === 'identifier' ? 'Forgot Password?' : stage === 'otp' ? 'Verify Recovery Code' : 'Reset Password'}</RNText>
        {stage === 'identifier' && <>
          <Text style={styles.copy}>Enter your registered email address or mobile number. We’ll send a recovery code to the email address on your account.</Text>
          <LoginInput placeholder="Email or Mobile Number" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" icon={<Ionicons name="mail-outline" size={22} color="#F8DCC6" />} />
          <LoginButton title={busy ? 'Sending…' : 'Continue'} onPress={() => void sendCode()} disabled={busy} />
        </>}
        {stage === 'otp' && <>
          <Text style={styles.copy}>Enter the six-digit code sent to your registered email address. The code expires in 10 minutes.</Text>
          <LoginInput placeholder="6-digit recovery code" value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} autoCapitalize="none" icon={<Ionicons name="key-outline" size={22} color="#F8DCC6" />} />
          <Text style={styles.copy}>{expiresIn > 0 ? `Code expires in ${Math.ceil(expiresIn / 60)} min.` : 'Code expired.'}</Text>
          <LoginButton title={busy ? 'Verifying…' : 'Verify Code'} onPress={() => void verifyCode()} disabled={busy} />
          <Pressable disabled={cooldown > 0 || busy} onPress={() => void sendCode()} style={styles.link}><Text style={styles.linkText}>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend recovery code'}</Text></Pressable>
        </>}
        {stage === 'password' && <>
          <Text style={styles.copy}>Choose a new password. Reset session expires in {Math.ceil(expiresIn / 60)} min.</Text>
          <LoginInput placeholder="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry showPasswordToggle autoCapitalize="none" icon={<Ionicons name="lock-closed-outline" size={22} color="#F8DCC6" />} />
          <Text style={styles.copy}>Use at least 8 characters with a letter, number, and symbol.</Text>
          <LoginInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry showPasswordToggle autoCapitalize="none" icon={<Ionicons name="lock-closed-outline" size={22} color="#F8DCC6" />} />
          <LoginButton title={busy ? 'Resetting…' : 'Reset Password'} onPress={() => void submitPassword()} disabled={busy} />
        </>}
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable onPress={onBackToLogin} style={styles.link}><Text style={styles.linkText}>Back to Log In</Text></Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', gap: 16, paddingHorizontal: 28, paddingVertical: 36 },
  title: { color: '#FFF0DF', fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 40, marginBottom: 8 },
  copy: { color: '#F8DCC6', fontFamily: 'Montserrat_400Regular', fontSize: 13, lineHeight: 20 },
  error: { color: '#FF9A9A', fontFamily: 'Montserrat_500Medium', fontSize: 13 },
  link: { alignSelf: 'center', padding: 8 },
  linkText: { color: '#F8DCC6', textDecorationLine: 'underline', fontFamily: 'Montserrat_500Medium', fontSize: 13 },
});
