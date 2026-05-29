import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { setToken as setApiToken } from '../api/client';
import { colors, borderRadius, shadows } from '../theme';

export default function LoginScreen({ navigation }) {
  const { setUser, setToken } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Required', 'Enter username and password');
      return;
    }
    setLoading(true);
    try {
      const data = await login(username.trim(), password.trim());
      const user = { id: data.id, name: data.name, username: data.username, role: data.role, doctorId: data.doctorId, patientId: data.patientId, permissions: data.permissions || [] };
      setUser(user);
      setToken(data.token);
      setApiToken(data.token);
    } catch (err) {
      const isNetwork = err.message.includes('network') || err.message.includes('connect');
      Alert.alert(isNetwork ? 'Network Error' : 'Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <View style={styles.hero}>
          <View style={styles.heroBg}>
            <View style={styles.heroShape1} />
            <View style={styles.heroShape2} />
          </View>
          <View style={styles.heroContent}>
            <View style={styles.logo}>
              <Text style={styles.logoCross}>+</Text>
            </View>
            <Text style={styles.title}>ClinicFlow</Text>
            <Text style={styles.subtitle}>Healthcare management simplified</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to your account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('PatientRegister')} style={styles.linkWrap}>
            <Text style={styles.linkText}>New patient? <Text style={styles.linkHighlight}>Create an account</Text></Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.hint}>Doctor: doctor@gmail.com</Text>
          <Text style={styles.hint}>Receptionist: receptionist@gmail.com</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1 },
  hero: {
    paddingTop: 70, paddingBottom: 48,
    alignItems: 'center', overflow: 'hidden',
  },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroShape1: {
    position: 'absolute', top: -60, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#FFFFFF08',
  },
  heroShape2: {
    position: 'absolute', bottom: -30, left: -60,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#FFFFFF06',
  },
  heroContent: { alignItems: 'center' },
  logo: {
    width: 68, height: 68, borderRadius: 22,
    backgroundColor: '#FFFFFF20',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#FFFFFF30',
  },
  logoCross: { fontSize: 34, fontWeight: '300', color: '#FFFFFF', marginTop: -2 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#FFFFFFCC', marginTop: 6 },
  card: {
    backgroundColor: colors.surface, borderRadius: 28, padding: 28,
    marginHorizontal: 20, marginTop: -20,
    ...shadows.xl,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  cardSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 28 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginLeft: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    backgroundColor: colors.bg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text, fontWeight: '500',
  },
  loginBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, ...shadows.md,
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  linkWrap: { marginTop: 24, alignItems: 'center' },
  linkText: { fontSize: 13, color: colors.textSecondary },
  linkHighlight: { color: colors.primaryLight, fontWeight: '700' },
  scroll: { flexGrow: 1 },
  footer: { alignItems: 'center', paddingHorizontal: 20, marginTop: 24, paddingBottom: 20 },
  hint: { fontSize: 11, color: '#FFFFFFAA', marginTop: 4, textAlign: 'center', letterSpacing: 0.2 },
});
