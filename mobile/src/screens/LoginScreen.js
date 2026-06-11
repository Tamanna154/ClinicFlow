import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { setToken as setApiToken } from '../api/client';
import { getApiBase, initializeApiBase, resetApiBase as resetApiBaseFn } from '../api/apiBase';
import { colors, borderRadius, shadows } from '../theme';

export default function LoginScreen({ navigation }) {
  const { setUser, setToken } = useAuth();
  const [username, setUsername] = useState('clincflow@gmail.com');
  const [password, setPassword] = useState('clinic@flow');
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiBase());
  const [discovering, setDiscovering] = useState(true);
  const probedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setServerUrl(getApiBase());
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (probedRef.current) return;
    probedRef.current = true;
    (async () => {
      try {
        await initializeApiBase();
      } catch (err) {
        console.warn('initializeApiBase failed:', err);
      } finally {
        setServerUrl(getApiBase());
        setDiscovering(false);
      }
    })();
  }, []);

  const tryAutoDetect = async (showResult = true) => {
    try {
      await resetApiBaseFn();
      await initializeApiBase(true);
      const newUrl = getApiBase();
      setServerUrl(newUrl);
      if (showResult) {
        Alert.alert('Auto-Detect Complete', `Server at: ${newUrl}\n\nTap Login Now to try again.`, [
          { text: 'Login Now', onPress: () => handleLogin() },
          { text: 'OK', style: 'cancel' }
        ]);
      }
      return newUrl;
    } catch (_) {
      return null;
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Required', 'Enter username and password');
      return;
    }
    setLoading(true);

    const lowerUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const data = await login(username.trim(), password.trim());
      const user = { 
        id: data.id, 
        name: data.name, 
        username: data.username, 
        role: data.role, 
        roleTitle: data.roleTitle,
        doctorId: data.doctorId, 
        patientId: data.patientId, 
        email: data.email,
        phone: data.phone,
        permissions: data.permissions || [] 
      };
      setUser(user);
      setToken(data.token);
      setApiToken(data.token);
    } catch (err) {
      const msg = err.message || '';
      const isNetwork = msg.includes('network') || msg.includes('timed out') || msg.includes('Unable to connect') || msg.includes('not responding') || msg.includes('reach server') || msg.includes('Cannot reach');
      const isAuth = msg.includes('Invalid username') || msg.includes('401');

      if (isNetwork) {
        try {
          const newUrl = await tryAutoDetect(false);
          if (newUrl) {
            try {
              const data = await login(username.trim(), password.trim());
              const user = { 
                id: data.id, 
                name: data.name, 
                username: data.username, 
                role: data.role, 
                roleTitle: data.roleTitle,
                doctorId: data.doctorId, 
                patientId: data.patientId, 
                email: data.email,
                phone: data.phone,
                permissions: data.permissions || [] 
              };
              setUser(user);
              setToken(data.token);
              setApiToken(data.token);
              setLoading(false);
              return;
            } catch (_) {}
          }
        } catch (_) {}

        const showTroubleshootOptions = () => {
          Alert.alert(
            'Troubleshoot Connection',
            'Choose an option to fix the connection:',
            [
              { text: 'Auto-Detect Server', onPress: async () => { await tryAutoDetect(); setLoading(false); } },
              { text: 'Server Settings', onPress: () => { setLoading(false); navigation.navigate('ServerSettings'); } },
              { text: 'Offline Mode', style: 'destructive', onPress: () => useOfflineBypass(lowerUser, cleanPass) },
              { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
            ]
          );
        };

        const isRealDevice = serverUrl.includes('127.0.0.1') || serverUrl.includes('localhost');
        const usbHint = isRealDevice
          ? '\n\n📱 Using a real phone?\n  • USB: run → adb reverse tcp:8080 tcp:8080\n  • Wi-Fi: use this PC\'s IP in Server Settings\n  • Firewall: allow port 8080'
          : '';

        Alert.alert(
          'Connection Error',
          `Could not reach server at ${serverUrl}${usbHint}`,
          [
            { text: 'Retry', onPress: () => handleLogin() },
            { text: 'Troubleshoot', onPress: showTroubleshootOptions },
            { text: 'Offline Mode', style: 'destructive', onPress: () => useOfflineBypass(lowerUser, cleanPass) },
          ]
        );
      } else if (isAuth) {
        Alert.alert('Login Failed', 'Invalid username or password');
      } else {
        Alert.alert('Login Failed', msg, [
          { text: 'Server Settings', onPress: () => navigation.navigate('ServerSettings') },
          { text: 'OK', style: 'cancel' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const useOfflineBypass = (lowerUser, cleanPass) => {
    Alert.alert(
      'Offline Mode',
      'You are signing in without a server connection. Data will NOT be saved to the database, and most features require the backend to be running.\n\nGo to Server Settings to configure the correct URL.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue Offline',
          style: 'destructive',
          onPress: () => {
            // Admin bypass
            if (lowerUser === 'clincflow@gmail.com' && cleanPass === 'clinic@flow') {
              setUser({
                id: 1, name: 'Clinic Flow Admin', username: 'clincflow@gmail.com',
                role: 'CLINIC_ADMIN', email: 'clincflow@gmail.com', phone: '7383733435',
                permissions: ['VIEW_PATIENTS', 'MANAGE_PATIENTS', 'VIEW_CALENDAR', 'MANAGE_CALENDAR', 'VIEW_APPOINTMENTS', 'MANAGE_APPOINTMENTS', 'VIEW_DOCTORS', 'MANAGE_PERMISSIONS', 'VIEW_INVENTORY', 'MANAGE_INVENTORY', 'VIEW_BILLING', 'MANAGE_BILLING', 'VIEW_INCOME']
              });
              setToken('mock-admin-token');
              setApiToken('mock-admin-token');
              return;
            }
            if (cleanPass.startsWith('Dr@') && cleanPass.length > 3) {
              const capitalized = cleanPass.substring(3);
              setUser({
                id: 2, name: `Dr. ${capitalized}`, username: lowerUser,
                role: 'DOCTOR', doctorId: 1, email: lowerUser, phone: '9999999999',
                permissions: ['VIEW_PATIENTS', 'MANAGE_PATIENTS', 'VIEW_CALENDAR', 'MANAGE_CALENDAR', 'VIEW_APPOINTMENTS', 'MANAGE_APPOINTMENTS', 'VIEW_DOCTORS']
              });
              setToken('mock-doctor-token');
              setApiToken('mock-doctor-token');
              return;
            }
            if (cleanPass.startsWith('Pa@') && cleanPass.length > 3) {
              const capitalized = cleanPass.substring(3);
              setUser({
                id: 3, name: capitalized, username: lowerUser,
                role: 'PATIENT', patientId: 1, email: lowerUser, phone: '8888888888',
                permissions: []
              });
              setToken('mock-patient-token');
              setApiToken('mock-patient-token');
              return;
            }
            Alert.alert('Invalid Credentials', 'Offline mode only supports the demo accounts shown on the login screen.');
          }
        }
      ]
    );
  };

  if (discovering) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.logo}>
          <Text style={styles.logoCross}>+</Text>
        </View>
        <Text style={[styles.title, { marginTop: 16 }]}>ClinicFlow</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 32 }} />
        <Text style={{ color: '#FFFFFFAA', marginTop: 12, fontSize: 13 }}>Connecting to server...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} keyboardShouldPersistTaps="handled">
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
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to manage your clinic</Text>
          </View>

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

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.hintTitle}>🔐 Test Credentials</Text>
            <Text style={styles.hint}>Admin:    clincflow@gmail.com / clinic@flow</Text>
            <Text style={styles.hint}>Doctor:   drtamanna@gmail.com / Dr@Tamanna</Text>
            <Text style={styles.hint}>Patient:  padhyey@gmail.com / Pa@Dhyey</Text>
            <Text style={styles.hint}>Patient2: patient1@gmail.com / Pa@Test</Text>
            <Text style={styles.hint}>Staff:     staff@clinic.com / Staff@123</Text>
            <Text style={styles.hintSmall}>👤 View all credentials: Login as Admin → Dashboard → Login Credentials</Text>
            <Text style={styles.serverUrl}>{serverUrl}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ServerSettings')} style={styles.serverBtn} activeOpacity={0.7}>
              <Text style={styles.serverBtnText}>⚙ Server Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  hero: {
    paddingTop: 80, paddingBottom: 48,
    alignItems: 'center', overflow: 'hidden',
  },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroShape1: {
    position: 'absolute', top: -80, right: -50,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#FFFFFF08',
  },
  heroShape2: {
    position: 'absolute', bottom: -40, left: -70,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#FFFFFF06',
  },
  heroContent: { alignItems: 'center' },
  logo: {
    width: 80, height: 80, borderRadius: 28,
    backgroundColor: '#FFFFFF20',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#FFFFFF30',
  },
  logoCross: { fontSize: 40, fontWeight: '300', color: '#FFFFFF', marginTop: -2 },
  title: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#FFFFFFCC', marginTop: 6, letterSpacing: 0.2 },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24,
    marginTop: -8, marginHorizontal: 0,
  },
  cardHeader: { marginBottom: 32 },
  cardTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  cardSub: { fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.bg, borderRadius: 14, borderWidth: 1.5, borderColor: colors.borderLight,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text, fontWeight: '500',
  },
  inputFocused: { borderColor: colors.primary },
  loginBtn: {
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, ...shadows.md,
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 13, color: colors.textSecondary },
  linkHighlight: { color: colors.primaryLight, fontWeight: '700' },
  forgotWrap: { marginTop: 8, alignItems: 'center' },
  forgotText: { fontSize: 13, color: colors.primaryLight, fontWeight: '600' },
  footer: { alignItems: 'center', paddingTop: 24, marginTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  hintTitle: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: 4, marginBottom: 4, textAlign: 'center' },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 2, textAlign: 'center', letterSpacing: 0.2 },
  hintSmall: { fontSize: 10, color: colors.textMuted, marginTop: 6, textAlign: 'center', fontStyle: 'italic' },
  serverUrl: { fontSize: 9, color: colors.textMuted, marginTop: 6, textAlign: 'center', opacity: 0.6 },
  serverBtn: { marginTop: 14, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight },
  serverBtnText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.3 },
});
