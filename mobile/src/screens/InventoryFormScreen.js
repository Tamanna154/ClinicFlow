import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useEffect } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows, typography } from '../theme';

const STOCK_TYPES = ['INTERNAL', 'EXTERNAL'];
const CATEGORIES = {
  INTERNAL: ['Gloves', 'Sanitizer', 'Cotton', 'Syringes', 'Masks', 'Cleaning Supplies', 'Stationery', 'Other'],
  EXTERNAL: ['Tablets', 'Injections', 'Bandages', 'Ointments', 'Syrups', 'Drops', 'Supplements', 'Other'],
};
const UNIT_TYPES = ['pcs', 'box', 'bottle', 'pack', 'strip', 'tube', 'ml', 'gm', 'pair'];

export default function InventoryFormScreen({ route, navigation }) {
  const existing = route.params?.item;
  const isEdit = !!existing;
  const { user } = useAuth();
  const { currencySymbol } = useSettings();

  const [form, setForm] = useState({
    itemName: existing?.itemName ?? '',
    stockType: existing?.stockType ?? 'EXTERNAL',
    category: existing?.category ?? '',
    unitType: existing?.unitType ?? 'pcs',
    purchasePrice: existing?.purchasePrice != null ? String(existing.purchasePrice) : '',
    sellingPrice: existing?.sellingPrice != null ? String(existing.sellingPrice) : '',
    supplierName: existing?.supplierName ?? '',
    batchNumber: existing?.batchNumber ?? '',
    expiryDate: existing?.expiryDate ?? '',
    description: existing?.description ?? '',
    minimumThreshold: existing?.minimumThreshold != null ? String(existing.minimumThreshold) : '5',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [suppliersList, setSuppliersList] = useState([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const base = require('../api/apiBase').getApiBase();
        const res = await require('../api/client').authFetch(`${base}/suppliers/active`);
        if (res.ok) {
          const data = await res.json();
          setSuppliersList(data);
        }
      } catch (e) {
        console.log('Error fetching suppliers', e);
      }
    };
    fetchSuppliers();
  }, []);

  const update = (key, value) => { setForm({ ...form, [key]: value }); if (errors[key]) setErrors({ ...errors, [key]: undefined }); };

  const validate = () => {
    const errs = {};
    if (!form.itemName.trim()) errs.itemName = 'Item name is required';
    if (form.expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.expiryDate.trim())) errs.expiryDate = 'Use YYYY-MM-DD format';
    if (form.purchasePrice && isNaN(parseFloat(form.purchasePrice))) errs.purchasePrice = 'Must be a number';
    if (form.sellingPrice && isNaN(parseFloat(form.sellingPrice))) errs.sellingPrice = 'Must be a number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { Alert.alert('Validation Error', 'Fix highlighted fields.'); return; }
    setSaving(true);
    try {
      const payload = {
        itemName: form.itemName.trim(),
        stockType: form.stockType,
        category: form.category || null,
        unitType: form.unitType || null,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
        sellingPrice: form.sellingPrice ? parseFloat(form.sellingPrice) : null,
        supplierName: form.supplierName.trim() || null,
        batchNumber: form.batchNumber.trim() || null,
        expiryDate: form.expiryDate.trim() || null,
        description: form.description.trim() || null,
        minimumThreshold: form.minimumThreshold ? parseInt(form.minimumThreshold, 10) : 5,
      };
      if (isEdit) {
        await inventoryApi.update(existing.id, payload);
        Alert.alert('Success', 'Item updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await inventoryApi.create(payload);
        Alert.alert('Success', 'Item added successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) { Alert.alert('Error', err.message || 'Could not save.'); }
    finally { setSaving(false); }
  };

  const categories = CATEGORIES[form.stockType] || CATEGORIES.EXTERNAL;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          <Field label="Item Name" required error={errors.itemName}>
            <TextInput style={[styles.input, errors.itemName && styles.inputError]} value={form.itemName} onChangeText={(v) => update('itemName', v)} placeholder="e.g. Paracetamol 500mg" placeholderTextColor={colors.textMuted} />
          </Field>

          <Field label="Stock Type" required>
            <View style={styles.pillRow}>
              {STOCK_TYPES.map((t) => (
                <TouchableOpacity key={t} style={[styles.pill, form.stockType === t && styles.pillActive]} onPress={() => update('stockType', t)}>
                  <Text style={[styles.pillText, form.stockType === t && styles.pillTextActive]}>{t === 'INTERNAL' ? 'In-House' : 'Store'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Category">
            <View style={styles.chipGrid}>
              {categories.map((c) => (
                <TouchableOpacity key={c} style={[styles.chip, form.category === c && styles.chipActive]} onPress={() => update('category', form.category === c ? '' : c)}>
                  <Text style={[styles.chipLabel, form.category === c && styles.chipLabelActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Unit Type">
            <View style={styles.chipGrid}>
              {UNIT_TYPES.map((u) => (
                <TouchableOpacity key={u} style={[styles.chip, form.unitType === u && styles.chipActive]} onPress={() => update('unitType', form.unitType === u ? '' : u)}>
                  <Text style={[styles.chipLabel, form.unitType === u && styles.chipLabelActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <View style={styles.row}>
            <Field label={`Purchase Price (${currencySymbol})`} style={{ flex: 1, marginRight: 8 }} error={errors.purchasePrice}>
              <TextInput style={[styles.input, errors.purchasePrice && styles.inputError]} value={form.purchasePrice} onChangeText={(v) => setForm({ ...form, purchasePrice: v })} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.textMuted} />
            </Field>
            {form.stockType === 'EXTERNAL' && (
              <Field label={`Selling Price (${currencySymbol})`} style={{ flex: 1 }} error={errors.sellingPrice}>
                <TextInput style={[styles.input, errors.sellingPrice && styles.inputError]} value={form.sellingPrice} onChangeText={(v) => update('sellingPrice', v)} placeholder="0.00" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />
              </Field>
            )}
          </View>

          <Field label="Low Stock Threshold">
            <TextInput style={styles.input} value={form.minimumThreshold} onChangeText={(v) => update('minimumThreshold', v)} placeholder="5" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Supplier & Batch</Text>
          <Field label="Supplier Name">
            <TextInput style={styles.input} value={form.supplierName} onChangeText={(v) => update('supplierName', v)} placeholder="Supplier..." placeholderTextColor={colors.textMuted} />
            {suppliersList.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6, flexDirection: 'row' }}>
                {suppliersList.map((sup) => (
                  <TouchableOpacity
                    key={sup.id}
                    style={[styles.chip, form.supplierName === sup.name && styles.chipActive, { marginRight: 6, paddingVertical: 4 }]}
                    onPress={() => update('supplierName', sup.name)}
                  >
                    <Text style={[styles.chipLabel, form.supplierName === sup.name && styles.chipLabelActive, { fontSize: 11 }]}>{sup.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Field>
          <Field label="Batch Number">
            <TextInput style={styles.input} value={form.batchNumber} onChangeText={(v) => update('batchNumber', v)} placeholder="Batch #" placeholderTextColor={colors.textMuted} />
          </Field>
          <Field label="Expiry Date" error={errors.expiryDate}>
            <TextInput style={[styles.input, errors.expiryDate && styles.inputError]} value={form.expiryDate} onChangeText={(v) => update('expiryDate', v)} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
          </Field>
          <Field label="Description">
            <TextInput style={[styles.input, styles.multiline]} value={form.description} onChangeText={(v) => update('description', v)} placeholder="Optional notes..." placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />
          </Field>
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Add Item'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, required, error, children, style }) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      <Text style={styles.fieldLabel}>{label}{required ? <Text style={{ color: colors.error }}> *</Text> : null}</Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, fontWeight: '500' },
  multiline: { minHeight: 64, textAlignVertical: 'top', paddingVertical: 10 },
  inputError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  errorText: { color: colors.error, fontSize: 11, marginTop: 2, fontWeight: '600' },
  row: { flexDirection: 'row' },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingVertical: 10, alignItems: 'center' },
  pillActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  pillTextActive: { color: colors.primary },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: colors.primary + '10', borderColor: colors.primary },
  chipLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipLabelActive: { color: colors.primary },
  saveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16, alignItems: 'center', ...shadows.md },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
