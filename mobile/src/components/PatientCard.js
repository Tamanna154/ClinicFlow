import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius, getGenderStyle } from '../theme';

export default function PatientCard({ patient, onPress }) {
  const initials = patient.name?.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'P';
  const gs = getGenderStyle(patient.gender);
  const hasAllergies = patient.allergies && patient.allergies.trim().length > 0;
  const isArchived = patient.archived;

  return (
    <TouchableOpacity
      style={[styles.card, hasAllergies && styles.cardAlert, isArchived && styles.cardArchived]}
      onPress={() => onPress(patient)}
      activeOpacity={0.7}
    >
      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: gs.bg }]}>
          <Text style={[styles.avatarText, { color: gs.text }]}>{initials}</Text>
        </View>
        <View style={styles.topInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, isArchived && styles.nameArchived]} numberOfLines={1}>{patient.name}</Text>
            {isArchived && <View style={styles.archivedPill}><Text style={styles.archivedPillText}>A</Text></View>}
          </View>
          <View style={styles.badges}>
            {patient.gender && <View style={[styles.badge, { backgroundColor: gs.bg }]}><Text style={[styles.badgeText, { color: gs.text }]}>{patient.gender}</Text></View>}
            {patient.age != null && <View style={styles.badge}><Text style={styles.badgeText}>{patient.age}y</Text></View>}
            {patient.bloodGroup && <View style={[styles.badge, { backgroundColor: '#FEF2F2' }]}><Text style={[styles.badgeText, { color: '#DC2626', fontWeight: '700' }]}>{patient.bloodGroup}</Text></View>}
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.detailItem}><Text style={styles.detailIcon}>📞</Text><Text style={styles.detailText}>{patient.phone}</Text></View>
        {patient.email ? <View style={styles.detailItem}><Text style={styles.detailIcon}>✉️</Text><Text style={styles.detailText} numberOfLines={1}>{patient.email}</Text></View> : null}
      </View>

      {patient.createdByName && (
        <View style={styles.createdByRow}>
          <Text style={styles.createdByText}>by {patient.createdByName}</Text>
        </View>
      )}

      {hasAllergies && !isArchived && (
        <View style={styles.allergyBanner}>
          <Text style={styles.allergyIcon}>!</Text>
          <Text style={styles.allergyText} numberOfLines={1}>{patient.allergies}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16, marginHorizontal: 16, marginVertical: 5, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  cardAlert: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  cardArchived: { opacity: 0.7, borderStyle: 'dashed' },
  top: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700' },
  topInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 },
  nameArchived: { color: colors.textMuted },
  archivedPill: { backgroundColor: colors.warningLight, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 6 },
  archivedPillText: { fontSize: 9, fontWeight: '800', color: colors.warning },
  badges: { flexDirection: 'row', gap: 5 },
  badge: { backgroundColor: colors.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  chevron: { fontSize: 22, color: colors.textMuted, marginLeft: 8, fontWeight: '300' },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 10 },
  details: { gap: 6 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: { fontSize: 12, marginRight: 8, width: 16, textAlign: 'center' },
  detailText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  createdByRow: { marginTop: 6 },
  createdByText: { fontSize: 10, color: colors.textMuted, fontStyle: 'italic' },
  allergyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warningLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.sm, marginTop: 8, borderWidth: 0.5, borderColor: '#FDE68A' },
  allergyIcon: { fontSize: 11, fontWeight: '800', color: colors.warning, marginRight: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.warning + '20', textAlign: 'center', lineHeight: 16, overflow: 'hidden' },
  allergyText: { fontSize: 12, color: '#92400E', fontWeight: '600', flex: 1 },
});
