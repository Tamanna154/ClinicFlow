import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { billingApi } from '../api/billingApi';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

export default function BillDetailScreen({ route }) {
  const { billId } = route.params;
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  const { formatCurrency } = useSettings();

  const fetchBill = async () => {
    try {
      const data = await billingApi.getById(billId);
      setBill(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchBill(); }, [billId]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Bill not found</Text>
      </View>
    );
  }

  const getStatusColor = (s) => {
    switch (s) {
      case 'PAID': return colors.success;
      case 'PENDING': return colors.warning;
      case 'PARTIAL': return colors.info;
      default: return colors.textMuted;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.billNumber}>{bill.billNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bill.paymentStatus) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(bill.paymentStatus) }]}>{bill.paymentStatus}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Patient</Text>
          <Text style={styles.infoValue}>{bill.patientName || `ID: ${bill.patientId}`}</Text>
        </View>
        {bill.patientPhone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{bill.patientPhone}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>{new Date(bill.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Payment</Text>
          <Text style={styles.infoValue}>{bill.paymentMethod || '-'}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Items</Text>
      {(bill.items || []).map((item, idx) => (
        <View key={item.id || idx} style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.itemName}</Text>
                            <Text style={styles.itemQty}>{Number(item.quantity)} × {formatCurrency(item.sellingPrice)}</Text>
                </View>
                          <Text style={styles.itemTotal}>{formatCurrency(item.lineTotal)}</Text>
        </View>
      ))}

      <View style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(bill.subtotal)}</Text>
        </View>
        {Number(bill.discount) > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={[styles.totalValue, { color: colors.error }]}>-{formatCurrency(bill.discount)}</Text>
          </View>
        )}
        {Number(bill.tax) > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>{formatCurrency(bill.tax)}</Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>{formatCurrency(bill.totalAmount)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  errorText: { fontSize: 16, color: colors.error, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  billNumber: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 13, fontWeight: '700' },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.text },
  itemQty: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: '700', color: colors.primary },
  totalCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16,
    marginTop: 8, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 14, color: colors.textSecondary },
  totalValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  grandTotal: { marginTop: 8, paddingTop: 10, borderTopWidth: 2, borderTopColor: colors.border },
  grandLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
  grandValue: { fontSize: 20, fontWeight: '800', color: colors.primary, letterSpacing: -0.3 },
});
