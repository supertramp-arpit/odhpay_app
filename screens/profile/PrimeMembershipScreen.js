import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    Modal,
    TextInput,
    Vibration,
    ScrollView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Theme from '../../components/Theme';
import { useWalletStore } from '../../store/useWalletStore';

const { width, height } = Dimensions.get('window');
const scale = width / 375;
const normalize = (size) => Math.round(size * Math.min(scale, 1.3));
const wp = (percentage) => (width * percentage) / 100;
const hp = (percentage) => (height * percentage) / 100;

// Prime Membership Price
const PRIME_PRICE = 2;

// Security PIN (6 digits)
const CORRECT_PIN = "123456";

// Prime Benefits
const PRIME_BENEFITS = [
    {
        icon: 'flash-on',
        title: 'Instant Transfers',
        description: 'Lightning-fast money transfers to any bank',
    },
    {
        icon: 'percent',
        title: 'Zero Fees',
        description: 'No transaction charges on wallet transfers',
    },
    {
        icon: 'card-giftcard',
        title: 'Exclusive Rewards',
        description: 'Earn 2x cashback on all transactions',
    },
    {
        icon: 'support-agent',
        title: 'Priority Support',
        description: '24/7 dedicated customer support',
    },
    {
        icon: 'verified',
        title: 'Verified Badge',
        description: 'Get a verified prime member badge',
    },
    {
        icon: 'local-offer',
        title: 'Special Offers',
        description: 'Access to exclusive deals & discounts',
    },
];

const PrimeMembershipScreen = () => {
    const navigation = useNavigation();
    
    // Prime membership state
    const [isPrimeMember, setIsPrimeMember] = useState(false);
    const [primeActivatedDate, setPrimeActivatedDate] = useState(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    
    // Wallet balance state
    const [walletBalance, setWalletBalance] = useState(0);
    const [isLoadingBalance, setIsLoadingBalance] = useState(true);
    
    // PIN Modal State
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [pinError, setPinError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
    
    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [transactionId, setTransactionId] = useState('');
    
    // Low Balance Modal State
    const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Get fetchBalance from wallet store
    const { fetchBalance } = useWalletStore();

    // Check Prime membership status
    useEffect(() => {
        const checkPrimeStatus = async () => {
            try {
                const primeStatus = await AsyncStorage.getItem('isPrimeMember');
                const activatedAt = await AsyncStorage.getItem('primeActivatedAt');
                setIsPrimeMember(primeStatus === 'true');
                if (activatedAt) {
                    setPrimeActivatedDate(new Date(activatedAt));
                }
            } catch (error) {
                console.error('Error checking prime status:', error);
            } finally {
                setIsCheckingStatus(false);
            }
        };
        checkPrimeStatus();
    }, []);

    // Fetch wallet balance
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
        
        // Entry animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for CTA button
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.03,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [loadWalletBalance]);

    const shakeAnimation = () => {
        Vibration.vibrate(100);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleActivatePrime = () => {
        if (isLoadingBalance) return;
        
        // Check if balance is sufficient
        if (walletBalance < PRIME_PRICE) {
            setShowLowBalanceModal(true);
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

        if (value && index < 5) {
            pinRefs[index + 1].current?.focus();
        }

        // Auto-submit when all 6 digits entered
        if (value && index === 5) {
            const fullPin = newPin.join('');
            if (fullPin.length === 6) {
                verifyPin(fullPin);
            }
        }
    };

    const handlePinKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
            pinRefs[index - 1].current?.focus();
            const newPin = [...pin];
            newPin[index - 1] = '';
            setPin(newPin);
        }
    };

    const verifyPin = (enteredPin) => {
        if (enteredPin === CORRECT_PIN) {
            setIsProcessing(true);
            // Simulate API call
            setTimeout(() => {
                processTransaction();
            }, 1500);
        } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            shakeAnimation();

            if (newAttempts >= 3) {
                setPinError('Too many attempts. Please try again later.');
                setTimeout(() => {
                    setShowPinModal(false);
                    setAttempts(0);
                    setIsProcessing(false);
                }, 2000);
            } else {
                setPinError(`Wrong PIN. ${3 - newAttempts} attempts remaining.`);
                setPin(['', '', '', '', '', '']);
                setTimeout(() => pinRefs[0].current?.focus(), 100);
            }
        }
    };

    const processTransaction = async () => {
        setIsProcessing(false);
        setShowPinModal(false);
        
        // Generate transaction ID
        const txnId = 'PRIME' + Date.now().toString().slice(-10);
        setTransactionId(txnId);
        
        // Update wallet balance locally
        setWalletBalance(prev => prev - PRIME_PRICE);
        
        // Save Prime membership status
        try {
            await AsyncStorage.setItem('isPrimeMember', 'true');
            await AsyncStorage.setItem('primeActivatedAt', new Date().toISOString());
        } catch (error) {
            console.error('Error saving prime status:', error);
        }
        
        // Show success modal
        setShowSuccessModal(true);
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        navigation.goBack();
    };

    const handleAddFunds = () => {
        setShowLowBalanceModal(false);
        navigation.navigate('Wallet');
    };

    const BenefitCard = ({ icon, title, description, index }) => (
        <Animated.View 
            style={[
                styles.benefitCard,
                { 
                    opacity: fadeAnim,
                    transform: [
                        { scale: scaleAnim },
                        { translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                        })}
                    ],
                }
            ]}
        >
            <View style={styles.benefitIconContainer}>
                <MaterialIcons name={icon} size={normalize(24)} color={Theme.colors.primary} />
            </View>
            <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>{title}</Text>
                <Text style={styles.benefitDescription}>{description}</Text>
            </View>
        </Animated.View>
    );

    // Show loading while checking prime status
    if (isCheckingStatus) {
        return (
            <View style={styles.container} edges={['top', 'bottom']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                    <Text style={styles.loadingText}>Checking membership status...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Prime Membership</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={isPrimeMember ? ['#1a1a1a', '#2d2d2d'] : ['#1a1a1a', '#333333']}
                        style={styles.heroGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {isPrimeMember && (
                            <View style={styles.memberBadge}>
                                <MaterialIcons name="verified" size={normalize(14)} color="#FFD700" />
                                <Text style={styles.memberBadgeText}>ACTIVE MEMBER</Text>
                            </View>
                        )}
                        <View style={styles.primeIconContainer}>
                            <MaterialIcons name="workspace-premium" size={normalize(48)} color="#FFD700" />
                        </View>
                        <Text style={styles.heroTitle}>
                            {isPrimeMember ? 'Prime Member' : 'Go Prime'}
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            {isPrimeMember 
                                ? 'You are enjoying exclusive benefits' 
                                : 'Unlock exclusive benefits & features'
                            }
                        </Text>
                        
                        {isPrimeMember ? (
                            <View style={styles.memberSinceContainer}>
                                <MaterialIcons name="event" size={normalize(16)} color="#FFD700" />
                                <Text style={styles.memberSinceText}>
                                    Member since {primeActivatedDate 
                                        ? new Date(primeActivatedDate).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })
                                        : 'N/A'
                                    }
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.priceContainer}>
                                <Text style={styles.priceLabel}>Only</Text>
                                <Text style={styles.priceAmount}>₹{PRIME_PRICE}</Text>
                                <Text style={styles.pricePeriod}>lifetime</Text>
                            </View>
                        )}
                    </LinearGradient>
                </Animated.View>

                {/* Wallet Balance Card - Only for non-members */}
                {!isPrimeMember && (
                <Animated.View style={[styles.balanceCard, { opacity: fadeAnim }]}>
                    <View style={styles.balanceLeft}>
                        <MaterialIcons name="account-balance-wallet" size={normalize(22)} color={Theme.colors.primary} />
                        <Text style={styles.balanceLabel}>Wallet Balance</Text>
                    </View>
                    {isLoadingBalance ? (
                        <ActivityIndicator size="small" color={Theme.colors.primary} />
                    ) : (
                        <Text style={[
                            styles.balanceAmount,
                            walletBalance < PRIME_PRICE && styles.balanceAmountLow
                        ]}>
                            ₹{walletBalance.toLocaleString('en-IN')}
                        </Text>
                    )}
                </Animated.View>
                )}

                {/* Benefits Section */}
                <View style={styles.benefitsSection}>
                    <Text style={styles.sectionTitle}>
                        {isPrimeMember ? 'Your Prime Benefits' : 'Prime Benefits'}
                    </Text>
                    {PRIME_BENEFITS.map((benefit, index) => (
                        <BenefitCard key={index} {...benefit} index={index} />
                    ))}
                </View>

                {/* Terms Note - Only for non-members */}
                {!isPrimeMember && (
                <View style={styles.termsNote}>
                    <MaterialIcons name="info-outline" size={normalize(16)} color={Theme.colors.textSecondary} />
                    <Text style={styles.termsText}>
                        By activating Prime, you agree to our terms and conditions. Amount will be deducted from your wallet.
                    </Text>
                </View>
                )}
            </ScrollView>

            {/* Bottom CTA */}
            {!isPrimeMember && (
            <View style={styles.bottomContainer}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <TouchableOpacity
                        style={[
                            styles.activateButton,
                            (isLoadingBalance || walletBalance < PRIME_PRICE) && styles.activateButtonDisabled,
                        ]}
                        onPress={handleActivatePrime}
                        activeOpacity={0.8}
                        disabled={isLoadingBalance}
                    >
                        <LinearGradient
                            colors={walletBalance >= PRIME_PRICE ? ['#1a1a1a', '#333333'] : ['#9CA3AF', '#9CA3AF']}
                            style={styles.activateButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <MaterialIcons name="workspace-premium" size={normalize(22)} color="#FFD700" />
                            <Text style={styles.activateButtonText}>
                                {walletBalance < PRIME_PRICE && !isLoadingBalance 
                                    ? 'Insufficient Balance' 
                                    : `Activate Prime • ₹${PRIME_PRICE}`
                                }
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
            )}

            {/* PIN Modal */}
            <Modal
                visible={showPinModal}
                transparent
                animationType="slide"
                onRequestClose={() => !isProcessing && setShowPinModal(false)}
            >
                <View style={styles.pinModalOverlay}>
                    <View style={styles.pinModalContent}>
                        {/* Modal Handle */}
                        <View style={styles.pinModalHandle} />
                        
                        {/* Close Button */}
                        {!isProcessing && (
                            <TouchableOpacity
                                style={styles.pinModalClose}
                                onPress={() => setShowPinModal(false)}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons name="close" size={normalize(22)} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}

                        {/* Header Section */}
                        <View style={styles.pinHeader}>
                            <LinearGradient
                                colors={['#1a1a1a', '#333333']}
                                style={styles.pinIconContainer}
                            >
                                <MaterialIcons name="lock" size={normalize(28)} color="#FFD700" />
                            </LinearGradient>
                            
                            <Text style={styles.pinTitle}>Enter Security PIN</Text>
                            <Text style={styles.pinSubtitle}>
                                Confirm payment of <Text style={styles.pinAmountHighlight}>₹{PRIME_PRICE}</Text> for Prime
                            </Text>
                        </View>

                        {isProcessing ? (
                            <View style={styles.processingContainer}>
                                <View style={styles.processingSpinner}>
                                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                                </View>
                                <Text style={styles.processingText}>Processing payment...</Text>
                                <Text style={styles.processingSubtext}>Please wait, do not close this screen</Text>
                            </View>
                        ) : (
                            <>
                                {/* PIN Input Display */}
                                <Animated.View style={[styles.pinInputWrapper, { transform: [{ translateX: shakeAnim }] }]}>
                                    <View style={styles.pinInputContainer}>
                                        {pin.map((digit, index) => (
                                            <View
                                                key={index}
                                                style={[
                                                    styles.pinInputBox,
                                                    digit && styles.pinInputBoxFilled,
                                                    pinError && styles.pinInputBoxError,
                                                ]}
                                            >
                                                {digit ? (
                                                    <View style={styles.pinDot} />
                                                ) : (
                                                    <View style={styles.pinDotEmpty} />
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                    
                                    {/* Hidden TextInput for keyboard */}
                                    <TextInput
                                        ref={pinRefs[0]}
                                        style={styles.hiddenInput}
                                        value={pin.join('')}
                                        onChangeText={(text) => {
                                            const digits = text.replace(/[^0-9]/g, '').slice(0, 6).split('');
                                            const newPin = [...digits, ...Array(6 - digits.length).fill('')];
                                            setPin(newPin);
                                            setPinError('');
                                            if (digits.length === 6) {
                                                verifyPin(digits.join(''));
                                            }
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        autoFocus
                                        caretHidden
                                    />
                                </Animated.View>

                                {/* Error Message */}
                                {pinError ? (
                                    <View style={styles.pinErrorContainer}>
                                        <MaterialIcons name="error-outline" size={normalize(18)} color={Theme.colors.danger} />
                                        <Text style={styles.pinErrorText}>{pinError}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.pinErrorPlaceholder} />
                                )}

                                {/* Numeric Keypad */}
                                <View style={styles.numericKeypad}>
                                    {[[1, 2, 3], [4, 5, 6], [7, 8, 9], ['', 0, 'delete']].map((row, rowIndex) => (
                                        <View key={rowIndex} style={styles.keypadRow}>
                                            {row.map((key, keyIndex) => (
                                                <TouchableOpacity
                                                    key={keyIndex}
                                                    style={[
                                                        styles.keypadButton,
                                                        key === '' && styles.keypadButtonEmpty,
                                                    ]}
                                                    onPress={() => {
                                                        if (key === 'delete') {
                                                            const currentPin = pin.join('');
                                                            if (currentPin.length > 0) {
                                                                const newPin = currentPin.slice(0, -1).split('');
                                                                setPin([...newPin, ...Array(6 - newPin.length).fill('')]);
                                                            }
                                                        } else if (key !== '') {
                                                            const currentPin = pin.join('');
                                                            if (currentPin.length < 6) {
                                                                const newPin = (currentPin + key).split('');
                                                                setPin([...newPin, ...Array(6 - newPin.length).fill('')]);
                                                                setPinError('');
                                                                if (newPin.length === 6) {
                                                                    verifyPin(newPin.join(''));
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    activeOpacity={key === '' ? 1 : 0.6}
                                                    disabled={key === ''}
                                                >
                                                    {key === 'delete' ? (
                                                        <MaterialIcons name="backspace" size={normalize(24)} color="#1a1a1a" />
                                                    ) : key !== '' ? (
                                                        <Text style={styles.keypadButtonText}>{key}</Text>
                                                    ) : null}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ))}
                                </View>

                                {/* Hint */}
                                <View style={styles.pinHintContainer}>
                                    <MaterialIcons name="security" size={normalize(14)} color={Theme.colors.textLight} />
                                    <Text style={styles.pinHint}>Your PIN is encrypted and secure</Text>
                                </View>
                            </>
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

                        <View style={styles.primeActivatedBadge}>
                            <MaterialIcons name="workspace-premium" size={normalize(28)} color="#FFD700" />
                        </View>

                        <Text style={styles.successTitle}>Welcome to Prime!</Text>
                        <Text style={styles.successSubtitle}>
                            Your Prime membership is now active. Enjoy exclusive benefits!
                        </Text>

                        <View style={styles.successDetailsCard}>
                            <View style={styles.successDetailRow}>
                                <Text style={styles.successDetailLabel}>Transaction ID</Text>
                                <Text style={styles.successDetailValue}>{transactionId}</Text>
                            </View>
                            <View style={styles.successDetailDivider} />
                            <View style={styles.successDetailRow}>
                                <Text style={styles.successDetailLabel}>Amount Paid</Text>
                                <Text style={styles.successDetailValueBold}>₹{PRIME_PRICE}</Text>
                            </View>
                            <View style={styles.successDetailDivider} />
                            <View style={styles.successDetailRow}>
                                <Text style={styles.successDetailLabel}>Status</Text>
                                <View style={styles.successStatusBadge}>
                                    <Text style={styles.successStatusText}>ACTIVATED</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.successButton}
                            onPress={handleSuccessClose}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.successButtonText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Low Balance Modal */}
            <Modal
                visible={showLowBalanceModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLowBalanceModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.lowBalanceModalContent}>
                        <View style={styles.lowBalanceIconContainer}>
                            <MaterialIcons name="account-balance-wallet" size={normalize(40)} color={Theme.colors.danger} />
                        </View>

                        <Text style={styles.lowBalanceTitle}>Insufficient Balance</Text>
                        <Text style={styles.lowBalanceSubtitle}>
                            Your wallet balance is ₹{walletBalance.toLocaleString('en-IN')}. You need ₹{PRIME_PRICE} to activate Prime membership.
                        </Text>

                        <View style={styles.lowBalanceActions}>
                            <TouchableOpacity
                                style={styles.lowBalanceCancelBtn}
                                onPress={() => setShowLowBalanceModal(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.lowBalanceCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.lowBalanceAddFundsBtn}
                                onPress={handleAddFunds}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons name="add" size={normalize(20)} color="#FFFFFF" />
                                <Text style={styles.lowBalanceAddFundsText}>Add Funds</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingVertical: normalize(12),
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        width: normalize(40),
        height: normalize(40),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: normalize(20),
    },
    headerTitle: {
        fontSize: normalize(18),
        fontWeight: '600',
        color: '#1a1a1a',
    },
    headerSpacer: {
        width: normalize(40),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: normalize(16),
    },
    loadingText: {
        fontSize: normalize(14),
        color: Theme.colors.textSecondary,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: normalize(100),
    },

    // Hero Section
    heroSection: {
        marginHorizontal: wp(5),
        marginTop: hp(2),
        borderRadius: normalize(20),
        overflow: 'hidden',
    },
    heroGradient: {
        paddingVertical: hp(4),
        paddingHorizontal: wp(6),
        alignItems: 'center',
    },
    primeIconContainer: {
        width: normalize(80),
        height: normalize(80),
        borderRadius: normalize(40),
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: normalize(16),
    },
    heroTitle: {
        fontSize: normalize(28),
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: normalize(8),
    },
    heroSubtitle: {
        fontSize: normalize(15),
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: normalize(20),
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: normalize(6),
    },
    priceLabel: {
        fontSize: normalize(14),
        color: 'rgba(255, 255, 255, 0.7)',
    },
    priceAmount: {
        fontSize: normalize(36),
        fontWeight: '800',
        color: '#FFD700',
    },
    pricePeriod: {
        fontSize: normalize(14),
        color: 'rgba(255, 255, 255, 0.7)',
    },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(6),
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        paddingHorizontal: normalize(14),
        paddingVertical: normalize(6),
        borderRadius: normalize(20),
        marginBottom: normalize(16),
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    memberBadgeText: {
        fontSize: normalize(11),
        fontWeight: '700',
        color: '#FFD700',
        letterSpacing: 1,
    },
    memberSinceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(8),
        marginTop: normalize(8),
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(10),
        borderRadius: normalize(10),
    },
    memberSinceText: {
        fontSize: normalize(13),
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },

    // Balance Card
    balanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: wp(5),
        marginTop: hp(2),
        padding: normalize(16),
        backgroundColor: '#FFFFFF',
        borderRadius: normalize(14),
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    balanceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(10),
    },
    balanceLabel: {
        fontSize: normalize(14),
        color: Theme.colors.textSecondary,
        fontWeight: '500',
    },
    balanceAmount: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: Theme.colors.text,
    },
    balanceAmountLow: {
        color: Theme.colors.danger,
    },

    // Benefits Section
    benefitsSection: {
        marginTop: hp(3),
        paddingHorizontal: wp(5),
    },
    sectionTitle: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: Theme.colors.text,
        marginBottom: normalize(16),
    },
    benefitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: normalize(16),
        borderRadius: normalize(14),
        marginBottom: normalize(12),
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    benefitIconContainer: {
        width: normalize(48),
        height: normalize(48),
        borderRadius: normalize(14),
        backgroundColor: Theme.colors.primary + '12',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: normalize(14),
    },
    benefitTextContainer: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: Theme.colors.text,
        marginBottom: normalize(4),
    },
    benefitDescription: {
        fontSize: normalize(13),
        color: Theme.colors.textSecondary,
        lineHeight: normalize(18),
    },

    // Terms Note
    termsNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginHorizontal: wp(5),
        marginTop: hp(2),
        padding: normalize(14),
        backgroundColor: '#FFF9E6',
        borderRadius: normalize(12),
        gap: normalize(10),
    },
    termsText: {
        flex: 1,
        fontSize: normalize(12),
        color: Theme.colors.textSecondary,
        lineHeight: normalize(18),
    },

    // Bottom Container
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: wp(5),
        paddingTop: normalize(16),
        paddingBottom: Platform.OS === 'ios' ? normalize(24) : normalize(20),
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    activateButton: {
        borderRadius: normalize(14),
        overflow: 'hidden',
    },
    activateButtonDisabled: {
        opacity: 0.7,
    },
    activateButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: normalize(16),
        gap: normalize(10),
    },
    activateButtonText: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // PIN Modal Overlay
    pinModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    pinModalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: normalize(28),
        borderTopRightRadius: normalize(28),
        paddingHorizontal: wp(5),
        paddingBottom: Platform.OS === 'ios' ? hp(4) : hp(3),
        maxHeight: hp(85),
    },
    pinModalHandle: {
        width: normalize(40),
        height: normalize(4),
        backgroundColor: '#E0E0E0',
        borderRadius: normalize(2),
        alignSelf: 'center',
        marginTop: normalize(12),
        marginBottom: normalize(8),
    },
    pinModalClose: {
        position: 'absolute',
        top: normalize(16),
        right: normalize(16),
        width: normalize(36),
        height: normalize(36),
        borderRadius: normalize(18),
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    pinHeader: {
        alignItems: 'center',
        paddingTop: normalize(16),
        paddingBottom: normalize(20),
    },
    pinIconContainer: {
        width: normalize(64),
        height: normalize(64),
        borderRadius: normalize(32),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: normalize(16),
    },
    pinTitle: {
        fontSize: normalize(22),
        fontWeight: '700',
        color: Theme.colors.text,
        marginBottom: normalize(8),
    },
    pinSubtitle: {
        fontSize: normalize(14),
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: normalize(20),
    },
    pinAmountHighlight: {
        fontWeight: '700',
        color: Theme.colors.primary,
    },
    pinInputWrapper: {
        alignItems: 'center',
        marginBottom: normalize(8),
    },
    pinInputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: normalize(12),
    },
    pinInputBox: {
        width: normalize(48),
        height: normalize(56),
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: normalize(14),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    pinInputBoxFilled: {
        borderColor: Theme.colors.primary,
        backgroundColor: Theme.colors.primary + '08',
    },
    pinInputBoxError: {
        borderColor: Theme.colors.danger,
        backgroundColor: Theme.colors.danger + '08',
    },
    pinDot: {
        width: normalize(14),
        height: normalize(14),
        borderRadius: normalize(7),
        backgroundColor: Theme.colors.primary,
    },
    pinDotEmpty: {
        width: normalize(10),
        height: normalize(10),
        borderRadius: normalize(5),
        backgroundColor: '#D0D0D0',
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
        width: 1,
        height: 1,
    },
    pinErrorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: normalize(8),
        paddingVertical: normalize(12),
        paddingHorizontal: normalize(16),
        backgroundColor: Theme.colors.danger + '10',
        borderRadius: normalize(10),
        marginBottom: normalize(16),
    },
    pinErrorText: {
        fontSize: normalize(14),
        fontWeight: '500',
        color: Theme.colors.danger,
    },
    pinErrorPlaceholder: {
        height: normalize(52),
    },
    numericKeypad: {
        width: '100%',
        paddingHorizontal: wp(4),
        marginBottom: normalize(16),
    },
    keypadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: normalize(12),
    },
    keypadButton: {
        width: wp(26),
        height: normalize(56),
        borderRadius: normalize(14),
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keypadButtonEmpty: {
        backgroundColor: 'transparent',
    },
    keypadButtonText: {
        fontSize: normalize(26),
        fontWeight: '600',
        color: '#1a1a1a',
    },
    pinHintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: normalize(6),
        paddingTop: normalize(8),
    },
    pinHint: {
        fontSize: normalize(12),
        color: Theme.colors.textLight,
    },
    processingContainer: {
        alignItems: 'center',
        paddingVertical: hp(8),
    },
    processingSpinner: {
        width: normalize(80),
        height: normalize(80),
        borderRadius: normalize(40),
        backgroundColor: Theme.colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: normalize(20),
    },
    processingText: {
        fontSize: normalize(16),
        fontWeight: '600',
        color: Theme.colors.text,
        marginBottom: normalize(8),
    },
    processingSubtext: {
        fontSize: normalize(13),
        color: Theme.colors.textSecondary,
    },

    // Modal Overlay (for other modals)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(5),
    },

    // Success Modal
    successModalContent: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: normalize(24),
        padding: normalize(28),
        alignItems: 'center',
    },
    successAnimation: {
        width: normalize(150),
        height: normalize(150),
    },
    primeActivatedBadge: {
        width: normalize(60),
        height: normalize(60),
        borderRadius: normalize(30),
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -normalize(30),
        marginBottom: normalize(16),
    },
    successTitle: {
        fontSize: normalize(24),
        fontWeight: '800',
        color: Theme.colors.text,
        marginBottom: normalize(8),
    },
    successSubtitle: {
        fontSize: normalize(14),
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: normalize(24),
        lineHeight: normalize(20),
    },
    successDetailsCard: {
        width: '100%',
        backgroundColor: '#F9FAFB',
        borderRadius: normalize(14),
        padding: normalize(18),
        marginBottom: normalize(24),
    },
    successDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    successDetailLabel: {
        fontSize: normalize(13),
        color: Theme.colors.textSecondary,
    },
    successDetailValue: {
        fontSize: normalize(13),
        fontWeight: '600',
        color: Theme.colors.text,
    },
    successDetailValueBold: {
        fontSize: normalize(15),
        fontWeight: '700',
        color: Theme.colors.text,
    },
    successDetailDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: normalize(12),
    },
    successStatusBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: normalize(10),
        paddingVertical: normalize(4),
        borderRadius: normalize(6),
    },
    successStatusText: {
        fontSize: normalize(11),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    successButton: {
        width: '100%',
        backgroundColor: Theme.colors.primary,
        paddingVertical: normalize(16),
        borderRadius: normalize(14),
        alignItems: 'center',
    },
    successButtonText: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Low Balance Modal
    lowBalanceModalContent: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: normalize(24),
        padding: normalize(28),
        alignItems: 'center',
    },
    lowBalanceIconContainer: {
        width: normalize(80),
        height: normalize(80),
        borderRadius: normalize(40),
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: normalize(20),
    },
    lowBalanceTitle: {
        fontSize: normalize(22),
        fontWeight: '700',
        color: Theme.colors.text,
        marginBottom: normalize(12),
    },
    lowBalanceSubtitle: {
        fontSize: normalize(14),
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: normalize(22),
        marginBottom: normalize(28),
    },
    lowBalanceActions: {
        flexDirection: 'row',
        width: '100%',
        gap: normalize(12),
    },
    lowBalanceCancelBtn: {
        flex: 1,
        paddingVertical: normalize(14),
        borderRadius: normalize(12),
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    lowBalanceCancelText: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: Theme.colors.text,
    },
    lowBalanceAddFundsBtn: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: normalize(14),
        borderRadius: normalize(12),
        backgroundColor: Theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: normalize(6),
    },
    lowBalanceAddFundsText: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default PrimeMembershipScreen;
