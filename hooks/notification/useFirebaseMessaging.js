import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission,
  registerDeviceForRemoteMessages,
  getToken,
} from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { ensureAndroidChannel } from './setupChannel';
import { getFcmToken, listenTokenRefresh, registerTokenWithBackend } from './registerToken';

export function useFirebaseMessaging({ accessToken }) {
  const initRef = useRef(false);                // prevent StrictMode double run
  const hasRegisteredThisLaunchRef = useRef(false); // register only once per launch
  const registeringRef = useRef(false);         // simple mutex
  const unsubRefreshRef = useRef(null);
  const unsubMessageRef = useRef(null);
  const unsubOpenedRef = useRef(null);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      try {
        // 1) OS notification permissions (optional but recommended)
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            console.warn('[FCM] Notification permission not granted');
          }
        } catch (e) {
          console.warn('[FCM] Notifications permission error:', e?.message || e);
        }

        // 2) Android notification channel
        if (Platform.OS === 'android') {
          await ensureAndroidChannel();
        }

        // 3) FCM permission + device registration (using modular API)
        const m = getMessaging(getApp());
        try { await requestPermission(m); } catch {}
        try { await registerDeviceForRemoteMessages(m); } catch {}

        // 4) Get token once and register ONCE per launch
        const token =
          (await getFcmToken()) || (await getToken(m));

        console.log('[FCM] token:', token || '(null)');

        await maybeRegisterOncePerLaunch({
          token,
          accessToken,
          hasRegisteredThisLaunchRef,
          registeringRef,
        });

        // 5) Foreground message handler
        unsubMessageRef.current = onMessage(m, async (remoteMessage) => {
          console.log('[FCM] Foreground message received:', JSON.stringify(remoteMessage));
          
          const title =
            remoteMessage?.notification?.title ||
            remoteMessage?.data?.title ||
            'Notification';
          const body =
            remoteMessage?.notification?.body ||
            remoteMessage?.data?.body ||
            '';

          try {
            // Schedule local notification with sound
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title,
                body,
                data: remoteMessage?.data || {},
                sound: true,  // Use boolean true for default sound
                priority: Notifications.AndroidNotificationPriority.MAX,
                vibrate: [0, 250, 250, 250],
                // Android specific
                ...(Platform.OS === 'android' && { 
                  channelId: 'default',
                  sticky: false,
                }),
              },
              trigger: null,  // Show immediately
            });
            console.log('[FCM] Local notification scheduled:', notificationId);
          } catch (e) {
            console.warn('[FCM] scheduleNotification error:', e?.message || e);
          }
        });

        // 6) Background tap handler
        unsubOpenedRef.current = onNotificationOpenedApp(m, (remoteMessage) => {
          console.log('[FCM] Tapped (background):', remoteMessage?.data);
        });

        // 7) Opened from killed state
        try {
          const initial = await getInitialNotification(m);
          if (initial) {
            console.log('[FCM] Opened from quit:', initial.data);
          }
        } catch {}

        // 8) Token refresh → always re-register (this bypasses the one-per-launch rule)
        unsubRefreshRef.current = listenTokenRefresh(async (t) => {
          console.log('[FCM] token refresh:', t || '(null)');
          if (!t) return;
          // On refresh we DO want to call backend again (fresh binding)
          await safeRegisterBackendOnce({ token: t, accessToken, registeringRef });
        });
      } catch (e) {
        console.warn('[FCM] init error:', e?.message || e);
      }
    })();

    return () => {
      try { unsubMessageRef.current && unsubMessageRef.current(); } catch {}
      try { unsubOpenedRef.current && unsubOpenedRef.current(); } catch {}
      try { unsubRefreshRef.current && unsubRefreshRef.current(); } catch {}
    };
  }, [accessToken]);
}

/** Register only once per app launch (ignores navigation/rerenders). */
async function maybeRegisterOncePerLaunch({
  token,
  accessToken,
  hasRegisteredThisLaunchRef,
  registeringRef,
}) {
  if (!token) return;
  if (hasRegisteredThisLaunchRef.current) return;

  await safeRegisterBackendOnce({ token, accessToken, registeringRef });

  // mark as done for this launch
  hasRegisteredThisLaunchRef.current = true;
}

/** Mutexed backend call to avoid overlapping duplicate posts. */
async function safeRegisterBackendOnce({ token, accessToken, registeringRef }) {
  if (registeringRef.current) return;
  registeringRef.current = true;
  try {
    await registerTokenWithBackend(token, accessToken);
    console.log('[FCM] Registered device token with backend');
  } catch (e) {
    console.warn('[FCM] Backend registration failed:', e?.response?.status, e?.message || e);
  } finally {
    registeringRef.current = false;
  }
}

