import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
  ActivityIndicator, Alert, TextInput, Dimensions, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { prescriptionApi } from '../api/prescriptionApi';
import { inventoryApi } from '../api/inventoryApi';
import { colors, borderRadius, shadows } from '../theme';

const FREQUENCY_OPTS = [
  { label: 'Once Daily', value: 'Once daily' },
  { label: 'Twice Daily', value: 'Twice daily' },
  { label: 'Thrice Daily', value: 'Thrice daily' },
  { label: 'Morning', value: 'Morning' },
  { label: 'Afternoon', value: 'Afternoon' },
  { label: 'Night', value: 'Night' },
  { label: 'Before Breakfast', value: 'Before breakfast' },
  { label: 'After Breakfast', value: 'After breakfast' },
  { label: 'Before Lunch', value: 'Before lunch' },
  { label: 'After Lunch', value: 'After lunch' },
  { label: 'Before Dinner', value: 'Before dinner' },
  { label: 'After Dinner', value: 'After dinner' },
  { label: 'As Needed', value: 'As needed' },
  { label: 'Every 4 Hours', value: 'Every 4 hours' },
  { label: 'Every 6 Hours', value: 'Every 6 hours' },
  { label: 'Every 8 Hours', value: 'Every 8 hours' },
  { label: 'Before Bed', value: 'Before bed' },
];

const DURATION_OPTS = [
  '1 day', '3 days', '5 days', '7 days', '10 days',
  '14 days', '21 days', '1 month', '2 months', '3 months',
];

export default function PrescriptionScreen({ route, navigation }) {
  const { consultationId, patientId, existingData } = route.params || {};

  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generateBill, setGenerateBill] = useState(false);

  useFocusEffect(useCallback(() => {
    if (existingData?.medicines) {
      setMedicines(existingData.medicines.map((m) => ({
        ...m,
        inventoryItemId: m.inventoryItemId || null,
        dosage: m.dosage || '',
        frequency: m.frequency || '',
        duration: m.duration || '',
        quantity: m.quantity || 1,
        instructions: m.instructions || '',
        stockAvailable: m.stockAvailable || 0,
        sellingPrice: m.sellingPrice || 0,
      })));
    }
  }, []));

  const searchInventory = async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const items = await inventoryApi.search(q.trim());
      setSearchResults(items);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchInventory(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addMedicine = (item) => {
    const exists = medicines.find((m) => m.inventoryItemId === item.id);
    if (exists) {
      Alert.alert('Already added', `${item.itemName} is already in the prescription.`);
      return;
    }
    setMedicines([...medicines, {
      id: Date.now().toString(),
      inventoryItemId: item.id,
      medicineName: item.itemName,
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1,
      instructions: '',
      stockAvailable: item.quantity,
      sellingPrice: item.sellingPrice || 0,
      stockType: item.stockType,
    }]);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const updateMedicine = (id, field, value) => {
    setMedicines(medicines.map((m) => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMedicine = (id) => {
    setMedicines(medicines.filter((m) => m.id !== id));
  };

  const totalCharge = medicines.reduce((sum, m) => {
    if (m.stockType === 'EXTERNAL' && m.sellingPrice > 0) {
      return sum + (m.sellingPrice * (m.quantity || 1));
    }
    return sum;
  }, 0);

  const handleSave = async () => {
    if (medicines.length === 0) {
      Alert.alert('Empty', 'Add at least one medicine');
      return;
    }
    for (const m of medicines) {
      if (!m.dosage.trim()) { Alert.alert('Required', `Set dosage for ${m.medicineName}`); return; }
      if (!m.frequency) { Alert.alert('Required', `Set frequency for ${m.medicineName}`); return; }
      if (!m.duration) { Alert.alert('Required', `Set duration for ${m.medicineName}`); return; }
    }
    setSaving(true);
    try {
      const payload = {
        patientId,
        medicines: medicines.map((m) => ({
          inventoryItemId: m.inventoryItemId,
          medicineName: m.medicineName,
          dosage: m.dosage.trim(),
          frequency: m.frequency,
          duration: m.duration,
          quantity: m.quantity || 1,
          instructions: m.instructions.trim() || null,
        })),
        generateBill: generateBill && totalCharge > 0,
        paymentMethod: generateBill ? 'CASH' : null,
      };
      const result = await prescriptionApi.create(consultationId, payload);
      Alert.alert('Saved', `Prescription ${result.prescriptionNumber} saved successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Prescription</Text>
          <Text style={styles.count}>{medicines.length} medicine{medicines.length !== 1 ? 's' : ''}</Text>
        </View>

        {medicines.map((med) => (
          <View key={med.id} style={styles.medCard}>
            <View style={styles.medHeader}>
              <Text style={styles.medName}>{med.medicineName}</Text>
              <TouchableOpacity onPress={() => removeMedicine(med.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.stockRow}>
              <Text style={[styles.stockText, (med.stockAvailable || 0) < 10 ? styles.stockLow : styles.stockOk]}>
                Stock: {med.stockAvailable || 0}
              </Text>
              {med.sellingPrice > 0 && med.stockType === 'EXTERNAL' && (
                <Text style={styles.priceText}>₹{med.sellingPrice}/unit</Text>
              )}
            </View>
            <View style={styles.medRow}>
              <View style={styles.medField}>
                <Text style={styles.medLabel}>Dosage</Text>
                <TextInput style={styles.medInput} value={med.dosage} onChangeText={(v) => updateMedicine(med.id, 'dosage', v)} placeholder="e.g. 500mg" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={styles.medField}>
                <Text style={styles.medLabel}>Qty</Text>
                <TextInput style={styles.medInput} value={String(med.quantity)} onChangeText={(v) => updateMedicine(med.id, 'quantity', Math.max(1, parseInt(v) || 1).toString())} keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.medField}>
              <Text style={styles.medLabel}>Frequency (Timing)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {FREQUENCY_OPTS.map((opt) => (
                  <TouchableOpacity key={opt.value} style={[styles.chip, med.frequency === opt.value && styles.chipActive]} onPress={() => updateMedicine(med.id, 'frequency', opt.value)}>
                    <Text style={[styles.chipText, med.frequency === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.medField}>
              <Text style={styles.medLabel}>Duration</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {DURATION_OPTS.map((opt) => (
                  <TouchableOpacity key={opt} style={[styles.chip, med.duration === opt && styles.chipActive]} onPress={() => updateMedicine(med.id, 'duration', opt)}>
                    <Text style={[styles.chipText, med.duration === opt && styles.chipTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.medField}>
              <Text style={styles.medLabel}>Instructions (optional)</Text>
              <TextInput style={styles.medInput} value={med.instructions} onChangeText={(v) => updateMedicine(med.id, 'instructions', v)} placeholder="e.g. Take with water" placeholderTextColor={colors.textMuted} />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={() => setShowSearch(true)} activeOpacity={0.7}>
          <Text style={styles.addBtnText}>+ Add Medicine</Text>
        </TouchableOpacity>

        {totalCharge > 0 && (
          <View style={styles.billCard}>
            <Text style={styles.billTitle}>Medicine Charges</Text>
            <Text style={styles.billAmount}>₹{totalCharge.toFixed(2)}</Text>
            <TouchableOpacity
              style={[styles.billToggle, generateBill && styles.billToggleActive]}
              onPress={() => setGenerateBill(!generateBill)}
              activeOpacity={0.7}>
              <View style={[styles.checkbox, generateBill && styles.checkboxActive]}>
                {generateBill && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.billToggleText}>Generate bill & deduct stock</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Prescription</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showSearch} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Medicines</Text>
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search by medicine name..." placeholderTextColor={colors.textMuted} autoFocus />
          {searching && <ActivityIndicator style={{ margin: 16 }} color={colors.primary} />}
          <FlatList
            data={searchResults}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultCard} onPress={() => addMedicine(item)} activeOpacity={0.7}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{item.itemName}</Text>
                  <Text style={styles.resultDetail}>
                    Stock: {item.quantity} {item.unitType || 'units'}
                    {item.sellingPrice > 0 ? ` | ₹${item.sellingPrice}/unit` : ''}
                  </Text>
                  {(item.quantity || 0) <= 0 && <Text style={styles.outOfStock}>Out of Stock</Text>}
                </View>
                <Text style={styles.addIcon}>+</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={!searching && searchQuery.trim() ? (
              <Text style={styles.emptyText}>No medicines found. Try a different search.</Text>
            ) : null}
            contentContainerStyle={styles.resultList}
          />
        </View>
      </Modal>
    </View>
  );
}

const STATUSBAR_H = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 36);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  count: { fontSize: 13, fontWeight: '700', color: colors.primary, backgroundColor: colors.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  medCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  medName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  removeBtn: { fontSize: 18, color: colors.error, fontWeight: '700', marginLeft: 8 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  stockText: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  stockOk: { backgroundColor: colors.successLight, color: colors.success },
  stockLow: { backgroundColor: colors.warningLight, color: colors.warning },
  priceText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  medRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  medField: { marginBottom: 8 },
  medLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  medInput: { backgroundColor: colors.bg, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: colors.text },
  chipScroll: { marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, marginRight: 6, marginBottom: 4 },
  chipActive: { backgroundColor: colors.primary + '15', borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.primary },
  addBtn: { backgroundColor: colors.primary + '10', borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.primary + '30', borderStyle: 'dashed', paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  addBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  billCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  billTitle: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  billAmount: { fontSize: 28, fontWeight: '800', color: colors.success, marginTop: 4, letterSpacing: -0.5 },
  billToggle: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  billToggleActive: {},
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  billToggleText: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', ...shadows.md },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'ios' ? 60 : 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  modalClose: { fontSize: 22, color: colors.textMuted, fontWeight: '700' },
  searchInput: { backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.text, marginHorizontal: 16, marginBottom: 8 },
  resultList: { padding: 16 },
  resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '700', color: colors.text },
  resultDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  outOfStock: { fontSize: 11, fontWeight: '700', color: colors.error, marginTop: 2 },
  addIcon: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 13, marginTop: 32 },
});
