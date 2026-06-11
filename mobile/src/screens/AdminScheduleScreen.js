import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Platform, StatusBar, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doctorApi } from '../api/doctorApi';
import { appointmentApi } from '../api/appointmentApi';
import { colors, borderRadius, shadows } from '../theme';
import { DatePickerModal } from '../components/DateTimePickerModal';

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export default function AdminScheduleScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [doctors, setDoctors] = useState([]);
  const [apptCounts, setApptCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const fetchData = useCallback(async (isRefresh) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const docs = await doctorApi.getAll().catch(() => []);
      setDoctors(docs);

      const base = require('../api/apiBase').getApiBase();
      const authFetch = require('../api/client').authFetch;

      const counts = {};
      const results = await Promise.allSettled(
        docs.map(async (doc) => {
          const res = await authFetch(
            `${base}/appointments/by-doctor-date?doctorId=${doc.id}&date=${selectedDate}`
          );
          if (res.ok) {
            const data = await res.json();
            counts[doc.id] = { total: data.length || 0, appointments: data || [] };
          } else {
            counts[doc.id] = { total: 0, appointments: [] };
          }
        })
      );
      setApptCounts(counts);
    } catch (e) {
      console.log(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const isHoliday = (doc) => {
    const info = apptCounts[doc.id];
    if (!info) return false;
    return info.total === 0 && !doc.isActive;
  };

  const isNotAvailable = (doc) => {
    const info = apptCounts[doc.id];
    if (!info) return false;
    return info.total === 0;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule Overview</Text>
        <Text style={styles.headerSub}>Doctor-wise appointment summary</Text>
      </View>

      <View style={styles.dateBar}>
        <TouchableOpacity onPress={() => setDatePickerVisible(true)} style={styles.dateBtn} activeOpacity={0.7}>
          <Text style={styles.dateLabel}>📅 {selectedDate}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {doctors.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👨‍⚕️</Text>
              <Text style={styles.emptyTitle}>No Doctors Available</Text>
              <Text style={styles.emptySub}>Add doctors to see their schedule</Text>
            </View>
          ) : (
            doctors.map((doc) => {
              const info = apptCounts[doc.id] || { total: 0, appointments: [] };
              const onHoliday = isHoliday(doc);
              const noAppts = isNotAvailable(doc);

              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.docCard, onHoliday && styles.docCardHoliday]}
                  onPress={() => {
                    if (info.total > 0) {
                      navigation.navigate('AppointmentList', { doctorId: doc.id });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.docCardLeft}>
                    <View style={[styles.docAvatar, { backgroundColor: doc.isActive ? colors.primary + '15' : colors.borderLight }]}>
                      <Text style={[styles.docAvatarText, { color: doc.isActive ? colors.primary : colors.textMuted }]}>
                        {doc.name?.charAt(0) || 'D'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docName}>Dr. {doc.name}</Text>
                      <Text style={styles.docSpecialty}>{doc.specialization || 'General'}</Text>
                    </View>
                  </View>
                  <View style={styles.docCardRight}>
                    {onHoliday ? (
                      <View style={styles.holidayBadge}>
                        <Text style={styles.holidayText}>🌴 Holiday</Text>
                      </View>
                    ) : noAppts ? (
                      <View style={styles.noApptsBadge}>
                        <Text style={styles.noApptsText}>No Appts</Text>
                      </View>
                    ) : (
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{info.total}</Text>
                        <Text style={styles.countLabel}>Appointment{info.total !== 1 ? 's' : ''}</Text>
                      </View>
                    )}
                    {!doc.isActive && (
                      <View style={styles.inactiveDot} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(date) => {
          setSelectedDate(date);
          setDatePickerVisible(false);
        }}
        value={selectedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#FFFFFFAA', marginTop: 4 },
  dateBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  dateBtn: {
    backgroundColor: colors.bg, borderRadius: borderRadius.md, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  dateLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  docCard: {
    backgroundColor: colors.surface, borderRadius: 18, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  docCardHoliday: { backgroundColor: colors.errorLight, borderColor: '#FECACA' },
  docCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  docAvatar: {
    width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  docAvatarText: { fontSize: 18, fontWeight: '800' },
  docName: { fontSize: 15, fontWeight: '700', color: colors.text },
  docSpecialty: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  docCardRight: { alignItems: 'flex-end', marginLeft: 10 },
  holidayBadge: {
    backgroundColor: colors.error + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: colors.error + '30',
  },
  holidayText: { fontSize: 11, fontWeight: '700', color: colors.error },
  noApptsBadge: {
    backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  noApptsText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  countBadge: { alignItems: 'center' },
  countText: { fontSize: 24, fontWeight: '800', color: colors.primary },
  countLabel: { fontSize: 9, fontWeight: '600', color: colors.textMuted, marginTop: 1 },
  inactiveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error,
    position: 'absolute', top: -4, right: -4,
  },
});
