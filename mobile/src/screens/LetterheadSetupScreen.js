import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { letterheadApi } from '../api/letterheadApi';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows } from '../theme';

export default function LetterheadSetupScreen({ navigation }) {
  const { user } = useAuth();
  const doctorId = user?.doctorId;
  const isDoctor = user?.role === 'DOCTOR';

  const [form, setForm] = useState({
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
    clinicEmail: '',
    gstNumber: '',
    registrationNumber: '',
    useSystemGenerated: false,
  });
  const [logoUrl, setLogoUrl] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [designUrl, setDesignUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!isDoctor || !doctorId) {
      setLoading(false);
      return;
    }
    loadLetterhead();
  }, []));

  const loadLetterhead = async () => {
    try {
      const data = await letterheadApi.get(doctorId);
      setForm({
        clinicName: data.clinicName || '',
        clinicAddress: data.clinicAddress || '',
        clinicPhone: data.clinicPhone || '',
        clinicEmail: data.clinicEmail || '',
        gstNumber: data.gstNumber || '',
        registrationNumber: data.registrationNumber || '',
        useSystemGenerated: data.useSystemGenerated || false,
      });
      setLogoUrl(data.clinicLogoUrl);
      setSignatureUrl(data.signatureUrl);
      setDesignUrl(data.letterheadDesignUrl);
    } catch (e) {
      // No existing letterhead – start fresh
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key, value) => setForm({ ...form, [key]: value });

  const pickImage = async (field) => {
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
      try {
        setSaving(true);
        const updated = await letterheadApi.uploadImage(doctorId, field, result.assets[0].uri);
        if (field === 'logo') setLogoUrl(updated.clinicLogoUrl);
        else if (field === 'signature') setSignatureUrl(updated.signatureUrl);
        else if (field === 'design') setDesignUrl(updated.letterheadDesignUrl);
      } catch (e) {
        Alert.alert('Error', e.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await letterheadApi.save(doctorId, form);
      Alert.alert('Saved', 'Letterhead updated successfully');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
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

  if (!doctorId || !isDoctor) {
    return (
      <View style={[styles.center, { padding: 32 }]}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>⚕</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 }}>Access Restricted</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
          {!isDoctor
            ? 'Only doctors can set up letterheads. Please log in with a doctor account.'
            : 'Your account is not linked to a doctor profile. Please contact the clinic admin.'}
        </Text>
        <TouchableOpacity style={[styles.saveBtn, { paddingHorizontal: 32, paddingVertical: 12 }]} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Clinic Information</Text>
        <Field label="Clinic Name">
          <TextInput style={styles.input} value={form.clinicName} onChangeText={(v) => updateField('clinicName', v)} placeholder="Your Clinic Name" placeholderTextColor={colors.textMuted} />
        </Field>
        <Field label="Address">
          <TextInput style={[styles.input, styles.multiline]} value={form.clinicAddress} onChangeText={(v) => updateField('clinicAddress', v)} placeholder="Clinic address..." placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />
        </Field>
        <Field label="Phone">
          <TextInput style={styles.input} value={form.clinicPhone} onChangeText={(v) => updateField('clinicPhone', v)} placeholder="Clinic phone number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
        </Field>
        <Field label="Email">
          <TextInput style={styles.input} value={form.clinicEmail} onChangeText={(v) => updateField('clinicEmail', v)} placeholder="clinic@email.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
        </Field>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Registration</Text>
        <Field label="GST Number">
          <TextInput style={styles.input} value={form.gstNumber} onChangeText={(v) => updateField('gstNumber', v)} placeholder="GSTIN (optional)" placeholderTextColor={colors.textMuted} />
        </Field>
        <Field label="Registration Number">
          <TextInput style={styles.input} value={form.registrationNumber} onChangeText={(v) => updateField('registrationNumber', v)} placeholder="Medical registration no." placeholderTextColor={colors.textMuted} />
        </Field>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Images</Text>

        <Text style={styles.imageLabel}>Clinic Logo</Text>
        {logoUrl && <Image source={{ uri: logoUrl }} style={styles.preview} />}
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('logo')} activeOpacity={0.7}>
          <Text style={styles.uploadBtnText}>{logoUrl ? 'Change Logo' : 'Upload Logo'}</Text>
        </TouchableOpacity>

        <Text style={styles.imageLabel}>Doctor's Signature</Text>
        {signatureUrl && <Image source={{ uri: signatureUrl }} style={styles.preview} />}
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('signature')} activeOpacity={0.7}>
          <Text style={styles.uploadBtnText}>{signatureUrl ? 'Change Signature' : 'Upload Signature'}</Text>
        </TouchableOpacity>

        <Text style={styles.imageLabel}>Letterhead Design (Background)</Text>
        {designUrl && <Image source={{ uri: designUrl }} style={styles.preview} />}
        <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('design')} activeOpacity={0.7}>
          <Text style={styles.uploadBtnText}>{designUrl ? 'Change Design' : 'Upload Design'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Letterhead</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, fontWeight: '500' },
  multiline: { minHeight: 68, textAlignVertical: 'top', paddingVertical: 10 },
  imageLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 12 },
  preview: { width: '100%', height: 80, borderRadius: borderRadius.sm, marginBottom: 8, resizeMode: 'contain', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight },
  uploadBtn: { backgroundColor: colors.primary + '10', borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.primary + '30', paddingVertical: 8, alignItems: 'center', marginBottom: 4 },
  uploadBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', ...shadows.md },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
