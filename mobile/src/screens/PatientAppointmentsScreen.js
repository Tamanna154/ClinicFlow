import React, { useCallback, useState } from 'react';
import {
  View, FlatList, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { appointmentApi } from '../api/appointmentApi';
import { colors, borderRadius, shadows, getStatusStyle } from '../theme';

const FILTERS = ['All', 'Upcoming', 'Past', 'CANCELLED'];

function isUpcoming(a) {
  const today = new Date().toISOString().slice(0, 10);
  if (a.appointmentDate > today) return true;
  if (a.appointmentDate === today) {
    return a.startTime >= new Date().toTimeString().slice(0, 5);
  }
  return false;
}

export default function PatientAppointmentsScreen({ navigation }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchAppointments = async (isRefresh = false) => {
    if (!user?.patientId) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await appointmentApi.getByPatient(user.patientId);
      setAppointments(data);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch appointments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAppointments(); }, [user?.patientId]));

  const filtered = appointments.filter((a) => {
    if (filter === 'All') return true;
    if (filter === 'Upcoming') return a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && isUpcoming(a);
    if (filter === 'Past') return a.status === 'COMPLETED' || (a.status !== 'CANCELLED' && !isUpcoming(a));
    if (filter === 'CANCELLED') return a.status === 'CANCELLED';
    return true;
  });

  const handleCancel = (item) => {
    Alert.alert('Cancel Appointment', `Cancel your appointment with Dr. ${item.doctorName} on ${item.appointmentDate}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancellingId(item.id);
          try {
            await appointmentApi.updateStatus(item.id, 'CANCELLED');
            setAppointments((prev) =>
              prev.map((a) => (a.id === item.id ? { ...a, status: 'CANCELLED' } : a))
            );
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setCancellingId(null);
          }
        },
      },
    ]);
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
      <View style={styles.filterContainer}>
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
        <Text style={styles.countText}>{filtered.length} appt{filtered.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const ss = getStatusStyle(item.status);
          const canCancel = item.status !== 'CANCELLED' && item.status !== 'COMPLETED';
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('AppointmentDetail', { appointment: item })}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.doctorName}>Dr. {item.doctorName}</Text>
                <Text style={styles.dateText}>
                  {new Date(item.appointmentDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })}
                </Text>
                <View style={styles.timeRow}>
                  <Text style={styles.timeDot}>●</Text>
                  <Text style={styles.timeText}>{item.startTime} - {item.endTime}</Text>
                </View>
              </View>

              <View style={styles.cardRight}>
                <View style={[styles.statusPill, { backgroundColor: ss.bg }]}>
                  <Text style={[styles.statusText, { color: ss.text }]}>{item.status}</Text>
                </View>
                {canCancel && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(item)}
                    disabled={cancellingId === item.id}
                  >
                    {cancellingId === item.id ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyCircle}><Text style={styles.emptyIcon}>A</Text></View>
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptySub}>Tap below to book your first appointment</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAppointments(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PatientBooking')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  filterContainer: { backgroundColor: colors.surface, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  filterList: { paddingHorizontal: 16, gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: '#FFFFFF' },
  countText: { fontSize: 12, color: colors.textMuted, fontWeight: '600', paddingHorizontal: 16, marginTop: 8 },
  listContent: { paddingVertical: 8, paddingBottom: 80 },
  card: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: 14, marginHorizontal: 16, marginVertical: 5, borderWidth: 1,
    borderColor: colors.borderLight, ...shadows.sm,
  },
  cardLeft: { flex: 1, justifyContent: 'center', gap: 2 },
  doctorName: { fontSize: 15, fontWeight: '700', color: colors.text },
  dateText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginTop: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeDot: { fontSize: 6, color: colors.primaryLight },
  timeText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  cardRight: { alignItems: 'center', justifyContent: 'center', marginLeft: 8, gap: 6 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.sm },
  statusText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: '#FECACA', backgroundColor: colors.errorLight },
  cancelBtnText: { fontSize: 11, fontWeight: '700', color: colors.error },
  empty: { alignItems: 'center', paddingHorizontal: 32, justifyContent: 'center' },
  emptyCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 24, fontWeight: '800', color: colors.primary },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center' },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadows.lg },
  fabText: { fontSize: 28, color: '#FFFFFF', fontWeight: '400', lineHeight: 28, marginTop: -1 },
});
