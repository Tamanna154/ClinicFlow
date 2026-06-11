import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  Platform, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { consultationApi } from '../api/consultationApi';
import { appointmentApi } from '../api/appointmentApi';
import { colors, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { sharePrescription, downloadPrescription } from '../utils/pdfHelper';
import { letterheadApi } from '../api/letterheadApi';
import { prescriptionApi } from '../api/prescriptionApi';
import { DatePickerModal } from '../components/DateTimePickerModal';

export default function ConsultationScreen({ route, navigation }) {
  const { appointment } = route.params;
  const { user } = useAuth();
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [started, setStarted] = useState(false);

  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [pulseRate, setPulseRate] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [temperature, setTemperature] = useState('');
  const [oxygenLevel, setOxygenLevel] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [existingPrescription, setExistingPrescription] = useState(null);
  const { formatCurrency } = useSettings();
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  useFocusEffect(useCallback(() => {
    loadConsultation();
  }, []));

  const loadConsultation = async () => {
    try {
      const existing = await consultationApi.getByAppointment(appointment.id);
      setConsultation(existing);
      setSymptoms(existing.symptoms || '');
      setDiagnosis(existing.diagnosis || '');
      setDoctorNotes(existing.doctorNotes || '');
      setBloodPressure(existing.bloodPressure || '');
      setPulseRate(existing.pulseRate != null ? String(existing.pulseRate) : '');
      setWeight(existing.weight != null ? String(existing.weight) : '');
      setHeight(existing.height != null ? String(existing.height) : '');
      setTemperature(existing.temperature != null ? String(existing.temperature) : '');
      setOxygenLevel(existing.oxygenLevel != null ? String(existing.oxygenLevel) : '');
      setBloodSugar(existing.bloodSugar || '');
      setFollowUpDate(existing.followUpDate || '');
      setStarted(existing.status === 'IN_PROGRESS' || existing.status === 'COMPLETED');
      try {
        const rx = await prescriptionApi.getByConsultation(existing.id);
        setExistingPrescription(rx);
      } catch (e) {
        setExistingPrescription(null);
      }
    } catch (e) {
      setStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async () => {
    setLoading(true);
    try {
      const result = await consultationApi.startConsultation(appointment.id);
      setConsultation(result);
      setStarted(true);
      await appointmentApi.updateStatus(appointment.id, 'IN_PROGRESS');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!consultation && !started) return;
    setSaving(true);
    try {
      const id = consultation ? consultation.id : (await consultationApi.startConsultation(appointment.id)).id;
      await consultationApi.updateConsultation(id, {
        symptoms: symptoms.trim() || null,
        diagnosis: diagnosis.trim() || null,
        doctorNotes: doctorNotes.trim() || null,
        bloodPressure: bloodPressure.trim() || null,
        pulseRate: pulseRate ? parseInt(pulseRate) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        oxygenLevel: oxygenLevel ? parseFloat(oxygenLevel) : null,
        bloodSugar: bloodSugar.trim() || null,
        followUpDate: followUpDate.trim() || null,
      });
      const updated = await consultationApi.getByAppointment(appointment.id);
      setConsultation(updated);
      Alert.alert('Saved', 'Consultation notes saved');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!consultation && !started) return;
    Alert.alert('Complete Consultation', 'Mark this consultation as complete?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          setSaving(true);
          try {
            const id = consultation ? consultation.id : (await consultationApi.startConsultation(appointment.id)).id;
            await consultationApi.updateConsultation(id, {
              symptoms: symptoms.trim() || null,
              diagnosis: diagnosis.trim() || null,
              doctorNotes: doctorNotes.trim() || null,
              bloodPressure: bloodPressure.trim() || null,
              pulseRate: pulseRate ? parseInt(pulseRate) : null,
              weight: weight ? parseFloat(weight) : null,
              height: height ? parseFloat(height) : null,
              temperature: temperature ? parseFloat(temperature) : null,
              oxygenLevel: oxygenLevel ? parseFloat(oxygenLevel) : null,
              bloodSugar: bloodSugar.trim() || null,
              followUpDate: followUpDate.trim() || null,
            });
            await consultationApi.completeConsultation(id);
            Alert.alert('Completed', 'Consultation completed. Generate bill?', [
              { text: 'Later', onPress: () => navigation.goBack() },
              { text: 'Generate Bill', onPress: () => navigation.replace('ConsultationBilling', { consultationId: id, appointment, patientName: appointment.patientName }) },
            ]);
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.patientName}>{appointment.patientName}</Text>
        <Text style={styles.apptInfo}>{appointment.appointmentDate} | {appointment.startTime} - {appointment.endTime}</Text>
        <View style={[styles.typeBadge, { backgroundColor: appointment.isOnline ? colors.infoLight : colors.successLight }]}>
          <Text style={[styles.typeText, { color: appointment.isOnline ? colors.info : colors.success }]}>
            {appointment.isOnline ? 'Online' : 'In-Person'}
          </Text>
        </View>
      </View>

      {!started ? (
        <TouchableOpacity style={styles.startBtn} onPress={handleStartConsultation} activeOpacity={0.8}>
          <Text style={styles.startBtnText}>Start Consultation</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Symptoms</Text>
            <TextInput style={styles.input} value={symptoms} onChangeText={setSymptoms} placeholder="e.g. Fever, Headache, Cough" placeholderTextColor={colors.textMuted} multiline />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnosis</Text>
            <TextInput style={styles.input} value={diagnosis} onChangeText={setDiagnosis} placeholder="e.g. Viral Fever, Migraine" placeholderTextColor={colors.textMuted} multiline />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Doctor Notes / Prescription</Text>
            <TextInput style={[styles.input, { minHeight: 80 }]} value={doctorNotes} onChangeText={setDoctorNotes} placeholder="Notes, prescription, advice..." placeholderTextColor={colors.textMuted} multiline />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vitals</Text>
            <View style={styles.vitalsGrid}>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>BP (mmHg)</Text>
                <TextInput style={styles.vitalInput} value={bloodPressure} onChangeText={setBloodPressure} placeholder="120/80" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Pulse (bpm)</Text>
                <TextInput style={styles.vitalInput} value={pulseRate} onChangeText={setPulseRate} placeholder="72" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Weight (kg)</Text>
                <TextInput style={styles.vitalInput} value={weight} onChangeText={setWeight} placeholder="70" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Height (cm)</Text>
                <TextInput style={styles.vitalInput} value={height} onChangeText={setHeight} placeholder="170" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Temp (°F)</Text>
                <TextInput style={styles.vitalInput} value={temperature} onChangeText={setTemperature} placeholder="98.6" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>SpO2 (%)</Text>
                <TextInput style={styles.vitalInput} value={oxygenLevel} onChangeText={setOxygenLevel} placeholder="98" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Sugar (mg/dL)</Text>
                <TextInput style={styles.vitalInput} value={bloodSugar} onChangeText={setBloodSugar} placeholder="e.g. 110" placeholderTextColor={colors.textMuted} />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Follow-Up</Text>
            <TouchableOpacity 
              style={[styles.input, { justifyContent: 'center', minHeight: 45 }]} 
              onPress={() => setDatePickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: followUpDate ? colors.text : colors.textMuted, fontSize: 14, fontWeight: '500' }}>
                {followUpDate || 'Select Follow-up Date'}
              </Text>
            </TouchableOpacity>
            <View style={styles.followUpBtns}>
              {['3d', '7d', '15d', '30d'].map(opt => (
                <TouchableOpacity key={opt} style={styles.followUpBtn} onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + parseInt(opt));
                  setFollowUpDate(d.toISOString().split('T')[0]);
                }} activeOpacity={0.7}>
                  <Text style={styles.followUpBtnText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
              {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} disabled={saving} activeOpacity={0.8}>
              <Text style={styles.completeBtnText}>Complete Consultation</Text>
            </TouchableOpacity>
          </View>
          {consultation?.id && (
            <TouchableOpacity style={styles.rxPrescriptionBtn} onPress={() => navigation.navigate('Prescription', {
              consultationId: consultation.id,
              patientId: appointment.patientId || consultation.patientId,
              existingData: existingPrescription || null,
            })} activeOpacity={0.7}>
              <Text style={styles.rxPrescriptionIcon}>💊</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rxPrescriptionLabel}>Structured Prescription</Text>
                <Text style={styles.rxPrescriptionSub}>
                  {existingPrescription ? `${existingPrescription.medicines?.length || 0} medicines • ${existingPrescription.prescriptionNumber}` : 'Search & add medicines from inventory'}
                </Text>
              </View>
              <Text style={styles.rxPrescriptionArrow}>→</Text>
            </TouchableOpacity>
          )}
          <View style={styles.rxActionRow}>
            <TouchableOpacity
              style={styles.rxActionBtn}
              onPress={async () => {
                try {
                  const data = { doctorNotes, diagnosis, symptoms, bloodPressure, bloodSugar, pulseRate: pulseRate ? parseInt(pulseRate) : null, weight: weight ? parseFloat(weight) : null, temperature: temperature ? parseFloat(temperature) : null, oxygenLevel: oxygenLevel ? parseFloat(oxygenLevel) : null, followUpDate, createdAt: consultation?.createdAt || new Date().toISOString(), medicines: existingPrescription?.medicines || [], doctorName: appointment.doctorName || user?.name || 'Doctor' };
                  let lh = null;
                  try { lh = await letterheadApi.get(user?.doctorId); } catch (ex) {}
                  await sharePrescription(data, appointment.patientName, lh);
                } catch (e) { Alert.alert('Error', e.message); }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.rxActionIcon}>↗</Text>
              <Text style={styles.rxActionLabel}>Share Rx</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rxActionBtn}
              onPress={async () => {
                try {
                  const data = { doctorNotes, diagnosis, symptoms, bloodPressure, bloodSugar, pulseRate: pulseRate ? parseInt(pulseRate) : null, weight: weight ? parseFloat(weight) : null, temperature: temperature ? parseFloat(temperature) : null, oxygenLevel: oxygenLevel ? parseFloat(oxygenLevel) : null, followUpDate, createdAt: consultation?.createdAt || new Date().toISOString(), medicines: existingPrescription?.medicines || [], doctorName: appointment.doctorName || user?.name || 'Doctor' };
                  let lh = null;
                  try { lh = await letterheadApi.get(user?.doctorId); } catch (ex) {}
                  await downloadPrescription(data, appointment.patientName, lh);
                  Alert.alert('Downloaded', 'Prescription PDF saved.');
                } catch (e) { Alert.alert('Error', e.message); }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.rxActionIcon}>↓</Text>
              <Text style={styles.rxActionLabel}>Download Rx</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(date) => setFollowUpDate(date)}
        value={followUpDate}
        minDate={new Date().toISOString().split('T')[0]}
      />
    </ScrollView>
  );
}

const STATUSBAR_H = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 36);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.md },
  patientName: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  apptInfo: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  typeText: { fontSize: 12, fontWeight: '700' },
  startBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', marginBottom: 16, ...shadows.md },
  startBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  section: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  input: { backgroundColor: colors.bg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 14, color: colors.text, fontWeight: '500', minHeight: 44, textAlignVertical: 'top' },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vitalItem: { width: '30%' },
  vitalLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, marginBottom: 4, marginLeft: 2 },
  vitalInput: { backgroundColor: colors.bg, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: colors.text, fontWeight: '600', textAlign: 'center' },
  followUpBtns: { flexDirection: 'row', gap: 8, marginTop: 8 },
  followUpBtn: { backgroundColor: colors.primary + '10', borderRadius: borderRadius.sm, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.primary + '20' },
  followUpBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  saveBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', ...shadows.sm },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  completeBtn: { flex: 1, backgroundColor: colors.success, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', ...shadows.sm },
  completeBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  rxActionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  rxActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border, gap: 6, ...shadows.sm,
  },
  rxActionIcon: { fontSize: 16, fontWeight: '700', color: colors.primary },
  rxActionLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  rxPrescriptionBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.md, padding: 14, marginTop: 10,
    borderWidth: 1.5, borderColor: colors.primary + '25', gap: 10,
  },
  rxPrescriptionIcon: { fontSize: 22 },
  rxPrescriptionLabel: { fontSize: 14, fontWeight: '700', color: colors.primary },
  rxPrescriptionSub: { fontSize: 11, fontWeight: '500', color: colors.textSecondary, marginTop: 1 },
  rxPrescriptionArrow: { fontSize: 18, color: colors.primary, fontWeight: '700' },
});
