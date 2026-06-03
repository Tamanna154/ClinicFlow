import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { doctorApi } from '../api/doctorApi';
import { clinicApi } from '../api/clinicApi';
import { compensationApi } from '../api/compensationApi';
import { colors, borderRadius, shadows, typography } from '../theme';

export default function DoctorFormScreen({ route, navigation }) {
  const existing = route.params?.doctor;
  const isEdit = !!existing;

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    email: existing?.email ?? '',
    phone: existing?.phone ?? '',
    address: existing?.address ?? '',
    specialization: existing?.specialization ?? '',
    qualifications: existing?.qualifications ?? '',
    bio: existing?.bio ?? '',
    consultationFee: existing?.consultationFee != null ? String(existing.consultationFee) : '',
    isActive: existing?.isActive !== false,
    googleCalendarEnabled: existing?.googleCalendarEnabled ?? false,
    clinicId: existing?.clinicId ?? null,
    availabilityStartTime: '09:00',
    availabilityEndTime: '17:00',
    slotDuration: '30',
  });

  const [achievements, setAchievements] = useState(
    existing?.achievements?.length ? existing.achievements.map(a => ({ ...a })) : []
  );

  const [availabilityDays, setAvailabilityDays] = useState(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  const [clinics, setClinics] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [compensationType, setCompensationType] = useState(existing?.compensation?.compensationType || null);
  const [fixedSalary, setFixedSalary] = useState(existing?.compensation?.fixedSalary ? String(existing.compensation.fixedSalary) : '');
  const [doctorSharePercent, setDoctorSharePercent] = useState(existing?.compensation?.doctorSharePercent ? String(existing.compensation.doctorSharePercent) : '');
  const [clinicSharePercent, setClinicSharePercent] = useState(existing?.compensation?.clinicSharePercent ? String(existing.compensation.clinicSharePercent) : '');

  useEffect(() => {
    clinicApi.getAll().then(setClinics).catch(() => {});
  }, []);

  const updateField = (key, value) => {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  const updateAchievement = (index, key, value) => {
    const updated = [...achievements];
    updated[index] = { ...updated[index], [key]: value };
    setAchievements(updated);
  };

  const addAchievement = () => {
    setAchievements([...achievements, { title: '', year: '', description: '' }]);
  };

  const removeAchievement = (index) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Invalid email format';
    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) errs.phone = 'Must be 10 digits';
    if (form.consultationFee) { const f = parseFloat(form.consultationFee); if (isNaN(f) || f < 0) errs.consultationFee = 'Must be a positive number'; }
    if (compensationType === 'REVENUE_SHARING' || compensationType === 'HYBRID') {
      const d = parseFloat(doctorSharePercent) || 0;
      const c = parseFloat(clinicSharePercent) || 0;
      if (d + c !== 100) errs.compensation = 'Doctor Share + Clinic Share must equal 100%';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { Alert.alert('Validation Error', 'Please fix highlighted fields.'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        specialization: form.specialization.trim() || null, qualifications: form.qualifications.trim() || null,
        bio: form.bio.trim() || null, consultationFee: form.consultationFee ? parseFloat(form.consultationFee) : null,
        isActive: form.isActive, googleCalendarEnabled: form.googleCalendarEnabled,
        achievements: achievements.filter(a => a.title.trim()),
        clinicId: form.clinicId || null,
      };
      if (!isEdit) {
        payload.availabilityStartTime = form.availabilityStartTime.trim() || '09:00';
        payload.availabilityEndTime = form.availabilityEndTime.trim() || '17:00';
        payload.slotDuration = parseInt(form.slotDuration, 10) || 30;
        payload.availabilityDays = availabilityDays;
      }
      let createdId;
      if (isEdit) {
        await doctorApi.update(existing.id, payload);
      } else {
        const created = await doctorApi.create(payload);
        createdId = created.id;
      }
      if (compensationType) {
        const savedId = isEdit ? existing.id : createdId;
        await compensationApi.saveDoctorCompensation(savedId, {
          compensationType,
          fixedSalary: fixedSalary ? parseFloat(fixedSalary) : null,
          doctorSharePercent: doctorSharePercent ? parseFloat(doctorSharePercent) : null,
          clinicSharePercent: clinicSharePercent ? parseFloat(clinicSharePercent) : null,
        });
      }
      if (isEdit) {
        Alert.alert('Success', 'Doctor profile updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(
          'Doctor Added Successfully',
          `Doctor profile and availability slots created.\n\nLogin Username: ${form.email.trim()}\nLogin Password: password123`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save.');
    } finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Field label="Full Name" required error={errors.name}>
            <TextInput style={[styles.input, errors.name && styles.inputError]} value={form.name} onChangeText={(v) => updateField('name', v)} placeholder="e.g. John Smith" placeholderTextColor={colors.textMuted} />
          </Field>
          <Field label="Email" required error={errors.email}>
            <TextInput style={[styles.input, errors.email && styles.inputError]} value={form.email} onChangeText={(v) => updateField('email', v)} placeholder="doctor@clinic.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <TextInput style={[styles.input, errors.phone && styles.inputError]} value={form.phone} onChangeText={(v) => updateField('phone', v)} placeholder="10-digit number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
          </Field>
          <Field label="Clinic Address">
            <TextInput style={[styles.input, styles.multiline]} value={form.address} onChangeText={(v) => updateField('address', v)} placeholder="Full clinic address for patients to visit" placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />
          </Field>
          <Field label="Specialization">
            <TextInput style={styles.input} value={form.specialization} onChangeText={(v) => updateField('specialization', v)} placeholder="e.g. Cardiologist" placeholderTextColor={colors.textMuted} />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Clinic Assignment</Text>
          <Field label="Clinic">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clinicScroll}>
              <TouchableOpacity
                style={[styles.clinicChip, !form.clinicId && styles.clinicChipActive]}
                onPress={() => updateField('clinicId', null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.clinicChipText, !form.clinicId && styles.clinicChipTextActive]}>None</Text>
              </TouchableOpacity>
              {clinics.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.clinicChip, form.clinicId === c.id && styles.clinicChipActive]}
                  onPress={() => updateField('clinicId', c.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.clinicChipText, form.clinicId === c.id && styles.clinicChipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Professional Details</Text>
          <Field label="Qualifications">
            <TextInput style={[styles.input, styles.multiline]} value={form.qualifications} onChangeText={(v) => updateField('qualifications', v)} placeholder="MBBS, MD, DM..." placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />
          </Field>
          <Field label="Bio">
            <TextInput style={[styles.input, styles.multiline]} value={form.bio} onChangeText={(v) => updateField('bio', v)} placeholder="About the doctor..." placeholderTextColor={colors.textMuted} multiline numberOfLines={4} />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {achievements.map((ach, idx) => (
            <View key={idx} style={styles.achievementEntry}>
              <View style={styles.achievementHeader}>
                <Text style={styles.achievementIndex}>#{idx + 1}</Text>
                <TouchableOpacity onPress={() => removeAchievement(idx)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Field label="Title">
                <TextInput style={styles.input} value={ach.title} onChangeText={(v) => updateAchievement(idx, 'title', v)} placeholder="e.g. Best Doctor Award" placeholderTextColor={colors.textMuted} />
              </Field>
              <Field label="Year">
                <TextInput style={styles.input} value={ach.year} onChangeText={(v) => updateAchievement(idx, 'year', v)} placeholder="e.g. 2024" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
              </Field>
              <Field label="Description">
                <TextInput style={[styles.input, styles.multiline]} value={ach.description} onChangeText={(v) => updateAchievement(idx, 'description', v)} placeholder="Brief description..." placeholderTextColor={colors.textMuted} multiline numberOfLines={2} />
              </Field>
            </View>
          ))}
          <TouchableOpacity style={styles.addAchievementBtn} onPress={addAchievement}>
            <Text style={styles.addAchievementText}>+ Add Achievement</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fee</Text>
          <Field label="Consultation Fee (₹)" error={errors.consultationFee}>
            <TextInput style={[styles.input, errors.consultationFee && styles.inputError]} value={form.consultationFee} onChangeText={(v) => updateField('consultationFee', v)} placeholder="e.g. 500" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Compensation</Text>
          <Field label="Compensation Type">
            <View style={styles.pillRow}>
              {['FIXED_SALARY', 'REVENUE_SHARING', 'HYBRID'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pill, compensationType === type && styles.pillActive]}
                  onPress={() => setCompensationType(compensationType === type ? null : type)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, compensationType === type && styles.pillTextActive]}>
                    {type === 'FIXED_SALARY' ? 'Fixed Salary' : type === 'REVENUE_SHARING' ? 'Revenue Sharing' : 'Hybrid'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
          {(compensationType === 'FIXED_SALARY' || compensationType === 'HYBRID') && (
            <Field label="Fixed Salary (₹)">
              <TextInput style={styles.input} value={fixedSalary} onChangeText={setFixedSalary} placeholder="e.g. 50000" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
            </Field>
          )}
          {(compensationType === 'REVENUE_SHARING' || compensationType === 'HYBRID') && (
            <>
              <Field label="Doctor Share (%)" error={errors.compensation}>
                <TextInput style={[styles.input, errors.compensation && styles.inputError]} value={doctorSharePercent} onChangeText={setDoctorSharePercent} placeholder="e.g. 60" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
              </Field>
              <Field label="Clinic Share (%)">
                <TextInput style={styles.input} value={clinicSharePercent} onChangeText={setClinicSharePercent} placeholder="e.g. 40" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
              </Field>
              {errors.compensation ? null : (
                <Text style={styles.compNote}>Doctor Share + Clinic Share must equal 100%</Text>
              )}
            </>
          )}
        </View>

        {!isEdit && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Availability Setup</Text>
            <View style={styles.timeRow}>
              <Field label="Start Time (HH:MM)" style={{ flex: 1, marginRight: 6 }}>
                <TextInput style={styles.input} value={form.availabilityStartTime} onChangeText={(v) => updateField('availabilityStartTime', v)} placeholder="e.g. 09:00" placeholderTextColor={colors.textMuted} />
              </Field>
              <Field label="End Time (HH:MM)" style={{ flex: 1, marginLeft: 6 }}>
                <TextInput style={styles.input} value={form.availabilityEndTime} onChangeText={(v) => updateField('availabilityEndTime', v)} placeholder="e.g. 17:00" placeholderTextColor={colors.textMuted} />
              </Field>
            </View>
            <Field label="Slot Duration (minutes)">
              <TextInput style={styles.input} value={form.slotDuration} onChangeText={(v) => updateField('slotDuration', v)} placeholder="e.g. 30" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
            </Field>
            <Field label="Work Days">
              <View style={styles.daysRow}>
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => {
                  const active = availabilityDays.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                      onPress={() => {
                        if (active) {
                          setAvailabilityDays(availabilityDays.filter(d => d !== day));
                        } else {
                          setAvailabilityDays([...availabilityDays, day]);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{day.substring(0, 3)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <ToggleRow label="Active Status" desc="Doctor can accept appointments" value={form.isActive} onToggle={() => updateField('isActive', !form.isActive)} />
          <ToggleRow label="Google Calendar Sync" desc="Auto-create events on booking" value={form.googleCalendarEnabled} onToggle={() => updateField('googleCalendarEnabled', !form.googleCalendarEnabled)} />
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>{isEdit ? 'Save Doctor' : 'Add Doctor'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, required, error, children }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}{required ? <Text style={{ color: colors.error }}> *</Text> : null}</Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function ToggleRow({ label, desc, value, onToggle }) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <View style={[styles.toggleTrack, value && styles.toggleTrackActive]}>
        <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, fontWeight: '500' },
  multiline: { minHeight: 68, textAlignVertical: 'top', paddingVertical: 10 },
  inputError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  errorText: { color: colors.error, fontSize: 11, marginTop: 2, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  toggleDesc: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  toggleTrack: { width: 46, height: 26, borderRadius: 13, backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 3 },
  toggleTrackActive: { backgroundColor: colors.primary },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', ...shadows.sm },
  toggleKnobActive: { alignSelf: 'flex-end' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', ...shadows.md },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  achievementEntry: { backgroundColor: colors.bg, borderRadius: borderRadius.sm, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight },
  achievementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  achievementIndex: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  removeBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.error + '15', justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { fontSize: 11, color: colors.error, fontWeight: '700' },
  addAchievementBtn: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: borderRadius.sm, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  addAchievementText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  clinicScroll: { marginVertical: 4 },
  clinicChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  clinicChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  clinicChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  clinicChipTextActive: { color: '#FFFFFF' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: borderRadius.full, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  pillTextActive: { color: '#FFFFFF' },
  compNote: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  timeRow: { flexDirection: 'row' },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  dayChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  dayChipTextActive: { color: '#FFFFFF' },
});
