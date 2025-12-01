import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        console.log('Notification tapped:', response);
      }
    );
    return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
