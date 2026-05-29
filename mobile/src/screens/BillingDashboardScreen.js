import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { billingApi } from '../api/billingApi';
import { usePermission } from '../hooks/usePermission';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

const SCREEN_W = Dimensions.get('window').width - 32;

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(13, 94, 110, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
  propsForLabels: { fontSize: 10, fontWeight: '600' },
  propsForBackgroundLines: { strokeDasharray: '', stroke: '#f1f5f9', strokeWidth: 1 },
  barPercentage: 0.6,
};

function CountCard({ label, count, color }) {
  return (
    <View style={[styles.countCard, { backgroundColor: color + '12' }]}>
      <Text style={[styles.countNumber, { color }]}>{count}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

export default function BillingDashboardScreen({ navigation }) {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { hasPermission } = usePermission();
  const { formatCurrency } = useSettings();
  const canManage = hasPermission('MANAGE_BILLING');

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [billsData, summaryData] = await Promise.all([
        billingApi.getAll(),
        billingApi.getSummary(),
      ]);
      setBills(billsData);
      setSummary(summaryData);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PAID': return { bg: colors.statusCompletedBg, text: colors.statusCompleted };
      case 'PENDING': return { bg: colors.statusInProgressBg, text: colors.statusInProgress };
      case 'PARTIAL': return { bg: colors.statusScheduledBg, text: colors.statusScheduled };
      default: return { bg: colors.statusScheduledBg, text: colors.statusScheduled };
    }
  };

  const pieData = summary ? [
    { name: 'Paid', population: Math.max(summary.paidBills || 0, 1), color: colors.success, legendFontColor: colors.textSecondary, legendFontSize: 12 },
    { name: 'Pending', population: Math.max(summary.pendingBills || 0, 1), color: colors.warning, legendFontColor: colors.textSecondary, legendFontSize: 12 },
    { name: 'Partial', population: Math.max((summary.totalBills - summary.paidBills - summary.pendingBills) || 0, 1), color: colors.info, legendFontColor: colors.textSecondary, legendFontSize: 12 },
  ] : [];

  const barData = summary ? {
    labels: ['Total', 'Paid', 'Pending'],
    datasets: [{ data: [summary.totalBills || 0, summary.paidBills || 0, summary.pendingBills || 0] }],
  } : { labels: [], datasets: [{ data: [0] }] };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading billing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bills}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.summarySection}>
              <View style={styles.headerRow}>
                <Text style={styles.pageTitle}>Billing</Text>
                {canManage && (
                  <TouchableOpacity
                    style={styles.newBtn}
                    onPress={() => navigation.navigate('MedicineBilling')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.newBtnText}>+ New Bill</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.revenueCard}>
                <Text style={styles.revenueLabel}>Total Revenue</Text>
                <Text style={styles.revenueValue}>{formatCurrency(summary?.totalRevenue || 0)}</Text>
              </View>

              <View style={styles.countsRow}>
                <CountCard label="Total Bills" count={summary?.totalBills || 0} color={colors.primary} />
                <CountCard label="Paid" count={summary?.paidBills || 0} color={colors.success} />
                <CountCard label="Pending" count={summary?.pendingBills || 0} color={colors.warning} />
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Payment Status Distribution</Text>
              <PieChart
                data={pieData}
                width={SCREEN_W - 32}
                height={180}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute
              />
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Bill Status Overview</Text>
              <BarChart
                data={barData}
                width={SCREEN_W - 32}
                height={180}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                fromZero
                style={{ borderRadius: borderRadius.md }}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bills</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => {
          const ss = getStatusStyle(item.paymentStatus);
          return (
            <TouchableOpacity
              style={styles.billCard}
              onPress={() => navigation.navigate('BillDetail', { billId: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.billTop}>
                <View style={styles.billInfo}>
                  <Text style={styles.billNumber}>{item.billNumber}</Text>
                  <Text style={styles.billPatient}>{item.patientName || `Patient #${item.patientId}`}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: ss.bg }]}>
                  <Text style={[styles.statusText, { color: ss.text }]}>{item.paymentStatus}</Text>
                </View>
              </View>
              <View style={styles.billBottom}>
                <Text style={styles.billAmount}>{formatCurrency(item.totalAmount)}</Text>
                <Text style={styles.billDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyCircle}><Text style={styles.emptyIcon}>B</Text></View>
            <Text style={styles.emptyTitle}>No bills yet</Text>
            <Text style={styles.emptySub}>Create a bill to get started</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={bills.length === 0 && !loading ? styles.emptyContainer : styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: 10, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  summarySection: { padding: 16, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  revenueCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 20,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.md, marginBottom: 12,
    alignItems: 'center',
  },
  revenueLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  revenueValue: { fontSize: 32, fontWeight: '800', color: colors.success, letterSpacing: -0.5 },
  countsRow: { flexDirection: 'row', gap: 10 },
  countCard: { flex: 1, borderRadius: borderRadius.md, padding: 14, alignItems: 'center' },
  countNumber: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  countLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  chartCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  chartTitle: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.2, marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, marginTop: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  newBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: borderRadius.md, ...shadows.sm,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  listContent: { paddingBottom: 20 },
  billCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 14,
    marginHorizontal: 16, marginVertical: 4, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  billTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billInfo: { flex: 1 },
  billNumber: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  billPatient: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  billBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderLight },
  billAmount: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  billDate: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  empty: { alignItems: 'center', paddingHorizontal: 32, justifyContent: 'center' },
  emptyCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 24, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center', letterSpacing: -0.2 },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
