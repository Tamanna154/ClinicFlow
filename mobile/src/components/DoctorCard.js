import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import Avatar, { StatusDot } from './Avatar';
import { colors, shadows, borderRadius } from '../theme';

export default function DoctorCard({ doctor, onPress }) {
  const { formatCurrency } = useSettings();

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(doctor)} activeOpacity={0.7}>
      <View style={styles.top}>
        <View>
          <Avatar name={doctor.name} size={48} />
          {doctor.isActive && <StatusDot />}
        </View>
        <View style={styles.topInfo}>
          <Text style={styles.name} numberOfLines={1}>Dr. {doctor.name}</Text>
          {doctor.specialization && (
            <View style={styles.specBadge}>
              <Text style={styles.specText}>{doctor.specialization}</Text>
            </View>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View style={styles.body}>
        {doctor.email && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>✉</Text>
            <Text style={styles.infoText} numberOfLines={1}>{doctor.email}</Text>
          </View>
        )}
        {doctor.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📞</Text>
            <Text style={styles.infoText}>{doctor.phone}</Text>
          </View>
        )}
        {doctor.consultationFee != null && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>💰</Text>
            <Text style={[styles.infoText, styles.feeText]}>{formatCurrency(doctor.consultationFee)}</Text>
          </View>
        )}
      </View>

      {doctor.googleCalendarEnabled && (
        <View style={styles.calendarBadge}>
          <Text style={styles.calendarIcon}>▣</Text>
          <Text style={styles.calendarText}>Calendar Synced</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16,
    marginHorizontal: 16, marginVertical: 5,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  top: { flexDirection: 'row', alignItems: 'center' },
  topInfo: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  specBadge: {
    backgroundColor: colors.primary + '10', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, alignSelf: 'flex-start', marginTop: 4,
  },
  specText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  chevron: { fontSize: 24, color: colors.border, marginLeft: 8, fontWeight: '300' },
  body: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight, gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIcon: { fontSize: 12, marginRight: 8, width: 18, textAlign: 'center' },
  infoText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  feeText: { color: colors.primaryDark, fontWeight: '700' },
  calendarBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.sm,
    marginTop: 12,
  },
  calendarIcon: { fontSize: 12, color: colors.success, marginRight: 6, fontWeight: '700' },
  calendarText: { fontSize: 11, color: colors.success, fontWeight: '600' },
});
