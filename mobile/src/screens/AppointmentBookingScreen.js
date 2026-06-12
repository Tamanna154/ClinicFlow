import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doctorApi } from '../api/doctorApi';
import { patientApi } from '../api/patientApi';
import { appointmentApi } from '../api/appointmentApi';
import { scheduleApi } from '../api/scheduleApi';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows, typography } from '../theme';
import { DatePickerModal, TimePickerModal } from '../components/DateTimePickerModal';

export default function AppointmentBookingScreen({ route, navigation }) {
  const { user } = useAuth();
  const preDocId = route.params?.doctorId || user?.doctorId;
  const prefillDate = route.params?.prefillDate;
  const prefillStart = route.params?.prefillStart;
  const prefillEnd = route.params?.prefillEnd;

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [form, setForm] = useState({
    doctorId: preDocId ? String(preDocId) : (user?.doctorId ? String(user.doctorId) : ''),
    patientId: '', patientName: '',
    appointmentDate: prefillDate || '',
    startTime: prefillStart || '',
    endTime: prefillEnd || '',
    reason: '', status: 'SCHEDULED',
    appointmentType: 'IN_PERSON',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [startTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [endTimePickerVisible, setEndTimePickerVisible] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const [d, p] = await Promise.all([
          doctorApi.getActive(),
          patientApi.getAll().catch(() => [])
        ]);
        setDoctors(d);
        setPatients(Array.isArray(p) ? p : []);
      } catch (e) {
        Alert.alert('Connection Error', 'Could not load doctors or patients. Check server connection.');
      } finally {
        setLoadingData(false);
      }
    })();
  }, []));

  useFocusEffect(useCallback(() => {
    if (!form.doctorId || !form.appointmentDate.trim()) return;
    setLoadingSlots(true);
    (async () => {
      try {
        const data = await scheduleApi.get(form.doctorId, form.appointmentDate.trim(), 'daily');
        setSlots(data.days?.[0]?.slots || []);
      } catch (e) {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, [form.doctorId, form.appointmentDate]));

  const handlePatientSearch = (text) => {
    setPatientSearch(text);
    setShowPatientDropdown(true);
    if (!text.trim()) {
      setFilteredPatients([]);
      return;
    }
    const q = text.toLowerCase();
    const matches = patients.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q)
    );
    setFilteredPatients(matches.slice(0, 15));
  };

  const selectPatient = (p) => {
    setForm({ ...form, patientId: String(p.id), patientName: p.name });
    setPatientSearch(p.name);
    setShowPatientDropdown(false);
  };

  const calcEndTime = (start) => {
    if (!start || !/^\d{2}:\d{2}$/.test(start)) return '';
    const [h, m] = start.split(':').map(Number);
    const totalMin = h * 60 + m + 30;
    const endH = Math.floor(totalMin / 60);
    const endM = totalMin % 60;
    return String(endH).padStart(2, '0') + ':' + String(endM).padStart(2, '0');
  };

  const handleStartTimeSelect = (time) => {
    setForm({ ...form, startTime: time, endTime: calcEndTime(time) });
  };

  const selectSlot = (slot) => {
    const start = slot.startTime.slice(0, 5);
    setForm({ ...form, startTime: start, endTime: calcEndTime(start) });
  };

  const validate = () => {
    const errs = {};
    if (!form.doctorId) errs.doctorId = 'Select a doctor';
    if (!form.patientId) errs.patientId = 'Select a patient';
    if (!form.appointmentDate.trim()) errs.appointmentDate = 'Select a date';
    if (!form.startTime.trim()) errs.startTime = 'Select start time';
    if (!form.endTime.trim()) errs.endTime = 'Select end time';
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      errs.endTime = 'End must be after start';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBook = async () => {
    if (!validate()) {
      Alert.alert('Missing Information', 'Please fill in all required fields highlighted below.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        doctorId: parseInt(form.doctorId, 10),
        patientId: parseInt(form.patientId, 10),
        appointmentDate: form.appointmentDate.trim(),
        startTime: form.startTime.trim() + ':00',
        endTime: form.endTime.trim() + ':00',
        reason: form.reason.trim() || null,
        notes: null,
        status: form.status,
        isOnline: false,
        meetingLink: null,
        consultationNotes: null,
        appointmentType: 'IN_PERSON',
      };
      await appointmentApi.create(payload);
      Alert.alert(
        '✅ Appointment Booked',
        `Appointment created successfully for ${form.patientName}.\n\nDate: ${form.appointmentDate}\nTime: ${form.startTime} - ${form.endTime}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert(
        'Booking Failed',
        err.message || 'Could not book appointment. Please try again.\n\nCheck that the server is running and all fields are correct.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, fontSize: 14, color: colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  const freeSlots = slots.filter(s => !s.booked);
  const selectedDoc = doctors.find(d => String(d.id) === form.doctorId);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Quick Book Header */}
        <View style={styles.quickInfo}>
          <Text style={styles.quickInfoTitle}>📋 New Appointment</Text>
          <Text style={styles.quickInfoSub}>Fill in the details to book an appointment</Text>
        </View>

        {/* Step 1: Patient */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Patient Information</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Search Patient <Text style={{ color: colors.error }}>*</Text></Text>
            <View style={[styles.searchInputWrap, errors.patientId && styles.inputError]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Type patient name or phone..."
                placeholderTextColor={colors.textMuted}
                value={patientSearch}
                onChangeText={handlePatientSearch}
                onFocus={() => patientSearch.trim() && setShowPatientDropdown(true)}
              />
              {form.patientId ? (
                <TouchableOpacity onPress={() => { setForm({...form, patientId: '', patientName: ''}); setPatientSearch(''); setShowPatientDropdown(false); }}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {showPatientDropdown && filteredPatients.length > 0 && (
              <View style={styles.dropdown}>
                {filteredPatients.map((p) => (
                  <TouchableOpacity key={p.id} style={styles.dropdownItem} onPress={() => selectPatient(p)} activeOpacity={0.7}>
                    <View style={styles.dropdownAvatar}>
                      <Text style={styles.dropdownAvatarText}>{(p.name || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dropdownName}>{p.name}</Text>
                      <Text style={styles.dropdownPhone}>📞 {p.phone || 'No phone'}</Text>
                    </View>
                    <Text style={styles.dropdownSelect}>Select ›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {filteredPatients.length === 0 && patientSearch.trim() && !showPatientDropdown === false && (
              <View style={styles.noPatientMsg}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>No matching patients found.</Text>
              </View>
            )}
            {errors.patientId && <Text style={styles.errorText}>{errors.patientId}</Text>}
          </View>
        </View>

        {/* Step 2: Doctor */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Doctor</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Select Doctor <Text style={{ color: colors.error }}>*</Text></Text>
            <View style={styles.doctorRow}>
              {doctors.slice(0, 5).map((d) => {
                const sel = String(d.id) === form.doctorId;
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.docChip, sel && styles.docChipActive]}
                    onPress={() => setForm({ ...form, doctorId: String(d.id), startTime: '', endTime: '' })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.docChipName, sel && styles.docChipNameActive]}>Dr. {d.name}</Text>
                    <Text style={[styles.docChipSpec, sel && { color: '#FFFFFFAA' }]}>{d.specialization || 'General'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.doctorId && <Text style={styles.errorText}>{errors.doctorId}</Text>}
          </View>
        </View>

        {/* Step 3: Date & Time */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Date & Time</Text>

          <TouchableOpacity
            style={[styles.dateBtn, errors.appointmentDate && styles.inputError]}
            onPress={() => setDatePickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateBtnIcon}>📅</Text>
            <Text style={{ color: form.appointmentDate ? colors.text : colors.textMuted, fontSize: 14, fontWeight: '500' }}>
              {form.appointmentDate || 'Select Date'}
            </Text>
          </TouchableOpacity>
          {errors.appointmentDate && <Text style={styles.errorText}>{errors.appointmentDate}</Text>}

          {/* Slots */}
          {form.doctorId && form.appointmentDate ? (
            loadingSlots ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
            ) : slots.length > 0 ? (
              <View style={styles.slotsSection}>
                <Text style={styles.slotsTitle}>
                  🟢 {freeSlots.length} slots available
                </Text>
                <View style={styles.slotsGrid}>
                  {freeSlots.map((s, i) => {
                    const sel = form.startTime === s.startTime.slice(0, 5);
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[styles.slotChip, sel && styles.slotChipActive]}
                        onPress={() => selectSlot(s)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.slotTime, sel && styles.slotTimeActive]}>
                          {s.startTime.slice(0, 5)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              ) : (
                <View style={styles.noSlotsMsg}>
                  <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center' }}>
                    No slots found — you can enter time manually below
                  </Text>
                </View>
              )
          ) : null}

          <View style={styles.timeRow}>
            <TouchableOpacity
              style={[styles.timeBtn, errors.startTime && styles.inputError]}
              onPress={() => setStartTimePickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.timeLabel}>Start</Text>
              <Text style={styles.timeValue}>{form.startTime || '--:--'}</Text>
            </TouchableOpacity>
            <Text style={styles.timeSeparator}>→</Text>
            <TouchableOpacity
              style={[styles.timeBtn, errors.endTime && styles.inputError]}
              onPress={() => setEndTimePickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.timeLabel}>End</Text>
              <Text style={styles.timeValue}>{form.endTime || '--:--'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 4: Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>4. Details (Optional)</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Reason for Visit</Text>
            <TextInput
              style={styles.textArea}
              value={form.reason}
              onChangeText={(v) => setForm({ ...form, reason: v })}
              placeholder="e.g. Routine checkup, fever, follow-up..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
            />
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusChips}>
              {['SCHEDULED', 'CONFIRMED'].map((s) => {
                const active = form.status === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusChip, active && styles.statusChipActive]}
                    onPress={() => setForm({ ...form, status: s })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {selectedDoc?.googleCalendarEnabled && (
          <View style={styles.calNote}>
            <Text style={styles.calIcon}>▣</Text>
            <Text style={styles.calText}>Google Calendar event will be created for this appointment</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.bookBtn, saving && { opacity: 0.6 }]}
          onPress={handleBook}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.bookBtnText}>✅ Book Appointment</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerNote}>All appointments will appear on the calendar and patient dashboard</Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(date) => setForm({ ...form, appointmentDate: date, startTime: '', endTime: '' })}
        value={form.appointmentDate}
        minDate={new Date().toISOString().split('T')[0]}
      />
      <TimePickerModal
        visible={startTimePickerVisible}
        onClose={() => setStartTimePickerVisible(false)}
        onSelect={handleStartTimeSelect}
        value={form.startTime}
      />
      <TimePickerModal
        visible={endTimePickerVisible}
        onClose={() => setEndTimePickerVisible(false)}
        onSelect={(time) => setForm({ ...form, endTime: time })}
        value={form.endTime}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  quickInfo: { marginBottom: 16 },
  quickInfoTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  quickInfoSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  fieldGroup: { marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  inputError: { borderColor: colors.error, borderWidth: 1.5 },
  errorText: { color: colors.error, fontSize: 11, fontWeight: '600', marginTop: 4 },
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg,
    borderRadius: 12, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500', paddingVertical: 0 },
  clearIcon: { fontSize: 14, color: colors.textMuted, padding: 4, fontWeight: '600' },
  dropdown: {
    backgroundColor: colors.surface, borderRadius: 12, marginTop: 4,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.md,
    maxHeight: 300, overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  dropdownAvatar: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  dropdownAvatarText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  dropdownName: { fontSize: 14, fontWeight: '700', color: colors.text },
  dropdownPhone: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  dropdownSelect: { fontSize: 12, fontWeight: '600', color: colors.primary },
  doctorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  docChip: {
    backgroundColor: colors.bg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border, minWidth: '30%', alignItems: 'center',
  },
  docChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  docChipName: { fontSize: 12, fontWeight: '700', color: colors.text },
  docChipNameActive: { color: '#FFFFFF' },
  docChipSpec: { fontSize: 9, fontWeight: '500', color: colors.textMuted, marginTop: 1 },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg,
    borderRadius: 12, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: colors.border,
  },
  dateBtnIcon: { fontSize: 16, marginRight: 8 },
  slotsSection: { marginTop: 12, backgroundColor: colors.bg, borderRadius: 12, padding: 12 },
  slotsTitle: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  slotChip: {
    backgroundColor: colors.successLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#BBF7D0', minWidth: '22%', alignItems: 'center',
  },
  slotChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotTime: { fontSize: 12, fontWeight: '700', color: colors.success },
  slotTimeActive: { color: '#FFFFFF' },
  noSlotsMsg: { paddingVertical: 16, alignItems: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  timeBtn: {
    flex: 1, backgroundColor: colors.bg, borderRadius: 10, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  timeLabel: { fontSize: 9, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeValue: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 2 },
  timeSeparator: { fontSize: 16, color: colors.textMuted, marginHorizontal: 8, fontWeight: '300' },
  textArea: { backgroundColor: colors.bg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text, fontWeight: '500', minHeight: 50, textAlignVertical: 'top' },
  statusRow: { marginTop: 12 },
  statusChips: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statusChip: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  statusChipActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  statusChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  statusChipTextActive: { color: colors.primary, fontWeight: '700' },
  calNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight, borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 12, padding: 12, marginBottom: 14 },
  calIcon: { fontSize: 16, color: colors.success, marginRight: 8, fontWeight: '700' },
  calText: { fontSize: 11, color: colors.success, fontWeight: '600', flex: 1 },
  bookBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', ...shadows.md },
  bookBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footerNote: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
  noPatientMsg: { paddingVertical: 8, alignItems: 'center' },
});
