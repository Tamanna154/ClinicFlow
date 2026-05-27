import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius } from '../theme';

export default function DoctorCard({ doctor, onPress }) {
  const initials = doctor.name
    ? doctor.name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'DR';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(doctor)} activeOpacity={0.7}>
      <View style={styles.top}>
        <View style={[styles.avatar, doctor.isActive ? styles.avatarActive : styles.avatarInactive]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.topInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>Dr. {doctor.name}</Text>
            <View style={[styles.statusDot, doctor.isActive ? styles.activeDot : styles.inactiveDot]} />
          </View>
          {doctor.specialization && (
            <View style={styles.specBadge}>
              <Text style={styles.specText}>{doctor.specialization}</Text>
            </View>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        {doctor.email && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>✉️</Text>
            <Text style={styles.detailText} numberOfLines={1}>{doctor.email}</Text>
          </View>
        )}
        {doctor.phone && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📞</Text>
            <Text style={styles.detailText}>{doctor.phone}</Text>
          </View>
        )}
        {doctor.consultationFee != null && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>💰</Text>
            <Text style={[styles.detailText, styles.feeText]}>₹{Number(doctor.consultationFee).toLocaleString()}</Text>
          </View>
        )}
      </View>

      {doctor.googleCalendarEnabled && (
        <View style={styles.calendarBadge}>
          <Text style={styles.calendarIcon}>▣</Text>
          <Text style={styles.calendarText}>Google Sync</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarActive: {
    backgroundColor: colors.primary + '15',
  },
  avatarInactive: {
    backgroundColor: colors.bg,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  topInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  activeDot: {
    backgroundColor: colors.success,
  },
  inactiveDot: {
    backgroundColor: colors.textMuted,
  },
  specBadge: {
    backgroundColor: colors.primary + '12',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  specText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
    marginLeft: 8,
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  details: {
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 12,
    marginRight: 8,
    width: 16,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  feeText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  calendarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: '#BBF7D0',
  },
  calendarIcon: {
    fontSize: 12,
    color: colors.success,
    marginRight: 6,
    fontWeight: '700',
  },
  calendarText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
});
