import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { inventoryApi } from '../api/inventoryApi';
import { useAuth } from '../context/AuthContext';
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

function SummaryCard({ label, value, color, icon }) {
  return (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function InventoryDashboardScreen({ navigation }) {
  const [analytics, setAnalytics] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useSettings();
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [analyticsData, lowStockData, expiryData] = await Promise.all([
        isDoctor ? inventoryApi.getAnalytics() : Promise.resolve(null),
        inventoryApi.getLowStock(),
        inventoryApi.getExpiryAlerts(),
      ]);
      if (analyticsData) setAnalytics(analyticsData);
      setLowStock(lowStockData);
      setExpiryAlerts(expiryData);
    } catch (err) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const summary = analytics?.summary || {};
  const totalItems = summary.totalItems || 0;
  const internalCount = summary.internalCount || 0;
  const externalCount = summary.externalCount || 0;
  const healthyCount = Math.max(totalItems - lowStock.length, 0);

  const stockTypeData = [
    { name: 'Internal', population: Math.max(internalCount, 1), color: colors.info, legendFontColor: colors.textSecondary, legendFontSize: 12 },
    { name: 'External', population: Math.max(externalCount, 1), color: colors.accent, legendFontColor: colors.textSecondary, legendFontSize: 12 },
  ];

  const stockHealthData = {
    labels: ['Healthy', 'Low Stock'],
    datasets: [{ data: [Math.max(healthyCount, 1), Math.max(lowStock.length, 1)] }],
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      <Text style={styles.pageTitle}>Inventory Overview</Text>

      <View style={styles.summaryGrid}>
        <SummaryCard label="Total Items" value={totalItems || '-'} color={colors.primary} />
        <SummaryCard label="Low Stock" value={lowStock.length} color={colors.warning} />
        <SummaryCard label="Expired/Near" value={expiryAlerts.length} color={colors.error} />
        <SummaryCard label="Total Value" value={analytics?.totalInventoryValue != null ? formatCurrency(analytics.totalInventoryValue) : '-'} color={colors.success} />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Stock Type Distribution</Text>
        <PieChart
          data={stockTypeData}
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
        <Text style={styles.chartTitle}>Stock Health</Text>
        <BarChart
          data={stockHealthData}
          width={SCREEN_W - 32}
          height={180}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
          }}
          fromZero
          style={{ borderRadius: borderRadius.md }}
        />
      </View>

      {isDoctor && analytics?.mostConsumed?.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Most Consumed Items</Text>
          {analytics.mostConsumed.slice(0, 5).map((entry, idx) => {
            const maxQty = Math.max(...analytics.mostConsumed.map(e => Number(e.totalUsed)), 1);
            const barWidth = (Number(entry.totalUsed) / maxQty) * 100;
            return (
              <View key={entry.itemId} style={styles.consumedRow}>
                <View style={[styles.rankBadge, { backgroundColor: idx === 0 ? colors.warningLight : colors.bg }]}>
                  <Text style={[styles.rankText, { color: idx === 0 ? colors.warning : colors.textMuted }]}>{idx + 1}</Text>
                </View>
                <View style={styles.consumedInfo}>
                  <Text style={styles.consumedName}>{entry.itemName}</Text>
                  <View style={styles.consumedBarOuter}>
                    <View style={[styles.consumedBarInner, { width: `${barWidth}%` }]} />
                  </View>
                  <Text style={styles.consumedQty}>{Number(entry.totalUsed).toFixed(1)} units</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {lowStock.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Low Stock Items</Text>
          {lowStock.slice(0, 5).map((item) => (
            <TouchableOpacity key={item.id} style={styles.alertCard} onPress={() => navigation.navigate('InventoryDetail', { item })} activeOpacity={0.7}>
              <View style={styles.alertLeft}>
                <Text style={styles.alertName}>{item.itemName}</Text>
                <Text style={styles.alertMeta}>{Number(item.quantity).toFixed(1)} / {Number(item.minimumThreshold).toFixed(1)} threshold</Text>
              </View>
              <Text style={styles.alertArrow}>›</Text>
            </TouchableOpacity>
          ))}
          {lowStock.length > 5 && (
            <TouchableOpacity onPress={() => navigation.navigate('InventoryList')} style={styles.seeAll}>
              <Text style={styles.seeAllText}>See all {lowStock.length} low stock items</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {expiryAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expiry Alerts</Text>
          {expiryAlerts.slice(0, 5).map((item) => (
            <TouchableOpacity key={item.id} style={styles.alertCard} onPress={() => navigation.navigate('InventoryDetail', { item })} activeOpacity={0.7}>
              <View style={styles.alertLeft}>
                <Text style={styles.alertName}>{item.itemName}</Text>
                <Text style={[styles.alertMeta, item.expired ? { color: colors.error } : { color: colors.warning }]}>
                  {item.expired ? `Expired: ${item.expiryDate}` : `Expires: ${item.expiryDate}`}
                </Text>
              </View>
              <Text style={styles.alertArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('InventoryList')} activeOpacity={0.7}>
          <Text style={styles.quickBtnText}>View All Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, styles.quickBtnSecondary]} onPress={() => navigation.navigate('InventoryForm', {})} activeOpacity={0.7}>
          <Text style={[styles.quickBtnText, styles.quickBtnSecondaryText]}>Add New Item</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3, marginBottom: 16 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  summaryCard: {
    width: '48%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16,
    borderLeftWidth: 4, ...shadows.sm, borderWidth: 1, borderColor: colors.borderLight,
  },
  summaryValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  chartCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  chartTitle: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.2, marginBottom: 8 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10, letterSpacing: -0.2 },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  alertLeft: { flex: 1 },
  alertName: { fontSize: 14, fontWeight: '600', color: colors.text },
  alertMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  alertArrow: { fontSize: 20, color: colors.border, fontWeight: '300' },
  seeAll: { alignItems: 'center', paddingVertical: 8, marginTop: 4 },
  seeAllText: { fontSize: 13, fontWeight: '600', color: colors.primaryLight },
  consumedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankText: { fontSize: 12, fontWeight: '800' },
  consumedInfo: { flex: 1 },
  consumedName: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 },
  consumedBarOuter: { height: 6, borderRadius: 3, backgroundColor: colors.borderLight, marginBottom: 2 },
  consumedBarInner: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  consumedQty: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  quickActions: { gap: 8, marginTop: 8 },
  quickBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', ...shadows.md },
  quickBtnSecondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  quickBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  quickBtnSecondaryText: { color: colors.primary },
});
