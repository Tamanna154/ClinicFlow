import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { consultationApi } from '../api/consultationApi';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.doctorName}>Dr. {user?.name}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Today's Appointments" value={dashboard.totalAppointmentsToday} color={colors.primary} />
        <StatCard label="Completed" value={dashboard.completedConsultations} color={colors.success} />
        <StatCard label="Pending" value={dashboard.pendingConsultations} color={colors.warning} />
        <StatCard label="Upcoming" value={dashboard.upcomingAppointments} color={colors.info} />
      </View>

      <View style={styles.revenueCard}>
        <Text style={styles.revenueTitle}>Today's Revenue</Text>
        <Text style={styles.revenueTotal}>{formatCurrency(dashboard.todayTotalRevenue)}</Text>
        <View style={styles.revenueRow}>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>Consultation</Text>
            <Text style={styles.revenueValue}>{formatCurrency(dashboard.todayConsultationRevenue)}</Text>
          </View>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>Medicine</Text>
            <Text style={styles.revenueValue}>{formatCurrency(dashboard.todayMedicineRevenue)}</Text>
          </View>
        </View>
      </View>

      {dashboard.todayAppointments?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Consultations ({dashboard.todayAppointments.length})</Text>
          {dashboard.todayAppointments.map((a) => {
            const statusColor = !a.consultationStatus ? colors.warning
              : a.consultationStatus === 'COMPLETED' ? colors.success : colors.primary;
            return (
              <TouchableOpacity key={a.appointmentId} style={styles.apptCard}
                onPress={() => navigation.navigate('Appointments', {
                  screen: 'AppointmentDetail',
                  params: { appointment: a },
                })}
                activeOpacity={0.7}>
                <View style={styles.apptHeader}>
                  <Text style={styles.apptTime}>{a.startTime}</Text>
                  <View style={[styles.apptStatus, { backgroundColor: statusColor + '15' }]}>
                    <Text style={[styles.apptStatusText, { color: statusColor }]}>
                      {a.consultationStatus || a.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.apptPatient}>{a.patientName}</Text>
                {a.isOnline && <Text style={styles.apptType}>Online</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {dashboard.followUps?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow-Ups ({dashboard.followUps.length})</Text>
          {dashboard.followUps.map((f, i) => (
            <View key={i} style={styles.followUpCard}>
              <View style={styles.followUpLeft}>
                <Text style={styles.followUpName}>{f.patientName}</Text>
                <Text style={styles.followUpDiagnosis}>{f.lastDiagnosis || 'No diagnosis'}</Text>
              </View>
              <Text style={styles.followUpDate}>{f.followUpDate}</Text>
            </View>
          ))}
        </View>
      )}

      {dashboard.pendingPayments?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Payments ({dashboard.pendingPayments.length})</Text>
          {dashboard.pendingPayments.map((p, i) => (
            <View key={i} style={styles.paymentCard}>
              <View style={styles.paymentLeft}>
                <Text style={styles.paymentName}>{p.patientName}</Text>
                <Text style={styles.paymentDate}>{p.date}</Text>
              </View>
              <Text style={styles.paymentAmount}>{formatCurrency(p.amount)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  headerRow: { marginBottom: 16 },
  greeting: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  doctorName: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statCard: { width: '48%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 14, borderLeftWidth: 4, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  statValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  revenueCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 20, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.md },
  revenueTitle: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  revenueTotal: { fontSize: 32, fontWeight: '800', color: colors.success, letterSpacing: -0.5 },
  revenueRow: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  revenueItem: { flex: 1, alignItems: 'center' },
  revenueLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  revenueValue: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 2 },
  revenueDivider: { width: 1, backgroundColor: colors.borderLight },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10, letterSpacing: -0.2 },
  apptCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  apptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  apptTime: { fontSize: 13, fontWeight: '700', color: colors.primary },
  apptStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  apptStatusText: { fontSize: 10, fontWeight: '700' },
  apptPatient: { fontSize: 15, fontWeight: '600', color: colors.text },
  apptType: { fontSize: 11, color: colors.info, fontWeight: '600', marginTop: 2 },
  followUpCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  followUpLeft: { flex: 1 },
  followUpName: { fontSize: 14, fontWeight: '600', color: colors.text },
  followUpDiagnosis: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  followUpDate: { fontSize: 12, fontWeight: '700', color: colors.warning },
  paymentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  paymentLeft: { flex: 1 },
  paymentName: { fontSize: 14, fontWeight: '600', color: colors.text },
  paymentDate: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  paymentAmount: { fontSize: 15, fontWeight: '800', color: colors.error },
});
