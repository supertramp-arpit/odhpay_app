import { CameraView, useCameraPermissions } from "expo-camera";
import {
    AppState,
    Linking,
    Platform,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Vibration,
    Animated,
    Alert,
    ActivityIndicator,
    Dimensions,
    StatusBar,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { color } from '../../theme/tokens';
import Theme from "../Theme";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

export default function Scan() {
    const qrLock = useRef(false);
    const appState = useRef(AppState.currentState);
    const [qrDatasetQrData, setQrDatasetQrData] = useState(null);
    const [isEnableTorch, setIsEnableTorch] = useState(false);
    const [isScanning, setIsScanning] = useState(true);
    const [loading, setLoading] = useState(false);
    const [scanStatus, setScanStatus] = useState('scanning'); // 'scanning', 'processing', 'success', 'error'

    // Camera permission handling
    const [permission, requestPermission] = useCameraPermissions();

    const navigation = useNavigation();

    // Animation values
    const scanLineAnimation = useRef(new Animated.Value(0)).current;
    const pulseAnimation = useRef(new Animated.Value(1)).current;
    const glowAnimation = useRef(new Animated.Value(0.6)).current; // For opacity glow effect
    const fadeAnimation = useRef(new Animated.Value(0)).current;

    // Request permission on mount if not granted
    useEffect(() => {
        if (!permission?.granted && permission?.canAskAgain) {
            requestPermission();
        }
        // Fade in animation
        Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [permission]);

    // ============================================================================================
    // Scan & Pay start Here 
    // ============================================================================================
    const fetchNameFromMobile = async (mobileNumber) => {
        try {
            setLoading(true);
            setScanStatus('processing');
            const token = await AsyncStorage.getItem("access_token");

            if (!token) {
                console.error("Token is missing!");
                setScanStatus('error');
                Alert.alert('Error', 'Authentication error. Please login again.');
                setLoading(false);
                return;
            }

            const headers = {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            const response = await axios.get(
                `https://newapi.odhpay.com/misc/check_mobile_number_peer?mobile=${mobileNumber}`,
                { headers }
            );

            setLoading(false);

            if (response.status === 200 && response.data) {
                if (response.data.data) {
                    setScanStatus('success');
                    // Small delay for visual feedback
                    setTimeout(() => {
                        navigation.navigate("PaymentScreen", { UserName: response.data.data[0], userMobile: mobileNumber });
                    }, 500);
                }
            } else {
                setScanStatus('error');
                Alert.alert("Error", "User not found");
            }

        } catch (error) {
            console.error("Error fetching data:", error.message);
            setScanStatus('error');
            Alert.alert('Error', 'Failed to verify number. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    // ============================================================================================
    // Scan & Pay End Here 
    // ============================================================================================

    // Animation for scanning indicator
    useEffect(() => {
        // Scan line animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnimation, {
                    toValue: 1,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnimation, {
                    toValue: 0,
                    duration: 2500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Pulse animation for corners
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnimation, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnimation, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Corner glow animation (using opacity which supports native driver)
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnimation, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnimation, {
                    toValue: 0.6,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        const subscription = AppState.addEventListener("change", (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === "active"
            ) {
                qrLock.current = false;
                setIsScanning(true);
                setScanStatus('scanning');
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const handleBarCodeScanned = async ({ data }) => {
        console.log(data)
        if (data && !qrLock.current && isScanning) {
            qrLock.current = true;
            setIsScanning(false);
            setQrDatasetQrData(data);
            setScanStatus('processing');

            // Provide haptic feedback
            Vibration.vibrate([0, 50, 30, 50]);

            try {
                if ((!isNaN(data)) && (data.length == 10)) {
                    console.log('it is the 10 digit mobile Number')
                    fetchNameFromMobile(data)
                }
                // Validate URL before opening
                else if (data.startsWith('upi://')) {
                    setScanStatus('success');
                    setTimeout(async () => {
                        await Linking.openURL(data);
                    }, 500);
                } else if (data.startsWith('http')) {
                    setScanStatus('success');
                    await Linking.openURL(data);
                } else {
                    setScanStatus('error');
                    Alert.alert('Invalid QR', 'This QR code is not supported');
                }
            } catch (error) {
                setScanStatus('error');
                Alert.alert('Error', 'Unable to process QR Code');
            }
        }
    };

    const toggleFlash = () => {
        setIsEnableTorch(!isEnableTorch)
    };

    const resetScanner = () => {
        qrLock.current = false;
        setIsScanning(true);
        setQrDatasetQrData(null);
        setScanStatus('scanning');
    };

    // Corner component for scan frame
    const ScanCorner = ({ position }) => {
        const cornerStyle = {
            topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
            topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
            bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
            bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
        };

        return (
            <Animated.View
                style={[
                    styles.scanCorner,
                    cornerStyle[position],
                    {
                        borderColor: color.success,
                        opacity: glowAnimation,
                        transform: [{ scale: pulseAnimation }],
                    },
                ]}
            />
        );
    };

    // Status indicator component
    const StatusIndicator = () => {
        const statusConfig = {
            scanning: { icon: 'qrcode-scan', color: color.success, text: 'Scanning...' },
            processing: { icon: 'loading', color: color.warning, text: 'Processing...' },
            success: { icon: 'check-circle', color: color.success, text: 'Success!' },
            error: { icon: 'alert-circle', color: color.error, text: 'Try Again' },
        };

        const config = statusConfig[scanStatus];

        return (
            <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
                    {scanStatus === 'processing' ? (
                        <ActivityIndicator size="small" color={config.color} />
                    ) : (
                        <MaterialCommunityIcons name={config.icon} size={18} color={config.color} />
                    )}
                    <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            
            {/* Header with gradient */}
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'transparent']}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <View style={styles.backButtonInner}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <MaterialCommunityIcons name="qrcode-scan" size={24} color={color.success} />
                        <Text style={styles.headerText}>Scan & Pay</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.helpButton}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Scan and pay help"
                        onPress={() =>
                            Alert.alert(
                                'How to Scan & Pay',
                                'Point your camera at any UPI QR code, payment link QR, or an ODH Pay user’s QR. ' +
                                'Payments to ODH Pay users are made from your wallet balance. ' +
                                'Use the flash button in low light.'
                            )
                        }
                    >
                        <Feather name="help-circle" size={22} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Permission Check */}
            {!permission ? (
                // Loading permission status
                <View style={styles.permissionContainer}>
                    <View style={styles.permissionCard}>
                        <ActivityIndicator size="large" color={color.white} />
                        <Text style={styles.permissionText}>Initializing camera...</Text>
                    </View>
                </View>
            ) : !permission.granted ? (
                // Permission not granted
                <View style={styles.permissionContainer}>
                    <View style={styles.permissionCard}>
                        <View style={styles.permissionIconContainer}>
                            <MaterialCommunityIcons name="camera-off" size={44} color={color.error} />
                        </View>
                        <Text style={styles.permissionTitle}>Camera access needed</Text>
                        <Text style={styles.permissionSubtext}>
                            {permission.canAskAgain
                                ? 'To scan QR codes and pay, allow camera access.'
                                : 'Camera access is turned off for ODH Pay. Enable it in your phone settings to scan and pay.'}
                        </Text>
                        {permission.canAskAgain ? (
                            <TouchableOpacity
                                style={styles.permissionButton}
                                onPress={requestPermission}
                                activeOpacity={0.85}
                                accessibilityRole="button"
                                accessibilityLabel="Allow camera access"
                            >
                                <MaterialCommunityIcons name="camera" size={20} color={color.ink900} />
                                <Text style={styles.permissionButtonText}>Allow Camera</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.permissionButton}
                                onPress={() => Linking.openSettings()}
                                activeOpacity={0.85}
                                accessibilityRole="button"
                                accessibilityLabel="Open phone settings"
                            >
                                <Feather name="settings" size={20} color={color.ink900} />
                                <Text style={styles.permissionButtonText}>Open Settings</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            ) : (
                // Camera View - Permission granted
                <Animated.View style={[styles.cameraWrapper, { opacity: fadeAnimation }]}>
                    <View style={styles.cameraContainer}>
                        <CameraView
                            enableTorch={isEnableTorch}
                            style={StyleSheet.absoluteFill}
                            facing="back"
                            onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
                        />

                        {/* Dark overlay with transparent center */}
                        <View style={styles.overlay}>
                            <View style={styles.overlayTop} />
                            <View style={styles.overlayMiddle}>
                                <View style={styles.overlaySide} />
                                <View style={styles.scanArea}>
                                    {/* Corner markers */}
                                    <ScanCorner position="topLeft" />
                                    <ScanCorner position="topRight" />
                                    <ScanCorner position="bottomLeft" />
                                    <ScanCorner position="bottomRight" />
                                    
                                    {/* Scanning Line */}
                                    {isScanning && (
                                        <Animated.View
                                            style={[
                                                styles.scanLine,
                                                {
                                                    transform: [{
                                                        translateY: scanLineAnimation.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [0, SCAN_AREA_SIZE - 4]
                                                        })
                                                    }]
                                                }
                                            ]}
                                        >
                                            <LinearGradient
                                                colors={['transparent', color.success, 'transparent']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.scanLineGradient}
                                            />
                                        </Animated.View>
                                    )}
                                </View>
                                <View style={styles.overlaySide} />
                            </View>
                            <View style={styles.overlayBottom} />
                        </View>

                        {/* Status indicator */}
                        <StatusIndicator />

                        {/* Loading overlay */}
                        {loading && (
                            <View style={styles.loadingOverlay}>
                                <BlurView intensity={20} style={styles.blurView}>
                                    <ActivityIndicator size="large" color={color.white} />
                                    <Text style={styles.loadingText}>Processing...</Text>
                                </BlurView>
                            </View>
                        )}
                    </View>

                    {/* Bottom Controls */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                        style={styles.bottomGradient}
                    >
                        {/* Instructions */}
                        <View style={styles.instructions}>
                            <Text style={styles.instructionText}>
                                Align QR code within the frame
                            </Text>
                            <Text style={styles.instructionSubtext}>
                                Supports UPI, Payment Links & Mobile Numbers
                            </Text>
                        </View>

                        {/* Control Buttons */}
                        <View style={styles.controls}>
                            <TouchableOpacity
                                style={[
                                    styles.controlButton,
                                    isEnableTorch && styles.controlButtonActive
                                ]}
                                onPress={toggleFlash}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.controlButtonInner,
                                    isEnableTorch && styles.controlButtonInnerActive
                                ]}>
                                    <Ionicons
                                        name={isEnableTorch ? 'flash' : 'flash-off'}
                                        size={26}
                                        color={isEnableTorch ? '#000' : '#fff'}
                                    />
                                </View>
                                <Text style={[
                                    styles.controlText,
                                    isEnableTorch && styles.controlTextActive
                                ]}>
                                    {isEnableTorch ? 'Flash On' : 'Flash Off'}
                                </Text>
                            </TouchableOpacity>

                            {!isScanning && (
                                <TouchableOpacity
                                    style={styles.scanAgainButton}
                                    onPress={resetScanner}
                                    activeOpacity={0.85}
                                    accessibilityRole="button"
                                    accessibilityLabel="Scan again"
                                >
                                    <MaterialCommunityIcons name="qrcode-scan" size={22} color="#0A0A0B" />
                                    <Text style={styles.scanAgainText}>Scan Again</Text>
                                </TouchableOpacity>
                            )}
                            {/* NOTE: the old "Gallery" button was a dead control
                                (empty onPress) — removed until gallery QR scanning
                                is actually implemented. */}
                        </View>
                    </LinearGradient>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 4,
    },
    backButtonInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    helpButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraWrapper: {
        flex: 1,
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    // Overlay styles
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    overlayTop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    overlayMiddle: {
        flexDirection: 'row',
        height: SCAN_AREA_SIZE,
    },
    overlaySide: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    overlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    scanArea: {
        width: SCAN_AREA_SIZE,
        height: SCAN_AREA_SIZE,
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
    },
    scanCorner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#0E9F6E',
    },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 3,
    },
    scanLineGradient: {
        flex: 1,
        height: 3,
    },
    // Status styles
    statusContainer: {
        position: 'absolute',
        top: height * 0.15,
        alignSelf: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Bottom gradient and controls
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingTop: 60,
    },
    instructions: {
        alignItems: 'center',
        marginBottom: 24,
    },
    instructionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    instructionSubtext: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 24,
    },
    controlButton: {
        alignItems: 'center',
    },
    controlButtonActive: {},
    controlButtonInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    controlButtonInnerActive: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    controlText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '500',
    },
    controlTextActive: {
        color: '#FFD700',
    },
    scanAgainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        paddingHorizontal: 24,
        paddingVertical: 15,
        gap: 8,
    },
    scanAgainText: {
        color: '#0A0A0B',
        fontSize: 16,
        fontWeight: '600',
    },
    // Loading overlay
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blurView: {
        padding: 32,
        borderRadius: 20,
        alignItems: 'center',
        overflow: 'hidden',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginTop: 16,
    },
    // Permission styles
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    permissionCard: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    permissionIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(229,72,77,0.16)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    permissionTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    permissionText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    permissionSubtext: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 28,
    },
    permissionButton: {
        width: '100%',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        gap: 10,
        backgroundColor: '#FFFFFF',
    },
    permissionButtonText: {
        color: '#0A0A0B',
        fontSize: 16,
        fontWeight: '600',
    },
});