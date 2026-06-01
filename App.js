import React, { useEffect, useRef, useState } from "react";
import { StatusBar, Platform } from "react-native";
import AppNavigator from "./AppNavigator";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import * as Notifications from "expo-notifications";
import { useNotifee } from "./hooks/notification/useNotifee";
import { configureGoogleSignin } from "./components/auth/FirebaseAuthUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Theme from "./components/Theme";

// In-App Update imports
import useInAppUpdate, { UpdateType } from "./hooks/useInAppUpdate";
import UpdateModal from "./components/miscellaneous/UpdateModal";

// Debug API Logger - logs all API calls in development
import { setupApiLogger } from "./utils/apiLogger";
import axios from "axios";

// Initialize API logging (only in __DEV__ mode)
if (__DEV__) {
  setupApiLogger(axios);
  console.log("🔧 Debug mode: API logging enabled");
}

// Global notification handler (once at module load)
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('[App] Handling notification:', notification);
    return {
      shouldShowBanner: true,    // Show notification banner at top
      shouldShowList: true,      // Show in notification center/list
      shouldPlaySound: true,     // Play sound
      shouldSetBadge: true,      // Update app badge count
    };
  },
});

export default function App() {
   const initRef = useRef(false);
  const [accessToken, setAccessToken] = useState(null);
  // If you know the signed-in user id, pass it. Else omit.
  const [userId, setUserId] = useState(null);

  // In-App Update State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isMandatoryUpdate, setIsMandatoryUpdate] = useState(false);

  // In-App Update Hook
  const {
    isUpdateAvailable,
    updateInfo,
    downloadProgress,
    isUpdating,
    isUpdateDownloaded,
    startUpdate,
    completeUpdate,
    openPlayStore,
  } = useInAppUpdate({
    autoCheck: true,
    updateType: UpdateType.FLEXIBLE,
    staleDaysForImmediate: 7,      // Force immediate update after 7 days
    minPriorityForImmediate: 4,    // High priority (4-5) gets immediate update
    onUpdateAvailable: (info) => {
      console.log('Update available:', info);
      // Determine if update should be mandatory
      const isMandatory = info.stalenessDays >= 7 || info.updatePriority >= 4;
      setIsMandatoryUpdate(isMandatory);
      setShowUpdateModal(true);
    },
    onUpdateDownloaded: () => {
      console.log('Update downloaded, ready to install');
      setShowUpdateModal(true);
    },
    onUpdateError: (error) => {
      console.error('Update error:', error);
    },
  });

  useEffect(() => {
    if (initRef.current) return;     // ✅ guard for StrictMode double mount
    initRef.current = true;

    configureGoogleSignin();         // call exactly once

    // Request notification permissions (channels are setup in useNotifee hook)
    Notifications.requestPermissionsAsync()
      .catch(e => console.warn("Notification permission error:", e));
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await AsyncStorage.getItem("access_token");
        if (mounted) setAccessToken(t || null);

        const uid = await AsyncStorage.getItem("user_id");
        if (mounted) setUserId(uid || null);
      } catch {
        if (mounted) {
          setAccessToken(null);
          setUserId(null);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ✅ Use Notifee for rich notifications with deep link handling
  // This hook handles FCM registration, token management, and notification display
  useNotifee({ accessToken });

  // Handle update actions
  const handleUpdateNow = () => {
    startUpdate();
  };

  const handleUpdateLater = () => {
    setShowUpdateModal(false);
  };

  const handleCompleteUpdate = () => {
    completeUpdate();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar backgroundColor={Theme.colors.primary} barStyle="light-content" />
      <AppNavigator />
      
      {/* In-App Update Modal */}
      <UpdateModal
        visible={showUpdateModal}
        updateInfo={updateInfo}
        downloadProgress={downloadProgress}
        isDownloading={isUpdating}
        isDownloaded={isUpdateDownloaded}
        isMandatory={isMandatoryUpdate}
        onUpdate={handleUpdateNow}
        onLater={handleUpdateLater}
        onClose={() => setShowUpdateModal(false)}
        onCompleteUpdate={handleCompleteUpdate}
        appName="ODH Pay"
      />
    </GestureHandlerRootView>

  );
}

