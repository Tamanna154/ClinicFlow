import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions, Platform, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
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

function StatPill({ value, label, color }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statPillValue, { color: color || colors.primary }]}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

function GridCard({ icon, label, value, color, bgColor }) {
  return (
    <View style={[styles.gridCard, bgColor ? { backgroundColor: bgColor } : null]}>
      <View style={styles.gridIconWrap}>
        <Text style={styles.gridIcon}>{icon}</Text>
      </View>
      <Text style={styles.gridValue}>{value}</Text>
      <Text style={styles.gridLabel}>{label}</Text>
    </View>
  );
}

function QuickActionBtn({ icon, label, onPress, isAdmin }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, isAdmin ? styles.actionBtnAdmin : null]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const [dashboard, setDashboard] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { formatCurrency } = useSettings();
  const isAdmin = user?.role === 'CLINIC_ADMIN' || user?.role === 'SUPER_ADMIN';

  const fetchData = useCallback(async (isRefresh) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [dash, trend] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getRevenueTrend().catch(() => null),
      ]);
      setDashboard(dash);
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

  if (!dashboard) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textSecondary }}>Could not load dashboard</Text>
      </View>
    );
  }

  const quickStats = [
    { value: dashboard.todayAppointments ?? 0, label: 'Today Appts', color: colors.primary },
    { value: dashboard.completedAppointments ?? 0, label: 'Completed', color: colors.success },
    { value: dashboard.pendingAppointments ?? 0, label: 'Pending', color: colors.warning },
    { value: dashboard.totalPatients ?? 0, label: 'Patients', color: colors.info },
    { value: dashboard.activeDoctors ?? 0, label: 'Doctors', color: colors.accent },
    { value: dashboard.activeStaff ?? 0, label: 'Staff', color: colors.textSecondary },
  ];

  const gridCards = [
    { icon: '📅', label: "Today's Appointments", value: dashboard.todayAppointments ?? 0, color: colors.primary },
    { icon: '✅', label: 'Completed Appointments', value: dashboard.completedAppointments ?? 0, color: colors.success },
    { icon: '⏳', label: 'Pending Appointments', value: dashboard.pendingAppointments ?? 0, color: colors.warning },
    { icon: '📆', label: 'Upcoming Appointments', value: dashboard.upcomingAppointments ?? 0, color: colors.info },
    { icon: '👥', label: 'Total Patients', value: dashboard.totalPatients ?? 0, color: colors.primary },
    { icon: '🩺', label: 'Active Doctors', value: dashboard.activeDoctors ?? 0, color: colors.accent },
    { icon: '👤', label: 'Active Staff', value: dashboard.activeStaff ?? 0, color: colors.textSecondary },
    { icon: '💰', label: "Today's Revenue", value: formatCurrency(dashboard.todayRevenue ?? 0), color: colors.success },
    { icon: '📊', label: 'Monthly Revenue', value: formatCurrency(dashboard.monthlyRevenue ?? 0), color: colors.primary },
    { icon: '📈', label: 'Net Profit', value: formatCurrency(dashboard.netProfit ?? 0), color: dashboard.netProfit >= 0 ? colors.success : colors.error },
    { icon: '⚠️', label: 'Low Stock Items', value: dashboard.lowStockItems ?? 0, color: colors.warning, bgColor: colors.warningLight },
    { icon: '🚨', label: 'Expiring Items', value: dashboard.expiringItems ?? 0, color: colors.error, bgColor: colors.errorLight },
    { icon: '📋', label: 'Pending Follow-Ups', value: dashboard.pendingFollowUps ?? 0, color: colors.info, bgColor: colors.infoLight },
    { icon: '🧾', label: 'Pending Bills', value: dashboard.pendingBills ?? 0, color: colors.warning, bgColor: colors.warningLight },
  ];

  const quickActions = [
    { icon: '📅', label: 'Manage Appointments', screen: 'AppointmentList', tab: null, admin: false },
    { icon: '👤', label: 'Add Patient', screen: 'PatientForm', tab: null, admin: false },
    { icon: '🩺', label: 'Add Doctor', screen: 'DoctorForm', tab: null, admin: true },
    { icon: '🧑‍💼', label: 'Add Staff', screen: 'StaffForm', tab: null, admin: true },
    { icon: '💊', label: 'Manage Medicines', screen: 'InventoryList', tab: 'Stock', admin: false },
    { icon: '📊', label: 'Financial Reports', screen: 'IncomeDashboard', tab: 'Finance', admin: false },
    { icon: '📦', label: 'Manage Inventory', screen: 'InventoryDashboard', tab: 'Stock', admin: false },
  ];

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
                <Text style={styles.adminName}>{user?.name || 'Admin'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
              <Text style={styles.bellIcon}>🔔</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSub}>Clinic overview at a glance</Text>
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
        <View style={styles.quickStatsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickStatsInner}>
            {quickStats.map((s, i) => (
              <StatPill key={i} value={s.value} label={s.label} color={s.color} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.revenueSection}>
          <View style={styles.revenueCard}>
            <View style={styles.revenueRow}>
              <View style={styles.revenueItem}>
                <Text style={styles.revenueLabel}>Today</Text>
                <Text style={styles.revenueValue}>{formatCurrency(dashboard.todayRevenue ?? 0)}</Text>
              </View>
              <View style={styles.revenueDivider} />
              <View style={styles.revenueItem}>
                <Text style={styles.revenueLabel}>Monthly</Text>
                <Text style={styles.revenueValue}>{formatCurrency(dashboard.monthlyRevenue ?? 0)}</Text>
              </View>
              <View style={styles.revenueDivider} />
              <View style={styles.revenueItem}>
                <Text style={styles.revenueLabel}>Net Profit</Text>
                <Text style={[
                  styles.revenueValue,
                  { color: (dashboard.netProfit ?? 0) >= 0 ? colors.success : colors.error },
                ]}>
                  {(dashboard.netProfit ?? 0) >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(dashboard.netProfit ?? 0))}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
        </View>
        <View style={styles.gridContainer}>
          {gridCards.map((card, i) => (
            <GridCard key={i} icon={card.icon} label={card.label} value={card.value} color={card.color} bgColor={card.bgColor} />
          ))}
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => {
            if (action.admin && !isAdmin) return null;
            return (
              <QuickActionBtn
                key={i}
                icon={action.icon}
                label={action.label}
                onPress={() => {
                  if (action.tab) {
                    navigation.getParent()?.navigate(action.tab, { screen: action.screen });
                  } else {
                    navigation.navigate(action.screen);
                  }
                }}
                isAdmin={action.admin}
              />
            );
          })}
        </View>

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
  adminName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 1 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF20', justifyContent: 'center', alignItems: 'center' },
  bellIcon: { fontSize: 18 },
  headerSub: { fontSize: 13, color: '#FFFFFFAA', marginTop: 8, marginLeft: 62 },
  quickStatsRow: { marginTop: 12, marginBottom: 4 },
  quickStatsInner: { paddingHorizontal: 16, gap: 10 },
  statPill: {
    backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
    alignItems: 'center', minWidth: 90,
  },
  statPillValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statPillLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  revenueSection: { paddingHorizontal: 16, marginTop: 16 },
  revenueCard: {
    backgroundColor: colors.surface, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.md,
  },
  revenueRow: { flexDirection: 'row', alignItems: 'center' },
  revenueItem: { flex: 1, alignItems: 'center' },
  revenueDivider: { width: 1, height: 40, backgroundColor: colors.borderLight, marginHorizontal: 8 },
  revenueLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  revenueValue: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, marginTop: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  gridContainer: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8,
  },
  gridCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
    marginBottom: 8,
  },
  gridIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridIcon: { fontSize: 16 },
  gridValue: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  gridLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 4 },
  chartCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8,
  },
  actionBtn: {
    width: '47%', backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4,
  },
  actionBtnAdmin: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '06',
  },
  actionIcon: { fontSize: 18 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: colors.text, flex: 1 },
});
