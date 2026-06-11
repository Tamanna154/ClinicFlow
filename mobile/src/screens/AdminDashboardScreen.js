import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions, Platform, StatusBar,
  Modal, Share, Alert, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { adminApi } from '../api/adminApi';
import { clinicApi } from '../api/clinicApi';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { colors, borderRadius, shadows, typography } from '../theme';

const SCREEN_W = Dimensions.get('window').width - 32;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
  propsForLabels: { fontSize: 9, fontWeight: '600' },
  propsForBackgroundLines: { strokeDasharray: '', stroke: '#f1f5f9', strokeWidth: 1 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#0D9488' },
};

function StatPill({ value, label, color }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statPillValue, { color: color || colors.primary }]}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

function GridCard({ icon, label, value, color, bgColor }) {
  return (
    <View style={[styles.gridCard, bgColor ? { backgroundColor: bgColor } : null]}>
      <View style={styles.gridIconWrap}>
        <Text style={styles.gridIcon}>{icon}</Text>
      </View>
      <Text style={styles.gridValue}>{value}</Text>
      <Text style={styles.gridLabel}>{label}</Text>
    </View>
  );
}

function QuickActionBtn({ icon, label, onPress, isAdmin }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, isAdmin ? styles.actionBtnAdmin : null]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const [dashboard, setDashboard] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState(null);
  const [clinicDetails, setClinicDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [clinicForm, setClinicForm] = useState({
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    registrationNumber: '',
    workingHours: ''
  });

  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout }
    ]);
  };

  useEffect(() => {
    if (clinicDetails) {
      setClinicForm({
        name: clinicDetails.name || '',
        address: clinicDetails.address || '',
        contactNumber: clinicDetails.contactNumber || '',
        email: clinicDetails.email || '',
        registrationNumber: clinicDetails.registrationNumber || '',
        workingHours: clinicDetails.workingHours || '',
      });
      setIsEditing(false);
    } else {
      setClinicForm({
        name: '',
        address: '',
        contactNumber: '',
        email: '',
        registrationNumber: '',
        workingHours: '',
      });
      setIsEditing(true);
    }
  }, [clinicDetails]);

  const saveClinicDetails = async () => {
    if (!clinicForm.name.trim() || !clinicForm.contactNumber.trim()) {
      Alert.alert('Required Fields', 'Clinic Name and Contact Number are required.');
      return;
    }
    try {
      const payload = {
        name: clinicForm.name.trim(),
        address: clinicForm.address.trim() || null,
        contactNumber: clinicForm.contactNumber.trim(),
        email: clinicForm.email.trim() || null,
        registrationNumber: clinicForm.registrationNumber.trim() || null,
        workingHours: clinicForm.workingHours.trim() || null,
      };

      if (clinicDetails?.id) {
        const updated = await clinicApi.update(clinicDetails.id, payload);
        setClinicDetails(updated);
      } else {
        const created = await clinicApi.create(payload);
        setClinicDetails(created);
      }
      setIsEditing(false);
      Alert.alert('Success', 'Clinic details saved successfully.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save clinic details.');
    }
  };
  const { formatCurrency } = useSettings();
  const isAdmin = user?.role === 'CLINIC_ADMIN' || user?.role === 'SUPER_ADMIN';

  const fetchData = useCallback(async (isRefresh) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const [dash, trend, clinic] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getRevenueTrend().catch(() => null),
        clinicApi.getMyClinic().catch(() => null),
      ]);
      setDashboard(dash);
      if (trend) setRevenueTrend(trend);
      if (clinic) setClinicDetails(clinic);
    } catch (e) {
      console.log(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const shareDigitalCard = async () => {
    if (!clinicDetails) return;
    try {
      const shareMsg = `🏥 ${clinicDetails.name}\n📍 Address: ${clinicDetails.address || ''}, ${clinicDetails.city || ''}\n📞 Phone: ${clinicDetails.contactNumber || ''}\n✉️ Email: ${clinicDetails.email || ''}\n🩺 Specialty: ${clinicDetails.specialization || 'General Clinic'}`;
      await Share.share({ message: shareMsg });
    } catch (error) {
      console.log(error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const newAppts = dashboard?.todayAppointments ?? 0;
  const oldAppts = Math.max(0, (dashboard?.completedAppointments ?? 0) - newAppts);
  const quickStats = dashboard ? [
    { value: newAppts, label: 'New Appts', color: colors.primary },
    { value: oldAppts, label: 'Old Appts', color: colors.info },
    { value: dashboard.pendingAppointments ?? 0, label: 'Pending', color: colors.warning },
    { value: dashboard.totalPatients ?? 0, label: 'Patients', color: colors.success },
    { value: dashboard.totalDoctors ?? 0, label: 'Doctors', color: colors.accent },
  ] : [];

  const gridCards = dashboard ? [
    { icon: '💰', label: "Total Revenue", value: formatCurrency(dashboard.totalRevenue ?? 0), color: colors.success },
    { icon: '📊', label: 'Monthly Revenue', value: formatCurrency(dashboard.monthlyRevenue ?? 0), color: colors.primary },
    { icon: '💸', label: 'Monthly Expenses', value: formatCurrency(dashboard.monthlyExpenses ?? 0), color: colors.error },
    { icon: '📈', label: 'Net Profit', value: formatCurrency(dashboard.netProfit ?? 0), color: (dashboard.netProfit ?? 0) >= 0 ? colors.success : colors.error },
    { icon: '📅', label: "Today's Appointments", value: dashboard.todayAppointments ?? 0, color: colors.primary },
    { icon: '📋', label: 'Pending Follow-Ups', value: dashboard.pendingFollowUps ?? 0, color: colors.info, bgColor: colors.infoLight },
    { icon: '🚨', label: 'Expiring Items', value: dashboard.expiringItems ?? 0, color: colors.error, bgColor: colors.errorLight },
    { icon: '🧾', label: 'Pending Bills', value: dashboard.pendingBills ?? 0, color: colors.warning, bgColor: colors.warningLight },
  ] : [];

  const quickActions = [
    { icon: '👥', label: 'Staff Overview', screen: 'Staff', tab: 'Staff', admin: true },
    { icon: '🩺', label: 'Add Doctor', screen: 'DoctorForm', tab: null, admin: true },
    { icon: '📋', label: 'Patient History', screen: 'PatientHistory', tab: null, admin: true },
    { icon: '🔑', label: 'Login Credentials', screen: 'CredentialReport', tab: null, admin: true },
    { icon: '📇', label: 'Digital brochure Card', screen: 'SHOW_CARD', tab: null, admin: true },
  ];

  // Income category splits
  const incomeData = dashboard ? {
    labels: ['Doctors', 'Lab', 'Medicals', 'Patients', 'Other'],
    datasets: [{
      data: [
        Number(dashboard.incomeDoctors ?? 0),
        Number(dashboard.incomeLab ?? 0),
        Number(dashboard.incomeMedicals ?? 0),
        Number(dashboard.incomePatients ?? 0),
        Number(dashboard.incomeOther ?? 0)
      ]
    }]
  } : null;

  // Expense category splits
  const expenseData = dashboard ? {
    labels: ['Rent', 'Light Bill', 'Maint.', 'Other'],
    datasets: [{
      data: [
        Number(dashboard.expenseRent ?? 0),
        Number(dashboard.expenseLightBill ?? 0),
        Number(dashboard.expenseMaintenance ?? 0),
        Number(dashboard.expenseOther ?? 0)
      ]
    }]
  } : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>Hello,</Text>
                <Text style={styles.adminName}>{user?.name || 'Admin'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                style={styles.bellBtn} 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('ClinicSetup')}
                hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
              >
                <Text style={styles.bellIcon}>⚙️</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.bellBtn} 
                activeOpacity={0.7} 
                onPress={handleLogout}
                hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
              >
                <Text style={styles.bellIcon}>🚪</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerSub}>Clinic overview at a glance</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {!dashboard ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>📡</Text>
            <Text style={styles.errorTitle}>Could Not Load Dashboard Features</Text>
            <Text style={styles.errorSub}>
              Unable to connect to the clinic server. Please check your connection or retry.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData(false)} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>🔄 Retry Loading</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.errorLogoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.errorLogoutBtnText}>🚪 Sign Out from Portal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.quickStatsRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickStatsInner}>
                {quickStats.map((s, i) => (
                  <StatPill key={i} value={s.value} label={s.label} color={s.color} />
                ))}
              </ScrollView>
            </View>

            <View style={styles.revenueSection}>
              <View style={styles.revenueCard}>
                <View style={styles.revenueRow}>
                  <View style={styles.revenueItem}>
                    <Text style={styles.revenueLabel}>Today</Text>
                    <Text style={styles.revenueValue}>{formatCurrency(dashboard.todayRevenue ?? 0)}</Text>
                  </View>
                  <View style={styles.revenueDivider} />
                  <View style={styles.revenueItem}>
                    <Text style={styles.revenueLabel}>Monthly</Text>
                    <Text style={styles.revenueValue}>{formatCurrency(dashboard.monthlyRevenue ?? 0)}</Text>
                  </View>
                  <View style={styles.revenueDivider} />
                  <View style={styles.revenueItem}>
                    <Text style={styles.revenueLabel}>Net Profit</Text>
                    <Text style={[
                      styles.revenueValue,
                      { color: (dashboard.netProfit ?? 0) >= 0 ? colors.success : colors.error },
                    ]}>
                      {(dashboard.netProfit ?? 0) >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(dashboard.netProfit ?? 0))}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Financial Breakdown</Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.graphSubtitle}>Income Category Splits</Text>
              <View style={styles.chartCard}>
                <BarChart
                  data={incomeData}
                  width={SCREEN_W - 32}
                  height={200}
                  yAxisLabel="₹"
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  }}
                  verticalLabelRotation={0}
                  style={{ borderRadius: borderRadius.md }}
                />
              </View>
            </View>

            <View style={[styles.section, { marginTop: 12 }]}>
              <Text style={styles.graphSubtitle}>Expense Category Splits</Text>
              <View style={styles.chartCard}>
                <BarChart
                  data={expenseData}
                  width={SCREEN_W - 32}
                  height={200}
                  yAxisLabel="₹"
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                  }}
                  verticalLabelRotation={0}
                  style={{ borderRadius: borderRadius.md }}
                />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Overview Metrics</Text>
            </View>
            <View style={styles.gridContainer}>
              {gridCards.map((card, i) => (
                <GridCard key={i} icon={card.icon} label={card.label} value={card.value} color={card.color} bgColor={card.bgColor} />
              ))}
            </View>

            {revenueTrend && revenueTrend.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Monthly Revenue Trend</Text>
                </View>
                <View style={styles.chartCard}>
                  <LineChart
                    data={{
                      labels: revenueTrend.map(t => `${t.month}/${String(t.year).slice(-2)}`),
                      datasets: [{ data: revenueTrend.map(t => Number(t.revenue)) }],
                    }}
                    width={SCREEN_W - 32}
                    height={200}
                    chartConfig={chartConfig}
                    bezier
                    style={{ borderRadius: borderRadius.md }}
                  />
                </View>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Doctor Performance Statistics</Text>
            </View>
            <View style={styles.statsList}>
              {(dashboard.doctorStats || []).map((doc, idx) => (
                <View key={idx} style={styles.statsRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statsRowName}>Dr. {doc.name}</Text>
                    <Text style={styles.statsRowSub}>{doc.specialty || 'General Practitioner'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.statsRowVal}>{doc.appointmentCount} Appts</Text>
                    <Text style={[styles.statsRowBadge, doc.isActive ? styles.badgeActive : styles.badgeInactive]}>
                      {doc.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <View style={styles.actionsGrid}>
              {quickActions.map((action, i) => {
                if (action.admin && !isAdmin) return null;
                return (
                  <QuickActionBtn
                    key={i}
                    icon={action.icon}
                    label={action.label}
                    onPress={() => {
                      if (action.screen === 'SHOW_CARD') {
                        setCardVisible(true);
                      } else if (action.tab) {
                        navigation.getParent()?.navigate(action.tab, { screen: action.screen });
                      } else {
                        navigation.navigate(action.screen);
                      }
                    }}
                    isAdmin={action.admin}
                  />
                );
              })}
            </View>

              <TouchableOpacity 
                style={styles.logoutBtn} 
                onPress={handleLogout} 
                activeOpacity={0.85}
              >
                <Text style={styles.logoutBtnText}>Sign Out</Text>
              </TouchableOpacity>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Digital Brochure Card Modal - Medical Brochure Style */}
      <Modal visible={cardVisible} transparent animationType="fade" onRequestClose={() => setCardVisible(false)}>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.brochureHeaderIcon}>
                    <Text style={{ fontSize: 16 }}>🏥</Text>
                  </View>
                  <Text style={styles.cardTitle}>Clinic Brochure</Text>
                </View>
                <TouchableOpacity style={styles.cardCloseBtn} onPress={() => setCardVisible(false)}>
                  <Text style={styles.cardCloseX}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {isEditing ? (
                <View style={styles.formContainer}>
                  <Text style={styles.formSectionTitle}>Clinic Information</Text>
                  
                  <Text style={styles.formLabel}>Clinic Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={clinicForm.name}
                    onChangeText={(v) => setClinicForm({ ...clinicForm, name: v })}
                    placeholder="e.g. City Dental Clinic"
                    placeholderTextColor={colors.textMuted}
                  />

                  <Text style={styles.formLabel}>Contact Number *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={clinicForm.contactNumber}
                    onChangeText={(v) => setClinicForm({ ...clinicForm, contactNumber: v })}
                    placeholder="Phone number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                  />

                  <Text style={styles.formLabel}>Email Address</Text>
                  <TextInput
                    style={styles.formInput}
                    value={clinicForm.email}
                    onChangeText={(v) => setClinicForm({ ...clinicForm, email: v })}
                    placeholder="clinic@example.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Text style={styles.formLabel}>Address</Text>
                  <TextInput
                    style={[styles.formInput, { minHeight: 60, textAlignVertical: 'top' }]}
                    value={clinicForm.address}
                    onChangeText={(v) => setClinicForm({ ...clinicForm, address: v })}
                    placeholder="Clinic address"
                    placeholderTextColor={colors.textMuted}
                    multiline
                  />

                  <Text style={styles.formLabel}>Registration Number</Text>
                  <TextInput
                    style={styles.formInput}
                    value={clinicForm.registrationNumber}
                    onChangeText={(v) => setClinicForm({ ...clinicForm, registrationNumber: v })}
                    placeholder="Reg No"
                    placeholderTextColor={colors.textMuted}
                  />

                  <Text style={styles.formLabel}>Working Hours</Text>
                  <TextInput
                    style={styles.formInput}
                    value={clinicForm.workingHours}
                    onChangeText={(v) => setClinicForm({ ...clinicForm, workingHours: v })}
                    placeholder="e.g. Mon-Sat: 9 AM - 6 PM"
                    placeholderTextColor={colors.textMuted}
                  />

                  <TouchableOpacity style={styles.saveBtn} onPress={saveClinicDetails} activeOpacity={0.85}>
                    <Text style={styles.saveBtnText}>Save Details</Text>
                  </TouchableOpacity>

                  {clinicDetails && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)} activeOpacity={0.7}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.cardBody}>
                  {/* Medical Brochure Card */}
                  <View style={styles.brochureCard}>
                    <View style={styles.brochureTopBar} />
                    <View style={styles.brochureContent}>
                      <View style={styles.brochureLogoArea}>
                        <View style={styles.brochureLogo}>
                          <Text style={styles.brochureLogoText}>
                            {clinicDetails?.name ? clinicDetails.name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase() : 'CL'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.brochureClinicName}>{clinicDetails?.name || 'Your Clinic Name'}</Text>
                      <Text style={styles.brochureTagline}>Quality Healthcare Services</Text>
                      <View style={styles.brochureDivider} />
                      <View style={styles.brochureInfoSection}>
                        <View style={styles.brochureInfoItem}>
                          <Text style={styles.brochureInfoIcon}>📍</Text>
                          <View style={styles.brochureInfoTextWrap}>
                            <Text style={styles.brochureInfoLabel}>Address</Text>
                            <Text style={styles.brochureInfoValue}>{clinicDetails?.address || 'Not Specified'}</Text>
                          </View>
                        </View>
                        <View style={styles.brochureInfoItem}>
                          <Text style={styles.brochureInfoIcon}>📞</Text>
                          <View style={styles.brochureInfoTextWrap}>
                            <Text style={styles.brochureInfoLabel}>Contact</Text>
                            <Text style={styles.brochureInfoValue}>{clinicDetails?.contactNumber || 'Not Specified'}</Text>
                          </View>
                        </View>
                        <View style={styles.brochureInfoItem}>
                          <Text style={styles.brochureInfoIcon}>✉️</Text>
                          <View style={styles.brochureInfoTextWrap}>
                            <Text style={styles.brochureInfoLabel}>Email</Text>
                            <Text style={styles.brochureInfoValue}>{clinicDetails?.email || 'Not Specified'}</Text>
                          </View>
                        </View>
                        {clinicDetails?.registrationNumber && (
                          <View style={styles.brochureInfoItem}>
                            <Text style={styles.brochureInfoIcon}>📋</Text>
                            <View style={styles.brochureInfoTextWrap}>
                              <Text style={styles.brochureInfoLabel}>Registration</Text>
                              <Text style={styles.brochureInfoValue}>{clinicDetails.registrationNumber}</Text>
                            </View>
                          </View>
                        )}
                        {clinicDetails?.workingHours && (
                          <View style={styles.brochureInfoItem}>
                            <Text style={styles.brochureInfoIcon}>🕒</Text>
                            <View style={styles.brochureInfoTextWrap}>
                              <Text style={styles.brochureInfoLabel}>Working Hours</Text>
                              <Text style={styles.brochureInfoValue}>{clinicDetails.workingHours}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                      <View style={styles.brochureFooter}>
                        <Text style={styles.brochureFooterText}>Your Health, Our Priority</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <TouchableOpacity style={styles.shareBtn} onPress={shareDigitalCard} activeOpacity={0.85}>
                      <Text style={styles.shareBtnText}>Share Brochure</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)} activeOpacity={0.85}>
                      <Text style={styles.editBtnText}>Edit Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 24 },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFFFFF25', justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  greeting: { fontSize: 13, color: '#FFFFFFCC', fontWeight: '500' },
  adminName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 1 },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF20', justifyContent: 'center', alignItems: 'center' },
  bellIcon: { fontSize: 18 },
  headerSub: { fontSize: 13, color: '#FFFFFFAA', marginTop: 8, marginLeft: 62 },
  quickStatsRow: { marginTop: 12, marginBottom: 4 },
  quickStatsInner: { paddingHorizontal: 16, gap: 10 },
  statPill: {
    backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
    alignItems: 'center', minWidth: 90,
  },
  statPillValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statPillLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3, lgWeight: 'bold' },
  revenueSection: { paddingHorizontal: 16, marginTop: 16 },
  revenueCard: {
    backgroundColor: colors.surface, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.md,
  },
  revenueRow: { flexDirection: 'row', alignItems: 'center' },
  revenueItem: { flex: 1, alignItems: 'center' },
  revenueDivider: { width: 1, height: 40, backgroundColor: colors.borderLight, marginHorizontal: 8 },
  revenueLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  revenueValue: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, marginTop: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  section: { paddingHorizontal: 16, marginTop: 4 },
  graphSubtitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, marginLeft: 4 },
  chartCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 16,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  gridContainer: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8,
  },
  gridCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
    marginBottom: 8,
  },
  gridIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridIcon: { fontSize: 16 },
  gridValue: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  gridLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  statsList: { paddingHorizontal: 16, gap: 8 },
  statsRow: {
    backgroundColor: colors.surface, flexDirection: 'row', padding: 14,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'space-between',
  },
  statsRowName: { fontSize: 14, fontWeight: '700', color: colors.text },
  statsRowSub: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  statsRowVal: { fontSize: 14, fontWeight: '700', color: colors.primary },
  statsRowBadge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  badgeActive: { color: colors.success, backgroundColor: colors.successLight },
  badgeInactive: { color: colors.textMuted, backgroundColor: colors.borderLight },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8,
  },
  actionBtn: {
    width: '47%', backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4,
  },
  actionBtnAdmin: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '06',
  },
  actionIcon: { fontSize: 18 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: colors.text, flex: 1 },
  // Modal brochure card styles - Medical Brochure
  modalBg: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000080' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingVertical: 40 },
  cardContainer: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, ...shadows.xl, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  brochureHeaderIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  cardCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  cardCloseX: { fontSize: 14, color: '#64748B', fontWeight: '700' },
  cardBody: { marginTop: 16 },
  // Medical Brochure
  brochureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...shadows.md,
  },
  brochureTopBar: {
    height: 6,
    backgroundColor: colors.primary,
  },
  brochureContent: {
    padding: 20,
    alignItems: 'center',
  },
  brochureLogoArea: { marginBottom: 12 },
  brochureLogo: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    ...shadows.sm,
  },
  brochureLogoText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  brochureClinicName: { fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center', letterSpacing: -0.3 },
  brochureTagline: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 4, letterSpacing: 0.5 },
  brochureDivider: { width: 40, height: 3, backgroundColor: colors.primary, borderRadius: 2, marginVertical: 16 },
  brochureInfoSection: { width: '100%', gap: 12 },
  brochureInfoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  brochureInfoIcon: { fontSize: 16, width: 28, textAlign: 'center', marginTop: 2 },
  brochureInfoTextWrap: { flex: 1 },
  brochureInfoLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  brochureInfoValue: { fontSize: 13, fontWeight: '600', color: '#334155' },
  brochureFooter: {
    marginTop: 16, paddingTop: 14, width: '100%',
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  brochureFooterText: { fontSize: 11, color: '#94A3B8', fontWeight: '500', fontStyle: 'italic' },
  shareBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', ...shadows.sm },
  shareBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  logoutBtn: {
    backgroundColor: colors.error,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.md,
  },
  logoutBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '750' },
  formContainer: { marginTop: 14, width: '100%' },
  formSectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  formLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 10, marginBottom: 4 },
  formInput: { backgroundColor: colors.bg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text, fontWeight: '500', width: '100%' },
  cancelBtn: { marginTop: 8, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  editBtn: { backgroundColor: colors.bg, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  editBtnText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  saveBtn: { marginTop: 16, backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center', ...shadows.sm, width: '100%' },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    ...shadows.sm,
    marginBottom: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorLogoutBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  errorLogoutBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
