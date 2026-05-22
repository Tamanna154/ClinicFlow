import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function PatientCard({ patient, onPress }) {
  const initials = patient.name
    ? patient.name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'P';

  const getGenderStyles = () => {
    const g = (patient.gender || '').toLowerCase().trim();
    if (g.startsWith('m')) return { bg: '#E0F2FE', text: '#0369A1' };
    if (g.startsWith('f')) return { bg: '#FCE7F3', text: '#BE185D' };
    return { bg: '#F3F4F6', text: '#4B5563' };
  };

  const genderStyle = getGenderStyles();
  const hasAllergies = patient.allergies && patient.allergies.trim().length > 0;

  return (
    <TouchableOpacity
      style={[styles.card, hasAllergies && styles.cardWithAllergies]}
      onPress={() => onPress(patient)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>{patient.name}</Text>
          <View style={styles.badgeRow}>
            {patient.gender && (
              <View style={[styles.badge, { backgroundColor: genderStyle.bg }]}>
                <Text style={[styles.badgeText, { color: genderStyle.text }]}>{patient.gender}</Text>
              </View>
            )}
            {patient.age != null && (
              <View style={[styles.badge, styles.ageBadge]}>
                <Text style={[styles.badgeText, styles.ageBadgeText]}>{patient.age} yrs</Text>
              </View>
            )}
            {patient.bloodGroup && (
              <View style={[styles.badge, styles.bloodBadge]}>
                <Text style={[styles.badgeText, styles.bloodBadgeText]}>{patient.bloodGroup}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📞</Text>
          <Text style={styles.infoText}>{patient.phone}</Text>
        </View>
        {patient.email ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>✉️</Text>
            <Text style={styles.infoText} numberOfLines={1}>{patient.email}</Text>
          </View>
        ) : null}
      </View>

      {hasAllergies && (
        <View style={styles.allergyBanner}>
          <Text style={styles.allergyIcon}>⚠️</Text>
          <Text style={styles.allergyText} numberOfLines={1}>
            Allergies: {patient.allergies}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardWithAllergies: {
    borderColor: '#FED7AA',
    borderLeftWidth: 5,
    borderLeftColor: '#F97316',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ageBadge: {
    backgroundColor: '#F1F5F9',
  },
  ageBadgeText: {
    color: '#475569',
  },
  bloodBadge: {
    backgroundColor: '#FEF2F2',
  },
  bloodBadgeText: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 16,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  allergyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 0.5,
    borderColor: '#FFEDD5',
  },
  allergyIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  allergyText: {
    fontSize: 12,
    color: '#C2410C',
    fontWeight: '600',
    flex: 1,
  },
});
