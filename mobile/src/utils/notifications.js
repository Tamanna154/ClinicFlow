import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medication', {
      name: 'Medication Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#14B8A6',
      sound: 'default',
    });
  }
  return true;
}

export async function scheduleMedicationNotification(medicineName, dosage, timingLabel) {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Medication Reminder',
      body: `Time to take: ${medicineName} (${dosage}) - ${timingLabel}`,
      sound: 'default',
      priority: Notifications.AndroidImportance.HIGH,
      data: { type: 'medication' },
    },
    trigger: null,
  });
  return id;
}

export async function scheduleFamilyNotification(familyMemberName, medicineName, dosage) {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '👨‍👩‍👧‍👦 Family Medication Alert',
      body: `${familyMemberName} needs to take: ${medicineName} (${dosage})`,
      sound: 'default',
      priority: Notifications.AndroidImportance.HIGH,
      data: { type: 'family_medication' },
    },
    trigger: null,
  });
  return id;
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
