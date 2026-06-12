import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Platform, StatusBar, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { consultationApi } from '../api/consultationApi';
import { inventoryApi } from '../api/inventoryApi';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

const STATUS_STYLES = {
  COMPLETED: { color: colors.success, bg: colors.successLight, icon: '✅' },
  IN_PROGRESS: { color: colors.info, bg: '#E0F2FE', icon: '🔄' },
  CONFIRMED: { color: colors.primary, bg: colors.primary + '12', icon: '📌' },
  SCHEDULED: { color: colors.warning, bg: colors.warningLight, icon: '📅' },
  PATIENT_ARRIVED: { color: '#8B5CF6', bg: '#EDE9FE', icon: '📍' },
  CANCELLED: { color: colors.error, bg: colors.errorLight, icon: '❌' },
  NO_SHOW: { color: colors.textMuted, bg: colors.borderLight, icon: '🚫' },
};

export default function DoctorDashboardScreen({ navigation }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiryCount, setExpiryCount] = useState(0);
  const [emergencyAppts, setEmergencyAppts] = useState([]);
  const { user, logout } = useAuth();
  const { formatCurrency } = useSettings();

  const handleLogout = () => { logout(); };

  const fetchData = useCallback(async (isRefresh) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [data, lowStock, expiryAlerts] = await Promise.all([
        consultationApi.getDoctorDashboard(),
        inventoryApi.getLowStock().catch(() => []),
        inventoryApi.getExpiryAlerts().catch(() => []),
      ]);
      setDashboard(data);
      setLowStockCount(lowStock.length);
      setExpiryCount(expiryAlerts.length);
      const emg = (data?.todayAppointments || []).filter(a => a.appointmentType === 'EMERGENCY');
      if (emg.length > 0) setEmergencyAppts(emg);
    } catch (e) {
      console.log(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const today = new Date();
  const todayAppts = dashboard?.todayAppointments || [];
  const pendingCount = dashboard?.pendingConsultations || 0;
  const completedCount = dashboard?.completedConsultations || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header - Clean, no signout */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Good {today.getHours() < 12 ? 'Morning' : today.getHours() < 17 ? 'Afternoon' : 'Evening'},</Text>
              <Text style={styles.doctorName}>Dr. {user?.name}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.headerSub}>
          {todayAppts.length} appointment{todayAppts.length !== 1 ? 's' : ''} scheduled today · {completedCount} completed
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {!dashboard ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>📡</Text>
            <Text style={styles.errorTitle}>Could Not Load Dashboard</Text>
            <Text style={styles.errorSub}>Unable to connect to the server. Please check your connection.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData(false)} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>🔄 Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Emergency Alert */}
            {emergencyAppts.length > 0 && (
              <TouchableOpacity style={styles.emergencyBanner} activeOpacity={0.8}
                onPress={() => {
                  const first = emergencyAppts[0];
                  navigation.navigate('Appointments', { screen: 'AppointmentDetail', params: { appointment: first } });
                }}
              >
                <View style={styles.emergencyContent}>
                  <Text style={styles.emergencyIcon}>🚨</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emergencyTitle}>{emergencyAppts.length} Emergency {emergencyAppts.length > 1 ? 'Cases' : 'Case'}</Text>
                    {emergencyAppts.map((a, i) => (
                      <Text key={i} style={styles.emergencyPatient}>● {a.patientName} — {a.startTime?.slice(0, 5)}</Text>
                    ))}
                  </View>
                  <Text style={styles.emergencyArrow}>›</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Stock Warning */}
            {(lowStockCount > 0 || expiryCount > 0) && (
              <TouchableOpacity style={styles.stockBanner} activeOpacity={0.8}
                onPress={() => navigation.navigate('Inventory', { screen: 'InventoryDashboard' })}
              >
                <Text style={styles.stockIcon}>⚠️</Text>
                <Text style={styles.stockText}>
                  {lowStockCount > 0 ? `${lowStockCount} item${lowStockCount > 1 ? 's' : ''} low on stock` : ''}
                  {lowStockCount > 0 && expiryCount > 0 ? ' · ' : ''}
                  {expiryCount > 0 ? `${expiryCount} near expiry` : ''}
                </Text>
                <Text style={styles.stockArrow}>›</Text>
              </TouchableOpacity>
            )}

            {/* TODAY'S SCHEDULE - Primary Focus */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Today's Schedule</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Appointments', { screen: 'AppointmentList' })}>
                <Text style={styles.seeAll}>See All ›</Text>
              </TouchableOpacity>
            </View>

            {todayAppts.length > 0 ? (
              todayAppts.slice(0, 8).map((a, idx) => {
                const cs = a.consultationStatus || a.status || 'SCHEDULED';
                const cfg = STATUS_STYLES[cs] || STATUS_STYLES.SCHEDULED;
                const canStartConsult = cs !== 'COMPLETED' && cs !== 'CANCELLED' && cs !== 'NO_SHOW';
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.apptCard, { borderLeftColor: cfg.color }]}
                    onPress={() => navigation.navigate('Appointments', { screen: 'AppointmentDetail', params: { appointment: a } })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.apptTimeCol}>
                      <Text style={[styles.apptTime, { color: cfg.color }]}>{a.startTime?.slice(0, 5)}</Text>
                      <Text style={styles.apptAmPm}>{parseInt(a.startTime?.slice(0, 2)) < 12 ? 'AM' : 'PM'}</Text>
                    </View>
                    <View style={styles.apptContent}>
                      <View style={styles.apptTopRow}>
                        <Text style={styles.apptPatientName}>{a.patientName || 'Patient'}</Text>
                        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.icon} {cs}</Text>
                        </View>
                      </View>
                      {a.appointmentType === 'EMERGENCY' && (
                        <Text style={styles.apptType}>🚨 Emergency</Text>
                      )}
                      {a.reason ? <Text style={styles.apptReason} numberOfLines={1}>{a.reason}</Text> : null}
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No appointments today</Text>
                <Text style={styles.emptySub}>Your schedule is clear</Text>
                <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate('Appointments', { screen: 'AppointmentBooking' })} activeOpacity={0.8}>
                  <Text style={styles.emptyActionText}>+ Book Appointment</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{todayAppts.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.success }]}>{completedCount}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.warning }]}>{pendingCount}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: colors.info }]}>{dashboard.upcomingAppointments || 0}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
            </View>

            {/* Today's Earnings */}
            <View style={styles.earningsCard}>
              <View style={styles.earningsHeader}>
                <Text style={styles.earningsTitle}>Today's Earnings</Text>
                <View style={styles.earningsBadge}>
                  <Text style={styles.earningsBadgeText}>{completedCount} consultations</Text>
                </View>
              </View>
              <Text style={styles.earningsAmount}>{formatCurrency(dashboard.todayTotalRevenue || 0)}</Text>
              <View style={styles.earningsBreakdown}>
                <View style={styles.earningsItem}>
                  <View style={[styles.earningsDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.earningsItemLabel}>Consultation</Text>
                  <Text style={styles.earningsItemValue}>{formatCurrency(dashboard.todayConsultationRevenue || 0)}</Text>
                </View>
                <View style={styles.earningsItem}>
                  <View style={[styles.earningsDot, { backgroundColor: colors.accent }]} />
                  <Text style={styles.earningsItemLabel}>Medicine Sale</Text>
                  <Text style={styles.earningsItemValue}>{formatCurrency(dashboard.todayMedicineRevenue || 0)}</Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.actionsTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Appointments', { screen: 'AppointmentBooking' })} activeOpacity={0.7}>
                <Text style={styles.actionIcon}>📅</Text>
                <Text style={styles.actionLabel}>Book Appointment</Text>
                <Text style={styles.actionSub}>Schedule a patient</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('LetterheadSetup')} activeOpacity={0.7}>
                <Text style={styles.actionIcon}>📝</Text>
                <Text style={styles.actionLabel}>Prescription</Text>
                <Text style={styles.actionSub}>Write & print</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Finance', { screen: 'IncomeDashboard' })} activeOpacity={0.7}>
                <Text style={styles.actionIcon}>💵</Text>
                <Text style={styles.actionLabel}>Finance</Text>
                <Text style={styles.actionSub}>Earnings & reports</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Inventory', { screen: 'InventoryDashboard' })} activeOpacity={0.7}>
                <Text style={styles.actionIcon}>📦</Text>
                <Text style={styles.actionLabel}>Inventory</Text>
                <Text style={styles.actionSub}>Check stock</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Finance', { screen: 'AddExpense' })} activeOpacity={0.7}>
                <Text style={styles.actionIcon}>💸</Text>
                <Text style={styles.actionLabel}>Add Expense</Text>
                <Text style={styles.actionSub}>Record expense</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, styles.logoutCard]} onPress={handleLogout} activeOpacity={0.7}>
                <Text style={styles.actionIcon}>🚪</Text>
                <Text style={[styles.actionLabel, { color: colors.error }]}>Sign Out</Text>
                <Text style={[styles.actionSub, { color: colors.error + '99' }]}>Leave portal</Text>
              </TouchableOpacity>
            </View>

            {/* Follow-Ups */}
            {dashboard.followUps?.length > 0 && (
              <View style={styles.sectionCompact}>
                <Text style={styles.actionsTitle}>Follow-Ups Due</Text>
                {dashboard.followUps.map((f, i) => (
                  <View key={i} style={styles.fupCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fupName}>{f.patientName}</Text>
                      <Text style={styles.fupReason}>{f.lastDiagnosis || 'Follow-up visit'}</Text>
                    </View>
                    <View style={styles.fupDateBadge}>
                      <Text style={styles.fupDateText}>{f.followUpDate}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Unpaid Bills */}
            {dashboard.pendingPayments?.length > 0 && (
              <View style={styles.sectionCompact}>
                <Text style={styles.actionsTitle}>Unpaid Bills</Text>
                {dashboard.pendingPayments.map((p, i) => (
                  <View key={i} style={styles.fupCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fupName}>{p.patientName}</Text>
                      <Text style={styles.fupReason}>{p.date}</Text>
                    </View>
                    <Text style={[styles.fupDateText, { color: colors.error, backgroundColor: colors.errorLight }]}>
                      {formatCurrency(p.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },

  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF25', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  greeting: { fontSize: 12, color: '#FFFFFFCC', fontWeight: '500' },
  doctorName: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 1 },
  headerSub: { fontSize: 12, color: '#FFFFFFAA', marginTop: 8 },

  emergencyBanner: {
    backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: colors.error,
    borderRadius: 16, padding: 14, marginTop: 14, ...shadows.sm,
  },
  emergencyContent: { flexDirection: 'row', alignItems: 'center' },
  emergencyIcon: { fontSize: 22, marginRight: 10 },
  emergencyTitle: { fontSize: 14, fontWeight: '800', color: colors.error, marginBottom: 4 },
  emergencyPatient: { fontSize: 11, color: colors.error, fontWeight: '600', marginTop: 1 },
  emergencyArrow: { fontSize: 20, color: colors.error, fontWeight: '300' },

  stockBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB',
    borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12, padding: 12, marginTop: 10,
  },
  stockIcon: { fontSize: 16, marginRight: 8 },
  stockText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#D97706' },
  stockArrow: { fontSize: 18, color: '#D97706', fontWeight: '300' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  seeAll: { fontSize: 12, fontWeight: '600', color: colors.primary },

  apptCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 14, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: colors.borderLight, borderLeftWidth: 4, ...shadows.sm,
  },
  apptTimeCol: { alignItems: 'center', width: 48, marginRight: 10 },
  apptTime: { fontSize: 16, fontWeight: '800' },
  apptAmPm: { fontSize: 8, color: colors.textMuted, fontWeight: '600', marginTop: 1 },
  apptContent: { flex: 1 },
  apptTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  apptPatientName: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 6 },
  statusText: { fontSize: 9, fontWeight: '700' },
  apptType: { fontSize: 11, fontWeight: '600', color: colors.error, marginTop: 2 },
  apptReason: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
  chevron: { fontSize: 16, color: colors.textMuted, marginLeft: 4, fontWeight: '300' },

  emptyState: { alignItems: 'center', paddingVertical: 24, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  emptyAction: { marginTop: 12, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  emptyActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  statsRow: { flexDirection: 'row', marginTop: 12, gap: 6 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 9, fontWeight: '600', color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },

  earningsCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginTop: 14,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  earningsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earningsTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  earningsBadge: { backgroundColor: colors.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  earningsBadgeText: { fontSize: 9, fontWeight: '700', color: colors.success },
  earningsAmount: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginTop: 4 },
  earningsBreakdown: { flexDirection: 'row', marginTop: 14, gap: 12 },
  earningsItem: { flexDirection: 'row', alignItems: 'center', flex: 1, backgroundColor: colors.bg, padding: 10, borderRadius: 10 },
  earningsDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  earningsItemLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', flex: 1 },
  earningsItemValue: { fontSize: 13, fontWeight: '800', color: colors.text },

  actionsTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8, letterSpacing: -0.3 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionCard: {
    width: '48%', backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  actionIcon: { fontSize: 20, marginBottom: 6 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  actionSub: { fontSize: 10, color: colors.textMuted, marginTop: 2, fontWeight: '500' },
  logoutCard: { borderColor: colors.error + '30', backgroundColor: colors.errorLight },

  sectionCompact: { marginTop: 4 },
  fupCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 12, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  fupName: { fontSize: 14, fontWeight: '700', color: colors.text },
  fupReason: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  fupDateBadge: { backgroundColor: colors.warningLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  fupDateText: { fontSize: 11, fontWeight: '700', color: colors.warning },

  errorContainer: { padding: 32, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 },
  errorSub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 24, paddingHorizontal: 16 },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, ...shadows.sm },
  retryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
