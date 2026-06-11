import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { staffApi } from '../api/staffApi';
import { doctorApi } from '../api/doctorApi';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows, typography } from '../theme';

const ROLES = ['RECEPTIONIST', 'ACCOUNTANT', 'INVENTORY_MANAGER', 'NURSE', 'LAB_TECHNICIAN', 'PHARMACIST', 'CLEANER', 'OTHER'];

export default function StaffFormScreen({ route, navigation }) {
  const staff = route.params?.staff;
  const isEdit = !!staff;

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [doctors, setDoctors] = useState([]);
  const { user } = useAuth();
  const isAdmin = user?.role === 'CLINIC_ADMIN' || user?.role === 'SUPER_ADMIN';

  const [form, setForm] = useState({
    fullName: '', phone: '', age: '', email: '', address: '', roleTitle: 'RECEPTIONIST',
    aadharNumber: '', panNumber: '', bankAccountNo: '', bankName: '', ifscCode: '',
    emergencyContact: '', notes: '', dutyTime: '', fixedSalary: '', doctorUserId: '',
  });

  useEffect(() => {
    if (staff) {
      setForm({
        fullName: staff.staffName || '',
        phone: staff.phone || '',
        age: staff.age ? String(staff.age) : '',
        email: staff.email || '',
        address: staff.address || '',
        roleTitle: staff.roleTitle || 'RECEPTIONIST',
        aadharNumber: staff.aadharNumber || '',
        panNumber: staff.panNumber || '',
        bankAccountNo: staff.bankAccountNo || '',
        bankName: staff.bankName || '',
        ifscCode: staff.ifscCode || '',
        emergencyContact: staff.emergencyContact || '',
        notes: staff.notes || '',
        dutyTime: staff.dutyTime || '',
        fixedSalary: staff.fixedSalary ? String(staff.fixedSalary) : '',
        doctorUserId: staff.doctorUserId ? String(staff.doctorUserId) : '',
      });
    }
  }, [staff]);

  useEffect(() => {
    if (isAdmin) {
      doctorApi.getAll()
        .then(setDoctors)
        .catch(err => console.log('Failed to fetch doctors', err));
    }
  }, [isAdmin]);

  const update = (key, value) => {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    else if (form.phone.replace(/\D/g, '').length < 10) errs.phone = 'Must be at least 10 digits';
    if (form.age) { const n = parseInt(form.age, 10); if (isNaN(n) || n < 18 || n > 100) errs.age = 'Must be 18–100'; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Invalid email';
    if (form.fixedSalary) { const f = parseFloat(form.fixedSalary); if (isNaN(f) || f < 0) errs.fixedSalary = 'Must be positive'; }
    if (isAdmin && !isEdit && !form.doctorUserId) { errs.doctorUserId = 'Please select a doctor to assign'; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { Alert.alert('Validation Error', 'Fix highlighted fields.'); return; }
    setSaving(true);
    
    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      age: form.age ? parseInt(form.age, 10) : null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      roleTitle: form.roleTitle,
      aadharNumber: form.aadharNumber.trim() || null,
      panNumber: form.panNumber.trim() || null,
      bankAccountNo: form.bankAccountNo.trim() || null,
      bankName: form.bankName.trim() || null,
      ifscCode: form.ifscCode.trim() || null,
      emergencyContact: form.emergencyContact.trim() || null,
      notes: form.notes.trim() || null,
      dutyTime: form.dutyTime.trim() || null,
      fixedSalary: form.fixedSalary ? parseFloat(form.fixedSalary) : null,
      doctorUserId: form.doctorUserId ? parseInt(form.doctorUserId, 10) : null,
    };

    try {
      if (isEdit) {
        await staffApi.update(staff.id, payload);
        Alert.alert('Success', 'Staff details updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const res = await staffApi.createWithDetails(payload);
        Alert.alert(
          '🎉 Staff Added',
          `━━━━━━━━━━━━━━━━━━━━━━━\n  LOGIN CREDENTIALS\n━━━━━━━━━━━━━━━━━━━━━━━\n\n  👤 Username: ${res.staffUsername}\n  🔑 Password: ${res.tempPassword}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n\n  📌 Format: role.firstname.lastname\n  🔐 Change password after first login.\n\n  SMS sent to staff's phone.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save staff.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.stepIndicator}>
          <StepDot number={1} label="Personal" active={step === 1} done={step > 1} />
          <View style={styles.stepLine} />
          <StepDot number={2} label="Identity/Duty" active={step === 2} done={step > 2} />
          <View style={styles.stepLine} />
          <StepDot number={3} label="Bank" active={step === 3} done={step > 3} />
        </View>

        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{isEdit ? 'Edit' : 'Personal'} Details</Text>
            <Field label="Full Name" required error={errors.fullName}>
              <TextInput style={[styles.input, errors.fullName && styles.inputError]} value={form.fullName} onChangeText={(v) => update('fullName', v)} placeholder="Full name" placeholderTextColor={colors.textMuted} />
            </Field>
            <View style={styles.row}>
              <Field label="Phone" required style={{ flex: 1, marginRight: 8 }} error={errors.phone}>
                <TextInput style={[styles.input, errors.phone && styles.inputError]} value={form.phone} onChangeText={(v) => update('phone', v)} placeholder="Phone number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
              </Field>
              <Field label="Age" style={{ flex: 1 }} error={errors.age}>
                <TextInput style={[styles.input, errors.age && styles.inputError]} value={form.age} onChangeText={(v) => update('age', v)} placeholder="Age" placeholderTextColor={colors.textMuted} keyboardType="numeric" maxLength={3} />
              </Field>
            </View>
            <Field label="Email" error={errors.email}>
              <TextInput style={[styles.input, errors.email && styles.inputError]} value={form.email} onChangeText={(v) => update('email', v)} placeholder="email@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
            </Field>
            <Field label="Address">
              <TextInput style={[styles.input, styles.multiline]} value={form.address} onChangeText={(v) => update('address', v)} placeholder="Full address..." placeholderTextColor={colors.textMuted} multiline numberOfLines={2} />
            </Field>
            <Field label="Role" required>
              <View style={styles.pillRow}>
                {ROLES.map((r) => (
                  <TouchableOpacity key={r} style={[styles.pill, form.roleTitle === r && styles.pillActive]} onPress={() => update('roleTitle', r)}>
                    <Text style={[styles.pillText, form.roleTitle === r && styles.pillTextActive]}>{r.replace(/_/g, ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>Next → Duty/Identity</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Duty & Identity Details</Text>
            
            <Field label="Duty Hours / Timing">
              <TextInput style={styles.input} value={form.dutyTime} onChangeText={(v) => update('dutyTime', v)} placeholder="e.g. 9:00 AM - 5:00 PM" placeholderTextColor={colors.textMuted} />
            </Field>

            <Field label="Fixed Income / Base Salary" error={errors.fixedSalary}>
              <TextInput style={[styles.input, errors.fixedSalary && styles.inputError]} value={form.fixedSalary} onChangeText={(v) => update('fixedSalary', v)} placeholder="e.g. 20000" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
            </Field>

            {isAdmin && !isEdit && (
              <Field label="Assign Doctor" required error={errors.doctorUserId}>
                <View style={styles.pillRow}>
                  {doctors.map((doc) => (
                    <TouchableOpacity
                      key={doc.id}
                      style={[styles.pill, form.doctorUserId === String(doc.id) && styles.pillActive]}
                      onPress={() => update('doctorUserId', String(doc.id))}
                    >
                      <Text style={[styles.pillText, form.doctorUserId === String(doc.id) && styles.pillTextActive]}>
                        Dr. {doc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>
            )}

            <Field label="Aadhar Number">
              <TextInput style={styles.input} value={form.aadharNumber} onChangeText={(v) => update('aadharNumber', v)} placeholder="12-digit Aadhar number" placeholderTextColor={colors.textMuted} keyboardType="number-pad" maxLength={14} />
            </Field>
            <Field label="PAN Number">
              <TextInput style={styles.input} value={form.panNumber} onChangeText={(v) => update('panNumber', v)} placeholder="e.g. ABCDE1234F" placeholderTextColor={colors.textMuted} autoCapitalize="characters" maxLength={10} />
            </Field>
            <Field label="Emergency Contact">
              <TextInput style={styles.input} value={form.emergencyContact} onChangeText={(v) => update('emergencyContact', v)} placeholder="Emergency phone number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
            </Field>
            <Field label="Notes">
              <TextInput style={[styles.input, styles.multiline]} value={form.notes} onChangeText={(v) => update('notes', v)} placeholder="Any additional notes..." placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />
            </Field>
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)} activeOpacity={0.85}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)} activeOpacity={0.85}>
                <Text style={styles.nextBtnText}>Next → Bank</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Bank Details</Text>
            <Field label="Bank Account Number">
              <TextInput style={styles.input} value={form.bankAccountNo} onChangeText={(v) => update('bankAccountNo', v)} placeholder="Account number" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
            </Field>
            <Field label="Bank Name">
              <TextInput style={styles.input} value={form.bankName} onChangeText={(v) => update('bankName', v)} placeholder="e.g. State Bank of India" placeholderTextColor={colors.textMuted} />
            </Field>
            <Field label="IFSC Code">
              <TextInput style={styles.input} value={form.ifscCode} onChangeText={(v) => update('ifscCode', v)} placeholder="e.g. SBIN0001234" placeholderTextColor={colors.textMuted} autoCapitalize="characters" />
            </Field>
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>{isEdit ? 'Update Details' : 'Create Staff Member'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.backBtn, { marginTop: 10, alignSelf: 'center' }]} onPress={() => setStep(2)} activeOpacity={0.85}>
              <Text style={styles.backBtnText}>← Back to Identity</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StepDot({ number, label, active, done }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.dot, active && styles.dotActive, done && styles.dotDone]}>
        <Text style={[styles.dotText, (active || done) && styles.dotTextActive]}>{done ? '✓' : number}</Text>
      </View>
      <Text style={[styles.dotLabel, active && styles.dotLabelActive]}>{label}</Text>
    </View>
  );
}

function Field({ label, required, error, children, style }) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      <Text style={styles.fieldLabel}>{label}{required ? <Text style={{ color: colors.error }}> *</Text> : null}</Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, paddingHorizontal: 20 },
  stepLine: { width: 40, height: 2, backgroundColor: colors.border, marginHorizontal: 4 },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  dotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  dotDone: { borderColor: colors.success, backgroundColor: colors.success },
  dotText: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
  dotTextActive: { color: '#FFFFFF' },
  dotLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 4 },
  dotLabelActive: { color: colors.primary },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, fontWeight: '500' },
  multiline: { minHeight: 56, textAlignVertical: 'top', paddingVertical: 10 },
  inputError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  errorText: { color: colors.error, fontSize: 11, marginTop: 2, fontWeight: '600' },
  row: { flexDirection: 'row' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  pill: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 7 },
  pillActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  pillTextActive: { color: colors.primary },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  nextBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  nextBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  backBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: colors.primaryLight },
  saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', marginTop: 8, ...shadows.md },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
