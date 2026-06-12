import React, { useCallback, useState } from 'react';
import {
  View, FlatList, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { appointmentApi } from '../api/appointmentApi';
import { prescriptionApi } from '../api/prescriptionApi';
import { billingApi } from '../api/billingApi';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows, typography } from '../theme';

export default function PatientHistoryScreen({ navigation }) {
  const { logout } = useAuth();
  const [tab, setTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    const data = await appointmentApi.getAll();
    setAppointments(data);
  };

  const fetchPrescriptions = async () => {
    const data = await prescriptionApi.getAll();
    setPrescriptions(data);
  };

  const fetchBills = async () => {
    const data = await billingApi.getAll();
    setBills(data);
  };

  const fetchAll = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      await Promise.all([fetchAppointments(), fetchPrescriptions(), fetchBills()]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  const filteredAppointments = appointments.filter(appt => {
    const q = search.toLowerCase();
    const patient = (appt.patientName || appt.patient?.name || '').toLowerCase();
    const doctor = (appt.doctorName || appt.doctor?.name || '').toLowerCase();
    return !q || patient.includes(q) || doctor.includes(q);
  }).sort((a, b) => {
    const aDate = a.appointmentDate && a.startTime ? new Date(`${a.appointmentDate}T${a.startTime}`) : new Date(0);
    const bDate = b.appointmentDate && b.startTime ? new Date(`${b.appointmentDate}T${b.startTime}`) : new Date(0);
    return bDate - aDate;
  });

  const filteredPrescriptions = prescriptions.filter(p => {
    const q = search.toLowerCase();
    const patient = (p.patientName || '').toLowerCase();
    const doctor = (p.doctorName || '').toLowerCase();
    return !q || patient.includes(q) || doctor.includes(q);
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filteredBills = bills.filter(b => {
    const q = search.toLowerCase();
    const patient = (b.patientName || '').toLowerCase();
    return !q || patient.includes(q);
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderAppointment = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AppointmentDetail', { appointment: item })} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.patientName}>{item.patientName || item.patient?.name || 'Unknown'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.statusText, { color: colors.primary }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.detailText}>👨‍⚕️ Dr. {item.doctorName || item.doctor?.name || 'N/A'}</Text>
      <Text style={styles.detailText}>📅 {item.appointmentDate} at {item.startTime}</Text>
      {item.reason && <Text style={styles.detailText}>💡 {item.reason}</Text>}
    </TouchableOpacity>
  );

  const renderPrescription = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.patientName}>{item.patientName || 'Unknown'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: colors.success + '15' }]}>
          <Text style={[styles.statusText, { color: colors.success }]}>RX #{item.prescriptionNumber?.slice(-4)}</Text>
        </View>
      </View>
      <Text style={styles.detailText}>👨‍⚕️ Dr. {item.doctorName || 'N/A'}</Text>
      <Text style={styles.detailText}>📅 {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</Text>
      {item.medicines?.length > 0 && (
        <View style={styles.medList}>
          {item.medicines.slice(0, 3).map((m, i) => (
            <Text key={i} style={styles.medItem}>💊 {m.medicineName} — {m.dosage}</Text>
          ))}
          {item.medicines.length > 3 && <Text style={styles.medMore}>+{item.medicines.length - 3} more</Text>}
        </View>
      )}
      {item.diagnosis && <Text style={styles.notesText}>🏥 {item.diagnosis}</Text>}
    </View>
  );

  const renderBill = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.patientName}>{item.patientName || 'Unknown'}</Text>
        <View style={[styles.statusBadge, {
          backgroundColor: item.paymentStatus === 'PAID' ? colors.success + '15' : colors.warning + '15'
        }]}>
          <Text style={[styles.statusText, {
            color: item.paymentStatus === 'PAID' ? colors.success : colors.warning
          }]}>{item.paymentStatus || 'PENDING'}</Text>
        </View>
      </View>
      <Text style={styles.detailText}>🧾 {item.billNumber}</Text>
      <Text style={styles.detailText}>📅 {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</Text>
      <Text style={styles.detailText}>💰 ₹{Number(item.totalAmount || 0).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient or doctor..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.tabRow}>
        {['appointments', 'prescriptions', 'bills'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'appointments' ? '📅 Appointments' : t === 'prescriptions' ? '💊 Prescriptions' : '🧾 Bills'}
              <Text style={styles.tabCount}>
                {' '}{t === 'appointments' ? filteredAppointments.length : t === 'prescriptions' ? filteredPrescriptions.length : filteredBills.length}
              </Text>
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'appointments' && (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => 'a' + item.id}
          renderItem={renderAppointment}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No appointments found.</Text></View>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor={colors.primary} colors={[colors.primary]} />}
          contentContainerStyle={styles.listContent}
        />
      )}

      {tab === 'prescriptions' && (
        <FlatList
          data={filteredPrescriptions}
          keyExtractor={(item) => 'p' + item.id}
          renderItem={renderPrescription}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No prescriptions found.</Text></View>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor={colors.primary} colors={[colors.primary]} />}
          contentContainerStyle={styles.listContent}
        />
      )}

      {tab === 'bills' && (
        <FlatList
          data={filteredBills}
          keyExtractor={(item) => 'b' + item.id}
          renderItem={renderBill}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No bills found.</Text></View>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor={colors.primary} colors={[colors.primary]} />}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  searchBarContainer: { padding: 14, paddingBottom: 8, backgroundColor: colors.surface },
  searchInput: { backgroundColor: colors.bg, borderRadius: borderRadius.sm, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border },
  tabRow: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 10, backgroundColor: colors.surface, gap: 6 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: borderRadius.sm, backgroundColor: colors.bg, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  tabCount: { fontSize: 10, fontWeight: '400', opacity: 0.8 },
  listContent: { paddingVertical: 10, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 16, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  patientName: { fontSize: 15, fontWeight: '800', color: colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginLeft: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  detailText: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  notesText: { fontSize: 12, color: colors.textMuted, marginTop: 8, fontStyle: 'italic', backgroundColor: colors.bg, padding: 8, borderRadius: 4 },
  medList: { marginTop: 8, backgroundColor: colors.bg, padding: 8, borderRadius: 4 },
  medItem: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  medMore: { fontSize: 11, color: colors.primary, fontWeight: '600', marginTop: 2 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  logoutBtn: { backgroundColor: colors.error, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', marginHorizontal: 16, marginBottom: 20, ...shadows.sm },
  logoutBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
