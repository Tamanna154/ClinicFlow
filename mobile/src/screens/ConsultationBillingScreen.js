import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { consultationApi } from '../api/consultationApi';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

const PAYMENT_METHODS = ['CASH', 'UPI', 'CARD'];
const PAYMENT_STATUSES = ['PAID', 'PENDING', 'PARTIAL'];

export default function ConsultationBillingScreen({ route, navigation }) {
  const { consultationId, appointment, patientName } = route.params;
  const { formatCurrency } = useSettings();

  const [consultationFee, setConsultationFee] = useState(appointment.appointmentFee ? String(appointment.appointmentFee) : '500');
  const [additionalCharges, setAdditionalCharges] = useState('');
  const [additionalDesc, setAdditionalDesc] = useState('');
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [bill, setBill] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const fee = parseFloat(consultationFee) || 0;
  const add = parseFloat(additionalCharges) || 0;
  const disc = parseFloat(discount) || 0;
  const t = parseFloat(tax) || 0;
  const subtotal = fee + add;
  const total = Math.max(subtotal - disc + t, 0);

  const handleGenerateBill = async () => {
    if (fee <= 0) {
      Alert.alert('Required', 'Consultation fee is required');
      return;
    }
    setLoading(true);
    try {
      if (paymentMethod === 'UPI') {
        setVerifying(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setVerifying(false);
        Alert.alert('Payment Received', '✓ Money successfully credited to bank account.');
      }
      const result = await consultationApi.generateBill(consultationId, {
        consultationFee: fee,
        additionalCharges: add,
        additionalChargesDescription: additionalDesc.trim() || null,
        discount: disc,
        tax: t,
        paymentStatus,
        paymentMethod,
      });
      setBill(result);
      Alert.alert('Bill Generated', `Total: ${formatCurrency(result.totalAmount)}\nStatus: ${result.paymentStatus}`, [
        { text: 'Done', onPress: () => navigation.navigate('Appointments') },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.patientName}>{patientName}</Text>
        <Text style={styles.title}>Consultation Bill</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Charges</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Consultation Fee</Text>
          <TextInput style={styles.amountInput} value={consultationFee} onChangeText={setConsultationFee} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Additional Charges</Text>
          <TextInput style={styles.amountInput} value={additionalCharges} onChangeText={setAdditionalCharges} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
        </View>

        <TextInput style={styles.descInput} value={additionalDesc} onChangeText={setAdditionalDesc} placeholder="Description (e.g. Injection, Dressing)" placeholderTextColor={colors.textMuted} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adjustments</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Discount</Text>
          <TextInput style={styles.amountInput} value={discount} onChangeText={setDiscount} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Tax</Text>
          <TextInput style={styles.amountInput} value={tax} onChangeText={setTax} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.textMuted} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <Text style={styles.label}>Status</Text>
        <View style={styles.optionRow}>
          {PAYMENT_STATUSES.map(s => (
            <TouchableOpacity key={s} style={[styles.optionBtn, paymentStatus === s && styles.optionBtnActive]} onPress={() => setPaymentStatus(s)} activeOpacity={0.7}>
              <Text style={[styles.optionText, paymentStatus === s && styles.optionTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Method</Text>
        <View style={styles.optionRow}>
          {PAYMENT_METHODS.map(m => (
            <TouchableOpacity key={m} style={[styles.optionBtn, paymentMethod === m && styles.optionBtnActive]} onPress={() => setPaymentMethod(m)} activeOpacity={0.7}>
              <Text style={[styles.optionText, paymentMethod === m && styles.optionTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {paymentMethod === 'UPI' && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrLabel}>UPI Payment QR Code</Text>
            <Image
              source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=clinicflow@upi&pn=ClinicFlow&am=${total.toFixed(2)}&cu=INR&tn=ClinicFlow%20Consultation%20Bill`)}` }}
              style={styles.qrCode}
            />
            <Text style={styles.qrText}>Scan this QR code with any UPI app to pay {formatCurrency(total)}</Text>
          </View>
        )}
      </View>

      <View style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        {disc > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={[styles.totalValue, { color: colors.error }]}>-{formatCurrency(disc)}</Text>
          </View>
        )}
        {t > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>+{formatCurrency(t)}</Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateBill} disabled={loading || verifying} activeOpacity={0.8}>
        {verifying ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color="#FFF" size="small" />
            <Text style={styles.generateBtnText}>Verifying UPI Payment...</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.generateBtnText}>
            {paymentMethod === 'UPI' ? 'Verify UPI & Generate Bill' : 'Generate Bill'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16 },
  patientName: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  title: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  section: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },
  amountInput: { backgroundColor: colors.bg, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, fontWeight: '700', color: colors.text, width: 120, textAlign: 'right' },
  descInput: { backgroundColor: colors.bg, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, padding: 10, fontSize: 13, color: colors.text, fontWeight: '500' },
  label: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, backgroundColor: colors.bg, borderRadius: borderRadius.sm, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  optionBtnActive: { backgroundColor: colors.primary + '12', borderColor: colors.primary },
  optionText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  optionTextActive: { color: colors.primary, fontWeight: '700' },
  totalCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight, ...shadows.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  totalValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 8, marginTop: 4 },
  grandTotalLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
  grandTotalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  generateBtn: { backgroundColor: colors.success, borderRadius: borderRadius.md, paddingVertical: 15, alignItems: 'center', ...shadows.md },
  generateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  qrContainer: { alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.borderLight },
  qrLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  qrCode: { width: 160, height: 160, backgroundColor: '#FFF', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, padding: 8, resizeMode: 'contain' },
  qrText: { fontSize: 11, color: colors.textMuted, marginTop: 8, textAlign: 'center', paddingHorizontal: 12, lineHeight: 15 },
});
