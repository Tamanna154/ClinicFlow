import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, StatusBar, Linking, Modal, TextInput } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { colors, shadows, borderRadius } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import PatientRegisterScreen from './src/screens/PatientRegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import AppointmentListScreen from './src/screens/AppointmentListScreen';

import CalendarScreen from './src/screens/CalendarScreen';
import PatientListScreen from './src/screens/PatientListScreen';
import PatientFormScreen from './src/screens/PatientFormScreen';
import PatientDetailScreen from './src/screens/PatientDetailScreen';
import DoctorListScreen from './src/screens/DoctorListScreen';
import DoctorFormScreen from './src/screens/DoctorFormScreen';
import DoctorDetailScreen from './src/screens/DoctorDetailScreen';
import AppointmentBookingScreen from './src/screens/AppointmentBookingScreen';
import AppointmentDetailScreen from './src/screens/AppointmentDetailScreen';
import BulkSmsScreen from './src/screens/BulkSmsScreen';
import PatientBookingScreen from './src/screens/PatientBookingScreen';
import PatientAppointmentsScreen from './src/screens/PatientAppointmentsScreen';
import PatientReportsScreen from './src/screens/PatientReportsScreen';
import StaffOverviewScreen from './src/screens/StaffOverviewScreen';
import StaffListScreen from './src/screens/StaffListScreen';
import StaffFormScreen from './src/screens/StaffFormScreen';
import PermissionsScreen from './src/screens/PermissionsScreen';
import InventoryListScreen from './src/screens/InventoryListScreen';
import InventoryFormScreen from './src/screens/InventoryFormScreen';
import InventoryDetailScreen from './src/screens/InventoryDetailScreen';
import InventoryDashboardScreen from './src/screens/InventoryDashboardScreen';
import SupplierListScreen from './src/screens/SupplierListScreen';
import BillingDashboardScreen from './src/screens/BillingDashboardScreen';
import MedicineBillingScreen from './src/screens/MedicineBillingScreen';
import BillDetailScreen from './src/screens/BillDetailScreen';
import IncomeDashboardScreen from './src/screens/IncomeDashboardScreen';
import CurrencySettingsScreen from './src/screens/CurrencySettingsScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import ConsultationScreen from './src/screens/ConsultationScreen';
import ConsultationBillingScreen from './src/screens/ConsultationBillingScreen';
import PrescriptionScreen from './src/screens/PrescriptionScreen';
import DoctorDashboardScreen from './src/screens/DoctorDashboardScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import LetterheadSetupScreen from './src/screens/LetterheadSetupScreen';
import ClinicSetupScreen from './src/screens/ClinicSetupScreen';
import DoctorEarningsScreen from './src/screens/DoctorEarningsScreen';
import ReceptionistDashboardScreen from './src/screens/ReceptionistDashboardScreen';
import PharmacistDashboardScreen from './src/screens/PharmacistDashboardScreen';
import AccountantDashboardScreen from './src/screens/AccountantDashboardScreen';
import AdminScheduleScreen from './src/screens/AdminScheduleScreen';
import ServerSettingsScreen from './src/screens/ServerSettingsScreen';

import PatientDashboardScreen from './src/screens/PatientDashboardScreen';
import PatientMedicationScreen from './src/screens/PatientMedicationScreen';
import PatientCampsScreen from './src/screens/PatientCampsScreen';
import PatientRecordsScreen from './src/screens/PatientRecordsScreen';
import PatientCalendarScreen from './src/screens/PatientCalendarScreen';
import PatientHistoryScreen from './src/screens/PatientHistoryScreen';
import StaffHistoryScreen from './src/screens/StaffHistoryScreen';
import PatientProfileScreen from './src/screens/PatientProfileScreen';
import CredentialReportScreen from './src/screens/CredentialReportScreen';
import SalaryScreen from './src/screens/SalaryScreen';


import ErrorBoundary from './src/components/ErrorBoundary';
import { initializeApiBase } from './src/api/apiBase';
import { clinicApi } from './src/api/clinicApi';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const STATUSBAR_H = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 36);

function HeaderBackground() {
  return <View style={{ flex: 1, backgroundColor: colors.primary, marginTop: -STATUSBAR_H, paddingTop: STATUSBAR_H }} />;
}

const headerOpts = {
  headerStyle: { backgroundColor: colors.primary, elevation: 0, shadowOpacity: 0 },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700', fontSize: 17, letterSpacing: -0.3 },
  headerShadowVisible: false,
  headerBackground: () => <HeaderBackground />,
};

const TAB_ICONS = {
  Dashboard: '🏡', Schedule: '📅', Appts: '📅', Patients: '👤',
  Doctors: '🩺', Stock: '📦', Billing: '🧾', Income: '💵', Staff: '👥',
  Salary: '💰',
  'Doctor Dashboard': '🏡',
  Home: '🏡',
  Meds: '💊',
  Records: '📜',
  Camps: '🩺',
  Calendar: '📆',
  Profile: '👤',
  Finance: '💵',
};

function TabIcon({ label, focused }) {
  const icon = TAB_ICONS[label] || (label ? label.charAt(0).toUpperCase() : '?');
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.tabIconText, focused && { color: '#FFFFFF' }]}>{icon}</Text>
    </View>
  );
}

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

function LogoutButton({ tintColor }) {
  const { logout } = useAuth();
  return (
    <TouchableOpacity 
      onPress={() => confirmAndLogout(logout)} 
      activeOpacity={0.7}
      style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: 4 }}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <Text style={{ fontSize: 14, color: tintColor || '#FFFFFF', fontWeight: '600' }}>Sign Out</Text>
    </TouchableOpacity>
  );
}

function HeaderRight() {
  return <LogoutButton tintColor="#FFFFFF" />;
}

function PatientStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="PatientList" component={PatientListScreen} options={{ title: 'Patients' }} />
      <Stack.Screen name="PatientForm" component={PatientFormScreen} options={({ route }) => ({ title: route.params?.patient ? 'Edit Patient' : 'New Patient' })} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={({ route }) => ({ title: route.params?.patient?.name || 'Patient' })} />
      <Stack.Screen name="BulkSms" component={BulkSmsScreen} options={{ title: 'Bulk SMS' }} />
    </Stack.Navigator>
  );
}

function DoctorStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="DoctorList" component={DoctorListScreen} options={{ title: 'Doctors' }} />
      <Stack.Screen name="DoctorForm" component={DoctorFormScreen} options={({ route }) => ({ title: route.params?.doctor ? 'Edit Doctor' : 'New Doctor' })} />
      <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} options={({ route }) => ({ title: `Dr. ${route.params?.doctor?.name || 'Doctor'}` })} />
      <Stack.Screen name="AppointmentList" component={AppointmentListScreen} options={({ route }) => ({ title: route.params?.doctorName ? `Dr. ${route.params.doctorName}` : 'Appointments' })} />
      <Stack.Screen name="AppointmentBooking" component={AppointmentBookingScreen} options={{ title: 'Book Appointment' }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} initialParams={{ isDoctor: true }} options={{ title: 'Appointment' }} />
      <Stack.Screen name="Consultation" component={ConsultationScreen} options={{ title: 'Consultation' }} />
      <Stack.Screen name="ConsultationBilling" component={ConsultationBillingScreen} options={{ title: 'Generate Bill' }} />
      <Stack.Screen name="Prescription" component={PrescriptionScreen} options={{ title: 'Prescription' }} />
      <Stack.Screen name="Income" component={IncomeDashboardScreen} options={{ title: 'Financial Reports' }} />
      <Stack.Screen name="LetterheadSetup" component={LetterheadSetupScreen} options={{ title: 'Letterhead' }} />
      <Stack.Screen name="DoctorEarnings" component={DoctorEarningsScreen} options={({ route }) => ({ title: `Dr. ${route.params?.doctorName || ''} Earnings` })} />
      <Stack.Screen name="CredentialReport" component={CredentialReportScreen} options={{ title: 'Login Credentials' }} />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="DoctorDashboard" component={DoctorDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} initialParams={{ isDoctor: true }} options={{ title: 'Appointment' }} />
      <Stack.Screen name="Consultation" component={ConsultationScreen} options={{ title: 'Consultation' }} />
      <Stack.Screen name="ConsultationBilling" component={ConsultationBillingScreen} options={{ title: 'Generate Bill' }} />
      <Stack.Screen name="Prescription" component={PrescriptionScreen} options={{ title: 'Prescription' }} />
      <Stack.Screen name="PatientCamps" component={PatientCampsScreen} options={{ title: 'Health Campaigns' }} />
      <Stack.Screen name="LetterheadSetup" component={LetterheadSetupScreen} options={{ title: 'Letterhead' }} />
      <Stack.Screen name="CredentialReport" component={CredentialReportScreen} options={{ title: 'Login Credentials' }} />
    </Stack.Navigator>
  );
}

function AppointmentStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="AppointmentList" component={AppointmentListScreen} options={{ title: 'Appointments' }} />
      <Stack.Screen name="AppointmentBooking" component={AppointmentBookingScreen} options={{ title: 'Book Appointment' }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} initialParams={{ isDoctor: true }} options={{ title: 'Appointment' }} />
      <Stack.Screen name="Consultation" component={ConsultationScreen} options={{ title: 'Consultation' }} />
      <Stack.Screen name="ConsultationBilling" component={ConsultationBillingScreen} options={{ title: 'Generate Bill' }} />
      <Stack.Screen name="Prescription" component={PrescriptionScreen} options={{ title: 'Prescription' }} />
    </Stack.Navigator>
  );
}

function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="CalendarMain" component={CalendarScreen} options={{ title: 'Schedule' }} />
      <Stack.Screen name="CalendarBooking" component={AppointmentBookingScreen} options={{ title: 'Book Appointment' }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} initialParams={{ isDoctor: true }} options={{ title: 'Appointment' }} />
      <Stack.Screen name="Consultation" component={ConsultationScreen} options={{ title: 'Consultation' }} />
      <Stack.Screen name="ConsultationBilling" component={ConsultationBillingScreen} options={{ title: 'Generate Bill' }} />
      <Stack.Screen name="Prescription" component={PrescriptionScreen} options={{ title: 'Prescription' }} />
    </Stack.Navigator>
  );
}

function PatientPortalStack() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="PatientAppointments" component={PatientAppointmentsScreen} options={{ title: 'My Appointments' }} />
      <Stack.Screen name="PatientBooking" component={PatientBookingScreen} options={{ title: 'Book Appointment' }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Appointment' }} />
    </Stack.Navigator>
  );
}

function StaffStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="StaffOverview" component={StaffOverviewScreen} options={{ title: 'Staff' }} />
      <Stack.Screen name="StaffList" component={StaffListScreen} options={{ title: 'All Staff' }} />
      <Stack.Screen name="StaffForm" component={StaffFormScreen} options={{ title: 'Add Staff' }} />
      <Stack.Screen name="PermissionsScreen" component={PermissionsScreen} options={({ route }) => ({ title: route.params?.staffName ? `${route.params.staffName}'s Permissions` : 'Permissions' })} />
    </Stack.Navigator>
  );
}

function InventoryStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="InventoryDashboard" component={InventoryDashboardScreen} options={{ title: 'Inventory' }} />
      <Stack.Screen name="InventoryList" component={InventoryListScreen} options={{ title: 'All Items' }} />
      <Stack.Screen name="InventoryForm" component={InventoryFormScreen} options={({ route }) => ({ title: route.params?.item ? 'Edit Item' : 'New Item' })} />
      <Stack.Screen name="InventoryDetail" component={InventoryDetailScreen} options={({ route }) => ({ title: route.params?.item?.itemName || 'Item' })} />
      <Stack.Screen name="SupplierList" component={SupplierListScreen} options={{ title: 'Suppliers' }} />
    </Stack.Navigator>
  );
}

function BillingStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="BillingDashboard" component={BillingDashboardScreen} options={{ title: 'Billing' }} />
      <Stack.Screen name="MedicineBilling" component={MedicineBillingScreen} options={{ title: 'New Bill' }} />
      <Stack.Screen name="BillDetail" component={BillDetailScreen} options={{ title: 'Bill Details' }} />
    </Stack.Navigator>
  );
}

function IncomeStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="IncomeDashboard" component={IncomeDashboardScreen} options={{ title: 'Finance' }} />
      <Stack.Screen name="CurrencySettings" component={CurrencySettingsScreen} options={{ title: 'Currency' }} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
      <Stack.Screen name="ServerSettings" component={ServerSettingsScreen} options={{ title: 'Server Settings' }} />
    </Stack.Navigator>
  );
}

function AdminDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} initialParams={{ isDoctor: true }} options={{ title: 'Appointment' }} />
      <Stack.Screen name="AppointmentList" component={AppointmentListScreen} options={{ title: 'Appointments' }} />
      <Stack.Screen name="Consultation" component={ConsultationScreen} options={{ title: 'Consultation' }} />
      <Stack.Screen name="ConsultationBilling" component={ConsultationBillingScreen} options={{ title: 'Generate Bill' }} />
      <Stack.Screen name="Prescription" component={PrescriptionScreen} options={{ title: 'Prescription' }} />
      <Stack.Screen name="PatientForm" component={PatientFormScreen} options={{ title: 'New Patient' }} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Patient' }} />
      <Stack.Screen name="DoctorForm" component={DoctorFormScreen} options={{ title: 'New Doctor' }} />
      <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} options={{ title: 'Doctor' }} />
      <Stack.Screen name="StaffForm" component={StaffFormScreen} options={{ title: 'Add Staff' }} />
      <Stack.Screen name="PermissionsScreen" component={PermissionsScreen} options={{ title: 'Permissions' }} />
      <Stack.Screen name="DoctorEarnings" component={DoctorEarningsScreen} options={({ route }) => ({ title: `Dr. ${route.params?.doctorName || ''} Earnings` })} />
      <Stack.Screen name="ClinicSetup" component={ClinicSetupScreen} options={{ title: 'Clinic Setup' }} />
      <Stack.Screen name="PatientHistory" component={PatientHistoryScreen} options={{ title: 'Patient History' }} />
      <Stack.Screen name="StaffHistory" component={StaffHistoryScreen} options={{ title: 'Staff Activity History' }} />
      <Stack.Screen name="CredentialReport" component={CredentialReportScreen} options={{ title: 'Login Credentials' }} />
    </Stack.Navigator>
  );
}

function PatientAppointmentStack() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="PatientAppointmentList" component={PatientAppointmentsScreen} options={{ title: 'My Appointments' }} />
      <Stack.Screen name="PatientBooking" component={PatientBookingScreen} options={{ title: 'Book Appointment' }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Appointment' }} />
      <Stack.Screen name="PatientReports" component={PatientReportsScreen} options={{ title: 'My Reports' }} />
      <Stack.Screen name="Prescription" component={PrescriptionScreen} options={{ title: 'Prescription' }} />
    </Stack.Navigator>
  );
}





function MyTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabOuter}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || route.name;
          const isFocused = state.index === index;
          return (
            <TouchableOpacity
              key={route.key}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
              onPress={() => {
                const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isFocused && !ev.defaultPrevented) navigation.navigate(route.name);
              }}
              activeOpacity={0.7}
            >
              <TabIcon label={label} focused={isFocused} />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function PharmacistDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="PharmacistDashboard" component={PharmacistDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="InventoryDashboard" component={InventoryDashboardScreen} options={{ title: 'Inventory' }} />
      <Stack.Screen name="InventoryForm" component={InventoryFormScreen} options={({ route }) => ({ title: route.params?.item ? 'Edit Item' : 'New Item' })} />
      <Stack.Screen name="InventoryDetail" component={InventoryDetailScreen} options={({ route }) => ({ title: route.params?.item?.itemName || 'Item' })} />
      <Stack.Screen name="MedicineBilling" component={MedicineBillingScreen} options={{ title: 'New Bill' }} />
      <Stack.Screen name="BillDetail" component={BillDetailScreen} options={{ title: 'Bill Details' }} />
    </Stack.Navigator>
  );
}

function AccountantDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="AccountantDashboard" component={AccountantDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="BillingDashboard" component={BillingDashboardScreen} options={{ title: 'Billing' }} />
      <Stack.Screen name="MedicineBilling" component={MedicineBillingScreen} options={{ title: 'New Bill' }} />
      <Stack.Screen name="BillDetail" component={BillDetailScreen} options={{ title: 'Bill Details' }} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
      <Stack.Screen name="IncomeDashboard" component={IncomeDashboardScreen} options={{ title: 'Finance' }} />
    </Stack.Navigator>
  );
}

function ReceptionistDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="ReceptionistDashboard" component={ReceptionistDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} initialParams={{ isDoctor: false }} options={{ title: 'Appointment' }} />
      <Stack.Screen name="AppointmentList" component={AppointmentListScreen} options={{ title: 'Appointments' }} />
      <Stack.Screen name="AppointmentBooking" component={AppointmentBookingScreen} options={{ title: 'Book Appointment' }} />
      <Stack.Screen name="PatientForm" component={PatientFormScreen} options={{ title: 'New Patient' }} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Patient' }} />
      <Stack.Screen name="BulkSms" component={BulkSmsScreen} options={{ title: 'Bulk SMS' }} />
      <Stack.Screen name="CalendarMain" component={CalendarScreen} options={{ title: 'Schedule' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';

  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      {isDoctor && <Tab.Screen name="Doctor Dashboard" component={DashboardStack} options={{ tabBarLabel: 'Home' }} />}
      <Tab.Screen name="Calendar" component={CalendarStack} options={{ tabBarLabel: 'Schedule' }} />
      <Tab.Screen name="Appointments" component={AppointmentStack} options={{ tabBarLabel: 'Appts' }} />
      <Tab.Screen name="Patients" component={PatientStack} options={{ tabBarLabel: 'Patients' }} />
      <Tab.Screen name="Billing" component={BillingStack} options={{ tabBarLabel: 'Billing' }} />
      <Tab.Screen name="Inventory" component={InventoryStack} options={{ tabBarLabel: 'Stock' }} />
      {isDoctor && <Tab.Screen name="Finance" component={IncomeStack} options={{ tabBarLabel: 'Finance' }} />}
    </Tab.Navigator>
  );
}

function ReceptionistTabs() {
  const { user } = useAuth();
  const perms = user?.permissions || [];

  const hasViewPatients = perms.includes('VIEW_PATIENTS') || perms.includes('MANAGE_PATIENTS');
  const hasViewCalendar = perms.includes('VIEW_CALENDAR') || perms.includes('MANAGE_CALENDAR');
  const hasViewAppointments = perms.includes('VIEW_APPOINTMENTS') || perms.includes('MANAGE_APPOINTMENTS');
  const hasViewDoctors = perms.includes('VIEW_DOCTORS');
  const hasManagePermissions = perms.includes('MANAGE_PERMISSIONS');
  const hasViewInventory = perms.includes('VIEW_INVENTORY') || perms.includes('MANAGE_INVENTORY');
  const hasViewBilling = perms.includes('VIEW_BILLING') || perms.includes('MANAGE_BILLING');
  const hasViewIncome = perms.includes('VIEW_INCOME');

  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Receptionist Home" component={ReceptionistDashboardStack} options={{ tabBarLabel: 'Home' }} />
      {hasViewCalendar && <Tab.Screen name="Calendar" component={CalendarStack} options={{ tabBarLabel: 'Schedule' }} />}
      {hasViewAppointments && <Tab.Screen name="Appointments" component={AppointmentStack} options={{ tabBarLabel: 'Appts' }} />}
      {hasViewPatients && <Tab.Screen name="Patients" component={PatientStack} options={{ tabBarLabel: 'Patients' }} />}
      {hasViewDoctors && <Tab.Screen name="Doctors" component={DoctorStack} options={{ tabBarLabel: 'Doctors' }} />}
      {hasViewInventory && <Tab.Screen name="Inventory" component={InventoryStack} options={{ tabBarLabel: 'Stock' }} />}
      {hasViewBilling && <Tab.Screen name="Billing" component={BillingStack} options={{ tabBarLabel: 'Billing' }} />}
      {hasViewIncome && <Tab.Screen name="Income" component={IncomeStack} options={{ tabBarLabel: 'Income' }} />}
      {hasManagePermissions && <Tab.Screen name="Staff" component={StaffStack} options={{ tabBarLabel: 'Staff' }} />}
    </Tab.Navigator>
  );
}

function PharmacistTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Pharmacist Home" component={PharmacistDashboardStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Inventory" component={InventoryStack} options={{ tabBarLabel: 'Stock' }} />
      <Tab.Screen name="Billing" component={BillingStack} options={{ tabBarLabel: 'Billing' }} />
    </Tab.Navigator>
  );
}

function AccountantTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Accountant Home" component={AccountantDashboardStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Billing" component={BillingStack} options={{ tabBarLabel: 'Billing' }} />
      <Tab.Screen name="Finance" component={IncomeStack} options={{ tabBarLabel: 'Finance' }} />
    </Tab.Navigator>
  );
}

function AdminScheduleStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="AdminSchedule" component={AdminScheduleScreen} options={{ title: 'Schedule' }} />
      <Stack.Screen name="AppointmentList" component={AppointmentListScreen} options={{ title: 'Doctor Appointments' }} />
    </Stack.Navigator>
  );
}

function SalaryStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts }}>
      <Stack.Screen name="SalaryMain" component={SalaryScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Admin Dashboard" component={AdminDashboardStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Calendar" component={AdminScheduleStack} options={{ tabBarLabel: 'Schedule' }} />
      <Tab.Screen name="Patients" component={PatientStack} options={{ tabBarLabel: 'Patients' }} />
      <Tab.Screen name="Doctors" component={DoctorStack} options={{ tabBarLabel: 'Doctors' }} />
      <Tab.Screen name="Staff" component={StaffStack} options={{ tabBarLabel: 'Staff' }} />
      <Tab.Screen name="Salary" component={SalaryStack} options={{ tabBarLabel: 'Salary' }} />
      <Tab.Screen name="Billing" component={BillingStack} options={{ tabBarLabel: 'Billing' }} />
      <Tab.Screen name="Inventory" component={InventoryStack} options={{ tabBarLabel: 'Stock' }} />
      <Tab.Screen name="Finance" component={IncomeStack} options={{ tabBarLabel: 'Finance' }} />
    </Tab.Navigator>
  );
}

function PatientTabs() {
  const headerWithSignout = {
    headerStyle: { backgroundColor: colors.primary, elevation: 0, shadowOpacity: 0 },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: { fontWeight: '700', fontSize: 17, letterSpacing: -0.3 },
    headerShadowVisible: false,
    headerRight: () => <HeaderRight />,
  };

  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={PatientDashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="My Appointments" component={PatientAppointmentStack} options={{ tabBarLabel: 'Appts' }} />
      <Tab.Screen name="Medications" component={PatientMedicationScreen} options={{ tabBarLabel: 'Meds', ...headerWithSignout, title: 'My Medications' }} />
      <Tab.Screen name="Records" component={PatientRecordsScreen} options={{ tabBarLabel: 'Records', ...headerWithSignout, title: 'My Records' }} />
      <Tab.Screen name="Camps" component={PatientCampsScreen} options={{ tabBarLabel: 'Camps', ...headerWithSignout, title: 'Health Camps' }} />
      <Tab.Screen name="Calendar" component={PatientCalendarScreen} options={{ tabBarLabel: 'Calendar', ...headerWithSignout, title: 'My Calendar' }} />
      <Tab.Screen name="Profile" component={PatientProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PatientRegister" component={PatientRegisterScreen} options={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitle: 'Create Account',
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: 18, letterSpacing: -0.2 },
      }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitle: 'Forgot Password',
        headerShadowVisible: false,
      }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitle: 'Change Password',
        headerShadowVisible: false,
      }} />
      <Stack.Screen name="ServerSettings" component={ServerSettingsScreen} options={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#FFFFFF',
        headerTitle: 'Server Settings',
        headerShadowVisible: false,
      }} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { user } = useAuth();
  React.useEffect(() => { initializeApiBase(); }, []);
  if (!user) {
    return (
      <ErrorBoundary>
        <AuthStack />
      </ErrorBoundary>
    );
  }
  return (
    <ErrorBoundary>
      {user.role === 'PATIENT' ? <PatientTabs /> : 
       user.role === 'RECEPTIONIST' ? (
         user.roleTitle === 'PHARMACIST' ? <PharmacistTabs /> :
         user.roleTitle === 'ACCOUNTANT' ? <AccountantTabs /> :
         <ReceptionistTabs />
       ) : 
       user.role === 'CLINIC_ADMIN' || user.role === 'SUPER_ADMIN' ? <AdminTabs /> : 
       <MainTabs />}
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SettingsProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabOuter: { backgroundColor: colors.bg },
  tabBar: {
    flexDirection: 'row', backgroundColor: colors.surface,
    paddingTop: 6, paddingBottom: 6, paddingHorizontal: 8,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4, paddingHorizontal: 2, borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: colors.primary + '0A',
  },
  tabIcon: {
    width: 28,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconActive: {
    backgroundColor: colors.primary,
  },
  tabIconText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.tabInactive,
    letterSpacing: -0.2,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.tabInactive,
    marginTop: 1,
    letterSpacing: 0,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
