import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PatientListScreen from './src/screens/PatientListScreen';
import PatientFormScreen from './src/screens/PatientFormScreen';
import PatientDetailScreen from './src/screens/PatientDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
        initialRouteName="PatientList"
        screenOptions={{
          headerStyle: { backgroundColor: '#1E3A8A' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700', fontSize: 20 },
        }}
      >
        <Stack.Screen
          name="PatientList"
          component={PatientListScreen}
          options={{ title: 'Patients' }}
        />
        <Stack.Screen
          name="PatientForm"
          component={PatientFormScreen}
          options={({ route }) => ({
            title: route.params?.patient ? 'Edit Patient' : 'Add Patient',
          })}
        />
        <Stack.Screen
          name="PatientDetail"
          component={PatientDetailScreen}
          options={({ route }) => ({
            title: route.params?.patient?.name || 'Patient',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}
