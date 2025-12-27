import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  AuthorizationStatus,
  getToken,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export async function getFcmToken() {
  const m = getMessaging(getApp());
  const status = await requestPermission(m);
  const enabled =
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL;
  if (!enabled) return null;
  return await getToken(m);
}

export function listenTokenRefresh(cb) {
  const m = getMessaging(getApp());
  // returns unsubscribe function
  return onTokenRefresh(m, cb);
}

export async function registerTokenWithBackend(token) {
  const access_token = await AsyncStorage.getItem("access_token");
  
  // Don't attempt registration without access token
  if (!access_token) {
    console.log('[FCM] No access token available, skipping backend registration');
    return { success: false, reason: 'no_access_token' };
  }

  if (!token) {
    console.log('[FCM] No FCM token available, skipping backend registration');
    return { success: false, reason: 'no_fcm_token' };
  }

  try {
    const res = await fetch('https://newapi.odhpay.com/notification/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ token, platform: Platform.OS, "app_version": "1.0.0" }),
    });

    const responseData = await res.json().catch(() => null);
    
    if (res.ok) {
      console.log("[FCM] Device registered successfully with backend:", responseData);
      // Store registration status
      await AsyncStorage.setItem('notification_registered', 'true');
      await AsyncStorage.setItem('fcm_token', token);
      return { success: true, data: responseData };
    } else {
      console.warn("[FCM] Backend registration failed:", res.status, responseData);
      return { success: false, status: res.status, data: responseData };
    }
  } catch (e) {
    console.warn('Failed to register FCM token:', e);
    return { success: false, error: e.message };
  }
}

export async function unregisterTokenWithBackend(token = null) {
  const access_token = await AsyncStorage.getItem("access_token");
  
  // Don't attempt unregistration without access token
  if (!access_token) {
    console.log('[FCM] No access token available, skipping backend unregistration');
    return { success: false, reason: 'no_access_token' };
  }

  // Get stored token if not provided
  const fcmToken = token || await AsyncStorage.getItem('fcm_token');
  
  if (!fcmToken) {
    console.log('[FCM] No FCM token available, skipping backend unregistration');
    return { success: false, reason: 'no_fcm_token' };
  }

  try {
    const res = await fetch('https://newapi.odhpay.com/notification/unregister', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ token: fcmToken }),
    });

    const responseData = await res.json().catch(() => null);
    
    if (res.ok) {
      console.log("[FCM] Device unregistered successfully from backend:", responseData);
      // Update registration status
      await AsyncStorage.setItem('notification_registered', 'false');
      return { success: true, data: responseData };
    } else {
      console.warn("[FCM] Backend unregistration failed:", res.status, responseData);
      return { success: false, status: res.status, data: responseData };
    }
  } catch (e) {
    console.warn('Failed to unregister FCM token:', e);
    return { success: false, error: e.message };
  }
}

export async function getNotificationStatus() {
  try {
    const status = await AsyncStorage.getItem('notification_registered');
    return status === 'true';
  } catch (e) {
    console.warn('Failed to get notification status:', e);
    return true; // Default to true if unable to check
  }
}

