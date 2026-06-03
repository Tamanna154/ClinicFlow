import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { forgotPassword, resetPassword } from '../api/authApi';
import { colors, borderRadius, shadows } from '../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleRequest = async () => {
    if (!email.trim() && !phone.trim()) {
      Alert.alert('Required', 'Enter your email or phone number');
      return;
    }
    setLoading(true);
    try {
      const data = await forgotPassword(email.trim(), phone.trim());
      setResetToken(data.token || '');
      Alert.alert('Reset Code Sent', data.message || 'Check your email/phone for the reset code.');
      setStep('reset');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!resetToken && !token.trim()) {
      Alert.alert('Required', 'Enter the reset code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token.trim() || resetToken, newPassword);
      Alert.alert('Success', 'Password reset successfully. You can now log in.', [
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={styles.logo}>
              <Text style={styles.logoCross}>+</Text>
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>{step === 'request' ? 'Enter your email or phone to receive a code' : 'Enter the reset code and your new password'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {step === 'request' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Registered email" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Registered phone number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
              </View>

              <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleRequest} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnText}>Send Reset Code</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reset Code</Text>
                <TextInput style={styles.input} value={token || resetToken} onChangeText={setToken} placeholder="Enter the code from email/phone" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="Min 6 characters" placeholderTextColor={colors.textMuted} secureTextEntry />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat new password" placeholderTextColor={colors.textMuted} secureTextEntry />
              </View>

              <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnText}>Reset Password</Text>}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
            <Text style={styles.linkText}>Back to <Text style={styles.linkHighlight}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  hero: { paddingTop: 80, paddingBottom: 48, alignItems: 'center', overflow: 'hidden' },
  heroContent: { alignItems: 'center' },
  logo: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#FFFFFF20', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#FFFFFF30' },
  logoCross: { fontSize: 30, fontWeight: '300', color: '#FFFFFF', marginTop: -2 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#FFFFFFCC', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  card: { backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24, marginTop: -8 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: colors.bg, borderRadius: 14, borderWidth: 1.5, borderColor: colors.borderLight, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text, fontWeight: '500' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  divider: { flex: 1, height: 1, backgroundColor: colors.borderLight },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  btn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, ...shadows.md },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 13, color: colors.textSecondary },
  linkHighlight: { color: colors.primaryLight, fontWeight: '700' },
});
