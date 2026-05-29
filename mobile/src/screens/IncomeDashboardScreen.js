import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Alert, RefreshControl,
  ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { incomeApi } from '../api/incomeApi';
import { expenseApi } from '../api/expenseApi';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

const SCREEN_W = Dimensions.get('window').width - 32;
const CHART_W = SCREEN_W - 32;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(13, 94, 110, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
  propsForLabels: { fontSize: 10, fontWeight: '600' },
  propsForBackgroundLines: { strokeDasharray: '', stroke: '#f1f5f9', strokeWidth: 1 },
  barPercentage: 0.5,
};

export default function IncomeDashboardScreen({ navigation }) {
  const { formatCurrency, currencySymbol } = useSettings();
  const [summary, setSummary] = useState(null);
  const [profit, setProfit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('6m');

  const fetchData = useCallback(async (isRefresh) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [s, p] = await Promise.race([
        Promise.all([
          incomeApi.getSummary(),
          expenseApi.getProfitReport(),
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 10000)),
      ]);
      if (s) setSummary(s);
      if (p) setProfit(p);
    } catch (err) {
      if (!isRefresh) Alert.alert('Connection', 'Could not load financial data');
      setProfit(null);
      setSummary(null);
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
        <Text style={{ marginTop: 10, fontSize: 14, color: colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  if (!profit || !summary) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
      >
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Financial Dashboard</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No financial data yet</Text>
          <Text style={styles.emptySub}>Add expenses and create bills to see reports</Text>
        </View>
      </ScrollView>
    );
  }

  let trends = profit.monthlyTrend || [];
  trends = trends.filter(t => t.income > 0 || t.expense > 0);
  if (trends.length === 0) {
    const m = new Date().getMonth() + 1;
    const y = new Date().getFullYear();
    trends = [{ year: y, month: m, income: profit.totalIncome, expense: profit.totalExpense, profit: profit.netProfit }];
  }
  const filteredTrends = filter === 'all' ? trends : trends.slice(-6);

  const incomeLabels = filteredTrends.map(d => MONTHS[(d.month - 1) % 12] || '');
  const incomeVals = filteredTrends.map(d => Number(d.income));
  const expenseVals = filteredTrends.map(d => Number(d.expense));
  const profitVals = filteredTrends.map(d => Number(d.profit));

  const incomeExpenseData = {
    labels: incomeLabels,
    datasets: [
      { data: incomeVals.length ? incomeVals : [0] },
      { data: expenseVals.length ? expenseVals : [0] },
    ],
  };

  const profitTrendData = {
    labels: incomeLabels,
    datasets: [{ data: profitVals.length ? profitVals : [0] }],
  };

  const hasApptRev = Number(summary.appointmentRevenue) > 0;
  const hasMedRev = Number(summary.medicineRevenue) > 0;

  const revenuePieData = hasApptRev || hasMedRev ? [
    ...(hasApptRev ? [{ name: 'Appointments', population: Number(summary.appointmentRevenue), color: colors.info, legendFontColor: colors.textSecondary, legendFontSize: 12 }] : []),
    ...(hasMedRev ? [{ name: 'Medicine Sales', population: Number(summary.medicineRevenue), color: colors.warning, legendFontColor: colors.textSecondary, legendFontSize: 12 }] : []),
  ] : [];

  const expensePieData = profit.expenseBreakdown && Object.keys(profit.expenseBreakdown).length
    ? Object.entries(profit.expenseBreakdown).filter(([, amt]) => Number(amt) > 0).map(([cat, amt], i) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase(),
      population: Number(amt),
      color: [colors.accent, colors.info, colors.warning, colors.success, colors.primary, '#8B5CF6', '#EC4899', '#14B8A6'][i % 8],
      legendFontColor: colors.textSecondary,
      legendFontSize: 12,
    }))
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Financial Dashboard</Text>
          <Text style={styles.pageSub}>Real-time profit & revenue</Text>
        </View>
        <TouchableOpacity style={styles.currencyBtn} onPress={() => navigation.navigate('CurrencySettings')} activeOpacity={0.7}>
          <Text style={styles.currencyBtnText}>{currencySymbol}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profitBanner}>
        <Text style={styles.profitLabel}>NET PROFIT</Text>
        <Text style={[styles.profitValue, { color: profit.netProfit >= 0 ? colors.success : colors.error }]}>
          {formatCurrency(profit.netProfit)}
        </Text>
        <View style={styles.profitMeta}>
          <Text style={styles.profitMetaText}>Income: {formatCurrency(profit.totalIncome)}  |  Expenses: {formatCurrency(profit.totalExpense)}</Text>
        </View>
        <View style={styles.periodRow}>
          <View style={styles.periodItem}>
            <Text style={styles.periodLabel}>Today</Text>
            <Text style={[styles.periodValue, { color: profit.todayProfit >= 0 ? colors.success : colors.error }]}>{formatCurrency(profit.todayProfit)}</Text>
          </View>
          <View style={styles.periodDivider} />
          <View style={styles.periodItem}>
            <Text style={styles.periodLabel}>This Month</Text>
            <Text style={[styles.periodValue, { color: profit.monthlyProfit >= 0 ? colors.success : colors.error }]}>{formatCurrency(profit.monthlyProfit)}</Text>
          </View>
          <View style={styles.periodDivider} />
          <View style={styles.periodItem}>
            <Text style={styles.periodLabel}>This Year</Text>
            <Text style={[styles.periodValue, { color: profit.yearlyProfit >= 0 ? colors.success : colors.error }]}>{formatCurrency(profit.yearlyProfit)}</Text>
          </View>
        </View>
      </View>

      {revenuePieData.length > 0 && (
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Revenue Sources</Text>
          </View>
          <PieChart
            data={revenuePieData}
            width={CHART_W}
            height={180}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </View>
      )}

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Income vs Expenses</Text>
          <View style={styles.filterRow}>
            {['all', '6m'].map(f => (
              <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]}
                onPress={() => setFilter(f)}>
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === 'all' ? '12M' : '6M'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <BarChart
          data={incomeExpenseData}
          width={CHART_W}
          height={200}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          fromZero
          style={styles.chart}
        />
        <View style={styles.legendRow}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>Income</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.accent }]} /><Text style={styles.legendText}>Expenses</Text></View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Profit Trend</Text>
        </View>
        <LineChart
          data={profitTrendData}
          width={CHART_W}
          height={200}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
            propsForDots: { r: '4', strokeWidth: '2', stroke: colors.success },
          }}
          bezier
          fromZero
          style={styles.chart}
        />
      </View>

      {expensePieData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Expense Breakdown</Text>
          <PieChart
            data={expensePieData}
            width={CHART_W}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddExpense')} activeOpacity={0.8}>
          <Text style={styles.actionText}>+ Add Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Billing', { screen: 'MedicineBilling' })} activeOpacity={0.8}>
          <Text style={styles.actionText}>+ New Bill</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  pageSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  currencyBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  currencyBtnText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  profitBanner: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 20, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.md },
  profitLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 4 },
  profitValue: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  profitMeta: { flexDirection: 'row', marginTop: 8 },
  profitMetaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  periodRow: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  periodItem: { flex: 1, alignItems: 'center' },
  periodLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  periodValue: { fontSize: 14, fontWeight: '800' },
  periodDivider: { width: 1, backgroundColor: colors.borderLight },
  chartCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  chart: { borderRadius: borderRadius.md, marginLeft: -8 },
  filterRow: { flexDirection: 'row', gap: 4 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.bg },
  filterChipActive: { backgroundColor: colors.primary + '15' },
  filterText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  filterTextActive: { color: colors.primary, fontWeight: '700' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, backgroundColor: colors.accent, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', ...shadows.sm },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
