// hooks/notification/useNotifee.js
import { useEffect, useRef } from 'react';
import { Platform, Linking } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
  AndroidCategory,
} from '@notifee/react-native';
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
import { getFcmToken, listenTokenRefresh, registerTokenWithBackend } from './registerToken';

// Global initialization flags (persists across component re-renders and StrictMode)
let globalInitialized = false;
let globalChannelsCreated = false;
// Track registration per app session - will be reset on fresh app start
let sessionRegistrationAttempted = false;

// Channel configurations for different notification types
const NOTIFICATION_CHANNELS = {
  DEFAULT: {
    id: 'default',
    name: 'Default Notifications',
    description: 'General app notifications',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    lights: true,
    lightColor: '#5F259F',
  },
  MEETINGS: {
    id: 'meetings',
    name: 'Meetings & Calls',
    description: 'Meeting invites and call notifications',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    lights: true,
    lightColor: '#4CAF50',
  },
  TRANSACTIONS: {
    id: 'transactions',
    name: 'Transactions',
    description: 'Payment and transaction alerts',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    lights: true,
    lightColor: '#FF9800',
    bypassDnd: true,
  },
  PROMOTIONS: {
    id: 'promotions',
    name: 'Promotions & Offers',
    description: 'Special offers and promotions',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
    vibration: true,
  },
};

// Create notification channels for Android (only once)
export async function setupNotifeeChannels() {
  if (Platform.OS !== 'android') return;
  if (globalChannelsCreated) {
    console.log('[Notifee] Channels already created, skipping...');
    return;
  }

  try {
    // Create all channels
    for (const channel of Object.values(NOTIFICATION_CHANNELS)) {
      await notifee.createChannel(channel);
      console.log(`[Notifee] Channel created: ${channel.id}`);
    }
    globalChannelsCreated = true;
  } catch (error) {
    console.warn('[Notifee] Error creating channels:', error?.message || error);
  }
}

// Determine channel based on notification data
function getChannelForNotification(data) {
  if (!data) return NOTIFICATION_CHANNELS.DEFAULT.id;

  const template = data?.template?.toLowerCase() || '';
  const deepLink = data?.deep_link || '';

  if (template.includes('meeting') || deepLink.includes('meet') || data?.meeting_title) {
    return NOTIFICATION_CHANNELS.MEETINGS.id;
  }
  if (template.includes('transaction') || template.includes('payment')) {
    return NOTIFICATION_CHANNELS.TRANSACTIONS.id;
  }
  if (template.includes('offer') || template.includes('promo')) {
    return NOTIFICATION_CHANNELS.PROMOTIONS.id;
  }

  return NOTIFICATION_CHANNELS.DEFAULT.id;
}

// Handle deep link navigation
export async function handleDeepLink(data, navigation = null) {
  if (!data) return false;

  const deepLink = data?.deep_link || data?.meet_url || data?.action_url;

  if (!deepLink) return false;

  try {
    // Check if it's an external URL (http/https/meet/zoom etc.)
    const isExternalUrl =
      deepLink.startsWith('http') ||
      deepLink.startsWith('https') ||
      deepLink.includes('meet.google.com') ||
      deepLink.includes('zoom.us') ||
      deepLink.includes('teams.microsoft.com');

    if (isExternalUrl) {
      const canOpen = await Linking.canOpenURL(deepLink);
      if (canOpen) {
        await Linking.openURL(deepLink);
        console.log('[Notifee] Opened external URL:', deepLink);
        return true;
      }
    }

    // Handle internal app deep links
    // Format: odhpay://screen/ScreenName?param=value
    if (deepLink.startsWith('odhpay://') && navigation) {
      const urlParts = deepLink.replace('odhpay://', '').split('/');
      const screenName = urlParts[1] || urlParts[0];
      const params = {};

      // Parse query params if any
      if (deepLink.includes('?')) {
        const queryString = deepLink.split('?')[1];
        const pairs = queryString.split('&');
        pairs.forEach((pair) => {
          const [key, value] = pair.split('=');
          params[key] = decodeURIComponent(value || '');
        });
      }

      navigation.navigate(screenName, params);
      console.log('[Notifee] Navigated to:', screenName, params);
      return true;
    }

    // Fallback: try to open any URL
    await Linking.openURL(deepLink);
    return true;
  } catch (error) {
    console.warn('[Notifee] Error handling deep link:', error?.message || error);
    return false;
  }
}

// Display notification using Notifee
export async function displayNotification(remoteMessage) {
  if (!remoteMessage) return;

  const notification = remoteMessage?.notification || {};
  const data = remoteMessage?.data || {};

  // Extract notification content
  const title = notification?.title || data?.title || 'ODH Pay';
  const body = notification?.body || data?.body || '';
  const imageUrl = notification?.imageUrl || data?.image_url || data?.imageUrl;

  // Get appropriate channel
  const channelId = getChannelForNotification(data);

  // Build notification options
  const notificationOptions = {
    title,
    body,
    data,
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      // Use ic_launcher (default app icon) as fallback - it always exists
      // For custom icon, create ic_notification in android/app/src/main/res/drawable
      smallIcon: 'ic_launcher',
      color: '#5F259F',
      category: data?.meeting_title ? AndroidCategory.CALL : AndroidCategory.MESSAGE,
    },
    ios: {
      foregroundPresentationOptions: {
        badge: true,
        sound: true,
        banner: true,
        list: true,
      },
    },
  };

  // Add big picture style for image notifications
  if (imageUrl) {
    notificationOptions.android.style = {
      type: AndroidStyle.BIGPICTURE,
      picture: imageUrl,
    };
    notificationOptions.android.largeIcon = imageUrl;
  }

  // Add actions for meeting notifications
  if (data?.has_actions === 'true' && data?.meeting_title) {
    notificationOptions.android.actions = [
      {
        title: '📞 Join Meeting',
        pressAction: {
          id: 'join_meeting',
        },
      },
      {
        title: '❌ Dismiss',
        pressAction: {
          id: 'dismiss',
        },
      },
    ];
  }

  try {
    const notificationId = await notifee.displayNotification(notificationOptions);
    console.log('[Notifee] Notification displayed:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('[Notifee] Error displaying notification:', error?.message || error);
    return null;
  }
}

// Main hook for handling notifications with Notifee
export function useNotifee({ accessToken, navigation }) {
  const unsubRefreshRef = useRef(null);
  const unsubMessageRef = useRef(null);
  const unsubOpenedRef = useRef(null);
  const unsubNotifeeRef = useRef(null);
  const registeringRef = useRef(false);
  const hasRegisteredThisMount = useRef(false);

  // Effect to register device when accessToken is available
  // This runs on every mount AND when accessToken changes
  useEffect(() => {
    // Skip if no access token or already registered this component mount
    if (!accessToken) {
      console.log('[FCM] No access token yet, waiting...');
      return;
    }
    if (hasRegisteredThisMount.current) {
      console.log('[FCM] Already registered this mount, skipping...');
      return;
    }
    if (sessionRegistrationAttempted) {
      console.log('[FCM] Already attempted registration this session, skipping...');
      return;
    }

    (async () => {
      try {
        console.log('[FCM] Attempting device registration with backend...');
        sessionRegistrationAttempted = true;
        hasRegisteredThisMount.current = true;

        // Get FCM token
        const m = getMessaging(getApp());
        const token = (await getFcmToken()) || (await getToken(m));
        
        if (!token) {
          console.warn('[FCM] Could not get FCM token');
          sessionRegistrationAttempted = false; // Allow retry
          hasRegisteredThisMount.current = false;
          return;
        }

        console.log('[FCM] Got token, registering with backend...');
        const result = await registerTokenWithBackend(token);
        
        if (result?.success) {
          console.log('[FCM] ✅ Device registered successfully with backend!');
        } else {
          console.warn('[FCM] ❌ Registration failed:', result);
          // Allow retry on next mount if failed
          sessionRegistrationAttempted = false;
          hasRegisteredThisMount.current = false;
        }
      } catch (e) {
        console.warn('[FCM] Registration error:', e?.message || e);
        sessionRegistrationAttempted = false;
        hasRegisteredThisMount.current = false;
      }
    })();
  }, [accessToken]);

  useEffect(() => {
    // Global guard to prevent multiple initializations across re-renders/StrictMode
    if (globalInitialized) {
      console.log('[Notifee] Already initialized globally, skipping...');
      return;
    }
    globalInitialized = true;

    (async () => {
      try {
        // 1) Request notification permission
        const settings = await notifee.requestPermission();
        console.log('[Notifee] Permission status:', settings.authorizationStatus);

        // 2) Setup Android channels (has its own guard)
        await setupNotifeeChannels();

        // 3) FCM setup
        const m = getMessaging(getApp());
        try {
          await requestPermission(m);
        } catch {}
        try {
          await registerDeviceForRemoteMessages(m);
        } catch {}

        // 4) Get and log FCM token (registration is handled in separate effect)
        const token = (await getFcmToken()) || (await getToken(m));
        console.log('[FCM] Token:', token?.substring(0, 20) + '...');

        // 5) Foreground message handler - display with Notifee
        unsubMessageRef.current = onMessage(m, async (remoteMessage) => {
          console.log('[FCM] Foreground message:', JSON.stringify(remoteMessage?.data));
          await displayNotification(remoteMessage);
        });

        // 6) Background tap handler (FCM)
        unsubOpenedRef.current = onNotificationOpenedApp(m, async (remoteMessage) => {
          console.log('[FCM] Background tap:', remoteMessage?.data);
          await handleDeepLink(remoteMessage?.data, navigation);
        });

        // 7) App opened from killed state
        try {
          const initial = await getInitialNotification(m);
          if (initial) {
            console.log('[FCM] Opened from quit:', initial.data);
            await handleDeepLink(initial.data, navigation);
          }
        } catch {}

        // 8) Notifee event listener for foreground/background actions
        unsubNotifeeRef.current = notifee.onForegroundEvent(async ({ type, detail }) => {
          const { notification, pressAction } = detail;

          switch (type) {
            case EventType.DISMISSED:
              console.log('[Notifee] Notification dismissed:', notification?.id);
              break;

            case EventType.PRESS:
              console.log('[Notifee] Notification pressed:', notification?.data);
              await handleDeepLink(notification?.data, navigation);
              break;

            case EventType.ACTION_PRESS:
              console.log('[Notifee] Action pressed:', pressAction?.id);
              if (pressAction?.id === 'join_meeting') {
                await handleDeepLink(notification?.data, navigation);
              }
              // Cancel notification if action was taken
              if (notification?.id) {
                await notifee.cancelNotification(notification.id);
              }
              break;
          }
        });

        // 9) Token refresh listener - re-register when token changes
        unsubRefreshRef.current = listenTokenRefresh(async (t) => {
          console.log('[FCM] Token refresh:', t?.substring(0, 20) + '...');
          if (!t) return;
          // Re-register with new token
          const result = await registerTokenWithBackend(t);
          if (result?.success) {
            console.log('[FCM] ✅ Refreshed token registered with backend');
          }
        });
      } catch (e) {
        console.warn('[Notifee] Init error:', e?.message || e);
      }
    })();

    return () => {
      try {
        unsubMessageRef.current?.();
      } catch {}
      try {
        unsubOpenedRef.current?.();
      } catch {}
      try {
        unsubRefreshRef.current?.();
      } catch {}
      try {
        unsubNotifeeRef.current?.();
      } catch {}
    };
  }, [accessToken, navigation]);
}

// Background event handler - MUST be registered at app root level
export function setupBackgroundHandler() {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;

    switch (type) {
      case EventType.DISMISSED:
        console.log('[Notifee:BG] Notification dismissed');
        break;

      case EventType.PRESS:
        console.log('[Notifee:BG] Notification pressed:', notification?.data);
        // Deep link will be handled when app opens
        break;

      case EventType.ACTION_PRESS:
        console.log('[Notifee:BG] Action pressed:', pressAction?.id);
        if (pressAction?.id === 'join_meeting' && notification?.data) {
          const deepLink =
            notification.data?.deep_link ||
            notification.data?.meet_url;
          if (deepLink) {
            await Linking.openURL(deepLink);
          }
        }
        break;
    }
  });
}

/** Mutex-protected backend registration (uses ref to prevent concurrent calls) */
async function safeRegisterBackendOnce({ token, accessToken, registeringRef }) {
  if (registeringRef.current) return { success: false, reason: 'already_registering' };
  registeringRef.current = true;
  try {
    const result = await registerTokenWithBackend(token, accessToken);
    if (result?.success) {
      console.log('[FCM] Registered device token with backend');
      return { success: true };
    } else {
      console.warn('[FCM] Backend registration returned:', result);
      return result;
    }
  } catch (e) {
    console.warn('[FCM] Backend registration failed:', e?.response?.status, e?.message || e);
    return { success: false, error: e?.message || e };
  } finally {
    registeringRef.current = false;
  }
}

export default useNotifee;
