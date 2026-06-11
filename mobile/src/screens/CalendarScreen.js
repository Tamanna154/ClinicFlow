import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Platform, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doctorApi } from '../api/doctorApi';
import { scheduleApi } from '../api/scheduleApi';
import { colors, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';

const VIEWS = ['daily', 'weekly', 'monthly'];
const STATUSBAR_H = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 36);

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatDate(d) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function CalendarScreen({ navigation }) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [view, setView] = useState('daily');
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(todayStr());

  const fetchDoctors = async () => {
    try {
      const data = await doctorApi.getAll();
      setDoctors(data);
      if (user?.role === 'DOCTOR' && user?.doctorId) {
        const myDoc = data.find(d => d.id === user.doctorId);
        if (myDoc) {
          setSelectedDoctor(myDoc);
        } else {
          setSelectedDoctor({ id: user.doctorId, name: user.name });
        }
      } else if (data.length > 0 && !selectedDoctor) {
        setSelectedDoctor(data[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not load doctors');
    }
  };

  const fetchSchedule = async (isRefresh = false) => {
    if (!selectedDoctor) return;
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const data = await scheduleApi.get(selectedDoctor.id, currentDate, view);
      setSchedule(data);
    } catch (e) { Alert.alert('Error', 'Failed to load schedule.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchDoctors(); }, []));
  useFocusEffect(useCallback(() => { if (selectedDoctor) fetchSchedule(); }, [selectedDoctor, currentDate, view]));

  const navigateDate = (dir) => {
    const d = new Date(currentDate + 'T00:00:00');
    if (view === 'daily') d.setDate(d.getDate() + dir);
    else if (view === 'weekly') d.setDate(d.getDate() + 7 * dir);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
  };

  const isToday = currentDate === todayStr();
  const scheduleDays = schedule?.days || [];
  const scheduleEntries = view === 'daily' && scheduleDays.length > 0
    ? (scheduleDays[0].slots || [])
    : scheduleDays;

  const renderSlots = () => {
    if (!schedule || scheduleEntries.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyCircle}><Text style={styles.emptyIcon}>☰</Text></View>
          <Text style={styles.emptyTitle}>No schedule available</Text>
          <Text style={styles.emptySub}>Select a different date or doctor</Text>
        </View>
      );
    }

    if (view === 'daily') {
      return (
        <View style={styles.timeline}>
          {scheduleEntries.map((entry, idx) => {
            const isBooked = entry.booked === true || !!entry.appointmentId;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.timeSlot, isBooked && styles.timeSlotBooked]}
                onPress={() => {
                  if (entry.appointmentId) navigation.navigate('AppointmentDetail', { appointment: { id: entry.appointmentId } });
                  else navigation.navigate('CalendarBooking', { doctorId: selectedDoctor?.id, date: currentDate, startTime: entry.startTime });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.slotTime}>{entry.startTime}</Text>
                <View style={styles.slotLine}>
                  <View style={[styles.slotDot, isBooked && styles.slotDotBooked]} />
                  <View style={[styles.slotBar, isBooked && styles.slotBarBooked]} />
                </View>
                <View style={styles.slotInfo}>
                  {isBooked ? (
                    <>
                      <Text style={[
                        styles.slotPatient,
                        entry.status === 'COMPLETED' || entry.status === 'CONSULTATION_COMPLETED'
                          ? styles.slotPatientDone
                          : styles.slotPatientPending
                      ]} numberOfLines={1}>
                        {entry.patientName || 'Booked'}
                      </Text>
                      <Text style={styles.slotEnd}>{entry.endTime}</Text>
                    </>
                  ) : (
                    <Text style={styles.slotAvailable}>Available</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    return (
      <View style={styles.weekGrid}>
        {scheduleEntries.map((entry, idx) => {
          const d = new Date(entry.date + 'T00:00:00');
          const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const busy = entry.bookedSlots > 0;
          const full = entry.totalSlots > 0 && entry.bookedSlots >= entry.totalSlots;
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.weekCard, busy && styles.weekCardBusy, full && styles.weekCardFull]}
              onPress={() => { setCurrentDate(entry.date); setView('daily'); }}
              activeOpacity={0.7}
            >
              <Text style={styles.weekDay}>{dayLabel}</Text>
              <View style={styles.weekStats}>
                <Text style={[styles.weekCount, busy && styles.weekCountBusy]}>
                  {entry.bookedSlots}/{entry.totalSlots} booked
                </Text>
                <View style={[styles.weekBar, { backgroundColor: colors.borderLight }]}>
                  <View style={[styles.weekBarFill, {
                    width: entry.totalSlots > 0 ? `${(entry.bookedSlots / entry.totalSlots) * 100}%` : '0%',
                    backgroundColor: full ? colors.error : busy ? colors.primary : colors.success,
                  }]} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {user?.role !== 'DOCTOR' && (
        <View style={styles.doctorBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.doctorList}>
            {doctors.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={[styles.doctorChip, selectedDoctor?.id === doc.id && styles.doctorChipActive]}
                onPress={() => setSelectedDoctor(doc)}
                activeOpacity={0.7}
              >
                <Text style={[styles.doctorChipText, selectedDoctor?.id === doc.id && styles.doctorChipTextActive]}>
                  Dr. {doc.name?.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.navBtn} activeOpacity={0.6}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentDate(todayStr())} style={styles.dateLabel} activeOpacity={0.7}>
          <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
          {!isToday && <Text style={styles.todayLink}>Today</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigateDate(1)} style={styles.navBtn} activeOpacity={0.6}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.viewBar}>
        {VIEWS.map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.viewChip, view === v && styles.viewChipActive]}
            onPress={() => setView(v)}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewChipText, view === v && styles.viewChipTextActive]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scheduleContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchSchedule(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {renderSlots()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  doctorBar: { backgroundColor: colors.surface, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  doctorList: { paddingHorizontal: 16, gap: 8 },
  doctorChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: borderRadius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  doctorChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  doctorChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  doctorChipTextActive: { color: '#FFFFFF' },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  navBtnText: { fontSize: 20, color: colors.text, fontWeight: '700' },
  dateLabel: { alignItems: 'center' },
  dateText: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  todayLink: { fontSize: 11, color: colors.primaryLight, fontWeight: '600', marginTop: 1 },
  viewBar: { flexDirection: 'row', backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  viewChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.md, backgroundColor: colors.bg },
  viewChipActive: { backgroundColor: colors.primary + '12' },
  viewChipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  viewChipTextActive: { color: colors.primary },
  scheduleContent: { padding: 16, paddingBottom: 32 },
  timeline: { gap: 2 },
  timeSlot: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  timeSlotBooked: { opacity: 1 },
  slotTime: { width: 52, fontSize: 12, fontWeight: '600', color: colors.textMuted, textAlign: 'right', marginRight: 12 },
  slotLine: { alignItems: 'center', width: 20 },
  slotDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  slotDotBooked: { backgroundColor: colors.primary },
  slotBar: { width: 1, flex: 1, backgroundColor: colors.borderLight, marginTop: 2 },
  slotBarBooked: { backgroundColor: colors.primary + '30' },
  slotInfo: { flex: 1, marginLeft: 12 },
  slotPatient: { fontSize: 14, fontWeight: '600', color: colors.text },
  slotPatientPending: { color: colors.error, fontWeight: '700' },
  slotPatientDone: { color: colors.info, fontWeight: '600' },
  slotEnd: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  slotAvailable: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  weekGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  weekCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: 14, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  weekCardBusy: { borderColor: colors.primary + '30', backgroundColor: colors.primary + '05' },
  weekCardFull: { borderColor: colors.error + '30', backgroundColor: colors.errorLight },
  weekDay: { fontSize: 13, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  weekStats: { marginTop: 8 },
  weekCount: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  weekCountBusy: { color: colors.primary },
  weekBar: { height: 4, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  weekBarFill: { height: 4, borderRadius: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 24, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4, letterSpacing: -0.2 },
  emptySub: { fontSize: 13, color: colors.textMuted },
});
