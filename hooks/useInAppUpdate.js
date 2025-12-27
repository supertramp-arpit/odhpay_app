import { useEffect, useCallback, useState, useRef } from 'react';
import {
    NativeModules,
    NativeEventEmitter,
    Platform,
    Linking,
    Alert,
} from 'react-native';

const { AppUpdateModule } = NativeModules;

// Install status constants from Play Core
export const InstallStatus = {
    UNKNOWN: 0,
    PENDING: 1,
    DOWNLOADING: 2,
    DOWNLOADED: 3,
    INSTALLING: 4,
    INSTALLED: 5,
    FAILED: 6,
    CANCELED: 7,
};

// Update availability constants
export const UpdateAvailability = {
    UNKNOWN: 0,
    UPDATE_NOT_AVAILABLE: 1,
    UPDATE_AVAILABLE: 2,
    DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS: 3,
};

// Update type constants
export const UpdateType = {
    FLEXIBLE: 0,    // User can use the app while downloading
    IMMEDIATE: 1,   // Full-screen update, blocks the app
};

/**
 * Hook for managing in-app updates via Google Play
 * 
 * @param {Object} options
 * @param {boolean} options.autoCheck - Automatically check for updates on mount
 * @param {number} options.updateType - UPDATE_TYPE_FLEXIBLE or UPDATE_TYPE_IMMEDIATE
 * @param {number} options.staleDaysForImmediate - Days after which to force immediate update
 * @param {number} options.minPriorityForImmediate - Minimum priority (0-5) for immediate update
 * @param {Function} options.onUpdateAvailable - Callback when update is available
 * @param {Function} options.onUpdateDownloaded - Callback when flexible update is downloaded
 * @param {Function} options.onUpdateError - Callback on error
 */
export const useInAppUpdate = (options = {}) => {
    const {
        autoCheck = true,
        updateType = UpdateType.FLEXIBLE,
        staleDaysForImmediate = 7,      // Force immediate after 7 days
        minPriorityForImmediate = 4,    // Priority 4-5 gets immediate update
        onUpdateAvailable,
        onUpdateDownloaded,
        onUpdateError,
    } = options;

    const [isChecking, setIsChecking] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(null);
    const [isUpdateDownloaded, setIsUpdateDownloaded] = useState(false);
    
    const eventEmitter = useRef(null);

    // Initialize event listeners
    useEffect(() => {
        if (Platform.OS !== 'android' || !AppUpdateModule) {
            return;
        }

        eventEmitter.current = new NativeEventEmitter(AppUpdateModule);

        const downloadedSub = eventEmitter.current.addListener(
            'onUpdateDownloaded',
            () => {
                setIsUpdateDownloaded(true);
                setIsUpdating(false);
                onUpdateDownloaded?.();
            }
        );

        const progressSub = eventEmitter.current.addListener(
            'onDownloadProgress',
            (progress) => {
                setDownloadProgress(progress);
            }
        );

        const failedSub = eventEmitter.current.addListener(
            'onUpdateFailed',
            () => {
                setIsUpdating(false);
                onUpdateError?.({ message: 'Update failed' });
            }
        );

        const installedSub = eventEmitter.current.addListener(
            'onUpdateInstalled',
            () => {
                setIsUpdating(false);
                setIsUpdateDownloaded(false);
            }
        );

        return () => {
            downloadedSub?.remove();
            progressSub?.remove();
            failedSub?.remove();
            installedSub?.remove();
        };
    }, [onUpdateDownloaded, onUpdateError]);

    // Auto-check for updates on mount
    useEffect(() => {
        if (autoCheck && Platform.OS === 'android') {
            checkForUpdate();
        }
    }, [autoCheck]);

    /**
     * Check if an update is available
     */
    const checkForUpdate = useCallback(async () => {
        if (Platform.OS !== 'android' || !AppUpdateModule) {
            console.log('In-app updates only available on Android');
            return null;
        }

        try {
            setIsChecking(true);
            const info = await AppUpdateModule.checkForUpdate();
            setUpdateInfo(info);
            
            if (info.isUpdateAvailable) {
                onUpdateAvailable?.(info);
            }
            
            return info;
        } catch (error) {
            // ERROR_APP_NOT_OWNED (-10) is expected in development
            // The app must be installed from Play Store for updates to work
            const errorMessage = error?.message || '';
            if (errorMessage.includes('ERROR_APP_NOT_OWNED') || errorMessage.includes('-10')) {
                console.log('In-app updates: App not installed from Play Store (expected in dev)');
                return null;
            }
            console.error('Failed to check for update:', error);
            onUpdateError?.(error);
            return null;
        } finally {
            setIsChecking(false);
        }
    }, [onUpdateAvailable, onUpdateError]);

    /**
     * Determine the appropriate update type based on staleness and priority
     */
    const getRecommendedUpdateType = useCallback(() => {
        if (!updateInfo?.isUpdateAvailable) {
            return null;
        }

        // Force immediate update if:
        // 1. Update has been available for too long
        // 2. Update priority is high (set in Play Console)
        const shouldForceImmediate = 
            (updateInfo.stalenessDays >= staleDaysForImmediate) ||
            (updateInfo.updatePriority >= minPriorityForImmediate);

        if (shouldForceImmediate && updateInfo.isImmediateUpdateAllowed) {
            return UpdateType.IMMEDIATE;
        }

        return updateType;
    }, [updateInfo, staleDaysForImmediate, minPriorityForImmediate, updateType]);

    /**
     * Start the update flow
     */
    const startUpdate = useCallback(async (type = null) => {
        if (Platform.OS !== 'android' || !AppUpdateModule) {
            return;
        }

        const effectiveType = type ?? getRecommendedUpdateType() ?? updateType;

        try {
            setIsUpdating(true);
            await AppUpdateModule.startUpdate(effectiveType);
        } catch (error) {
            setIsUpdating(false);
            console.error('Failed to start update:', error);
            
            if (error.code === 'UPDATE_CANCELED') {
                // User canceled, maybe show a reminder later
                console.log('User canceled the update');
            } else {
                onUpdateError?.(error);
            }
        }
    }, [getRecommendedUpdateType, updateType, onUpdateError]);

    /**
     * Complete the flexible update (restart the app)
     */
    const completeUpdate = useCallback(async () => {
        if (Platform.OS !== 'android' || !AppUpdateModule) {
            return;
        }

        try {
            await AppUpdateModule.completeUpdate();
        } catch (error) {
            console.error('Failed to complete update:', error);
            onUpdateError?.(error);
        }
    }, [onUpdateError]);

    /**
     * Open the app's Play Store page
     */
    const openPlayStore = useCallback(async () => {
        const packageName = 'com.ODHPAY_PROJ.com'; // Your app's package name
        
        try {
            // Try to open in Play Store app first
            const playStoreUrl = `market://details?id=${packageName}`;
            const canOpen = await Linking.canOpenURL(playStoreUrl);
            
            if (canOpen) {
                await Linking.openURL(playStoreUrl);
            } else {
                // Fallback to web
                await Linking.openURL(
                    `https://play.google.com/store/apps/details?id=${packageName}`
                );
            }
        } catch (error) {
            console.error('Failed to open Play Store:', error);
        }
    }, []);

    return {
        // State
        isChecking,
        isUpdating,
        updateInfo,
        downloadProgress,
        isUpdateDownloaded,
        isUpdateAvailable: updateInfo?.isUpdateAvailable ?? false,
        
        // Methods
        checkForUpdate,
        startUpdate,
        completeUpdate,
        openPlayStore,
        getRecommendedUpdateType,
        
        // Constants
        UpdateType,
        InstallStatus,
        UpdateAvailability,
    };
};

/**
 * Show an alert prompting the user to update
 */
export const showUpdateAlert = ({
    title = 'Update Available',
    message = 'A new version of the app is available. Please update to get the latest features and improvements.',
    updateButtonText = 'Update Now',
    laterButtonText = 'Later',
    onUpdate,
    onLater,
    isMandatory = false,
}) => {
    const buttons = [
        {
            text: updateButtonText,
            onPress: onUpdate,
            style: 'default',
        },
    ];

    if (!isMandatory) {
        buttons.unshift({
            text: laterButtonText,
            onPress: onLater,
            style: 'cancel',
        });
    }

    Alert.alert(title, message, buttons, { cancelable: !isMandatory });
};

export default useInAppUpdate;
