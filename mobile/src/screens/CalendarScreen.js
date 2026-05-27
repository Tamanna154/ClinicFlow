import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doctorApi } from '../api/doctorApi';
import { scheduleApi } from '../api/scheduleApi';
import { colors, borderRadius, shadows } from '../theme';

const VIEWS = ['daily', 'weekly', 'monthly'];
const HOURS = ['08','09','10','11','12','13','14','15','16','17','18','19','20'];
const SLOT_WIDTH = Dimensions.get('window').width - 70;

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function formatDate(d) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function CalendarScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [view, setView] = useState('daily');
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(todayStr());

  const fetchDoctors = async () => {
    try { const data = await doctorApi.getAll(); setDoctors(data); if (data.length > 0 && !selectedDoctor) setSelectedDoctor(data[0]); }
    catch (e) { Alert.alert('Error', 'Could not load doctors'); }
  };

  const fetchSchedule = async (isRefresh = false) => {
    if (!selectedDoctor) return;
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const data = await scheduleApi.get(selectedDoctor.id, currentDate, view);
      setSchedule(data);
    } catch (e) { console.log(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchDoctors(); }, []));
  useFocusEffect(useCallback(() => { if (selectedDoctor) fetchSchedule(); }, [selectedDoctor, currentDate, view]));

  const navigateDate = (dir) => {
    const d = new Date(currentDate);
    if (view === 'daily') d.setDate(d.getDate() + dir);
    else if (view === 'weekly') d.setDate(d.getDate() + 7 * dir);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));
  };

  const goToday = () => setCurrentDate(todayStr());

  const getSlotForTime = (daySlots, hour) => {
    if (!daySlots) return null;
    return daySlots.find(s => s.startTime?.startsWith(hour));
  };

  const handleBookFromCalendar = (slot) => {
    if (!slot.booked && selectedDoctor) {
      navigation.navigate('CalendarBooking', {
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        prefillDate: currentDate,
        prefillStart: slot.startTime?.slice(0,5),
        prefillEnd: slot.endTime?.slice(0,5),
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Doctor Strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.docStrip} contentContainerStyle={styles.docStripContent}>
        {doctors.map((d) => (
          <TouchableOpacity key={d.id} style={[styles.docChip, selectedDoctor?.id === d.id && styles.docChipActive]}
            onPress={() => { setSelectedDoctor(d); setCurrentDate(todayStr()); }}>
            <Text style={[styles.docChipName, selectedDoctor?.id === d.id && styles.docChipNameActive]}>Dr. {d.name}</Text>
            <Text style={[styles.docChipSpec, selectedDoctor?.id === d.id && styles.docChipSpecActive]}>{d.specialization || 'General'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.viewRow}>
          {VIEWS.map((v) => (
            <TouchableOpacity key={v} style={[styles.viewTab, view === v && styles.viewTabActive]}
              onPress={() => setView(v)}>
              <Text style={[styles.viewTabText, view === v && styles.viewTabTextActive]}>{v.charAt(0).toUpperCase()+v.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.navBtn}><Text style={styles.navBtnText}>‹</Text></TouchableOpacity>
          <TouchableOpacity onPress={goToday}><Text style={styles.dateLabel}>{formatDate(currentDate)}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigateDate(1)} style={styles.navBtn}><Text style={styles.navBtnText}>›</Text></TouchableOpacity>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Available</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.error }]} /><Text style={styles.legendText}>Booked</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.bg }]} /><Text style={styles.legendText}>No Slot</Text></View>
      </View>

      {/* Time Grid */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView
          style={styles.gridContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchSchedule(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {schedule?.days?.length > 0 ? schedule.days.map((day, di) => (
            <View key={di} style={styles.daySection}>
              <View style={styles.dayLabelRow}>
                <Text style={styles.dayLabel}>{formatDate(day.date)}</Text>
                <View style={styles.statsRow}>
                  <Text style={[styles.statBadge, { backgroundColor: colors.successLight, color: colors.success }]}>
                    {day.totalSlots - day.bookedSlots} free
                  </Text>
                  <Text style={[styles.statBadge, { backgroundColor: colors.errorLight, color: colors.error }]}>
                    {day.bookedSlots} booked
                  </Text>
                </View>
              </View>

              {HOURS.map((hour) => {
                const slot = getSlotForTime(day.slots, hour);
                if (!slot) return (
                  <View key={hour} style={styles.gridRow}>
                    <View style={styles.timeLabel}><Text style={styles.timeText}>{hour}:00</Text></View>
                    <View style={[styles.slotCell, styles.slotNone]}><Text style={styles.slotNoneText}>—</Text></View>
                  </View>
                );
                const booked = slot.booked;
                return (
                  <TouchableOpacity key={hour} style={styles.gridRow} onPress={() => handleBookFromCalendar(slot)} disabled={booked} activeOpacity={0.7}>
                    <View style={styles.timeLabel}><Text style={styles.timeText}>{hour}:00</Text></View>
                    <View style={[styles.slotCell, booked ? styles.slotBooked : styles.slotFree]}>
                      <View style={styles.slotContent}>
                        <View style={styles.slotLeft}>
                          <Text style={[styles.slotTimeRange, booked && { color: colors.error }]}>
                            {slot.startTime?.slice(0,5)} - {slot.endTime?.slice(0,5)}
                          </Text>
                          <Text style={[styles.slotLabel, booked ? { color: colors.error } : { color: colors.success }]}>
                            {booked ? `Slot #${slot.slotIndex || di+1} — Booked` : `Slot #${slot.slotIndex || di+1} — Free`}
                          </Text>
                        </View>
                        <View style={[styles.statusIndicator, { backgroundColor: booked ? colors.error : colors.success }]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )) : (
            <View style={styles.center}>
              <Text style={{ color: colors.textMuted, paddingVertical: 40 }}>Select a doctor to see schedule</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  docStrip: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight, maxHeight: 68 },
  docStripContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  docChip: { backgroundColor: colors.bg, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, marginRight: 6, minWidth: 90 },
  docChipActive: { backgroundColor: colors.primary + '15', borderColor: colors.primary },
  docChipName: { fontSize: 12, fontWeight: '700', color: colors.text },
  docChipNameActive: { color: colors.primary },
  docChipSpec: { fontSize: 10, fontWeight: '500', color: colors.textMuted, marginTop: 1 },
  docChipSpecActive: { color: colors.primaryLight },
  controls: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 6 },
  viewRow: { flexDirection: 'row', gap: 4 },
  viewTab: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: borderRadius.sm, backgroundColor: colors.bg },
  viewTabActive: { backgroundColor: colors.primary },
  viewTabText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  viewTabTextActive: { color: '#FFFFFF' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  navBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  navBtnText: { fontSize: 18, color: colors.primary, fontWeight: '700', lineHeight: 20 },
  dateLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  legend: { flexDirection: 'row', backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 6, gap: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
  gridContainer: { flex: 1 },
  daySection: { margin: 8, backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  dayLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dayLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  statsRow: { flexDirection: 'row', gap: 6 },
  statBadge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  gridRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderLight, minHeight: 48 },
  timeLabel: { width: 54, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg + '80' },
  timeText: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
  slotCell: { flex: 1, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 6 },
  slotNone: { backgroundColor: colors.bg },
  slotNoneText: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  slotFree: { backgroundColor: colors.successLight },
  slotBooked: { backgroundColor: colors.errorLight },
  slotContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slotLeft: { flex: 1 },
  slotTimeRange: { fontSize: 12, fontWeight: '700', color: colors.text },
  slotLabel: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
});
