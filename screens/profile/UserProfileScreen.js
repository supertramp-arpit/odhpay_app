import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    ActivityIndicator,
    Switch,
    Dimensions,
    Animated,
    Platform,
    StatusBar,
} from "react-native";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { CommonActions, useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Theme from "../../components/Theme";
import useUserStore from "../../store/useUserStore";
import { useBankStore } from "../../store/useBankStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useKycDetailStore } from "../../store/useKycStore";
import { InteractionManager } from "react-native";

const { width } = Dimensions.get("window");

const UserProfileScreen = () => {
    const navigation = useNavigation();
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [isLoadingLogout, setIsLoadingLogout] = useState(false);
    const [isPrimeMember, setIsPrimeMember] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    // Get primary bank from store
    const banks = useBankStore((state) => state.banks);
    const primaryBank = banks.find(bank => bank.isPrimary) || banks[0] || null;

    // Check Prime membership status
    useEffect(() => {
        const checkPrimeStatus = async () => {
            try {
                const primeStatus = await AsyncStorage.getItem('isPrimeMember');
                setIsPrimeMember(primeStatus === 'true');
            } catch (error) {
                console.error('Error checking prime status:', error);
            }
        };
        checkPrimeStatus();
    }, []);

    // Refresh prime status when screen is focused
    useFocusEffect(
        React.useCallback(() => {
            const checkPrimeStatus = async () => {
                try {
                    const primeStatus = await AsyncStorage.getItem('isPrimeMember');
                    setIsPrimeMember(primeStatus === 'true');
                } catch (error) {
                    console.error('Error checking prime status:', error);
                }
            };
            checkPrimeStatus();
        }, [])
    );

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    // Fetch user data with TTL + the user's real bank accounts
    useFocusEffect(
        React.useCallback(() => {
            const { user: storeUser, updatedAt } = useUserStore.getState();
            const ttlMs = 5 * 60 * 1000;
            if (!storeUser || Date.now() - (updatedAt || 0) > ttlMs) {
                useUserStore.getState().fetchUser().catch(() => { });
            }
            useBankStore.getState().fetchBanks?.();
        }, [])
    );

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            useKycDetailStore.getState().fetchKyc({ ttlMs: 10 * 60 * 1000 });
        });
        return () => task?.cancel?.();
    }, []);

    // User store data
    const user = useUserStore((s) => s.user);
    const payload = user?.user ? user.user : user;

    // KYC store data
    const kycDetails = useKycDetailStore((s) => s.data);

    // Extract profile data with fallbacks
    const aadhaar =
        kycDetails?.aadhar_details ||
        kycDetails?.aadhaar_details ||
        kycDetails?.aadhaar ||
        kycDetails;

    const primaryName = payload?.fullname || aadhaar?.name || aadhaar?.full_name || "User";
    const phoneNumber = payload?.MobileNumber || aadhaar?.phone || "Not available";
    const email = payload?.Email || aadhaar?.email || "Not available";
    const maskedAadhaar = aadhaar?.maskedNumber || aadhaar?.masked_aadhaar || aadhaar?.aadharNumber;
    const hasKyc = !!maskedAadhaar;
    const avatarInitial = primaryName ? primaryName.charAt(0).toUpperCase() : "U";
    const qrText = phoneNumber && phoneNumber !== "Not available" ? phoneNumber : "ODHPAY_USER";

    const aadhaarPhoto = aadhaar?.photo || aadhaar?.profile_image_b64;
    const profileSource = aadhaarPhoto
        ? { uri: `data:image/jpeg;base64,${aadhaarPhoto}` }
        : payload?.profile
            ? { uri: `https://newapi.odhpay.com/${payload?.profile}`.replace(/\\/g, "/") }
            : null;

    const handleLogoutPress = () => {
        setLogoutModalVisible(true);
    };

    const confirmLogout = async () => {
        setIsLoadingLogout(true);
        try {
            await AsyncStorage.multiRemove([
                "fingerPrintStatus",
                "access_token",
                "refresh_token",
                "fcm_registered_map"
            ]);
            await AsyncStorage.clear();

            setLogoutModalVisible(false);
            setIsLoadingLogout(false);

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: "Register" }],
                })
            );
        } catch (error) {
            console.error("Logout error:", error);
            setIsLoadingLogout(false);
        }
    };

    const SettingMenuItem = ({ icon, iconPack = "MaterialIcons", title, onPress, showArrow = true, isDestructive = false, badge = null, isPrime = false }) => (
        <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.6}
            onPress={onPress}
        >
            <View style={[styles.menuIconContainer, isDestructive && styles.destructiveIcon, isPrime && styles.primeIcon]}>
                {iconPack === "Ionicons" ? (
                    <Ionicons name={icon} size={20} color={isDestructive ? "#E53935" : isPrime ? "#FFD700" : Theme.colors.primary} />
                ) : iconPack === "Feather" ? (
                    <Feather name={icon} size={20} color={isDestructive ? "#E53935" : isPrime ? "#FFD700" : Theme.colors.primary} />
                ) : (
                    <MaterialIcons name={icon} size={20} color={isDestructive ? "#E53935" : isPrime ? "#FFD700" : Theme.colors.primary} />
                )}
            </View>
            <Text style={[styles.menuTitle, isDestructive && styles.destructiveText]}>{title}</Text>
            {badge && (
                <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{badge}</Text>
                </View>
            )}
            {showArrow && (
                <MaterialIcons name="chevron-right" size={22} color="#D0D0D0" />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            
            {/* Clean Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account</Text>
                <TouchableOpacity 
                    style={styles.settingsButton} 
                    onPress={() => navigation.navigate("SettingScreen")}
                    activeOpacity={0.7}
                >
                    <Feather name="settings" size={20} color="#1a1a1a" />
                </TouchableOpacity>
            </View>

            <Animated.ScrollView
                style={[styles.scrollView, { opacity: fadeAnim }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* QR Code Card */}
                <View style={styles.qrCard}>
                    {/* Primary Bank Section */}
                    <TouchableOpacity 
                        style={styles.primaryBankCard}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate("ManageBanksScreen")}
                    >
                        <View style={styles.primaryBankLeft}>
                            <View style={styles.bankLogoPlaceholder}>
                                <MaterialIcons name="account-balance" size={22} color="#6B7280" />
                            </View>
                            <View style={styles.primaryBankInfo}>
                                <Text style={styles.primaryBankName}>
                                    {primaryBank ? primaryBank.bankName : 'Add Bank Account'}
                                </Text>
                                <Text style={styles.primaryBankUpi}>
                                    {primaryBank ? primaryBank.accountNumber : 'Tap to add your bank'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.primaryBankRight}>
                            {primaryBank && (
                                <View style={styles.primaryIndicator}>
                                    <Text style={styles.primaryIndicatorText}>PRIMARY</Text>
                                </View>
                            )}
                            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                        </View>
                    </TouchableOpacity>

                    {/* Rendered locally — the previous version sent the user's
                        phone number to a third-party QR service (quickchart.io).
                        A bare 10-digit number is the format the in-app scanner
                        pays to (wallet P2P). */}
                    <View style={styles.qrWrapper}>
                        <QRCode
                            value={qrText}
                            size={200}
                            color="#0A0A0B"
                            backgroundColor="#FFFFFF"
                        />
                    </View>
                    <Text style={styles.qrName}>{primaryName}</Text>
                    <Text style={styles.qrHint}>Scan to pay me</Text>
                </View>

                {/* Menu Sections */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionLabel}>Account</Text>
                    <SettingMenuItem
                        icon="person-outline"
                        iconPack="Ionicons"
                        title="Personal Information"
                        onPress={() => navigation.navigate("UserProfile")}
                    />
                  
                    <SettingMenuItem
                        icon="wallet-outline"
                        iconPack="Ionicons"
                        title="Bank Accounts"
                        onPress={() => navigation.navigate("ManageBanksScreen")}
                    />
                    <SettingMenuItem
                        icon={isPrimeMember ? "star" : "star-outline"}
                        iconPack="Ionicons"
                        title={isPrimeMember ? "Prime Member" : "Prime Membership"}
                        onPress={() => navigation.navigate("PrimeMembershipScreen")}
                        badge={isPrimeMember ? "ACTIVE" : null}
                        isPrime={isPrimeMember}
                    />
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.sectionLabel}>Security</Text>
                    <SettingMenuItem
                        icon="lock-closed-outline"
                        iconPack="Ionicons"
                        title="Security Settings"
                        onPress={() => navigation.navigate("SettingScreen")}
                    />
                   
                    <SettingMenuItem
                        icon="shield-outline"
                        iconPack="Ionicons"
                        title="Privacy Policy"
                        onPress={() => navigation.navigate("PrivacyAndPolicy")}
                    />
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.sectionLabel}>More</Text>
                   
                    <SettingMenuItem
                        icon="information-circle-outline"
                        iconPack="Ionicons"
                        title="About Us"
                        onPress={() => navigation.navigate("AboutUs")}
                    />
                    <SettingMenuItem
                        icon="document-text-outline"
                        iconPack="Ionicons"
                        title="Terms & Conditions"
                        onPress={() => navigation.navigate("TermsAndConditions")}
                    />
                </View>

                {/* Logout Button */}
                <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={handleLogoutPress}
                    activeOpacity={0.7}
                >
                    <Feather name="log-out" size={20} color="#E53935" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerLogo}>{Theme.Text?.Company || 'ODHPAY'}</Text>
                    <Text style={styles.footerText}>Version 1.0.0</Text>
                </View>
            </Animated.ScrollView>

            {/* Logout Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={logoutModalVisible}
                onRequestClose={() => !isLoadingLogout && setLogoutModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconContainer}>
                            <Feather name="log-out" size={32} color="#E53935" />
                        </View>
                        <Text style={styles.modalTitle}>Log Out?</Text>
                        <Text style={styles.modalText}>
                            You'll need to log in again to access your account.
                        </Text>

                        {isLoadingLogout ? (
                            <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginVertical: 20 }} />
                        ) : (
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setLogoutModalVisible(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={confirmLogout}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.confirmButtonText}>Log Out</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        backgroundColor: "#FFFFFF",
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        borderRadius: 20,
    },
    settingsButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1a1a1a",
    },
    scrollView: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    scrollContent: {
        paddingBottom: 40,
    },
    
    // QR Card
    qrCard: {
        alignItems: "center",
        paddingVertical: 24,
        paddingHorizontal: 20,
        backgroundColor: "#FFFFFF",
        marginBottom: 8,
    },
    // Primary Bank Card
    primaryBankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 14,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    primaryBankLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    bankLogoContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    bankLogoImage: {
        width: 28,
        height: 28,
    },
    bankLogoPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    primaryBankInfo: {
        flex: 1,
    },
    primaryBankName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    primaryBankUpi: {
        fontSize: 13,
        color: Theme.colors.primary,
        fontWeight: '500',
    },
    primaryBankRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    primaryIndicator: {
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    primaryIndicatorText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    qrWrapper: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    qrCode: {
        width: 180,
        height: 180,
    },
    qrName: {
        fontSize: 16,
        color: '#0A0A0B',
        marginTop: 16,
        fontWeight: '600',
    },
    qrHint: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
        fontWeight: '500',
    },

    // Quick Actions
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
    },
    quickActionItem: {
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    quickActionIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#555',
        letterSpacing: 0.2,
    },

    // Menu Section
    menuSection: {
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingTop: 20,
        paddingBottom: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Theme.colors.primary + '12',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    destructiveIcon: {
        backgroundColor: '#FEE2E2',
    },
    primeIcon: {
        backgroundColor: '#1a1a1a',
    },
    menuTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#1a1a1a',
    },
    destructiveText: {
        color: '#E53935',
    },
    menuBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8,
    },
    menuBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },

    // Logout Button
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 24,
        paddingVertical: 16,
        backgroundColor: '#FEE2E2',
        borderRadius: 14,
        gap: 10,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E53935',
    },

    // Footer
    footer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    footerLogo: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.colors.primary,
        marginBottom: 4,
    },
    footerText: {
        fontSize: 12,
        color: '#CCC',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    modalContent: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 28,
        alignItems: "center",
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#FEE2E2",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 8,
    },
    modalText: {
        fontSize: 15,
        color: "#666",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: "#F5F5F5",
        alignItems: "center",
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: "#E53935",
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#1a1a1a",
        fontSize: 15,
        fontWeight: "600",
    },
    confirmButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
});

export default UserProfileScreen;
