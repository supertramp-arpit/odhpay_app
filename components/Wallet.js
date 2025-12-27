import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  RefreshControl,
  Modal,
  Alert,
  FlatList,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Theme from "./Theme";
import { useWalletStore, useUserStore } from "../store";
import { ActivityIndicator } from "react-native";

const { width, height } = Dimensions.get("window");

// Transaction Item Component
const TransactionItem = ({ transaction, onCopy }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isCredit = transaction.transaction_type === "credit";
  const statusColor =
    transaction.status === "success" || transaction.status === "completed"
      ? Theme.colors.success
      : transaction.status === "pending" || transaction.status === "initiated"
      ? Theme.colors.warning
      : Theme.colors.danger;

  return (
    <Animated.View
      style={[
        styles.transactionItem,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.transactionIcon,
            { backgroundColor: isCredit ? "#E8F5E9" : "#FFEBEE" },
          ]}
        >
          <Feather
            name={isCredit ? "arrow-down-left" : "arrow-up-right"}
            size={20}
            color={isCredit ? Theme.colors.success : Theme.colors.danger}
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionPurpose} numberOfLines={1}>
            {transaction.purpose || (isCredit ? "Wallet Topup" : "Withdrawal")}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(transaction.transaction_date)} • {formatTime(transaction.transaction_date)}
          </Text>
          {transaction.utr_no && (
            <TouchableOpacity
              style={styles.utrContainer}
              onPress={() => onCopy(transaction.utr_no)}
            >
              <Text style={styles.utrText}>UTR: {transaction.utr_no}</Text>
              <Feather name="copy" size={12} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            { color: isCredit ? Theme.colors.success : Theme.colors.danger },
          ]}
        >
          {isCredit ? "+" : "-"}₹{parseFloat(transaction.amount).toFixed(2)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {transaction.status}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Add Money Modal Component
const AddMoneyModal = ({ visible, onClose, onSubmit, loading }) => {
  const [vpa, setVpa] = useState("");
  const [amount, setAmount] = useState("");
  const [vpaError, setVpaError] = useState("");

  const validateVpa = (value) => {
    const vpaRegex = /^[\w.-]+@[\w]+$/;
    if (!value) {
      setVpaError("VPA is required");
      return false;
    }
    if (!vpaRegex.test(value)) {
      setVpaError("Invalid VPA format (e.g., user@okicici)");
      return false;
    }
    setVpaError("");
    return true;
  };

  const handleSubmit = () => {
    if (!validateVpa(vpa)) return;
    if (!amount || parseFloat(amount) < 1) {
      Alert.alert("Invalid Amount", "Please enter an amount of at least ₹1");
      return;
    }
    onSubmit(vpa, amount);
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Money to Wallet</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={Theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalContent}>
              {/* VPA Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your UPI ID (VPA)</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="at"
                    size={20}
                    color={Theme.colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="yourname@okicici"
                    placeholderTextColor={Theme.colors.textLight}
                    value={vpa}
                    onChangeText={(text) => {
                      setVpa(text.toLowerCase());
                      if (vpaError) validateVpa(text);
                    }}
                    onBlur={() => validateVpa(vpa)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                {vpaError ? (
                  <Text style={styles.errorText}>{vpaError}</Text>
                ) : null}
              </View>

              {/* Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={[styles.input, styles.amountInput]}
                    placeholder="Enter amount"
                    placeholderTextColor={Theme.colors.textLight}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Quick Amount Selection */}
              <View style={styles.quickAmountContainer}>
                <Text style={styles.quickAmountLabel}>Quick Select</Text>
                <View style={styles.quickAmountGrid}>
                  {quickAmounts.map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.quickAmountBtn,
                        amount === value.toString() && styles.quickAmountBtnActive,
                      ]}
                      onPress={() => setAmount(value.toString())}
                    >
                      <Text
                        style={[
                          styles.quickAmountText,
                          amount === value.toString() && styles.quickAmountTextActive,
                        ]}
                      >
                        ₹{value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Info Card */}
              <View style={styles.infoCard}>
                <Feather name="info" size={16} color={Theme.colors.primary} />
                <Text style={styles.infoText}>
                  A UPI collect request will be sent to your VPA. Please complete the
                  payment in your UPI app within 5 minutes.
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!vpa || !amount || loading) && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!vpa || !amount || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="plus" size={20} color="#fff" />
                    <Text style={styles.submitBtnText}>Add ₹{amount || "0"}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Topup Status Modal
const TopupStatusModal = ({ visible, onClose, topupData, onCheckStatus, checking, transactionStatus }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300 seconds
  const [autoChecking, setAutoChecking] = useState(false);
  const pollingRef = useRef(null);
  const countdownRef = useRef(null);

  // Stop polling when transaction is completed or failed
  const isTransactionComplete = transactionStatus === 'success' || transactionStatus === 'completed' || 
                                transactionStatus === 'failed' || transactionStatus === 'expired';

  // Auto-polling every 5 seconds
  useEffect(() => {
    // Clear existing intervals first
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (visible && topupData && !isTransactionComplete) {
      // Start auto-polling every 5 seconds
      pollingRef.current = setInterval(() => {
        if (!checking && !autoChecking) {
          setAutoChecking(true);
          onCheckStatus().finally(() => setAutoChecking(false));
        }
      }, 5000);

      // Countdown timer
      countdownRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 300000, // 5 minutes
        useNativeDriver: false,
      }).start();
    }

    // Stop polling when transaction is complete
    if (isTransactionComplete) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [visible, topupData?.status, isTransactionComplete]);

  // Pulse animation for the icon
  useEffect(() => {
    if (visible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Rotate animation for loading
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotate.start();

      return () => {
        pulse.stop();
        rotate.stop();
      };
    }
  }, [visible]);

  // Reset timer when modal opens
  useEffect(() => {
    if (visible) {
      setTimeLeft(300);
      progressAnim.setValue(0);
    }
  }, [visible]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['100%', '0%'],
  });

  if (!topupData) return null;

  const isSuccess = transactionStatus === 'success' || transactionStatus === 'completed';
  const isFailed = transactionStatus === 'failed' || transactionStatus === 'expired';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.statusModalContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.statusModalScroll}
            bounces={false}
          >
          {/* Animated Header */}
          <LinearGradient
            colors={isSuccess ? [`${Theme.colors.success}20`, `${Theme.colors.success}05`] : 
                    isFailed ? [`${Theme.colors.danger}20`, `${Theme.colors.danger}05`] :
                    [`${Theme.colors.warning}20`, `${Theme.colors.warning}05`]}
            style={styles.statusModalHeader}
          >
            {/* Animated Circle Background */}
            <View style={styles.animatedCircleContainer}>
              {!isSuccess && !isFailed && (
                <Animated.View 
                  style={[
                    styles.outerCircle,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                />
              )}
              <View style={[
                styles.innerCircle,
                isSuccess && { backgroundColor: `${Theme.colors.success}15` },
                isFailed && { backgroundColor: `${Theme.colors.danger}15` }
              ]}>
                {isSuccess ? (
                  <Feather name="check-circle" size={36} color={Theme.colors.success} />
                ) : isFailed ? (
                  <Feather name="x-circle" size={36} color={Theme.colors.danger} />
                ) : (
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <MaterialCommunityIcons
                      name="loading"
                      size={32}
                      color={Theme.colors.warning}
                    />
                  </Animated.View>
                )}
              </View>
            </View>
            
            <Text style={styles.statusModalTitle}>
              {isSuccess ? 'Payment Successful!' : isFailed ? 'Payment Failed' : 'Payment Initiated'}
            </Text>
            <Text style={styles.statusModalSubtitle}>
              {isSuccess ? 'Your wallet has been credited' : 
               isFailed ? 'Transaction could not be completed' : 
               'Waiting for payment confirmation'}
            </Text>

            {/* Timer - only show when pending */}
            {!isSuccess && !isFailed && (
              <>
                <View style={styles.timerContainer}>
                  <Feather name="clock" size={14} color={Theme.colors.warning} />
                  <Text style={styles.timerText}>
                    Expires in {formatTime(timeLeft)}
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <Animated.View 
                    style={[
                      styles.progressBar,
                      { width: progressWidth }
                    ]}
                  />
                </View>
              </>
            )}
          </LinearGradient>

          {/* Transaction Details */}
          <View style={styles.statusModalContent}>
            <View style={[
              styles.amountHighlight,
              isSuccess && { backgroundColor: `${Theme.colors.success}10` },
              isFailed && { backgroundColor: `${Theme.colors.danger}10` }
            ]}>
              <Text style={styles.amountHighlightLabel}>
                {isSuccess ? 'Amount Credited' : isFailed ? 'Amount' : 'Amount to Pay'}
              </Text>
              <Text style={[
                styles.amountHighlightValue,
                isFailed && { color: Theme.colors.danger }
              ]}>₹{topupData.amount}</Text>
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.statusDetailRow}>
                <View style={styles.detailIconContainer}>
                  <MaterialCommunityIcons name="at" size={16} color={Theme.colors.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.statusDetailLabel}>UPI ID</Text>
                  <Text style={styles.statusDetailValue}>{topupData.payer_vpa}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.statusDetailRow}>
                <View style={styles.detailIconContainer}>
                  <Feather name="hash" size={16} color={Theme.colors.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.statusDetailLabel}>Transaction ID</Text>
                  <Text style={styles.statusDetailValue} numberOfLines={1}>
                    {topupData.client_txn_id}
                  </Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.statusDetailRow}>
                <View style={[styles.detailIconContainer, 
                  isSuccess && { backgroundColor: `${Theme.colors.success}15` },
                  isFailed && { backgroundColor: `${Theme.colors.danger}15` }
                ]}>
                  <Feather name="activity" size={16} color={
                    isSuccess ? Theme.colors.success : 
                    isFailed ? Theme.colors.danger : 
                    Theme.colors.warning
                  } />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.statusDetailLabel}>Status</Text>
                  <View style={styles.statusInline}>
                    <View style={[styles.statusDotLarge, { 
                      backgroundColor: isSuccess ? Theme.colors.success : 
                                       isFailed ? Theme.colors.danger : 
                                       Theme.colors.warning 
                    }]} />
                    <Text style={[styles.statusValueText, { 
                      color: isSuccess ? Theme.colors.success : 
                             isFailed ? Theme.colors.danger : 
                             Theme.colors.warning 
                    }]}>
                      {checking || autoChecking ? 'Checking...' : 
                       isSuccess ? 'Success' : 
                       isFailed ? 'Failed' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Instructions Card - only show when pending */}
            {!isSuccess && !isFailed && (
              <View style={styles.instructionsCardNew}>
                <View style={styles.instructionsIconContainer}>
                  <Feather name="smartphone" size={20} color={Theme.colors.primary} />
                </View>
                <View style={styles.instructionsTextContainer}>
                  <Text style={styles.instructionsTitle}>Complete Payment</Text>
                  <Text style={styles.instructionsDesc}>
                    Open your UPI app and approve the payment request to add money to your wallet.
                  </Text>
                </View>
              </View>
            )}

            {/* Success message */}
            {isSuccess && (
              <View style={[styles.instructionsCardNew, { backgroundColor: `${Theme.colors.success}08`, borderColor: `${Theme.colors.success}15` }]}>
                <View style={[styles.instructionsIconContainer, { backgroundColor: `${Theme.colors.success}15` }]}>
                  <Feather name="check" size={20} color={Theme.colors.success} />
                </View>
                <View style={styles.instructionsTextContainer}>
                  <Text style={styles.instructionsTitle}>Transaction Complete</Text>
                  <Text style={styles.instructionsDesc}>
                    Your wallet has been credited successfully. You can now use your balance.
                  </Text>
                </View>
              </View>
            )}

            {/* Auto-checking indicator - only show when pending */}
            {!isSuccess && !isFailed && (checking || autoChecking) && (
              <View style={styles.autoCheckingIndicator}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
                <Text style={styles.autoCheckingText}>Auto-checking every 5 seconds...</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.statusModalActions}>
            {!isSuccess && !isFailed && (
              <TouchableOpacity
                style={[styles.checkStatusBtn, (checking || autoChecking) && styles.checkStatusBtnDisabled]}
                onPress={onCheckStatus}
                disabled={checking || autoChecking}
              >
                {checking || autoChecking ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="refresh-cw" size={18} color="#fff" />
                    <Text style={styles.checkStatusBtnText}>Check Status Now</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                isSuccess ? styles.successCloseBtn : styles.closeModalBtn
              ]} 
              onPress={onClose}
            >
              <Text style={isSuccess ? styles.successCloseBtnText : styles.closeModalBtnText}>
                {isSuccess ? 'Done' : isFailed ? 'Close' : 'Cancel & Close'}
              </Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Main Wallet Component
const Wallet = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [topupData, setTopupData] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionStatus, setTransactionStatus] = useState('pending');
  const [walletBalance, setWalletBalance] = useState(null);

  const navigation = useNavigation();
  const {
    transactionHistory,
    fetchWalletHistory,
    initiateTopup,
    checkTopupStatus,
    fetchBalance,
    loading,
  } = useWalletStore();
  const { user } = useUserStore();

  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Fetch wallet balance on mount
  const loadBalance = async () => {
    try {
      const response = await fetchBalance();
      if (response.success) {
        setWalletBalance(response);
      }
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [activeFilter]);

  const loadHistory = async (page = 1) => {
    try {
      const filterType = activeFilter === "all" ? null : activeFilter;
      await fetchWalletHistory(page, 20, filterType);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadHistory(1), loadBalance()]);
    setRefreshing(false);
  }, [activeFilter]);

  const handleAddMoney = async (vpa, amount) => {
    try {
      const response = await initiateTopup(vpa, amount);
      if (response.success) {
        setTopupData(response);
        setTransactionStatus('pending');
        setShowAddModal(false);
        setShowStatusModal(true);
      } else {
        Alert.alert("Error", response.message || "Failed to initiate topup");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Failed to initiate topup. Please try again."
      );
    }
  };

  const handleCheckStatus = async () => {
    if (!topupData) return;
    setCheckingStatus(true);
    try {
      const response = await checkTopupStatus(
        topupData.client_txn_id,
        topupData.merchant_tran_id
      );
      
      if (response.wallet_credited) {
        setTransactionStatus('success');
        setTopupData({ ...topupData, ...response });
        loadBalance(); // Refresh balance
        loadHistory(1); // Refresh history
      } else if (response.status === "failed" || response.status === "expired") {
        setTransactionStatus('failed');
        setTopupData({ ...topupData, ...response });
      } else {
        setTransactionStatus('pending');
        setTopupData({ ...topupData, ...response });
      }
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("Copied", "Copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleWithdraw = () => {
    navigation.navigate("ToBank");
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Feather name="inbox" size={48} color={Theme.colors.textLight} />
      </View>
      <Text style={styles.emptyTitle}>No Transactions Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your transaction history will appear here once you add money or make a withdrawal.
      </Text>
    </View>
  );

  const transactions = transactionHistory?.transactions || [];

  return (
    <View style={styles.container}>
      
      {/* Header with Balance Card */}
      <LinearGradient
        colors={[Theme.colors.primary, Theme.colors.primaryDark]}
        style={styles.header}
      >
      

        <Animated.View
          style={[styles.balanceCard, { transform: [{ scale: scaleAnim }] }]}
        >
          <View style={styles.balanceTop}>
            <View style={styles.walletIconContainer}>
              <MaterialCommunityIcons name="wallet" size={28} color={Theme.colors.primary} />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>
                ₹{parseFloat(walletBalance?.available_balance || walletBalance?.balance || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          {/* Extra Balance Info */}
          {walletBalance && (walletBalance.reward_balance !== "0.00" || walletBalance.lcr_money_balance !== "0.00") && (
            <View style={styles.extraBalanceRow}>
              {walletBalance.reward_balance !== "0.00" && (
                <View style={styles.extraBalanceItem}>
                  <Feather name="gift" size={14} color={Theme.colors.warning} />
                  <Text style={styles.extraBalanceLabel}>Rewards</Text>
                  <Text style={styles.extraBalanceValue}>₹{walletBalance.reward_balance}</Text>
                </View>
              )}
              {walletBalance.lcr_money_balance !== "0.00" && (
                <View style={styles.extraBalanceItem}>
                  <Feather name="award" size={14} color={Theme.colors.success} />
                  <Text style={styles.extraBalanceLabel}>ODH Money</Text>
                  <Text style={styles.extraBalanceValue}>₹{walletBalance.lcr_money_balance}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                <View style={styles.actionIconCircle}>
                  <Feather name="plus" size={18} color="#10B981" />
                </View>
                <Text style={styles.actionButtonText}>Add Money</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleWithdraw}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Theme.colors.primary, Theme.colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                <View style={styles.actionIconCircle}>
                  <Feather name="send" size={16} color={Theme.colors.primary} />
                </View>
                <Text style={styles.actionButtonText}>Withdraw</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Transaction History Section */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Transaction History</Text>
          {transactionHistory?.total_count > 0 && (
            <Text style={styles.historyCount}>
              {transactionHistory.total_count} transactions
            </Text>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {[
            { key: "all", label: "All" },
            { key: "credit", label: "Credits" },
            { key: "debit", label: "Debits" },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                activeFilter === filter.key && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === filter.key && styles.filterTabTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            renderItem={({ item }) => (
              <TransactionItem transaction={item} onCopy={copyToClipboard} />
            )}
            keyExtractor={(item) => item.id?.toString() || item.reference_id}
            contentContainerStyle={styles.transactionList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Theme.colors.primary]}
                tintColor={Theme.colors.primary}
              />
            }
            ListEmptyComponent={renderEmptyState}
            onEndReached={() => {
              if (
                transactionHistory?.page < 
                Math.ceil(transactionHistory?.total_count / transactionHistory?.page_size)
              ) {
                loadHistory(currentPage + 1);
              }
            }}
            onEndReachedThreshold={0.5}
          />
        )}
      </View>

      {/* Add Money Modal */}
      <AddMoneyModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddMoney}
        loading={loading}
      />

      {/* Topup Status Modal */}
      <TopupStatusModal
        visible={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setTopupData(null);
          setTransactionStatus('pending');
          loadHistory(1);
          loadBalance();
        }}
        topupData={topupData}
        onCheckStatus={handleCheckStatus}
        checking={checkingStatus}
        transactionStatus={transactionStatus}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingBottom: 70,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    ...Theme.shadows.lg,
  },
  balanceTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  walletIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: `${Theme.colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  extraBalanceRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  extraBalanceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  extraBalanceLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  extraBalanceValue: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    ...Theme.shadows.md,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  actionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  historySection: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    marginTop: -40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  historyCount: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterTabActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: Theme.colors.textSecondary,
  },
  filterTabTextActive: {
    color: "#fff",
  },
  transactionList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Theme.shadows.sm,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionPurpose: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  utrContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  utrText: {
    fontSize: 11,
    color: Theme.colors.textLight,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    padding: 20,
    paddingBottom:60
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: Theme.colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Theme.colors.text,
  },
  amountInput: {
    fontSize: 20,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: Theme.colors.danger,
    marginTop: 6,
  },
  quickAmountContainer: {
    marginBottom: 20,
  },
  quickAmountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: 12,
  },
  quickAmountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickAmountBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  quickAmountBtnActive: {
    backgroundColor: `${Theme.colors.primary}15`,
    borderColor: Theme.colors.primary,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
  },
  quickAmountTextActive: {
    color: Theme.colors.primary,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: `${Theme.colors.primary}10`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.text,
    lineHeight: 18,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginBottom: Platform.OS === "ios" ? 30 : 10,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },

  // Status Modal Styles
  statusModalContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 24,
    margin: 20,
    maxHeight: height * 0.85,
    overflow: "hidden",
  },
  statusModalScroll: {
    flexGrow: 1,
  },
  statusModalHeader: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  animatedCircleContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  outerCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Theme.colors.warning}20`,
  },
  innerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: `${Theme.colors.warning}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: `${Theme.colors.warning}10`,
    borderRadius: 20,
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.warning,
  },
  progressBarContainer: {
    width: "100%",
    height: 4,
    backgroundColor: `${Theme.colors.warning}20`,
    borderRadius: 2,
    marginTop: 16,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Theme.colors.warning,
    borderRadius: 2,
  },
  pendingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Theme.colors.warning}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  statusModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 6,
  },
  statusModalSubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  statusModalContent: {
    padding: 20,
  },
  amountHighlight: {
    alignItems: "center",
    backgroundColor: `${Theme.colors.success}10`,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 20,
  },
  amountHighlightLabel: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  amountHighlightValue: {
    fontSize: 36,
    fontWeight: "700",
    color: Theme.colors.success,
  },
  detailsCard: {
    backgroundColor: Theme.colors.inputBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statusDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 8,
  },
  statusDetailLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  statusDetailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  statusInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDotLarge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusValueText: {
    fontSize: 15,
    fontWeight: "600",
  },
  instructionsCardNew: {
    flexDirection: "row",
    backgroundColor: `${Theme.colors.primary}08`,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Theme.colors.primary}15`,
    borderStyle: "dashed",
  },
  instructionsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Theme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  instructionsTextContainer: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: 4,
  },
  instructionsDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  autoCheckingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: `${Theme.colors.primary}08`,
    borderRadius: 10,
    gap: 8,
  },
  autoCheckingText: {
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: "500",
  },
  instructionsCard: {
    flexDirection: "row",
    backgroundColor: `${Theme.colors.warning}10`,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    gap: 10,
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.text,
    lineHeight: 18,
  },
  statusModalActions: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  checkStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  checkStatusBtnDisabled: {
    opacity: 0.7,
  },
  checkStatusBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  closeModalBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  closeModalBtnText: {
    fontSize: 16,
    fontWeight: "500",
    color: Theme.colors.textSecondary,
  },
  successCloseBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.success,
    borderRadius: 14,
    paddingVertical: 16,
  },
  successCloseBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default Wallet;