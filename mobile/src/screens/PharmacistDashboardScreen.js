import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Platform, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { inventoryApi } from '../api/inventoryApi';
import { billingApi } from '../api/billingApi';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 36);

function StatPill({ value, label, color }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statPillValue, { color: color || colors.primary }]}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
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

function TransactionRow({ item }) {
  const isIn = item.type === 'IN' || item.type === 'PURCHASE';
  return (
    <View style={styles.txnRow}>
      <View style={styles.txnLeft}>
        <Text style={styles.txnItemName}>{item.itemName}</Text>
        <Text style={styles.txnTime}>{item.createdAt}</Text>
      </View>
      <View style={styles.txnRight}>
        <View style={[styles.txnTypeBadge, { backgroundColor: isIn ? colors.successLight : colors.errorLight }]}>
          <Text style={[styles.txnTypeText, { color: isIn ? colors.success : colors.error }]}>
            {isIn ? 'IN' : 'OUT'}
          </Text>
        </View>
        <Text style={[styles.txnQty, { color: isIn ? colors.success : colors.error }]}>
          {isIn ? '+' : '-'}{Number(item.quantity).toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

export default function PharmacistDashboardScreen({ navigation }) {
  const [totalItems, setTotalItems] = useState(0);
  const [lowStock, setLowStock] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [todaySales, setTodaySales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { formatCurrency } = useSettings();

  const fetchData = useCallback(async (isRefresh) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [allItems, low, expiry, txns, summary] = await Promise.all([
        inventoryApi.getAll().catch(() => []),
        inventoryApi.getLowStock(),
        inventoryApi.getExpiryAlerts(),
        inventoryApi.getTransactions(),
        billingApi.getSummary().catch(() => null),
      ]);
      setTotalItems(Array.isArray(allItems) ? allItems.length : (allItems?.length || 0));
      setLowStock(low);
      setExpiryAlerts(expiry);
      setTransactions(Array.isArray(txns) ? txns : []);
      setTodaySales(summary?.todayTotal || summary?.todayRevenue || 0);
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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'P'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>Hello,</Text>
                <Text style={styles.pharmacistName}>{user?.name || 'Pharmacist'}</Text>
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Pharmacist</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>Manage your pharmacy and dispensary</Text>
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
        <View style={styles.quickStats}>
          <StatPill value={totalItems} label="Total Items" color={colors.primary} />
          <StatPill value={lowStock.length} label="Low Stock" color={colors.warning} />
          <StatPill value={expiryAlerts.length} label="Expiring Soon" color={colors.error} />
          <StatPill value={todaySales > 0 ? formatCurrency(todaySales) : '-'} label="Today's Sales" color={colors.success} />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickActionBtn
            icon="📦"
            label="Manage Inventory"
            onPress={() => navigation.navigate('InventoryDashboard')}
          />
          <QuickActionBtn
            icon="💊"
            label="Record Sale"
            onPress={() => navigation.navigate('MedicineBilling')}
          />
          <QuickActionBtn
            icon="➕"
            label="Add Medicine"
            onPress={() => navigation.navigate('InventoryForm', {})}
          />
          <QuickActionBtn
            icon="📋"
            label="Purchase Request"
            onPress={() => navigation.navigate('InventoryForm', {})}
          />
        </View>

        {lowStock.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
              <Text style={styles.sectionCount}>{lowStock.length}</Text>
            </View>
            {lowStock.slice(0, 5).map((item) => {
              const isCritical = Number(item.quantity) <= Number(item.minimumThreshold) * 0.5;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.alertCard, isCritical && styles.alertCardCritical]}
                  onPress={() => navigation.navigate('InventoryDetail', { item })}
                  activeOpacity={0.7}
                >
                  <View style={styles.alertLeft}>
                    <Text style={[styles.alertName, isCritical && { color: colors.error }]}>
                      {item.itemName}
                    </Text>
                    <Text style={styles.alertMeta}>
                      Qty: {Number(item.quantity).toFixed(1)} / Threshold: {Number(item.minimumThreshold).toFixed(1)}
                    </Text>
                  </View>
                  <View style={[styles.alertStatusDot, { backgroundColor: isCritical ? colors.error : colors.warning }]} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {expiryAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Expiring Soon</Text>
              <Text style={styles.sectionCount}>{expiryAlerts.length}</Text>
            </View>
            {expiryAlerts.slice(0, 5).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.alertCard}
                onPress={() => navigation.navigate('InventoryDetail', { item })}
                activeOpacity={0.7}
              >
                <View style={styles.alertLeft}>
                  <Text style={styles.alertName}>{item.itemName}</Text>
                  <Text style={styles.alertMeta}>
                    Batch: {item.batchNumber || '-'} | Exp: {item.expiryDate}
                  </Text>
                </View>
                <Text style={[styles.expiryDateText, item.expired ? { color: colors.error } : { color: colors.warning }]}>
                  {item.expired ? 'Expired' : item.expiryDate}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Transactions</Text>
            <Text style={styles.sectionCount}>{transactions.length}</Text>
          </View>
          {transactions.length > 0 ? (
            transactions.slice(0, 10).map((txn, idx) => (
              <TransactionRow key={txn.id || idx} item={txn} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySub}>Transactions will appear here</Text>
            </View>
          )}
        </View>
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
  pharmacistName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 1 },
  badge: {
    backgroundColor: '#FFFFFF20', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
  headerSub: { fontSize: 13, color: '#FFFFFFAA', marginTop: 8, marginLeft: 62 },
  quickStats: {
    flexDirection: 'row', marginHorizontal: 0, marginTop: 12,
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 12, ...shadows.md,
  },
  statPill: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRightWidth: 1, borderRightColor: colors.borderLight,
  },
  statPillValue: { fontSize: 22, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  statPillLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  section: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  sectionCount: { fontSize: 13, fontWeight: '600', color: colors.textMuted, backgroundColor: colors.borderLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12,
  },
  actionBtn: {
    width: '48%', backgroundColor: colors.surface, borderRadius: 16,
    padding: 18, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight,
    ...shadows.sm,
  },
  actionIcon: { fontSize: 26, marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
  alertCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 14, padding: 14, marginBottom: 6,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  alertCardCritical: {
    backgroundColor: colors.errorLight, borderColor: colors.error + '30',
  },
  alertLeft: { flex: 1 },
  alertName: { fontSize: 14, fontWeight: '600', color: colors.text },
  alertMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  alertStatusDot: {
    width: 10, height: 10, borderRadius: 5, marginLeft: 8,
  },
  expiryDateText: { fontSize: 12, fontWeight: '700' },
  txnRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  txnLeft: { flex: 1 },
  txnItemName: { fontSize: 14, fontWeight: '600', color: colors.text },
  txnTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  txnRight: { alignItems: 'flex-end', gap: 4 },
  txnTypeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  txnTypeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  txnQty: { fontSize: 14, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  emptySub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
