import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Animated,
    Modal,
    Vibration,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Theme from '../Theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { useWalletStore } from '../../store/useWalletStore';

const { width, height } = Dimensions.get('window');
const scale = width / 375;
const normalize = (size) => Math.round(size * Math.min(scale, 1.3));
const wp = (percentage) => (width * percentage) / 100;
const hp = (percentage) => (height * percentage) / 100;

// Dummy Security PIN (6 digits)
const CORRECT_PIN = "123456";

// Quick amount options
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const AddAmount = () => {
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [walletBalance, setWalletBalance] = useState(0);
    const [isLoadingBalance, setIsLoadingBalance] = useState(true);
    
    // PIN Modal State
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [pinError, setPinError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
    
    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [transactionId, setTransactionId] = useState('');

    // Animations
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const navigation = useNavigation();
    const route = useRoute();
    const { bankName, account, holder, id } = route.params || {};

    // Get fetchBalance from wallet store
    const { fetchBalance } = useWalletStore();

    // Fetch wallet balance from store on mount
    const loadWalletBalance = useCallback(async () => {
        setIsLoadingBalance(true);
        try {
            const response = await fetchBalance();
            if (response?.success !== false) {
                const balance = parseFloat(response?.available_balance || response?.balance || 0);
                setWalletBalance(balance);
            }
        } catch (err) {
            console.error('Error fetching wallet balance:', err);
            setWalletBalance(0);
        } finally {
            setIsLoadingBalance(false);
        }
    }, [fetchBalance]);

    useEffect(() => {
        loadWalletBalance();
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, [loadWalletBalance]);

    const handleAmountChange = (text) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        setAmount(numericValue);
        
        // Clear error when typing
        if (error) setError('');
        
        // Validate against wallet balance
        if (numericValue && parseInt(numericValue, 10) > walletBalance) {
            setError(`Insufficient balance. Maximum: ₹${walletBalance.toLocaleString()}`);
        }
    };

    const handleQuickAmount = (value) => {
        if (value > walletBalance) {
            setError(`Insufficient balance. Maximum: ₹${walletBalance.toLocaleString()}`);
            shakeAnimation();
            return;
        }
        setAmount(value.toString());
        setError('');
        
        // Scale animation feedback
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
    };

    const shakeAnimation = () => {
        Vibration.vibrate(100);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleProceed = () => {
        const numAmount = parseInt(amount, 10);
        
        if (!amount || numAmount <= 0) {
            setError('Please enter a valid amount');
            shakeAnimation();
            return;
        }
        
        if (numAmount > walletBalance) {
            setError(`Insufficient balance. Maximum: ₹${walletBalance.toLocaleString()}`);
            shakeAnimation();
            return;
        }

        if (numAmount < 100) {
            setError('Minimum transfer amount is ₹100');
            shakeAnimation();
            return;
        }

        // Open PIN modal
        setShowPinModal(true);
        setPinError('');
        setPin(['', '', '', '', '', '']);
        setTimeout(() => pinRefs[0].current?.focus(), 300);
    };

    // PIN Input Handling
    const handlePinChange = (value, index) => {
        if (value.length > 1) return;
        
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        setPinError('');

        // Auto-focus next input
        if (value && index < 5) {
            pinRefs[index + 1].current?.focus();
        }

        // Check PIN when all 6 digits entered
        if (index === 5 && value) {
            const enteredPin = [...newPin.slice(0, 5), value].join('');
            verifyPin(enteredPin);
        }
    };

    const handlePinKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
            pinRefs[index - 1].current?.focus();
        }
    };

    const verifyPin = (enteredPin) => {
        if (enteredPin === CORRECT_PIN) {
            // Success - Process transaction
            setShowPinModal(false);
            processTransaction();
        } else {
            // Wrong PIN
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            
            if (newAttempts >= 3) {
                setPinError('Too many attempts. Please try again later.');
                setTimeout(() => {
                    setShowPinModal(false);
                    setAttempts(0);
                }, 2000);
            } else {
                setPinError(`Wrong PIN. ${3 - newAttempts} attempts remaining.`);
                setPin(['', '', '', '', '', '']);
                shakeAnimation();
                setTimeout(() => pinRefs[0].current?.focus(), 100);
            }
        }
    };

    const processTransaction = () => {
        // Generate dummy transaction ID
        const txnId = 'TXN' + Date.now().toString().slice(-10);
        setTransactionId(txnId);
        setShowSuccessModal(true);
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        navigation.navigate('MainApp', { screen: 'HomeTab' });
    };

    const formatCurrency = (value) => {
        if (!value) return '0';
        return parseInt(value, 10).toLocaleString('en-IN');
    };

    // Calculate charges (3%)
    const charges = amount ? Math.round((parseInt(amount, 10) * 3) / 100) : 0;
    const totalDebit = amount ? parseInt(amount, 10) : 0;
    const amountToReceive = totalDebit - charges;

    return (
        <SafeAreaView style={styles.container} edges={[]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.mainWrapper}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                    >
                        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                            

                        {/* Wallet Balance */}
                        {/* <View style={styles.balanceCard}>
                            <View style={styles.balanceHeader}>
                                <MaterialIcons name="account-balance-wallet" size={normalize(22)} color={Theme.colors.primary} />
                                <Text style={styles.balanceLabel}>Available Balance</Text>
                            </View>
                            {isLoadingBalance ? (
                                <ActivityIndicator size="small" color={Theme.colors.primary} style={{ alignSelf: 'flex-start', marginTop: normalize(8) }} />
                            ) : (
                                <Text style={styles.balanceAmount}>₹{walletBalance.toLocaleString('en-IN')}</Text>
                            )}
                        </View> */}

                        {/* Amount Input Section */}
                        <View style={styles.inputSection}>
                            <Text style={styles.sectionTitle}>Enter Amount</Text>
                            
                            <Animated.View 
                                style={[
                                    styles.amountInputContainer,
                                    error ? styles.amountInputError : null,
                                    { transform: [{ translateX: shakeAnim }] }
                                ]}
                            >
                                <Text style={styles.rupeeSymbol}>₹</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder="0"
                                    placeholderTextColor={Theme.colors.textLight}
                                    value={amount}
                                    onChangeText={handleAmountChange}
                                    keyboardType="number-pad"
                                    maxLength={7}
                                />
                            </Animated.View>
                            
                            {error ? (
                                <View style={styles.errorContainer}>
                                    <MaterialIcons name="error-outline" size={normalize(16)} color={Theme.colors.danger} />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            {/* Quick Amount Buttons */}
                            <View style={styles.quickAmountsContainer}>
                                {QUICK_AMOUNTS.map((value) => (
                                    <Animated.View key={value} style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
                                        <TouchableOpacity
                                            style={[
                                                styles.quickAmountBtn,
                                                value > walletBalance && styles.quickAmountBtnDisabled,
                                            ]}
                                            onPress={() => handleQuickAmount(value)}
                                            activeOpacity={0.7}
                                            disabled={value > walletBalance || isLoadingBalance}
                                        >
                                            <Text style={[
                                                styles.quickAmountText,
                                                value > walletBalance && styles.quickAmountTextDisabled,
                                            ]}>
                                                +₹{value.toLocaleString()}
                                            </Text>
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                            </View>
                        </View>

                        {/* Transaction Summary */}
                        {amount && parseInt(amount, 10) >= 100 && !error && (
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>Transaction Summary</Text>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Transfer Amount</Text>
                                    <Text style={styles.summaryValue}>₹{formatCurrency(amount)}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Service Charges (3%)</Text>
                                    <Text style={styles.summaryValueCharge}>-₹{charges.toLocaleString()}</Text>
                                </View>
                                <View style={styles.summaryDivider} />
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabelBold}>Amount to Receive</Text>
                                    <Text style={styles.summaryValueBold}>₹{amountToReceive.toLocaleString()}</Text>
                                </View>
                            </View>
                        )}

                        {/* Info Note */}
                        <View style={styles.infoNote}>
                            <MaterialIcons name="info-outline" size={normalize(16)} color={Theme.colors.textSecondary} />
                            <Text style={styles.infoNoteText}>
                                Transfer typically completes within 2-4 hours. No hidden charges.
                            </Text>
                        </View>
                    </Animated.View>
                    </ScrollView>

                    {/* Proceed Button - Fixed at Bottom */}
                    <View style={styles.bottomContainer}>
                        <TouchableOpacity
                            style={[
                                styles.proceedButton,
                                (!amount || error || isLoadingBalance) && styles.proceedButtonDisabled,
                            ]}
                            onPress={handleProceed}
                            disabled={!amount || !!error || isLoadingBalance}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.proceedButtonText}>
                                {amount ? `Transfer ₹${formatCurrency(amount)}` : 'Enter Amount'}
                            </Text>
                            <MaterialIcons name="arrow-forward" size={normalize(22)} color={Theme.colors.secondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* PIN Modal */}
            <Modal
                visible={showPinModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPinModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pinModalContent}>
                        <TouchableOpacity
                            style={styles.pinModalClose}
                            onPress={() => setShowPinModal(false)}
                        >
                            <MaterialIcons name="close" size={normalize(24)} color={Theme.colors.text} />
                        </TouchableOpacity>

                        <View style={styles.pinIconContainer}>
                            <MaterialIcons name="lock" size={normalize(36)} color={Theme.colors.secondary} />
                        </View>

                        <Text style={styles.pinTitle}>Enter Security PIN</Text>
                        <Text style={styles.pinSubtitle}>
                            Enter your 6-digit PIN to confirm transfer of ₹{formatCurrency(amount)}
                        </Text>

                        <Animated.View style={[styles.pinInputContainer, { transform: [{ translateX: shakeAnim }] }]}>
                            {pin.map((digit, index) => (
                                <View key={index} style={[
                                    styles.pinInputBox,
                                    digit && styles.pinInputBoxFilled,
                                    pinError && styles.pinInputBoxError,
                                ]}>
                                    <TextInput
                                        ref={pinRefs[index]}
                                        style={styles.pinInput}
                                        value={digit}
                                        onChangeText={(value) => handlePinChange(value, index)}
                                        onKeyPress={(e) => handlePinKeyPress(e, index)}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        secureTextEntry
                                    />
                                </View>
                            ))}
                        </Animated.View>

                        {pinError ? (
                            <View style={styles.pinErrorContainer}>
                                <MaterialIcons name="error" size={normalize(18)} color={Theme.colors.danger} />
                                <Text style={styles.pinErrorText}>{pinError}</Text>
                            </View>
                        ) : (
                            <Text style={styles.pinHint}>Hint: Use 123456 for demo</Text>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={handleSuccessClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.successModalContent}>
                        <LottieView
                            source={require('../../Animation/success.json')}
                            autoPlay
                            loop={false}
                            style={styles.successAnimation}
                        />

                        <Text style={styles.successTitle}>Transfer Successful!</Text>
                        <Text style={styles.successAmount}>₹{formatCurrency(amount)}</Text>

                        <View style={styles.successDetails}>
                            <View style={styles.successDetailRow}>
                                <Text style={styles.successDetailLabel}>To</Text>
                                <Text style={styles.successDetailValue}>{holder}</Text>
                            </View>
                            <View style={styles.successDetailRow}>
                                <Text style={styles.successDetailLabel}>Bank</Text>
                                <Text style={styles.successDetailValue}>{bankName}</Text>
                            </View>
                            <View style={styles.successDetailRow}>
                                <Text style={styles.successDetailLabel}>Transaction ID</Text>
                                <Text style={styles.successDetailValue}>{transactionId}</Text>
                            </View>
                        </View>

                        <Text style={styles.successNote}>
                            Amount will be credited within 2-4 hours
                        </Text>

                        <TouchableOpacity
                            style={styles.successButton}
                            onPress={handleSuccessClose}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.successButtonText}>Back to Home</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    mainWrapper: {
        flex: 1,
        justifyContent: 'space-between',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: normalize(20),
    },
    content: {
        paddingHorizontal: wp(5),
        paddingTop: hp(2),
    },

    // Recipient Card
    recipientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.secondary,
        padding: normalize(16),
        borderRadius: normalize(16),
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    recipientIconContainer: {
        width: normalize(52),
        height: normalize(52),
        borderRadius: normalize(14),
        backgroundColor: Theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recipientInfo: {
        flex: 1,
        marginLeft: normalize(14),
    },
    recipientName: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: Theme.colors.text,
    },
    recipientBank: {
        fontSize: normalize(13),
        color: Theme.colors.textSecondary,
        marginTop: normalize(4),
    },
    recipientAccount: {
        fontSize: normalize(12),
        color: Theme.colors.textLight,
        marginTop: normalize(2),
    },

    // Balance Card
    balanceCard: {
        backgroundColor: Theme.colors.inputBg,
        padding: normalize(16),
        borderRadius: normalize(12),
        marginBottom: hp(3),
    },
    balanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(8),
        marginBottom: normalize(8),
    },
    balanceLabel: {
        fontSize: normalize(13),
        color: Theme.colors.textSecondary,
    },
    balanceAmount: {
        fontSize: normalize(28),
        fontWeight: '800',
        color: Theme.colors.text,
    },

    // Input Section
    inputSection: {
        marginBottom: hp(2),
    },
    sectionTitle: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: Theme.colors.text,
        marginBottom: normalize(12),
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.secondary,
        borderWidth: 2,
        borderColor: Theme.colors.primary,
        borderRadius: normalize(16),
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(16),
    },
    amountInputError: {
        borderColor: Theme.colors.danger,
    },
    rupeeSymbol: {
        fontSize: normalize(36),
        fontWeight: '700',
        color: Theme.colors.primary,
        marginRight: normalize(8),
    },
    amountInput: {
        flex: 1,
        fontSize: normalize(36),
        fontWeight: '700',
        color: Theme.colors.text,
        padding: 0,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: normalize(10),
        gap: normalize(6),
    },
    errorText: {
        fontSize: normalize(13),
        color: Theme.colors.danger,
    },

    // Quick Amounts
    quickAmountsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: normalize(16),
        gap: normalize(10),
    },
    quickAmountBtn: {
        flex: 1,
        backgroundColor: Theme.colors.secondary,
        paddingVertical: normalize(12),
        paddingHorizontal: normalize(8),
        borderRadius: normalize(10),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    quickAmountBtnDisabled: {
        opacity: 0.4,
    },
    quickAmountText: {
        fontSize: normalize(13),
        fontWeight: '600',
        color: Theme.colors.primary,
    },
    quickAmountTextDisabled: {
        color: Theme.colors.textLight,
    },

    // Summary Card
    summaryCard: {
        backgroundColor: Theme.colors.secondary,
        padding: normalize(18),
        borderRadius: normalize(14),
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    summaryTitle: {
        fontSize: normalize(15),
        fontWeight: '700',
        color: Theme.colors.text,
        marginBottom: normalize(14),
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: normalize(10),
    },
    summaryLabel: {
        fontSize: normalize(14),
        color: Theme.colors.textSecondary,
    },
    summaryValue: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: Theme.colors.text,
    },
    summaryValueCharge: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: Theme.colors.danger,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: Theme.colors.border,
        marginVertical: normalize(10),
    },
    summaryLabelBold: {
        fontSize: normalize(15),
        fontWeight: '700',
        color: Theme.colors.text,
    },
    summaryValueBold: {
        fontSize: normalize(17),
        fontWeight: '800',
        color: Theme.colors.success,
    },

    // Info Note
    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Theme.colors.inputBg,
        padding: normalize(14),
        borderRadius: normalize(10),
        gap: normalize(10),
    },
    infoNoteText: {
        flex: 1,
        fontSize: normalize(13),
        color: Theme.colors.textSecondary,
        lineHeight: normalize(18),
    },

    // Bottom Container - Fixed at bottom
    bottomContainer: {
        paddingHorizontal: wp(5),
        paddingTop: normalize(12),
        paddingBottom: normalize(8),
        backgroundColor: Theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    proceedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.colors.primary,
        paddingVertical: normalize(16),
        borderRadius: normalize(14),
        gap: normalize(10),
        ...Theme.shadows.md,
    },
    proceedButtonDisabled: {
        backgroundColor: Theme.colors.textLight,
        ...Theme.shadows.sm,
    },
    proceedButtonText: {
        fontSize: normalize(17),
        fontWeight: '700',
        color: Theme.colors.secondary,
    },

    // Modal Overlay
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },

    // PIN Modal
    pinModalContent: {
        backgroundColor: Theme.colors.secondary,
        borderTopLeftRadius: normalize(28),
        borderTopRightRadius: normalize(28),
        paddingHorizontal: wp(6),
        paddingTop: hp(3),
        paddingBottom: hp(5),
        alignItems: 'center',
    },
    pinModalClose: {
        position: 'absolute',
        top: hp(2),
        right: wp(5),
        width: normalize(40),
        height: normalize(40),
        borderRadius: normalize(20),
        backgroundColor: Theme.colors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pinIconContainer: {
        width: normalize(72),
        height: normalize(72),
        borderRadius: normalize(20),
        backgroundColor: Theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: normalize(20),
    },
    pinTitle: {
        fontSize: normalize(22),
        fontWeight: '800',
        color: Theme.colors.text,
        marginBottom: normalize(10),
    },
    pinSubtitle: {
        fontSize: normalize(14),
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: normalize(28),
        paddingHorizontal: wp(5),
    },
    pinInputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: normalize(10),
        marginBottom: normalize(20),
    },
    pinInputBox: {
        width: normalize(46),
        height: normalize(54),
        borderRadius: normalize(12),
        borderWidth: 2,
        borderColor: Theme.colors.border,
        backgroundColor: Theme.colors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pinInputBoxFilled: {
        borderColor: Theme.colors.primary,
        backgroundColor: Theme.colors.secondary,
    },
    pinInputBoxError: {
        borderColor: Theme.colors.danger,
    },
    pinInput: {
        fontSize: normalize(20),
        fontWeight: '700',
        color: Theme.colors.text,
        textAlign: 'center',
        width: '100%',
        height: '100%',
    },
    pinErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(6),
    },
    pinErrorText: {
        fontSize: normalize(14),
        color: Theme.colors.danger,
        fontWeight: '500',
    },
    pinHint: {
        fontSize: normalize(13),
        color: Theme.colors.textLight,
    },

    // Success Modal
    successModalContent: {
        backgroundColor: Theme.colors.secondary,
        marginHorizontal: wp(5),
        marginBottom: hp(10),
        borderRadius: normalize(24),
        paddingHorizontal: wp(6),
        paddingVertical: hp(3),
        alignItems: 'center',
        alignSelf: 'center',
        width: wp(90),
    },
    successAnimation: {
        width: normalize(150),
        height: normalize(150),
    },
    successTitle: {
        fontSize: normalize(24),
        fontWeight: '800',
        color: Theme.colors.success,
        marginBottom: normalize(8),
    },
    successAmount: {
        fontSize: normalize(36),
        fontWeight: '800',
        color: Theme.colors.text,
        marginBottom: normalize(24),
    },
    successDetails: {
        width: '100%',
        backgroundColor: Theme.colors.inputBg,
        borderRadius: normalize(14),
        padding: normalize(16),
        marginBottom: normalize(16),
    },
    successDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: normalize(10),
    },
    successDetailLabel: {
        fontSize: normalize(13),
        color: Theme.colors.textSecondary,
    },
    successDetailValue: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: Theme.colors.text,
        maxWidth: wp(50),
        textAlign: 'right',
    },
    successNote: {
        fontSize: normalize(13),
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: normalize(20),
    },
    successButton: {
        width: '100%',
        backgroundColor: Theme.colors.primary,
        paddingVertical: normalize(16),
        borderRadius: normalize(12),
        alignItems: 'center',
    },
    successButtonText: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: Theme.colors.secondary,
    },
});

export default AddAmount;
