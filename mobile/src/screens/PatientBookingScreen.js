import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doctorApi } from '../api/doctorApi';
import { appointmentApi } from '../api/appointmentApi';
import { scheduleApi } from '../api/scheduleApi';
import { colors, borderRadius, shadows, typography } from '../theme';
import { DatePickerModal } from '../components/DateTimePickerModal';
import { useEffect } from 'react';

const STEPS = ['Doctor', 'Date & Time', 'Confirm'];

export default function PatientBookingScreen({ route, navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [step, setStep] = useState(0);
  const [doctorId, setDoctorId] = useState(
    route?.params?.preselectedDoctorId ? String(route.params.preselectedDoctorId) : ''
  );
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    if (step === 1 && doctorId && appointmentDate) {
      fetchSlots();
    }
  }, [appointmentDate, doctorId, step]);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const d = await doctorApi.getActive();
        setDoctors(d);
        if (route?.params?.preselectedDoctorId) {
          setDoctorId(String(route.params.preselectedDoctorId));
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to load doctors.');
      } finally {
        setLoadingDoctors(false);
      }
    })();
  }, [route?.params?.preselectedDoctorId]));

  const fetchSlots = async () => {
    if (!doctorId || !appointmentDate.trim()) return;
    setLoadingSlots(true);
    try {
      const data = await scheduleApi.get(doctorId, appointmentDate.trim(), 'daily');
      setSlots(data.days?.[0]?.slots || []);
    } catch (e) {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const selectSlot = (slot) => {
    setStartTime(slot.startTime.slice(0, 5));
    setEndTime(slot.endTime.slice(0, 5));
  };

  const handleBookedSlotTap = (slot) => {
    Alert.alert(
      'Slot Unavailable',
      'This slot is already booked. Would you like to see available alternatives?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const data = await scheduleApi.suggestSlot(
                doctorId,
                appointmentDate.trim(),
                slot.startTime,
                slot.endTime
              );
              const sug = data.suggestions || [];
              if (sug.length === 0) {
                Alert.alert('No Alternatives', 'No nearby slots available on this date.');
                return;
              }
              const msgs = sug.slice(0, 5).map((s) => {
                const d = s.date ? ` (${s.date})` : '';
                return `${s.startTime.slice(0, 5)}-${s.endTime.slice(0, 5)}${d}`;
              });
              Alert.alert(
                'Suggested Alternatives',
                msgs.join('\n'),
                [{ text: 'OK' }]
              );
            } catch (e) {
              Alert.alert('Error', 'Could not fetch alternatives.');
            }
          },
        },
      ]
    );
  };

  const validateStep = () => {
    if (step === 0 && !doctorId) {
      Alert.alert('Required', 'Please select a doctor.');
      return false;
    }
    if (step === 1) {
      if (!appointmentDate.trim()) {
        Alert.alert('Required', 'Please enter a date.');
        return false;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate.trim())) {
        Alert.alert('Invalid', 'Use YYYY-MM-DD format.');
        return false;
      }
      const today = new Date();
      const todayStr = today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
      if (appointmentDate.trim() < todayStr) {
        Alert.alert('Invalid Date', 'Cannot book an appointment in the past.');
        return false;
      }
      if (appointmentDate.trim() === todayStr && startTime) {
        const currentMin = today.getHours()*60 + today.getMinutes();
        const [sh, sm] = startTime.split(':').map(Number);
        if (sh*60+sm <= currentMin) {
          Alert.alert('Invalid Time', 'Selected time has already passed. Choose a later time.');
          return false;
        }
      }
      if (!startTime || !endTime) {
        Alert.alert('Required', 'Please select a time slot.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step === 0) {
      setStep(1);
      fetchSlots();
    } else if (step === 1) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await appointmentApi.patientBook(
        parseInt(doctorId, 10),
        appointmentDate.trim(),
        startTime + ':00',
        endTime + ':00',
        reason.trim() || null,
        isEmergency ? 'EMERGENCY' : 'IN_PERSON'
      );
      const doc = doctors.find(d => String(d.id) === doctorId);
      const docName = doc ? `Dr. ${doc.name}` : 'the doctor';
      Alert.alert(
        '✅ Appointment Booked!',
        `━━━━━━━━━━━━━━━━━━━━━━\n  APPOINTMENT CONFIRMED\n━━━━━━━━━━━━━━━━━━━━━━\n\n  🩺 Doctor: ${docName}\n  📅 Date: ${appointmentDate}\n  ⏰ Time: ${startTime} - ${endTime}\n  📌 Status: ${isEmergency ? '🚨 Emergency' : 'Scheduled'}\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n  Your appointment has been booked successfully.\n  You will receive a reminder before the visit.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Booking Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingDoctors) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const freeSlots = slots.filter((s) => !s.booked);
  const bookedSlots = slots.filter((s) => s.booked);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Step indicator */}
      <View style={styles.stepBar}>
        {STEPS.map((label, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[styles.stepCircle, i === step && styles.stepCircleActive, i < step && styles.stepCircleDone]}>
              <Text style={[styles.stepNum, (i === step || i < step) && styles.stepNumActive]}>
                {i < step ? '✓' : i + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {step === 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Doctor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {doctors.map((d) => {
                const sel = String(d.id) === doctorId;
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.docCard, sel && styles.docCardActive]}
                    onPress={() => setDoctorId(String(d.id))}
                  >
                    <Text style={[styles.docName, sel && styles.docNameActive]}>Dr. {d.name}</Text>
                    <Text style={[styles.docSub, sel && styles.docSubActive]}>{d.specialization || 'General'}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select Date & Time</Text>
            <Text style={styles.fLabel}>Date (YYYY-MM-DD)</Text>
            <TouchableOpacity 
              style={[styles.input, { justifyContent: 'center', height: 42 }]} 
              onPress={() => setDatePickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: appointmentDate ? colors.text : colors.textMuted, fontSize: 14, fontWeight: '500' }}>
                {appointmentDate || 'Select Appointment Date'}
              </Text>
            </TouchableOpacity>

            {doctorId && appointmentDate ? (
              loadingSlots ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
              ) : slots.length > 0 ? (
                <View style={styles.availPanel}>
                  <Text style={styles.availTitle}>Available — {freeSlots.length}</Text>
                  <View style={styles.availGrid}>
                    {freeSlots.map((s, i) => {
                      const sel = startTime === s.startTime.slice(0, 5);
                      return (
                        <TouchableOpacity
                          key={i}
                          style={[styles.availChip, sel && styles.availChipActive]}
                          onPress={() => selectSlot(s)}
                        >
                          <Text style={[styles.availTime, sel && styles.availTimeActive]}>{s.startTime.slice(0, 5)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {bookedSlots.length > 0 && (
                    <>
                      <Text style={[styles.availTitle, { marginTop: 10, color: colors.error }]}>Booked — {bookedSlots.length}</Text>
                      <View style={styles.availGrid}>
                        {bookedSlots.map((s, i) => (
                          <TouchableOpacity
                            key={i}
                            style={styles.bookedChip}
                            onPress={() => handleBookedSlotTap(s)}
                          >
                            <Text style={styles.bookedTime}>{s.startTime.slice(0, 5)}</Text>
                            <Text style={styles.bookedLabel}>Booked</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.noAvail}>
                  <Text style={styles.noAvailText}>No availability for this date</Text>
                </View>
              )
            ) : null}

            {startTime && endTime && (
              <View style={styles.selectedSlot}>
                <Text style={styles.selectedSlotLabel}>Selected Slot</Text>
                <Text style={styles.selectedSlotTime}>{startTime} - {endTime}</Text>
              </View>
            )}

            <Text style={[styles.fLabel, { marginTop: 12 }]}>Reason for Visit (optional)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Routine checkup"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
            />

            <View style={styles.stepNav}>
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Confirm Booking</Text>

            <TouchableOpacity
              style={[styles.emergencyToggle, isEmergency && styles.emergencyToggleActive]}
              onPress={() => setIsEmergency(!isEmergency)}
              activeOpacity={0.7}
            >
              <Text style={[styles.emergencyToggleText, isEmergency && styles.emergencyToggleTextActive]}>
                {isEmergency ? '🚨 Emergency Appointment' : 'Mark as Emergency?'}
              </Text>
            </TouchableOpacity>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Doctor</Text>
              <Text style={styles.confirmValue}>Dr. {doctors.find((d) => String(d.id) === doctorId)?.name}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Date</Text>
              <Text style={styles.confirmValue}>{appointmentDate}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Time</Text>
              <Text style={styles.confirmValue}>{startTime} - {endTime}</Text>
            </View>
            {reason ? (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Reason</Text>
                <Text style={styles.confirmValue}>{reason}</Text>
              </View>
            ) : null}

            <View style={styles.stepNav}>
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
                onPress={handleConfirm}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(date) => {
          setAppointmentDate(date);
          setStartTime('');
          setEndTime('');
        }}
        value={appointmentDate}
        minDate={new Date().toISOString().split('T')[0]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  stepBar: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  stepItem: { alignItems: 'center', marginHorizontal: 16 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  stepCircleActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  stepCircleDone: { borderColor: colors.success, backgroundColor: colors.success },
  stepNum: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  stepNumActive: { color: '#FFFFFF' },
  stepLabel: { fontSize: 9, fontWeight: '600', color: colors.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  stepLabelActive: { color: colors.primary },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  fLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, fontWeight: '500' },
  multiline: { minHeight: 60, textAlignVertical: 'top', paddingVertical: 10 },
  docCard: { backgroundColor: colors.bg, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, marginRight: 8, minWidth: 120, alignItems: 'center' },
  docCardActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  docName: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' },
  docNameActive: { color: colors.primary },
  docSub: { fontSize: 11, fontWeight: '500', color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  docSubActive: { color: colors.primaryLight },
  availPanel: { backgroundColor: colors.bg, borderRadius: borderRadius.md, padding: 12, marginTop: 12 },
  availTitle: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  availGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  availChip: { backgroundColor: colors.successLight, borderRadius: borderRadius.sm, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#BBF7D0', minWidth: '28%', alignItems: 'center' },
  availChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  availTime: { fontSize: 13, fontWeight: '700', color: colors.success },
  availTimeActive: { color: '#FFFFFF' },
  bookedChip: { backgroundColor: colors.errorLight, borderRadius: borderRadius.sm, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#FECACA', minWidth: '28%', alignItems: 'center' },
  bookedTime: { fontSize: 13, fontWeight: '700', color: colors.error },
  bookedLabel: { fontSize: 9, fontWeight: '600', color: colors.error, marginTop: 1 },
  noAvail: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  noAvailText: { fontSize: 13, color: colors.textMuted },
  selectedSlot: { backgroundColor: colors.primary + '10', borderRadius: borderRadius.sm, padding: 12, marginTop: 12, borderWidth: 1, borderColor: colors.primary + '30', alignItems: 'center' },
  selectedSlotLabel: { fontSize: 10, fontWeight: '600', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  selectedSlotTime: { fontSize: 16, fontWeight: '800', color: colors.primary, marginTop: 2 },
  stepNav: { flexDirection: 'row', gap: 10, marginTop: 20 },
  backBtn: { flex: 1, backgroundColor: colors.bg, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  backBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  nextBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center' },
  nextBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  confirmBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center' },
  confirmBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  emergencyToggle: {
    backgroundColor: colors.warning + '15', borderRadius: borderRadius.md, paddingVertical: 12, paddingHorizontal: 16,
    marginBottom: 14, borderWidth: 1.5, borderColor: colors.warning + '40', alignItems: 'center',
  },
  emergencyToggleActive: { backgroundColor: colors.error + '15', borderColor: colors.error },
  emergencyToggleText: { fontSize: 13, fontWeight: '700', color: colors.warning },
  emergencyToggleTextActive: { color: colors.error },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  confirmLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  confirmValue: { fontSize: 13, color: colors.text, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
});
