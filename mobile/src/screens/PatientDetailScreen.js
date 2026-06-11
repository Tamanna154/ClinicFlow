import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Linking, Platform, Modal, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { patientApi } from '../api/patientApi';
import { billingApi } from '../api/billingApi';
import { consultationApi } from '../api/consultationApi';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { useSettings } from '../context/SettingsContext';
import Avatar from '../components/Avatar';
import { colors, shadows, borderRadius, getGenderStyle } from '../theme';
import { sharePrescription, downloadPrescription } from '../utils/pdfHelper';
import { letterheadApi } from '../api/letterheadApi';
import { prescriptionApi } from '../api/prescriptionApi';

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ icon, label, value, isLink }) {
  if (value == null || String(value).trim() === '') return null;
  const content = (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, isLink && { color: colors.primaryLight, textDecorationLine: 'underline' }]}>{String(value)}</Text>
      </View>
    </View>
  );
  if (isLink && (String(value).startsWith('http') || String(value).startsWith('tel'))) {
    return (
      <TouchableOpacity onPress={() => Linking.openURL(String(value))} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

export default function PatientDetailScreen({ route, navigation }) {
  const initial = route.params.patient;
  const [patient, setPatient] = useState(initial);
  const [visits, setVisits] = useState([]);
  const [bills, setBills] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyModalVisible, setFamilyModalVisible] = useState(false);
  const [famName, setFamName] = useState('');
  const [famRelationship, setFamRelationship] = useState('Spouse');
  const [famAge, setFamAge] = useState('');
  const [famGender, setFamGender] = useState('Male');
  const [famPhone, setFamPhone] = useState('');
  const [famHistory, setFamHistory] = useState('');
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { formatCurrency } = useSettings();
  const isDoctor = user?.role === 'DOCTOR';
  const canManage = hasPermission('MANAGE_PATIENTS');

  useFocusEffect(useCallback(() => {
    let mounted = true;
    (async () => {
      try { const d = await patientApi.getById(initial.id); if (mounted) setPatient(d); }
      catch (e) { console.log(e.message); }
      try { const v = await patientApi.getVisits(initial.id); if (mounted) setVisits(v); }
      catch (e) { console.log(e.message); }
      try { const b = await billingApi.getAll(); if (mounted) setBills(b.filter(bill => bill.patientId === initial.id)); }
      catch (e) { console.log(e.message); }
      try { const c = await consultationApi.getPatientHistory(initial.id); if (mounted) setConsultations(c); }
      catch (e) { console.log(e.message); }
      try {
        const base = require('../api/apiBase').getApiBase();
        const res = await require('../api/client').authFetch(`${base}/patients/${initial.id}/family`);
        if (res.ok && mounted) {
          const data = await res.json();
          setFamilyMembers(data);
        }
      } catch (e) {
        console.log(e.message);
      }
    })();
    return () => { mounted = false; };
  }, [initial.id]));

  const handleAddFamilyMember = async () => {
    if (!famName.trim()) { Alert.alert('Required', 'Please enter a name'); return; }
    try {
      const base = require('../api/apiBase').getApiBase();
      const res = await require('../api/client').authFetch(`${base}/patients/${patient.id}/family`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: famName.trim(),
          relationship: famRelationship,
          age: famAge ? parseInt(famAge, 10) : null,
          gender: famGender,
          phone: famPhone.trim() || null,
          medicalHistory: famHistory.trim() || null
        })
      });
      if (res.ok) {
        Alert.alert('Success', 'Family member added!');
        setFamilyModalVisible(false);
        setFamName('');
        setFamRelationship('Spouse');
        setFamAge('');
        setFamGender('Male');
        setFamPhone('');
        setFamHistory('');
        const refreshed = await res.json();
        setFamilyMembers(prev => [...prev, refreshed]);
      } else {
        Alert.alert('Error', 'Failed to add family member');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleEdit = () => navigation.navigate('PatientForm', { patient });
  const handleDelete = () => {
    Alert.alert('Delete Patient', `Remove ${patient.name} permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { setLoading(true); await patientApi.delete(patient.id); navigation.navigate('PatientList'); }
        catch (e) { Alert.alert('Error', e.message); } finally { setLoading(false); }
      }},
    ]);
  };

  const handleArchive = async () => {
    try { setLoading(true); const p = await patientApi.archive(patient.id); setPatient(p); Alert.alert('Archived', 'Patient has been archived.'); }
    catch (e) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const handleRestore = async () => {
    try { setLoading(true); const p = await patientApi.restore(patient.id); setPatient(p); Alert.alert('Restored', 'Patient has been restored.'); }
    catch (e) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const gs = getGenderStyle(patient.gender);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Avatar name={patient.name} size={72} />
          <Text style={styles.name}>{patient.name}</Text>
          {patient.createdByName && <Text style={styles.addedBy}>Added by {patient.createdByName}</Text>}
          <View style={styles.metaRow}>
            {patient.gender && <View style={[styles.metaPill, { backgroundColor: gs.bg }]}><Text style={[styles.metaPillText, { color: gs.text }]}>{patient.gender}</Text></View>}
            {patient.age != null && <View style={styles.metaPill}><Text style={[styles.metaPillText, { color: colors.textSecondary }]}>{patient.age} years</Text></View>}
            {patient.bloodGroup && <View style={[styles.metaPill, { backgroundColor: colors.errorLight }]}><Text style={[styles.metaPillText, { color: colors.error, fontWeight: '700' }]}>{patient.bloodGroup}</Text></View>}
            {patient.archived && <View style={[styles.metaPill, { backgroundColor: colors.warningLight }]}><Text style={[styles.metaPillText, { color: colors.warning }]}>Archived</Text></View>}
          </View>
        </View>

        <Section title="Contact">
          <Row icon="📞" label="Phone" value={patient.phone} isLink />
          <Row icon="✉️" label="Email" value={patient.email} />
          <Row icon="📍" label="Address" value={patient.address} />
        </Section>

        <Section title="Medical Info">
          <Row icon="🩸" label="Blood Group" value={patient.bloodGroup} />
          <Row icon="⚕️" label="Allergies" value={patient.allergies} />
          <Row icon="📋" label="Medical History" value={patient.medicalHistory} />
          <Row icon="💊" label="Medications" value={patient.medications} />
        </Section>

        <Section title="Family Members">
          {canManage && (
            <TouchableOpacity style={styles.addFamilyInlineBtn} onPress={() => setFamilyModalVisible(true)} activeOpacity={0.7}>
              <Text style={styles.addFamilyInlineText}>+ Add Member</Text>
            </TouchableOpacity>
          )}
          {familyMembers.length === 0 ? (
            <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 }}>No family members added</Text>
          ) : (
            familyMembers.map((m) => (
              <View key={m.id} style={styles.familyCard}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.familyName}>{m.name} ({m.relationship})</Text>
                    {canManage && (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert('Delete', 'Delete this family member?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: async () => {
                              try {
                                const base = require('../api/apiBase').getApiBase();
                                const res = await require('../api/client').authFetch(`${base}/patients/${patient.id}/family/${m.id}`, { method: 'DELETE' });
                                if (res.ok) {
                                  setFamilyMembers(prev => prev.filter(item => item.id !== m.id));
                                }
                              } catch (ex) { Alert.alert('Error', ex.message); }
                            }}
                          ]);
                        }}
                      >
                        <Text style={{ color: colors.error, fontSize: 13 }}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.familyDetails}>Age: {m.age || '-'} | Gender: {m.gender || '-'} {m.phone ? `| Phone: ${m.phone}` : ''}</Text>
                  {m.medicalHistory ? <Text style={styles.familyMedical}>History: {m.medicalHistory}</Text> : null}
                </View>
              </View>
            ))
          )}
        </Section>

        <Section title="Emergency Contact">
          <Row icon="👤" label="Name" value={patient.emergencyContactName} />
          <Row icon="📞" label="Phone" value={patient.emergencyContactPhone} isLink />
        </Section>

        {consultations.length > 0 && (
          <Section title={`Consultation History (${consultations.length})`}>
            {consultations.map((c) => (
              <View key={c.id} style={styles.visitCard}>
                <View style={styles.visitHeader}>
                  <Text style={styles.visitDate}>{formatDate(c.createdAt)}</Text>
                  {c.diagnosis && <Text style={styles.visitDoctor}>{c.diagnosis}</Text>}
                </View>
                {c.symptoms && <Text style={styles.visitDetail}><Text style={styles.visitLabel}>Symptoms: </Text>{c.symptoms}</Text>}
                {c.doctorNotes && <Text style={styles.visitDetail}><Text style={styles.visitLabel}>Notes: </Text>{c.doctorNotes}</Text>}
                {c.bloodPressure && <Text style={styles.visitDetail}><Text style={styles.visitLabel}>BP: </Text>{c.bloodPressure}</Text>}
                {c.weight && <Text style={styles.visitDetail}><Text style={styles.visitLabel}>Weight: </Text>{c.weight} kg</Text>}
                {c.followUpDate && <Text style={styles.visitDetail}><Text style={styles.visitLabel}>Follow-Up: </Text>{c.followUpDate}</Text>}
                {c.bill && <Text style={styles.visitDetail}><Text style={styles.visitLabel}>Bill: </Text>{formatCurrency(c.bill.totalAmount)} - {c.bill.paymentStatus}</Text>}
                {c.doctorNotes && (
                  <View style={styles.prescriptionActions}>
                    <TouchableOpacity
                      style={styles.rxBtn}
                      onPress={async () => {
                        try {
                          let lh = null;
                          try { lh = await letterheadApi.get(c.doctorId); } catch (ex) {}
                          let medicines = [];
                          try {
                            const rx = await prescriptionApi.getByConsultation(c.id);
                            medicines = rx.medicines || [];
                          } catch (ex) {}
                          const consultationWithMeds = { ...c, medicines };
                          await sharePrescription(consultationWithMeds, patient.name, lh);
                        }
                        catch (e) { Alert.alert('Error', e.message); }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.rxBtnText}>↗ Share Rx</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rxBtn}
                      onPress={async () => {
                        try {
                          let lh = null;
                          try { lh = await letterheadApi.get(c.doctorId); } catch (ex) {}
                          let medicines = [];
                          try {
                            const rx = await prescriptionApi.getByConsultation(c.id);
                            medicines = rx.medicines || [];
                          } catch (ex) {}
                          const consultationWithMeds = { ...c, medicines };
                          await downloadPrescription(consultationWithMeds, patient.name, lh);
                          Alert.alert('Downloaded', 'Prescription PDF saved.');
                        } catch (e) { Alert.alert('Error', e.message); }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.rxBtnText}>↓ Download Rx</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </Section>
        )}

        {visits.length > 0 && (
          <Section title={`Visit History (${visits.length})`}>
            {visits.map((v) => (
              <View key={v.id} style={styles.visitCard}>
                <View style={styles.visitHeader}>
                  <Text style={styles.visitDate}>{formatDate(v.visitDate)}</Text>
                  {v.diagnosis && <Text style={styles.visitDoctor}>Dr. {v.doctorName || 'Unknown'}</Text>}
                </View>
                {v.diagnosis && <Text style={styles.visitDetail}><Text style={styles.visitLabel}>Diagnosis: </Text>{v.diagnosis}</Text>}
                {v.prescription && <Text style={styles.visitDetail}><Text style={styles.visitLabel}>Prescription: </Text>{v.prescription}</Text>}
                {v.additionalNotes && <Text style={styles.visitDetail}><Text style={styles.visitLabel}>Notes: </Text>{v.additionalNotes}</Text>}
              </View>
            ))}
          </Section>
        )}

        {bills.length > 0 && (
          <Section title={`Bills (${bills.length})`}>
            {bills.map((b) => {
              const ss = b.paymentStatus === 'PAID' ? colors.success : b.paymentStatus === 'PENDING' ? colors.warning : colors.textMuted;
              return (
                <TouchableOpacity key={b.id} style={styles.billCard}
                  onPress={() => navigation.navigate('Billing', { screen: 'BillDetail', params: { billId: b.id } })}
                  activeOpacity={0.7}>
                  <View style={styles.billTop}>
                    <Text style={styles.billNumber}>{b.billNumber}</Text>
                    <View style={[styles.billStatusBadge, { backgroundColor: ss + '15' }]}>
                      <Text style={[styles.billStatusText, { color: ss }]}>{b.paymentStatus}</Text>
                    </View>
                  </View>
                  <View style={styles.billBottom}>
                    <Text style={styles.billAmount}>{formatCurrency(b.totalAmount)}</Text>
                    <Text style={styles.billDate}>{new Date(b.createdAt).toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Section>
        )}
      </ScrollView>

      {canManage && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.8}>
            <Text style={styles.btnText}>Edit</Text>
          </TouchableOpacity>
          {!patient.archived ? (
            <TouchableOpacity style={styles.archiveBtn} onPress={handleArchive} activeOpacity={0.8}>
              <Text style={[styles.btnText, { color: colors.text }]}>Archive</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.8}>
              <Text style={styles.btnText}>Restore</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
            <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Del</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Family Member Modal */}
      <Modal animationType="slide" transparent={true} visible={familyModalVisible} onRequestClose={() => setFamilyModalVisible(false)}>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Family Member</Text>

              <Text style={styles.fieldLabel}>Name *</Text>
              <TextInput style={styles.modalInput} value={famName} onChangeText={setFamName} placeholder="Name" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>Relationship</Text>
              <View style={styles.selectorRow}>
                {['Spouse', 'Child', 'Parent', 'Sibling', 'Other'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.selectorBtn, famRelationship === r && styles.selectorBtnActive]}
                    onPress={() => setFamRelationship(r)}
                  >
                    <Text style={[styles.selectorBtnText, famRelationship === r && styles.selectorBtnTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Age</Text>
              <TextInput style={styles.modalInput} value={famAge} keyboardType="numeric" onChangeText={setFamAge} placeholder="Age" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.selectorRow}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.selectorBtn, famGender === g && styles.selectorBtnActive]}
                    onPress={() => setFamGender(g)}
                  >
                    <Text style={[styles.selectorBtnText, famGender === g && styles.selectorBtnTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput style={styles.modalInput} value={famPhone} keyboardType="phone-pad" onChangeText={setFamPhone} placeholder="Phone number" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>Medical History / Notes</Text>
              <TextInput style={[styles.modalInput, { minHeight: 60 }]} value={famHistory} onChangeText={setFamHistory} placeholder="e.g. Diabetes, Hypertension, allergies..." placeholderTextColor={colors.textMuted} multiline />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setFamilyModalVisible(false)}>
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={handleAddFamilyMember}>
                  <Text style={styles.saveModalBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  profileCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius['2xl'], padding: 24,
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.md,
  },
  avatar: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarText: { fontSize: 24, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  addedBy: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  metaPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  metaPillText: { fontSize: 12, fontWeight: '600' },
  section: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  rowIcon: { fontSize: 14, marginRight: 10, width: 20, textAlign: 'center', marginTop: 1 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 1 },
  rowValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  visitCard: {
    backgroundColor: colors.bg, borderRadius: borderRadius.md, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight,
  },
  visitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  visitDate: { fontSize: 12, fontWeight: '700', color: colors.primary },
  visitDoctor: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  visitDetail: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  visitLabel: { fontWeight: '600', color: colors.text },
  billCard: {
    backgroundColor: colors.bg, borderRadius: borderRadius.md, padding: 12,
    marginBottom: 6, borderWidth: 1, borderColor: colors.borderLight,
  },
  billTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billNumber: { fontSize: 13, fontWeight: '700', color: colors.text },
  billStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  billStatusText: { fontSize: 10, fontWeight: '700' },
  billBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.borderLight },
  billAmount: { fontSize: 14, fontWeight: '800', color: colors.primary },
  billDate: { fontSize: 11, color: colors.textMuted },
  footer: {
    flexDirection: 'row', backgroundColor: colors.surface, padding: 12, gap: 8,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  editBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 13, alignItems: 'center', ...shadows.sm },
  archiveBtn: { flex: 1, backgroundColor: colors.warningLight, borderRadius: borderRadius.md, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  restoreBtn: { flex: 1, backgroundColor: colors.successLight, borderRadius: borderRadius.md, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#BBF7D0' },
  deleteBtn: { width: 56, backgroundColor: colors.error, borderRadius: borderRadius.md, paddingVertical: 13, alignItems: 'center', ...shadows.sm },
  btnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  prescriptionActions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  rxBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary + '08', borderRadius: borderRadius.sm, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.primary + '20', gap: 4,
  },
  rxBtnText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  
  // Family Styles
  addFamilyInlineBtn: { backgroundColor: colors.primary + '15', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-end', marginBottom: 8 },
  addFamilyInlineText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  familyCard: { backgroundColor: colors.bg, borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight },
  familyName: { fontSize: 14, fontWeight: '800', color: colors.text },
  familyDetails: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  familyMedical: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  
  // Modal styles
  modalBg: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(11, 26, 43, 0.5)', padding: 16 },
  modalScroll: { flexGrow: 1, justifyContent: 'center', width: '100%' },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 20,
    width: '100%',
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12, textAlign: 'center' },
  fieldLabel: { fontSize: 11, fontWeight: '750', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 10 },
  modalInput: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorRow: { flexDirection: 'row', gap: 6, marginVertical: 4, flexWrap: 'wrap' },
  selectorBtn: { flex: 1, minWidth: '22%', paddingVertical: 8, borderRadius: borderRadius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  selectorBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  selectorBtnText: { fontSize: 11, fontWeight: '750', color: colors.textSecondary },
  selectorBtnTextActive: { color: '#FFFFFF' },
  modalButtonRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelModalBtn: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelModalBtnText: { fontSize: 13, fontWeight: '750', color: colors.textSecondary },
  saveModalBtn: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center' },
  saveModalBtnText: { fontSize: 13, fontWeight: '750', color: '#FFFFFF' }
});
