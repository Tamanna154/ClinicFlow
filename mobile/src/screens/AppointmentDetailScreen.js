import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Linking, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { appointmentApi } from '../api/appointmentApi';
import { reminderApi } from '../api/reminderApi';
import { patientApi } from '../api/patientApi';
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

function Row({ label, value, icon }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon && <Text style={styles.rowIcon}>{icon}</Text>}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

export default function AppointmentDetailScreen({ route, navigation }) {
  const initial = route.params.appointment;
  const [appointment, setAppointment] = useState(initial);
  const [reminders, setReminders] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [visitNotes, setVisitNotes] = useState({ diagnosis: '', prescription: '', additionalNotes: '' });
  const [visitNotesSaving, setVisitNotesSaving] = useState(false);

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
    if (!visitNotes.diagnosis.trim() && !visitNotes.prescription.trim() && !visitNotes.additionalNotes.trim()) {
      Alert.alert('Required', 'Add at least one note (diagnosis, prescription, or notes)');
      return;
    }
    setVisitNotesSaving(true);
    try {
      const updated = await appointmentApi.addVisitNotes(appointment.id, visitNotes);
      setAppointment(updated);
      Alert.alert('Saved', 'Visit notes saved & patient record updated.');
      setVisitNotes({ diagnosis: '', prescription: '', additionalNotes: '' });
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setVisitNotesSaving(false); }
  };

  const dateFormatted = appointment.appointmentDate
    ? new Date(appointment.appointmentDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      })
    : '';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: ss.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: ss.text }]} />
            <Text style={[styles.statusText, { color: ss.text }]}>{status}</Text>
          </View>
          <Text style={styles.dateText}>{dateFormatted}</Text>
          <Text style={styles.timeText}>{appointment.startTime} - {appointment.endTime}</Text>
        </View>

        <Section title="Doctor">
          <Row icon="👨‍⚕️" label="Name" value={`Dr. ${appointment.doctorName}`} />
          <Row icon="🔬" label="Specialization" value={appointment.doctorSpecialization} />
        </Section>

        <Section title="Patient">
          <Row icon="👤" label="Name" value={appointment.patientName} />
          <Row icon="📞" label="Phone" value={appointment.patientPhone} />
        </Section>

        {appointment.reason && (
          <Section title="Reason for Visit">
            <Text style={styles.reasonText}>{appointment.reason}</Text>
          </Section>
        )}

        {appointment.notes && (
          <Section title="Notes">
            <Text style={styles.reasonText}>{appointment.notes}</Text>
          </Section>
        )}

        {appointment.isOnline && (
          <View style={styles.onlineCard}>
            <Text style={styles.onlineIcon}>📹</Text>
            <View style={styles.onlineInfo}>
              <Text style={styles.onlineTitle}>Online Consultation</Text>
              {appointment.meetingLink ? (
                <TouchableOpacity onPress={() => Linking.openURL(appointment.meetingLink)}>
                  <Text style={styles.onlineLink}>{appointment.meetingLink}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.onlineNoLink}>No meeting link provided</Text>
              )}
            </View>
          </View>
        )}

        {appointment.consultationNotes && (
          <Section title="Doctor's Consultation Notes">
            <Text style={styles.reasonText}>{appointment.consultationNotes}</Text>
          </Section>
        )}

        {appointment.googleEventId && (
          <View style={styles.googleCard}>
            <Text style={styles.googleIcon}>▣</Text>
            <View>
              <Text style={styles.googleTitle}>Google Calendar Event</Text>
              <Text style={styles.googleId}>ID: {appointment.googleEventId}</Text>
            </View>
          </View>
        )}

        {/* Doctor's Visit Notes (only when IN_PROGRESS) */}
        {appointment.status === 'IN_PROGRESS' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Doctor's Visit Notes</Text>
            <Text style={styles.visitNoteHint}>These will be saved to the patient's medical history</Text>
            <View style={{marginBottom: 10}}><Text style={{fontSize:12, fontWeight:'600', color:colors.textSecondary, marginBottom:4}}>Diagnosis</Text><TextInput style={[styles.viInput, styles.viMultiline]} value={visitNotes.diagnosis} onChangeText={(v) => setVisitNotes({...visitNotes, diagnosis: v})} placeholder="e.g. Acute bronchitis..." placeholderTextColor={colors.textMuted} multiline numberOfLines={2} /></View>
            <View style={{marginBottom: 10}}><Text style={{fontSize:12, fontWeight:'600', color:colors.textSecondary, marginBottom:4}}>Prescription</Text><TextInput style={[styles.viInput, styles.viMultiline]} value={visitNotes.prescription} onChangeText={(v) => setVisitNotes({...visitNotes, prescription: v})} placeholder="e.g. Amoxicillin 500mg..." placeholderTextColor={colors.textMuted} multiline numberOfLines={2} /></View>
            <View style={{marginBottom: 10}}><Text style={{fontSize:12, fontWeight:'600', color:colors.textSecondary, marginBottom:4}}>Additional Notes</Text><TextInput style={[styles.viInput, styles.viMultiline]} value={visitNotes.additionalNotes} onChangeText={(v) => setVisitNotes({...visitNotes, additionalNotes: v})} placeholder="Any other observations..." placeholderTextColor={colors.textMuted} multiline numberOfLines={2} /></View>
            <TouchableOpacity style={[styles.viSaveBtn, visitNotesSaving && {opacity:0.6}]} onPress={handleSaveVisitNotes} disabled={visitNotesSaving}>
              {visitNotesSaving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.viSaveBtnText}>Save to Patient Record</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Reminders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SMS Reminders</Text>
          {reminders.length > 0 ? (
            reminders.map((r, i) => (
              <View key={i} style={styles.reminderRow}>
                <View style={[styles.reminderDot, r.sent ? { backgroundColor: colors.success } : { backgroundColor: colors.warning }]} />
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderTime}>
                    {new Date(r.reminderTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.reminderStatus}>{r.sent ? 'Sent' : `Pending (${r.sendSms ? 'SMS' : 'No SMS'})`}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noReminders}>No reminders set</Text>
          )}
          {!reminderLoading ? (
            <View style={styles.reminderActions}>
              <TouchableOpacity style={styles.reminderBtn} onPress={() => handleCreateReminder(24)} activeOpacity={0.7}>
                <Text style={styles.reminderBtnText}>Remind 24h before</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reminderBtn} onPress={() => handleCreateReminder(2)} activeOpacity={0.7}>
                <Text style={styles.reminderBtnText}>Remind 2h before</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />
          )}
        </View>

        {actionLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />}

        <View style={styles.actionButtons}>
          {canAdvance && (
            <TouchableOpacity style={styles.advanceBtn} onPress={() => changeStatus(STATUS_FLOW[idx + 1])} activeOpacity={0.8} disabled={actionLoading}>
              <Text style={styles.advanceBtnText}>Mark as {STATUS_FLOW[idx + 1]}</Text>
            </TouchableOpacity>
          )}
          {status !== 'CANCELLED' && status !== 'COMPLETED' && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8} disabled={actionLoading}>
              <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}><Text style={styles.deleteBtnText}>Delete</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: borderRadius.sm, marginBottom: 12, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateText: { fontSize: 19, fontWeight: '800', color: colors.text, marginBottom: 4 },
  timeText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  section: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: 12, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { fontSize: 13, marginRight: 8, width: 18, textAlign: 'center' },
  rowLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  rowValue: { fontSize: 13, color: colors.text, fontWeight: '600', textAlign: 'right' },
  reasonText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', lineHeight: 20 },
  onlineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.infoLight, borderWidth: 1, borderColor: '#BAE6FD', borderRadius: borderRadius.md, padding: 14, marginBottom: 12 },
  onlineIcon: { fontSize: 22, marginRight: 12 },
  onlineInfo: { flex: 1 },
  onlineTitle: { fontSize: 14, fontWeight: '700', color: colors.info },
  onlineLink: { fontSize: 12, color: colors.primaryLight, textDecorationLine: 'underline', marginTop: 2 },
  onlineNoLink: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  googleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight, borderWidth: 1, borderColor: '#BBF7D0', borderRadius: borderRadius.md, padding: 14, marginBottom: 12 },
  visitNoteHint: { fontSize: 11, color: colors.textMuted, marginBottom: 12, fontStyle: 'italic' },
  viInput: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, fontWeight: '500' },
  viMultiline: { minHeight: 56, textAlignVertical: 'top', paddingVertical: 10 },
  viSaveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  viSaveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  googleIcon: { fontSize: 22, color: colors.success, marginRight: 12, fontWeight: '700' },
  googleTitle: { fontSize: 14, fontWeight: '700', color: colors.success },
  googleId: { fontSize: 10, color: colors.textMuted, marginTop: 1, fontFamily: 'monospace' },
  actionButtons: { gap: 8, marginTop: 4 },
  advanceBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', ...shadows.sm },
  advanceBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  cancelBtn: { backgroundColor: colors.errorLight, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  cancelBtnText: { color: colors.error, fontSize: 14, fontWeight: '700' },
  reminderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  reminderDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  reminderInfo: { flex: 1 },
  reminderTime: { fontSize: 13, fontWeight: '600', color: colors.text },
  reminderStatus: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  noReminders: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  reminderActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  reminderBtn: { flex: 1, backgroundColor: colors.bg, borderRadius: borderRadius.sm, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  reminderBtnText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  footer: { padding: 16, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight },
  deleteBtn: { backgroundColor: colors.error, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center' },
  deleteBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
