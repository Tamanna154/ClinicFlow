import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { colors, shadows, borderRadius } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import PatientRegisterScreen from './src/screens/PatientRegisterScreen';
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
import StaffListScreen from './src/screens/StaffListScreen';
import StaffFormScreen from './src/screens/StaffFormScreen';
import PermissionsScreen from './src/screens/PermissionsScreen';
import InventoryListScreen from './src/screens/InventoryListScreen';
import InventoryFormScreen from './src/screens/InventoryFormScreen';
import InventoryDetailScreen from './src/screens/InventoryDetailScreen';
import InventoryDashboardScreen from './src/screens/InventoryDashboardScreen';
import BillingDashboardScreen from './src/screens/BillingDashboardScreen';
import MedicineBillingScreen from './src/screens/MedicineBillingScreen';
import BillDetailScreen from './src/screens/BillDetailScreen';
import IncomeDashboardScreen from './src/screens/IncomeDashboardScreen';
import CurrencySettingsScreen from './src/screens/CurrencySettingsScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';

import ErrorBoundary from './src/components/ErrorBoundary';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const headerOpts = {
  headerStyle: { backgroundColor: colors.primary, elevation: 0, shadowOpacity: 0 },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700', fontSize: 17, letterSpacing: -0.3 },
  headerShadowVisible: false,
};

const TAB_ICONS = {
  Patients: '👤', Doctors: '⚕', Appointments: '📅', Appts: '📅',
  Calendar: '📋', Schedule: '📋',
  Dashboard: '⌂', 'My Appointments': '📅', 'My Profile': '⚙', 'My Bookings': '📅',
  Staff: '👥', Inventory: '📦', Stock: '📦',
  Billing: '💰', Income: '📊',
};

function TabIcon({ label, focused }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.tabIconText, focused && { color: '#FFFFFF' }]}>{TAB_ICONS[label] || '?'}</Text>
    </View>
  );
}

function LogoutButton({ tintColor }) {
  const { logout } = useAuth();
  return (
    <TouchableOpacity
      onPress={() => Alert.alert('Logout', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ])}
      style={{ marginRight: 8, padding: 8 }}
      activeOpacity={0.6}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={{ fontSize: 17, color: tintColor || '#FFFFFF', fontWeight: '700' }}>↩</Text>
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
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Appointment' }} />
    </Stack.Navigator>
  );
}

function AppointmentStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="AppointmentList" component={AppointmentListScreen} options={{ title: 'Appointments' }} />
      <Stack.Screen name="AppointmentBooking" component={AppointmentBookingScreen} options={{ title: 'Book Appointment' }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Appointment' }} />
    </Stack.Navigator>
  );
}

function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ ...headerOpts, headerRight: () => <HeaderRight /> }}>
      <Stack.Screen name="CalendarMain" component={CalendarScreen} options={{ title: 'Schedule' }} />
      <Stack.Screen name="CalendarBooking" component={AppointmentBookingScreen} options={{ title: 'Book Appointment' }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Appointment' }} />
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
      <Stack.Screen name="StaffList" component={StaffListScreen} options={{ title: 'Staff' }} />
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
    </Stack.Navigator>
  );
}

function PatientDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  return (
    <View style={patientStyles.container}>
      <View style={patientStyles.header}>
        <TouchableOpacity style={patientStyles.headerLogout} onPress={() => Alert.alert('Logout', 'Are you sure you want to sign out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: logout },
        ])} activeOpacity={0.7}>
          <Text style={{ fontSize: 18, color: '#FFFFFFCC' }}>↩</Text>
        </TouchableOpacity>
        <View style={patientStyles.avatar}>
          <Text style={patientStyles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
        </View>
        <Text style={patientStyles.greeting}>Welcome, {user?.name || 'Patient'}</Text>
        <Text style={patientStyles.role}>Patient Portal</Text>
      </View>
      <ScrollView contentContainerStyle={patientStyles.cardsContainer}>
        <TouchableOpacity style={[patientStyles.btn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('My Appointments', { screen: 'PatientAppointmentList' })} activeOpacity={0.85}>
          <Text style={patientStyles.btnText}>My Appointments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[patientStyles.btn, { backgroundColor: colors.primaryLight }]} onPress={() => navigation.navigate('My Appointments', { screen: 'PatientReports' })} activeOpacity={0.85}>
          <Text style={patientStyles.btnText}>My Reports</Text>
        </TouchableOpacity>
        <View style={patientStyles.infoCard}>
          <Text style={patientStyles.infoLabel}>Username</Text>
          <Text style={patientStyles.infoValue}>{user?.username || '-'}</Text>
        </View>
        <View style={patientStyles.infoCard}>
          <Text style={patientStyles.infoLabel}>Email</Text>
          <Text style={patientStyles.infoValue}>{user?.email || '-'}</Text>
        </View>
        <View style={patientStyles.infoCard}>
          <Text style={patientStyles.infoLabel}>Phone</Text>
          <Text style={patientStyles.infoValue}>{user?.phone || '-'}</Text>
        </View>
        <TouchableOpacity style={patientStyles.logoutBtn} onPress={() => Alert.alert('Logout', 'Are you sure you want to sign out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: logout },
        ])} activeOpacity={0.85}>
          <Text style={patientStyles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function PatientProfileScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={patientStyles.container}>
      <View style={patientStyles.header}>
        <TouchableOpacity style={patientStyles.headerLogout} onPress={() => Alert.alert('Logout', 'Are you sure you want to sign out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: logout },
        ])} activeOpacity={0.7}>
          <Text style={{ fontSize: 18, color: '#FFFFFFCC' }}>↩</Text>
        </TouchableOpacity>
        <View style={patientStyles.avatar}>
          <Text style={patientStyles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
        </View>
        <Text style={patientStyles.greeting}>{user?.name || 'Patient'}</Text>
        <Text style={patientStyles.role}>Patient Portal</Text>
      </View>
      <ScrollView contentContainerStyle={patientStyles.cardsContainer}>
        <View style={patientStyles.infoCard}>
          <Text style={patientStyles.infoLabel}>Username</Text>
          <Text style={patientStyles.infoValue}>{user?.username || '-'}</Text>
        </View>
        <View style={patientStyles.infoCard}>
          <Text style={patientStyles.infoLabel}>Role</Text>
          <Text style={patientStyles.infoValue}>{user?.role || '-'}</Text>
        </View>
        <TouchableOpacity style={patientStyles.logoutBtn} onPress={() => Alert.alert('Logout', 'Are you sure you want to sign out?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: logout },
        ])} activeOpacity={0.85}>
          <Text style={patientStyles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const patientStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF20', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  role: { fontSize: 13, color: '#FFFFFFAA', marginTop: 4 },
  cardsContainer: { padding: 20 },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 16, marginBottom: 12,
    ...shadows.sm, borderWidth: 1, borderColor: colors.borderLight,
  },
  infoLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  headerLogout: { position: 'absolute', top: 52, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF15', justifyContent: 'center', alignItems: 'center' },
  logoutBtn: {
    backgroundColor: colors.error, borderRadius: borderRadius.md, paddingVertical: 14,
    alignItems: 'center', marginTop: 20, ...shadows.md,
  },
  logoutBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  btn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: 14,
    alignItems: 'center', marginTop: 8, ...shadows.md,
  },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

function MyTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabOuter}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || route.name;
          const isFocused = state.index === index;
          return (
            <TouchableOpacity key={route.key} style={styles.tabItem} onPress={() => {
              const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !ev.defaultPrevented) navigation.navigate(route.name);
            }}>
              <TabIcon label={label} focused={isFocused} />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
              {isFocused && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';

  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Calendar" component={CalendarStack} options={{ tabBarLabel: 'Schedule' }} />
      <Tab.Screen name="Appointments" component={AppointmentStack} options={{ tabBarLabel: 'Appts' }} />
      <Tab.Screen name="Patients" component={PatientStack} options={{ tabBarLabel: 'Patients' }} />
      {isDoctor && <Tab.Screen name="Doctors" component={DoctorStack} options={{ tabBarLabel: 'Doctors' }} />}
      <Tab.Screen name="Inventory" component={InventoryStack} options={{ tabBarLabel: 'Stock' }} />
      <Tab.Screen name="Billing" component={BillingStack} options={{ tabBarLabel: 'Billing' }} />
      {isDoctor && <Tab.Screen name="Income" component={IncomeStack} options={{ tabBarLabel: 'Income' }} />}
      {isDoctor && <Tab.Screen name="Staff" component={StaffStack} options={{ tabBarLabel: 'Staff' }} />}
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

function PatientTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={PatientDashboardScreen} />
      <Tab.Screen name="My Appointments" component={PatientAppointmentStack} />
      <Tab.Screen name="My Profile" component={PatientProfileScreen} />
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
    </Stack.Navigator>
  );
}

function AppContent() {
  const { user } = useAuth();
  if (!user) {
    return (
      <NavigationContainer>
        <ErrorBoundary>
          <AuthStack />
        </ErrorBoundary>
      </NavigationContainer>
    );
  }
  return (
    <NavigationContainer>
      <ErrorBoundary>
        {user.role === 'PATIENT' ? <PatientTabs /> : user.role === 'RECEPTIONIST' ? <ReceptionistTabs /> : <MainTabs />}
      </ErrorBoundary>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabOuter: { backgroundColor: colors.bg, paddingBottom: 8, paddingTop: 0 },
  tabBar: {
    flexDirection: 'row', backgroundColor: colors.surface, marginHorizontal: 12,
    borderRadius: 16, paddingVertical: 4, paddingHorizontal: 4,
    ...shadows.lg,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  tabIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  tabIconActive: { backgroundColor: colors.primary },
  tabIconText: { fontSize: 16, color: colors.tabInactive },
  tabLabel: { fontSize: 9, fontWeight: '600', color: colors.tabInactive, marginTop: 2, letterSpacing: -0.1 },
  tabLabelActive: { color: colors.primary, fontWeight: '700' },
  indicator: { width: 14, height: 2.5, borderRadius: 1.25, backgroundColor: colors.primary, marginTop: 4 },
});
