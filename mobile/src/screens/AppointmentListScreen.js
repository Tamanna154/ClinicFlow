import React, { useCallback, useState } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { appointmentApi } from '../api/appointmentApi';
import { usePermission } from '../hooks/usePermission';
import AppointmentCard from '../components/AppointmentCard';
import { colors, borderRadius, shadows } from '../theme';

const FILTERS = ['All', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function AppointmentListScreen({ route, navigation }) {
  const doctorId = route.params?.doctorId;
  const patientId = route.params?.patientId;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const { hasPermission } = usePermission();
  const canManageAppointments = hasPermission('MANAGE_APPOINTMENTS');

  const fetchAppointments = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      let data;
      if (doctorId) data = await appointmentApi.getByDoctor(doctorId);
      else if (patientId) data = await appointmentApi.getByPatient(patientId);
      else data = await appointmentApi.getAll();
      setAppointments(data);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch appointments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAppointments(); }, [doctorId, patientId]));

  const filtered = appointments.filter((a) => filter === 'All' || a.status === filter);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const active = filter === item;
            return (
              <TouchableOpacity
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(item)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
        <Text style={styles.countText}>
          {filtered.length} appt{filtered.length !== 1 ? 's' : ''}{filter !== 'All' ? ` (${filter})` : ''}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AppointmentCard appointment={item} onPress={() => navigation.navigate('AppointmentDetail', { appointment: item })} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyCircle}><Text style={styles.emptyIcon}>A</Text></View>
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptySub}>{filter !== 'All' ? `No ${filter.toLowerCase()} appointments` : 'Tap + to book one'}</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAppointments(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      {canManageAppointments && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AppointmentBooking', { doctorId })} activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { marginTop: 10, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  filterSection: { backgroundColor: colors.surface, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  filterList: { paddingHorizontal: 16, gap: 6 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: borderRadius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.2 },
  filterTextActive: { color: '#FFFFFF' },
  countText: { fontSize: 12, color: colors.textMuted, fontWeight: '600', paddingHorizontal: 16, marginTop: 8 },
  listContent: { paddingVertical: 8, paddingBottom: 80 },
  empty: { alignItems: 'center', paddingHorizontal: 32, justifyContent: 'center' },
  emptyCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 24, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center', letterSpacing: -0.2 },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center',
    ...shadows.lg,
  },
  fabText: { fontSize: 28, color: '#FFFFFF', fontWeight: '400', lineHeight: 28, marginTop: -1 },
});
