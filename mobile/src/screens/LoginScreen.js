import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
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
      const user = { id: data.id, name: data.name, username: data.username, role: data.role, doctorId: data.doctorId, patientId: data.patientId };
      setUser(user);
      setToken(data.token);
      setApiToken(data.token);
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>C</Text>
        </View>
        <Text style={styles.title}>ClinicFlow</Text>
        <Text style={styles.subtitle}>Doctor & Receptionist Portal</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

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

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />

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

        <Text style={styles.hint}>Doctor: doctor@gmail.com / doctor123</Text>
        <Text style={styles.hint}>Receptionist: receptionist@gmail.com / reception123</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFFFFF20', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  logoText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#FFFFFFCC', marginTop: 4, marginBottom: 32 },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 24,
    width: '100%', ...shadows.lg,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.bg, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, fontWeight: '500',
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16,
    alignItems: 'center', marginTop: 4, ...shadows.md,
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 11, color: '#FFFFFFAA', marginTop: 8, textAlign: 'center' },
  linkWrap: { marginTop: 16, alignItems: 'center' },
  linkText: { fontSize: 13, color: colors.textSecondary },
  linkHighlight: { color: colors.primary, fontWeight: '700' },
});
