import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    Image,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '../Theme';

const { width, height } = Dimensions.get('window');

/**
 * Beautiful Update Modal Component
 */
const UpdateModal = ({
    visible,
    onUpdate,
    onLater,
    onClose,
    updateInfo,
    downloadProgress,
    isDownloading,
    isDownloaded,
    onCompleteUpdate,
    isMandatory = false,
    appName = 'ODH Pay',
}) => {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(height));

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const progressPercent = downloadProgress?.percentComplete ?? 0;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={isMandatory ? undefined : onClose}
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <Animated.View
                    style={[
                        styles.modalContainer,
                        { transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    {/* Header with gradient */}
                    <LinearGradient
                        colors={['#00D4AA', '#00B894']}
                        style={styles.header}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {/* Close button (if not mandatory) */}
                        {!isMandatory && !isDownloading && (
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
                            </TouchableOpacity>
                        )}

                        {/* Update Icon */}
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons
                                name={isDownloaded ? 'check-circle' : 'cellphone-arrow-down'}
                                size={48}
                                color="#fff"
                            />
                        </View>

                        <Text style={styles.headerTitle}>
                            {isDownloaded ? 'Update Ready!' : 'Update Available'}
                        </Text>
                        {updateInfo?.availableVersionCode && (
                            <Text style={styles.versionText}>
                                New version available
                            </Text>
                        )}
                    </LinearGradient>

                    {/* Content */}
                    <View style={styles.content}>
                        {isDownloading ? (
                            // Download Progress View
                            <View style={styles.downloadingContainer}>
                                <Text style={styles.downloadingTitle}>Downloading Update...</Text>
                                
                                {/* Progress Bar */}
                                <View style={styles.progressBarContainer}>
                                    <View style={styles.progressBarBg}>
                                        <LinearGradient
                                            colors={['#00D4AA', '#00B894']}
                                            style={[
                                                styles.progressBar,
                                                { width: `${progressPercent}%` },
                                            ]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>{progressPercent}%</Text>
                                </View>

                                {downloadProgress && (
                                    <Text style={styles.downloadSize}>
                                        {formatBytes(downloadProgress.bytesDownloaded)} / {formatBytes(downloadProgress.totalBytesToDownload)}
                                    </Text>
                                )}

                                <Text style={styles.downloadHint}>
                                    Please wait while we download the update
                                </Text>
                            </View>
                        ) : isDownloaded ? (
                            // Update Downloaded View
                            <View style={styles.downloadedContainer}>
                                <View style={styles.checkmarkContainer}>
                                    <MaterialCommunityIcons
                                        name="check-decagram"
                                        size={60}
                                        color="#00D4AA"
                                    />
                                </View>
                                <Text style={styles.downloadedTitle}>
                                    Update Downloaded Successfully!
                                </Text>
                                <Text style={styles.downloadedMessage}>
                                    Restart the app to apply the update and enjoy new features.
                                </Text>

                                <TouchableOpacity
                                    style={styles.restartButton}
                                    onPress={onCompleteUpdate}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#00D4AA', '#00B894']}
                                        style={styles.restartButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <MaterialCommunityIcons name="restart" size={22} color="#fff" />
                                        <Text style={styles.restartButtonText}>Restart Now</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            // Update Available View
                            <>
                                <Text style={styles.title}>
                                    Time to Update {appName}! 🚀
                                </Text>
                                <Text style={styles.message}>
                                    We've added new features and improvements to make your experience even better. Update now to get:
                                </Text>

                                {/* Features List */}
                                <View style={styles.featuresList}>
                                    <FeatureItem icon="shield-check" text="Enhanced Security" />
                                    <FeatureItem icon="lightning-bolt" text="Faster Performance" />
                                    <FeatureItem icon="bug-outline" text="Bug Fixes" />
                                    <FeatureItem icon="star-outline" text="New Features" />
                                </View>

                                {/* Staleness Warning */}
                                {updateInfo?.stalenessDays > 3 && (
                                    <View style={styles.warningContainer}>
                                        <MaterialCommunityIcons
                                            name="alert-circle"
                                            size={18}
                                            color="#FF9500"
                                        />
                                        <Text style={styles.warningText}>
                                            This update has been available for {updateInfo.stalenessDays} days
                                        </Text>
                                    </View>
                                )}

                                {/* Action Buttons */}
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={styles.updateButton}
                                        onPress={onUpdate}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#00D4AA', '#00B894']}
                                            style={styles.updateButtonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <MaterialCommunityIcons
                                                name="download"
                                                size={22}
                                                color="#fff"
                                            />
                                            <Text style={styles.updateButtonText}>
                                                Update Now
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    {!isMandatory && (
                                        <TouchableOpacity
                                            style={styles.laterButton}
                                            onPress={onLater}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.laterButtonText}>Maybe Later</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {isMandatory && (
                                    <Text style={styles.mandatoryText}>
                                        This update is required to continue using the app
                                    </Text>
                                )}
                            </>
                        )}
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

// Feature item component
const FeatureItem = ({ icon, text }) => (
    <View style={styles.featureItem}>
        <View style={styles.featureIconContainer}>
            <MaterialCommunityIcons name={icon} size={18} color="#00D4AA" />
        </View>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

// Format bytes to human readable
const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
    },
    header: {
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },
    versionText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
    },
    content: {
        padding: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a2e',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    featuresList: {
        marginBottom: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 212, 170, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    featureText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 149, 0, 0.1)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    warningText: {
        fontSize: 13,
        color: '#FF9500',
        marginLeft: 8,
        flex: 1,
    },
    buttonContainer: {
        gap: 12,
    },
    updateButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    updateButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    updateButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    laterButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    laterButtonText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
    },
    mandatoryText: {
        fontSize: 12,
        color: '#FF4444',
        textAlign: 'center',
        marginTop: 16,
    },
    // Downloading styles
    downloadingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    downloadingTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: 24,
    },
    progressBarContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: '#E8E8E8',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#00D4AA',
        width: 45,
        textAlign: 'right',
    },
    downloadSize: {
        fontSize: 13,
        color: '#888',
        marginTop: 12,
    },
    downloadHint: {
        fontSize: 13,
        color: '#666',
        marginTop: 20,
        textAlign: 'center',
    },
    // Downloaded styles
    downloadedContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    checkmarkContainer: {
        marginBottom: 16,
    },
    downloadedTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a2e',
        textAlign: 'center',
        marginBottom: 8,
    },
    downloadedMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    restartButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    restartButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    restartButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default UpdateModal;
