import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { colors, shadows, borderRadius, getGenderStyle } from '../theme';

export default function PatientCard({ patient, onPress }) {
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
        <Avatar name={patient.name} size={44} />
        <View style={styles.topInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, isArchived && styles.nameArchived]} numberOfLines={1}>{patient.name}</Text>
            {isArchived && <View style={styles.archivedPill}><Text style={styles.archivedPillText}>A</Text></View>}
          </View>
          <View style={styles.meta}>
            {patient.gender && <View style={[styles.metaItem, { backgroundColor: gs.bg }]}><Text style={[styles.metaText, { color: gs.text }]}>{patient.gender}</Text></View>}
            {patient.age != null && <Text style={styles.metaSep}>·</Text>}
            {patient.age != null && <Text style={styles.metaText}>{patient.age}y</Text>}
            {patient.bloodGroup && <Text style={styles.metaSep}>·</Text>}
            {patient.bloodGroup && <Text style={[styles.metaText, styles.metaBlood]}>{patient.bloodGroup}</Text>}
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.contactRow}>
          <Text style={styles.contactIcon}>📞</Text>
          <Text style={styles.contactText}>{patient.phone}</Text>
        </View>
        {patient.email ? (
          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>✉</Text>
            <Text style={styles.contactText} numberOfLines={1}>{patient.email}</Text>
          </View>
        ) : null}
      </View>

      {patient.createdByName && (
        <Text style={styles.createdBy}>Added by {patient.createdByName}</Text>
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
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16,
    marginHorizontal: 16, marginVertical: 5,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  cardAlert: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  cardArchived: { opacity: 0.6, borderStyle: 'dashed' },
  top: { flexDirection: 'row', alignItems: 'center' },
  topInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, letterSpacing: -0.2 },
  nameArchived: { color: colors.textMuted },
  archivedPill: { backgroundColor: colors.warningLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 6 },
  archivedPillText: { fontSize: 9, fontWeight: '800', color: colors.warning },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaItem: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  metaSep: { fontSize: 14, color: colors.border, fontWeight: '300' },
  metaText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  metaBlood: { color: colors.error, fontWeight: '700' },
  chevron: { fontSize: 24, color: colors.border, marginLeft: 8, fontWeight: '300' },
  body: { marginTop: 10, gap: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  contactIcon: { fontSize: 11, marginRight: 8, width: 16, textAlign: 'center' },
  contactText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  createdBy: { fontSize: 10, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' },
  allergyBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warningLight,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.sm,
    marginTop: 10,
  },
  allergyIcon: {
    fontSize: 10, fontWeight: '800', color: colors.warning, marginRight: 6,
    width: 16, height: 16, borderRadius: 8, backgroundColor: colors.warning + '20',
    textAlign: 'center', lineHeight: 16, overflow: 'hidden',
  },
  allergyText: { fontSize: 12, color: '#92400E', fontWeight: '600', flex: 1 },
});
