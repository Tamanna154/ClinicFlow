import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { clinicApi } from '../api/clinicApi';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows, typography } from '../theme';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED'];

export default function ClinicSetupScreen({ navigation }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'CLINIC_ADMIN';

  const [existingId, setExistingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    contactNumber: '',
    email: '',
    website: '',
    registrationNumber: '',
    gstNumber: '',
    workingHours: '',
    consultationFees: '',
    appointmentDuration: '15',
    specialization: '',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    socialMediaLinks: '',
    smsEnabled: false,
    whatsappEnabled: false,
    emailNotificationsEnabled: false,
    isVerified: false,
  });

  const [logoUri, setLogoUri] = useState(null);
  const [documentUri, setDocumentUri] = useState(null);

  useEffect(() => {
    loadClinic();
  }, []);

  const loadClinic = async () => {
    try {
      const clinic = await clinicApi.getMyClinic();
      if (clinic) {
        setExistingId(clinic.id);
        setForm({
          name: clinic.name || '',
          address: clinic.address || '',
          city: clinic.city || '',
          state: clinic.state || '',
          country: clinic.country || '',
          pincode: clinic.pincode ? String(clinic.pincode) : '',
          contactNumber: clinic.contactNumber || '',
          email: clinic.email || '',
          website: clinic.website || '',
          registrationNumber: clinic.registrationNumber || '',
          gstNumber: clinic.gstNumber || '',
          workingHours: clinic.workingHours || '',
          consultationFees: clinic.consultationFees != null ? String(clinic.consultationFees) : '',
          appointmentDuration: clinic.appointmentDuration ? String(clinic.appointmentDuration) : '15',
          specialization: clinic.specialization || '',
          timezone: clinic.timezone || 'Asia/Kolkata',
          currency: clinic.currency || 'INR',
          socialMediaLinks: clinic.socialMediaLinks || '',
          smsEnabled: clinic.smsEnabled ?? false,
          whatsappEnabled: clinic.whatsappEnabled ?? false,
          emailNotificationsEnabled: clinic.emailNotificationsEnabled ?? false,
          isVerified: clinic.isVerified ?? false,
        });
        if (clinic.logoUrl) setLogoUri(clinic.logoUrl);
      }
    } catch (e) {
      // No existing clinic – start fresh
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key, value) => {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const pickDocument = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setDocumentUri(result.assets[0].uri);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Clinic name is required';
    if (!form.contactNumber.trim()) errs.contactNumber = 'Contact number is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Invalid email format';
    if (form.consultationFees) { const f = parseFloat(form.consultationFees); if (isNaN(f) || f < 0) errs.consultationFees = 'Must be a positive number'; }
    const dur = parseInt(form.appointmentDuration, 10);
    if (isNaN(dur) || dur < 1) errs.appointmentDuration = 'Must be at least 1 minute';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { Alert.alert('Validation Error', 'Please fix highlighted fields.'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        country: form.country.trim() || null,
        pincode: form.pincode.trim() || null,
        contactNumber: form.contactNumber.trim(),
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        registrationNumber: form.registrationNumber.trim() || null,
        gstNumber: form.gstNumber.trim() || null,
        workingHours: form.workingHours.trim() || null,
        consultationFees: form.consultationFees ? parseFloat(form.consultationFees) : null,
        appointmentDuration: parseInt(form.appointmentDuration, 10) || 15,
        specialization: form.specialization.trim() || null,
        timezone: form.timezone.trim() || 'Asia/Kolkata',
        currency: form.currency,
        socialMediaLinks: form.socialMediaLinks.trim() || null,
        smsEnabled: form.smsEnabled,
        whatsappEnabled: form.whatsappEnabled,
        emailNotificationsEnabled: form.emailNotificationsEnabled,
        isVerified: form.isVerified,
        logoUri: logoUri || null,
        documentUri: documentUri || null,
      };

      if (existingId) {
        await clinicApi.update(existingId, payload);
      } else {
        await clinicApi.create(payload);
      }

      Alert.alert('Success', 'Clinic setup saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save clinic setup.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Clinic Details</Text>
          <Field label="Clinic Name" required error={errors.name}>
            <TextInput style={[styles.input, errors.name && styles.inputError]} value={form.name} onChangeText={(v) => updateField('name', v)} placeholder="e.g. City Medical Centre" placeholderTextColor={colors.textMuted} />
          </Field>
          <Field label="Address">
            <TextInput style={[styles.input, styles.multiline]} value={form.address} onChangeText={(v) => updateField('address', v)} placeholder="Full clinic address" placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />
          </Field>
          <View style={styles.row}>
            <Field label="City" style={{ flex: 1, marginRight: 8 }}>
              <TextInput style={styles.input} value={form.city} onChangeText={(v) => updateField('city', v)} placeholder="City" placeholderTextColor={colors.textMuted} />
            </Field>
            <Field label="State" style={{ flex: 1 }}>
              <TextInput style={styles.input} value={form.state} onChangeText={(v) => updateField('state', v)} placeholder="State" placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
          <View style={styles.row}>
            <Field label="Country" style={{ flex: 1, marginRight: 8 }}>
              <TextInput style={styles.input} value={form.country} onChangeText={(v) => updateField('country', v)} placeholder="Country" placeholderTextColor={colors.textMuted} />
            </Field>
            <Field label="Pincode" style={{ flex: 1 }}>
              <TextInput style={styles.input} value={form.pincode} onChangeText={(v) => updateField('pincode', v)} placeholder="Pincode" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
            </Field>
          </View>
          <Field label="Contact Number" required error={errors.contactNumber}>
            <TextInput style={[styles.input, errors.contactNumber && styles.inputError]} value={form.contactNumber} onChangeText={(v) => updateField('contactNumber', v)} placeholder="Phone number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
          </Field>
          <Field label="Email" error={errors.email}>
            <TextInput style={[styles.input, errors.email && styles.inputError]} value={form.email} onChangeText={(v) => updateField('email', v)} placeholder="clinic@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
          </Field>
          <Field label="Website">
            <TextInput style={styles.input} value={form.website} onChangeText={(v) => updateField('website', v)} placeholder="https://example.com" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
          </Field>
          <Field label="Clinic Logo">
            {logoUri && <Image source={{ uri: logoUri }} style={styles.logoPreview} />}
            <TouchableOpacity style={styles.uploadBtn} onPress={pickLogo} activeOpacity={0.7}>
              <Text style={styles.uploadBtnText}>{logoUri ? 'Change Logo' : 'Upload Logo'}</Text>
            </TouchableOpacity>
          </Field>
          <Field label="Registration Number">
            <TextInput style={styles.input} value={form.registrationNumber} onChangeText={(v) => updateField('registrationNumber', v)} placeholder="Registration number" placeholderTextColor={colors.textMuted} />
          </Field>
          <Field label="GST Number">
            <TextInput style={styles.input} value={form.gstNumber} onChangeText={(v) => updateField('gstNumber', v)} placeholder="GSTIN (optional)" placeholderTextColor={colors.textMuted} />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Working Hours & Fees</Text>
          <Field label="Working Hours">
            <TextInput style={styles.input} value={form.workingHours} onChangeText={(v) => updateField('workingHours', v)} placeholder="Mon-Sat: 9:00 AM - 6:00 PM" placeholderTextColor={colors.textMuted} />
          </Field>
          <Field label="Consultation Fees" error={errors.consultationFees}>
            <TextInput style={[styles.input, errors.consultationFees && styles.inputError]} value={form.consultationFees} onChangeText={(v) => updateField('consultationFees', v)} placeholder="e.g. 500" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
          </Field>
          <Field label="Appointment Duration (minutes)" error={errors.appointmentDuration}>
            <TextInput style={[styles.input, errors.appointmentDuration && styles.inputError]} value={form.appointmentDuration} onChangeText={(v) => updateField('appointmentDuration', v)} placeholder="15" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
          </Field>
          <Field label="Clinic Specialization">
            <TextInput style={styles.input} value={form.specialization} onChangeText={(v) => updateField('specialization', v)} placeholder="e.g. General Medicine, Dental" placeholderTextColor={colors.textMuted} />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Additional Configuration</Text>
          <Field label="Time Zone">
            <TextInput style={styles.input} value={form.timezone} onChangeText={(v) => updateField('timezone', v)} placeholder="Asia/Kolkata" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
          </Field>
          <Field label="Currency">
            <View style={styles.pillRow}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity key={c} style={[styles.pill, form.currency === c && styles.pillActive]} onPress={() => updateField('currency', c)} activeOpacity={0.7}>
                  <Text style={[styles.pillText, form.currency === c && styles.pillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
          <Field label="Social Media Links">
            <TextInput style={styles.input} value={form.socialMediaLinks} onChangeText={(v) => updateField('socialMediaLinks', v)} placeholder="Facebook, Instagram URLs (optional)" placeholderTextColor={colors.textMuted} />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <ToggleRow label="SMS Enabled" desc="Send SMS notifications to patients" value={form.smsEnabled} onToggle={() => updateField('smsEnabled', !form.smsEnabled)} />
          <ToggleRow label="WhatsApp Enabled" desc="Send WhatsApp notifications" value={form.whatsappEnabled} onToggle={() => updateField('whatsappEnabled', !form.whatsappEnabled)} />
          <ToggleRow label="Email Notifications" desc="Send email notifications to patients" value={form.emailNotificationsEnabled} onToggle={() => updateField('emailNotificationsEnabled', !form.emailNotificationsEnabled)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Verification</Text>
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>You can complete clinic verification later. Some features may require verified status.</Text>
          </View>
          {isAdmin && (
            <ToggleRow label="Mark as Verified" desc="Clinic has been verified" value={form.isVerified} onToggle={() => updateField('isVerified', !form.isVerified)} />
          )}
          <Field label="Registration Document">
            {documentUri && <Image source={{ uri: documentUri }} style={styles.docPreview} />}
            <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument} activeOpacity={0.7}>
              <Text style={styles.uploadBtnText}>{documentUri ? 'Change Document' : 'Upload Registration Document'}</Text>
            </TouchableOpacity>
          </Field>
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>{existingId ? 'Update Clinic' : 'Save Clinic Setup'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, required, error, children, style }) {
  return (
    <View style={[{ marginBottom: 16 }, style]}>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, fontWeight: '500' },
  multiline: { minHeight: 68, textAlignVertical: 'top', paddingVertical: 10 },
  inputError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  errorText: { color: colors.error, fontSize: 11, marginTop: 2, fontWeight: '600' },
  row: { flexDirection: 'row' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: 14, paddingVertical: 8 },
  pillActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  pillTextActive: { color: colors.primary },
  logoPreview: { width: '100%', height: 100, borderRadius: borderRadius.sm, marginBottom: 8, resizeMode: 'contain', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight },
  docPreview: { width: '100%', height: 80, borderRadius: borderRadius.sm, marginBottom: 8, resizeMode: 'contain', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight },
  uploadBtn: { backgroundColor: colors.primary + '10', borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.primary + '30', paddingVertical: 8, alignItems: 'center', marginBottom: 4 },
  uploadBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  toggleDesc: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  toggleTrack: { width: 46, height: 26, borderRadius: 13, backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 3 },
  toggleTrackActive: { backgroundColor: colors.primary },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', ...shadows.sm },
  toggleKnobActive: { alignSelf: 'flex-end' },
  noteCard: { backgroundColor: colors.infoLight, borderRadius: borderRadius.sm, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: colors.info + '20' },
  noteText: { fontSize: 13, fontWeight: '500', color: colors.info, lineHeight: 18 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', ...shadows.md },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
