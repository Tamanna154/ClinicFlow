import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

export default function CurrencySettingsScreen() {
  const { currencySymbol, currencies, setCurrency, updateRate, formatCurrency } = useSettings();
  const [editingCode, setEditingCode] = useState(null);
  const [rateInput, setRateInput] = useState('');

  const handleRateEdit = (code, currentRate) => {
    setEditingCode(code);
    setRateInput(String(currentRate));
  };

  const handleRateSave = async (code) => {
    const val = parseFloat(rateInput);
    if (!val || val <= 0) {
      Alert.alert('Invalid', 'Enter a positive number');
      return;
    }
    await updateRate(code, val);
    setEditingCode(null);
  };

  const testAmount = 500;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Currency & Rates</Text>
      <Text style={styles.subtitle}>
        Select currency symbol. Rates convert INR base to your currency.
        {'\n'}Example: {formatCurrency(testAmount)} = {currencies.find(c => c.symbol === '₹')?.symbol || '₹'}{testAmount}
      </Text>

      {currencies.map((c) => (
        <View key={c.code}>
          <TouchableOpacity
            style={[styles.option, currencySymbol === c.symbol && styles.optionActive]}
            onPress={() => setCurrency(c.symbol)}
            activeOpacity={0.7}
          >
            <View style={[styles.symbolCircle, currencySymbol === c.symbol && styles.symbolCircleActive]}>
              <Text style={[styles.symbolText, currencySymbol === c.symbol && styles.symbolTextActive]}>
                {c.symbol}
              </Text>
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>{c.label} ({c.code})</Text>
              {editingCode === c.code ? (
                <View style={styles.rateEditRow}>
                  <Text style={styles.rateLabel}>1 INR = </Text>
                  <TextInput
                    style={styles.rateInput}
                    value={rateInput}
                    onChangeText={setRateInput}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.rateLabel}> {c.symbol}</Text>
                  <TouchableOpacity style={styles.rateSaveBtn} onPress={() => handleRateSave(c.code)}>
                    <Text style={styles.rateSaveText}>✓</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => handleRateEdit(c.code, c.rate)}>
                  <Text style={styles.rateDisplay}>
                    1 INR = {c.symbol}{(c.rate || 1).toFixed(4)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {currencySymbol === c.symbol && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Preview</Text>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Consultation Fee</Text>
          <Text style={styles.previewValue}>{formatCurrency(500)}</Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Medicine Sale</Text>
          <Text style={styles.previewValue}>{formatCurrency(850)}</Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Monthly Revenue</Text>
          <Text style={styles.previewValue}>{formatCurrency(55000)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 30 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.3, marginBottom: 6 },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 20, lineHeight: 18 },
  option: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.lg, padding: 14, marginBottom: 6,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primary + '06' },
  symbolCircle: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bg,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  symbolCircleActive: { backgroundColor: colors.primary + '15' },
  symbolText: { fontSize: 18, fontWeight: '800', color: colors.textMuted },
  symbolTextActive: { color: colors.primary },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  rateDisplay: { fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '600' },
  rateEditRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rateLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  rateInput: {
    width: 70, height: 28, borderWidth: 1, borderColor: colors.primary,
    borderRadius: 6, paddingHorizontal: 6, fontSize: 13, fontWeight: '700',
    color: colors.text, textAlign: 'center', backgroundColor: colors.bg,
  },
  rateSaveBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.success,
    justifyContent: 'center', alignItems: 'center', marginLeft: 6,
  },
  rateSaveText: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },
  checkmark: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  checkmarkText: { fontSize: 12, color: '#FFFFFF', fontWeight: '800' },
  previewCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16,
    marginTop: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  previewTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontSize: 13, color: colors.textSecondary },
  previewValue: { fontSize: 14, fontWeight: '700', color: colors.text },
});
