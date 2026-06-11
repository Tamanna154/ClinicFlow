import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, ScrollView, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { billingApi } from '../api/billingApi';
import { consultationApi } from '../api/consultationApi';
import { prescriptionApi } from '../api/prescriptionApi';
import { colors, borderRadius, shadows, CURRENCY } from '../theme';

export default function PatientRecordsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bills'); // bills, consultations, prescriptions
  
  const [bills, setBills] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Item Modals
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedPresc, setSelectedPresc] = useState(null);

  const fetchData = async (isRefresh = false) => {
    if (!user?.patientId) return;
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);

      const [billsData, consData, prescData] = await Promise.all([
        billingApi.getAll().catch(() => []),
        consultationApi.getPatientHistory(user.patientId).catch(() => []),
        prescriptionApi.getByPatient(user.patientId).catch(() => []),
      ]);

      // Filter bills for this patient
      const myBills = billsData.filter(b => b.patientId === user.patientId);
      setBills(myBills);
      setConsultations(consData);
      setPrescriptions(prescData);
    } catch (err) {
      console.log('Error loading patient records', err.message);
      Alert.alert('Error', 'Failed to retrieve patient medical records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [user?.patientId]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderBills = () => (
    <FlatList
      data={bills}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.premiumCard, { borderLeftColor: '#3B82F6', borderLeftWidth: 4, backgroundColor: 'hsl(217, 90%, 99%)' }]}
          onPress={() => setSelectedBill(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20 }}>🧾</Text>
              <Text style={styles.billNumber}>{item.billNumber}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: item.paymentStatus === 'PAID' ? colors.successLight : colors.warningLight }]}>
              <Text style={[styles.badgeText, { color: item.paymentStatus === 'PAID' ? colors.success : colors.warning }]}>
                {item.paymentStatus}
              </Text>
            </View>
          </View>
          <Text style={styles.cardDetail}>📅 Date: {new Date(item.billDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          <Text style={styles.cardDetail}>💳 Method: {item.paymentMethod || 'Cash'}</Text>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total:</Text>
            <Text style={[styles.totalAmount, { color: '#3B82F6' }]}>{CURRENCY}{item.totalAmount}</Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.emptyView}>
          <Text style={styles.emptyText}>No bills found under your profile.</Text>
        </View>
      }
    />
  );

  const renderConsultations = () => (
    <FlatList
      data={consultations}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
      renderItem={({ item }) => (
        <View style={[styles.premiumCard, { borderLeftColor: '#0D9488', borderLeftWidth: 4, backgroundColor: 'hsl(172, 85%, 99%)' }]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20 }}>👨‍⚕️</Text>
              <Text style={styles.doctorName}>Dr. {item.doctorName || 'Doctor'}</Text>
            </View>
            <Text style={styles.dateText}>{new Date(item.createdAt || item.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </View>
          {item.symptoms ? <Text style={styles.cardDetail}><Text style={{fontWeight: '700', color: colors.textSecondary}}>Symptoms:</Text> {item.symptoms}</Text> : null}
          {item.diagnosis ? <Text style={styles.cardDetail}><Text style={{fontWeight: '700', color: colors.textSecondary}}>Diagnosis:</Text> {item.diagnosis}</Text> : null}
          {item.notes ? (
            <View style={[styles.notesBox, { backgroundColor: 'hsl(172, 50%, 96%)', borderLeftColor: colors.primary, borderLeftWidth: 2 }]}>
              <Text style={styles.notesTitle}>📋 Consultation Notes</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          ) : null}
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyView}>
          <Text style={styles.emptyText}>No past consultation records found.</Text>
        </View>
      }
    />
  );

  const renderPrescriptions = () => (
    <FlatList
      data={prescriptions}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.premiumCard, { borderLeftColor: '#F43F5E', borderLeftWidth: 4, backgroundColor: 'hsl(340, 85%, 99%)' }]}
          onPress={() => setSelectedPresc(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20 }}>💊</Text>
              <Text style={styles.doctorName}>Dr. {item.doctorName || 'Doctor'}</Text>
            </View>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </View>
          <Text style={styles.cardDetail}>📦 Medicines Prescribed: {item.medicines?.length || 0}</Text>
          {item.notes ? <Text style={styles.cardDetail} numberOfLines={1}>📝 Notes: {item.notes}</Text> : null}
          <View style={styles.divider} />
          <Text style={[styles.viewDetailsText, { color: '#F43F5E' }]}>Tap to view prescription sheet ➔</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.emptyView}>
          <Text style={styles.emptyText}>No prescription sheets found.</Text>
        </View>
      }
    />
  );

  const renderVitals = () => {
    const consWithVitals = consultations.filter(c => c.bloodPressure || c.bloodSugar || c.pulseRate || c.weight || c.temperature || c.oxygenLevel);
    
    return (
      <FlatList
        data={consWithVitals}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        renderItem={({ item }) => (
          <View style={[styles.premiumCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 4, backgroundColor: 'hsl(45, 95%, 99%)' }]}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>📈</Text>
                <Text style={styles.doctorName}>Vitals Log</Text>
              </View>
              <Text style={styles.dateText}>{new Date(item.createdAt || item.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </View>
            <View style={styles.vitalsRecordGrid}>
              {item.bloodPressure ? (
                <View style={styles.vitalRecordItem}>
                  <Text style={styles.vitalRecordLabel}>❤️ Blood Pressure</Text>
                  <Text style={styles.vitalRecordVal}>{item.bloodPressure} mmHg</Text>
                </View>
              ) : null}
              {item.bloodSugar ? (
                <View style={styles.vitalRecordItem}>
                  <Text style={styles.vitalRecordLabel}>🍬 Blood Sugar</Text>
                  <Text style={styles.vitalRecordVal}>{item.bloodSugar} mg/dL</Text>
                </View>
              ) : null}
              {item.pulseRate ? (
                <View style={styles.vitalRecordItem}>
                  <Text style={styles.vitalRecordLabel}>💓 Pulse Rate</Text>
                  <Text style={styles.vitalRecordVal}>{item.pulseRate} bpm</Text>
                </View>
              ) : null}
              {item.weight ? (
                <View style={styles.vitalRecordItem}>
                  <Text style={styles.vitalRecordLabel}>⚖️ Weight</Text>
                  <Text style={styles.vitalRecordVal}>{item.weight} kg</Text>
                </View>
              ) : null}
              {item.temperature ? (
                <View style={styles.vitalRecordItem}>
                  <Text style={styles.vitalRecordLabel}>🌡️ Temperature</Text>
                  <Text style={styles.vitalRecordVal}>{item.temperature} °F</Text>
                </View>
              ) : null}
              {item.oxygenLevel ? (
                <View style={styles.vitalRecordItem}>
                  <Text style={styles.vitalRecordLabel}>🫁 SpO2</Text>
                  <Text style={styles.vitalRecordVal}>{item.oxygenLevel}%</Text>
                </View>
              ) : null}
            </View>
            {item.diagnosis ? (
              <Text style={[styles.cardDetail, { marginTop: 12, fontWeight: '750', color: colors.textSecondary }]}>
                Diagnosis: <Text style={{ fontWeight: '500', color: colors.text }}>{item.diagnosis}</Text>
              </Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyText}>No recorded vital signs found.</Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'bills' && styles.tabActive]} onPress={() => setActiveTab('bills')}>
          <Text style={[styles.tabText, activeTab === 'bills' && styles.tabTextActive]}>Bills</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'consultations' && styles.tabActive]} onPress={() => setActiveTab('consultations')}>
          <Text style={[styles.tabText, activeTab === 'consultations' && styles.tabTextActive]}>Visits</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'prescriptions' && styles.tabActive]} onPress={() => setActiveTab('prescriptions')}>
          <Text style={[styles.tabText, activeTab === 'prescriptions' && styles.tabTextActive]}>Prescriptions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'vitals' && styles.tabActive]} onPress={() => setActiveTab('vitals')}>
          <Text style={[styles.tabText, activeTab === 'vitals' && styles.tabTextActive]}>Vitals</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'bills' && renderBills()}
        {activeTab === 'consultations' && renderConsultations()}
        {activeTab === 'prescriptions' && renderPrescriptions()}
        {activeTab === 'vitals' && renderVitals()}
      </View>

      {/* Bill Detail Modal */}
      <Modal animationType="slide" transparent={true} visible={!!selectedBill} onRequestClose={() => setSelectedBill(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🧾 Invoice Summary</Text>
            {selectedBill && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.invoiceHeader}>
                  <View>
                    <Text style={styles.invoiceNoLabel}>Invoice Number</Text>
                    <Text style={styles.invoiceNoVal}>{selectedBill.billNumber}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.invoiceNoLabel}>Date</Text>
                    <Text style={[styles.invoiceNoVal, { fontSize: 12 }]}>{new Date(selectedBill.billDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  </View>
                </View>

                <View style={styles.invoiceStatusRow}>
                  <Text style={styles.invoiceStatusLabel}>Payment Status</Text>
                  <View style={[styles.badge, { backgroundColor: selectedBill.paymentStatus === 'PAID' ? colors.successLight : colors.warningLight }]}>
                    <Text style={[styles.badgeText, { color: selectedBill.paymentStatus === 'PAID' ? colors.success : colors.warning, fontSize: 11 }]}>
                      {selectedBill.paymentStatus}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalDivider} />
                
                <Text style={styles.itemsHeader}>Billed Medicines / Items</Text>
                
                {/* Structured Table */}
                <View style={styles.invoiceTable}>
                  <View style={styles.invoiceTableHeader}>
                    <Text style={[styles.invoiceTableHeaderText, { flex: 2 }]}>Item Name</Text>
                    <Text style={[styles.invoiceTableHeaderText, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>
                    <Text style={[styles.invoiceTableHeaderText, { flex: 1, textAlign: 'right' }]}>Price</Text>
                  </View>
                  
                  {selectedBill.items && selectedBill.items.map((item, idx) => (
                    <View key={idx} style={styles.invoiceTableRow}>
                      <Text style={[styles.invoiceItemName, { flex: 2 }]}>{item.itemName}</Text>
                      <Text style={[styles.invoiceItemQty, { flex: 0.5, textAlign: 'center' }]}>{item.quantity}</Text>
                      <Text style={[styles.invoiceItemPrice, { flex: 1, textAlign: 'right' }]}>{CURRENCY}{item.lineTotal}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.modalDivider} />
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal:</Text>
                  <Text style={styles.summaryVal}>{CURRENCY}{selectedBill.subtotal}</Text>
                </View>
                {selectedBill.discount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount:</Text>
                    <Text style={[styles.summaryVal, { color: colors.error }]}>-{CURRENCY}{selectedBill.discount}</Text>
                  </View>
                )}
                {selectedBill.tax > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax:</Text>
                    <Text style={styles.summaryVal}>+{CURRENCY}{selectedBill.tax}</Text>
                  </View>
                )}
                
                <View style={styles.modalDivider} />
                
                <View style={styles.grandTotalRow}>
                  <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                  <Text style={styles.grandTotalVal}>{CURRENCY}{selectedBill.totalAmount}</Text>
                </View>
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedBill(null)}>
              <Text style={styles.closeModalBtnText}>Close Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Prescription Detail Modal */}
      <Modal animationType="slide" transparent={true} visible={!!selectedPresc} onRequestClose={() => setSelectedPresc(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📄 Prescription Sheet</Text>
            {selectedPresc && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.prescHeaderCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.doctorAvatar}>
                      <Text style={{ fontSize: 18 }}>👨‍⚕️</Text>
                    </View>
                    <View>
                      <Text style={styles.prescDoctorName}>Dr. {selectedPresc.doctorName}</Text>
                      <Text style={styles.prescDate}>Prescribed on {new Date(selectedPresc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalDivider} />
                <Text style={styles.itemsHeader}>Rx Instructions</Text>

                {selectedPresc.medicines && selectedPresc.medicines.map((med, idx) => (
                  <View key={idx} style={[styles.prescMedCard, { borderLeftColor: colors.primary, borderLeftWidth: 3 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={styles.prescMedName}>💊 {med.medicineName}</Text>
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationBadgeText}>{med.duration}</Text>
                      </View>
                    </View>
                    <View style={styles.prescGridRow}>
                      <View style={styles.prescGridItem}>
                        <Text style={styles.prescGridLabel}>Dosage</Text>
                        <Text style={styles.prescGridValue}>{med.dosage}</Text>
                      </View>
                      <View style={styles.prescGridItem}>
                        <Text style={styles.prescGridLabel}>Frequency</Text>
                        <Text style={styles.prescGridValue}>{med.frequency}</Text>
                      </View>
                    </View>
                    {med.instructions ? (
                      <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsText}>💡 {med.instructions}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}

                {selectedPresc.notes ? (
                  <View style={[styles.prescNotesCard, { backgroundColor: colors.warningLight, borderLeftColor: colors.warning, borderLeftWidth: 3 }]}>
                    <Text style={styles.prescNotesTitle}>Doctor Remarks</Text>
                    <Text style={styles.prescNotesContent}>{selectedPresc.notes}</Text>
                  </View>
                ) : null}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedPresc(null)}>
              <Text style={styles.closeModalBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent'
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '650', color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '800' },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 12,
    ...shadows.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  billNumber: { fontSize: 14, fontWeight: '800', color: colors.text },
  doctorName: { fontSize: 15, fontWeight: '800', color: colors.text },
  dateText: { fontSize: 11, fontWeight: '750', color: colors.textMuted },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  cardDetail: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  totalAmount: { fontSize: 16, fontWeight: '800', color: colors.primary },
  notesBox: { backgroundColor: colors.bg, borderRadius: borderRadius.sm, padding: 10, marginTop: 10 },
  notesTitle: { fontSize: 11, fontWeight: '750', color: colors.textSecondary, marginBottom: 4 },
  notesText: { fontSize: 12, color: colors.text, lineHeight: 18 },
  viewDetailsText: { fontSize: 12, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  emptyView: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic' },
  
  // Modal styling
  modalBg: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(11, 26, 43, 0.4)', padding: 20 },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalTitle: { fontSize: 16, fontWeight: '850', color: colors.text, marginBottom: 16, textAlign: 'center' },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  modalLabel: { fontSize: 13, color: colors.textSecondary },
  modalValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  modalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  itemsHeader: { fontSize: 12, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemNameText: { fontSize: 13, color: colors.text, flex: 1 },
  itemPriceText: { fontSize: 13, fontWeight: '750', color: colors.text },
  modalTotalLabel: { fontSize: 14, fontWeight: '800', color: colors.text },
  modalTotalValue: { fontSize: 18, fontWeight: '850', color: colors.primary },
  closeModalBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
  closeModalBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '750' },
  
  // Prescription modals
  prescDoctor: { fontSize: 16, fontWeight: '800', color: colors.text },
  prescDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  prescMedCard: { backgroundColor: colors.bg, borderRadius: borderRadius.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  prescMedName: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 },
  prescMedInfo: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  prescNotesCard: { backgroundColor: colors.warningLight, borderRadius: borderRadius.md, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#FEF3C7' },
  prescNotesTitle: { fontSize: 11, fontWeight: '800', color: colors.warning, textTransform: 'uppercase', marginBottom: 4 },
  prescNotesContent: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  vitalsRecordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  vitalRecordItem: { width: '48%', backgroundColor: colors.bg, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: colors.borderLight },
  vitalRecordLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  vitalRecordVal: { fontSize: 13, fontWeight: '850', color: colors.text, marginTop: 2 },
  
  // Premium custom elements
  premiumCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 12,
    ...shadows.md,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    padding: 12,
    borderRadius: borderRadius.sm,
    marginBottom: 12,
  },
  invoiceNoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invoiceNoVal: {
    fontSize: 14,
    fontWeight: '850',
    color: colors.text,
    marginTop: 2,
  },
  invoiceStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginVertical: 4,
  },
  invoiceStatusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  invoiceTable: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  invoiceTableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  invoiceTableHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invoiceTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  invoiceItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  invoiceItemQty: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  invoiceItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  grandTotalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
  },
  prescHeaderCard: {
    backgroundColor: colors.bg,
    padding: 14,
    borderRadius: borderRadius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  doctorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prescDoctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  durationBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  prescGridRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  prescGridItem: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: 6,
    padding: 8,
  },
  prescGridLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  prescGridValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  instructionsContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'hsl(172, 30%, 98%)',
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: colors.primaryLight,
  },
  instructionsText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
