import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Platform, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { consultationApi } from '../api/consultationApi';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 36);

export default function DoctorDashboardScreen({ navigation }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { formatCurrency } = useSettings();

  const fetchData = useCallback(async (isRefresh) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const data = await consultationApi.getDoctorDashboard();
      setDashboard(data);
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

  if (!dashboard) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textSecondary }}>Could not load dashboard</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>Hello,</Text>
                <Text style={styles.doctorName}>Dr. {user?.name}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
              <Text style={styles.bellIcon}>🔔</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSub}>Have a great day taking care of your patients</Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
      >

        <View style={styles.quickStats}>
          <View style={styles.statPill}>
            <Text style={styles.statPillValue}>{dashboard.totalAppointmentsToday}</Text>
            <Text style={styles.statPillLabel}>Today</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statPillValue, { color: colors.success }]}>{dashboard.completedConsultations}</Text>
            <Text style={styles.statPillLabel}>Done</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statPillValue, { color: colors.warning }]}>{dashboard.pendingConsultations}</Text>
            <Text style={styles.statPillLabel}>Pending</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statPillValue, { color: colors.info }]}>{dashboard.upcomingAppointments}</Text>
            <Text style={styles.statPillLabel}>Upcoming</Text>
          </View>
        </View>

        <View style={styles.revenueSection}>
          <View style={styles.revenueCard}>
            <View style={styles.revenueTop}>
              <Text style={styles.revenueTitle}>Today's Revenue</Text>
              <View style={styles.revenueBadge}>
                <Text style={styles.revenueBadgeText}>
                  +{dashboard.completedConsultations || 0} completed
                </Text>
              </View>
            </View>
            <Text style={styles.revenueAmount}>{formatCurrency(dashboard.todayTotalRevenue)}</Text>
            <View style={styles.revenueBreakdown}>
              <View style={styles.revenueBreakItem}>
                <View style={[styles.revenueDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.revenueBreakLabel}>Consultation</Text>
                <Text style={styles.revenueBreakValue}>{formatCurrency(dashboard.todayConsultationRevenue)}</Text>
              </View>
              <View style={styles.revenueBreakItem}>
                <View style={[styles.revenueDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.revenueBreakLabel}>Medicine</Text>
                <Text style={styles.revenueBreakValue}>{formatCurrency(dashboard.todayMedicineRevenue)}</Text>
              </View>
            </View>
          </View>
        </View>

        {dashboard.todayAppointments?.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <Text style={styles.sectionCount}>{dashboard.todayAppointments.length} patients</Text>
            </View>
            {dashboard.todayAppointments.map((a, idx) => {
              const statusColor = !a.consultationStatus ? colors.warning
                : a.consultationStatus === 'COMPLETED' ? colors.success
                : a.consultationStatus === 'IN_PROGRESS' ? colors.info : colors.primary;
              const statusBg = !a.consultationStatus ? colors.warningLight
                : a.consultationStatus === 'COMPLETED' ? colors.successLight
                : a.consultationStatus === 'IN_PROGRESS' ? colors.infoLight : colors.primary + '15';
              return (
                <TouchableOpacity
                  key={a.id}
                  style={styles.apptCard}
                  onPress={() => navigation.navigate('Appointments', {
                    screen: 'AppointmentDetail',
                    params: { appointment: a },
                  })}
                  activeOpacity={0.7}
                >
                  <View style={styles.apptLeft}>
                    <Text style={styles.apptTime}>{a.startTime?.substring(0, 5)}</Text>
                    {idx < dashboard.todayAppointments.length - 1 && <View style={styles.apptLine} />}
                  </View>
                  <View style={styles.apptContent}>
                    <View style={styles.apptTop}>
                      <Text style={styles.apptPatient}>{a.patientName}</Text>
                      <View style={[styles.apptStatusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.apptStatusText, { color: statusColor }]}>
                          {a.consultationStatus || a.status}
                        </Text>
                      </View>
                    </View>
                    {a.isOnline && <Text style={styles.apptType}>📹 Online</Text>}
                    {a.reason && <Text style={styles.apptReason} numberOfLines={1}>{a.reason}</Text>}
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No appointments today</Text>
            <Text style={styles.emptySub}>Your schedule is clear. Enjoy your day!</Text>
          </View>
        )}

        {dashboard.followUps?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Follow-Ups</Text>
              <Text style={styles.sectionCount}>{dashboard.followUps.length}</Text>
            </View>
            {dashboard.followUps.map((f, i) => (
              <View key={i} style={styles.fupCard}>
                <View style={styles.fupLeft}>
                  <Text style={styles.fupName}>{f.patientName}</Text>
                  <Text style={styles.fupDiagnosis}>{f.lastDiagnosis || 'No diagnosis'}</Text>
                </View>
                <Text style={styles.fupDate}>{f.followUpDate}</Text>
              </View>
            ))}
          </View>
        )}

        {dashboard.pendingPayments?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Payments</Text>
              <Text style={styles.sectionCount}>{dashboard.pendingPayments.length}</Text>
            </View>
            {dashboard.pendingPayments.map((p, i) => (
              <View key={i} style={styles.fupCard}>
                <View style={styles.fupLeft}>
                  <Text style={styles.fupName}>{p.patientName}</Text>
                  <Text style={styles.fupDiagnosis}>{p.date}</Text>
                </View>
                <Text style={[styles.fupDate, { color: colors.error }]}>{formatCurrency(p.amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 8,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFFFFF25', justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  greeting: { fontSize: 13, color: '#FFFFFFCC', fontWeight: '500' },
  doctorName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 1 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF20', justifyContent: 'center', alignItems: 'center' },
  bellIcon: { fontSize: 18 },
  headerSub: { fontSize: 13, color: '#FFFFFFAA', marginTop: 8, marginLeft: 62 },
  quickStats: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 12,
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 12, ...shadows.md,
  },
  statPill: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRightWidth: 1, borderRightColor: colors.borderLight,
  },
  statPillValue: { fontSize: 22, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  statPillLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  revenueSection: { paddingHorizontal: 16, marginTop: 16 },
  revenueCard: {
    backgroundColor: colors.surface, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.md,
  },
  revenueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  revenueTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  revenueBadge: { backgroundColor: colors.successLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  revenueBadgeText: { fontSize: 10, fontWeight: '700', color: colors.success },
  revenueAmount: { fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -1, marginTop: 2 },
  revenueBreakdown: { flexDirection: 'row', marginTop: 16, gap: 24 },
  revenueBreakItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  revenueDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  revenueBreakLabel: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  revenueBreakValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  sectionCount: { fontSize: 13, fontWeight: '600', color: colors.textMuted, backgroundColor: colors.borderLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  apptCard: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4,
    backgroundColor: colors.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  apptLeft: { alignItems: 'center', width: 48, marginRight: 12 },
  apptTime: { fontSize: 13, fontWeight: '800', color: colors.text },
  apptLine: { width: 2, flex: 1, backgroundColor: colors.borderLight, marginTop: 4, borderRadius: 1 },
  apptContent: { flex: 1 },
  apptTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  apptPatient: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  apptStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
  apptStatusText: { fontSize: 10, fontWeight: '700' },
  apptType: { fontSize: 12, color: colors.info, fontWeight: '600', marginTop: 3 },
  apptReason: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  chevron: { fontSize: 22, color: colors.textMuted, marginLeft: 4, marginTop: 4 },
  fupCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  fupLeft: { flex: 1 },
  fupName: { fontSize: 14, fontWeight: '600', color: colors.text },
  fupDiagnosis: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  fupDate: { fontSize: 12, fontWeight: '700', color: colors.warning, backgroundColor: colors.warningLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 40, marginTop: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
