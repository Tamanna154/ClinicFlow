import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, StatusBar, Linking, Alert, TextInput, Dimensions, Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { clinicApi } from '../api/clinicApi';
import { doctorApi } from '../api/doctorApi';
import { colors, borderRadius, shadows, typography } from '../theme';
import { patientMedicationApi } from '../api/patientMedicationApi';
import { campApi } from '../api/campApi';
import { appointmentApi } from '../api/appointmentApi';
import { prescriptionApi } from '../api/prescriptionApi';
import { requestNotificationPermissions, scheduleMedicationNotification } from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'General', icon: '🩺', color: '#14B8A6' },
  { id: '2', name: 'Cardiology', icon: '🫀', color: '#EF4444' },
  { id: '3', name: 'Dentistry', icon: '🦷', color: '#10B981' },
  { id: '4', name: 'Neurology', icon: '🧠', color: '#8B5CF6' },
  { id: '5', name: 'Ophthalmology', icon: '👁️', color: '#F59E0B' },
];

export default function PatientDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [clinicDetails, setClinicDetails] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [medications, setMedications] = useState([]);
  const [mealTimings, setMealTimings] = useState(null);
  const [activeReminders, setActiveReminders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  
  // Notification states
  const [notifCampaigns, setNotifCampaigns] = useState([]);
  const [notifAppointments, setNotifAppointments] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifModalVisible, setNotifModalVisible] = useState(false);

  const alertedMedsRef = useRef(new Map());
  const snoozedAlarms = useRef(new Map());

  const handleConfirmIntake = async (medId) => {
    try {
      await patientMedicationApi.confirmIntake(medId);
      Alert.alert('Logged', 'Medication marked as taken!');
      setActiveReminders(prev => prev.filter(m => m.id !== medId));
      const newMeds = await patientMedicationApi.getMedications().catch(() => []);
      setMedications(newMeds);
    } catch (e) {
      Alert.alert('Error', 'Failed to log intake');
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      const [clinic, activeDocs, meds, timings, campsData, apptsData, prescriptionsData] = await Promise.all([
        clinicApi.getMyClinic().catch(() => null),
        doctorApi.getActive().catch(() => []),
        patientMedicationApi.getMedications().catch(() => []),
        patientMedicationApi.getMealTimings().catch(() => null),
        campApi.getCamps().catch(() => []),
        user?.patientId ? appointmentApi.getByPatient(user.patientId).catch(() => []) : Promise.resolve([]),
        user?.patientId ? prescriptionApi.getByPatient(user.patientId).catch(() => []) : Promise.resolve([])
      ]);
      setClinicDetails(clinic);
      setDoctors(activeDocs);
      setMedications(meds || []);
      setMealTimings(timings);
      setNotifCampaigns(campsData || []);
      const upcomingAppts = (apptsData || []).filter(a => a.status !== 'CANCELLED' && a.status !== 'COMPLETED');
      setNotifAppointments(upcomingAppts);
      setNotificationCount((campsData || []).length + upcomingAppts.length);
      setPrescriptions(prescriptionsData || []);
    } catch (err) {
      console.log('Error loading dashboard data', err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.patientId]);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    if (!mealTimings || !medications || medications.length === 0) return;

    const triggerAlarm = (med) => {
      scheduleMedicationNotification(med.medicineName, med.dosage, med.timingCategory);
      Alert.alert(
        "⏰ Medication Alarm",
        `It is time to take your medication: ${med.medicineName} (${med.dosage}).\nScheduled for ${med.timingCategory}.`,
        [
          {
            text: "Taken ✓",
            onPress: () => {
              handleConfirmIntake(med.id);
              snoozedAlarms.current.delete(med.id);
            }
          },
          {
            text: "Snooze (2 min)",
            onPress: () => {
              snoozedAlarms.current.set(med.id, Date.now() + 2 * 60 * 1000);
            }
          }
        ],
        { cancelable: false }
      );
    };

    const checkReminders = () => {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();

      const parseTimeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const match = timeStr.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
        if (!match) return 0;
        let hrs = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const pm = match[3].toUpperCase() === 'PM';
        if (pm && hrs < 12) hrs += 12;
        if (!pm && hrs === 12) hrs = 0;
        return hrs * 60 + mins;
      };

      const breakfastMin = parseTimeToMinutes(mealTimings.breakfastTime);
      const lunchMin = parseTimeToMinutes(mealTimings.lunchTime);
      const dinnerMin = parseTimeToMinutes(mealTimings.dinnerTime);

      const reminders = [];
      medications.forEach(med => {
        if (med.quantity === 0) return;
        
        // Skip if already taken today
        if (med.lastTakenAt) {
          const lastTakenDate = new Date(med.lastTakenAt).toDateString();
          const todayDate = new Date().toDateString();
          if (lastTakenDate === todayDate) {
            return;
          }
        }
        
        let scheduledMin = 0;
        if (med.timingCategory === 'BREAKFAST') scheduledMin = breakfastMin;
        else if (med.timingCategory === 'LUNCH') scheduledMin = lunchMin;
        else if (med.timingCategory === 'DINNER') scheduledMin = dinnerMin;

        const diff = Math.abs(currentMin - scheduledMin);
        if (diff <= 120) { // within 2 hours
          reminders.push(med);
        }

        // Alarm condition: 15 minutes before scheduled time
        const alarmMin = scheduledMin - 15;
        const todayStr = now.toDateString();
        
        // Check if we should trigger primary alarm (15 min before)
        if (currentMin >= alarmMin && currentMin < scheduledMin && !med.lastTakenAt) {
          const alertKey = `alarm-${med.id}-${todayStr}`;
          const lastAlertTime = alertedMedsRef.current.get(alertKey);
          if (!lastAlertTime || (Date.now() - lastAlertTime) >= 5 * 60 * 1000) {
            alertedMedsRef.current.set(alertKey, Date.now());
            triggerAlarm(med);
          }
        }

        // Check if we should trigger snoozed alarm
        if (snoozedAlarms.current.has(med.id)) {
          const nextTrigger = snoozedAlarms.current.get(med.id);
          if (Date.now() >= nextTrigger) {
            snoozedAlarms.current.delete(med.id); 
            triggerAlarm(med);
          }
        }
      });
      setActiveReminders(reminders);
    };

    checkReminders();
    const interval = setInterval(checkReminders, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [mealTimings, medications]);

  useFocusEffect(useCallback(() => {
    loadDashboardData();
    // Ask for BP/Sugar daily check reminder
    if (user?.patientId) {
      const today = new Date().toDateString();
      AsyncStorage.getItem('bpReminderDate').then(lastReminder => {
        if (lastReminder !== today) {
          setTimeout(() => {
            Alert.alert(
              '🩺 Daily Health Check',
              'Have you checked your BP and Blood Sugar today?\n\nTap "Log Now" to record your readings in your Profile.',
              [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'Log Now',
                  onPress: () => navigation.navigate('Profile')
                }
              ]
            );
            AsyncStorage.setItem('bpReminderDate', today);
          }, 5000);
        }
      }).catch(() => {});
    }
  }, [loadDashboardData]));

  const handleEmergencyMap = async () => {
    try {
      const queryText = clinicDetails?.address
        ? `${clinicDetails.name}, ${clinicDetails.address}`
        : 'ClinicFlow Clinic';
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryText)}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open Google Maps');
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to retrieve clinic address for maps.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout }
    ]);
  };

  const selectCategory = (catName) => {
    if (selectedCategory === catName) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(catName);
    }
  };

  // Filter doctors based on search query and category
  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = !searchQuery.trim() ||
      doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory ||
      doc.specialization?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (selectedCategory === 'General' && (!doc.specialization || doc.specialization.toLowerCase().includes('general')));

    return matchesSearch && matchesCategory;
  });

  const prescribedDoctors = Array.from(new Set(prescriptions.map(p => p.doctorName).filter(Boolean)));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Dribbble Style Curved Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
            </View>
            <View>
              <Text style={styles.welcomeText}>Welcome Back 👋</Text>
              <Text style={styles.userName}>{user?.name || 'Patient'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity 
              style={styles.notificationBtnSmall} 
              activeOpacity={0.7} 
              onPress={() => setNotifModalVisible(true)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={{ fontSize: 20 }}>🔔</Text>
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutBtnSmall} 
              activeOpacity={0.7} 
              onPress={handleLogout}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Text style={{ fontSize: 16 }}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Integrated Premium Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search doctor, specialty..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.filterBtn}>
            <Text style={styles.filterBtnIcon}>⚡</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeReminders.length > 0 && (
          <View style={styles.remindersContainer}>
            <Text style={styles.remindersHeader}>🔔 Pill Reminders Due Now</Text>
            {activeReminders.map(med => (
              <View key={med.id} style={styles.reminderBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderText}>
                    Time to take <Text style={{ fontWeight: '800' }}>{med.medicineName}</Text>
                  </Text>
                  <Text style={styles.reminderSubText}>
                    {med.dosage} ({med.relationToMeal === 'BEFORE_MEAL' ? 'Before meal' : 'After meal'})
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.takenBtn}
                  onPress={() => handleConfirmIntake(med.id)}
                >
                  <Text style={styles.takenBtnText}>Taken ✓</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {medications.filter(m => m.quantity < 3).length > 0 && (
          <View style={styles.warningsContainer}>
            <Text style={styles.warningsHeader}>⚠️ Medication ReStock Alerts</Text>
            {medications.filter(m => m.quantity < 3).map(med => (
              <View key={med.id} style={styles.warningBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.warningText}>
                    Low stock for <Text style={{ fontWeight: '800' }}>{med.medicineName}</Text>
                  </Text>
                  <Text style={styles.warningSubText}>
                    Only {med.quantity} tablets left. Please refill soon.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.refillBtn}
                  onPress={() => navigation.navigate('Medications')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.refillBtnText}>Refill ➔</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {/* Promotional Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Get 24/7 Online{'\n'}Consultation</Text>
            <Text style={styles.promoSub}>Consult with top doctors instantly</Text>
            <TouchableOpacity
              style={styles.promoAction}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('My Appointments', { screen: 'PatientBooking' })}
            >
              <Text style={styles.promoActionText}>Book Now</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promoGraphics}>
            <Text style={styles.promoGraphicEmoji}>🩺</Text>
          </View>
        </View>

        {/* My Prescribing Doctors */}
        {prescribedDoctors.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Care Doctors (Prescriptions)</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.doctorsRowScroll}>
              {prescribedDoctors.map((docName, idx) => (
                <View key={idx} style={styles.prescribedDocChip}>
                  <View style={styles.prescribedDocAvatar}>
                    <Text style={styles.prescribedDocAvatarText}>👨‍⚕️</Text>
                  </View>
                  <Text style={styles.prescribedDocName}>Dr. {docName}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Specialities</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && { backgroundColor: cat.color }]}
                activeOpacity={0.7}
                onPress={() => selectCategory(cat.name)}
              >
                <View style={[styles.categoryIconWrap, isSelected && { backgroundColor: '#FFFFFF30' }]}>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                </View>
                <Text style={[styles.categoryName, isSelected && { color: '#FFFFFF', fontWeight: '800' }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Shortcuts Horizontal Scroll */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Services</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutsScroll}>
          <TouchableOpacity style={[styles.shortcutCard, { borderLeftColor: colors.primary }]} onPress={() => navigation.navigate('Medications')} activeOpacity={0.7}>
            <Text style={styles.shortcutEmoji}>💊</Text>
            <Text style={styles.shortcutLabel}>Meds Tracker</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shortcutCard, { borderLeftColor: colors.info }]} onPress={() => navigation.navigate('Records')} activeOpacity={0.7}>
            <Text style={styles.shortcutEmoji}>📜</Text>
            <Text style={styles.shortcutLabel}>My Records</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shortcutCard, { borderLeftColor: colors.warning }]} onPress={() => navigation.navigate('Camps')} activeOpacity={0.7}>
            <Text style={styles.shortcutEmoji}>🩺</Text>
            <Text style={styles.shortcutLabel}>Health Camps</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shortcutCard, { borderLeftColor: colors.accent }]} onPress={() => navigation.navigate('Calendar')} activeOpacity={0.7}>
            <Text style={styles.shortcutEmoji}>📆</Text>
            <Text style={styles.shortcutLabel}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shortcutCard, { borderLeftColor: colors.error }]} onPress={handleEmergencyMap} activeOpacity={0.7}>
            <Text style={styles.shortcutEmoji}>🚨</Text>
            <Text style={styles.shortcutLabel}>Emergency Map</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Top Doctors Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Doctors</Text>
          <Text style={styles.sectionLink}>{filteredDoctors.length} available</Text>
        </View>

        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doc, idx) => {
            const randomRating = (4.5 + (idx % 5) * 0.1).toFixed(1);
            const randomReviews = 25 + (idx * 17);
            const docColor = CATEGORIES[idx % CATEGORIES.length].color;
            const docInitials = doc.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'Dr';

            return (
              <View key={doc.id || idx} style={styles.doctorCard}>
                <View style={[styles.docAvatarWrap, { backgroundColor: docColor + '15' }]}>
                  <Text style={[styles.docAvatarText, { color: docColor }]}>{docInitials}</Text>
                  <View style={styles.activeDot} />
                </View>
                <View style={styles.docDetails}>
                  <Text style={styles.docName}>Dr. {doc.name}</Text>
                  <Text style={styles.docSpecialty}>🔬 {doc.specialization || 'General Practitioner'}</Text>
                  <View style={styles.docMetaRow}>
                    <Text style={styles.docRating}>⭐ {randomRating}</Text>
                    <Text style={styles.docReviews}>({randomReviews} reviews)</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.bookBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('My Appointments', { screen: 'PatientBooking', params: { preselectedDoctorId: doc.id } })}
                >
                  <Text style={styles.bookBtnText}>Book</Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No Doctors Found</Text>
            <Text style={styles.emptySub}>Try adjusting your search queries or categories</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Notifications Modal */}
      <Modal animationType="slide" transparent={true} visible={notifModalVisible} onRequestClose={() => setNotifModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotifModalVisible(false)} style={styles.closeModalBtn}>
                <Text style={{ fontSize: 18, color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.modalSubHeader}>📢 Health Campaigns</Text>
              {notifCampaigns.length === 0 ? (
                <Text style={styles.emptyNotifText}>No upcoming campaigns found.</Text>
              ) : (
                notifCampaigns.map(camp => {
                  const dateStr = new Date(camp.campDate).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  });
                  return (
                    <View key={camp.id} style={styles.notifCard}>
                      <Text style={styles.notifTitle}>{camp.name}</Text>
                      <Text style={styles.notifText}>📅 Date: {dateStr}</Text>
                      <Text style={styles.notifText}>📍 Location: {camp.location}</Text>
                      {camp.description ? <Text style={styles.notifDesc}>{camp.description}</Text> : null}
                    </View>
                  );
                })
              )}

              <View style={{ height: 16 }} />

              <Text style={styles.modalSubHeader}>📅 Doctor Appointments</Text>
              {notifAppointments.length === 0 ? (
                <Text style={styles.emptyNotifText}>No active doctor appointments.</Text>
              ) : (
                notifAppointments.map(appt => {
                  const dateStr = new Date(appt.appointmentDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  });
                  return (
                    <View key={appt.id} style={styles.notifCard}>
                      <Text style={styles.notifTitle}>Dr. {appt.doctorName}</Text>
                      <Text style={styles.notifText}>🕒 Time: {appt.startTime} - {appt.endTime}</Text>
                      <Text style={styles.notifText}>📅 Date: {dateStr}</Text>
                      {appt.reason ? <Text style={styles.notifDesc}>Reason: {appt.reason}</Text> : null}
                      <View style={[styles.statusTag, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={styles.statusTagText}>{appt.status}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
    ...shadows.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  welcomeText: {
    fontSize: 12,
    color: '#E0F2FE',
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 1,
  },
  logoutBtnSmall: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  searchBox: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    ...shadows.sm,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  filterBtnIcon: {
    fontSize: 16,
    color: colors.primary,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  promoBanner: {
    height: 145,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.md,
  },
  promoContent: {
    flex: 1.2,
    justifyContent: 'center',
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  promoSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  promoAction: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  promoActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  promoGraphics: {
    flex: 0.8,
    alignItems: 'flex-end',
  },
  promoGraphicEmoji: {
    fontSize: 68,
    opacity: 0.8,
    transform: [{ rotate: '-15deg' }],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  categoriesScroll: {
    paddingRight: 16,
    gap: 10,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    ...shadows.sm,
  },
  categoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  shortcutsScroll: {
    paddingRight: 16,
    gap: 10,
    marginBottom: 24,
    paddingVertical: 2,
  },
  shortcutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
    minWidth: 110,
    ...shadows.sm,
  },
  shortcutEmoji: {
    fontSize: 22,
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    ...shadows.sm,
  },
  docAvatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  docAvatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  docDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  docName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  docSpecialty: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  docMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  docRating: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  docReviews: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  bookBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '850',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  remindersContainer: { backgroundColor: '#EEF2F6', borderRadius: 20, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#CBD5E1' },
  remindersHeader: { fontSize: 13, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  reminderBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.sm },
  reminderText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  reminderSubText: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  takenBtn: { backgroundColor: colors.success, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  takenBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  warningsContainer: { backgroundColor: '#FFFBEB', borderRadius: 20, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A' },
  warningsHeader: { fontSize: 13, fontWeight: '800', color: colors.warning, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  warningBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#FEF3C7', ...shadows.sm },
  warningText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  warningSubText: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  refillBtn: { backgroundColor: colors.warning, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  refillBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  notificationBtnSmall: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  closeModalBtn: {
    padding: 4,
  },
  modalSubHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginTop: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyNotifText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingLeft: 4,
    marginBottom: 10,
  },
  notifCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  notifText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  notifDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 16,
  },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  doctorsRowScroll: {
    paddingRight: 16,
    gap: 8,
    paddingVertical: 4,
  },
  prescribedDocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    ...shadows.sm,
  },
  prescribedDocAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prescribedDocAvatarText: {
    fontSize: 12,
  },
  prescribedDocName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
});
