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
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateMonth}>{month}</Text>
      </View>

      <View style={styles.center}>
        <Text style={styles.doctorName} numberOfLines={1}>Dr. {appointment.doctorName}</Text>
        <Text style={styles.patientName} numberOfLines={1}>{appointment.patientName}</Text>
        <View style={styles.timeRow}>
          <Text style={styles.timeDot}>●</Text>
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
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  dateBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateDay: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 19,
  },
  dateMonth: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  patientName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeDot: {
    fontSize: 6,
    color: colors.primaryLight,
    marginRight: 2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  reason: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 1,
  },
  rightCol: { alignItems: 'center', justifyContent: 'center', marginLeft: 8, gap: 4 },
  onlineBadge: { backgroundColor: colors.infoLight, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 0.5, borderColor: '#BAE6FD' },
  onlineBadgeText: { fontSize: 8, fontWeight: '700', color: colors.info, letterSpacing: 0.3 },
  statusPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    minWidth: 60,
    gap: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
