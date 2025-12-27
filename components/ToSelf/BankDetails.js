import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Dimensions,
    Image,
    BackHandler,
    Platform,
    Animated,
    Alert,
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Theme from '../Theme';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const scale = width / 375;
const normalize = (size) => Math.round(size * Math.min(scale, 1.3));
const wp = (percentage) => (width * percentage) / 100;
const hp = (percentage) => (height * percentage) / 100;

// Dummy Bank Data
const DUMMY_BANK_ACCOUNTS = [
    {
        id: "1",
        bankName: "State Bank of India",
        bankACNumber: "32456789012345",
        bankACHolder: "Rahul Sharma",
        bankIFSC: "SBIN0001234",
        bankImage: "https://logo.clearbit.com/sbi.co.in",
        isPrimary: true,
        addedDate: "2024-01-15",
    },
    {
        id: "2",
        bankName: "HDFC Bank",
        bankACNumber: "50100123456789",
        bankACHolder: "Rahul Sharma",
        bankIFSC: "HDFC0002345",
        bankImage: "https://logo.clearbit.com/hdfcbank.com",
        isPrimary: false,
        addedDate: "2024-02-20",
    },
    {
        id: "3",
        bankName: "ICICI Bank",
        bankACNumber: "123456789012",
        bankACHolder: "Rahul Sharma",
        bankIFSC: "ICIC0003456",
        bankImage: "https://logo.clearbit.com/icicibank.com",
        isPrimary: false,
        addedDate: "2024-03-10",
    },
];

const BankCard = ({ bank, index, onDelete }) => {
    const navigation = useNavigation();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 100,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const lastFourDigits = bank.bankACNumber.slice(-4);
    const maskedNumber = '•••• •••• •••• ' + lastFourDigits;

    const handlePress = () => {
        navigation.navigate("AddAmount", {
            bankName: bank.bankName,
            account: maskedNumber,
            holder: bank.bankACHolder,
            id: bank.id
        });
    };

    const handleLongPress = () => {
        Alert.alert(
            "Remove Account",
            `Are you sure you want to remove ${bank.bankName} account ending with ${lastFourDigits}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => onDelete(bank.id) },
            ]
        );
    };

    return (
        <Animated.View
            style={[
                styles.cardWrapper,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <TouchableOpacity
                style={styles.card}
                onPress={handlePress}
                onLongPress={handleLongPress}
                activeOpacity={0.8}
            >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.bankLogoContainer}>
                        <Image
                            source={{ uri: bank.bankImage }}
                            style={styles.bankLogo}
                            defaultSource={require("../../assets/LogoN.png")}
                        />
                    </View>
                    <View style={styles.bankInfo}>
                        <View style={styles.bankNameRow}>
                            <Text style={styles.bankName} numberOfLines={1}>{bank.bankName}</Text>
                            {bank.isPrimary && (
                                <View style={styles.primaryBadge}>
                                    <Text style={styles.primaryBadgeText}>Primary</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.accountType}>Self Account</Text>
                    </View>
                    <View style={styles.arrowContainer}>
                        <MaterialIcons name="chevron-right" size={normalize(24)} color={Theme.colors.textSecondary} />
                    </View>
                </View>

                {/* Card Divider */}
                <View style={styles.cardDivider} />

                {/* Card Details */}
                <View style={styles.cardDetails}>
                    <View style={styles.detailItem}>
                        <View style={styles.detailIconContainer}>
                            <MaterialIcons name="person" size={normalize(16)} color={Theme.colors.primary} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Account Holder</Text>
                            <Text style={styles.detailValue}>{bank.bankACHolder}</Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={styles.detailIconContainer}>
                            <MaterialIcons name="credit-card" size={normalize(16)} color={Theme.colors.primary} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Account Number</Text>
                            <Text style={styles.detailValue}>{maskedNumber}</Text>
                        </View>
                    </View>

                    <View style={styles.detailItem}>
                        <View style={styles.detailIconContainer}>
                            <MaterialIcons name="pin" size={normalize(16)} color={Theme.colors.primary} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>IFSC Code</Text>
                            <Text style={styles.detailValue}>{bank.bankIFSC}</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Action */}
                <View style={styles.quickAction}>
                    <MaterialIcons name="swap-horiz" size={normalize(18)} color={Theme.colors.primary} />
                    <Text style={styles.quickActionText}>Transfer to this account</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const EmptyState = ({ onAddBank }) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.emptyContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <View style={styles.emptyIconContainer}>
                <MaterialIcons name="account-balance" size={normalize(64)} color={Theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Self Accounts</Text>
            <Text style={styles.emptyText}>
                Add your own bank account to transfer funds to yourself quickly and securely
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={onAddBank} activeOpacity={0.8}>
                <MaterialIcons name="add" size={normalize(22)} color={Theme.colors.secondary} />
                <Text style={styles.addButtonText}>Add Your Account</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const BankDetails = () => {
    const navigation = useNavigation();
    const [allBanks, setAllBanks] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                navigation.navigate('MainApp', { screen: 'HomeTab' });
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [navigation])
    );

    useEffect(() => {
        // Simulate loading with dummy data
        loadBankAccounts();
    }, []);

    const loadBankAccounts = () => {
        setRefreshing(true);
        // Simulate API delay
        setTimeout(() => {
            setAllBanks(DUMMY_BANK_ACCOUNTS);
            setRefreshing(false);
        }, 500);
    };

    const handleAddBank = () => navigation.navigate("NewBank");

    const handleDeleteBank = (bankId) => {
        setAllBanks(prev => prev.filter(bank => bank.id !== bankId));
    };

  
    if (!allBanks.length && !refreshing) {
        return (
            <View style={styles.container} >
                <EmptyState onAddBank={handleAddBank} />
            </View>
        );
    }

    return (
        <View style={styles.container} >
            <FlatList
                data={allBanks}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <BankCard bank={item} index={index} onDelete={handleDeleteBank} />
                )}
                // ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshing={refreshing}
                onRefresh={loadBankAccounts}
            />

            {/* Floating Add Button */}
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={handleAddBank}
                activeOpacity={0.8}
            >
                <MaterialIcons name="add" size={normalize(28)} color={Theme.colors.secondary} />
            </TouchableOpacity>

            {/* Info Footer */}
            <View style={styles.footer}>
                <MaterialIcons name="info-outline" size={normalize(14)} color={Theme.colors.textLight} />
                <Text style={styles.footerText}>Long press on a card to remove account</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },

    // Header Styles
    header: {
        backgroundColor: Theme.colors.secondary,
        paddingHorizontal: wp(5),
        paddingTop: hp(2),
        paddingBottom: hp(2.5),
        marginBottom: hp(1),
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    headerIconBox: {
        width: normalize(52),
        height: normalize(52),
        borderRadius: normalize(16),
        backgroundColor: Theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.shadows.md,
    },
    headerTextContainer: {
        marginLeft: normalize(14),
    },
    headerTitle: {
        fontSize: normalize(22),
        fontWeight: '800',
        color: Theme.colors.text,
    },
    headerSubtitle: {
        fontSize: normalize(14),
        color: Theme.colors.textSecondary,
        marginTop: normalize(4),
    },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.inputBg,
        borderRadius: normalize(14),
        paddingVertical: normalize(14),
        paddingHorizontal: normalize(10),
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: Theme.colors.text,
        marginTop: normalize(6),
    },
    statLabel: {
        fontSize: normalize(11),
        color: Theme.colors.textSecondary,
        marginTop: normalize(2),
    },
    statDivider: {
        width: 1,
        backgroundColor: Theme.colors.border,
    },

    // List
    listContainer: {
        paddingBottom: hp(12),
    },

    // Card Styles
    cardWrapper: {
        paddingHorizontal: wp(5),
        marginTop: hp(1.5),
    },
    card: {
        backgroundColor: Theme.colors.secondary,
        borderRadius: normalize(16),
        padding: normalize(18),
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bankLogoContainer: {
        width: normalize(50),
        height: normalize(50),
        borderRadius: normalize(14),
        backgroundColor: Theme.colors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bankLogo: {
        width: normalize(32),
        height: normalize(32),
        borderRadius: normalize(8),
    },
    bankInfo: {
        flex: 1,
        marginLeft: normalize(14),
    },
    bankNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: normalize(8),
    },
    bankName: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: Theme.colors.text,
        maxWidth: wp(40),
    },
    primaryBadge: {
        backgroundColor: Theme.colors.primary,
        paddingHorizontal: normalize(8),
        paddingVertical: normalize(3),
        borderRadius: normalize(6),
    },
    primaryBadgeText: {
        fontSize: normalize(10),
        fontWeight: '600',
        color: Theme.colors.secondary,
    },
    accountType: {
        fontSize: normalize(13),
        color: Theme.colors.textSecondary,
        marginTop: normalize(4),
    },
    arrowContainer: {
        width: normalize(36),
        height: normalize(36),
        borderRadius: normalize(10),
        backgroundColor: Theme.colors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Card Divider
    cardDivider: {
        height: 1,
        backgroundColor: Theme.colors.border,
        marginVertical: normalize(16),
    },

    // Card Details
    cardDetails: {
        gap: normalize(14),
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIconContainer: {
        width: normalize(32),
        height: normalize(32),
        borderRadius: normalize(8),
        backgroundColor: Theme.colors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: normalize(12),
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: normalize(11),
        color: Theme.colors.textSecondary,
        letterSpacing: 0.3,
        marginBottom: normalize(2),
    },
    detailValue: {
        fontSize: normalize(14),
        color: Theme.colors.text,
        fontWeight: '600',
    },

    // Quick Action
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: normalize(16),
        paddingTop: normalize(14),
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
        gap: normalize(8),
    },
    quickActionText: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: Theme.colors.primary,
    },

    // Floating Button
    floatingButton: {
        position: 'absolute',
        right: wp(5),
        bottom: hp(8),
        width: normalize(58),
        height: normalize(58),
        borderRadius: normalize(18),
        backgroundColor: Theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.shadows.md,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: hp(2),
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: normalize(6),
    },
    footerText: {
        fontSize: normalize(12),
        color: Theme.colors.textLight,
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: wp(10),
        backgroundColor: Theme.colors.background,
    },
    emptyIconContainer: {
        width: normalize(120),
        height: normalize(120),
        borderRadius: normalize(60),
        backgroundColor: Theme.colors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: normalize(28),
        ...Theme.shadows.sm,
    },
    emptyTitle: {
        fontSize: normalize(24),
        fontWeight: '800',
        color: Theme.colors.text,
        marginBottom: normalize(12),
    },
    emptyText: {
        fontSize: normalize(15),
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: normalize(22),
        marginBottom: normalize(32),
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.primary,
        paddingVertical: normalize(16),
        paddingHorizontal: normalize(28),
        borderRadius: normalize(14),
        gap: normalize(10),
        ...Theme.shadows.md,
    },
    addButtonText: {
        color: Theme.colors.secondary,
        fontSize: normalize(16),
        fontWeight: '700',
    },
});

export default BankDetails;