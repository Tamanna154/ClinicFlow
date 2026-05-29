import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doctorApi } from '../api/doctorApi';
import { patientApi } from '../api/patientApi';
import { appointmentApi } from '../api/appointmentApi';
import { smsApi } from '../api/smsApi';
import { scheduleApi } from '../api/scheduleApi';
import { colors, borderRadius, shadows, typography } from '../theme';

const STATUS_OPTS = ['SCHEDULED', 'CONFIRMED'];

export default function AppointmentBookingScreen({ route, navigation }) {
  const preDocId = route.params?.doctorId;
  const prefillDate = route.params?.prefillDate;
  const prefillStart = route.params?.prefillStart;
  const prefillEnd = route.params?.prefillEnd;

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [form, setForm] = useState({
    doctorId: preDocId ? String(preDocId) : '', patientId: '',
    appointmentDate: prefillDate || '', startTime: prefillStart || '',
    endTime: prefillEnd || '', reason: '', notes: '', status: 'SCHEDULED',
    isOnline: false, meetingLink: '', consultationNotes: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useFocusEffect(useCallback(() => {
    (async () => {
      try { const [d, p] = await Promise.all([doctorApi.getActive(), patientApi.getAll()]); setDoctors(d); setPatients(p); }
      catch (e) { Alert.alert('Error', 'Failed to load data.'); }
      finally { setLoadingData(false); }
    })();
  }, []));

  useFocusEffect(useCallback(() => {
    if (!form.doctorId || !form.appointmentDate.trim()) return;
    setLoadingSlots(true);
    (async () => {
      try {
        const data = await scheduleApi.get(form.doctorId, form.appointmentDate.trim(), 'daily');
        setSlots(data.days?.[0]?.slots || []);
      } catch (e) { setSlots([]); }
      finally { setLoadingSlots(false); }
    })();
  }, [form.doctorId, form.appointmentDate]));

  const selectSlot = (slot) => {
    setForm({ ...form, startTime: slot.startTime.slice(0,5), endTime: slot.endTime.slice(0,5) });
  };

  const validate = () => {
    const errs = {};
    const today = new Date();
    const todayStr = today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
    if (!form.doctorId) errs.doctorId = 'Select a doctor';
    if (!form.patientId) errs.patientId = 'Select a patient';
    if (!form.appointmentDate.trim()) errs.appointmentDate = 'Required';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.appointmentDate.trim())) errs.appointmentDate = 'Use YYYY-MM-DD';
    else if (form.appointmentDate.trim() < todayStr) errs.appointmentDate = 'Cannot book in the past';
    if (!form.startTime.trim()) errs.startTime = 'Required';
    else if (!/^\d{2}:\d{2}$/.test(form.startTime.trim())) errs.startTime = 'Use HH:MM';
    else if (!errs.appointmentDate && form.appointmentDate.trim() === todayStr) {
      const currentMin = today.getHours()*60 + today.getMinutes();
      const [sh, sm] = form.startTime.split(':').map(Number);
      if (sh*60+sm <= currentMin) errs.startTime = 'Time has already passed';
    }
    if (!form.endTime.trim()) errs.endTime = 'Required';
    else if (!/^\d{2}:\d{2}$/.test(form.endTime.trim())) errs.endTime = 'Use HH:MM';
    if (form.startTime && form.endTime && form.startTime >= form.endTime) errs.endTime = 'Must be after start';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBook = async () => {
    if (!validate()) { Alert.alert('Validation Error', 'Fix highlighted fields.'); return; }
    setSaving(true);
    try {
      await appointmentApi.create({
        doctorId: parseInt(form.doctorId,10), patientId: parseInt(form.patientId,10),
        appointmentDate: form.appointmentDate.trim(), startTime: form.startTime.trim()+':00',
        endTime: form.endTime.trim()+':00', reason: form.reason.trim()||null,
        notes: form.notes.trim()||null, status: form.status,
        isOnline: form.isOnline, meetingLink: form.meetingLink.trim()||null,
        consultationNotes: form.consultationNotes.trim()||null,
      });
      Alert.alert('Success', 'Appointment booked! It will reflect on the Calendar.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Booking Failed', err.message || 'Could not book appointment.');
      if (form.doctorId && form.appointmentDate.trim()) {
        (async () => {
          try {
            const data = await scheduleApi.get(form.doctorId, form.appointmentDate.trim(), 'daily');
            setSlots(data.days?.[0]?.slots || []);
          } catch (_) { setSlots([]); }
        })();
      }
    } finally { setSaving(false); }
  };

  const selectedDoc = doctors.find((d) => String(d.id) === form.doctorId);

  if (loadingData) {
    return (<View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>);
  }

  const freeSlots = slots.filter(s => !s.booked);
  const bookedSlots = slots.filter(s => s.booked);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Section: Doctor & Patient */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Doctor & Patient</Text>
          <Field label="Doctor" required error={errors.doctorId}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {doctors.map((d) => {
                const sel = String(d.id) === form.doctorId;
                return (<TouchableOpacity key={d.id} style={[styles.pickCard, sel && styles.pickCardActive]} onPress={() => setForm({ ...form, doctorId: String(d.id), startTime: '', endTime: '' })}><Text style={[styles.pickName, sel && styles.pickNameActive]}>Dr. {d.name}</Text><Text style={[styles.pickSub, sel && styles.pickSubActive]}>{d.specialization||'General'}</Text></TouchableOpacity>);
              })}
            </ScrollView>
          </Field>
          <Field label="Patient" required error={errors.patientId}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {patients.map((p) => {
                const sel = String(p.id) === form.patientId;
                return (<TouchableOpacity key={p.id} style={[styles.pickCard, sel && styles.pickCardActive]} onPress={() => setForm({ ...form, patientId: String(p.id) })}><Text style={[styles.pickName, sel && styles.pickNameActive]}>{p.name}</Text><Text style={[styles.pickSub, sel && styles.pickSubActive]}>{p.phone}</Text></TouchableOpacity>);
              })}
            </ScrollView>
          </Field>
        </View>

        {/* Section: Date & Time */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          <Field label="Date (YYYY-MM-DD)" required error={errors.appointmentDate}>
            <TextInput style={[styles.input, errors.appointmentDate && styles.inputError]} value={form.appointmentDate} onChangeText={(v) => setForm({ ...form, appointmentDate: v, startTime: '', endTime: '' })} placeholder="e.g. 2025-12-25" placeholderTextColor={colors.textMuted} />
          </Field>

          {/* Availability Panel */}
          {form.doctorId && form.appointmentDate ? (
            loadingSlots ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />
            ) : slots.length > 0 ? (
              <View style={styles.availPanel}>
                <Text style={styles.availTitle}>Available Slots — {freeSlots.length} free of {slots.length}</Text>
                <View style={styles.availGrid}>
                  {freeSlots.map((s, i) => {
                    const sel = form.startTime === s.startTime.slice(0,5);
                    return (
                      <TouchableOpacity key={i} style={[styles.availChip, sel && styles.availChipActive]} onPress={() => selectSlot(s)}>
                        <Text style={[styles.availTime, sel && styles.availTimeActive]}>{s.startTime.slice(0,5)}</Text>
                        <Text style={[styles.availSub, sel && { color: '#FFFFFFAA' }]}>Slot #{s.slotIndex || i+1}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {bookedSlots.length > 0 && (
                  <>
                    <Text style={[styles.availTitle, { marginTop: 10, color: colors.error }]}>Booked Slots — {bookedSlots.length}</Text>
                    <View style={styles.availGrid}>
                      {bookedSlots.map((s, i) => (
                        <View key={i} style={[styles.availChip, { backgroundColor: colors.errorLight, borderColor: '#FECACA' }]}>
                          <Text style={[styles.availTime, { color: colors.error }]}>{s.startTime.slice(0,5)}</Text>
                          <Text style={[styles.availSub, { color: colors.error }]}>Slot #{s.slotIndex || i+1}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.noAvail}><Text style={styles.noAvailText}>No availability for this date</Text></View>
            )
          ) : null}

          <View style={styles.timeRow}>
            <Field label="Start" style={{ flex:1, marginRight:6 }} required error={errors.startTime}>
              <TextInput style={[styles.input, errors.startTime && styles.inputError]} value={form.startTime} onChangeText={(v) => setForm({ ...form, startTime: v })} placeholder="HH:MM" placeholderTextColor={colors.textMuted} />
            </Field>
            <Field label="End" style={{ flex:1, marginLeft:6 }} required error={errors.endTime}>
              <TextInput style={[styles.input, errors.endTime && styles.inputError]} value={form.endTime} onChangeText={(v) => setForm({ ...form, endTime: v })} placeholder="HH:MM" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
        </View>

        {/* Section: Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Field label="Reason for Visit"><TextInput style={[styles.input, styles.multiline]} value={form.reason} onChangeText={(v) => setForm({...form, reason: v})} placeholder="e.g. Routine checkup" placeholderTextColor={colors.textMuted} multiline numberOfLines={2} /></Field>
          <Field label="Additional Notes"><TextInput style={[styles.input, styles.multiline]} value={form.notes} onChangeText={(v) => setForm({...form, notes: v})} placeholder="Any other info..." placeholderTextColor={colors.textMuted} multiline numberOfLines={2} /></Field>
          <Field label="Status"><View style={styles.pillRow}>{STATUS_OPTS.map((s) => { const a = form.status === s; return (<TouchableOpacity key={s} style={[styles.pill, a && styles.pillActive]} onPress={() => setForm({...form, status: s})}><Text style={[styles.pillText, a && styles.pillTextActive]}>{s}</Text></TouchableOpacity>); })}</View></Field>
        </View>

        {/* Section: Online Consultation */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Online Consultation</Text>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setForm({...form, isOnline: !form.isOnline, meetingLink: !form.isOnline ? '' : form.meetingLink})} activeOpacity={0.7}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Online Consultation</Text>
              <Text style={styles.toggleDesc}>For patients who are out of city/remote</Text>
            </View>
            <View style={[styles.toggleTrack, form.isOnline && styles.toggleTrackActive]}>
              <View style={[styles.toggleKnob, form.isOnline && styles.toggleKnobActive]} />
            </View>
          </TouchableOpacity>
          {form.isOnline && (
            <>
              <Field label="Video Meeting Link">
                <TextInput style={styles.input} value={form.meetingLink} onChangeText={(v) => setForm({...form, meetingLink: v})} placeholder="e.g. https://meet.google.com/xxx" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
              </Field>
              <Field label="Consultation Questions / Notes from Doctor">
                <TextInput style={[styles.input, styles.multiline]} value={form.consultationNotes} onChangeText={(v) => setForm({...form, consultationNotes: v})} placeholder="e.g. Please bring previous reports, list of current medications..." placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />
              </Field>
            </>
          )}
        </View>

        {selectedDoc?.googleCalendarEnabled && (
          <View style={styles.calNote}><Text style={styles.calIcon}>▣</Text><Text style={styles.calText}>Google Calendar event will be created</Text></View>
        )}

        <TouchableOpacity style={[styles.bookBtn, saving && { opacity: 0.6 }]} onPress={handleBook} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.bookBtnText}>Book Appointment</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, required, error, children, style }) {
  return (<View style={[{marginBottom:12}, style]}><Text style={styles.fLabel}>{label}{required ? <Text style={{color:colors.error}}> *</Text>:null}</Text>{children}{error && <Text style={styles.eText}>{error}</Text>}</View>);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg }, content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  fLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, fontWeight: '500' },
  multiline: { minHeight: 60, textAlignVertical: 'top', paddingVertical: 10 },
  inputError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  eText: { color: colors.error, fontSize: 11, marginTop: 2, fontWeight: '600' },
  timeRow: { flexDirection: 'row' },
  pickCard: { backgroundColor: colors.bg, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8, minWidth: 100 },
  pickCardActive: { backgroundColor: colors.primary+'12', borderColor: colors.primary },
  pickName: { fontSize: 13, fontWeight: '700', color: colors.text },
  pickNameActive: { color: colors.primary },
  pickSub: { fontSize: 11, fontWeight: '500', color: colors.textMuted, marginTop: 2 },
  pickSubActive: { color: colors.primaryLight },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingVertical: 10, alignItems: 'center' },
  pillActive: { backgroundColor: colors.primary+'12', borderColor: colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  pillTextActive: { color: colors.primary },
  availPanel: { backgroundColor: colors.bg, borderRadius: borderRadius.md, padding: 12, marginBottom: 12 },
  availTitle: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  availGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  availChip: { backgroundColor: colors.successLight, borderRadius: borderRadius.sm, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#BBF7D0', minWidth: '30%', alignItems: 'center' },
  availChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  availTime: { fontSize: 12, fontWeight: '700', color: colors.success },
  availTimeActive: { color: '#FFFFFF' },
  availSub: { fontSize: 9, fontWeight: '500', color: colors.success, marginTop: 1 },
  noAvail: { paddingVertical: 16, alignItems: 'center' },
  noAvailText: { fontSize: 13, color: colors.textMuted },
  calNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight, borderWidth: 1, borderColor: '#BBF7D0', borderRadius: borderRadius.md, padding: 12, marginBottom: 14 },
  calIcon: { fontSize: 18, color: colors.success, marginRight: 8, fontWeight: '700' },
  calText: { fontSize: 12, color: colors.success, fontWeight: '600', flex: 1 },
  bookBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', ...shadows.md },
  bookBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  toggleDesc: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  toggleTrack: { width: 46, height: 26, borderRadius: 13, backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 3 },
  toggleTrackActive: { backgroundColor: colors.primary },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', ...shadows.sm },
  toggleKnobActive: { alignSelf: 'flex-end' },
});
