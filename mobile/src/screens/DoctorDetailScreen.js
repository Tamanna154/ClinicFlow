import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Linking, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doctorApi } from '../api/doctorApi';
import { appointmentApi } from '../api/appointmentApi';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { useSettings } from '../context/SettingsContext';
import Avatar, { StatusDot } from '../components/Avatar';
import AppointmentCard from '../components/AppointmentCard';
import { colors, shadows, borderRadius } from '../theme';

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, icon, isLink, onPress }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon && <Text style={styles.rowIcon}>{icon}</Text>}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <TouchableOpacity disabled={!isLink} onPress={onPress}>
        <Text style={[styles.rowValue, isLink && styles.linkText]}>{String(value)}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DoctorDetailScreen({ route, navigation }) {
  const initial = route.params.doctor;
  const [doctor, setDoctor] = useState(initial);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { formatCurrency } = useSettings();
  const canManage = user?.role === 'DOCTOR';

  useFocusEffect(useCallback(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [d, a] = await Promise.all([
          doctorApi.getById(initial.id),
          appointmentApi.getByDoctor(initial.id),
        ]);
        if (mounted) { setDoctor(d); setAppointments(a); }
      } catch (e) { console.log(e.message); }
    };
    load();
    return () => { mounted = false; };
  }, [initial.id]));

  const handleEdit = () => navigation.navigate('DoctorForm', { doctor });
  const handleDelete = () => {
    Alert.alert('Delete Doctor', `Remove Dr. ${doctor.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { setLoading(true); await doctorApi.delete(doctor.id); navigation.goBack(); }
        catch (e) { Alert.alert('Error', e.message); } finally { setLoading(false); }
      } },
    ]);
  };

  const recent = appointments.slice(0, 5);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View>
            <Avatar name={doctor.name} size={72} />
            {doctor.isActive && <StatusDot size={12} />}
          </View>
          <Text style={styles.name}>Dr. {doctor.name}</Text>
          {doctor.specialization && (
            <View style={styles.specBadge}><Text style={styles.specText}>{doctor.specialization}</Text></View>
          )}
          <View style={[styles.statusBadge, doctor.isActive ? styles.statusActive : styles.statusInactive]}>
            <View style={[styles.statusDot, doctor.isActive ? styles.dotActive : styles.dotInactive]} />
            <Text style={[styles.statusText, doctor.isActive ? { color: colors.success } : { color: colors.textMuted }]}>
              {doctor.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <Section title="Contact & Practice">
          <Row icon="✉️" label="Email" value={doctor.email} isLink onPress={() => Linking.openURL(`mailto:${doctor.email}`)} />
          <Row icon="📞" label="Phone" value={doctor.phone} isLink onPress={() => { const url = `${Platform.OS === 'ios' ? 'telprompt' : 'tel'}:${doctor.phone?.replace(/[^\d+]/g, '')}`; Linking.canOpenURL(url).then(s => s && Linking.openURL(url)); }} />
          <Row icon="🎓" label="Qualifications" value={doctor.qualifications} />
        </Section>

        {doctor.achievements?.length > 0 && (
          <Section title="Achievements">
            {doctor.achievements.map((ach, idx) => (
              <View key={idx} style={styles.achievementCard}>
                <View style={styles.achievementDot} />
                <View style={styles.achievementContent}>
                  <View style={styles.achievementTitleRow}>
                    <Text style={styles.achievementTitle}>{ach.title}</Text>
                    {ach.year ? <Text style={styles.achievementYear}>{ach.year}</Text> : null}
                  </View>
                  {ach.description ? <Text style={styles.achievementDesc}>{ach.description}</Text> : null}
                </View>
              </View>
            ))}
          </Section>
        )}

        {doctor.achievements?.length === 0 && (
          <Section title="Achievements">
            <Text style={styles.emptyText}>No achievements listed</Text>
          </Section>
        )}

        {doctor.bio && (
          <Section title="About">
            <Text style={styles.bioText}>{doctor.bio}</Text>
          </Section>
        )}

        {canManage && (
          <TouchableOpacity style={styles.incomeBtn} onPress={() => navigation.navigate('Income')} activeOpacity={0.8}>
            <Text style={styles.incomeIcon}>📊</Text>
            <View style={styles.incomeContent}>
              <Text style={styles.incomeTitle}>Financial Reports</Text>
              <Text style={styles.incomeSub}>Income, expenses & profit summary</Text>
            </View>
            <Text style={styles.incomeArrow}>›</Text>
          </TouchableOpacity>
        )}

        {doctor.consultationFee != null && (
          <Section title="Consultation Fee">
            <Text style={styles.feeText}>{formatCurrency(doctor.consultationFee)}</Text>
          </Section>
        )}

        {doctor.googleCalendarEnabled && (
          <View style={styles.calendarCard}>
            <Text style={styles.calendarIcon}>▣</Text>
            <View>
              <Text style={styles.calendarTitle}>Google Calendar Sync</Text>
              <Text style={styles.calendarDesc}>Appointments auto-create calendar events</Text>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>Recent Appointments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AppointmentList', { doctorId: doctor.id, doctorName: doctor.name })}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <Text style={styles.emptyText}>No appointments yet</Text>
        ) : (
          recent.map((a) => (
            <AppointmentCard key={a.id} appointment={a} onPress={() => navigation.navigate('AppointmentDetail', { appointment: a })} />
          ))
        )}

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => navigation.navigate('AppointmentBooking', { doctorId: doctor.id, doctorName: doctor.name })}
          activeOpacity={0.8}
        >
          <Text style={styles.bookBtnText}>Book Appointment</Text>
        </TouchableOpacity>
      </ScrollView>

      {canManage && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.editBtn} onPress={handleEdit}><Text style={styles.btnText}>Edit</Text></TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}><Text style={[styles.btnText, { color: '#FFFFFF' }]}>Delete</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  profileCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius['2xl'], padding: 28,
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.md,
  },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 12, marginBottom: 8, letterSpacing: -0.3 },
  specBadge: { backgroundColor: colors.primary + '10', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  specText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusActive: { backgroundColor: colors.successLight },
  statusInactive: { backgroundColor: colors.bg },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  dotActive: { backgroundColor: colors.success },
  dotInactive: { backgroundColor: colors.textMuted },
  statusText: { fontSize: 12, fontWeight: '600' },
  section: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { fontSize: 13, marginRight: 8, width: 18, textAlign: 'center' },
  rowLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  rowValue: { fontSize: 13, color: colors.text, fontWeight: '600', textAlign: 'right' },
  linkText: { color: colors.primaryLight, textDecorationLine: 'underline' },
  bioText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', lineHeight: 20 },
  feeText: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  calendarCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight,
    borderWidth: 1, borderColor: '#BBF7D0', borderRadius: borderRadius.md,
    padding: 14, marginBottom: 12,
  },
  calendarIcon: { fontSize: 22, color: colors.success, marginRight: 12, fontWeight: '700' },
  calendarTitle: { fontSize: 14, fontWeight: '700', color: colors.success },
  calendarDesc: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4, paddingHorizontal: 4 },
  sectionHeaderTitle: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  viewAll: { fontSize: 13, fontWeight: '600', color: colors.primaryLight },
  emptyText: { textAlign: 'center', color: colors.textMuted, paddingVertical: 16, fontSize: 13 },
  incomeBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.xl, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  incomeIcon: { fontSize: 24, marginRight: 12 },
  incomeContent: { flex: 1 },
  incomeTitle: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  incomeSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  incomeArrow: { fontSize: 22, color: colors.border, fontWeight: '300' },
  bookBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', marginTop: 8, ...shadows.sm },
  bookBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  footer: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderLight },
  editBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', ...shadows.sm },
  deleteBtn: { flex: 1, backgroundColor: colors.error, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', ...shadows.sm },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  achievementCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  achievementDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 5, marginRight: 12 },
  achievementContent: { flex: 1 },
  achievementTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  achievementTitle: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  achievementYear: { fontSize: 12, fontWeight: '600', color: colors.primary },
  achievementDesc: { fontSize: 12, color: colors.textSecondary, fontWeight: '500', lineHeight: 18 },
});
