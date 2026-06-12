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
import { staffApi } from '../api/staffApi';
import { inventoryApi } from '../api/inventoryApi';
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

function MiniStatCard({ value, label, color, icon }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatIcon}>{icon}</Text>
      <Text style={[styles.miniStatValue, { color: color || colors.primary }]}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

function GridCard({ icon, label, value, color, bgColor }) {
  return (
    <View style={[styles.gridCard, bgColor ? { backgroundColor: bgColor } : null]}>
      <View style={[styles.gridIconWrap, { backgroundColor: (bgColor || colors.surface) }]}>
        <Text style={styles.gridIcon}>{icon}</Text>
      </View>
      <Text style={styles.gridValue}>{value}</Text>
      <Text style={styles.gridLabel}>{label}</Text>
    </View>
  );
}

function QuickActionBtn({ icon, label, onPress, color }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, color ? { borderLeftColor: color, borderLeftWidth: 4 } : null]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionArrow}>›</Text>
    </TouchableOpacity>
  );
}

function AlertBanner({ type, message, onPress }) {
  const bgColor = type === 'error' ? colors.errorLight : type === 'warning' ? colors.warningLight : colors.infoLight;
  const textColor = type === 'error' ? colors.error : type === 'warning' ? colors.warning : colors.info;
  const icon = type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️';
  return (
    <TouchableOpacity style={[styles.alertBanner, { backgroundColor: bgColor, borderLeftColor: textColor }]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.alertIcon}>{icon}</Text>
      <Text style={[styles.alertText, { color: textColor }]}>{message}</Text>
      <Text style={[styles.alertArrow, { color: textColor }]}>›</Text>
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
  const [staffList, setStaffList] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [todayAppts, setTodayAppts] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [clinicForm, setClinicForm] = useState({
    name: '', address: '', contactNumber: '', email: '', registrationNumber: '', workingHours: ''
  });

  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    if (clinicDetails) {
      setClinicForm({
        name: clinicDetails.name || '', address: clinicDetails.address || '',
        contactNumber: clinicDetails.contactNumber || '', email: clinicDetails.email || '',
        registrationNumber: clinicDetails.registrationNumber || '', workingHours: clinicDetails.workingHours || '',
      });
      setIsEditing(false);
    } else {
      setClinicForm({ name: '', address: '', contactNumber: '', email: '', registrationNumber: '', workingHours: '' });
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
        name: clinicForm.name.trim(), address: clinicForm.address.trim() || null,
        contactNumber: clinicForm.contactNumber.trim(), email: clinicForm.email.trim() || null,
        registrationNumber: clinicForm.registrationNumber.trim() || null, workingHours: clinicForm.workingHours.trim() || null,
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
      const [dash, trend, clinic, staff, lowStock] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getRevenueTrend().catch(() => null),
        clinicApi.getMyClinic().catch(() => null),
        staffApi.getMyStaff().catch(() => []),
        inventoryApi.getLowStock().catch(() => []),
      ]);
      setDashboard(dash);
      if (trend) setRevenueTrend(trend);
      if (clinic) setClinicDetails(clinic);
      setStaffList(staff);
      setLowStockItems(lowStock);

      const todayStr = new Date().toISOString().slice(0, 10);
      const appts = await adminApi.getTodayAppointments().catch(() => []);
      setTodayAppts(Array.isArray(appts) ? appts : []);
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
      const shareMsg = `🏥 ${clinicDetails.name}\n📍 ${clinicDetails.address || ''}\n📞 ${clinicDetails.contactNumber || ''}\n✉️ ${clinicDetails.email || ''}`;
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

  const labTechs = staffList.filter(s => s.role === 'LAB_TECHNICIAN' || s.roleTitle === 'LAB_TECHNICIAN');
  const stats = dashboard ? [
    { value: dashboard.todayAppointments ?? 0, label: 'Today Appts', color: colors.primary, icon: '📅' },
    { value: dashboard.pendingAppointments ?? 0, label: 'Pending', color: colors.warning, icon: '⏳' },
    { value: dashboard.totalPatients ?? 0, label: 'Total Patients', color: colors.success, icon: '👤' },
    { value: dashboard.totalDoctors ?? 0, label: 'Doctors', color: colors.accent, icon: '🩺' },
    { value: labTechs.length, label: 'Lab Techs', color: '#6366F1', icon: '🔬' },
  ] : [];

  const gridCards = dashboard ? [
    { icon: '💰', label: "Total Revenue", value: formatCurrency(dashboard.totalRevenue ?? 0), color: colors.success },
    { icon: '📊', label: 'Monthly Revenue', value: formatCurrency(dashboard.monthlyRevenue ?? 0), color: colors.primary },
    { icon: '💸', label: 'Monthly Expenses', value: formatCurrency(dashboard.monthlyExpenses ?? 0), color: colors.error },
    { icon: '📈', label: 'Net Profit', value: formatCurrency(dashboard.netProfit ?? 0), color: (dashboard.netProfit ?? 0) >= 0 ? colors.success : colors.error },
    { icon: '📋', label: 'Pending Follow-Ups', value: dashboard.pendingFollowUps ?? 0, color: colors.info, bgColor: colors.infoLight },
    { icon: '🚨', label: 'Expiring Items', value: dashboard.expiringItems ?? 0, color: colors.error, bgColor: colors.errorLight },
    { icon: '🧾', label: 'Pending Bills', value: dashboard.pendingBills ?? 0, color: colors.warning, bgColor: colors.warningLight },
    { icon: '📦', label: 'Low Stock Items', value: lowStockItems.length || dashboard.lowStockCount || 0, color: colors.accent, bgColor: colors.accentBg },
  ] : [];

  const quickActions = [
    { icon: '👥', label: 'Staff Overview', screen: 'Staff', tab: 'Staff', color: colors.info },
    { icon: '🩺', label: 'Add Doctor', screen: 'DoctorForm', tab: null, color: colors.primary },
    { icon: '📋', label: 'Patient History', screen: 'PatientHistory', tab: null, color: colors.success },
    { icon: '🔑', label: 'Login Credentials', screen: 'CredentialReport', tab: null, color: colors.warning },
    { icon: '📇', label: 'Digital Brochure', screen: 'SHOW_CARD', tab: null, color: colors.accent },
    { icon: '🚪', label: 'Sign Out', screen: 'LOGOUT', tab: null, color: colors.error },
  ];

  const incomeData = dashboard ? {
    labels: ['Doctors', 'Lab', 'Medicals', 'Patients', 'Other'],
    datasets: [{
      data: [
        Number(dashboard.incomeDoctors ?? 0), Number(dashboard.incomeLab ?? 0),
        Number(dashboard.incomeMedicals ?? 0), Number(dashboard.incomePatients ?? 0),
        Number(dashboard.incomeOther ?? 0)
      ]
    }]
  } : null;

  const expenseData = dashboard ? {
    labels: ['Rent', 'Light Bill', 'Maint.', 'Other'],
    datasets: [{
      data: [
        Number(dashboard.expenseRent ?? 0), Number(dashboard.expenseLightBill ?? 0),
        Number(dashboard.expenseMaintenance ?? 0), Number(dashboard.expenseOther ?? 0)
      ]
    }]
  } : null;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Good {today.getHours() < 12 ? 'Morning' : today.getHours() < 17 ? 'Afternoon' : 'Evening'},</Text>
              <Text style={styles.adminName}>{user?.name || 'Admin'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('ClinicSetup')} activeOpacity={0.7}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>{clinicDetails?.name || 'Clinic Management'} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
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
            <Text style={styles.errorSub}>Unable to connect to the clinic server. Please check your connection or retry.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData(false)} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>🔄 Retry Loading</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Revenue Highlight */}
            <View style={styles.revenueHero}>
              <View style={styles.revenueHeroItem}>
                <Text style={styles.revenueHeroLabel}>Today's Revenue</Text>
                <Text style={styles.revenueHeroValue}>{formatCurrency(dashboard.todayRevenue ?? 0)}</Text>
                <View style={styles.revenueHeroBadge}>
                  <Text style={styles.revenueHeroBadgeText}>
                    {((dashboard.todayRevenue ?? 0) > 0) ? '▲ Active' : '— No Data'}
                  </Text>
                </View>
              </View>
              <View style={styles.revenueHeroDivider} />
              <View style={styles.revenueHeroItem}>
                <Text style={styles.revenueHeroLabel}>Net Profit</Text>
                <Text style={[styles.revenueHeroValue, { color: (dashboard.netProfit ?? 0) >= 0 ? colors.success : colors.error }]}>
                  {formatCurrency(Math.abs(dashboard.netProfit ?? 0))}
                </Text>
                <View style={[styles.revenueHeroBadge, { backgroundColor: (dashboard.netProfit ?? 0) >= 0 ? colors.successLight : colors.errorLight }]}>
                  <Text style={[styles.revenueHeroBadgeText, { color: (dashboard.netProfit ?? 0) >= 0 ? colors.success : colors.error }]}>
                    {(dashboard.netProfit ?? 0) >= 0 ? '▲ Profit' : '▼ Loss'}
                  </Text>
                </View>
              </View>
              <View style={styles.revenueHeroDivider} />
              <View style={styles.revenueHeroItem}>
                <Text style={styles.revenueHeroLabel}>Monthly Revenue</Text>
                <Text style={styles.revenueHeroValue}>{formatCurrency(dashboard.monthlyRevenue ?? 0)}</Text>
                <View style={styles.revenueHeroBadge}>
                  <Text style={styles.revenueHeroBadgeText}>📊 This Month</Text>
                </View>
              </View>
            </View>

            {/* Alerts */}
            {lowStockItems.length > 0 && (
              <AlertBanner
                type="warning"
                message={`${lowStockItems.length} item${lowStockItems.length > 1 ? 's are' : ' is'} low in stock. Tap to manage inventory.`}
                onPress={() => navigation.navigate('Inventory', { screen: 'InventoryDashboard' })}
              />
            )}
            {dashboard.expiringItems > 0 && (
              <AlertBanner
                type="error"
                message={`${dashboard.expiringItems} item${dashboard.expiringItems > 1 ? 's are' : ' is'} expiring soon. Tap to review.`}
                onPress={() => navigation.navigate('Inventory', { screen: 'InventoryDashboard' })}
              />
            )}
            {dashboard.pendingBills > 0 && (
              <AlertBanner
                type="info"
                message={`${dashboard.pendingBills} pending bill${dashboard.pendingBills > 1 ? 's' : ''} need attention.`}
                onPress={() => navigation.navigate('Billing', { screen: 'BillingDashboard' })}
              />
            )}

            {/* Quick Stats */}
            <View style={styles.statsRow}>
              {stats.map((s, i) => (
                <MiniStatCard key={i} value={s.value} label={s.label} color={s.color} icon={s.icon} />
              ))}
            </View>

            {/* Today's Appointments Preview */}
            {todayAppts.length > 0 && (
              <View style={styles.sectionCompact}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Today's Appointments</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Calendar', { screen: 'AdminSchedule' })}>
                    <Text style={styles.seeAll}>See All ›</Text>
                  </TouchableOpacity>
                </View>
                {todayAppts.slice(0, 4).map((appt, idx) => (
                  <TouchableOpacity key={idx} style={styles.apptRow} onPress={() => navigation.navigate('AppointmentDetail', { appointment: appt })} activeOpacity={0.7}>
                    <View style={styles.apptTimeBadge}>
                      <Text style={styles.apptTimeText}>{appt.startTime?.slice(0, 5) || '--:--'}</Text>
                    </View>
                    <View style={styles.apptInfo}>
                      <Text style={styles.apptPatientName}>{appt.patientName || 'Patient'}</Text>
                      <Text style={styles.apptDoctorName}>Dr. {appt.doctorName || 'Doctor'}</Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: appt.status === 'COMPLETED' ? colors.success : appt.status === 'IN_PROGRESS' ? colors.warning : colors.primary }]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Patient Overview */}
            <View style={styles.sectionCompact}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Patient Overview</Text>
                <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Patients', { screen: 'PatientList' })}>
                  <Text style={styles.seeAll}>All Patients ›</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.patientOverviewRow}>
                <View style={styles.patientOverviewCard}>
                  <Text style={styles.patientOverviewIcon}>👤</Text>
                  <Text style={styles.patientOverviewValue}>{dashboard.totalPatients ?? 0}</Text>
                  <Text style={styles.patientOverviewLabel}>Total Patients</Text>
                </View>
                <View style={styles.patientOverviewCard}>
                  <Text style={styles.patientOverviewIcon}>🆕</Text>
                  <Text style={styles.patientOverviewValue}>{dashboard.todayAppointments ?? 0}</Text>
                  <Text style={styles.patientOverviewLabel}>Visits Today</Text>
                </View>
                <View style={styles.patientOverviewCard}>
                  <Text style={styles.patientOverviewIcon}>🔄</Text>
                  <Text style={styles.patientOverviewValue}>{Math.max(0, (dashboard.totalPatients ?? 0) - (dashboard.todayAppointments ?? 0))}</Text>
                  <Text style={styles.patientOverviewLabel}>Returning</Text>
                </View>
                <View style={styles.patientOverviewCard}>
                  <Text style={styles.patientOverviewIcon}>⏳</Text>
                  <Text style={styles.patientOverviewValue}>{dashboard.pendingFollowUps ?? 0}</Text>
                  <Text style={styles.patientOverviewLabel}>Follow-ups</Text>
                </View>
              </View>
            </View>

            {/* Lab & Diagnostics */}
            {labTechs.length > 0 && (
              <View style={styles.sectionCompact}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Lab & Diagnostics</Text>
                  <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Staff', { screen: 'StaffOverview' })}>
                    <Text style={styles.seeAll}>View Staff ›</Text>
                  </TouchableOpacity>
                </View>
                {labTechs.slice(0, 3).map((tech, idx) => (
                  <View key={idx} style={styles.labTechRow}>
                    <View style={[styles.labTechAvatar, { backgroundColor: '#6366F120' }]}>
                      <Text style={styles.labTechAvatarText}>🔬</Text>
                    </View>
                    <View style={styles.labTechInfo}>
                      <Text style={styles.labTechName}>{tech.staffName}</Text>
                      <Text style={styles.labTechDetail}>{tech.phone || 'No phone'} · {tech.dutyTime || 'No duty hours'}</Text>
                    </View>
                    <View style={styles.labTechBadge}>
                      <Text style={styles.labTechBadgeText}>Lab Tech</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Financial Performance Charts */}
            <View style={styles.sectionCompact}>
              <Text style={styles.sectionTitle}>Financial Performance</Text>
              <View style={styles.chartToggle}>
                <View style={styles.chartCard}>
                  <Text style={styles.chartLabel}>Income Breakdown</Text>
                  <BarChart
                    data={incomeData}
                    width={SCREEN_W - 48}
                    height={160}
                    yAxisLabel="₹"
                    chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})` }}
                    verticalLabelRotation={0}
                    style={{ borderRadius: borderRadius.md }}
                  />
                </View>
              </View>
              <View style={[styles.chartCard, { marginTop: 8 }]}>
                <Text style={styles.chartLabel}>Expense Breakdown</Text>
                <BarChart
                  data={expenseData}
                  width={SCREEN_W - 48}
                  height={160}
                  yAxisLabel="₹"
                  chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})` }}
                  verticalLabelRotation={0}
                  style={{ borderRadius: borderRadius.md }}
                />
              </View>
            </View>

            {/* Revenue Trend */}
            {revenueTrend && revenueTrend.length > 0 && (
              <View style={styles.sectionCompact}>
                <Text style={styles.sectionTitle}>Revenue Trend (6 Months)</Text>
                <View style={styles.chartCard}>
                  <LineChart
                    data={{
                      labels: revenueTrend.map(t => `${t.month}/${String(t.year).slice(-2)}`),
                      datasets: [{ data: revenueTrend.map(t => Number(t.revenue)) }],
                    }}
                    width={SCREEN_W - 48}
                    height={180}
                    chartConfig={chartConfig}
                    bezier
                    style={{ borderRadius: borderRadius.md }}
                  />
                </View>
              </View>
            )}

            {/* Overview Metrics */}
            <View style={styles.sectionCompact}>
              <Text style={styles.sectionTitle}>Overview Metrics</Text>
              <View style={styles.gridContainer}>
                {gridCards.map((card, i) => (
                  <GridCard key={i} icon={card.icon} label={card.label} value={card.value} color={card.color} bgColor={card.bgColor} />
                ))}
              </View>
            </View>

            {/* Doctor Performance */}
            <View style={styles.sectionCompact}>
              <Text style={styles.sectionTitle}>Doctor Performance</Text>
              {(dashboard.doctorStats || []).map((doc, idx) => (
                <View key={idx} style={styles.docRow}>
                  <View style={styles.docRowLeft}>
                    <View style={styles.docRowAvatar}>
                      <Text style={styles.docRowAvatarText}>{(doc.name || 'D').charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.docRowName}>Dr. {doc.name}</Text>
                      <Text style={styles.docRowSub}>{doc.specialty || 'General'}</Text>
                    </View>
                  </View>
                  <View style={styles.docRowRight}>
                    <Text style={styles.docRowVal}>{doc.appointmentCount} appts</Text>
                    <View style={[styles.badge, doc.isActive ? styles.badgeActive : styles.badgeInactive]}>
                      <Text style={[styles.badgeText, { color: doc.isActive ? colors.success : colors.textMuted }]}>{doc.isActive ? 'Active' : 'Inactive'}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.sectionCompact}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsList}>
                {quickActions.map((action, i) => {
                  if (action.screen === 'LOGOUT') {
                    return (
                      <TouchableOpacity key={i} style={styles.logoutAction} onPress={handleLogout} activeOpacity={0.7}>
                        <Text style={styles.actionIcon}>🚪</Text>
                        <Text style={styles.logoutActionText}>Sign Out</Text>
                        <Text style={styles.actionArrow}>›</Text>
                      </TouchableOpacity>
                    );
                  }
                  if (action.admin && !isAdmin) return null;
                  return (
                    <QuickActionBtn
                      key={i}
                      icon={action.icon}
                      label={action.label}
                      color={action.color}
                      onPress={() => {
                        if (action.screen === 'SHOW_CARD') {
                          setCardVisible(true);
                        } else if (action.tab) {
                          navigation.getParent()?.navigate(action.tab, { screen: action.screen });
                        } else {
                          navigation.navigate(action.screen);
                        }
                      }}
                    />
                  );
                })}
              </View>
            </View>

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>

      {/* Digital Brochure Card Modal */}
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
                  <TextInput style={styles.formInput} value={clinicForm.name} onChangeText={(v) => setClinicForm({ ...clinicForm, name: v })} placeholder="e.g. City Dental Clinic" placeholderTextColor={colors.textMuted} />
                  <Text style={styles.formLabel}>Contact Number *</Text>
                  <TextInput style={styles.formInput} value={clinicForm.contactNumber} onChangeText={(v) => setClinicForm({ ...clinicForm, contactNumber: v })} placeholder="Phone number" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
                  <Text style={styles.formLabel}>Email Address</Text>
                  <TextInput style={styles.formInput} value={clinicForm.email} onChangeText={(v) => setClinicForm({ ...clinicForm, email: v })} placeholder="clinic@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
                  <Text style={styles.formLabel}>Address</Text>
                  <TextInput style={[styles.formInput, { minHeight: 60, textAlignVertical: 'top' }]} value={clinicForm.address} onChangeText={(v) => setClinicForm({ ...clinicForm, address: v })} placeholder="Clinic address" placeholderTextColor={colors.textMuted} multiline />
                  <Text style={styles.formLabel}>Registration Number</Text>
                  <TextInput style={styles.formInput} value={clinicForm.registrationNumber} onChangeText={(v) => setClinicForm({ ...clinicForm, registrationNumber: v })} placeholder="Reg No" placeholderTextColor={colors.textMuted} />
                  <Text style={styles.formLabel}>Working Hours</Text>
                  <TextInput style={styles.formInput} value={clinicForm.workingHours} onChangeText={(v) => setClinicForm({ ...clinicForm, workingHours: v })} placeholder="e.g. Mon-Sat: 9 AM - 6 PM" placeholderTextColor={colors.textMuted} />
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFFFFF25', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  greeting: { fontSize: 12, color: '#FFFFFFCC', fontWeight: '500' },
  adminName: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3, marginTop: 1 },
  settingsBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF20', justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 16 },
  headerSub: { fontSize: 12, color: '#FFFFFFAA', marginTop: 8 },

  revenueHero: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 16,
    backgroundColor: colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.md,
  },
  revenueHeroItem: { flex: 1, alignItems: 'center' },
  revenueHeroDivider: { width: 1, height: 50, backgroundColor: colors.borderLight, marginHorizontal: 6 },
  revenueHeroLabel: { fontSize: 9, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  revenueHeroValue: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  revenueHeroBadge: { marginTop: 4, backgroundColor: colors.primary + '12', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  revenueHeroBadgeText: { fontSize: 8, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.3 },

  statsRow: {
    flexDirection: 'row', marginHorizontal: 12, marginTop: 12, gap: 6,
  },
  miniStat: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 10,
    alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  miniStatIcon: { fontSize: 16, marginBottom: 2 },
  miniStatValue: { fontSize: 16, fontWeight: '800' },
  miniStatLabel: { fontSize: 8, fontWeight: '600', color: colors.textMuted, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.3 },

  patientOverviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  patientOverviewCard: {
    width: '48%', backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  patientOverviewIcon: { fontSize: 20, marginBottom: 4 },
  patientOverviewValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  patientOverviewLabel: { fontSize: 9, fontWeight: '600', color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },

  labTechRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: 10, borderRadius: 12, marginBottom: 6,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  labTechAvatar: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  labTechAvatarText: { fontSize: 16 },
  labTechInfo: { flex: 1 },
  labTechName: { fontSize: 13, fontWeight: '700', color: colors.text },
  labTechDetail: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  labTechBadge: { backgroundColor: '#6366F115', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  labTechBadgeText: { fontSize: 9, fontWeight: '700', color: '#6366F1' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10,
    padding: 12, borderRadius: 12, borderLeftWidth: 4,
  },
  alertIcon: { fontSize: 16, marginRight: 8 },
  alertText: { flex: 1, fontSize: 12, fontWeight: '600' },
  alertArrow: { fontSize: 18, fontWeight: '700', marginLeft: 4 },

  sectionCompact: { marginTop: 16, paddingHorizontal: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.3, marginBottom: 8 },
  seeAll: { fontSize: 12, fontWeight: '600', color: colors.primary },

  apptRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: 10, borderRadius: 12, marginBottom: 6,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  apptTimeBadge: {
    backgroundColor: colors.primary + '0A', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, marginRight: 10, minWidth: 48, alignItems: 'center',
  },
  apptTimeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  apptInfo: { flex: 1 },
  apptPatientName: { fontSize: 13, fontWeight: '700', color: colors.text },
  apptDoctorName: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  chartToggle: { marginBottom: 4 },
  chartCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
  },
  chartLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm, marginBottom: 4,
  },
  gridIconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  gridIcon: { fontSize: 14 },
  gridValue: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  gridLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },

  docRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: 12, borderRadius: 12, marginBottom: 6,
    borderWidth: 1, borderColor: colors.borderLight, justifyContent: 'space-between',
  },
  docRowLeft: { flexDirection: 'row', alignItems: 'center' },
  docRowAvatar: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  docRowAvatarText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  docRowName: { fontSize: 13, fontWeight: '700', color: colors.text },
  docRowSub: { fontSize: 10, fontWeight: '500', color: colors.textSecondary, marginTop: 1 },
  docRowRight: { alignItems: 'flex-end' },
  docRowVal: { fontSize: 13, fontWeight: '700', color: colors.primary },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 3 },
  badgeActive: { backgroundColor: colors.successLight },
  badgeInactive: { backgroundColor: colors.bg },
  badgeText: { fontSize: 9, fontWeight: '700' },

  actionsList: { gap: 6 },
  actionBtn: {
    backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm,
    flexDirection: 'row', alignItems: 'center',
  },
  actionIcon: { fontSize: 16, marginRight: 10, width: 24, textAlign: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1 },
  actionArrow: { fontSize: 18, color: colors.textMuted, fontWeight: '300' },
  logoutAction: {
    backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.error + '30', ...shadows.sm,
    flexDirection: 'row', alignItems: 'center',
  },
  logoutActionText: { fontSize: 13, fontWeight: '600', color: colors.error, flex: 1 },

  modalBg: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000080' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingVertical: 40 },
  cardContainer: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, ...shadows.xl, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  brochureHeaderIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  cardCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  cardCloseX: { fontSize: 14, color: '#64748B', fontWeight: '700' },
  cardBody: { marginTop: 16 },
  brochureCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', ...shadows.md },
  brochureTopBar: { height: 6, backgroundColor: colors.primary },
  brochureContent: { padding: 20, alignItems: 'center' },
  brochureLogoArea: { marginBottom: 12 },
  brochureLogo: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadows.sm },
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
  brochureFooter: { marginTop: 16, paddingTop: 14, width: '100%', borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center' },
  brochureFooterText: { fontSize: 11, color: '#94A3B8', fontWeight: '500', fontStyle: 'italic' },
  shareBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', ...shadows.sm },
  shareBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  editBtn: { backgroundColor: colors.bg, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  editBtnText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  formContainer: { marginTop: 14, width: '100%' },
  formSectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  formLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 10, marginBottom: 4 },
  formInput: { backgroundColor: colors.bg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text, fontWeight: '500', width: '100%' },
  cancelBtn: { marginTop: 8, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  saveBtn: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', ...shadows.sm, width: '100%' },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  errorContainer: { padding: 32, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 },
  errorSub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 24, paddingHorizontal: 16 },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, ...shadows.sm, marginBottom: 12 },
  retryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
