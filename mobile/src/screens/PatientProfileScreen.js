import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
  Modal, TextInput, ActivityIndicator, Dimensions, Switch
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../context/AuthContext';
import { colors, shadows, borderRadius } from '../theme';
import { DatePickerModal, TimePickerModal } from '../components/DateTimePickerModal';
import { patientHealthLogApi } from '../api/patientHealthLogApi';
import { patientMedicationApi } from '../api/patientMedicationApi';
import { getApiBase } from '../api/apiBase';
import { authFetch } from '../api/client';

const { width } = Dimensions.get('window');

function confirmAndLogout(logout) {
  Alert.alert(
    'Sign Out',
    'Are you sure you want to sign out?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
    ]
  );
}

export default function PatientProfileScreen() {
  const { user, logout } = useAuth();
  
  // Family states
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyModalVisible, setFamilyModalVisible] = useState(false);
  const [famName, setFamName] = useState('');
  const [famRelationship, setFamRelationship] = useState('Spouse');
  const [famAge, setFamAge] = useState('');
  const [famGender, setFamGender] = useState('Male');
  const [famPhone, setFamPhone] = useState('');
  const [famHistory, setFamHistory] = useState('');
  const [savingFamily, setSavingFamily] = useState(false);

  // Vitals states
  const [vitals, setVitals] = useState([]);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [vitalsModalVisible, setVitalsModalVisible] = useState(false);
  const [vitalsTab, setVitalsTab] = useState('bp'); // 'bp' or 'sugar'

  // Medication adherence
  const [upcomingMeds, setUpcomingMeds] = useState([]);
  
  // Vitals form
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [measuredDate, setMeasuredDate] = useState('');
  const [measuredTime, setMeasuredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [savingVitals, setSavingVitals] = useState(false);

  // Picker visibility
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const fetchFamily = async () => {
    if (!user?.patientId) return;
    try {
      const base = getApiBase();
      const res = await authFetch(`${base}/patients/${user.patientId}/family`);
      if (res.ok) {
        const data = await res.json();
        setFamilyMembers(data);
      }
    } catch (e) {
      console.log('Error fetching family:', e);
    }
  };

  const fetchVitals = async () => {
    if (!user?.patientId) return;
    setLoadingVitals(true);
    try {
      const data = await patientHealthLogApi.getHealthLogs(user.patientId);
      setVitals(data || []);
    } catch (e) {
      console.log('Error fetching health logs:', e);
    } finally {
      setLoadingVitals(false);
    }
  };

  const fetchMedications = async () => {
    try {
      const data = await patientMedicationApi.getMedications();
      setUpcomingMeds(data || []);
    } catch (e) {
      console.log('Error fetching meds:', e);
    }
  };

  useEffect(() => {
    fetchFamily();
    fetchVitals();
    fetchMedications();
  }, [user?.patientId]);

  // Handle family
  const handleAddFamilyMember = async () => {
    if (!famName.trim()) { Alert.alert('Required', 'Please enter a name'); return; }
    setSavingFamily(true);
    try {
      const base = getApiBase();
      const res = await authFetch(`${base}/patients/${user.patientId}/family`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: famName.trim(),
          relationship: famRelationship,
          age: famAge ? parseInt(famAge, 10) : null,
          gender: famGender,
          phone: famPhone.trim() || null,
          medicalHistory: famHistory.trim() || null
        })
      });
      if (res.ok) {
        Alert.alert('Success', 'Family member added!');
        setFamilyModalVisible(false);
        setFamName('');
        setFamRelationship('Spouse');
        setFamAge('');
        setFamGender('Male');
        setFamPhone('');
        setFamHistory('');
        fetchFamily();
      } else {
        const errText = await res.text().catch(() => 'Failed to add family member');
        let errMsg = 'Failed to add family member';
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error || errJson.message || errMsg;
          if (errJson.errors) errMsg = errJson.errors.join(', ');
        } catch (_) { errMsg = errText || errMsg; }
        Alert.alert('Error', errMsg);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSavingFamily(false);
    }
  };

  const handleDeleteMember = (memberId) => {
    Alert.alert('Delete Member', 'Are you sure you want to remove this family member?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const base = getApiBase();
          const res = await authFetch(`${base}/patients/${user.patientId}/family/${memberId}`, { method: 'DELETE' });
          if (res.ok) {
            setFamilyMembers(prev => prev.filter(m => m.id !== memberId));
          }
        } catch (ex) { Alert.alert('Error', ex.message); }
      }}
    ]);
  };

  // Handle vitals
  const openVitalsModal = () => {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const hr = String(today.getHours()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    const timeStr = `${hr}:${min}`;

    setSystolic('');
    setDiastolic('');
    setBloodSugar('');
    setMeasuredDate(todayStr);
    setMeasuredTime(timeStr);
    setNotes('');
    setVitalsModalVisible(true);
  };

  const handleAddVitals = async () => {
    if (!user?.patientId) {
      Alert.alert('Error', 'Your user account is not associated with a patient profile. Please contact support.');
      return;
    }
    if (!systolic && !diastolic && !bloodSugar) {
      Alert.alert('Empty Entry', 'Please enter at least one measurement (BP or Blood Sugar).');
      return;
    }
    if ((systolic && !diastolic) || (!systolic && diastolic)) {
      Alert.alert('Incomplete BP', 'Please enter both Systolic and Diastolic BP values.');
      return;
    }

    setSavingVitals(true);
    try {
      // Calculate local timezone offset for ISO 8601 format
      const localDate = new Date(`${measuredDate}T${measuredTime}:00`);
      const offsetMinutes = -localDate.getTimezoneOffset();
      const sign = offsetMinutes >= 0 ? '+' : '-';
      const absMinutes = Math.abs(offsetMinutes);
      const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
      const minutes = String(absMinutes % 60).padStart(2, '0');
      const measuredAt = `${measuredDate}T${measuredTime}:00${sign}${hours}:${minutes}`;

      const payload = {
        systolicBp: systolic ? parseInt(systolic, 10) : null,
        diastolicBp: diastolic ? parseInt(diastolic, 10) : null,
        bloodSugar: bloodSugar ? parseFloat(bloodSugar) : null,
        measuredAt: measuredAt,
        notes: notes.trim() || null
      };

      await patientHealthLogApi.addHealthLog(user.patientId, payload);
      Alert.alert('Success', 'Health vitals recorded successfully!');
      setVitalsModalVisible(false);
      fetchVitals();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to record health vitals.');
    } finally {
      setSavingVitals(false);
    }
  };

  const handleDeleteVital = (id) => {
    Alert.alert('Delete Record', 'Are you sure you want to remove this log entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await patientHealthLogApi.deleteHealthLog(user.patientId, id);
          setVitals(prev => prev.filter(v => v.id !== id));
        } catch (ex) { Alert.alert('Error', ex.message); }
      }}
    ]);
  };

  // Compile Chart data
  const getChartData = () => {
    // Sort chronological: oldest first for line progression
    const sorted = [...vitals]
      .filter(v => vitalsTab === 'bp' ? (v.systolicBp && v.diastolicBp) : v.bloodSugar)
      .slice(0, 6)
      .reverse();

    if (sorted.length === 0) return null;

    const labels = sorted.map(v => {
      const d = new Date(v.measuredAt);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    if (vitalsTab === 'bp') {
      return {
        labels,
        datasets: [
          {
            data: sorted.map(v => v.systolicBp),
            color: (opacity = 1) => `rgba(244, 63, 94, ${opacity})`, // accent/rose for systolic
            strokeWidth: 2
          },
          {
            data: sorted.map(v => v.diastolicBp),
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // blue for diastolic
            strokeWidth: 2
          }
        ],
        legend: ['Systolic', 'Diastolic']
      };
    } else {
      return {
        labels,
        datasets: [
          {
            data: sorted.map(v => Number(v.bloodSugar)),
            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // green for sugar
            strokeWidth: 2
          }
        ],
        legend: ['Blood Sugar']
      };
    }
  };

  const chartData = getChartData();

  return (
    <View style={styles.container}>
      {/* Curved Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerLogout} 
          onPress={() => confirmAndLogout(logout)} 
          activeOpacity={0.7}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={{ fontSize: 16 }}>🚪</Text>
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
        </View>
        <Text style={styles.greeting}>{user?.name || 'Patient'}</Text>
        <Text style={styles.role}>Patient Portal</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Username / Email</Text>
          <Text style={styles.infoValue}>{user?.username || '-'}</Text>
        </View>

        {/* BP & Diabetes Tracker Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>BP & Diabetes Tracker</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openVitalsModal} activeOpacity={0.7}>
            <Text style={styles.addBtnText}>+ Log Vitals</Text>
          </TouchableOpacity>
        </View>

        {/* Vitals Charts Card */}
        <View style={styles.vitalsCard}>
          <View style={styles.vitalsHeader}>
            <Text style={styles.vitalsTitle}>🩺 Logs & Analytics</Text>
            <View style={styles.chartSelector}>
              <TouchableOpacity
                style={[styles.selectorTab, vitalsTab === 'bp' && styles.selectorTabActive]}
                onPress={() => setVitalsTab('bp')}
              >
                <Text style={[styles.selectorTabText, vitalsTab === 'bp' && styles.selectorTabTextActive]}>BP</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectorTab, vitalsTab === 'sugar' && styles.selectorTabActive]}
                onPress={() => setVitalsTab('sugar')}
              >
                <Text style={[styles.selectorTabText, vitalsTab === 'sugar' && styles.selectorTabTextActive]}>Sugar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loadingVitals ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 40 }} />
          ) : chartData ? (
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <LineChart
                data={chartData}
                width={width - 48}
                height={170}
                chartConfig={{
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(74, 91, 114, ${opacity})`,
                  propsForBackgroundLines: { stroke: '#F1F5F9', strokeWidth: 1 },
                  propsForLabels: { fontSize: 9, fontWeight: '600' }
                }}
                bezier
                style={{ borderRadius: borderRadius.md }}
              />
              <View style={styles.chartLegend}>
                {vitalsTab === 'bp' ? (
                  <>
                    <View style={styles.legendDotItem}><View style={[styles.legendDot, { backgroundColor: '#F43F5E' }]} /><Text style={styles.legendDotText}>Systolic</Text></View>
                    <View style={styles.legendDotItem}><View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} /><Text style={styles.legendDotText}>Diastolic</Text></View>
                  </>
                ) : (
                  <View style={styles.legendDotItem}><View style={[styles.legendDot, { backgroundColor: '#10B981' }]} /><Text style={styles.legendDotText}>Blood Sugar (mg/dL)</Text></View>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No records logged yet for this category.</Text>
            </View>
          )}

          {/* Vitals History List */}
          <Text style={styles.historyTitle}>Recent Readings</Text>
          {vitals.length === 0 ? (
            <Text style={styles.emptyHistory}>No logged readings found.</Text>
          ) : (
            vitals.slice(0, 5).map((v) => {
              const d = new Date(v.measuredAt);
              const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <View key={v.id} style={styles.vitalRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vitalTimeLabel}>{dateStr}</Text>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                      {v.systolicBp ? (
                        <Text style={styles.vitalValText}>🩸 BP: <Text style={{ fontWeight: '800' }}>{v.systolicBp}/{v.diastolicBp}</Text> mmHg</Text>
                      ) : null}
                      {v.bloodSugar ? (
                        <Text style={styles.vitalValText}>🍬 Sugar: <Text style={{ fontWeight: '800' }}>{Number(v.bloodSugar).toFixed(1)}</Text> mg/dL</Text>
                      ) : null}
                    </View>
                    {v.notes ? <Text style={styles.vitalNotesText}>Notes: {v.notes}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteVital(v.id)} style={styles.vitalDeleteBtn}>
                    <Text style={{ fontSize: 14 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Medication Adherence Dashboard */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medication Adherence</Text>
        </View>
        <View style={styles.adherenceCard}>
          {upcomingMeds.length === 0 ? (
            <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 }}>
              No medications prescribed yet
            </Text>
          ) : (
            upcomingMeds.map((med, i) => {
              const today = new Date().toISOString().split('T')[0];
              const takenToday = med.lastTakenAt && med.lastTakenAt.split('T')[0] === today;
              return (
                <View key={i} style={styles.adherenceRow}>
                  <View style={[styles.adherenceDot, takenToday ? styles.adherenceTaken : styles.adherenceMissed]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.adherenceMedName}>{med.medicineName} ({med.dosage})</Text>
                    <Text style={styles.adherenceTime}>{med.timingCategory} - {med.relationToMeal === 'BEFORE_MEAL' ? 'Before meal' : 'After meal'}</Text>
                  </View>
                  <Text style={[styles.adherenceStatus, takenToday ? { color: colors.success } : { color: colors.error }]}>
                    {takenToday ? '✓ Taken' : '✗ Missed'}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Family Members Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Family Members</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setFamilyModalVisible(true)} activeOpacity={0.7}>
            <Text style={styles.addBtnText}>+ Add Member</Text>
          </TouchableOpacity>
        </View>

        {familyMembers.length === 0 ? (
          <View style={[styles.infoCard, { alignItems: 'center', paddingVertical: 20 }]}>
            <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic' }}>No family members added yet</Text>
          </View>
        ) : (
          familyMembers.map((m) => (
            <View key={m.id} style={styles.infoCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{m.name} ({m.relationship})</Text>
                <TouchableOpacity onPress={() => handleDeleteMember(m.id)}>
                  <Text style={{ color: colors.error, fontSize: 13 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>Age: {m.age || '-'} | Gender: {m.gender || '-'}</Text>
              {m.medicalHistory ? (
                <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 }}>Notes: {m.medicalHistory}</Text>
              ) : null}
            </View>
          ))
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={() => confirmAndLogout(logout)} activeOpacity={0.85}>
          <Text style={styles.logoutBtnText}>Sign Out from Portal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Family Member Modal */}
      <Modal animationType="slide" transparent={true} visible={familyModalVisible} onRequestClose={() => setFamilyModalVisible(false)}>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Family Member</Text>

              <Text style={styles.fieldLabel}>Name *</Text>
              <TextInput style={styles.modalInput} value={famName} onChangeText={setFamName} placeholder="Name" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>Relationship</Text>
              <View style={styles.selectorRow}>
                {['Spouse', 'Child', 'Parent', 'Sibling', 'Other'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.selectorBtn, famRelationship === r && styles.selectorBtnActive]}
                    onPress={() => setFamRelationship(r)}
                  >
                    <Text style={[styles.selectorBtnText, famRelationship === r && styles.selectorBtnTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Age</Text>
              <TextInput style={styles.modalInput} value={famAge} keyboardType="numeric" onChangeText={setFamAge} placeholder="Age" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.selectorRow}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.selectorBtn, famGender === g && styles.selectorBtnActive]}
                    onPress={() => setFamGender(g)}
                  >
                    <Text style={[styles.selectorBtnText, famGender === g && styles.selectorBtnTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput style={styles.modalInput} value={famPhone} keyboardType="phone-pad" onChangeText={setFamPhone} placeholder="Phone number" placeholderTextColor={colors.textMuted} />

              <Text style={styles.fieldLabel}>Medical History / Notes</Text>
              <TextInput style={[styles.modalInput, { minHeight: 60 }]} value={famHistory} onChangeText={setFamHistory} placeholder="e.g. Diabetes, Hypertension, allergies..." placeholderTextColor={colors.textMuted} multiline />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setFamilyModalVisible(false)}>
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={handleAddFamilyMember} disabled={savingFamily}>
                  {savingFamily ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveModalBtnText}>Add</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Log Vitals Modal */}
      <Modal animationType="slide" transparent={true} visible={vitalsModalVisible} onRequestClose={() => setVitalsModalVisible(false)}>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Log BP & Sugar Vitals</Text>

              <Text style={styles.fieldLabel}>Date * (Calendar selection)</Text>
              <TouchableOpacity
                style={styles.modalInput}
                onPress={() => setDatePickerVisible(true)}
              >
                <Text style={{ color: colors.text }}>{measuredDate || 'Select Date'}</Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Time * (Time selection)</Text>
              <TouchableOpacity
                style={styles.modalInput}
                onPress={() => setTimePickerVisible(true)}
              >
                <Text style={{ color: colors.text }}>{measuredTime || 'Select Time'}</Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Blood Pressure (mmHg)</Text>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  value={systolic}
                  keyboardType="numeric"
                  onChangeText={setSystolic}
                  placeholder="Systolic (e.g. 120)"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={{ fontSize: 18, color: colors.textSecondary }}>/</Text>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  value={diastolic}
                  keyboardType="numeric"
                  onChangeText={setDiastolic}
                  placeholder="Diastolic (e.g. 80)"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Text style={styles.fieldLabel}>Blood Sugar (mg/dL)</Text>
              <TextInput
                style={styles.modalInput}
                value={bloodSugar}
                keyboardType="numeric"
                onChangeText={setBloodSugar}
                placeholder="Glucose level (e.g. 110)"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Notes / Context</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 60 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. After breakfast, feeling dizzy..."
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setVitalsModalVisible(false)}>
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={handleAddVitals} disabled={savingVitals}>
                  {savingVitals ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveModalBtnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Date Picker Component */}
      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={setMeasuredDate}
        value={measuredDate}
      />

      {/* Time Picker Component */}
      <TimePickerModal
        visible={timePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        onSelect={setMeasuredTime}
        value={measuredTime}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF20', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  role: { fontSize: 13, color: '#FFFFFFAA', marginTop: 4 },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16, marginBottom: 12,
    ...shadows.sm, borderWidth: 1, borderColor: colors.borderLight,
  },
  infoLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  adherenceCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  adherenceRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  adherenceDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  adherenceTaken: { backgroundColor: colors.success },
  adherenceMissed: { backgroundColor: colors.error },
  adherenceMedName: { fontSize: 13, fontWeight: '700', color: colors.text, flex: 1 },
  adherenceTime: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  adherenceStatus: { fontSize: 12, fontWeight: '800' },
  headerLogout: { position: 'absolute', top: 52, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF15', justifyContent: 'center', alignItems: 'center' },
  logoutBtn: {
    backgroundColor: colors.error, borderRadius: borderRadius.md, paddingVertical: 14,
    alignItems: 'center', marginTop: 24, ...shadows.md,
  },
  logoutBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  addBtn: { backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { fontSize: 12, fontWeight: '750', color: colors.primary },

  // Vitals Card styles
  vitalsCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16, marginBottom: 12,
    ...shadows.sm, borderWidth: 1, borderColor: colors.borderLight,
  },
  vitalsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vitalsTitle: { fontSize: 14, fontWeight: '750', color: colors.textSecondary },
  chartSelector: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: 8, padding: 2 },
  selectorTab: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  selectorTabActive: { backgroundColor: colors.surface, ...shadows.sm },
  selectorTabText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  selectorTabTextActive: { color: colors.primary, fontWeight: '850' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legendDotItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDotText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
  emptyChart: { height: 140, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, borderRadius: borderRadius.md, marginTop: 12 },
  emptyChartText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  historyTitle: { fontSize: 12, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  emptyHistory: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', paddingVertical: 10, textAlign: 'center' },
  vitalRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: borderRadius.md,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.borderLight
  },
  vitalTimeLabel: { fontSize: 11, fontWeight: '750', color: colors.textMuted },
  vitalValText: { fontSize: 13, color: colors.textSecondary },
  vitalNotesText: { fontSize: 11, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  vitalDeleteBtn: { padding: 8, marginLeft: 8 },

  // Modal Styles
  modalBg: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(11, 26, 43, 0.5)', padding: 16 },
  modalScroll: { flexGrow: 1, justifyContent: 'center', width: '100%' },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 20,
    width: '100%',
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12, textAlign: 'center' },
  fieldLabel: { fontSize: 11, fontWeight: '750', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 10 },
  modalInput: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center'
  },
  selectorRow: { flexDirection: 'row', gap: 6, marginVertical: 4, flexWrap: 'wrap' },
  selectorBtn: { flex: 1, minWidth: '22%', paddingVertical: 8, borderRadius: borderRadius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  selectorBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  selectorBtnText: { fontSize: 11, fontWeight: '750', color: colors.textSecondary },
  selectorBtnTextActive: { color: '#FFFFFF' },
  modalButtonRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelModalBtn: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelModalBtnText: { fontSize: 13, fontWeight: '750', color: colors.textSecondary },
  saveModalBtn: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center' },
  saveModalBtnText: { fontSize: 13, fontWeight: '750', color: '#FFFFFF' }
});
