import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { register } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { setToken as setApiToken } from '../api/client';
import { colors, borderRadius, shadows } from '../theme';

export default function PatientRegisterScreen({ navigation }) {
  const { setUser, setToken } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const cleanPhone = () => phone.replace(/\D/g, '');

  const validate = () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !username.trim() || !password || !confirmPassword) {
      Alert.alert('Required', 'All fields are required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }
    const digits = cleanPhone();
    if (digits.length !== 10) {
      Alert.alert('Invalid Phone', 'Phone number must be 10 digits');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const p = cleanPhone();
      const data = await register(name.trim(), username.trim(), password, p, email.trim());
      const user = { id: data.id, name: data.name, username: data.username, role: 'PATIENT', patientId: data.patientId };
      setUser(user);
      setToken(data.token);
      setApiToken(data.token);
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join ClinicFlow as a patient</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="10 digits" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" maxLength={10} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Choose a username" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Min 6 chars" placeholderTextColor={colors.textMuted} secureTextEntry />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Confirm</Text>
              <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat" placeholderTextColor={colors.textMuted} secureTextEntry />
            </View>
          </View>

          <TouchableOpacity style={[styles.registerBtn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.registerBtnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkWrap}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1 },
  hero: { paddingTop: 60, paddingBottom: 40, alignItems: 'center', overflow: 'hidden' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroShape1: { position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFFFFF08' },
  heroShape2: { position: 'absolute', bottom: -30, left: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: '#FFFFFF06' },
  heroContent: { alignItems: 'center' },
  logo: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#FFFFFF20', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#FFFFFF30' },
  logoCross: { fontSize: 30, fontWeight: '300', color: '#FFFFFF', marginTop: -2 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: '#FFFFFFCC', marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 28, padding: 24, marginHorizontal: 20, marginTop: -16, ...shadows.xl },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 5, marginLeft: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { backgroundColor: colors.bg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text, fontWeight: '500' },
  row: { flexDirection: 'row' },
  registerBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 15, alignItems: 'center', marginTop: 6, ...shadows.md },
  registerBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  linkWrap: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 13, color: colors.textSecondary },
  linkHighlight: { color: colors.primaryLight, fontWeight: '700' },
});
