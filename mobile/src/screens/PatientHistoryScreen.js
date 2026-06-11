import React, { useCallback, useState } from 'react';
import {
  View, FlatList, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { appointmentApi } from '../api/appointmentApi';
import { colors, borderRadius, shadows, typography } from '../theme';

export default function PatientHistoryScreen() {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [diseaseSearch, setDiseaseSearch] = useState('');
  const [sortBy, setSortBy] = useState('doctorGroup'); // doctorGroup, disease, dateDesc, dateAsc
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const data = await appointmentApi.getAll();
      setAppointments(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAppointments(); }, []));

  const getDiseaseText = (appt) => {
    const reason = (appt.reason || '').toLowerCase();
    const notes = (appt.consultationNotes || '').toLowerCase();
    return reason || notes;
  };

  const filteredAndSorted = appointments
    .filter(appt => {
      const q = search.toLowerCase();
      const dq = diseaseSearch.toLowerCase();
      const patient = (appt.patientName || appt.patient?.name || '').toLowerCase();
      const doctor = (appt.doctorName || appt.doctor?.name || '').toLowerCase();
      const disease = getDiseaseText(appt);
      const matchesGeneral = !q || patient.includes(q) || doctor.includes(q);
      const matchesDisease = !dq || disease.includes(dq);
      return matchesGeneral && matchesDisease;
    })
    .sort((a, b) => {
      const aDoc = (a.doctorName || a.doctor?.name || '').toLowerCase();
      const bDoc = (b.doctorName || b.doctor?.name || '').toLowerCase();
      const aDisease = getDiseaseText(a);
      const bDisease = getDiseaseText(b);
      const aDate = a.appointmentDate && a.startTime ? new Date(`${a.appointmentDate}T${a.startTime}`) : new Date(0);
      const bDate = b.appointmentDate && b.startTime ? new Date(`${b.appointmentDate}T${b.startTime}`) : new Date(0);

      if (sortBy === 'doctorGroup') {
        const docCompare = aDoc.localeCompare(bDoc);
        if (docCompare !== 0) return docCompare;
        return bDate - aDate;
      }
      if (sortBy === 'disease') {
        const disCompare = aDisease.localeCompare(bDisease);
        if (disCompare !== 0) return disCompare;
        return bDate - aDate;
      }
      if (sortBy === 'dateDesc') return bDate - aDate;
      if (sortBy === 'dateAsc') return aDate - bDate;
      return 0;
    });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Patient or Doctor name..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by disease/reason..."
          placeholderTextColor={colors.textMuted}
          value={diseaseSearch}
          onChangeText={setDiseaseSearch}
        />
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort By:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortChips}>
          <SortChip label="Doctor Wise" active={sortBy === 'doctorGroup'} onPress={() => setSortBy('doctorGroup')} />
          <SortChip label="Disease Wise" active={sortBy === 'disease'} onPress={() => setSortBy('disease')} />
          <SortChip label="Date Newest" active={sortBy === 'dateDesc'} onPress={() => setSortBy('dateDesc')} />
          <SortChip label="Date Oldest" active={sortBy === 'dateAsc'} onPress={() => setSortBy('dateAsc')} />
        </ScrollView>
      </View>

      <FlatList
        data={filteredAndSorted}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.patientName}>{item.patientName || item.patient?.name || 'Unknown Patient'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.statusText, { color: colors.primary }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.detailText}>👨‍⚕️ <Text style={{fontWeight: '700'}}>Doctor:</Text> Dr. {item.doctorName || item.doctor?.name || 'Not Assigned'}</Text>
            <Text style={styles.detailText}>📅 <Text style={{fontWeight: '700'}}>Date:</Text> {item.appointmentDate} at {item.startTime}</Text>
            {item.reason && <Text style={styles.detailText}>💡 <Text style={{fontWeight: '700'}}>Reason:</Text> {item.reason}</Text>}
            {item.consultationNotes && <Text style={styles.notesText}>🗒️ Notes: {item.consultationNotes}</Text>}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No matching appointments found.</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAppointments(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function SortChip({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  searchBarContainer: { padding: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  searchInput: { backgroundColor: colors.bg, borderRadius: borderRadius.sm, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border },
  sortContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, backgroundColor: colors.surface, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  sortLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginRight: 8, textTransform: 'uppercase' },
  sortChips: { gap: 6 },
  chip: { backgroundColor: colors.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#FFFFFF' },
  listContent: { paddingVertical: 10, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: 16, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  patientName: { fontSize: 15, fontWeight: '800', color: colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '800' },
  detailText: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  notesText: { fontSize: 12, color: colors.textMuted, marginTop: 8, fontStyle: 'italic', backgroundColor: colors.bg, padding: 8, borderRadius: 4 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
