// hooks/notification/setupChannel.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  // Delete old channels to reset any cached settings (sound disabled by user, etc.)
  try {
    await Notifications.deleteNotificationChannelAsync('default');
    console.log('[Notifications] Deleted old default channel');
  } catch (e) {
    // Channel might not exist, ignore
  }

  // Default notification channel with sound - IMPORTANCE_HIGH required for sound
  const channel = await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    description: 'General notifications with sound',
    importance: Notifications.AndroidImportance.HIGH, // HIGH is minimum for sound
    sound: 'default',           // Uses system default notification sound
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
    showBadge: true,
    enableLights: true,
    lightColor: '#FF6200EE',
    enableVibrate: true,
  });
  
  console.log('[Notifications] Default channel created:', JSON.stringify(channel));

  // Delete and recreate transactions channel
  try {
    await Notifications.deleteNotificationChannelAsync('transactions');
  } catch (e) {
    // Channel might not exist, ignore
  }

  // High priority channel for transactions/payments
  const txChannel = await Notifications.setNotificationChannelAsync('transactions', {
    name: 'Transactions',
    description: 'Payment and transaction alerts',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 500, 200, 500],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,  // Can bypass Do Not Disturb for important transactions
    showBadge: true,
    enableLights: true,
    lightColor: '#4CAF50',
    enableVibrate: true,
  });
  
  console.log('[Notifications] Transactions channel created:', JSON.stringify(txChannel));
}
