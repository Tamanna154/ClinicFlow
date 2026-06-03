import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { changePassword } from '../api/authApi';
import { colors, borderRadius, shadows } from '../theme';

export default function ChangePasswordScreen({ navigation }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!oldPassword) {
      Alert.alert('Required', 'Enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
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
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>Enter your current password and a new one</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput style={styles.input} value={oldPassword} onChangeText={setOldPassword} placeholder="Enter current password" placeholderTextColor={colors.textMuted} secureTextEntry />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="Min 6 characters" placeholderTextColor={colors.textMuted} secureTextEntry />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat new password" placeholderTextColor={colors.textMuted} secureTextEntry />
          </View>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleChange} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnText}>Update Password</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkWrap}>
            <Text style={styles.linkText}>Back to <Text style={styles.linkHighlight}>Profile</Text></Text>
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
  btn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, ...shadows.md },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 13, color: colors.textSecondary },
  linkHighlight: { color: colors.primaryLight, fontWeight: '700' },
});
