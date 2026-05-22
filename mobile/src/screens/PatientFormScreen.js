import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { patientApi } from '../api/patientApi';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientFormScreen({ route, navigation }) {
  const existing = route.params?.patient;
  const isEdit = !!existing;

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    phone: existing?.phone ?? '',
    email: existing?.email ?? '',
    age: existing?.age != null ? String(existing.age) : '',
    gender: existing?.gender ?? '',
    bloodGroup: existing?.bloodGroup ?? '',
    address: existing?.address ?? '',
    medicalHistory: existing?.medicalHistory ?? '',
    allergies: existing?.allergies ?? '',
    emergencyContactName: existing?.emergencyContactName ?? '',
    emergencyContactPhone: existing?.emergencyContactPhone ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (form.age) {
      const ageNum = parseInt(form.age, 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
        errs.age = 'Age must be a valid number between 0 and 150';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please check and fix highlighted errors before saving.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        age: form.age ? parseInt(form.age, 10) : null,
        gender: form.gender || null,
        bloodGroup: form.bloodGroup || null,
        address: form.address.trim() || null,
        medicalHistory: form.medicalHistory.trim() || null,
        allergies: form.allergies.trim() || null,
        emergencyContactName: form.emergencyContactName.trim() || null,
        emergencyContactPhone: form.emergencyContactPhone.trim() || null,
      };

      if (isEdit) {
        await patientApi.update(existing.id, payload);
      } else {
        await patientApi.create(payload);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key, value) => {
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Section 1: Demographics */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Personal Demographics</Text>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={form.name}
              onChangeText={(val) => updateField('name', val)}
              placeholder="e.g. John Doe"
              placeholderTextColor="#94A3B8"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={form.phone}
              onChangeText={(val) => updateField('phone', val)}
              placeholder="e.g. +1 (555) 019-2834"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Email and Age Row */}
          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, { flex: 2, marginRight: 10 }]}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={form.email}
                onChangeText={(val) => updateField('email', val)}
                placeholder="e.g. email@example.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={[styles.input, errors.age && styles.inputError]}
                value={form.age}
                onChangeText={(val) => updateField('age', val)}
                placeholder="Yrs"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={3}
              />
              {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            </View>
          </View>

          {/* Gender Select Pills */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pillContainer}>
              {GENDER_OPTIONS.map((g) => {
                const isActive = form.gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.pill, isActive && styles.pillActive]}
                    onPress={() => updateField('gender', isActive ? '' : g)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Blood Group Select Pills */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Blood Group</Text>
            <View style={styles.bloodPillContainer}>
              {BLOOD_GROUPS.map((bg) => {
                const isActive = form.bloodGroup === bg;
                return (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodPill, isActive && styles.bloodPillActive]}
                    onPress={() => updateField('bloodGroup', isActive ? '' : bg)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.bloodPillText, isActive && styles.bloodPillTextActive]}>
                      {bg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Section 2: Clinical Data */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. Clinical Records</Text>

          {/* Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Residential Address</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.address}
              onChangeText={(val) => updateField('address', val)}
              placeholder="Enter full home address..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Medical History */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Medical History & Diagnoses</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.medicalHistory}
              onChangeText={(val) => updateField('medicalHistory', val)}
              placeholder="e.g. Hypertension, Diabetes, Asthma..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Allergies */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, form.allergies ? styles.warningLabel : null]}>
              🚫 Known Drug / Food Allergies
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.multiline,
                form.allergies ? styles.warningInput : null,
              ]}
              value={form.allergies}
              onChangeText={(val) => updateField('allergies', val)}
              placeholder="Specify any severe allergies (e.g. Penicillin) or leave blank if none..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Section 3: Emergency Contacts */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Emergency Contact Details</Text>

          {/* Emergency Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contact Name</Text>
            <TextInput
              style={styles.input}
              value={form.emergencyContactName}
              onChangeText={(val) => updateField('emergencyContactName', val)}
              placeholder="Emergency contact person's name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Emergency Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contact Phone Number</Text>
            <TextInput
              style={styles.input}
              value={form.emergencyContactPhone}
              onChangeText={(val) => updateField('emergencyContactPhone', val)}
              placeholder="Emergency contact person's phone"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEdit ? '💾 Save Details' : '➕ Register Patient'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  fieldGroup: { marginBottom: 16 },
  rowFields: {
    flexDirection: 'row',
  },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  multiline: { minHeight: 76, textAlignVertical: 'top', paddingVertical: 10 },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, fontWeight: '600' },
  
  pillContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  pillTextActive: {
    color: '#1D4ED8',
  },

  bloodPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodPill: {
    width: '23%',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  bloodPillActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  bloodPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  bloodPillTextActive: {
    color: '#DC2626',
  },

  warningLabel: {
    color: '#EA580C',
  },
  warningInput: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },

  saveBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
