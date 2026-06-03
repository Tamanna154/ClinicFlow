import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image, Modal,
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
    templateStyle: 'TEMPLATE_A',
  });
  const [logoUrl, setLogoUrl] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [designUrl, setDesignUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullPageVisible, setFullPageVisible] = useState(false);

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
        templateStyle: data.templateStyle || 'TEMPLATE_A',
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
            : 'Your account is not linked to a doctor profile. Please contact the clinic admin to create/update a Doctor profile in the Doctors section with your email (' + (user?.username || 'doctor@gmail.com') + ').'}
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
        <Text style={styles.sectionTitle}>Letterhead Mode Selection</Text>
        
        <View style={styles.modeSelectorRow}>
          {[
            { id: 'SYSTEM', label: 'System Generated' },
            { id: 'BACKGROUND', label: 'Uploaded Design' },
            { id: 'PLAIN', label: 'Plain Notepad' },
          ].map((mode) => {
            let active = false;
            if (mode.id === 'SYSTEM') active = form.useSystemGenerated;
            else if (mode.id === 'BACKGROUND') active = !form.useSystemGenerated && form.templateStyle === 'BACKGROUND';
            else if (mode.id === 'PLAIN') active = !form.useSystemGenerated && form.templateStyle === 'PLAIN';

            return (
              <TouchableOpacity
                key={mode.id}
                style={[styles.modeTab, active && styles.modeTabActive]}
                onPress={() => {
                  if (mode.id === 'SYSTEM') {
                    setForm(prev => ({ ...prev, useSystemGenerated: true, templateStyle: prev.templateStyle === 'BACKGROUND' || prev.templateStyle === 'PLAIN' ? 'TEMPLATE_A' : prev.templateStyle }));
                  } else if (mode.id === 'BACKGROUND') {
                    setForm(prev => ({ ...prev, useSystemGenerated: false, templateStyle: 'BACKGROUND' }));
                  } else if (mode.id === 'PLAIN') {
                    setForm(prev => ({ ...prev, useSystemGenerated: false, templateStyle: 'PLAIN' }));
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>{mode.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {form.useSystemGenerated && (
          <>
            <Text style={[styles.label, { marginTop: 16, marginBottom: 8 }]}>Select Suggested Template Design</Text>
            <View style={styles.templateRow}>
              {[
                { id: 'TEMPLATE_A', name: 'Modern Blue' },
                { id: 'TEMPLATE_B', name: 'Teal Minimalist' },
                { id: 'TEMPLATE_C', name: 'Classic Gold' }
              ].map((tmpl) => {
                const active = form.templateStyle === tmpl.id;
                return (
                  <TouchableOpacity
                    key={tmpl.id}
                    style={[styles.templateChip, active && styles.templateChipActive]}
                    onPress={() => updateField('templateStyle', tmpl.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.templateChipText, active && styles.templateChipTextActive]}>{tmpl.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <Text style={[styles.label, { marginTop: 16, marginBottom: 8 }]}>Live Preview</Text>
        
        <View style={[
          styles.previewContainer,
          form.useSystemGenerated && form.templateStyle === 'TEMPLATE_B' && styles.previewTmplB,
          form.useSystemGenerated && form.templateStyle === 'TEMPLATE_C' && styles.previewTmplC,
          !form.useSystemGenerated && form.templateStyle === 'PLAIN' && styles.previewPlain,
          !form.useSystemGenerated && form.templateStyle === 'BACKGROUND' && styles.previewBackground,
        ]}>
          {/* RENDER HEADERS CONDITIONALLY */}
          {form.useSystemGenerated ? (
            <View style={[
              styles.previewHeader,
              form.templateStyle === 'TEMPLATE_C' && styles.previewHeaderC
            ]}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.previewLogo} />
              ) : (
                <View style={styles.previewLogoPlaceholder}><Text style={{ fontSize: 10, color: colors.textMuted }}>Logo</Text></View>
              )}
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[
                  styles.previewName,
                  form.templateStyle === 'TEMPLATE_B' && { color: '#0F766E', textAlign: 'center' },
                  form.templateStyle === 'TEMPLATE_C' && { color: '#EAB308' }
                ]}>
                  {form.clinicName || 'CLINIC NAME'}
                </Text>
                <Text style={[
                  styles.previewSubtitle,
                  form.templateStyle === 'TEMPLATE_B' && { textAlign: 'center' }
                ]}>
                  {form.clinicEmail || 'clinic@email.com'} | {form.clinicPhone || 'Phone'}
                </Text>
              </View>
            </View>
          ) : !form.useSystemGenerated && form.templateStyle === 'BACKGROUND' ? (
            <View style={styles.previewDesignHeader}>
              {designUrl ? (
                <Image source={{ uri: designUrl }} style={StyleSheet.absoluteFillObject} />
              ) : null}
              <Text style={styles.designModeOverlay}>{designUrl ? 'Pre-designed Background Active' : 'No background design uploaded'}</Text>
            </View>
          ) : (
            <View style={styles.previewPlainHeader}>
              <Text style={styles.plainModeOverlay}>Plain Notepad Mode (Pre-printed Paper)</Text>
            </View>
          )}

          {/* DIVIDER FOR SYSTEM GENERATED */}
          {form.useSystemGenerated && (
            <View style={[
              styles.previewDivider,
              form.templateStyle === 'TEMPLATE_B' && styles.previewDividerB,
              form.templateStyle === 'TEMPLATE_C' && styles.previewDividerC
            ]} />
          )}

          {/* PRESCRIPTION PLACEHOLDER BODY */}
          <View style={[
            styles.previewBody, 
            !form.useSystemGenerated && { marginTop: 12 }
          ]}>
            <Text style={styles.previewRx}>Rx</Text>
            <View style={styles.previewLine} />
            <View style={styles.previewLine} />
          </View>

          {/* FOOTER */}
          <View style={styles.previewFooter}>
            <Text style={styles.previewFooterText}>{form.useSystemGenerated ? (form.clinicAddress || 'Clinic Address') : 'Print area continues...'}</Text>
            {signatureUrl ? (
              <Image source={{ uri: signatureUrl }} style={styles.previewSignature} />
            ) : (
              <Text style={styles.previewDigitalSign}>Dr. {user?.name || 'Doctor'}</Text>
            )}
          </View>
        </View>

        {/* FULL PAGE PREVIEW TRIGGER BUTTON */}
        <TouchableOpacity 
          style={styles.fullPageBtn} 
          onPress={() => setFullPageVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.fullPageBtnText}>🔍 View Full Page A4 Preview</Text>
        </TouchableOpacity>
      </View>

      {/* FULL PAGE PREVIEW MODAL */}
      <Modal visible={fullPageVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Full Page Print Preview (A4)</Text>
              <TouchableOpacity onPress={() => setFullPageVisible(false)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalScroll} bounces={false}>
              <View style={styles.a4Page}>
                {/* 1. Pre-designed Background image if active */}
                {!form.useSystemGenerated && form.templateStyle === 'BACKGROUND' && designUrl && (
                  <Image source={{ uri: designUrl }} style={StyleSheet.absoluteFillObject} />
                )}
                
                <View style={[
                  styles.a4Content,
                  !form.useSystemGenerated && form.templateStyle === 'BACKGROUND' && { paddingTop: 130 },
                  !form.useSystemGenerated && form.templateStyle === 'PLAIN' && { paddingTop: 100 }
                ]}>
                  {/* 2. System Generated Header */}
                  {form.useSystemGenerated && (
                    <View style={[
                      styles.a4SystemHeader,
                      form.templateStyle === 'TEMPLATE_B' && styles.a4HeaderB,
                      form.templateStyle === 'TEMPLATE_C' && styles.a4HeaderC
                    ]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {logoUrl ? (
                          <Image source={{ uri: logoUrl }} style={styles.a4Logo} />
                        ) : (
                          <View style={styles.a4LogoPlaceholder}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFF' }}>
                              {form.clinicName ? form.clinicName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3) : 'CF'}
                            </Text>
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 16 }}>
                          <Text style={[
                            styles.a4ClinicName,
                            form.templateStyle === 'TEMPLATE_B' && { color: '#0F766E', textAlign: 'center' },
                            form.templateStyle === 'TEMPLATE_C' && { color: '#EAB308' }
                          ]}>
                            {form.clinicName || 'YOUR CLINIC NAME'}
                          </Text>
                          <Text style={[
                            styles.a4ClinicSubtitle,
                            form.templateStyle === 'TEMPLATE_B' && { textAlign: 'center' }
                          ]}>
                            {form.clinicEmail || 'info@clinic.com'} | {form.clinicPhone || '+91-9876543210'}
                          </Text>
                        </View>
                      </View>
                      <View style={[
                        styles.a4HeaderDivider,
                        form.templateStyle === 'TEMPLATE_B' && styles.a4DividerB,
                        form.templateStyle === 'TEMPLATE_C' && styles.a4DividerC
                      ]} />
                    </View>
                  )}

                  {/* 3. Prescription Title */}
                  <View style={styles.a4TitleRow}>
                    <Text style={styles.a4PrescriptionTitle}>Medical Prescription</Text>
                  </View>
                  
                  {/* Dummy Patient Info */}
                  <View style={styles.a4PatientTable}>
                    <View style={styles.a4PatientRow}>
                      <Text style={styles.a4PatientLabel}>Patient Name:</Text>
                      <Text style={styles.a4PatientVal}>John Doe (Male, 35 Yrs)</Text>
                    </View>
                    <View style={styles.a4PatientRow}>
                      <Text style={styles.a4PatientLabel}>Date:</Text>
                      <Text style={styles.a4PatientVal}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <View style={styles.a4PatientRow}>
                      <Text style={styles.a4PatientLabel}>Diagnosis:</Text>
                      <Text style={styles.a4PatientVal}>Acute Viral Pharyngitis</Text>
                    </View>
                  </View>

                  {/* Rx Medicine Table */}
                  <View style={{ marginTop: 28, flex: 1 }}>
                    <Text style={styles.a4Rx}>Rx</Text>
                    <View style={styles.a4MedicineHeader}>
                      <Text style={[styles.a4MedCol, { flex: 2 }]}>Medicine</Text>
                      <Text style={styles.a4MedCol}>Dosage</Text>
                      <Text style={styles.a4MedCol}>Frequency</Text>
                      <Text style={styles.a4MedCol}>Duration</Text>
                    </View>
                    <View style={styles.a4MedicineRow}>
                      <Text style={[styles.a4MedVal, { flex: 2, fontWeight: '700', color: colors.text }]}>Tab. Paracetamol 650 mg</Text>
                      <Text style={styles.a4MedVal}>1 tab</Text>
                      <Text style={styles.a4MedVal}>Thrice daily</Text>
                      <Text style={styles.a4MedVal}>5 days</Text>
                    </View>
                    <View style={styles.a4MedicineRow}>
                      <Text style={[styles.a4MedVal, { flex: 2, fontWeight: '700', color: colors.text }]}>Syr. Amoxicillin 250 mg / 5 mL</Text>
                      <Text style={styles.a4MedVal}>5 mL</Text>
                      <Text style={styles.a4MedVal}>Twice daily</Text>
                      <Text style={styles.a4MedVal}>7 days</Text>
                    </View>
                  </View>
                  
                  {/* Doctor Signature */}
                  <View style={styles.a4SignatureContainer}>
                    {signatureUrl ? (
                      <Image source={{ uri: signatureUrl }} style={styles.a4SignatureImg} />
                    ) : (
                      <Text style={styles.a4SignatureDigital}>Dr. {user?.name || 'Doctor'}</Text>
                    )}
                    <View style={styles.a4SignatureLine} />
                    <Text style={styles.a4SignatureTitle}>Doctor's Signature</Text>
                  </View>
                  
                  {form.useSystemGenerated && (
                    <View style={styles.a4Footer}>
                      <Text style={styles.a4FooterText}>{form.clinicAddress || 'Clinic Address'}</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  toggleDesc: { fontSize: 11, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 2 },
  toggleTrackActive: { backgroundColor: colors.primary },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', ...shadows.sm },
  toggleKnobActive: { alignSelf: 'flex-end' },
  templateRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  templateChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  templateChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  templateChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  templateChipTextActive: { color: '#FFFFFF' },
  previewContainer: { backgroundColor: '#F8FAFC', borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#CBD5E1', padding: 12, marginTop: 10, minHeight: 180 },
  previewTmplB: { borderTopWidth: 4, borderTopColor: '#0F766E' },
  previewTmplC: { backgroundColor: '#F1F5F9', borderLeftWidth: 4, borderLeftColor: '#EAB308' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  previewHeaderC: { backgroundColor: '#1E293B', padding: 8, borderRadius: 4 },
  previewLogo: { width: 32, height: 32, borderRadius: 4, resizeMode: 'contain' },
  previewLogoPlaceholder: { width: 32, height: 32, borderRadius: 4, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  previewName: { fontSize: 13, fontWeight: '800', color: colors.primary },
  previewSubtitle: { fontSize: 9, color: colors.textMuted, marginTop: 1 },
  previewDivider: { height: 2, backgroundColor: colors.primary, marginVertical: 6 },
  previewDividerB: { height: 3, borderBottomWidth: 1, borderBottomColor: '#0F766E', borderTopWidth: 1, borderTopColor: '#0F766E', backgroundColor: 'transparent' },
  previewDividerC: { height: 1.5, backgroundColor: '#EAB308' },
  previewBody: { flex: 1, minHeight: 60, paddingVertical: 4 },
  previewRx: { fontSize: 14, fontWeight: '800', color: colors.textMuted, fontStyle: 'italic' },
  previewLine: { height: 6, backgroundColor: '#E2E8F0', width: '80%', borderRadius: 3, marginTop: 6 },
  previewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 6, marginTop: 8 },
  previewFooterText: { fontSize: 8, color: colors.textMuted, flex: 1 },
  previewSignature: { width: 36, height: 18, resizeMode: 'contain' },
  
  // Mode selection & preview styles
  modeSelectorRow: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: borderRadius.md, padding: 4, borderWidth: 1, borderColor: colors.borderLight, marginBottom: 12 },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: borderRadius.sm },
  modeTabActive: { backgroundColor: colors.primary, ...shadows.sm },
  modeTabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  modeTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  previewPlain: { borderStyle: 'dashed' },
  previewBackground: { backgroundColor: '#F1F5F9' },
  previewPlainHeader: { height: 32, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borderLight, borderStyle: 'dashed', backgroundColor: colors.bg, borderRadius: 4 },
  plainModeOverlay: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  previewDesignHeader: { height: 44, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' },
  designModeOverlay: { fontSize: 10, fontWeight: '700', color: colors.textMuted, zIndex: 10, backgroundColor: '#FFFFFFCC', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  previewDigitalSign: { fontSize: 10, fontStyle: 'italic', color: colors.primary, fontWeight: '600' },
  fullPageBtn: { backgroundColor: colors.successLight, borderRadius: borderRadius.md, paddingVertical: 12, alignItems: 'center', marginTop: 14, borderWidth: 1, borderColor: colors.success + '30' },
  fullPageBtnText: { color: colors.success, fontSize: 13, fontWeight: '700' },
  
  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalClose: { fontSize: 20, color: colors.textSecondary, fontWeight: '700' },
  modalScroll: { padding: 20, alignItems: 'center' },
  a4Page: { width: 340, height: 480, backgroundColor: '#FFFFFF', borderRadius: 4, borderWidth: 1, borderColor: '#CBD5E1', padding: 20, ...shadows.md, overflow: 'hidden', position: 'relative' },
  a4Content: { flex: 1, justifyContent: 'space-between' },
  a4SystemHeader: { marginBottom: 12 },
  a4HeaderB: { borderBottomWidth: 1.5, borderBottomColor: '#0F766E', borderStyle: 'dashed', borderTopWidth: 3, borderTopColor: '#0F766E', paddingTop: 4 },
  a4HeaderC: { backgroundColor: '#1E293B', padding: 10, borderRadius: 4 },
  a4Logo: { width: 40, height: 40, borderRadius: 6, resizeMode: 'contain' },
  a4LogoPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center' },
  a4ClinicName: { fontSize: 15, fontWeight: '800', color: '#1E3A8A' },
  a4ClinicSubtitle: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  a4HeaderDivider: { height: 2, backgroundColor: '#1E3A8A', marginTop: 10 },
  a4DividerB: { display: 'none' },
  a4DividerC: { backgroundColor: '#EAB308', height: 1.5 },
  a4TitleRow: { alignItems: 'center', marginVertical: 8 },
  a4PrescriptionTitle: { fontSize: 12, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 2 },
  a4PatientTable: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4, padding: 8, marginTop: 4 },
  a4PatientRow: { flexDirection: 'row', marginVertical: 2 },
  a4PatientLabel: { fontSize: 9, color: colors.textSecondary, width: 80, fontWeight: '600' },
  a4PatientVal: { fontSize: 9, color: colors.text, fontWeight: '700' },
  a4Rx: { fontSize: 20, fontWeight: '800', color: colors.text, marginVertical: 6, fontStyle: 'italic' },
  a4MedicineHeader: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 6, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  a4MedCol: { flex: 1, fontSize: 8, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
  a4MedicineRow: { flexDirection: 'row', padding: 6, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  a4MedVal: { flex: 1, fontSize: 8, color: colors.text },
  a4SignatureContainer: { alignItems: 'flex-end', marginTop: 20 },
  a4SignatureImg: { width: 60, height: 24, resizeMode: 'contain' },
  a4SignatureDigital: { fontSize: 12, fontStyle: 'italic', color: '#1E3A8A', fontFamily: 'Georgia' },
  a4SignatureLine: { width: 100, height: 1, backgroundColor: colors.border, marginTop: 4 },
  a4SignatureTitle: { fontSize: 8, color: colors.textSecondary, marginTop: 2 },
  a4Footer: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 6, marginTop: 10, alignItems: 'center' },
  a4FooterText: { fontSize: 7, color: colors.textMuted, textAlign: 'center' }
});
