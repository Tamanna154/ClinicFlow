import React, { useCallback, useState } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { inventoryApi } from '../api/inventoryApi';
import { usePermission } from '../hooks/usePermission';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

const STOCK_TYPES = ['ALL', 'INTERNAL', 'EXTERNAL'];

function statusBadge(item) {
  if (item.archived) return { label: 'Archived', bg: '#F3F4F6', text: '#6B7280' };
  if (item.expired) return { label: 'Expired', bg: '#FEF2F2', text: '#DC2626' };
  if (item.isLowStock) return { label: 'Low Stock', bg: '#FFFBEB', text: '#D97706' };
  if (item.isNearExpiry) return { label: 'Expiring Soon', bg: '#FFF0ED', text: '#E8634A' };
  return { label: 'In Stock', bg: '#ECFDF5', text: '#059669' };
}

export default function InventoryListScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockTypeFilter, setStockTypeFilter] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const { hasPermission } = usePermission();
  const { formatCurrency } = useSettings();
  const canManage = hasPermission('MANAGE_INVENTORY');

  const fetchItems = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const data = showArchived
        ? await inventoryApi.getAll(null, true)
        : stockTypeFilter === 'ALL'
          ? await inventoryApi.getAll()
          : await inventoryApi.getAll(stockTypeFilter);
      setItems(data);
    } catch (err) {
      Alert.alert('Connection Error', 'Could not reach the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchItems(); }, [stockTypeFilter, showArchived]));

  const filtered = items.filter((i) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (i.itemName || '').toLowerCase().includes(q)
        || (i.category || '').toLowerCase().includes(q)
        || (i.supplierName || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.filterRow}>
          <ScrollableChips options={STOCK_TYPES} selected={stockTypeFilter} onSelect={setStockTypeFilter} />
          <View style={styles.archivedToggle}>
            <Text style={styles.archivedLabel}>Archived</Text>
            <TouchableOpacity
              style={[styles.archivedSwitch, showArchived && styles.archivedSwitchOn]}
              onPress={() => setShowArchived(!showArchived)}
              activeOpacity={0.7}
            >
              <View style={[styles.archivedKnob, showArchived && styles.archivedKnobOn]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const badge = statusBadge(item);
          return (
            <TouchableOpacity
              style={[styles.card, item.archived && styles.cardArchived]}
              onPress={() => navigation.navigate('InventoryDetail', { item })}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={[styles.cardAvatar, { backgroundColor: item.stockType === 'INTERNAL' ? '#EDF7FA' : '#FFF0ED' }]}>
                  <Text style={styles.cardAvatarText}>{item.itemName?.charAt(0)?.toUpperCase() || 'I'}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, item.archived && styles.cardNameArchived]} numberOfLines={1}>{item.itemName}</Text>
                  <Text style={styles.cardMeta}>{item.category || item.stockType} · {item.unitType || 'unit'}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <View style={styles.qtyRow}>
                  <Text style={styles.qtyValue}>{Number(item.quantity).toFixed(1)}</Text>
                  <Text style={styles.qtyLabel}>in stock</Text>
                </View>
                <View style={styles.priceRow}>
                  {item.sellingPrice != null && <Text style={styles.priceText}>{formatCurrency(item.sellingPrice)}</Text>}
                  {item.expiryDate && <Text style={styles.expiryText}>Exp: {item.expiryDate}</Text>}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyCircle}><Text style={styles.emptyIcon}>S</Text></View>
            <Text style={styles.emptyTitle}>{searchQuery ? 'No results' : 'No inventory items'}</Text>
            <Text style={styles.emptySub}>{searchQuery ? 'Try a different search' : 'Tap + to add an item'}</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchItems(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      {canManage && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('InventoryForm', {})} activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ScrollableChips({ options, selected, onSelect }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          style={[styles.chip, selected === o && styles.chipActive]}
          onPress={() => onSelect(o)}
        >
          <Text style={[styles.chipText, selected === o && styles.chipTextActive]}>{o === 'ALL' ? 'All' : o === 'INTERNAL' ? 'Internal' : 'External'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: 10, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  searchSection: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: borderRadius.md, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, height: 42 },
  searchIcon: { fontSize: 18, color: colors.textMuted, marginRight: 8, fontWeight: '700' },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500', paddingVertical: 0 },
  clearBtn: { padding: 4 },
  clearIcon: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'space-between' },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: borderRadius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primary },
  archivedToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  archivedLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  archivedSwitch: { width: 36, height: 20, borderRadius: 10, backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 2 },
  archivedSwitchOn: { backgroundColor: colors.primary },
  archivedKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF' },
  archivedKnobOn: { alignSelf: 'flex-end' },
  listContent: { paddingVertical: 8, paddingBottom: 80 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16, marginHorizontal: 16, marginVertical: 5, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  cardArchived: { opacity: 0.6, borderStyle: 'dashed' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardAvatar: { width: 40, height: 40, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardAvatarText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  cardNameArchived: { color: colors.textMuted },
  cardMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderLight },
  qtyRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  qtyValue: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  qtyLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  priceRow: { alignItems: 'flex-end' },
  priceText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  expiryText: { fontSize: 11, color: colors.error, fontWeight: '600', marginTop: 1 },
  empty: { alignItems: 'center', paddingHorizontal: 32, justifyContent: 'center' },
  emptyCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 24, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center', letterSpacing: -0.2 },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', ...shadows.lg },
  fabText: { fontSize: 28, color: '#FFFFFF', fontWeight: '400', lineHeight: 28, marginTop: -1 },
});
