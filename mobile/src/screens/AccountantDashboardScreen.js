import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions, Platform, StatusBar, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { incomeApi } from '../api/incomeApi';
import { expenseApi } from '../api/expenseApi';
import { billingApi } from '../api/billingApi';
import { adminApi } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

const SCREEN_W = Dimensions.get('window').width - 32;
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 36);

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
  propsForLabels: { fontSize: 10, fontWeight: '600' },
  propsForBackgroundLines: { strokeDasharray: '', stroke: '#f1f5f9', strokeWidth: 1 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#0D9488' },
};

function SummaryCard({ icon, label, value, color, bgColor }) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: bgColor || colors.surface }]}>
      <View style={styles.summaryIconWrap}>
        <Text style={styles.summaryIcon}>{icon}</Text>
      </View>
      <Text style={[styles.summaryValue, { color: color || colors.text }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function QuickActionBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatusBadge({ status }) {
  const style = status === 'PAID' ? { bg: colors.statusCompletedBg, text: colors.statusCompleted }
    : status === 'PENDING' ? { bg: colors.statusInProgressBg, text: colors.statusInProgress }
    : status === 'PARTIAL' ? { bg: colors.statusScheduledBg, text: colors.statusScheduled }
    : { bg: colors.statusScheduledBg, text: colors.statusScheduled };
  return (
    <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
      <Text style={[styles.statusText, { color: style.text }]}>{status}</Text>
    </View>
  );
}

export default function AccountantDashboardScreen({ navigation }) {
  const [incomeSummary, setIncomeSummary] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [bills, setBills] = useState([]);
  const [billingSummary, setBillingSummary] = useState(null);
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      const [incomeSum, expData, billsData, billSum, adminDash, trend] = await Promise.all([
        incomeApi.getSummary().catch(() => null),
        expenseApi.getProfitReport().catch(() => null),
        billingApi.getAll().catch(() => []),
        billingApi.getSummary().catch(() => null),
        adminApi.getDashboard().catch(() => null),
        adminApi.getRevenueTrend().catch(() => null),
      ]);
      setIncomeSummary(incomeSum);
      setExpenseData(expData);
      setBills(billsData);
      setBillingSummary(billSum);
      setAdminDashboard(adminDash);
      if (trend) setRevenueTrend(trend);
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

  const todayRevenue = incomeSummary?.todayRevenue ?? billingSummary?.todayRevenue ?? adminDashboard?.todayRevenue ?? 0;
  const monthlyRevenue = incomeSummary?.monthlyRevenue ?? billingSummary?.totalRevenue ?? adminDashboard?.monthlyRevenue ?? 0;
  const pendingBills = billingSummary?.pendingBills ?? adminDashboard?.pendingBills ?? 0;
  const totalExpenses = expenseData?.totalExpenses ?? adminDashboard?.totalExpenses ?? 0;

  const pendingPayments = Array.isArray(bills)
    ? bills.filter(b => b.paymentStatus !== 'PAID').slice(0, 10)
    : [];

  const doctorPayouts = adminDashboard?.doctorPayouts ?? [];

  const lineData = revenueTrend ? {
    labels: revenueTrend.labels || [],
    datasets: [{ data: revenueTrend.data || [] }],
  } : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>Hello,</Text>
                <Text style={styles.accountantName}>{user?.name || 'Accountant'}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.bellBtn} 
              activeOpacity={0.7} 
              onPress={handleLogout}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={styles.bellIcon}>🚪</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSub}>Financial overview at a glance</Text>
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
        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="💰"
            label="Today's Revenue"
            value={formatCurrency(todayRevenue)}
            color={colors.success}
            bgColor={colors.successLight}
          />
          <SummaryCard
            icon="📊"
            label="Monthly Revenue"
            value={formatCurrency(monthlyRevenue)}
            color={colors.info}
            bgColor={colors.infoLight}
          />
          <SummaryCard
            icon="⏳"
            label="Pending Bills"
            value={pendingBills}
            color={colors.warning}
            bgColor={colors.warningLight}
          />
          <SummaryCard
            icon="💸"
            label="Total Expenses"
            value={formatCurrency(totalExpenses)}
            color={colors.error}
            bgColor={colors.errorLight}
          />
        </View>

        {lineData && lineData.labels.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Revenue Trend</Text>
            </View>
            <View style={styles.chartCard}>
              <LineChart
                data={lineData}
                width={SCREEN_W - 32}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: borderRadius.md }}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.actionsGrid}>
            <QuickActionBtn
              icon="🧾"
              label="View Bills"
              onPress={() => navigation.navigate('BillingDashboard')}
            />
            <QuickActionBtn
              icon="➕"
              label="Add Expense"
              onPress={() => navigation.navigate('AddExpense')}
            />
            <QuickActionBtn
              icon="📈"
              label="Financial Reports"
              onPress={() => navigation.navigate('IncomeDashboard')}
            />
          </View>
        </View>

        {bills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
            </View>
            {bills.slice(0, 5).map((bill, i) => (
              <TouchableOpacity
                key={bill.id || i}
                style={styles.transactionCard}
                onPress={() => navigation.navigate('BillDetail', { billId: bill.id })}
                activeOpacity={0.7}
              >
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionPatient}>{bill.patientName || `Patient #${bill.patientId}`}</Text>
                  <Text style={styles.transactionDate}>{new Date(bill.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>{formatCurrency(bill.totalAmount)}</Text>
                  <StatusBadge status={bill.paymentStatus} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {pendingPayments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Payments</Text>
              <Text style={styles.sectionCount}>{pendingPayments.length}</Text>
            </View>
            {pendingPayments.map((bill, i) => (
              <View key={bill.id || i} style={styles.pendingCard}>
                <View style={styles.pendingLeft}>
                  <Text style={styles.pendingName}>{bill.patientName || `Patient #${bill.patientId}`}</Text>
                  <Text style={styles.pendingDate}>{new Date(bill.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.pendingAmount}>{formatCurrency(bill.totalAmount)}</Text>
              </View>
            ))}
          </View>
        )}

        {doctorPayouts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Doctor Payout Summary</Text>
            </View>
            {doctorPayouts.map((payout, i) => (
              <View key={i} style={styles.payoutCard}>
                <View style={styles.payoutLeft}>
                  <Text style={styles.payoutName}>Dr. {payout.doctorName}</Text>
                </View>
                <Text style={styles.payoutAmount}>{formatCurrency(payout.pendingAmount)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 24 },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12,
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
  accountantName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 1 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF20', justifyContent: 'center', alignItems: 'center' },
  bellIcon: { fontSize: 18 },
  headerSub: { fontSize: 13, color: '#FFFFFFAA', marginTop: 8, marginLeft: 62 },
  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12,
    marginTop: 16, gap: 8,
  },
  summaryCard: {
    width: '47%', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
    marginBottom: 8,
  },
  summaryIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
    marginBottom: 10, ...shadows.sm,
  },
  summaryIcon: { fontSize: 18 },
  summaryValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  sectionCount: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    backgroundColor: colors.borderLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
  },
  chartCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  actionsGrid: {
    flexDirection: 'row', gap: 8,
  },
  actionBtn: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 16,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
    alignItems: 'center', gap: 8,
  },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  transactionCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  transactionLeft: { flex: 1 },
  transactionPatient: { fontSize: 14, fontWeight: '600', color: colors.text },
  transactionDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  transactionRight: { alignItems: 'flex-end', marginLeft: 12 },
  transactionAmount: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  pendingCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.warningLight, borderRadius: 14, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: colors.warning + '20', ...shadows.sm,
  },
  pendingLeft: { flex: 1 },
  pendingName: { fontSize: 14, fontWeight: '600', color: colors.text },
  pendingDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  pendingAmount: { fontSize: 16, fontWeight: '800', color: colors.warning },
  payoutCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  payoutLeft: { flex: 1 },
  payoutName: { fontSize: 14, fontWeight: '600', color: colors.text },
  payoutAmount: { fontSize: 16, fontWeight: '800', color: colors.accent },
});
