import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ActivityIndicator,
    Animated,
    InteractionManager,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { CommonActions, useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    ArrowLeft,
    Settings,
    Landmark,
    ChevronRight,
    User,
    Lock,
    ShieldCheck,
    Info,
    FileText,
    LogOut,
} from "lucide-react-native";

import Theme from "../../components/Theme";
import useUserStore from "../../store/useUserStore";
import { useBankStore } from "../../store/useBankStore";
import { useKycDetailStore } from "../../store/useKycStore";
import { color, space, radius, type, tabularNums, elevation, hitSlop8 } from "../../theme/tokens";

const UserProfileScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [isLoadingLogout, setIsLoadingLogout] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    // Get primary bank from store (real accounts via /payments/get_all_user_accounts)
    const banks = useBankStore((state) => state.banks);
    const primaryBank = banks.find(bank => bank.isPrimary) || banks[0] || null;

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

    // KYC store data (name fallback)
    const kycDetails = useKycDetailStore((s) => s.data);
    const aadhaar =
        kycDetails?.aadhar_details ||
        kycDetails?.aadhaar_details ||
        kycDetails?.aadhaar ||
        kycDetails;

    const primaryName = payload?.fullname || aadhaar?.name || aadhaar?.full_name || "User";
    const phoneNumber = payload?.MobileNumber || aadhaar?.phone || "";
    // A bare 10-digit number is the format the in-app scanner pays to (wallet P2P)
    const qrText = phoneNumber || "ODHPAY_USER";

    const handleLogoutPress = () => setLogoutModalVisible(true);

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
            setIsLoadingLogout(false);
        }
    };

    const MenuRow = ({ icon: Icon, title, onPress, badge = null, destructive = false, isLast = false }) => (
        <TouchableOpacity
            style={[styles.menuRow, !isLast && styles.menuRowDivider]}
            activeOpacity={0.6}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={title}
        >
            <View style={[styles.menuIconDisc, destructive && styles.menuIconDiscDestructive]}>
                <Icon size={18} color={destructive ? color.errorFg : color.text} strokeWidth={2} />
            </View>
            <Text style={[styles.menuTitle, destructive && styles.menuTitleDestructive]}>{title}</Text>
            {badge && (
                <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{badge}</Text>
                </View>
            )}
            {!destructive && <ChevronRight size={18} color={color.gray300} strokeWidth={2} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={[]}>
            {/* Header — same safe-area convention as the home screen */}
            <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top - 20, 8) }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    style={styles.headerBtn}
                    hitSlop={hitSlop8}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <ArrowLeft size={20} color={color.text} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account</Text>
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => navigation.navigate("SettingScreen")}
                    activeOpacity={0.7}
                    hitSlop={hitSlop8}
                    accessibilityRole="button"
                    accessibilityLabel="Settings"
                >
                    <Settings size={18} color={color.text} strokeWidth={2} />
                </TouchableOpacity>
            </View>

            <Animated.ScrollView
                style={[styles.scrollView, { opacity: fadeAnim }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Pay card: bank + QR */}
                <View style={styles.payCard}>
                    <TouchableOpacity
                        style={styles.bankRow}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate("ManageBanksScreen")}
                        accessibilityRole="button"
                        accessibilityLabel={primaryBank ? `Primary bank ${primaryBank.bankName}` : "Add bank account"}
                    >
                        <View style={styles.bankDisc}>
                            <Landmark size={18} color={color.textSecondary} strokeWidth={2} />
                        </View>
                        <View style={styles.bankInfo}>
                            <Text style={styles.bankName} numberOfLines={1}>
                                {primaryBank ? primaryBank.bankName : 'Add bank account'}
                            </Text>
                            <Text style={styles.bankMeta} numberOfLines={1}>
                                {primaryBank ? primaryBank.accountNumber : 'Tap to link your bank'}
                            </Text>
                        </View>
                        {primaryBank && (
                            <View style={styles.primaryPill}>
                                <Text style={styles.primaryPillText}>Primary</Text>
                            </View>
                        )}
                        <ChevronRight size={18} color={color.gray300} strokeWidth={2} />
                    </TouchableOpacity>

                    {/* Rendered locally — never send the user's number to a
                        third-party QR service. A bare 10-digit number is the
                        format the in-app scanner pays to (wallet P2P). */}
                    <View style={styles.qrWrapper}>
                        <QRCode
                            value={qrText}
                            size={188}
                            color={color.ink900}
                            backgroundColor={color.white}
                        />
                    </View>
                    <Text style={styles.qrName}>{primaryName}</Text>
                    <Text style={styles.qrHint}>Scan to pay me</Text>
                </View>

                {/* Menu Sections */}
                <Text style={styles.sectionLabel}>Account</Text>
                <View style={styles.menuCard}>
                    <MenuRow icon={User} title="Personal Information" onPress={() => navigation.navigate("UserProfile")} />
                    <MenuRow icon={Landmark} title="Bank Accounts" onPress={() => navigation.navigate("ManageBanksScreen")} isLast />
                </View>

                <Text style={styles.sectionLabel}>Security</Text>
                <View style={styles.menuCard}>
                    <MenuRow icon={Lock} title="Security Settings" onPress={() => navigation.navigate("SettingScreen")} />
                    <MenuRow icon={ShieldCheck} title="Privacy Policy" onPress={() => navigation.navigate("PrivacyAndPolicy")} isLast />
                </View>

                <Text style={styles.sectionLabel}>More</Text>
                <View style={styles.menuCard}>
                    <MenuRow icon={Info} title="About Us" onPress={() => navigation.navigate("AboutUs")} />
                    <MenuRow icon={FileText} title="Terms & Conditions" onPress={() => navigation.navigate("TermsAndConditions")} isLast />
                </View>

                <View style={styles.menuCard}>
                    <MenuRow icon={LogOut} title="Log Out" onPress={handleLogoutPress} destructive isLast />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerLogo}>{Theme.Text?.Company || 'ODHPAY'} PAY</Text>
                    <Text style={styles.footerText}>Version 1.2.37</Text>
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
                        <View style={styles.modalIconDisc}>
                            <LogOut size={26} color={color.errorFg} strokeWidth={2} />
                        </View>
                        <Text style={styles.modalTitle}>Log out?</Text>
                        <Text style={styles.modalText}>
                            You'll need to log in again to access your account.
                        </Text>

                        {isLoadingLogout ? (
                            <ActivityIndicator size="large" color={color.ink900} style={{ marginVertical: space.lg }} />
                        ) : (
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setLogoutModalVisible(false)}
                                    activeOpacity={0.7}
                                    accessibilityRole="button"
                                    accessibilityLabel="Cancel"
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={confirmLogout}
                                    activeOpacity={0.7}
                                    accessibilityRole="button"
                                    accessibilityLabel="Confirm log out"
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
        backgroundColor: color.background,
    },

    // Header
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: space.lg,
        paddingBottom: space.sm,
        backgroundColor: color.background,
    },
    headerBtn: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: color.surface,
        borderRadius: radius.pill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: color.border,
    },
    headerTitle: {
        ...type.h3,
        color: color.text,
    },

    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: space.lg,
        paddingBottom: space.xxl,
    },

    // Pay card
    payCard: {
        alignItems: "center",
        backgroundColor: color.surface,
        borderRadius: radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: color.border,
        padding: space.lg,
        marginTop: space.sm,
        marginBottom: space.lg,
        ...elevation.level1,
    },
    bankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        backgroundColor: color.surfaceMuted,
        borderRadius: radius.md,
        padding: space.md,
        marginBottom: space.lg,
    },
    bankDisc: {
        width: 40,
        height: 40,
        borderRadius: radius.pill,
        backgroundColor: color.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: space.md,
    },
    bankInfo: {
        flex: 1,
    },
    bankName: {
        ...type.label,
        color: color.text,
    },
    bankMeta: {
        ...type.caption,
        ...tabularNums,
        color: color.textSecondary,
        marginTop: space.xxs,
    },
    primaryPill: {
        backgroundColor: color.successBg,
        borderRadius: radius.pill,
        paddingVertical: space.xxs,
        paddingHorizontal: space.sm,
        marginRight: space.sm,
    },
    primaryPillText: {
        ...type.micro,
        color: color.successFg,
    },
    qrWrapper: {
        backgroundColor: color.white,
        padding: space.base,
        borderRadius: radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: color.border,
    },
    qrName: {
        ...type.h3,
        color: color.text,
        marginTop: space.base,
    },
    qrHint: {
        ...type.bodySm,
        color: color.textSecondary,
        marginTop: space.xxs,
    },

    // Menu
    sectionLabel: {
        ...type.micro,
        color: color.gray400,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: space.sm,
        marginLeft: space.xs,
    },
    menuCard: {
        backgroundColor: color.surface,
        borderRadius: radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: color.border,
        paddingHorizontal: space.base,
        marginBottom: space.lg,
        ...elevation.level1,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingVertical: space.sm,
    },
    menuRowDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: color.divider,
    },
    menuIconDisc: {
        width: 36,
        height: 36,
        borderRadius: radius.pill,
        backgroundColor: color.gray150,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: space.md,
    },
    menuIconDiscDestructive: {
        backgroundColor: color.errorBg,
    },
    menuTitle: {
        ...type.body,
        color: color.text,
        flex: 1,
    },
    menuTitleDestructive: {
        color: color.errorFg,
        fontWeight: '500',
    },
    menuBadge: {
        backgroundColor: color.successBg,
        borderRadius: radius.pill,
        paddingVertical: space.xxs,
        paddingHorizontal: space.sm,
        marginRight: space.sm,
    },
    menuBadgeText: {
        ...type.micro,
        color: color.successFg,
    },

    // Footer
    footer: {
        alignItems: 'center',
        marginTop: space.sm,
    },
    footerLogo: {
        ...type.label,
        color: color.textTertiary,
    },
    footerText: {
        ...type.caption,
        color: color.gray300,
        marginTop: space.xxs,
    },

    // Logout modal
    modalOverlay: {
        flex: 1,
        backgroundColor: color.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        padding: space.xl,
    },
    modalContent: {
        alignSelf: 'stretch',
        alignItems: 'center',
        backgroundColor: color.surface,
        borderRadius: radius.xl,
        padding: space.xl,
    },
    modalIconDisc: {
        width: 64,
        height: 64,
        borderRadius: radius.pill,
        backgroundColor: color.errorBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: space.base,
    },
    modalTitle: {
        ...type.h3,
        color: color.text,
        marginBottom: space.sm,
    },
    modalText: {
        ...type.bodySm,
        color: color.textSecondary,
        textAlign: 'center',
        marginBottom: space.xl,
    },
    modalButtons: {
        flexDirection: 'row',
        alignSelf: 'stretch',
        gap: space.md,
    },
    cancelButton: {
        flex: 1,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color.surfaceMuted,
        borderRadius: radius.md,
    },
    cancelButtonText: {
        ...type.button,
        color: color.text,
    },
    confirmButton: {
        flex: 1,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color.error,
        borderRadius: radius.md,
    },
    confirmButtonText: {
        ...type.button,
        color: color.textInverse,
    },
});

export default UserProfileScreen;
