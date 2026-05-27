import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { patientApi } from '../api/patientApi';
import { smsApi } from '../api/smsApi';
import { colors, borderRadius, shadows, typography } from '../theme';

export default function BulkSmsScreen() {
  const [patients, setPatients] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try { setLoading(true); const d = await patientApi.getAll(); setPatients(d.filter(p => !p.archived)); }
    catch (e) { Alert.alert('Error', 'Could not load patients'); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchPatients(); }, []));

  const togglePatient = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === patients.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(patients.map(p => p.id)));
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) { Alert.alert('Select Patients', 'Select at least one patient'); return; }
    if (!message.trim()) { Alert.alert('Message Required', 'Enter a message to send'); return; }
    setSending(true);
    try {
      const phones = patients.filter(p => selectedIds.has(p.id)).map(p => p.phone).filter(Boolean);
      const result = await smsApi.sendBulk(phones, message.trim());
      Alert.alert('SMS Sent', `Message sent to ${result.total} patient(s)`);
      setSelectedIds(new Set());
      setMessage('');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setSending(false); }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Compose Message */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Compose Message</Text>
          <Text style={styles.label}>SMS Message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message here... It will be sent via SMS to all selected patients."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <View style={styles.charCount}>
            <Text style={styles.charCountText}>{message.length} / 160 chars</Text>
          </View>
        </View>

        {/* Select Patients */}
        <View style={styles.card}>
          <View style={styles.selHeader}>
            <Text style={styles.sectionTitle}>Select Patients ({selectedIds.size} selected)</Text>
            <TouchableOpacity onPress={selectAll} style={styles.selAllBtn}>
              <Text style={styles.selAllText}>{selectedIds.size === patients.length ? 'Deselect All' : 'Select All'}</Text>
            </TouchableOpacity>
          </View>
          {patients.map((p) => {
            const sel = selectedIds.has(p.id);
            return (
              <TouchableOpacity key={p.id} style={[styles.patientRow, sel && styles.patientRowSel]} onPress={() => togglePatient(p.id)} activeOpacity={0.7}>
                <View style={[styles.chkBox, sel && styles.chkBoxActive]}>
                  {sel && <Text style={styles.chkMark}>✓</Text>}
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientPhone}>{p.phone}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={[styles.sendBtn, sending && { opacity: 0.6 }]} onPress={handleSend} disabled={sending}>
          {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.sendBtnText}>Send SMS to {selectedIds.size} patient(s)</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.bg, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, fontWeight: '500' },
  messageInput: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { alignItems: 'flex-end', marginTop: 4 },
  charCountText: { fontSize: 11, color: colors.textMuted },
  selHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selAllBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.bg, borderRadius: borderRadius.sm },
  selAllText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  patientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  patientRowSel: { backgroundColor: colors.primary + '06' },
  chkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: colors.surface },
  chkBoxActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chkMark: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 14, fontWeight: '600', color: colors.text },
  patientPhone: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  sendBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', ...shadows.md, marginTop: 4 },
  sendBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
