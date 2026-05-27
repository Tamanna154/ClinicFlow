import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors, shadows, borderRadius } from './src/theme';

import CalendarScreen from './src/screens/CalendarScreen';
import PatientListScreen from './src/screens/PatientListScreen';
import PatientFormScreen from './src/screens/PatientFormScreen';
import PatientDetailScreen from './src/screens/PatientDetailScreen';
import DoctorListScreen from './src/screens/DoctorListScreen';
import DoctorFormScreen from './src/screens/DoctorFormScreen';
import DoctorDetailScreen from './src/screens/DoctorDetailScreen';
import AppointmentListScreen from './src/screens/AppointmentListScreen';
import AppointmentBookingScreen from './src/screens/AppointmentBookingScreen';
import AppointmentDetailScreen from './src/screens/AppointmentDetailScreen';
import BulkSmsScreen from './src/screens/BulkSmsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const headerOpts = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700', fontSize: 18, letterSpacing: -0.2 },
  headerShadowVisible: false,
};

function TabIcon({ label, focused }) {
  const icon = { Patients: 'P', Doctors: 'D', Appointments: 'A', Calendar: 'C' }[label] || '?';
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
      <Tab.Screen name="Patients" component={PatientStack} />
      <Tab.Screen name="Calendar" component={CalendarStack} />
      {isDoctor && <Tab.Screen name="Doctors" component={DoctorStack} />}
      <Tab.Screen name="Appointments" component={AppointmentStack} />
    </Tab.Navigator>
  );
}

function AppContent() {
  return (
    <NavigationContainer>
      <MainTabs />
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
