import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Linking, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { patientApi } from '../api/patientApi';
import { useAuth } from '../context/AuthContext';
import { colors, shadows, borderRadius, typography, getGenderStyle } from '../theme';

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, icon, isLink, onPress }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon && <Text style={styles.rowIcon}>{icon}</Text>}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <TouchableOpacity disabled={!isLink} onPress={onPress}>
        <Text style={[styles.rowValue, isLink && { color: colors.primaryLight, textDecorationLine: 'underline' }]}>{String(value)}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PatientDetailScreen({ route, navigation }) {
  const initial = route.params.patient;
  const [patient, setPatient] = useState(initial);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';

  useFocusEffect(useCallback(() => {
    let mounted = true;
    (async () => {
      try { const d = await patientApi.getById(initial.id); if (mounted) setPatient(d); }
      catch (e) { console.log(e.message); }
    })();
    return () => { mounted = false; };
  }, [initial.id]));

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

  const gs = getGenderStyle(patient.gender);
  const initials = patient.name?.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';
  const hasAllergies = patient.allergies && patient.allergies.trim().length > 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          {patient.archived && (
            <View style={styles.archivedBadge}><Text style={styles.archivedText}>ARCHIVED</Text></View>
          )}
          <View style={[styles.avatar, { backgroundColor: gs.bg }]}>
            <Text style={[styles.avatarText, { color: gs.text }]}>{initials}</Text>
          </View>
          <Text style={styles.name}>{patient.name}</Text>
          <View style={styles.badges}>
            {patient.gender && <View style={[styles.badge, { backgroundColor: gs.bg }]}><Text style={[styles.badgeText, { color: gs.text }]}>{patient.gender}</Text></View>}
            {patient.age != null && <View style={styles.badge}><Text style={styles.badgeText}>{patient.age}y</Text></View>}
            {patient.bloodGroup && <View style={[styles.badge, { backgroundColor: '#FEF2F2' }]}><Text style={[styles.badgeText, { color: '#DC2626' }]}>{patient.bloodGroup}</Text></View>}
          </View>
          {patient.createdByName && (
            <Text style={styles.createdBy}>Added by {patient.createdByName} ({patient.createdByType})</Text>
          )}
        </View>

        {hasAllergies && (
          <View style={styles.alertCard}>
            <Text style={styles.alertIcon}>!</Text>
            <View><Text style={styles.alertTitle}>Allergy Alert</Text><Text style={styles.alertText}>{patient.allergies}</Text></View>
          </View>
        )}

        <Section title="Contact">
          <Row icon="📞" label="Phone" value={patient.phone} isLink onPress={() => { const url = `${Platform.OS === 'ios' ? 'telprompt' : 'tel'}:${patient.phone?.replace(/[^\d+]/g, '')}`; Linking.canOpenURL(url).then(s => s && Linking.openURL(url)); }} />
          <Row icon="✉️" label="Email" value={patient.email} isLink onPress={() => Linking.openURL(`mailto:${patient.email}`)} />
          <Row icon="📍" label="Address" value={patient.address} />
        </Section>

        <Section title="Medical Records">
          <Row icon="🩸" label="Blood Group" value={patient.bloodGroup} />
          <Row icon="📋" label="History" value={patient.medicalHistory} />
        </Section>

        <Section title="Emergency Contact">
          <Row icon="👤" label="Person" value={patient.emergencyContactName} />
          <Row icon="📞" label="Phone" value={patient.emergencyContactPhone} isLink />
        </Section>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.8}><Text style={styles.btnText}>Edit</Text></TouchableOpacity>
        {!patient.archived ? (
          <TouchableOpacity style={styles.archiveBtn} onPress={handleArchive} activeOpacity={0.8}><Text style={[styles.btnText, { color: colors.text }]}>Archive</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.8}><Text style={styles.btnText}>Restore</Text></TouchableOpacity>
        )}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}><Text style={[styles.btnText, { color: '#FFFFFF' }]}>Del</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  profileCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.md },
  archivedBadge: { backgroundColor: colors.warningLight, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#FDE68A' },
  archivedText: { fontSize: 10, fontWeight: '800', color: colors.warning, letterSpacing: 1 },
  avatar: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 26, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 10 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  createdBy: { fontSize: 11, color: colors.textMuted, marginTop: 10, fontStyle: 'italic' },
  alertCard: { flexDirection: 'row', backgroundColor: colors.warningLight, borderWidth: 1, borderColor: '#FDE68A', borderRadius: borderRadius.md, padding: 14, marginBottom: 16 },
  alertIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.warning + '20', color: colors.warning, fontWeight: '800', textAlign: 'center', lineHeight: 24, fontSize: 14, marginRight: 10, overflow: 'hidden' },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 2 },
  alertText: { fontSize: 13, fontWeight: '500', color: '#92400E' },
  section: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: 12, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { fontSize: 13, marginRight: 8, width: 18, textAlign: 'center' },
  rowLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  rowValue: { fontSize: 13, color: colors.text, fontWeight: '600', textAlign: 'right' },
  footer: { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight },
  editBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', ...shadows.sm },
  archiveBtn: { flex: 1, backgroundColor: colors.warningLight, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  restoreBtn: { flex: 1, backgroundColor: colors.success, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center' },
  deleteBtn: { flex: 1, backgroundColor: colors.error, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
