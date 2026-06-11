import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput, FlatList, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { patientMedicationApi } from '../api/patientMedicationApi';
import { doctorApi } from '../api/doctorApi';
import { colors, borderRadius, shadows, typography } from '../theme';
import { TimePickerModal } from '../components/DateTimePickerModal';
import * as ImagePicker from 'expo-image-picker';

// Time formatting helpers
const formatTo12Hour = (militaryTime) => {
  if (!militaryTime) return '';
  const [hStr, mStr] = militaryTime.split(':');
  let hr = parseInt(hStr, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  hr = hr % 12;
  if (hr === 0) hr = 12;
  return `${String(hr).padStart(2, '0')}:${mStr} ${ampm}`;
};

const formatToMilitary = (time12h) => {
  if (!time12h) return '09:00';
  const parts = time12h.trim().split(/\s+/);
  const time = parts[0];
  const ampm = parts[1] ? parts[1].toUpperCase() : 'AM';
  const [hStr, mStr] = time.split(':');
  let hr = parseInt(hStr, 10);
  if (ampm === 'PM' && hr < 12) hr += 12;
  if (ampm === 'AM' && hr === 12) hr = 0;
  return `${String(hr).padStart(2, '0')}:${mStr || '00'}`;
};

export default function PatientMedicationScreen() {
  const [medications, setMedications] = useState([]);
  const [mealTimings, setMealTimings] = useState({
    breakfastTime: '08:00 AM',
    lunchTime: '01:30 PM',
    dinnerTime: '08:30 PM'
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals visibility
  const [timingModalVisible, setTimingModalVisible] = useState(false);
  const [medModalVisible, setMedModalVisible] = useState(false);
  const [refillModalVisible, setRefillModalVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  // Time picker targets
  const [timePickerTarget, setTimePickerTarget] = useState(''); // 'breakfast', 'lunch', 'dinner'

  // Doctors selection
  const [activeDoctors, setActiveDoctors] = useState([]);
  const [medDoctorName, setMedDoctorName] = useState('');

  // Form states
  const [editBreakfast, setEditBreakfast] = useState('');
  const [editLunch, setEditLunch] = useState('');
  const [editDinner, setEditDinner] = useState('');

  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('1 tablet');
  const [medCategory, setMedCategory] = useState('BREAKFAST'); // BREAKFAST, LUNCH, DINNER
  const [medRelation, setMedRelation] = useState('AFTER_MEAL'); // BEFORE_MEAL, AFTER_MEAL
  const [medInstruction, setMedInstruction] = useState('Take with water');
  const [medQuantity, setMedQuantity] = useState('10');

  const [selectedMedId, setSelectedMedId] = useState(null);
  const [refillAmount, setRefillAmount] = useState('10');

  // Upload Prescription states
  const [rxModalVisible, setRxModalVisible] = useState(false);
  const [rxImage, setRxImage] = useState(null);
  const [rxMedicineName, setRxMedicineName] = useState('');
  const [rxDosage, setRxDosage] = useState('1 tablet');
  const [rxCategory, setRxCategory] = useState('BREAKFAST');
  const [rxRelation, setRxRelation] = useState('AFTER_MEAL');
  const [rxInstruction, setRxInstruction] = useState('Take with water');
  const [rxQuantity, setRxQuantity] = useState('10');
  const [rxDoctor, setRxDoctor] = useState('');
  const [rxMedsList, setRxMedsList] = useState([]);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [timingsData, medsData] = await Promise.all([
        patientMedicationApi.getMealTimings().catch(() => null),
        patientMedicationApi.getMedications().catch(() => []),
      ]);
      if (timingsData) {
        setMealTimings(timingsData);
      }
      setMedications(medsData);
    } catch (err) {
      console.log('Error fetching medication data', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleSaveTimings = async () => {
    if (!editBreakfast || !editLunch || !editDinner) {
      Alert.alert('Validation Error', 'All meal timings are required.');
      return;
    }
    try {
      const saved = await patientMedicationApi.saveMealTimings({
        breakfastTime: editBreakfast,
        lunchTime: editLunch,
        dinnerTime: editDinner
      });
      setMealTimings(saved);
      setTimingModalVisible(false);
      Alert.alert('Success', 'Meal timings updated.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save meal timings.');
    }
  };

  const openUploadPrescription = async () => {
    try {
      const docs = await doctorApi.getActive().catch(() => []);
      setActiveDoctors(docs);
    } catch (e) {}
    setRxImage(null);
    setRxMedicineName('');
    setRxDosage('1 tablet');
    setRxCategory('BREAKFAST');
    setRxRelation('AFTER_MEAL');
    setRxInstruction('Take with water');
    setRxQuantity('10');
    setRxDoctor('');
    setRxMedsList([]);
    setRxModalVisible(true);
  };

  const pickRxImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setRxImage(result.assets[0].uri);
    }
  };

  const takeRxPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a photo');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setRxImage(result.assets[0].uri);
    }
  };

  const addRxMedicine = () => {
    if (!rxMedicineName.trim()) {
      Alert.alert('Required', 'Please enter medicine name from the prescription.');
      return;
    }
    const qty = parseInt(rxQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Invalid', 'Quantity must be a positive number.');
      return;
    }
    setRxMedsList([...rxMedsList, {
      id: Date.now().toString(),
      medicineName: rxMedicineName.trim(),
      dosage: rxDosage.trim(),
      timingCategory: rxCategory,
      relationToMeal: rxRelation,
      specialInstruction: rxInstruction.trim(),
      quantity: qty,
      doctorName: rxDoctor || null,
    }]);
    setRxMedicineName('');
    setRxDosage('1 tablet');
    setRxInstruction('Take with water');
    setRxQuantity('10');
  };

  const removeRxMedicine = (id) => {
    setRxMedsList(rxMedsList.filter(m => m.id !== id));
  };

  const saveRxMedicines = async () => {
    if (rxMedsList.length === 0) {
      Alert.alert('Empty', 'Please add at least one medicine from the prescription.');
      return;
    }
    try {
      for (const med of rxMedsList) {
        await patientMedicationApi.addMedication({
          medicineName: med.medicineName,
          quantity: med.quantity,
          dosage: med.dosage,
          timingCategory: med.timingCategory,
          relationToMeal: med.relationToMeal,
          specialInstruction: med.specialInstruction,
          doctorName: med.doctorName,
        });
      }
      Alert.alert(
        '✅ Prescription Added',
        `${rxMedsList.length} medicine${rxMedsList.length > 1 ? 's' : ''} added successfully from the uploaded prescription.\n\nMedicines are now in your daily schedule with reminders.`,
        [{ text: 'OK' }]
      );
      setRxModalVisible(false);
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add medicines from prescription.');
    }
  };

  const openTimingModal = () => {
    setEditBreakfast(mealTimings.breakfastTime);
    setEditLunch(mealTimings.lunchTime);
    setEditDinner(mealTimings.dinnerTime);
    setTimingModalVisible(true);
  };

  const openAddMedModal = async () => {
    try {
      const docs = await doctorApi.getActive().catch(() => []);
      setActiveDoctors(docs);
    } catch (e) {}
    setMedModalVisible(true);
  };

  const handleAddMedication = async () => {
    if (!medName.trim()) {
      Alert.alert('Validation Error', 'Medicine Name is required.');
      return;
    }
    const qty = parseInt(medQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Validation Error', 'Stock quantity must be a non-negative number.');
      return;
    }

    try {
      const added = await patientMedicationApi.addMedication({
        medicineName: medName.trim(),
        quantity: qty,
        dosage: medDosage.trim(),
        timingCategory: medCategory,
        relationToMeal: medRelation,
        specialInstruction: medInstruction.trim(),
        doctorName: medDoctorName || null
      });
      setMedications([...medications, added]);
      setMedModalVisible(false);
      // Reset form
      setMedName('');
      setMedDosage('1 tablet');
      setMedCategory('BREAKFAST');
      setMedRelation('AFTER_MEAL');
      setMedInstruction('Take with water');
      setMedQuantity('10');
      setMedDoctorName('');
      Alert.alert('Success', 'Medication added successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to add medication.');
    }
  };

  const handleConfirmIntake = async (id, name) => {
    try {
      const res = await patientMedicationApi.confirmIntake(id);
      
      // Update local state
      setMedications(prev => prev.map(m => m.id === id ? { ...m, quantity: res.newQuantity } : m));

      if (res.warning) {
        Alert.alert('Refill Reminder', res.warning, [{ text: 'OK' }]);
      } else {
        Alert.alert('Intake Logged', `Intake of ${name} confirmed successfully!`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to log intake.');
    }
  };

  const handleAddStock = async () => {
    const amount = parseInt(refillAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Refill amount must be a positive number.');
      return;
    }
    try {
      const updated = await patientMedicationApi.addStock(selectedMedId, amount);
      setMedications(prev => prev.map(m => m.id === selectedMedId ? updated : m));
      setRefillModalVisible(false);
      Alert.alert('Success', 'Medicine stock updated.');
    } catch (err) {
      Alert.alert('Error', 'Failed to update stock.');
    }
  };

  const handleDeleteMed = async (id, name) => {
    Alert.alert('Delete Medication', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await patientMedicationApi.deleteMedication(id);
            setMedications(prev => prev.filter(m => m.id !== id));
            Alert.alert('Success', `${name} deleted.`);
          } catch (err) {
            Alert.alert('Error', 'Failed to delete medication.');
          }
        }
      }
    ]);
  };

  const renderMealCategoryHeader = (title, timeStr, color) => {
    return (
      <View style={styles.categoryHeader}>
        <View style={styles.categoryHeaderLeft}>
          <View style={[styles.timeDot, { backgroundColor: color }]} />
          <Text style={styles.categoryTitle}>{title}</Text>
        </View>
        <Text style={styles.categoryTime}>🕒 {timeStr}</Text>
      </View>
    );
  };

  const filterMeds = (category) => medications.filter(m => m.timingCategory === category);

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {/* Meal Timings Dashboard */}
        <View style={styles.timingsCard}>
          <View style={styles.timingsCardHeader}>
            <Text style={styles.timingsCardTitle}>🍽️ My Daily Meal Timings</Text>
            <TouchableOpacity style={styles.editBtn} onPress={openTimingModal} activeOpacity={0.7}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.timingsGrid}>
            <View style={styles.timingPill}>
              <Text style={styles.timingPillLabel}>🌅 Breakfast</Text>
              <Text style={styles.timingPillVal}>{mealTimings.breakfastTime}</Text>
            </View>
            <View style={styles.timingPill}>
              <Text style={styles.timingPillLabel}>☀️ Lunch</Text>
              <Text style={styles.timingPillVal}>{mealTimings.lunchTime}</Text>
            </View>
            <View style={styles.timingPill}>
              <Text style={styles.timingPillLabel}>🌙 Dinner</Text>
              <Text style={styles.timingPillVal}>{mealTimings.dinnerTime}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Checklist & Reminders</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity style={styles.addMedBtn} onPress={openAddMedModal} activeOpacity={0.7}>
              <Text style={styles.addMedBtnText}>+ Add Med</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addMedBtn, { backgroundColor: colors.info + '15', borderColor: colors.info + '30' }]} onPress={openUploadPrescription} activeOpacity={0.7}>
              <Text style={[styles.addMedBtnText, { color: colors.info }]}>📄 Upload Rx</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories Lists */}
        {['BREAKFAST', 'LUNCH', 'DINNER'].map((cat) => {
          const categoryMeds = filterMeds(cat);
          const colorMap = {
            BREAKFAST: colors.primary,
            LUNCH: colors.info,
            DINNER: colors.accent
          };
          const timeMap = {
            BREAKFAST: mealTimings.breakfastTime,
            LUNCH: mealTimings.lunchTime,
            DINNER: mealTimings.dinnerTime
          };

          return (
            <View key={cat} style={styles.categorySection}>
              {renderMealCategoryHeader(cat, timeMap[cat], colorMap[cat])}
              {categoryMeds.length === 0 ? (
                <View style={styles.emptyCatCard}>
                  <Text style={styles.emptyCatText}>No medications scheduled for {cat.toLowerCase()}</Text>
                </View>
              ) : (
                categoryMeds.map((med) => (
                  <View key={med.id} style={styles.medCard}>
                    <View style={styles.medCardLeft}>
                      <View style={styles.medNameRow}>
                        <Text style={styles.medName}>{med.medicineName}</Text>
                        <View style={[styles.relationBadge, { backgroundColor: med.relationToMeal === 'BEFORE_MEAL' ? '#EFF6FF' : '#ECFDF5' }]}>
                          <Text style={[styles.relationText, { color: med.relationToMeal === 'BEFORE_MEAL' ? colors.info : colors.success }]}>
                            {med.relationToMeal === 'BEFORE_MEAL' ? 'Before meal' : 'After meal'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.medDetail}>Dosage: {med.dosage}</Text>
                      {med.doctorName ? (
                        <Text style={[styles.medDetail, { marginTop: 2, color: colors.primary, fontWeight: '750' }]}>Prescribed by: Dr. {med.doctorName}</Text>
                      ) : null}
                      {med.specialInstruction ? (
                        <Text style={styles.medInstruction}>💡 {med.specialInstruction}</Text>
                      ) : null}
                      
                      {/* Stock indicator */}
                      <View style={styles.stockRow}>
                        <Text style={[styles.stockLabel, med.quantity < 3 ? styles.stockWarningText : null]}>
                          Stock: {med.quantity} tabs
                        </Text>
                        {med.quantity < 3 && (
                          <Text style={styles.lowStockWarning}>⚠️ Low stock!</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.medCardActions}>
                      <TouchableOpacity
                        style={[styles.actionConfirmBtn, med.quantity === 0 && styles.disabledBtn]}
                        disabled={med.quantity === 0}
                        onPress={() => handleConfirmIntake(med.id, med.medicineName)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.actionConfirmText}>✓ Taken</Text>
                      </TouchableOpacity>
                      <View style={styles.medCardLowerRow}>
                        <TouchableOpacity
                          style={styles.actionRefillBtn}
                          onPress={() => {
                            setSelectedMedId(med.id);
                            setRefillAmount('10');
                            setRefillModalVisible(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.actionRefillText}>Refill</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionDeleteBtn}
                          onPress={() => handleDeleteMed(med.id, med.medicineName)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.actionDeleteText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Edit Timings Modal */}
      <Modal animationType="slide" transparent={true} visible={timingModalVisible} onRequestClose={() => setTimingModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Daily Meal Timings</Text>
            <Text style={styles.modalSub}>First-time settings or scheduling adjustments:</Text>
            
            <Text style={styles.inputLabel}>Breakfast Time</Text>
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => {
                setTimePickerTarget('breakfast');
                setTimePickerVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.text }}>{editBreakfast || 'Select Breakfast Time'}</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Lunch Time</Text>
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => {
                setTimePickerTarget('lunch');
                setTimePickerVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.text }}>{editLunch || 'Select Lunch Time'}</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Dinner Time</Text>
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => {
                setTimePickerTarget('dinner');
                setTimePickerVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.text }}>{editDinner || 'Select Dinner Time'}</Text>
            </TouchableOpacity>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setTimingModalVisible(false)}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveTimings}>
                <Text style={styles.saveModalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Medication Modal */}
      <Modal animationType="slide" transparent={true} visible={medModalVisible} onRequestClose={() => setMedModalVisible(false)}>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Medication</Text>

              <Text style={styles.inputLabel}>Medicine Name *</Text>
              <TextInput style={styles.modalInput} value={medName} onChangeText={setMedName} placeholder="e.g. Paracetamol" placeholderTextColor={colors.textMuted} />

              <Text style={styles.inputLabel}>Dosage</Text>
              <TextInput style={styles.modalInput} value={medDosage} onChangeText={setMedDosage} placeholder="e.g. 1 tablet / 5ml" placeholderTextColor={colors.textMuted} />

              <Text style={styles.inputLabel}>Scheduled Timing</Text>
              <View style={styles.selectorRow}>
                {['BREAKFAST', 'LUNCH', 'DINNER'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.selectorBtn, medCategory === t && styles.selectorBtnActive]}
                    onPress={() => setMedCategory(t)}
                  >
                    <Text style={[styles.selectorBtnText, medCategory === t && styles.selectorBtnTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Relation to Meal</Text>
              <View style={styles.selectorRow}>
                {['BEFORE_MEAL', 'AFTER_MEAL'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.selectorBtn, medRelation === r && styles.selectorBtnActive]}
                    onPress={() => setMedRelation(r)}
                  >
                    <Text style={[styles.selectorBtnText, medRelation === r && styles.selectorBtnTextActive]}>
                      {r === 'BEFORE_MEAL' ? 'Before Meal' : 'After Meal'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Special Instructions</Text>
              <TextInput style={styles.modalInput} value={medInstruction} onChangeText={setMedInstruction} placeholder="e.g. Take with warm water / milk" placeholderTextColor={colors.textMuted} />

              <Text style={styles.inputLabel}>Current Stock Quantity (tablets)</Text>
              <TextInput style={styles.modalInput} value={medQuantity} keyboardType="numeric" onChangeText={setMedQuantity} placeholder="e.g. 15" placeholderTextColor={colors.textMuted} />

              <Text style={styles.inputLabel}>Prescribing Doctor</Text>
              {activeDoctors.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  <TouchableOpacity
                    style={[
                      styles.selectorBtn,
                      { paddingHorizontal: 12, minWidth: 90, flex: 0 },
                      medDoctorName === '' && styles.selectorBtnActive
                    ]}
                    onPress={() => setMedDoctorName('')}
                  >
                    <Text style={[styles.selectorBtnText, medDoctorName === '' && styles.selectorBtnTextActive]}>
                      None
                    </Text>
                  </TouchableOpacity>
                  {activeDoctors.map((doc) => {
                    const isSelected = medDoctorName === doc.name;
                    return (
                      <TouchableOpacity
                        key={doc.id}
                        style={[
                          styles.selectorBtn,
                          { paddingHorizontal: 12, minWidth: 90, flex: 0 },
                          isSelected && styles.selectorBtnActive
                        ]}
                        onPress={() => setMedDoctorName(doc.name)}
                      >
                        <Text style={[styles.selectorBtnText, isSelected && styles.selectorBtnTextActive]}>
                          Dr. {doc.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic' }}>No active doctors found</Text>
              )}

              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setMedModalVisible(false)}>
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={handleAddMedication}>
                  <Text style={styles.saveModalBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Refill Stock Modal */}
      <Modal animationType="slide" transparent={true} visible={refillModalVisible} onRequestClose={() => setRefillModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Refill Medication Stock</Text>
            <Text style={styles.modalSub}>Enter the amount of stock you brought/purchased:</Text>

            <Text style={styles.inputLabel}>Tablets to Add</Text>
            <TextInput
              style={styles.modalInput}
              value={refillAmount}
              keyboardType="numeric"
              onChangeText={setRefillAmount}
              placeholder="e.g. 10"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setRefillModalVisible(false)}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={handleAddStock}>
                <Text style={styles.saveModalBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upload Prescription Modal */}
      <Modal animationType="slide" transparent={true} visible={rxModalVisible} onRequestClose={() => setRxModalVisible(false)}>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>📄 Upload Prescription</Text>
              <Text style={styles.modalSub}>Take a photo or upload a prescription image, then add medicines from it.</Text>

              {rxImage ? (
                <View style={{ marginBottom: 12 }}>
                  <Image source={{ uri: rxImage }} style={{ width: '100%', height: 150, borderRadius: 8, resizeMode: 'contain', backgroundColor: colors.bg }} />
                  <TouchableOpacity onPress={() => setRxImage(null)} style={{ paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, color: colors.error, fontWeight: '700' }}>✕ Remove photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  <TouchableOpacity style={[styles.uploadImageBtn, { flex: 1 }]} onPress={takeRxPhoto}>
                    <Text style={styles.uploadImageIcon}>📷</Text>
                    <Text style={styles.uploadImageText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.uploadImageBtn, { flex: 1 }]} onPress={pickRxImage}>
                    <Text style={styles.uploadImageIcon}>🖼️</Text>
                    <Text style={styles.uploadImageText}>Choose from Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.rxFormSection}>
                <Text style={styles.inputLabel}>Medicine Name (from prescription) *</Text>
                <TextInput style={styles.modalInput} value={rxMedicineName} onChangeText={setRxMedicineName} placeholder="e.g. Amoxicillin 500mg" placeholderTextColor={colors.textMuted} />

                <Text style={styles.inputLabel}>Dosage</Text>
                <TextInput style={styles.modalInput} value={rxDosage} onChangeText={setRxDosage} placeholder="e.g. 1 tablet / 5ml" placeholderTextColor={colors.textMuted} />

                <View style={styles.selectorRow}>
                  {['BREAKFAST', 'LUNCH', 'DINNER'].map((t) => (
                    <TouchableOpacity key={t} style={[styles.selectorBtn, rxCategory === t && styles.selectorBtnActive]} onPress={() => setRxCategory(t)}>
                      <Text style={[styles.selectorBtnText, rxCategory === t && styles.selectorBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.selectorRow}>
                  {['BEFORE_MEAL', 'AFTER_MEAL'].map((r) => (
                    <TouchableOpacity key={r} style={[styles.selectorBtn, rxRelation === r && styles.selectorBtnActive]} onPress={() => setRxRelation(r)}>
                      <Text style={[styles.selectorBtnText, rxRelation === r && styles.selectorBtnTextActive]}>{r === 'BEFORE_MEAL' ? 'Before Meal' : 'After Meal'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.addRxMedBtn} onPress={addRxMedicine}>
                  <Text style={styles.addRxMedBtnText}>+ Add to List</Text>
                </TouchableOpacity>
              </View>

              {rxMedsList.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.rxListTitle}>Medicines from Prescription ({rxMedsList.length})</Text>
                  {rxMedsList.map((m, i) => (
                    <View key={m.id} style={styles.rxMedItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rxMedName}>{m.medicineName}</Text>
                        <Text style={styles.rxMedDetail}>{m.dosage} — {m.timingCategory} ({m.relationToMeal === 'BEFORE_MEAL' ? 'Before' : 'After'})</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeRxMedicine(m.id)}>
                        <Text style={{ color: colors.error, fontSize: 16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setRxModalVisible(false)}>
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={saveRxMedicines}>
                  <Text style={styles.saveModalBtnText}>Save All ({rxMedsList.length})</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <TimePickerModal
        visible={timePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        onSelect={(time) => {
          const time12 = formatTo12Hour(time);
          if (timePickerTarget === 'breakfast') setEditBreakfast(time12);
          else if (timePickerTarget === 'lunch') setEditLunch(time12);
          else if (timePickerTarget === 'dinner') setEditDinner(time12);
        }}
        value={
          timePickerTarget === 'breakfast' ? formatToMilitary(editBreakfast) :
          timePickerTarget === 'lunch' ? formatToMilitary(editLunch) :
          formatToMilitary(editDinner)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scrollContent: { padding: 16, paddingBottom: 60 },
  timingsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
    ...shadows.sm,
  },
  timingsCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  timingsCardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.sm, backgroundColor: colors.primary + '10' },
  editBtnText: { fontSize: 12, fontWeight: '750', color: colors.primary },
  timingsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  timingPill: { flex: 1, backgroundColor: colors.bg, padding: 10, borderRadius: borderRadius.md, alignItems: 'center' },
  timingPillLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  timingPillVal: { fontSize: 13, color: colors.text, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  addMedBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.md, ...shadows.sm },
  addMedBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '750' },
  categorySection: { marginBottom: 20 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  categoryHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeDot: { width: 8, height: 8, borderRadius: 4 },
  categoryTitle: { fontSize: 13, fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryTime: { fontSize: 11, fontWeight: '750', color: colors.textMuted },
  emptyCatCard: { backgroundColor: colors.surface, padding: 16, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center' },
  emptyCatText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  medCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
    ...shadows.sm,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  medCardLeft: { flex: 1, marginRight: 8 },
  medNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  medName: { fontSize: 15, fontWeight: '800', color: colors.text },
  relationBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  relationText: { fontSize: 9, fontWeight: '800' },
  medDetail: { fontSize: 12, color: colors.textSecondary },
  medInstruction: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  stockLabel: { fontSize: 11, fontWeight: '750', color: colors.textSecondary },
  stockWarningText: { color: colors.error },
  lowStockWarning: { fontSize: 10, fontWeight: '800', color: colors.error },
  medCardActions: { alignItems: 'flex-end', gap: 6 },
  actionConfirmBtn: { backgroundColor: colors.success, paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.sm, ...shadows.sm },
  actionConfirmText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  disabledBtn: { backgroundColor: colors.border, opacity: 0.6 },
  medCardLowerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionRefillBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.primary, backgroundColor: '#FFFFFF' },
  actionRefillText: { fontSize: 10, fontWeight: '750', color: colors.primary },
  actionDeleteBtn: { padding: 4, borderRadius: borderRadius.sm, backgroundColor: colors.errorLight, borderWidth: 1, borderColor: '#FECACA' },
  actionDeleteText: { fontSize: 10 },
  
  // Modal styles
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
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  modalSub: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },
  inputLabel: { fontSize: 11, fontWeight: '750', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 10 },
  modalInput: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorRow: { flexDirection: 'row', gap: 6, marginVertical: 4 },
  selectorBtn: { flex: 1, paddingVertical: 10, borderRadius: borderRadius.sm, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  selectorBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  selectorBtnText: { fontSize: 11, fontWeight: '750', color: colors.textSecondary },
  selectorBtnTextActive: { color: '#FFFFFF' },
  modalButtonRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelModalBtn: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelModalBtnText: { fontSize: 13, fontWeight: '750', color: colors.textSecondary },
  saveModalBtn: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center' },
  saveModalBtnText: { fontSize: 13, fontWeight: '750', color: '#FFFFFF' },
  // Upload Prescription styles
  uploadImageBtn: {
    backgroundColor: colors.bg, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border,
    paddingVertical: 20, alignItems: 'center', borderStyle: 'dashed',
  },
  uploadImageIcon: { fontSize: 28, marginBottom: 6 },
  uploadImageText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  rxFormSection: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  addRxMedBtn: {
    backgroundColor: colors.info + '15', borderRadius: borderRadius.sm, borderWidth: 1.5, borderColor: colors.info + '30',
    borderStyle: 'dashed', paddingVertical: 10, alignItems: 'center', marginTop: 12,
  },
  addRxMedBtnText: { fontSize: 13, fontWeight: '700', color: colors.info },
  rxListTitle: { fontSize: 12, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  rxMedItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg,
    borderRadius: borderRadius.sm, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: colors.borderLight,
  },
  rxMedName: { fontSize: 13, fontWeight: '700', color: colors.text },
  rxMedDetail: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
});
