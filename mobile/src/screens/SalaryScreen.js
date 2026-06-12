import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal, Platform, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { staffApi } from '../api/staffApi';
import { salaryApi } from '../api/salaryApi';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows } from '../theme';

export default function SalaryScreen({ navigation }) {
  const [staff, setStaff] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'CASH', notes: '', transactionRef: '' });
  const [saving, setSaving] = useState(false);
  const { formatCurrency } = useSettings();

  const fetchData = useCallback(async (isRefresh) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [staffData, paymentData] = await Promise.all([
        staffApi.getMyStaff().catch(() => []),
        salaryApi.getAllPayments().catch(() => []),
      ]);
      setStaff(Array.isArray(staffData) ? staffData : []);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
    } catch (e) {
      console.log(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const openPayModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setPaymentForm({
      amount: staffMember.fixedSalary ? String(staffMember.fixedSalary) : '',
      method: 'CASH',
      notes: '',
      transactionRef: '',
    });
    setPayModalVisible(true);
  };

  const handlePaySalary = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid salary amount.');
      return;
    }
    setSaving(true);
    try {
      await salaryApi.paySalary({
        staffId: selectedStaff.id,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.method,
        notes: paymentForm.notes,
        transactionRef: paymentForm.transactionRef || null,
      });
      Alert.alert('✅ Salary Paid', `Salary of ${formatCurrency(parseFloat(paymentForm.amount))} has been paid to ${selectedStaff.staffName}.`);
      setPayModalVisible(false);
      fetchData();
    } catch (err) {
      Alert.alert('❌ Payment Failed', err.message || 'Could not process payment.');
    } finally {
      setSaving(false);
    }
  };

  const getStaffPaymentInfo = (staffId) => {
    return payments.filter(p => p.staffId === staffId);
  };

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
        <Text style={styles.headerTitle}>💰 Salary Management</Text>
        <Text style={styles.headerSub}>{staff.length} staff members</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* Summary Banner */}
        <View style={styles.summaryBanner}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(staff.reduce((s, m) => s + (m.fixedSalary || 0), 0))}</Text>
            <Text style={styles.summaryLabel}>Total Monthly Salary</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{staff.length}</Text>
            <Text style={styles.summaryLabel}>Staff Members</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {formatCurrency(payments.reduce((s, p) => s + (p.amount || 0), 0))}
            </Text>
            <Text style={styles.summaryLabel}>Total Paid</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Staff Salary Overview</Text>

        {staff.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No staff members</Text>
            <Text style={styles.emptySub}>Add staff members to manage salaries</Text>
          </View>
        ) : (
          staff.map((member) => {
            const staffPayments = getStaffPaymentInfo(member.id);
            const lastPayment = staffPayments.length > 0 ? staffPayments[0] : null;
            const pendingAmount = member.pendingSalary || member.fixedSalary || 0;
            return (
              <View key={member.id} style={styles.staffCard}>
                <View style={styles.staffCardTop}>
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffAvatarText}>{member.staffName?.charAt(0)?.toUpperCase() || 'S'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.staffName}>{member.staffName}</Text>
                    <Text style={styles.staffRole}>{member.roleTitle || member.role}</Text>
                  </View>
                  <View style={[styles.pendingBadge, pendingAmount > 0 ? styles.pendingBadgeActive : styles.pendingBadgePaid]}>
                    <Text style={[styles.pendingBadgeText, { color: pendingAmount > 0 ? colors.warning : colors.success }]}>
                      {pendingAmount > 0 ? `Due ${formatCurrency(pendingAmount)}` : 'Paid'}
                    </Text>
                  </View>
                </View>
                <View style={styles.staffDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fixed Salary</Text>
                    <Text style={styles.detailValue}>{formatCurrency(member.fixedSalary || 0)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Paid</Text>
                    <Text style={styles.detailValue}>{formatCurrency(member.totalPaid || 0)}</Text>
                  </View>
                  {lastPayment && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Last Payment</Text>
                      <Text style={styles.detailValue}>{formatCurrency(lastPayment.amount)} ({lastPayment.paymentDate})</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.payBtn} onPress={() => openPayModal(member)} activeOpacity={0.85}>
                  <Text style={styles.payBtnText}>💰 Pay Salary</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Recent Payments History */}
        {payments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            {payments.slice(0, 10).map((p, idx) => (
              <View key={p.id || idx} style={styles.paymentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentStaff}>{p.staffName || 'Staff'}</Text>
                  <Text style={styles.paymentDate}>{p.paymentDate} · {p.paymentMethod}</Text>
                </View>
                <Text style={[styles.paymentAmount, { color: colors.success }]}>{formatCurrency(p.amount)}</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Pay Salary Modal */}
      <Modal visible={payModalVisible} transparent animationType="slide" onRequestClose={() => setPayModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💰 Pay Salary</Text>
              <TouchableOpacity onPress={() => setPayModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedStaff && (
              <>
                <View style={styles.payStaffInfo}>
                  <View style={styles.payStaffAvatar}>
                    <Text style={styles.payStaffAvatarText}>{selectedStaff.staffName?.charAt(0)?.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.payStaffName}>{selectedStaff.staffName}</Text>
                    <Text style={styles.payStaffRole}>{selectedStaff.roleTitle || selectedStaff.role}</Text>
                    <Text style={styles.payStaffSalary}>Fixed Salary: {formatCurrency(selectedStaff.fixedSalary || 0)}</Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Amount *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={paymentForm.amount}
                    onChangeText={(v) => setPaymentForm({ ...paymentForm, amount: v })}
                    placeholder="Enter amount"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Payment Method</Text>
                  <View style={styles.methodRow}>
                    {['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI'].map((m) => {
                      const active = paymentForm.method === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[styles.methodChip, active && styles.methodChipActive]}
                          onPress={() => setPaymentForm({ ...paymentForm, method: m })}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.methodChipText, active && styles.methodChipTextActive]}>
                            {m === 'BANK_TRANSFER' ? 'BANK' : m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Transaction Ref (optional)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={paymentForm.transactionRef}
                    onChangeText={(v) => setPaymentForm({ ...paymentForm, transactionRef: v })}
                    placeholder="e.g. UTR / Cheque No."
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Notes (optional)</Text>
                  <TextInput
                    style={[styles.formInput, { minHeight: 60, textAlignVertical: 'top' }]}
                    value={paymentForm.notes}
                    onChangeText={(v) => setPaymentForm({ ...paymentForm, notes: v })}
                    placeholder="Any notes about this payment"
                    placeholderTextColor={colors.textMuted}
                    multiline
                  />
                </View>

                <TouchableOpacity
                  style={[styles.payNowBtn, saving && { opacity: 0.6 }]}
                  onPress={handlePaySalary}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.payNowBtnText}>✅ Confirm Payment — {formatCurrency(parseFloat(paymentForm.amount || 0))}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: {
    backgroundColor: colors.primary, paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#FFFFFFAA', marginTop: 4 },

  summaryBanner: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 16, fontWeight: '800', color: colors.text },
  summaryLabel: { fontSize: 9, fontWeight: '600', color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryDivider: { width: 1, height: 30, backgroundColor: colors.borderLight, marginHorizontal: 4 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10, letterSpacing: -0.3 },

  staffCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  staffCardTop: { flexDirection: 'row', alignItems: 'center' },
  staffAvatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  staffAvatarText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  staffName: { fontSize: 15, fontWeight: '700', color: colors.text },
  staffRole: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  pendingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pendingBadgeActive: { backgroundColor: colors.warningLight },
  pendingBadgePaid: { backgroundColor: colors.successLight },
  pendingBadgeText: { fontSize: 10, fontWeight: '700' },

  staffDetails: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderLight },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  detailLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  detailValue: { fontSize: 13, fontWeight: '700', color: colors.text },

  payBtn: { marginTop: 10, backgroundColor: colors.success, borderRadius: 12, paddingVertical: 12, alignItems: 'center', ...shadows.sm },
  payBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  paymentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: colors.borderLight },
  paymentStaff: { fontSize: 13, fontWeight: '700', color: colors.text },
  paymentDate: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  paymentAmount: { fontSize: 14, fontWeight: '800', marginLeft: 8 },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: '#00000050', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  modalCloseX: { fontSize: 14, color: colors.textMuted, fontWeight: '700' },
  payStaffInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 12, padding: 12, marginBottom: 16 },
  payStaffAvatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  payStaffAvatarText: { fontSize: 16, fontWeight: '800', color: colors.primary },
  payStaffName: { fontSize: 15, fontWeight: '700', color: colors.text },
  payStaffRole: { fontSize: 11, color: colors.textSecondary },
  payStaffSalary: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 },
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  formInput: { backgroundColor: colors.bg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, fontWeight: '500' },
  methodRow: { flexDirection: 'row', gap: 6 },
  methodChip: { flex: 1, backgroundColor: colors.bg, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  methodChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodChipText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  methodChipTextActive: { color: '#FFFFFF' },
  payNowBtn: { backgroundColor: colors.success, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, ...shadows.md },
  payNowBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
