import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { expenseApi } from '../api/expenseApi';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

const CATEGORIES = [
  'RENT', 'SALARY', 'ELECTRICITY', 'WATER', 'INTERNET',
  'MAINTENANCE', 'SUPPLIES', 'EQUIPMENT', 'MARKETING',
  'TAXES', 'INSURANCE', 'TRANSPORT', 'MISCELLANEOUS',
];

export default function AddExpenseScreen({ navigation }) {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { currencySymbol } = useSettings();

  const handleSubmit = async () => {
    if (!category) { Alert.alert('Error', 'Please select a category'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }
    try {
      setSubmitting(true);
      await expenseApi.create({
        expenseCategory: category,
        amount: amt,
        description: description || null,
      });
      Alert.alert('Success', 'Expense recorded', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Record Expense</Text>

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && styles.chipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
              {c.charAt(0) + c.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Amount ({currencySymbol})</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0.00"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="What was this expense for?"
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitText}>Record Expense</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.md,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  input: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 14,
    fontSize: 16, fontWeight: '600', color: colors.text, borderWidth: 1,
    borderColor: colors.border, marginBottom: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, ...shadows.md,
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
});
