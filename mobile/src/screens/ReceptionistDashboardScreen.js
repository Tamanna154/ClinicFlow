import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { appointmentApi } from '../api/appointmentApi';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows } from '../theme';

const today = new Date().toISOString().split('T')[0];

const QUICK_ACTIONS = [
  { label: 'Manage\nAppts', icon: '📅', screen: 'Appointments', params: { screen: 'AppointmentList' } },
  { label: 'Register\nPatient', icon: '👤', screen: 'Patients', params: { screen: 'PatientForm' } },
  { label: 'Book\nAppt', icon: '📖', screen: 'Appointments', params: { screen: 'AppointmentBooking' } },
  { label: 'View\nSchedule', icon: '🗓️', screen: 'Calendar', params: { screen: 'CalendarMain' } },
  { label: 'Send\nSMS', icon: '✉️', screen: 'Patients', params: { screen: 'BulkSms' } },
  { label: 'Follow-Ups', icon: '🔄', screen: null, params: null },
];

export default function ReceptionistDashboardScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout }
    ]);
  };

  const fetchData = useCallback(async (isRefresh) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const data = await appointmentApi.getByDate(today);
      setAppointments(Array.isArray(data) ? data : data?.appointments || []);
    } catch (e) {
      console.log(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleCheckIn = async (id) => {
    try {
      await appointmentApi.updateStatus(id, 'PATIENT_ARRIVED');
      await fetchData(false);
    } catch (e) {
      console.log(e.message);
    }
  };

  const todayAppts = appointments.filter(a =>
    a.appointmentDate === today || !a.appointmentDate
  );
  const totalToday = todayAppts.length;
  const checkedIn = todayAppts.filter(a => a.status === 'IN_PROGRESS' || a.status === 'PATIENT_ARRIVED').length;
  const pending = todayAppts.filter(a =>
    a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && a.status !== 'NO_SHOW' &&
    a.status !== 'IN_PROGRESS' && a.status !== 'PATIENT_ARRIVED'
  ).length;
  const walkins = todayAppts.filter(a => a.isWalkIn || a.type === 'WALK_IN').length;

  const waitingList = todayAppts.filter(a =>
    a.status === 'SCHEDULED' || a.status === 'CONFIRMED'
  );

  const followUps = todayAppts.filter(a => a.isFollowUp || a.type === 'FOLLOW_UP');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'R'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>Welcome, Staff Member</Text>
                <Text style={styles.name}>{user?.name || 'Receptionist'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                style={styles.bellBtn} 
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
              >
                <Text style={styles.bellIcon}>🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.bellBtn} 
                activeOpacity={0.7} 
                onPress={handleLogout}
                hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
              >
                <Text style={styles.bellIcon}>🚪</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerSub}>Manage the clinic front-desk operations efficiently</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => {
                if (action.screen && action.params) {
                  navigation.navigate(action.screen, action.params);
                }
              }}
            >
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>{action.icon}</Text>
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Overview scroll */}
        <Text style={styles.sectionLabel}>Today's Front-Desk Overview</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.overviewScroll}
          contentContainerStyle={styles.overviewContent}
        >
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{totalToday}</Text>
            <Text style={styles.overviewLabel}>Today's{'\n'}Appts</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{walkins}</Text>
            <Text style={styles.overviewLabel}>Walk-in{'\n'}Patients</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={[styles.overviewValue, { color: colors.info }]}>{checkedIn}</Text>
            <Text style={styles.overviewLabel}>Checked-in{'\n'}Patients</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={[styles.overviewValue, { color: colors.warning }]}>{pending}</Text>
            <Text style={styles.overviewLabel}>Pending{'\n'}Consults</Text>
          </View>
        </ScrollView>

        {/* Pending Check-ins (Walk-ins/Confirmed) */}
        {waitingList.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Check-in / Queue</Text>
              <Text style={styles.sectionCount}>{waitingList.length}</Text>
            </View>
            {waitingList.map((a, idx) => (
              <View key={a.id || idx} style={styles.waitlistCard}>
                <View style={styles.waitlistInfo}>
                  <Text style={styles.waitlistName}>{a.patientName}</Text>
                  <Text style={styles.waitlistDetail}>
                    🕒 {a.startTime?.substring(0, 5)} — 🩺 {a.doctorName}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.checkInBtn}
                  onPress={() => handleCheckIn(a.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.checkInBtnText}>Check In</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's General Schedule</Text>
            <Text style={styles.sectionCount}>{todayAppts.length}</Text>
          </View>
          
          {todayAppts.length > 0 ? (
            todayAppts.map((a, idx) => {
              const statusStyle = !a.status ? { bg: colors.statusScheduledBg, text: colors.statusScheduled }
                : a.status === 'SCHEDULED' ? { bg: colors.statusScheduledBg, text: colors.statusScheduled }
                : a.status === 'CONFIRMED' ? { bg: colors.statusConfirmedBg, text: colors.statusConfirmed }
                : a.status === 'IN_PROGRESS' ? { bg: colors.statusInProgressBg, text: colors.statusInProgress }
                : a.status === 'PATIENT_ARRIVED' ? { bg: colors.infoLight, text: colors.info }
                : a.status === 'COMPLETED' ? { bg: colors.statusCompletedBg, text: colors.statusCompleted }
                : a.status === 'CANCELLED' ? { bg: colors.statusCancelledBg, text: colors.statusCancelled }
                : a.status === 'NO_SHOW' ? { bg: colors.statusNoShowBg, text: colors.statusNoShow }
                : { bg: colors.statusScheduledBg, text: colors.statusScheduled };
              return (
                <TouchableOpacity
                  key={a.id || idx}
                  style={styles.apptCard}
                  onPress={() => navigation.navigate('Appointments', {
                    screen: 'AppointmentDetail',
                    params: { appointment: a },
                  })}
                  activeOpacity={0.7}
                >
                  <View style={styles.apptLeft}>
                    <Text style={styles.apptTime}>{a.startTime?.substring(0, 5) || '--'}</Text>
                    {idx < todayAppts.length - 1 && <View style={styles.apptLine} />}
                  </View>
                  <View style={styles.apptContent}>
                    <View style={styles.apptTop}>
                      <Text style={styles.apptPatient}>{a.patientName}</Text>
                      <View style={[styles.apptStatusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.apptStatusText, { color: statusStyle.text }]}>
                          {a.status === 'PATIENT_ARRIVED' ? 'CHECKED IN' : a.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.apptDoctor}>Assigned Doctor: Dr. {a.doctorName}</Text>
                  </View>
                  <Text style={styles.chevron}>➔</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No appointments today</Text>
              <Text style={styles.emptySub}>The front-desk queue is currently empty</Text>
            </View>
          )}
        </View>

        {/* Follow-ups */}
        {followUps.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Follow-ups Scheduled</Text>
              <Text style={styles.sectionCount}>{followUps.length}</Text>
            </View>
            {followUps.map((a, idx) => (
              <View key={a.id || idx} style={styles.fupCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fupName}>{a.patientName}</Text>
                  <Text style={styles.fupDetail}>Dr. {a.doctorName} — 🕒 {a.startTime?.substring(0, 5)}</Text>
                </View>
                <Text style={styles.fupDateLabel}>Follow-up</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.logoutBtn, { marginHorizontal: 16, marginTop: 28 }]} 
          onPress={handleLogout} 
          activeOpacity={0.85}
        >
          <Text style={styles.logoutBtnText}>Sign Out from Portal</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scrollContent: { paddingTop: 4, paddingHorizontal: 16, paddingBottom: 24 },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 28,
    ...shadows.lg,
  },
  headerContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FFFFFF24', justifyContent: 'center', alignItems: 'center', marginRight: 14,
    borderWidth: 1.5, borderColor: '#FFFFFF40',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  greeting: { fontSize: 13, color: '#FFFFFFCC', fontWeight: '500' },
  name: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 2 },
  bellBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFFFFF1A', justifyContent: 'center', alignItems: 'center' },
  bellIcon: { fontSize: 18 },
  headerSub: { fontSize: 13, color: '#FFFFFFAA', marginTop: 12, fontWeight: '500' },

  sectionLabel: {
    fontSize: 13, fontWeight: '800', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 24, marginBottom: 12,
  },

  quickActionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  quickActionCard: {
    width: '31%', flexGrow: 1, flexBasis: '30%',
    backgroundColor: colors.surface, borderRadius: 18, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  quickActionIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  quickActionEmoji: { fontSize: 20 },
  quickActionLabel: { fontSize: 11, fontWeight: '750', color: colors.text, textAlign: 'center', lineHeight: 15 },

  overviewScroll: { marginBottom: 4 },
  overviewContent: { gap: 10, paddingRight: 16, paddingVertical: 4 },
  overviewCard: {
    width: 130, backgroundColor: colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  overviewValue: { fontSize: 32, fontWeight: '800', color: colors.primary, letterSpacing: -1 },
  overviewLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 4, lineHeight: 16 },

  section: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionCount: { fontSize: 12, fontWeight: '700', color: colors.primary, backgroundColor: colors.primary + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

  apptCard: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10,
    backgroundColor: colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  apptLeft: { alignItems: 'center', width: 48, marginRight: 10 },
  apptTime: { fontSize: 13, fontWeight: '850', color: colors.text },
  apptLine: { width: 2, flex: 1, backgroundColor: colors.borderLight, marginTop: 8, borderRadius: 1, minHeight: 30 },
  apptContent: { flex: 1 },
  apptTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  apptPatient: { fontSize: 15, fontWeight: '750', color: colors.text, flex: 1 },
  apptStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 },
  apptStatusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  apptDoctor: { fontSize: 12, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },
  chevron: { fontSize: 14, color: colors.textMuted, marginLeft: 4, marginTop: 4, fontWeight: '700' },

  waitlistCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: 18, padding: 16,
    marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  waitlistInfo: { flex: 1 },
  waitlistName: { fontSize: 14, fontWeight: '750', color: colors.text },
  waitlistDetail: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '500' },
  checkInBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, ...shadows.sm,
  },
  checkInBtnText: { fontSize: 12, fontWeight: '750', color: '#FFFFFF' },

  fupCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  fupName: { fontSize: 14, fontWeight: '750', color: colors.text },
  fupDetail: { fontSize: 12, color: colors.textMuted, marginTop: 3, fontWeight: '500' },
  fupDateLabel: { fontSize: 10, fontWeight: '800', color: colors.warning, backgroundColor: colors.warningLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  emptyState: { alignItems: 'center', paddingVertical: 36, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.borderLight },
  emptyIcon: { fontSize: 44, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '750', color: colors.text },
  emptySub: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '500' },
  logoutBtn: {
    backgroundColor: colors.error,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.md,
  },
  logoutBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '750' },
});
