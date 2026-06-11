import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Switch, Modal, TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { campApi } from '../api/campApi';
import { colors, borderRadius, shadows } from '../theme';
import { DatePickerModal } from '../components/DateTimePickerModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PatientCampsScreen() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';
  const isPatient = user?.role === 'PATIENT';

  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState({});
  const [expandedCamp, setExpandedCamp] = useState(null);
  const [ignoredCamps, setIgnoredCamps] = useState([]);
  const [registeredCamps, setRegisteredCamps] = useState([]);

  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  // Modal create states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newCampName, setNewCampName] = useState('');
  const [newCampSpecialty, setNewCampSpecialty] = useState('');
  const [newCampDate, setNewCampDate] = useState(todayStr);
  const [newCampLocation, setNewCampLocation] = useState('');
  const [newCampDesc, setNewCampDesc] = useState('');
  const [newCampDoctorId, setNewCampDoctorId] = useState('');
  const [savingCamp, setSavingCamp] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const fetchCamps = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const data = await campApi.getCamps();
      setCamps(data);
    } catch (err) {
      console.log('Error fetching camps', err.message);
      Alert.alert('Error', 'Could not load upcoming health camps.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    if (isPatient) {
      AsyncStorage.getItem('ignoredCamps').then(val => {
        if (val) setIgnoredCamps(JSON.parse(val));
      }).catch(() => {});
      AsyncStorage.getItem('registeredCamps').then(val => {
        if (val) setRegisteredCamps(JSON.parse(val));
      }).catch(() => {});
    }
    fetchCamps();
  }, []));

  const toggleReminder = (campId, campName, dateStr) => {
    const isNowActive = !reminders[campId];
    setReminders(prev => ({ ...prev, [campId]: isNowActive }));
    
    if (isNowActive) {
      Alert.alert(
        '🔔 Reminder Registered',
        `We have set a calendar notification and SMS reminder for "${campName}" on ${dateStr}. You will receive alerts 1 day before the camp starts.`
      );
    } else {
      Alert.alert(
        'Reminder Cancelled',
        `Notification alert for "${campName}" has been removed.`
      );
    }
  };

  const handleCreateCamp = async () => {
    if (!newCampName.trim() || !newCampLocation.trim() || !newCampDate.trim()) {
      Alert.alert('Required Fields', 'Please fill in the Name, Date, and Location.');
      return;
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newCampDate.trim())) {
      Alert.alert('Invalid Date', 'Please use YYYY-MM-DD format.');
      return;
    }

    setSavingCamp(true);
    try {
      const payload = {
        name: newCampName.trim(),
        specialty: newCampSpecialty.trim() || null,
        campDate: newCampDate.trim(),
        location: newCampLocation.trim(),
        description: newCampDesc.trim() || null,
        doctorId: isDoctor ? user?.doctorId || user?.id : (newCampDoctorId || null),
      };

      await campApi.createCamp(payload);
      Alert.alert('Success', 'Health campaign created successfully!');
      setCreateModalVisible(false);
      
      setNewCampName('');
      setNewCampSpecialty('');
      setNewCampDate(todayStr);
      setNewCampLocation('');
      setNewCampDesc('');
      
      fetchCamps();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create campaign.');
    } finally {
      setSavingCamp(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCamps(true)} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>📢</Text>
          <View style={styles.bannerTexts}>
            <Text style={styles.bannerTitle}>Community Campaigns</Text>
            <Text style={styles.bannerDesc}>
              {isDoctor 
                ? 'Review upcoming healthcare screening events or schedule a new community health campaign.'
                : 'ClinicFlow sponsors free healthcare screening and consultation events. Set reminders below to secure your slots.'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Upcoming Free Camps</Text>

        {camps.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No medical camps scheduled at this time.</Text>
          </View>
        ) : (
          camps.map((camp) => {
            const hasReminder = !!reminders[camp.id];
            const dateObj = new Date(camp.campDate);
            const dateStr = dateObj.toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });
            const isExpanded = expandedCamp === camp.id;
            const registrations = camp.registrations || [];
            const regCount = registrations.length || camp.registrationCount || 0;

            const isIgnored = ignoredCamps.includes(camp.id);
            const isRegistered = registeredCamps.includes(camp.id);

            if (isPatient && isIgnored) return null;

            return (
              <View key={camp.id} style={styles.campCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.specialtyWrap}>
                    <Text style={styles.specialtyText}>{camp.specialty || 'General Health'}</Text>
                  </View>
                  <View style={styles.reminderRow}>
                    {regCount > 0 && (
                      <TouchableOpacity
                        style={styles.regCountBadge}
                        onPress={() => setExpandedCamp(isExpanded ? null : camp.id)}
                      >
                        <Text style={styles.regCountText}>{regCount} Registered</Text>
                      </TouchableOpacity>
                    )}
                    {isPatient && (
                      <Switch
                        value={hasReminder}
                        onValueChange={() => toggleReminder(camp.id, camp.name, dateStr)}
                        trackColor={{ false: colors.border, true: colors.primaryLight }}
                        thumbColor={hasReminder ? colors.primary : '#FFFFFF'}
                      />
                    )}
                  </View>
                </View>

                <Text style={styles.campName}>{camp.name}</Text>
                {camp.description ? (
                  <Text style={styles.campDesc}>{camp.description}</Text>
                ) : null}

                {camp.doctorName && (
                  <Text style={styles.campDoctor}>👨‍⚕️ Dr. {camp.doctorName}</Text>
                )}

                <View style={styles.divider} />

                <View style={styles.detailsList}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📅</Text>
                    <Text style={styles.detailText}>{dateStr}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📍</Text>
                    <Text style={styles.detailText}>{camp.location}</Text>
                  </View>
                </View>

                {isPatient && (
                  <View style={styles.campActions}>
                    {!isRegistered ? (
                      <TouchableOpacity
                        style={styles.registerBtn}
                        onPress={() => {
                          const updated = [...registeredCamps, camp.id];
                          setRegisteredCamps(updated);
                          AsyncStorage.setItem('registeredCamps', JSON.stringify(updated));
                          Alert.alert('Registered', `You are registered for "${camp.name}". You will get a reminder 15 minutes before.`);
                        }}
                      >
                        <Text style={styles.registerBtnText}>✓ Register</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.registeredBadge}
                        onPress={() => {
                          const updated = registeredCamps.filter(id => id !== camp.id);
                          setRegisteredCamps(updated);
                          AsyncStorage.setItem('registeredCamps', JSON.stringify(updated));
                        }}
                      >
                        <Text style={styles.registeredBadgeText}>✓ Registered</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.ignoreBtn}
                      onPress={() => {
                        const updated = [...ignoredCamps, camp.id];
                        setIgnoredCamps(updated);
                        AsyncStorage.setItem('ignoredCamps', JSON.stringify(updated));
                      }}
                    >
                      <Text style={styles.ignoreBtnText}>✕ Ignore</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isExpanded && registrations.length > 0 && (
                  <View style={styles.regList}>
                    <Text style={styles.regListTitle}>Registered Patients</Text>
                    {registrations.map((reg, i) => (
                      <View key={i} style={styles.regItem}>
                        <Text style={styles.regIndex}>{i + 1}.</Text>
                        <Text style={styles.regName}>{reg.patientName || reg.name || 'Unknown'}</Text>
                        {reg.phone && <Text style={styles.regPhone}>{reg.phone}</Text>}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {isDoctor && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Health Campaign</Text>
            
            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Campaign Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCampName}
                  onChangeText={setNewCampName}
                  placeholder="e.g. Free Eye Care Camp"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Specialty</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCampSpecialty}
                  onChangeText={setNewCampSpecialty}
                  placeholder="e.g. Cardiology"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Campaign Date *</Text>
                <TouchableOpacity
                  style={[styles.textInput, { justifyContent: 'center', minHeight: 45 }]}
                  onPress={() => setDatePickerVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: newCampDate ? colors.text : colors.textMuted, fontSize: 14, fontWeight: '500' }}>
                    {newCampDate || 'Select Campaign Date'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newCampLocation}
                  onChangeText={setNewCampLocation}
                  placeholder="e.g. Main Clinic Lobby"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description / Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newCampDesc}
                  onChangeText={setNewCampDesc}
                  placeholder="Provide details about the camp..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setCreateModalVisible(false)}
                disabled={savingCamp}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave, savingCamp && { opacity: 0.6 }]}
                onPress={handleCreateCamp}
                disabled={savingCamp}
              >
                {savingCamp ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnSaveText}>Save Campaign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(date) => setNewCampDate(date)}
        value={newCampDate}
        minDate={todayStr}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scrollContent: { padding: 16, paddingBottom: 80 },
  banner: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '20',
    marginBottom: 24,
    alignItems: 'center',
    gap: 12
  },
  bannerEmoji: { fontSize: 28 },
  bannerTexts: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: colors.primary },
  bannerDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
    paddingLeft: 4,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: 40,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  campCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 12,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  specialtyWrap: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  specialtyText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: colors.primary
  },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reminderLabel: { fontSize: 10, fontWeight: '750', color: colors.textSecondary },
  campName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 6 },
  campDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 12 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginBottom: 12 },
  detailsList: { gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailIcon: { fontSize: 13 },
  detailText: { fontSize: 12, fontWeight: '650', color: colors.textSecondary },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 26, 43, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxHeight: '90%',
    padding: 20,
    ...shadows.xl
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center'
  },
  modalForm: {
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  textInput: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBtnCancel: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary
  },
  modalBtnSave: {
    backgroundColor: colors.primary
  },
  modalBtnSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '400',
    lineHeight: 28,
    marginTop: -1
  },
  campDoctor: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  regCountBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  regCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  regList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  regListTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  regItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  regIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    width: 24,
  },
  regName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  regPhone: {
    fontSize: 11,
    color: colors.textMuted,
  },
  campActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  registerBtn: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  registeredBadge: {
    flex: 1,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success,
  },
  registeredBadgeText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  ignoreBtn: {
    flex: 1,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  ignoreBtnText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
});
