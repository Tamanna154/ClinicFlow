import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { doctorApi } from '../api/doctorApi';
import { colors, borderRadius, shadows, typography } from '../theme';

export default function DoctorFormScreen({ route, navigation }) {
  const existing = route.params?.doctor;
  const isEdit = !!existing;

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    email: existing?.email ?? '',
    phone: existing?.phone ?? '',
    specialization: existing?.specialization ?? '',
    qualifications: existing?.qualifications ?? '',
    bio: existing?.bio ?? '',
    consultationFee: existing?.consultationFee != null ? String(existing.consultationFee) : '',
    isActive: existing?.isActive !== false,
    googleCalendarEnabled: existing?.googleCalendarEnabled ?? false,
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const updateField = (key, value) => {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Invalid email format';
    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) errs.phone = 'Must be 10 digits';
    if (form.consultationFee) { const f = parseFloat(form.consultationFee); if (isNaN(f) || f < 0) errs.consultationFee = 'Must be a positive number'; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { Alert.alert('Validation Error', 'Please fix highlighted fields.'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null,
        specialization: form.specialization.trim() || null, qualifications: form.qualifications.trim() || null,
        bio: form.bio.trim() || null, consultationFee: form.consultationFee ? parseFloat(form.consultationFee) : null,
        isActive: form.isActive, googleCalendarEnabled: form.googleCalendarEnabled,
      };
      if (isEdit) await doctorApi.update(existing.id, payload);
      else await doctorApi.create(payload);
      navigation.goBack();
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
          <Field label="Specialization">
            <TextInput style={styles.input} value={form.specialization} onChangeText={(v) => updateField('specialization', v)} placeholder="e.g. Cardiologist" placeholderTextColor={colors.textMuted} />
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
          <Field label="Consultation Fee (₹)" error={errors.consultationFee}>
            <TextInput style={[styles.input, errors.consultationFee && styles.inputError]} value={form.consultationFee} onChangeText={(v) => updateField('consultationFee', v)} placeholder="e.g. 500" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
          </Field>
        </View>

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
});
