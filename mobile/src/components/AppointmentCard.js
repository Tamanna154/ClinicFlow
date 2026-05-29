import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius, getStatusStyle } from '../theme';

export default function AppointmentCard({ appointment, onPress }) {
  const statusStyle = getStatusStyle(appointment.status);
  const date = appointment.appointmentDate
    ? new Date(appointment.appointmentDate + 'T00:00:00')
    : null;
  const day = date ? date.getDate() : '';
  const month = date ? date.toLocaleDateString('en-US', { month: 'short' }) : '';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(appointment)} activeOpacity={0.7}>
      <View style={[styles.dateBox, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.dateDay, { color: statusStyle.text }]}>{day}</Text>
        <Text style={[styles.dateMonth, { color: statusStyle.text }]}>{month}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.patientName} numberOfLines={1}>{appointment.patientName}</Text>
        <Text style={styles.doctorName} numberOfLines={1}>Dr. {appointment.doctorName}</Text>
        <View style={styles.timeRow}>
          <Text style={[styles.timeDot, { color: statusStyle.text }]}>●</Text>
          <Text style={styles.timeText}>{appointment.startTime} - {appointment.endTime}</Text>
        </View>
        {appointment.reason ? (
          <Text style={styles.reason} numberOfLines={1}>{appointment.reason}</Text>
        ) : null}
      </View>

      <View style={styles.rightCol}>
        {appointment.isOnline && (
          <View style={styles.onlineBadge}><Text style={styles.onlineBadgeText}>Online</Text></View>
        )}
        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{appointment.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: borderRadius.xl, padding: 14,
    marginHorizontal: 16, marginVertical: 5,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  dateBox: {
    width: 50, height: 50, borderRadius: borderRadius.md,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  dateDay: {
    fontSize: 18, fontWeight: '800', lineHeight: 20, letterSpacing: -0.3,
  },
  dateMonth: {
    fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1,
  },
  body: { flex: 1, justifyContent: 'center', gap: 2 },
  patientName: { fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  doctorName: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  timeDot: { fontSize: 6, marginRight: 2 },
  timeText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  reason: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 1 },
  rightCol: { alignItems: 'center', justifyContent: 'center', marginLeft: 8, gap: 6 },
  onlineBadge: {
    backgroundColor: colors.infoLight, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, borderWidth: 0.5, borderColor: '#BAE6FD',
  },
  onlineBadgeText: { fontSize: 8, fontWeight: '700', color: colors.info, letterSpacing: 0.3 },
  statusPill: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: borderRadius.sm, minWidth: 64, gap: 3,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
});
