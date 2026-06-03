import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { compensationApi } from '../api/compensationApi';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows, typography } from '../theme';

const STATUS_MAP = {
  PENDING: { bg: colors.warningLight, text: colors.warning, label: 'Pending' },
  APPROVED: { bg: colors.infoLight, text: colors.info, label: 'Approved' },
  PAID: { bg: colors.successLight, text: colors.success, label: 'Paid' },
};

function SummaryCard({ label, value, color }) {
  return (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function DoctorEarningsScreen({ route, navigation }) {
  const { doctorId, doctorName } = route.params;
  const { formatCurrency } = useSettings();
  const [earnings, setEarnings] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [e, p] = await Promise.all([
        compensationApi.getDoctorEarnings(doctorId),
        compensationApi.getDoctorPayouts(doctorId),
      ]);
      setEarnings(e);
      setPayouts(p);
    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [doctorId]);

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
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={styles.headerCard}>
          <Text style={styles.headerLabel}>Earnings Overview</Text>
          <Text style={styles.headerName}>Dr. {doctorName}</Text>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard label="Total Consultations" value={earnings?.totalConsultations ?? 0} color={colors.info} />
          <SummaryCard label="Total Revenue" value={formatCurrency(earnings?.totalRevenue ?? 0)} color={colors.primary} />
          <SummaryCard label="Doctor Earnings" value={formatCurrency(earnings?.doctorEarnings ?? 0)} color={colors.success} />
          <SummaryCard label="Clinic Share" value={formatCurrency(earnings?.clinicShare ?? 0)} color={colors.accent} />
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusPill, { backgroundColor: colors.warningLight }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.statusPillText, { color: colors.warning }]}>
              Pending Payouts: {earnings?.pendingPayouts ?? 0}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: colors.successLight }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.statusPillText, { color: colors.success }]}>
              Paid Payouts: {earnings?.paidPayouts ?? 0}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout History</Text>
          {payouts.length === 0 ? (
            <Text style={styles.emptyText}>No payouts found</Text>
          ) : (
            payouts.map((p, idx) => {
              const statusStyle = STATUS_MAP[p.status] || STATUS_MAP.PENDING;
              return (
                <View key={p.id || idx} style={styles.payoutCard}>
                  <View style={styles.payoutHeader}>
                    <Text style={styles.payoutPeriod}>
                      {p.periodStart} - {p.periodEnd}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.payoutStats}>
                    <View style={styles.payoutStat}>
                      <Text style={styles.payoutStatLabel}>Consultations</Text>
                      <Text style={styles.payoutStatValue}>{p.totalConsultations}</Text>
                    </View>
                    <View style={styles.payoutStat}>
                      <Text style={styles.payoutStatLabel}>Revenue</Text>
                      <Text style={styles.payoutStatValue}>{formatCurrency(p.totalRevenue)}</Text>
                    </View>
                    <View style={styles.payoutStat}>
                      <Text style={styles.payoutStatLabel}>Doctor Earnings</Text>
                      <Text style={[styles.payoutStatValue, { color: colors.success }]}>{formatCurrency(p.doctorEarnings)}</Text>
                    </View>
                  </View>
                  {p.paidDate && (
                    <Text style={styles.paidDate}>Paid on {p.paidDate}</Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: {
    backgroundColor: colors.primary, borderRadius: borderRadius.xl,
    padding: 24, marginBottom: 16, ...shadows.md,
  },
  headerLabel: { ...typography.label, color: '#FFFFFFCC', marginBottom: 4 },
  headerName: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: 16, borderLeftWidth: 4, flex: 1, minWidth: '45%',
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  summaryValue: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  statusRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statusPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: borderRadius.md,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusPillText: { fontSize: 13, fontWeight: '700' },
  section: { marginBottom: 16 },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: 12 },
  emptyText: { textAlign: 'center', color: colors.textMuted, paddingVertical: 24, fontSize: 13 },
  payoutCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  payoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  payoutPeriod: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  payoutStats: { gap: 8 },
  payoutStat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payoutStatLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  payoutStatValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  paidDate: { fontSize: 11, color: colors.textMuted, marginTop: 8, fontWeight: '600' },
});
