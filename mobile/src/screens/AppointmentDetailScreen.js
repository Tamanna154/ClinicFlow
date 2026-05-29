import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Linking, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { appointmentApi } from '../api/appointmentApi';
import { reminderApi } from '../api/reminderApi';
import { patientApi } from '../api/patientApi';
import { usePermission } from '../hooks/usePermission';
import { colors, shadows, borderRadius, typography, getStatusStyle } from '../theme';

const STATUS_FLOW = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ icon, label, value, isLink }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, isLink && { color: colors.primaryLight, textDecorationLine: 'underline' }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function AppointmentDetailScreen({ route, navigation }) {
  const initial = route.params.appointment;
  const [appointment, setAppointment] = useState(initial);
  const [reminders, setReminders] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [visitNotes, setVisitNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const { hasPermission } = usePermission();
  const canManage = hasPermission('MANAGE_APPOINTMENTS');

  useFocusEffect(useCallback(() => {
    let mounted = true;
    (async () => {
      try {
        const f = await appointmentApi.getById(initial.id);
        if (mounted) setAppointment(f);
        try { const r = await reminderApi.getByAppointment(initial.id); if (mounted) setReminders(r); }
        catch (e) { /* reminders may not exist yet */ }
      } catch (e) { console.log(e.message); }
    })();
    return () => { mounted = false; };
  }, [initial.id]));

  const handleCreateReminder = async (hoursBefore) => {
    setReminderLoading(true);
    try {
      const r = await reminderApi.create(appointment.id, hoursBefore);
      setReminders(prev => [...prev, r]);
      Alert.alert('Reminder Set', `SMS reminder will be sent ${hoursBefore}h before the appointment.`);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setReminderLoading(false); }
  };

  const status = appointment.status;
  const ss = getStatusStyle(status);
  const idx = STATUS_FLOW.indexOf(status);
  const canAdvance = idx >= 0 && idx < STATUS_FLOW.length - 1;

  const changeStatus = async (newStatus) => {
    setActionLoading(true);
    try { const u = await appointmentApi.updateStatus(appointment.id, newStatus); setAppointment(u); }
    catch (e) { Alert.alert('Error', e.message); }
    finally { setActionLoading(false); }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Appointment', 'Cancel this appointment?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: () => changeStatus('CANCELLED') },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Appointment', 'Permanently delete?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setActionLoading(true);
        try { await appointmentApi.delete(appointment.id); navigation.goBack(); }
        catch (e) { Alert.alert('Error', e.message); }
        finally { setActionLoading(false); }
      } },
    ]);
  };

  const handleSaveVisitNotes = async () => {
    if (!visitNotes.trim()) return;
    setSavingNotes(true);
    try {
      await appointmentApi.addVisitNotes(appointment.id, visitNotes);
      Alert.alert('Saved', 'Visit notes added.');
      setVisitNotes('');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setSavingNotes(false); }
  };

  const date = appointment.appointmentDate
    ? new Date(appointment.appointmentDate + 'T00:00:00')
    : null;
  const dateStr = date
    ? date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: ss.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: ss.text }]} />
            <Text style={[styles.statusText, { color: ss.text }]}>{appointment.status}</Text>
          </View>
          <Text style={styles.date}>{dateStr}</Text>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Time</Text>
            <Text style={styles.timeValue}>{appointment.startTime} - {appointment.endTime}</Text>
          </View>
        </View>

        <Section title="Patient">
          <Row icon="👤" label="Name" value={appointment.patientName} />
          <Row icon="📞" label="Phone" value={appointment.patientPhone} />
        </Section>

        <Section title="Doctor">
          <Row icon="👨‍⚕️" label="Name" value={appointment.doctorName ? `Dr. ${appointment.doctorName}` : null} />
        </Section>

        <Section title="Details">
          <Row icon="📝" label="Reason" value={appointment.reason} />
          <Row icon="🔗" label="Type" value={appointment.isOnline ? 'Online Consultation' : 'In-Person Visit'} />
        </Section>

        <Section title="Visit Notes">
          <TextInput
            style={styles.notesInput}
            placeholder="Add visit notes..."
            placeholderTextColor={colors.textMuted}
            value={visitNotes}
            onChangeText={setVisitNotes}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.saveNotesBtn, (!visitNotes.trim() || savingNotes) && { opacity: 0.5 }]}
            onPress={handleSaveVisitNotes}
            disabled={!visitNotes.trim() || savingNotes}
            activeOpacity={0.8}
          >
            {savingNotes ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveNotesText}>Save Notes</Text>}
          </TouchableOpacity>
        </Section>

        <Section title="Reminders">
          {reminders.length > 0 ? (
            reminders.map((r) => (
              <View key={r.id} style={styles.reminderRow}>
                <Text style={styles.reminderTime}>{r.hoursBefore}h before</Text>
                <Text style={styles.reminderStatus}>{r.sent ? 'Sent' : 'Pending'}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noReminders}>No reminders set</Text>
          )}
          {!reminderLoading ? (
            <View style={styles.reminderBtns}>
              <TouchableOpacity style={styles.reminderBtn} onPress={() => handleCreateReminder(24)} activeOpacity={0.7}>
                <Text style={styles.reminderBtnText}>24h before</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reminderBtn} onPress={() => handleCreateReminder(2)} activeOpacity={0.7}>
                <Text style={styles.reminderBtnText}>2h before</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />
          )}
        </Section>

        {actionLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />}

        {canManage && (
          <View style={styles.actionRow}>
            {canAdvance && (
              <TouchableOpacity style={styles.advanceBtn} onPress={() => changeStatus(STATUS_FLOW[idx + 1])} activeOpacity={0.8} disabled={actionLoading}>
                <Text style={styles.advanceBtnText}>Mark as {STATUS_FLOW[idx + 1]}</Text>
              </TouchableOpacity>
            )}
            {status !== 'CANCELLED' && status !== 'COMPLETED' && (
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8} disabled={actionLoading}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {canManage && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete Appointment</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    backgroundColor: colors.surface, borderRadius: borderRadius['2xl'], padding: 24,
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.md,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: borderRadius.md, marginBottom: 12, gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  date: { fontSize: 15, color: colors.textSecondary, fontWeight: '600', marginBottom: 8 },
  timeBlock: { alignItems: 'center' },
  timeLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  timeValue: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  section: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  rowIcon: { fontSize: 14, marginRight: 10, width: 20, textAlign: 'center', marginTop: 1 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 1 },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  notesInput: {
    backgroundColor: colors.bg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border,
    padding: 12, fontSize: 14, color: colors.text, fontWeight: '500', minHeight: 70,
    textAlignVertical: 'top', marginBottom: 8,
  },
  saveNotesBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 10, alignItems: 'center' },
  saveNotesText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  reminderTime: { fontSize: 13, fontWeight: '600', color: colors.text },
  reminderStatus: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  noReminders: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  reminderBtns: { flexDirection: 'row', gap: 8, marginTop: 10 },
  reminderBtn: { flex: 1, backgroundColor: colors.primary + '10', borderRadius: borderRadius.sm, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '20' },
  reminderBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  advanceBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 13, alignItems: 'center', ...shadows.sm },
  advanceBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  cancelBtn: { flex: 1, backgroundColor: colors.warningLight, borderRadius: borderRadius.md, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  cancelBtnText: { color: colors.warning, fontSize: 14, fontWeight: '700' },
  footer: { backgroundColor: colors.surface, padding: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  deleteBtn: { backgroundColor: colors.errorLight, borderRadius: borderRadius.md, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  deleteBtnText: { color: colors.error, fontSize: 14, fontWeight: '700' },
});
