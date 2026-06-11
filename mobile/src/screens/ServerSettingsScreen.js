import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { getApiBase, setApiBase, initializeApiBase, resetApiBase, getDefaultApiBase, quickProbe } from '../api/apiBase';
import { colors, borderRadius, shadows } from '../theme';

export default function ServerSettingsScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initializeApiBase();
      } catch (err) {
        console.warn('initializeApiBase failed in ServerSettingsScreen:', err);
      } finally {
        setUrl(getApiBase());
        setLoading(false);
      }
    })();
  }, []);

  const sanitizeUrl = (input) => {
    if (!input) return '';
    let clean = input.trim();
    // Prepend http:// if no protocol is specified
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'http://' + clean;
    }
    // Replace IP.port with IP:port (e.g. 10.0.2.2.8080 -> 10.0.2.2:8080)
    clean = clean.replace(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d+)/, '$1:$2');
    // Replace localhost.port with localhost:port (e.g. localhost.8080 -> localhost:8080)
    clean = clean.replace(/(localhost)\.(\d+)/i, '$1:$2');
    // Trim trailing slashes
    clean = clean.replace(/\/+$/, '');
    return clean;
  };

  const handleSave = async () => {
    const cleanUrl = sanitizeUrl(url);
    setUrl(cleanUrl);
    if (!cleanUrl) {
      Alert.alert('Error', 'Server URL is required');
      return;
    }
    setSaving(true);
    try {
      await setApiBase(cleanUrl);
      Alert.alert(
        'Saved',
        'Server URL updated. Go back and try logging in.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Login');
              }
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    const cleanUrl = sanitizeUrl(url);
    setUrl(cleanUrl);
    setTesting(true);
    try {
      const result = await quickProbe(cleanUrl);
      if (result.ok) {
        Alert.alert('Connected', `✓ Server reachable at ${cleanUrl} (HTTP ${result.status})\n\nSave and try logging in.`);
      } else if (result.status === 0) {
        const knownIps = ['192.168.1.100', '192.168.1.101', '192.168.0.100', '192.168.0.101', '192.168.29.100', '10.0.2.2', '10.151.137.83', '10.151.137.1', 'localhost'];
        const suggestions = knownIps.map(ip => `http://${ip}:8080/api`).join('\n');
        Alert.alert('Connection Failed', `${cleanUrl} is not reachable.\n\nTry pasting one of these URLs:\n${suggestions}\n\nAlso: verify backend is running and firewall allows port 8080.`);
      } else {
        Alert.alert('Wrong Endpoint', `Server at ${cleanUrl} responded with HTTP ${result.status}, but the API endpoint was not found.\n\nMake sure the URL includes /api (e.g. http://10.0.2.2:8080/api)`);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setTesting(false);
    }
  };

  const handleReset = async () => {
    const def = getDefaultApiBase();
    setSaving(true);
    try {
      await resetApiBase();
      setUrl(def);
      Alert.alert('Reset', `URL reset to default: ${def}`);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Server Configuration</Text>
        <Text style={styles.desc}>Enter the IP address and port where your backend server is running.</Text>

        <Text style={styles.label}>Backend API URL</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="http://192.168.1.100:8080/api"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Text style={styles.hint}>Web / same machine: http://localhost:8080/api</Text>
        <Text style={styles.hint}>Android emulator: http://10.0.2.2:8080/api (default)</Text>
        <Text style={styles.hint}>iOS simulator: http://localhost:8080/api</Text>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Save & Go Back</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testBtn, (saving || testing) && { opacity: 0.6 }]}
          onPress={handleTest}
          disabled={saving || testing}
          activeOpacity={0.8}
        >
          {testing ? <ActivityIndicator color={colors.primary} size="small" /> : <Text style={styles.testBtnText}>Test Connection</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resetBtn, saving && { opacity: 0.6 }]}
          onPress={handleReset}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.resetBtnText}>Reset to Default</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 24,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.lg,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8, letterSpacing: -0.3 },
  desc: { fontSize: 13, color: colors.textSecondary, marginBottom: 20, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    backgroundColor: colors.bg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text, fontWeight: '600',
  },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: 4, marginBottom: 20 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 15, alignItems: 'center', ...shadows.md, marginTop: 8 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  testBtn: { backgroundColor: colors.successLight, borderRadius: borderRadius.md, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: colors.success + '40', marginTop: 12, minHeight: 50 },
  testBtnText: { color: colors.success, fontSize: 15, fontWeight: '700' },
  resetBtn: { backgroundColor: colors.bg, borderRadius: borderRadius.md, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginTop: 12 },
  resetBtnText: { color: colors.textSecondary, fontSize: 15, fontWeight: '700' },
});
