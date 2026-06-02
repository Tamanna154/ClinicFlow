import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { getApiBase, setApiBase, initializeApiBase, resetApiBase, getDefaultApiBase } from '../api/apiBase';
import { colors, borderRadius, shadows } from '../theme';

export default function ServerSettingsScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      await initializeApiBase();
      setUrl(getApiBase());
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (!trimmed) {
      Alert.alert('Error', 'Server URL is required');
      return;
    }
    setSaving(true);
    try {
      await setApiBase(trimmed);
      Alert.alert('Saved', 'Server URL updated. Restart the app or go back and try again.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
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
  resetBtn: { backgroundColor: colors.bg, borderRadius: borderRadius.md, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginTop: 12 },
  resetBtnText: { color: colors.textSecondary, fontSize: 15, fontWeight: '700' },
});
