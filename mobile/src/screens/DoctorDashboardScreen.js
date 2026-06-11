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
import { consultationApi } from '../api/consultationApi';
import { inventoryApi } from '../api/inventoryApi';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

export default function DoctorDashboardScreen({ navigation }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiryCount, setExpiryCount] = useState(0);
  const [emergencyAppts, setEmergencyAppts] = useState([]);
  const { user, logout } = useAuth();
  const { formatCurrency } = useSettings();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout }
    ]);
  };

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
                <View style={styles.headerLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doctorName}>Dr. {user?.name}</Text>
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
          <Text style={styles.headerSub}>You have {dashboard?.totalAppointmentsToday || 0} consultations scheduled today</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {!dashboard ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>📡</Text>
            <Text style={styles.errorTitle}>Could Not Load Dashboard Features</Text>
            <Text style={styles.errorSub}>
              Unable to connect to the clinic server. Please check your connection or retry.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData(false)} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>🔄 Retry Loading</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.errorLogoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.errorLogoutBtnText}>🚪 Sign Out from Portal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Emergency appointments alert */}
            {emergencyAppts.length > 0 && (
              <TouchableOpacity 
                style={[styles.emergencyBanner, { backgroundColor: '#FEF2F2', borderColor: colors.error }]}
                activeOpacity={0.8}
                onPress={() => {
                  const first = emergencyAppts[0];
                  navigation.navigate('Appointments', {
                    screen: 'AppointmentDetail',
                    params: { appointment: first },
                  });
                }}
              >
                <View style={styles.emergencyHeader}>
                  <Text style={styles.emergencyIcon}>🚨</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emergencyTitle}>Emergency{emergencyAppts.length > 1 ? ' Appointments' : ' Appointment'}</Text>
                    <Text style={styles.emergencyCount}>{emergencyAppts.length} urgent case{emergencyAppts.length > 1 ? 's' : ''} needs attention</Text>
                  </View>
                  <View style={styles.emergencyArrowWrap}>
                    <Text style={styles.emergencyArrow}>➔</Text>
                  </View>
                </View>
                {emergencyAppts.map((a, i) => (
                  <View key={i} style={styles.emergencyPatient}>
                    <Text style={styles.emergencyPatientDot}>●</Text>
                    <Text style={styles.emergencyPatientName}>{a.patientName}</Text>
                    <Text style={styles.emergencyPatientTime}>{a.startTime?.substring(0, 5)}</Text>
                  </View>
                ))}
                <Text style={styles.emergencyTapHint}>Tap to view details</Text>
              </TouchableOpacity>
            )}

            {/* Live Stock Alert warning banner */}
            {(lowStockCount > 0 || expiryCount > 0) && (
              <TouchableOpacity 
                style={styles.stockWarningBanner} 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Inventory', { screen: 'InventoryDashboard' })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 22 }}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stockWarningTitle}>Inventory Attention Required</Text>
                    <Text style={styles.stockWarningSub}>
                      {lowStockCount} items are low on stock & {expiryCount} items are near expiry.
                    </Text>
                  </View>
                  <Text style={styles.stockWarningArrow}>➔</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Quick Stats Grid */}
            <View style={styles.quickStats}>
              <View style={styles.statPill}>
                <View style={[styles.statDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.statPillValue}>{dashboard.totalAppointmentsToday}</Text>
                <Text style={styles.statPillLabel}>Today</Text>
              </View>
              <View style={styles.statPill}>
                <View style={[styles.statDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.statPillValue, { color: colors.success }]}>{dashboard.completedConsultations}</Text>
                <Text style={styles.statPillLabel}>Completed</Text>
              </View>
              <View style={styles.statPill}>
                <View style={[styles.statDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.statPillValue, { color: colors.warning }]}>{dashboard.pendingConsultations}</Text>
                <Text style={styles.statPillLabel}>Pending</Text>
              </View>
              <View style={styles.statPill}>
                <View style={[styles.statDot, { backgroundColor: colors.info }]} />
                <Text style={[styles.statPillValue, { color: colors.info }]}>{dashboard.upcomingAppointments}</Text>
                <Text style={styles.statPillLabel}>Upcoming</Text>
              </View>
            </View>

            {/* Revenue Breakdown */}
            <View style={styles.revenueSection}>
              <View style={styles.revenueCard}>
                <View style={styles.revenueTop}>
                  <Text style={styles.revenueTitle}>Today's Earnings</Text>
                  <View style={styles.revenueBadge}>
                    <Text style={styles.revenueBadgeText}>
                      {dashboard.completedConsultations || 0} consultations done
                    </Text>
                  </View>
                </View>
                <Text style={styles.revenueAmount}>{formatCurrency(dashboard.todayTotalRevenue)}</Text>
                <View style={styles.revenueBreakdown}>
                  <View style={styles.revenueBreakItem}>
                    <View style={[styles.revenueDot, { backgroundColor: colors.primary }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.revenueBreakLabel}>Consultation</Text>
                      <Text style={styles.revenueBreakValue}>{formatCurrency(dashboard.todayConsultationRevenue)}</Text>
                    </View>
                  </View>
                  <View style={styles.revenueBreakItem}>
                    <View style={[styles.revenueDot, { backgroundColor: colors.accent }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.revenueBreakLabel}>Medicine Sale</Text>
                      <Text style={styles.revenueBreakValue}>{formatCurrency(dashboard.todayMedicineRevenue)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Panel */}
            <View style={styles.actionPanel}>
              <Text style={styles.sectionTitle}>Quick Management</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionCard} 
                  onPress={() => navigation.navigate('LetterheadSetup')} 
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionCardIcon}>📝</Text>
                  <Text style={styles.actionCardTitle}>Custom Letterhead</Text>
                  <Text style={styles.actionCardSub}>Design templates</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionCard} 
                  onPress={() => navigation.navigate('PatientCamps')} 
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionCardIcon}>📢</Text>
                  <Text style={styles.actionCardTitle}>Campaigns</Text>
                  <Text style={styles.actionCardSub}>Create & view camps</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionCard} 
                  onPress={() => navigation.navigate('Inventory', { screen: 'InventoryDashboard' })} 
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionCardIcon}>📦</Text>
                  <Text style={styles.actionCardTitle}>Stock (Inventory)</Text>
                  <Text style={styles.actionCardSub}>In-house & store stock</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionCard} 
                  onPress={() => navigation.navigate('Inventory', { screen: 'SupplierList' })} 
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionCardIcon}>👥</Text>
                  <Text style={styles.actionCardTitle}>Suppliers</Text>
                  <Text style={styles.actionCardSub}>Manage vendors</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionCard} 
                  onPress={() => navigation.navigate('Finance', { screen: 'IncomeDashboard' })} 
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionCardIcon}>💵</Text>
                  <Text style={styles.actionCardTitle}>Finance (Income)</Text>
                  <Text style={styles.actionCardSub}>Earnings & statements</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionCard} 
                  onPress={() => navigation.navigate('Finance', { screen: 'AddExpense' })} 
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionCardIcon}>💸</Text>
                  <Text style={styles.actionCardTitle}>Add Expense</Text>
                  <Text style={styles.actionCardSub}>Record office expenses</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Today's Schedule */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Consultation Schedule</Text>
                <Text style={styles.sectionCount}>{dashboard.todayAppointments?.length || 0} Patients</Text>
              </View>
              
              {dashboard.todayAppointments?.length > 0 ? (
                dashboard.todayAppointments.map((a, idx) => {
                  const cs = a.consultationStatus || a.status || 'SCHEDULED';
                  const statusConfig = {
                    COMPLETED: { color: colors.success, bg: colors.successLight, border: '#BBF7D0', icon: '✅' },
                    IN_PROGRESS: { color: colors.info, bg: '#E0F2FE', border: '#BAE6FD', icon: '🔄' },
                    CONFIRMED: { color: colors.primary, bg: colors.primary + '12', border: colors.primary + '30', icon: '📌' },
                    SCHEDULED: { color: colors.warning, bg: colors.warningLight, border: '#FDE68A', icon: '📅' },
                    PATIENT_ARRIVED: { color: '#8B5CF6', bg: '#EDE9FE', border: '#C4B5FD', icon: '📍' },
                    CANCELLED: { color: colors.error, bg: colors.errorLight, border: '#FECACA', icon: '❌' },
                    NO_SHOW: { color: colors.textMuted, bg: colors.borderLight, border: '#D1D5DB', icon: '🚫' },
                  };
                  const cfg = statusConfig[cs] || statusConfig.SCHEDULED;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.apptCard, { borderLeftWidth: 4, borderLeftColor: cfg.color }]}
                      onPress={() => navigation.navigate('Appointments', {
                        screen: 'AppointmentDetail',
                        params: { appointment: a },
                      })}
                      activeOpacity={0.7}
                    >
                      <View style={styles.apptTimeCol}>
                        <View style={[styles.apptTimeBadge, { backgroundColor: cfg.bg }]}>
                          <Text style={[styles.apptTimeText, { color: cfg.color }]}>{a.startTime?.substring(0, 5)}</Text>
                        </View>
                        <Text style={styles.apptDuration}>~60 min</Text>
                      </View>
                      <View style={styles.apptContent}>
                        <View style={styles.apptTop}>
                          <Text style={styles.apptPatient}>{a.patientName}</Text>
                          <View style={[styles.apptStatusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                            <Text style={[styles.apptStatusText, { color: cfg.color }]}>
                              {cfg.icon} {cs === 'PATIENT_ARRIVED' ? 'ARRIVED' : cs}
                            </Text>
                          </View>
                        </View>
                        {a.isOnline ? (
                          <View style={styles.apptTypeRow}>
                            <Text style={styles.apptTypeIcon}>📹</Text>
                            <Text style={styles.apptTypeLabel}>Tele-consultation</Text>
                          </View>
                        ) : a.appointmentType === 'EMERGENCY' ? (
                          <View style={styles.apptTypeRow}>
                            <Text style={styles.apptTypeIcon}>🚨</Text>
                            <Text style={[styles.apptTypeLabel, { color: colors.error }]}>Emergency Visit</Text>
                          </View>
                        ) : (
                          <View style={styles.apptTypeRow}>
                            <Text style={styles.apptTypeIcon}>🏥</Text>
                            <Text style={styles.apptTypeLabel}>In-clinic</Text>
                          </View>
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
                  <Text style={styles.emptyTitle}>No appointments scheduled</Text>
                  <Text style={styles.emptySub}>Your calendar is free today</Text>
                </View>
              )}
            </View>

            {/* Follow-Ups */}
            {dashboard.followUps?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Follow-Ups Due</Text>
                  <Text style={styles.sectionCount}>{dashboard.followUps.length}</Text>
                </View>
                {dashboard.followUps.map((f, i) => (
                  <View key={i} style={styles.fupCard}>
                    <View style={styles.fupLeft}>
                      <Text style={styles.fupName}>{f.patientName}</Text>
                      <Text style={styles.fupDiagnosis}>{f.lastDiagnosis || 'No diagnosis recorded'}</Text>
                    </View>
                    <Text style={styles.fupDate}>{f.followUpDate}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Pending Payments */}
            {dashboard.pendingPayments?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Unpaid Bills</Text>
                  <Text style={styles.sectionCount}>{dashboard.pendingPayments.length}</Text>
                </View>
                {dashboard.pendingPayments.map((p, i) => (
                  <View key={i} style={styles.fupCard}>
                    <View style={styles.fupLeft}>
                      <Text style={styles.fupName}>{p.patientName}</Text>
                      <Text style={styles.fupDiagnosis}>{p.date}</Text>
                    </View>
                    <Text style={[styles.fupDate, { color: colors.error, backgroundColor: colors.errorLight }]}>
                      {formatCurrency(p.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={handleLogout} 
              activeOpacity={0.85}
            >
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </TouchableOpacity>
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
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 28,
    ...shadows.lg,
  },
  headerContent: { paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FFFFFF24', justifyContent: 'center', alignItems: 'center', marginRight: 14,
    borderWidth: 1.5, borderColor: '#FFFFFF40',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  doctorName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 0 },
  bellBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFFFFF1A', justifyContent: 'center', alignItems: 'center' },
  bellIcon: { fontSize: 18 },
  headerSub: { fontSize: 13, color: '#FFFFFFAA', marginTop: 12, fontWeight: '500' },
  
  /* Quick Stats Row */
  quickStats: {
    flexDirection: 'row',
    marginTop: -20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 4,
    ...shadows.md,
    gap: 8,
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
  },
  statPillValue: { fontSize: 20, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  statPillLabel: { fontSize: 9, fontWeight: '750', color: colors.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  
  revenueSection: { marginTop: 20 },
  revenueCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  revenueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  revenueTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  revenueBadge: { backgroundColor: colors.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  revenueBadgeText: { fontSize: 10, fontWeight: '700', color: colors.success },
  revenueAmount: { fontSize: 34, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginTop: 4 },
  revenueBreakdown: { flexDirection: 'row', marginTop: 18, gap: 16 },
  revenueBreakItem: { flexDirection: 'row', alignItems: 'center', flex: 1, backgroundColor: colors.bg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight },
  revenueDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  revenueBreakLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  revenueBreakValue: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 2 },
  
  /* Action Panel */
  actionPanel: { marginTop: 20 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  actionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  actionCardIcon: { fontSize: 24, marginBottom: 8 },
  actionCardTitle: { fontSize: 13, fontWeight: '750', color: colors.text },
  actionCardSub: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 2 },

  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionCount: { fontSize: 12, fontWeight: '700', color: colors.primary, backgroundColor: colors.primary + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  
  apptCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  apptTimeCol: { alignItems: 'center', width: 56, marginRight: 10 },
  apptTimeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, width: 56, alignItems: 'center' },
  apptTimeText: { fontSize: 13, fontWeight: '850' },
  apptDuration: { fontSize: 8, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  apptContent: { flex: 1 },
  apptTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  apptPatient: { fontSize: 15, fontWeight: '750', color: colors.text, flex: 1 },
  apptStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8, borderWidth: 1 },
  apptStatusText: { fontSize: 9, fontWeight: '800' },
  apptTypeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  apptTypeIcon: { fontSize: 12 },
  apptTypeLabel: { fontSize: 12, color: colors.info, fontWeight: '600' },
  apptReason: { fontSize: 12, color: colors.textSecondary, marginTop: 4, fontWeight: '500', fontStyle: 'italic' },
  chevron: { fontSize: 14, color: colors.textMuted, marginLeft: 4, marginTop: 4, fontWeight: '700' },
  
  fupCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  fupLeft: { flex: 1 },
  fupName: { fontSize: 14, fontWeight: '750', color: colors.text },
  fupDiagnosis: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontWeight: '500' },
  fupDate: { fontSize: 11, fontWeight: '800', color: colors.warning, backgroundColor: colors.warningLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  
  emptyState: { alignItems: 'center', paddingVertical: 36, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.borderLight },
  emptyIcon: { fontSize: 44, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '750', color: colors.text },
  emptySub: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '500' },
  logoutBtn: {
    backgroundColor: colors.error + '15',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  logoutBtnText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  stockWarningBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    marginHorizontal: 4,
    ...shadows.sm,
  },
  emergencyBanner: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
    marginHorizontal: 4,
    ...shadows.md,
  },
  emergencyHeader: {
    flexDirection: 'row', alignItems: 'center',
  },
  emergencyIcon: { fontSize: 24, marginRight: 12 },
  emergencyTitle: {
    fontSize: 15, fontWeight: '800', color: colors.error,
  },
  emergencyCount: {
    fontSize: 11, color: colors.error, fontWeight: '600', marginTop: 1,
  },
  emergencyArrowWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.error + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  emergencyArrow: { fontSize: 16, color: colors.error, fontWeight: '700' },
  emergencyPatient: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10, padding: 10, marginTop: 8,
  },
  emergencyPatientDot: { fontSize: 8, color: colors.error, marginRight: 8 },
  emergencyPatientName: { fontSize: 13, fontWeight: '700', color: colors.text, flex: 1 },
  emergencyPatientTime: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  emergencyTapHint: { fontSize: 9, color: colors.error + '80', textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  stockWarningTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
  },
  stockWarningSub: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 2,
  },
  stockWarningArrow: {
    fontSize: 16,
    color: '#D97706',
    fontWeight: '700',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    ...shadows.sm,
    marginBottom: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorLogoutBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  errorLogoutBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
