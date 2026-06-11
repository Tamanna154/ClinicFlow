import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { patientApi } from '../api/patientApi';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows, typography } from '../theme';

const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CONDITIONS = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Thyroid'];

export default function PatientFormScreen({ route, navigation }) {
  const existing = route.params?.patient;
  const isEdit = !!existing;
  const { user } = useAuth();

  const initHistory = existing?.medicalHistory ?? '';
  const parsedSelected = [];
  let parsedCustom = '';
  if (initHistory) {
    initHistory.split(',').map(i => i.trim()).forEach(item => {
      if (CONDITIONS.includes(item)) parsedSelected.push(item);
      else parsedCustom = parsedCustom ? `${parsedCustom}, ${item}` : item;
    });
  }

  const [form, setForm] = useState({
    name: existing?.name ?? '', phone: existing?.phone ?? '', email: existing?.email ?? '',
    age: existing?.age != null ? String(existing.age) : '', gender: existing?.gender ?? '',
    bloodGroup: existing?.bloodGroup ?? '', address: existing?.address ?? '',
    medicalHistory: existing?.medicalHistory ?? '', allergies: existing?.allergies ?? '',
    emergencyContactName: existing?.emergencyContactName ?? '', emergencyContactPhone: existing?.emergencyContactPhone ?? '',
  });
  const [selectedConditions, setSelectedConditions] = useState(parsedSelected);
  const [customCondition, setCustomCondition] = useState(parsedCustom);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const updateField = (key, value) => { setForm({ ...form, [key]: value }); if (errors[key]) setErrors({ ...errors, [key]: undefined }); };

  const toggleCondition = (c) => {
    const next = selectedConditions.includes(c) ? selectedConditions.filter(x => x !== c) : [...selectedConditions, c];
    setSelectedConditions(next);
    const combined = [...next]; if (customCondition.trim()) combined.push(customCondition.trim());
    setForm(prev => ({ ...prev, medicalHistory: combined.join(', ') }));
  };

  const handleCustomChange = (text) => {
    setCustomCondition(text);
    const combined = [...selectedConditions]; if (text.trim()) combined.push(text.trim());
    setForm(prev => ({ ...prev, medicalHistory: combined.join(', ') }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone.trim())) errs.phone = 'Must be 10 digits';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Invalid email';
    if (form.age) { const n = parseInt(form.age, 10); if (isNaN(n) || n < 0 || n > 150) errs.age = '0–150'; }
    if (form.emergencyContactPhone && !/^\d{10}$/.test(form.emergencyContactPhone.trim())) errs.emergencyContactPhone = 'Must be 10 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { Alert.alert('Validation Error', 'Fix highlighted fields.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || null,
        age: form.age ? parseInt(form.age, 10) : null, gender: form.gender || null, bloodGroup: form.bloodGroup || null,
        address: form.address.trim() || null, medicalHistory: form.medicalHistory.trim() || null,
        allergies: form.allergies.trim() || null, emergencyContactName: form.emergencyContactName.trim() || null,
        emergencyContactPhone: form.emergencyContactPhone.trim() || null,
        createdByType: user?.role, createdById: user?.id, createdByName: user?.name,
      };
      if (isEdit) {
        await patientApi.update(existing.id, payload);
        Alert.alert('Success', 'Patient details updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const res = await patientApi.create(payload);
        Alert.alert(
          '🎉 Patient Registered',
          `━━━━━━━━━━━━━━━━━━━━━━━\n  LOGIN CREDENTIALS\n━━━━━━━━━━━━━━━━━━━━━━━\n\n  👤 Username: ${res.tempUsername}\n  🔑 Password: ${res.tempPassword}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n\n  📌 Format: patient.firstname.lastname\n  🔐 Change password after first login.\n\n  SMS sent to patient's phone.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) { Alert.alert('Error', err.message || 'Could not save.'); }
    finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <Field label="Full Name" required error={errors.name}>
            <TextInput style={[styles.input, errors.name && styles.inputError]} value={form.name} onChangeText={(v) => updateField('name', v)} placeholder="e.g. John Doe" placeholderTextColor={colors.textMuted} />
          </Field>
          <Field label="Phone Number" required error={errors.phone}>
            <TextInput style={[styles.input, errors.phone && styles.inputError]} value={form.phone} onChangeText={(v) => updateField('phone', v)} placeholder="10-digit number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
          </Field>
          <View style={styles.row}>
            <Field label="Email" style={{ flex: 2, marginRight: 8 }} error={errors.email}>
              <TextInput style={[styles.input, errors.email && styles.inputError]} value={form.email} onChangeText={(v) => updateField('email', v)} placeholder="email@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
            </Field>
            <Field label="Age" style={{ flex: 1 }} error={errors.age}>
              <TextInput style={[styles.input, errors.age && styles.inputError]} value={form.age} onChangeText={(v) => updateField('age', v)} placeholder="Years" placeholderTextColor={colors.textMuted} keyboardType="numeric" maxLength={3} />
            </Field>
          </View>
          <Field label="Gender">
            <View style={styles.pillRow}>{GENDERS.map((g) => (<TouchableOpacity key={g} style={[styles.pill, form.gender === g && styles.pillActive]} onPress={() => updateField('gender', form.gender === g ? '' : g)}><Text style={[styles.pillText, form.gender === g && styles.pillTextActive]}>{g}</Text></TouchableOpacity>))}</View>
          </Field>
          <Field label="Blood Group">
            <View style={styles.bloodGrid}>{BLOOD_GROUPS.map((bg) => (<TouchableOpacity key={bg} style={[styles.bloodPill, form.bloodGroup === bg && styles.bloodPillActive]} onPress={() => updateField('bloodGroup', form.bloodGroup === bg ? '' : bg)}><Text style={[styles.bloodPillText, form.bloodGroup === bg && styles.bloodPillTextActive]}>{bg}</Text></TouchableOpacity>))}</View>
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Medical Records</Text>
          <Field label="Address">
            <TextInput style={[styles.input, styles.multiline]} value={form.address} onChangeText={(v) => updateField('address', v)} placeholder="Full address..." placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />
          </Field>
          <Field label="Chronic Conditions">
            <View style={styles.chkGrid}>{CONDITIONS.map((c) => { const sel = selectedConditions.includes(c); return (<TouchableOpacity key={c} style={[styles.chkItem, sel && styles.chkItemActive]} onPress={() => toggleCondition(c)}><View style={[styles.chkBox, sel && styles.chkBoxActive]}>{sel && <Text style={styles.chkMark}>✓</Text>}</View><Text style={[styles.chkLabel, sel && styles.chkLabelActive]}>{c}</Text></TouchableOpacity>); })}</View>
            <TextInput style={[styles.input, { marginTop: 8 }]} value={customCondition} onChangeText={handleCustomChange} placeholder="Other diagnoses..." placeholderTextColor={colors.textMuted} />
          </Field>
          <Field label="Allergies" warning>
            <TextInput style={[styles.input, styles.multiline, form.allergies ? { borderColor: colors.warning, backgroundColor: colors.warningLight } : null]} value={form.allergies} onChangeText={(v) => updateField('allergies', v)} placeholder="Specify allergies..." placeholderTextColor={colors.textMuted} multiline numberOfLines={2} />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <Field label="Contact Person"><TextInput style={styles.input} value={form.emergencyContactName} onChangeText={(v) => updateField('emergencyContactName', v)} placeholder="Name" placeholderTextColor={colors.textMuted} /></Field>
          <Field label="Contact Phone" error={errors.emergencyContactPhone}><TextInput style={[styles.input, errors.emergencyContactPhone && styles.inputError]} value={form.emergencyContactPhone} onChangeText={(v) => updateField('emergencyContactPhone', v)} placeholder="10-digit number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" /></Field>
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Register Patient'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, required, error, children, style }) {
  return (<View style={[{ marginBottom: 14 }, style]}><Text style={styles.fieldLabel}>{label}{required ? <Text style={{ color: colors.error }}> *</Text> : null}</Text>{children}{error && <Text style={styles.errorText}>{error}</Text>}</View>);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg }, content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, fontWeight: '500' },
  multiline: { minHeight: 64, textAlignVertical: 'top', paddingVertical: 10 },
  inputError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  errorText: { color: colors.error, fontSize: 11, marginTop: 2, fontWeight: '600' },
  row: { flexDirection: 'row', marginBottom: 0 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingVertical: 10, alignItems: 'center' },
  pillActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  pillTextActive: { color: colors.primary },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bloodPill: { width: '23%', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingVertical: 7, alignItems: 'center' },
  bloodPillActive: { backgroundColor: '#FEF2F2', borderColor: colors.error },
  bloodPillText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  bloodPillTextActive: { color: colors.error },
  chkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chkItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 8, width: '48%', marginBottom: 4 },
  chkItemActive: { backgroundColor: colors.primary + '10', borderColor: colors.primary },
  chkBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: colors.textMuted, alignItems: 'center', justifyContent: 'center', marginRight: 8, backgroundColor: colors.surface },
  chkBoxActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chkMark: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  chkLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chkLabelActive: { color: colors.primary },
  saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', ...shadows.md },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
