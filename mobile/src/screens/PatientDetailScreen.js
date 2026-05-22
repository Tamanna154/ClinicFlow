import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Linking, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { patientApi } from '../api/patientApi';

function CardSection({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value, isLink, onPress, icon }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.row}>
      <View style={styles.rowLabelContainer}>
        {icon && <Text style={styles.rowIcon}>{icon}</Text>}
        <Text style={styles.label}>{label}</Text>
      </View>
      <TouchableOpacity
        disabled={!isLink}
        onPress={onPress}
        style={styles.valueContainer}
      >
        <Text style={[styles.value, isLink && styles.linkText]}>
          {String(value)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PatientDetailScreen({ route, navigation }) {
  const initialPatient = route.params.patient;
  const [patient, setPatient] = useState(initialPatient);
  const [loading, setLoading] = useState(false);

  // Reload patient on screen focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const loadPatient = async () => {
        try {
          const freshData = await patientApi.getById(initialPatient.id);
          if (isMounted) setPatient(freshData);
        } catch (err) {
          console.log('Error refreshing patient detail:', err.message);
        }
      };

      loadPatient();
      return () => {
        isMounted = false;
      };
    }, [initialPatient.id])
  );

  const handleEdit = () => {
    navigation.navigate('PatientForm', { patient });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Patient',
      `Are you sure you want to permanently delete patient ${patient.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await patientApi.delete(patient.id);
              navigation.navigate('PatientList');
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCall = (phone) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const url = `${Platform.OS === 'ios' ? 'telprompt' : 'tel'}:${cleanPhone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert('Not Supported', 'Phone calls are not supported on this simulator/device.');
      })
      .catch((err) => console.log('Error opening call url:', err));
  };

  const handleEmail = (email) => {
    if (!email) return;
    const url = `mailto:${email}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else Alert.alert('Not Supported', 'Emails are not supported on this simulator/device.');
      })
      .catch((err) => console.log('Error opening email url:', err));
  };

  const initials = patient.name
    ? patient.name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'P';

  const getGenderColor = () => {
    const g = (patient.gender || '').toLowerCase().trim();
    if (g.startsWith('m')) return { bg: '#E0F2FE', text: '#0369A1' };
    if (g.startsWith('f')) return { bg: '#FCE7F3', text: '#BE185D' };
    return { bg: '#F3F4F6', text: '#4B5563' };
  };

  const genderColor = getGenderColor();
  const hasAllergies = patient.allergies && patient.allergies.trim().length > 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>{initials}</Text>
          </View>
          <Text style={styles.name}>{patient.name}</Text>
          
          <View style={styles.badgeRow}>
            {patient.gender && (
              <View style={[styles.badge, { backgroundColor: genderColor.bg }]}>
                <Text style={[styles.badgeText, { color: genderColor.text }]}>{patient.gender}</Text>
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

        {/* Allergy Warning Card */}
        {hasAllergies ? (
          <View style={styles.allergyAlertCard}>
            <View style={styles.allergyAlertHeader}>
              <Text style={styles.allergyAlertIcon}>⚠️</Text>
              <Text style={styles.allergyAlertTitle}>CRITICAL ALLERGY ALERT</Text>
            </View>
            <Text style={styles.allergyAlertContent}>{patient.allergies}</Text>
          </View>
        ) : (
          <View style={styles.noAllergyCard}>
            <Text style={styles.noAllergyText}>✅ No Known Allergies Reported</Text>
          </View>
        )}

        {/* Contact Info Card */}
        <CardSection title="Contact Information">
          <DetailRow
            icon="📞"
            label="Phone Number"
            value={patient.phone}
            isLink
            onPress={() => handleCall(patient.phone)}
          />
          <DetailRow
            icon="✉️"
            label="Email Address"
            value={patient.email}
            isLink
            onPress={() => handleEmail(patient.email)}
          />
          <DetailRow
            icon="📍"
            label="Home Address"
            value={patient.address}
          />
        </CardSection>

        {/* Medical Info Card */}
        <CardSection title="Medical Records">
          <DetailRow
            icon="🩸"
            label="Blood Group"
            value={patient.bloodGroup}
          />
          <DetailRow
            icon="📝"
            label="Medical History"
            value={patient.medicalHistory}
          />
          <DetailRow
            icon="🚫"
            label="Reported Allergies"
            value={patient.allergies}
          />
        </CardSection>

        {/* Emergency Contact Card */}
        <CardSection title="Emergency Contact">
          <DetailRow
            icon="👤"
            label="Contact Person"
            value={patient.emergencyContactName}
          />
          <DetailRow
            icon="🚨"
            label="Emergency Phone"
            value={patient.emergencyContactPhone}
            isLink
            onPress={() => handleCall(patient.emergencyContactPhone)}
          />
        </CardSection>

      </ScrollView>

      {/* Action Footer */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.8}>
          <Text style={styles.actionText}>Edit Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
          <Text style={[styles.actionText, { color: '#ffffff' }]}>Delete Patient</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 32 },
  profileHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  avatarTextLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  name: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 12, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { fontSize: 13, fontWeight: '600' },
  ageBadge: { backgroundColor: '#F1F5F9' },
  ageBadgeText: { color: '#475569' },
  bloodBadge: { backgroundColor: '#FEF2F2' },
  bloodBadgeText: { color: '#EF4444' },

  allergyAlertCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderLeftWidth: 6,
    borderLeftColor: '#F97316',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  allergyAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  allergyAlertIcon: { fontSize: 16, marginRight: 8 },
  allergyAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
    letterSpacing: 0.5,
  },
  allergyAlertContent: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9A3412',
    lineHeight: 22,
  },
  noAllergyCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  noAllergyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    fontSize: 15,
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  label: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  valueContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  value: { fontSize: 14, color: '#0F172A', fontWeight: '600', textAlign: 'right' },
  linkText: { color: '#2563EB', textDecorationLine: 'underline' },

  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  actionText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
