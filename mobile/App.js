import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const headerOpts = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700', fontSize: 18, letterSpacing: -0.2 },
  headerShadowVisible: false,
};

function TabIcon({ label, focused }) {
  const icons = { Patients: 'P', Doctors: 'D', Appointments: 'A', Calendar: 'C', Dashboard: 'H', 'My Profile': 'M' };
  const icon = icons[label] || '?';
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.tabIconText, focused && styles.tabIconTextActive]}>{icon}</Text>
    </View>
  );
}

function PatientStack() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="PatientList" component={PatientListScreen} options={{ title: 'Patients' }} />
      <Stack.Screen name="PatientForm" component={PatientFormScreen} options={({ route }) => ({ title: route.params?.patient ? 'Edit Patient' : 'New Patient' })} />
      <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={({ route }) => ({ title: route.params?.patient?.name || 'Patient' })} />
      <Stack.Screen name="BulkSms" component={BulkSmsScreen} options={{ title: 'Bulk SMS' }} />
    </Stack.Navigator>
  );
}

function DoctorStack() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>
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
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="AppointmentList" component={AppointmentListScreen} options={{ title: 'Appointments' }} />
      <Stack.Screen name="AppointmentBooking" component={AppointmentBookingScreen} options={{ title: 'Book Appointment' }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Appointment' }} />
    </Stack.Navigator>
  );
}

function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>
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

function PatientAppointmentStack() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="PatientAppointmentList" component={PatientAppointmentsScreen} options={{ title: 'My Appointments' }} />
      <Stack.Screen name="PatientBooking" component={PatientBookingScreen} options={{ title: 'Book Appointment' }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Appointment' }} />
    </Stack.Navigator>
  );
}

function PatientDashboardScreen() {
  const { user } = useAuth();
  return (
    <View style={patientStyles.container}>
      <View style={patientStyles.header}>
        <View style={patientStyles.avatar}>
          <Text style={patientStyles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
        </View>
        <Text style={patientStyles.greeting}>Welcome, {user?.name || 'Patient'}</Text>
        <Text style={patientStyles.role}>Patient Portal</Text>
      </View>
      <ScrollView contentContainerStyle={patientStyles.cardsContainer}>
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
      </ScrollView>
    </View>
  );
}

function PatientProfileScreen() {
  const { user } = useAuth();
  return (
    <View style={patientStyles.container}>
      <View style={patientStyles.header}>
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
  const isPatient = user?.role === 'PATIENT';

  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Patients" component={PatientStack} />
      <Tab.Screen name="Calendar" component={CalendarStack} />
      {isDoctor && <Tab.Screen name="Doctors" component={DoctorStack} />}
      {isPatient && <Tab.Screen name="My Bookings" component={PatientPortalStack} />}
      <Tab.Screen name="Appointments" component={AppointmentStack} />
    </Tab.Navigator>
  );
}

function ReceptionistTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Patients" component={PatientStack} />
      <Tab.Screen name="Calendar" component={CalendarStack} />
      <Tab.Screen name="Appointments" component={AppointmentStack} />
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="PatientRegister" component={PatientRegisterScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { user } = useAuth();
  if (!user) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }
  return (
    <NavigationContainer>
      {user.role === 'PATIENT' ? <PatientTabs /> : user.role === 'RECEPTIONIST' ? <ReceptionistTabs /> : <MainTabs />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabOuter: { backgroundColor: colors.bg, paddingBottom: 8, paddingTop: 0 },
  tabBar: {
    flexDirection: 'row', backgroundColor: colors.surface, marginHorizontal: 16,
    borderRadius: borderRadius.xl, paddingVertical: 8, paddingHorizontal: 8,
    ...shadows.lg, borderWidth: 1, borderColor: colors.borderLight,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  tabIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  tabIconActive: { backgroundColor: colors.primary + '15' },
  tabIconText: { fontSize: 13, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 },
  tabIconTextActive: { color: colors.primary },
  tabLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, marginTop: 1 },
  tabLabelActive: { color: colors.primary, fontWeight: '700' },
  indicator: { width: 20, height: 2, borderRadius: 1, backgroundColor: colors.primary, marginTop: 3 },
});
