// hooks/notification/index.js
// Central export for all notification-related hooks and utilities

export { 
  useNotifee, 
  setupBackgroundHandler, 
  setupNotifeeChannels,
  displayNotification,
  handleDeepLink,
} from './useNotifee';
export { ensureAndroidChannel } from './setupChannel';
export { getFcmToken, listenTokenRefresh, registerTokenWithBackend } from './registerToken';

// Note: useFirebaseMessaging is deprecated - use useNotifee instead
// which handles FCM registration, channels, and rich notifications
