import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { appointmentApi } from '../api/appointmentApi';
import { patientMedicationApi } from '../api/patientMedicationApi';
import { campApi } from '../api/campApi';
import { colors, borderRadius, shadows } from '../theme';

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatDateLabel(dateString) {
  const d = new Date(dateString + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

function getWeekDays(selectedDateStr) {
  const selected = new Date(selectedDateStr + 'T00:00:00');
  const dayOfWeek = selected.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const startOfWeek = new Date(selected);
  startOfWeek.setDate(selected.getDate() - dayOfWeek); // Start on Sunday
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateString = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    days.push({
      dateString,
      dayNum: d.getDate(),
      dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
    });
  }
  return days;
}

function getMonthDays(dateStr) {
  const selected = new Date(dateStr + 'T00:00:00');
  const year = selected.getFullYear();
  const month = selected.getMonth(); // 0-indexed

  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 is Sunday
  const numDays = new Date(year, month + 1, 0).getDate();
  const prevNumDays = new Date(year, month, 0).getDate();

  const days = [];

  // Previous month padding
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevNumDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateString = prevYear + '-' + String(prevMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    days.push({
      dateString,
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= numDays; i++) {
    const dateString = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(i).padStart(2, '0');
    days.push({
      dateString,
      dayNum: i,
      isCurrentMonth: true,
    });
  }

  // Next month padding to round up to standard grids (35 or 42 cells)
  const totalSlots = days.length <= 35 ? 35 : 42;
  const nextPadding = totalSlots - days.length;
  for (let i = 1; i <= nextPadding; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateString = nextYear + '-' + String(nextMonth + 1).padStart(2, '0') + '-' + String(i).padStart(2, '0');
    days.push({
      dateString,
      dayNum: i,
      isCurrentMonth: false,
    });
  }

  return days;
}

export default function PatientCalendarScreen({ navigation }) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [mealTimings, setMealTimings] = useState({
    breakfastTime: '08:00 AM',
    lunchTime: '01:30 PM',
    dinnerTime: '08:30 PM'
  });
  const [camps, setCamps] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (!user?.patientId) return;
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);

      const [apptsData, medsData, timingsData, campsData] = await Promise.all([
        appointmentApi.getByPatient(user.patientId).catch(() => []),
        patientMedicationApi.getMedications().catch(() => []),
        patientMedicationApi.getMealTimings().catch(() => null),
        campApi.getCamps().catch(() => []),
      ]);

      setAppointments(apptsData);
      setMedications(medsData);
      if (timingsData) setMealTimings(timingsData);
      setCamps(campsData);
    } catch (err) {
      console.log('Error fetching calendar data', err.message);
      Alert.alert('Error', 'Failed to retrieve schedule data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkTaken = async (medId, medicineName) => {
    try {
      await patientMedicationApi.confirmIntake(medId);
      Alert.alert('Intake Confirmed', `${medicineName} marked as taken!`);
      fetchData(); // Instantly update calendar colors and status
    } catch (e) {
      Alert.alert('Error', 'Failed to confirm medication intake.');
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [user?.patientId]));

  const navigateMode = (dir) => {
    const d = new Date(selectedDate + 'T00:00:00');
    if (viewMode === 'week') {
      d.setDate(d.getDate() + dir * 7);
    } else {
      d.setMonth(d.getMonth() + dir);
    }
    const dateString = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    setSelectedDate(dateString);
  };

  // Compile timeline items for the selectedDate
  const getTimelineItems = () => {
    const items = [];

    // 1. Filter appointments for selectedDate
    const dateAppts = appointments.filter(a => a.appointmentDate === selectedDate && a.status !== 'CANCELLED');
    dateAppts.forEach(appt => {
      items.push({
        time: appt.startTime,
        sortTime: appt.startTime,
        type: 'APPOINTMENT',
        title: `Appointment: Dr. ${appt.doctorName}`,
        subtitle: `Room: ${appt.doctorSpecialty || 'General Consultation'}`,
        color: colors.primary,
        raw: appt,
      });
    });

    // 2. Add Medications (since medications are daily, we show them every day)
    const breakfastMeds = medications.filter(m => m.timingCategory === 'BREAKFAST');
    if (breakfastMeds.length > 0) {
      items.push({
        time: mealTimings.breakfastTime,
        sortTime: '08:00', // Standard sorting anchor
        type: 'MED_BREAKFAST',
        title: '🌅 Breakfast Medications',
        medicines: breakfastMeds,
        color: colors.primaryLight,
      });
    }

    const lunchMeds = medications.filter(m => m.timingCategory === 'LUNCH');
    if (lunchMeds.length > 0) {
      items.push({
        time: mealTimings.lunchTime,
        sortTime: '13:30', // Standard sorting anchor
        type: 'MED_LUNCH',
        title: '☀️ Lunch Medications',
        medicines: lunchMeds,
        color: colors.info,
      });
    }

    const dinnerMeds = medications.filter(m => m.timingCategory === 'DINNER');
    if (dinnerMeds.length > 0) {
      items.push({
        time: mealTimings.dinnerTime,
        sortTime: '20:30', // Standard sorting anchor
        type: 'MED_DINNER',
        title: '🌙 Dinner Medications',
        medicines: dinnerMeds,
        color: colors.accent,
      });
    }

    // 3. Health Camps on this date
    const dateCamps = camps.filter(c => c.campDate === selectedDate);
    dateCamps.forEach(camp => {
      items.push({
        time: 'All Day',
        sortTime: '00:00',
        type: 'CAMP',
        title: `📢 Free Camp: ${camp.name}`,
        subtitle: `📍 Location: ${camp.location}`,
        color: colors.warning,
        raw: camp,
      });
    });

    // Sort timeline items chronologically
    return items.sort((a, b) => {
      return a.sortTime.localeCompare(b.sortTime);
    });
  };

  const timelineItems = getTimelineItems();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Premium Weekly/Monthly Calendar Strip */}
      <View style={styles.calendarStrip}>
        {/* View Switcher */}
        <View style={styles.switcherContainer}>
          <TouchableOpacity
            style={[styles.switcherTab, viewMode === 'week' && styles.switcherTabActive]}
            onPress={() => setViewMode('week')}
            activeOpacity={0.7}
          >
            <Text style={[styles.switcherText, viewMode === 'week' && styles.switcherTextActive]}>Week View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switcherTab, viewMode === 'month' && styles.switcherTabActive]}
            onPress={() => setViewMode('month')}
            activeOpacity={0.7}
          >
            <Text style={[styles.switcherText, viewMode === 'month' && styles.switcherTextActive]}>Month View</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stripHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => navigateMode(-1)} style={styles.chevronBtn} activeOpacity={0.6}>
              <Text style={styles.chevronText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.stripMonthText}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => navigateMode(1)} style={styles.chevronBtn} activeOpacity={0.6}>
              <Text style={styles.chevronText}>›</Text>
            </TouchableOpacity>
          </View>
          {selectedDate !== todayStr() && (
            <TouchableOpacity onPress={() => setSelectedDate(todayStr())} style={styles.todayChip}>
              <Text style={styles.todayChipText}>Today</Text>
            </TouchableOpacity>
          )}
        </View>

        {viewMode === 'week' ? (
          <View style={styles.weekRow}>
            {getWeekDays(selectedDate).map((day, idx) => {
              const isSelected = day.dateString === selectedDate;
              const isToday = day.dateString === todayStr();
              
              const dayAppts = appointments.filter(a => a.appointmentDate === day.dateString && a.status !== 'CANCELLED');
              const dayCamps = camps.filter(c => c.campDate === day.dateString);
              const hasEvent = dayAppts.length > 0 || dayCamps.length > 0;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCard,
                    isSelected && styles.dayCardSelected,
                    isToday && !isSelected && styles.dayCardToday
                  ]}
                  onPress={() => setSelectedDate(day.dateString)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayNameText, isSelected && styles.dayNameTextSelected]}>
                    {day.dayName.substring(0, 3)}
                  </Text>
                  <View style={[styles.dayNumCircle, isSelected && styles.dayNumCircleSelected]}>
                    <Text style={[styles.dayNumText, isSelected && styles.dayNumTextSelected]}>
                      {day.dayNum}
                    </Text>
                  </View>
                  {hasEvent && (
                    <View style={[styles.eventDot, isSelected && styles.eventDotSelected]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.monthGrid}>
            <View style={styles.weekdayRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => (
                <Text key={idx} style={styles.weekdayText}>{dayName}</Text>
              ))}
            </View>
            <View style={styles.daysGridRow}>
              {getMonthDays(selectedDate).map((day, idx) => {
                const isSelected = day.dateString === selectedDate;
                const isToday = day.dateString === todayStr();
                
                const dayAppts = appointments.filter(a => a.appointmentDate === day.dateString && a.status !== 'CANCELLED');
                const dayCamps = camps.filter(c => c.campDate === day.dateString);
                const hasEvent = dayAppts.length > 0 || dayCamps.length > 0;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.monthDayCard,
                      isSelected && styles.dayCardSelected,
                      isToday && !isSelected && styles.dayCardToday,
                      !day.isCurrentMonth && styles.dayCardOutside
                    ]}
                    onPress={() => setSelectedDate(day.dateString)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.monthDayNumText, 
                      isSelected && styles.dayNumTextSelected,
                      !day.isCurrentMonth && styles.dayNumOutsideText
                    ]}>
                      {day.dayNum}
                    </Text>
                    {hasEvent && (
                      <View style={[styles.eventDot, isSelected && styles.eventDotSelected]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <Text style={styles.sectionHeader}>Schedule for {formatDateLabel(selectedDate)}</Text>

        {timelineItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyCircle}><Text style={styles.emptyIcon}>📅</Text></View>
            <Text style={styles.emptyTitle}>Nothing scheduled</Text>
            <Text style={styles.emptySub}>No appointments, camps, or medications logged for this date.</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {timelineItems.map((item, idx) => (
              <View key={idx} style={styles.timelineRow}>
                {/* Time Indicator */}
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{item.time}</Text>
                  <View style={styles.lineIndicator}>
                    <View style={[styles.dotIndicator, { backgroundColor: item.color }]} />
                    {idx < timelineItems.length - 1 && <View style={styles.verticalBar} />}
                  </View>
                </View>

                {/* Card details */}
                <View style={styles.detailsContainer}>
                  {item.type.startsWith('MED_') ? (
                    (() => {
                      const allTaken = item.medicines.every(m => {
                        if (!m.lastTakenAt) return false;
                        return m.lastTakenAt.split('T')[0] === selectedDate;
                      });
                      const borderColor = allTaken ? '#10B981' : '#EF4444';
                      const badgeText = allTaken ? '✓ All Taken' : 'Pending';
                      const badgeBg = allTaken ? '#D1FAE5' : '#FEE2E2';
                      const badgeColor = allTaken ? '#10B981' : '#EF4444';
                      const isToday = selectedDate === todayStr();

                      return (
                        <View style={[styles.itemCard, { borderLeftColor: borderColor }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                              <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{badgeText}</Text>
                            </View>
                          </View>
                          {item.medicines.map((m, mIdx) => {
                            const taken = m.lastTakenAt && m.lastTakenAt.split('T')[0] === selectedDate;
                            return (
                              <View key={mIdx} style={styles.medItemRow}>
                                <Text style={styles.medBullet}>💊</Text>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.medNameText, taken && { textDecorationLine: 'line-through', color: colors.textMuted }]}>
                                    {m.medicineName} ({m.dosage})
                                  </Text>
                                  <Text style={styles.medRelationText}>
                                    {m.relationToMeal === 'BEFORE_MEAL' ? 'Before meal' : 'After meal'} | Stock: {m.quantity} left
                                  </Text>
                                </View>
                                {isToday && !taken && (
                                  <TouchableOpacity
                                    style={styles.markTakenBtn}
                                    onPress={() => handleMarkTaken(m.id, m.medicineName)}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={styles.markTakenBtnText}>Mark Taken</Text>
                                  </TouchableOpacity>
                                )}
                                {taken && (
                                  <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '800' }}>✓ Taken</Text>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      );
                    })()
                  ) : (
                    <TouchableOpacity
                      style={[styles.itemCard, { borderLeftColor: item.color }]}
                      disabled={item.type !== 'APPOINTMENT'}
                      onPress={() => navigation.navigate('My Appointments', {
                        screen: 'AppointmentDetail',
                        params: { appointment: item.raw }
                      })}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                      {item.type === 'APPOINTMENT' && (
                        <Text style={styles.viewLink}>View details ➔</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  calendarStrip: {
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  switcherTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  switcherTabActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  switcherText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  switcherTextActive: {
    color: colors.primary,
  },
  monthGrid: {
    marginTop: 4,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    width: '13%',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
  },
  daysGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  monthDayCard: {
    width: '13%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  dayCardOutside: {
    opacity: 0.3,
  },
  monthDayNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  dayNumOutsideText: {
    color: colors.textMuted,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  eventDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  stripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stripMonthText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  chevronBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chevronText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
  },
  todayChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primary + '12',
  },
  todayChipText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCard: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    width: '13%',
  },
  dayCardSelected: {
    backgroundColor: colors.primary,
  },
  dayCardToday: {
    borderWidth: 1,
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '08',
  },
  dayNameText: {
    fontSize: 10,
    fontWeight: '750',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dayNameTextSelected: {
    color: '#FFFFFF',
  },
  dayNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumCircleSelected: {
    backgroundColor: '#FFFFFF',
  },
  dayNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  dayNumTextSelected: {
    color: colors.primary,
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 16,
    paddingLeft: 4,
  },
  timeline: { paddingLeft: 4 },
  timelineRow: { flexDirection: 'row', minHeight: 80 },
  timeContainer: { flexDirection: 'row', width: 90, alignItems: 'flex-start' },
  timeText: {
    width: 68,
    fontSize: 12,
    fontWeight: '750',
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
    marginRight: 6
  },
  lineIndicator: { alignItems: 'center', width: 16, height: '100%' },
  dotIndicator: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  verticalBar: { width: 2, flex: 1, backgroundColor: colors.borderLight, marginVertical: 4 },
  detailsContainer: { flex: 1, paddingLeft: 6, paddingBottom: 16 },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  itemTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  itemSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  viewLink: { fontSize: 11, color: colors.primary, fontWeight: '750', marginTop: 8 },
  medItemRow: { flexDirection: 'row', marginTop: 8, alignItems: 'flex-start', gap: 6 },
  medBullet: { fontSize: 12 },
  medNameText: { fontSize: 12, fontWeight: '700', color: colors.text },
  medRelationText: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyIcon: { fontSize: 24, color: colors.primary },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  emptySub: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  markTakenBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  markTakenBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
