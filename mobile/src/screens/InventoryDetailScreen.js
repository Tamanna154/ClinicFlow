import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { inventoryApi } from '../api/inventoryApi';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows, typography } from '../theme';

export default function InventoryDetailScreen({ route, navigation }) {
  const { item: routeItem } = route.params;
  const [item, setItem] = useState(routeItem);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('STOCK_ADDED');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { formatCurrency } = useSettings();
  const canManage = hasPermission('MANAGE_INVENTORY');
  const isDoctor = user?.role === 'DOCTOR';

  const fetchDetail = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [data, txns] = await Promise.all([
        inventoryApi.getById(item.id),
        inventoryApi.getTransactions(item.id),
      ]);
      setItem(data);
      setTransactions(txns);
    } catch (err) {
      Alert.alert('Error', 'Failed to load details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDetail(); }, []));

  const handleAdjust = async () => {
    const qty = parseFloat(adjustQty);
    if (!qty || qty <= 0) { Alert.alert('Invalid', 'Enter a positive quantity'); return; }
    setSaving(true);
    try {
      const updated = await inventoryApi.adjustStock(item.id, {
        quantity: qty,
        transactionType: adjustType,
        notes: adjustNotes.trim() || null,
      });
      setItem(updated);
      setAdjustQty('');
      setAdjustNotes('');
      setShowAdjust(false);
      const txns = await inventoryApi.getTransactions(item.id);
      setTransactions(txns);
      Alert.alert('Success', 'Stock updated');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = () => {
    Alert.alert('Archive Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: item.archived ? 'Restore' : 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = item.archived ? await inventoryApi.restore(item.id) : await inventoryApi.archive(item.id);
            setItem(updated);
          } catch (err) { Alert.alert('Error', err.message); }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const badge = () => {
    if (item.archived) return { label: 'Archived', bg: '#F3F4F6', text: '#6B7280' };
    if (item.expired) return { label: 'Expired', bg: '#FEF2F2', text: '#DC2626' };
    if (item.isLowStock) return { label: 'Low Stock', bg: '#FFFBEB', text: '#D97706' };
    if (item.isNearExpiry) return { label: 'Expiring Soon', bg: '#FFF0ED', text: '#E8634A' };
    return { label: 'In Stock', bg: '#ECFDF5', text: '#059669' };
  };

  const b = item.archived ? { label: 'Archived', bg: '#F3F4F6', text: '#6B7280' } : badge();
  const needsRestock = !item.archived && item.quantity <= item.minimumThreshold;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDetail(true)} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      <View style={styles.headerCard}>
        <View style={[styles.avatar, { backgroundColor: item.stockType === 'INTERNAL' ? '#EDF7FA' : '#FFF0ED' }]}>
          <Text style={styles.avatarText}>{item.itemName?.charAt(0)?.toUpperCase() || 'I'}</Text>
        </View>
        <Text style={styles.itemName}>{item.itemName}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: b.bg }]}><Text style={[styles.badgeText, { color: b.text }]}>{b.label}</Text></View>
          <View style={[styles.typeBadge, { backgroundColor: item.stockType === 'INTERNAL' ? '#EDF7FA' : '#FFF0ED' }]}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: item.stockType === 'INTERNAL' ? colors.primary : colors.accent }}>{item.stockType}</Text>
          </View>
        </View>
      </View>

      {needsRestock && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>!</Text>
          <Text style={styles.warningText}>Low stock: {Number(item.quantity).toFixed(1)} remaining (threshold: {Number(item.minimumThreshold).toFixed(1)})</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Number(item.quantity).toFixed(1)}</Text>
          <Text style={styles.statLabel}>Quantity</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{item.unitType || 'unit'}</Text>
          <Text style={styles.statLabel}>Unit</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{item.category || '-'}</Text>
          <Text style={styles.statLabel}>Category</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pricing & Supplier</Text>
        <DetailRow label="Purchase Price" value={item.purchasePrice != null ? formatCurrency(item.purchasePrice) : '-'} />
        {item.stockType === 'EXTERNAL' && <DetailRow label="Selling Price" value={item.sellingPrice != null ? formatCurrency(item.sellingPrice) : '-'} />}
        <DetailRow label="Supplier" value={item.supplierName || '-'} />
        <DetailRow label="Batch Number" value={item.batchNumber || '-'} />
        <DetailRow label="Expiry Date" value={item.expiryDate || '-'} />
        <DetailRow label="Description" value={item.description || '-'} last />
      </View>

      {canManage && !item.archived && (
        <View style={styles.card}>
          <TouchableOpacity style={styles.adjustToggle} onPress={() => setShowAdjust(!showAdjust)} activeOpacity={0.7}>
            <Text style={styles.adjustToggleText}>{showAdjust ? 'Cancel' : 'Adjust Stock'}</Text>
          </TouchableOpacity>
          {showAdjust && (
            <View>
              <View style={styles.pillRow}>
                {['STOCK_ADDED', 'STOCK_USED', 'MANUAL_ADJUSTMENT', 'EXPIRED_REMOVED'].map((t) => (
                  <TouchableOpacity key={t} style={[styles.adjPill, adjustType === t && styles.adjPillActive]} onPress={() => setAdjustType(t)}>
                    <Text style={[styles.adjPillText, adjustType === t && styles.adjPillTextActive]}>{t.replace(/_/g, ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.input} value={adjustQty} onChangeText={setAdjustQty} placeholder="Quantity" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
              <TextInput style={[styles.input, { marginTop: 8 }]} value={adjustNotes} onChangeText={setAdjustNotes} placeholder="Optional notes..." placeholderTextColor={colors.textMuted} />
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleAdjust} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Apply Adjustment</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {transactions.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.map((t) => (
            <View key={t.id} style={styles.txnRow}>
              <View style={styles.txnLeft}>
                <Text style={[styles.txnType, t.quantityChanged > 0 ? styles.txnIn : styles.txnOut]}>
                  {t.transactionType}
                </Text>
                <Text style={styles.txnQty}>{t.quantityChanged > 0 ? '+' : ''}{Number(t.quantityChanged).toFixed(1)}</Text>
              </View>
              <View style={styles.txnRight}>
                <Text style={styles.txnDate}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}</Text>
                {t.notes && <Text style={styles.txnNotes} numberOfLines={1}>{t.notes}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {isDoctor && canManage && (
        <TouchableOpacity style={styles.archiveBtn} onPress={handleArchive} activeOpacity={0.7}>
          <Text style={styles.archiveBtnText}>{item.archived ? 'Restore Item' : 'Archive Item'}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value, last }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.md },
  avatar: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  itemName: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  warningBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warningLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: borderRadius.md, marginBottom: 16, borderWidth: 0.5, borderColor: '#FDE68A' },
  warningIcon: { fontSize: 12, fontWeight: '800', color: colors.warning, marginRight: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.warning + '20', textAlign: 'center', lineHeight: 18, overflow: 'hidden' },
  warningText: { fontSize: 12, color: '#92400E', fontWeight: '600', flex: 1 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  detailRow: { paddingVertical: 10 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  detailLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  adjustToggle: { alignItems: 'center', paddingVertical: 8 },
  adjustToggleText: { fontSize: 14, fontWeight: '700', color: colors.primaryLight },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  adjPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  adjPillActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  adjPillText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  adjPillTextActive: { color: colors.primary },
  input: { backgroundColor: colors.bg, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, fontWeight: '500' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  txnLeft: { flex: 1 },
  txnType: { fontSize: 13, fontWeight: '700' },
  txnIn: { color: colors.success },
  txnOut: { color: colors.error },
  txnQty: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  txnRight: { alignItems: 'flex-end' },
  txnDate: { fontSize: 11, color: colors.textMuted },
  txnNotes: { fontSize: 11, color: colors.textSecondary, maxWidth: 120, marginTop: 2 },
  archiveBtn: { backgroundColor: colors.errorLight, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.error + '30' },
  archiveBtnText: { fontSize: 14, fontWeight: '700', color: colors.error },
});
