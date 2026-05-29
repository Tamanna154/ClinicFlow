import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { inventoryApi } from '../api/inventoryApi';
import { patientApi } from '../api/patientApi';
import { billingApi } from '../api/billingApi';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

export default function MedicineBillingScreen({ navigation }) {
  const [step, setStep] = useState('selectPatient');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchPatient, setSearchPatient] = useState('');
  const [externalItems, setExternalItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const { formatCurrency } = useSettings();
  const [submitting, setSubmitting] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await patientApi.getAll();
      setPatients(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getAll('EXTERNAL');
      setExternalItems(data.filter(i => !i.archived && Number(i.quantity) > 0));
    } catch (err) {
      Alert.alert('Error', 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    if (step === 'selectPatient') fetchPatients();
    if (step === 'selectItems') fetchItems();
  }, [step]));

  const filteredPatients = patients.filter(p => {
    const q = searchPatient.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.phone?.includes(q);
  });

  const addToCart = (item) => {
    const existing = cart.find(c => c.inventoryItemId === item.id);
    if (existing) {
      setCart(cart.map(c =>
        c.inventoryItemId === item.id
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        inventoryItemId: item.id,
        itemName: item.itemName,
        sellingPrice: Number(item.sellingPrice),
        quantity: 1,
        maxQty: Number(item.quantity),
      }]);
    }
  };

  const updateQty = (itemId, qty) => {
    const num = parseInt(qty) || 0;
    const item = cart.find(c => c.inventoryItemId === itemId);
    if (!item) return;
    if (num <= 0) {
      setCart(cart.filter(c => c.inventoryItemId !== itemId));
    } else if (num > item.maxQty) {
      Alert.alert('Max Quantity', `Only ${item.maxQty} available`);
    } else {
      setCart(cart.map(c => c.inventoryItemId === itemId ? { ...c, quantity: num } : c));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const discountVal = parseFloat(discount) || 0;
  const totalAmount = Math.max(0, subtotal - discountVal);

  const handleCreateBill = async () => {
    if (!selectedPatient) {
      Alert.alert('Error', 'Please select a patient');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }
    try {
      setSubmitting(true);
      const bill = await billingApi.create({
        patientId: selectedPatient.id,
        discount: discountVal,
        tax: 0,
        paymentMethod,
        paymentStatus: 'PAID',
        items: cart.map(c => ({
          inventoryItemId: c.inventoryItemId,
          quantity: c.quantity,
        })),
      });
      Alert.alert('Success', `Bill ${bill.billNumber} created successfully`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && step === 'selectPatient') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Step 1: Select Patient */}
      {step === 'selectPatient' && (
        <View>
          <Text style={styles.heading}>Select Patient</Text>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or phone..."
              placeholderTextColor={colors.textMuted}
              value={searchPatient}
              onChangeText={setSearchPatient}
            />
          </View>
          {filteredPatients.map(p => (
            <TouchableOpacity
              key={p.id}
              style={styles.selectCard}
              onPress={() => { setSelectedPatient(p); setStep('selectItems'); }}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{p.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={styles.selectInfo}>
                <Text style={styles.selectName}>{p.name}</Text>
                <Text style={styles.selectMeta}>{p.phone} {p.age ? `· ${p.age}y` : ''}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))}
          {filteredPatients.length === 0 && (
            <Text style={styles.emptyText}>No patients found</Text>
          )}
        </View>
      )}

      {/* Step 2: Select Items */}
      {step === 'selectItems' && (
        <View>
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep('selectPatient')} activeOpacity={0.7}>
              <Text style={styles.backBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.heading}>Patient: {selectedPatient?.name}</Text>
          </View>

          <Text style={styles.subheading}>Add Items to Bill</Text>
          {externalItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemCard}
              onPress={() => addToCart(item)}
              activeOpacity={0.7}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.itemMeta}>
                  {formatCurrency(item.sellingPrice)} · Stock: {Number(item.quantity)} {item.unitType || 'units'}
                </Text>
              </View>
              <View style={styles.addBtn}>
                <Text style={styles.addBtnText}>+</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Cart */}
          {cart.length > 0 && (
            <View style={styles.cartSection}>
              <Text style={styles.cartTitle}>Bill Items ({cart.length})</Text>
              {cart.map(item => (
                <View key={item.inventoryItemId} style={styles.cartItem}>
                  <View style={styles.cartInfo}>
                    <Text style={styles.cartName}>{item.itemName}</Text>
                    <Text style={styles.cartPrice}>{formatCurrency(item.sellingPrice)} each</Text>
                  </View>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQty(item.inventoryItemId, item.quantity - 1)}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.qtyInput}
                      value={String(item.quantity)}
                      onChangeText={(v) => updateQty(item.inventoryItemId, v)}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQty(item.inventoryItemId, item.quantity + 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                    <Text style={styles.lineTotal}>{formatCurrency(item.sellingPrice * item.quantity)}</Text>
                  </View>
                </View>
              ))}

              {/* Payment Section */}
              <View style={styles.paymentSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Discount</Text>
                  <TextInput
                    style={styles.discountInput}
                    value={discount}
                    onChangeText={setDiscount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Grand Total</Text>
                  <Text style={styles.grandTotalValue}>{formatCurrency(totalAmount)}</Text>
                </View>

                <Text style={styles.payLabel}>Payment Method</Text>
                <View style={styles.payMethods}>
                  {['CASH', 'UPI', 'CARD'].map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.payBtn, paymentMethod === m && styles.payBtnActive]}
                      onPress={() => setPaymentMethod(m)}
                    >
                      <Text style={[styles.payBtnText, paymentMethod === m && styles.payBtnTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                  onPress={handleCreateBill}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitBtnText}>
                    {submitting ? 'Creating...' : `Collect ${formatCurrency(totalAmount)}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  heading: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3, marginBottom: 16 },
  subheading: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 8 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  backBtn: { fontSize: 15, fontWeight: '600', color: colors.primary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, paddingHorizontal: 12, height: 42,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  searchIcon: { fontSize: 18, color: colors.textMuted, marginRight: 8, fontWeight: '700' },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500', paddingVertical: 0 },
  selectCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  selectInfo: { flex: 1 },
  selectName: { fontSize: 15, fontWeight: '700', color: colors.text },
  selectMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  arrow: { fontSize: 18, color: colors.textMuted, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 14, marginTop: 20 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.text },
  itemMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { fontSize: 18, color: '#FFFFFF', fontWeight: '600', marginTop: -1 },
  cartSection: { marginTop: 20, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  cartTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12, letterSpacing: -0.2 },
  cartItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  cartInfo: { marginBottom: 8 },
  cartName: { fontSize: 14, fontWeight: '600', color: colors.text },
  cartPrice: { fontSize: 12, color: colors.textSecondary },
  qtyControl: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: colors.text },
  qtyInput: {
    width: 50, height: 30, textAlign: 'center', fontSize: 14, fontWeight: '700',
    color: colors.text, marginHorizontal: 6, backgroundColor: colors.bg, borderRadius: 6,
  },
  lineTotal: { marginLeft: 'auto', fontSize: 14, fontWeight: '700', color: colors.primary },
  paymentSection: { marginTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  totalLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  totalValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  grandTotalRow: { paddingTop: 8, borderTopWidth: 2, borderTopColor: colors.primary },
  grandTotalLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
  grandTotalValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  discountInput: {
    width: 80, textAlign: 'right', fontSize: 14, fontWeight: '700', color: colors.text,
    borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  payLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginTop: 12, marginBottom: 8 },
  payMethods: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  payBtn: {
    flex: 1, paddingVertical: 10, borderRadius: borderRadius.md, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.bg, alignItems: 'center',
  },
  payBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  payBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  payBtnTextActive: { color: colors.primary, fontWeight: '700' },
  submitBtn: {
    backgroundColor: colors.success, borderRadius: borderRadius.md, paddingVertical: 14,
    alignItems: 'center', ...shadows.md,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
});
