import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  InteractionManager,
} from "react-native";
import { 
  ChevronDown, 
  Smartphone, 
  Home, 
  CheckCircle2, 
  XCircle, 
  Share2, 
  Copy, 
  Download,
  Receipt,
  Calendar,
  CreditCard,
  Wallet
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import moment from "moment";
import * as Clipboard from "expo-clipboard";
import LottieView from "lottie-react-native";

import Theme from "../Theme";

import ViewShot from "react-native-view-shot";
import Share from "react-native-share";
import RNFS from "react-native-fs";
import { useRegisterStore } from "../../store";
import { correctPath } from "../../utils/helper";
import { Audio } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BbpsTransactionSuccess = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const user = useRegisterStore((state) => state.user);
  const insets = useSafeAreaInsets();

  // Extract route params first (before any dependent hooks)
  const {
    successResponse,
    recipient_name = "",
    amount,
    biller_name,
    service_type,
    client_txn_id,
    payment_method = "wallet",
    payment_id,
    reference_id,
    balance_before,
    balance_after,
    status,
    service_request_id,
  } = route.params || {};

  // Determine payment type - memoized to prevent recalculation
  const isWalletPayment = useMemo(() => payment_method === "wallet", [payment_method]);
  const isSuccessful = useMemo(() => status === "paid", [status]);

  // --- Transaction sound: play success or failed sound ---
  const soundRef = useRef(null);
  const hasPlayedSound = useRef(false);
  
  useEffect(() => {
    let isMounted = true;

    const playTransactionSound = async () => {
      // Only play sound if transaction is successful
      if (!isSuccessful || hasPlayedSound.current) return;
      hasPlayedSound.current = true;

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/music/trxSuccessSound.mp3"),
          { shouldPlay: true, volume: 1.0 }
        );

        if (!isMounted) {
          await sound.unloadAsync().catch(() => {});
          return;
        }
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((playbackStatus) => {
          if (playbackStatus.didJustFinish && soundRef.current) {
            soundRef.current.unloadAsync().catch(() => {});
            soundRef.current = null;
          }
        });
      } catch (e) {
        console.log("Transaction sound error:", e);
      }
    };

    // Delay sound slightly to ensure smooth screen transition
    const timer = setTimeout(playTransactionSound, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [isSuccessful]);
  // --- end transaction sound ---

  // Navigate home - using reset to clear navigation stack and prevent back navigation issues
  const goHome = useCallback(() => {
    // Reset the navigation stack to prevent memory issues and back button problems
    navigation.reset({
      index: 0,
      routes: [{ name: "MainApp" }],
    });
  }, [navigation]);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      goHome();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [goHome]);

  // Memoize transaction details to prevent unnecessary recalculations
  const transactionDetails = useMemo(() => ({
    status: isSuccessful ? "Payment successful" : "Payment Failed",
    timestamp: moment(successResponse?.transaction_date || new Date()).format(
      "hh:mm a on DD MMM YYYY"
    ),
    provider: biller_name === "N/A" ? "BBPS" : biller_name || recipient_name || "Unknown",
    amount: Number(amount || successResponse?.amount || 0).toFixed(2),
    referenceId: reference_id || client_txn_id || successResponse?.bbps_reference_no || "--",
    debitedFrom: `XXX${user?.user?.MobileNumber?.slice(-4) || "****"}`,
    payment_id: payment_id || "--",
    balance_before: balance_before || "--",
    balance_after: balance_after || "--",
    service_request_id: service_request_id || "--",
  }), [
    isSuccessful, successResponse, biller_name, recipient_name, amount,
    reference_id, client_txn_id, user?.user?.MobileNumber, payment_id, balance_before, 
    balance_after, service_request_id
  ]);

  // =============================================================================
  // Take a Screenshot and share it
  // =============================================================================
  const viewShotRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  // Animation on mount - runs for both success and failed states
  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    // Use InteractionManager to ensure smooth navigation transition
    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => interactionHandle.cancel();
  }, [scaleAnim, fadeAnim]);

  const handleShare = useCallback(async () => {
    if (isSharing || !viewShotRef.current) return;
    setIsSharing(true);
    
    try {
      // Capture screenshot with error handling
      const uri = await viewShotRef.current.capture();
      
      if (!uri) {
        throw new Error("Failed to capture screenshot");
      }
      
      // Create file path with timestamp for unique naming
      const timestamp = moment().format("YYYYMMDD_HHmmss");
      const statusText = isSuccessful ? "Success" : "Failed";
      const fileName = `ODH_Pay_Receipt_${statusText}_${timestamp}.png`;
      const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
      
      // Remove old file if exists
      const oldFileExists = await RNFS.exists(filePath);
      if (oldFileExists) {
        await RNFS.unlink(filePath);
      }
      
      await RNFS.copyFile(uri, filePath);
      const fileExists = await RNFS.exists(filePath);
      
      if (!fileExists) {
        Alert.alert("Error", "Failed to create receipt image");
        return;
      }

      const shareMessage = isSuccessful 
        ? `✅ Payment of ₹${transactionDetails.amount} to ${transactionDetails.provider} was successful!\nRef: ${transactionDetails.referenceId}`
        : `❌ Payment of ₹${transactionDetails.amount} to ${transactionDetails.provider} failed.\nRef: ${transactionDetails.referenceId}`;

      await Share.open({
        url: `file://${filePath}`,
        type: "image/png",
        title: `ODH Pay - Transaction ${statusText}`,
        message: shareMessage,
        subject: `ODH Pay Transaction Receipt - ${statusText}`,
      });
    } catch (error) {
      // Don't show error if user cancelled sharing
      if (error?.message !== "User did not share" && 
          !error?.message?.includes("cancelled") &&
          !error?.message?.includes("dismissed")) {
        console.error("Sharing failed:", error);
        Alert.alert("Share Failed", "Unable to share receipt. Please try again.");
      }
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, transactionDetails, isSuccessful]);

  const copyToClipboard = useCallback(async (text, label) => {
    if (!text || text === "--") {
      Alert.alert("Error", "No reference ID available to copy");
      return;
    }
    try {
      await Clipboard.setStringAsync(text);
      setCopySuccess(true);
      Alert.alert("Copied!", `${label} copied to clipboard`);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      Alert.alert("Error", "Failed to copy to clipboard");
    }
  }, []);

  return (
    <View style={styles.safeArea}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={isSuccessful ? (isWalletPayment ? "#000000" : Theme.colors.primary) : Theme.colors.danger} 
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 + Math.max(insets.bottom, 8) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1.0 }}
          style={{ backgroundColor: isWalletPayment ? "#FFFFFF" : "#f5f5f8" }}
        >
          <View
            style={[
              styles.header,
              {
                backgroundColor: isWalletPayment 
                  ? (isSuccessful ? "#000000" : "#333333")
                  : (isSuccessful ? Theme.colors.primary : Theme.colors.danger),
              },
            ]}
          >
            {/* Decorative background pattern */}
            <View style={styles.headerPattern}>
              <View style={[styles.patternCircle, styles.patternCircle1]} />
              <View style={[styles.patternCircle, styles.patternCircle2]} />
            </View>
            
            <View style={styles.headerTopRow}>
              <Image
                source={require("../../assets/BAssuredLogoReversePNG.png")}
                style={styles.bcassured}
              />
              <View style={[
                styles.statusPill,
                isSuccessful ? styles.statusPillSuccess : styles.statusPillFailed,
                isWalletPayment && { backgroundColor: "rgba(255,255,255,0.2)" }
              ]}>
                {isSuccessful ? (
                  <CheckCircle2 size={18} color={isWalletPayment ? "#FFFFFF" : "#22c55e"} />
                ) : (
                  <XCircle size={18} color={isWalletPayment ? "#FFFFFF" : "#ef4444"} />
                )}
                <Text style={[
                  styles.statusPillText,
                  isSuccessful ? styles.statusPillTextSuccess : styles.statusPillTextFailed
                ]}>
                  {isSuccessful ? "Success" : "Failed"}
                </Text>
              </View>
            </View>

            {/* Success Animation or Icon */}
            <Animated.View 
              style={[
                styles.successIconContainer,
                { transform: [{ scale: scaleAnim }], opacity: fadeAnim }
              ]}
            >
              {isSuccessful ? (
                <View style={styles.successCircle}>
                  <CheckCircle2 size={48} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              ) : (
                <View style={[styles.successCircle, styles.failedCircle]}>
                  <XCircle size={48} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              )}
            </Animated.View>

            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>
                {isWalletPayment ? "Paid from Wallet" : "Amount Paid"}
              </Text>
              <Text style={styles.amountValue}>₹{transactionDetails.amount}</Text>
              <View style={styles.timestampContainer}>
                <Calendar size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.timestamp}>{transactionDetails.timestamp}</Text>
              </View>
            </View>
          </View>

          {/* Wallet Balance Card - Only for wallet payments */}
          {/* {isWalletPayment && (
            <View style={styles.walletBalanceCard}>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Balance Before</Text>
                  <Text style={styles.balanceValue}>₹{transactionDetails.balance_before}</Text>
                </View>
                <View style={styles.balanceArrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Balance After</Text>
                  <Text style={[styles.balanceValue, styles.balanceAfterValue]}>
                    ₹{transactionDetails.balance_after}
                  </Text>
                </View>
              </View>
            </View>
          )} */}

          {/* Service Details */}
          <View style={[styles.section, isWalletPayment && styles.sectionBW]}>
            <View style={styles.rechargeInfo}>
              <View style={styles.providerInfo}>
                {isWalletPayment ? (
                  <Wallet size={22} color="#000000" />
                ) : (
                  <Smartphone size={22} color={Theme.colors.primary} />
                )}
                <View style={styles.providerDetails}>
                  <Text style={[styles.providerName, isWalletPayment && styles.textBW]}>
                    {transactionDetails.provider}
                  </Text>
                  <Text style={styles.subtleText}>
                    Ref: {transactionDetails.referenceId}
                  </Text>
                </View>
              </View>
              <View style={[styles.badgeMuted, isWalletPayment && styles.badgeBW]}>
                <Text style={[styles.badgeText, isWalletPayment && styles.badgeTextBW]}>
                  ₹{transactionDetails.amount}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Details */}
          <View style={[styles.section, isWalletPayment && styles.sectionBW]}>
            <TouchableOpacity style={styles.paymentHeader} onPress={() => { }}>
              <View style={styles.paymentHeaderLeft}>
                <Wallet size={25} color="black" />
                <Text style={styles.paymentHeaderText}>Payment details</Text>
              </View>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>

            <View style={styles.paymentDetails}>
              {/* Only show wallet payment details */}
              <>
               

                <View style={styles.idSection}>
                  <Text style={styles.idLabel}>Reference ID</Text>
                  <Text style={[styles.idValue, styles.idValueBW]} numberOfLines={1}>
                    {transactionDetails.referenceId}
                  </Text>
                </View>

                

                {service_type && (
                  <View style={styles.idSection}>
                    <Text style={styles.idLabel}>Service Type</Text>
                    <Text style={[styles.idValue, styles.idValueBW]}>
                      {service_type?.replace(/_/g, " ").toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.idSection}>
                  <Text style={styles.idLabel}>Payment Method</Text>
                  <View style={styles.walletBadge}>
                    <Wallet size={14} color="#000000" />
                    <Text style={styles.walletBadgeText}>ODH Wallet</Text>
                  </View>
                </View>

                <View style={styles.idSection}>
                  <Text style={styles.idLabel}>Transaction Fee</Text>
                  <Text style={[styles.idValue, styles.freeText]}>FREE</Text>
                </View>
              </>
              <View style={[styles.debitedSection, isWalletPayment && styles.debitedSectionBW]}>
                <Text style={styles.debitedLabel}>
                  {" "}
                  {isSuccessful
                    ? (isWalletPayment ? "Debited from Wallet" : "Debited from")
                    : "Amount Will Be refund In case of Debit"}
                </Text>
                <View style={[styles.debitedInfo, isWalletPayment && styles.debitedInfoBW]}>
                  {isWalletPayment ? (
                    <View style={styles.walletIconCircle}>
                      <Wallet size={20} color="#FFFFFF" />
                    </View>
                  ) : (
                    <Image
                      source={
                        user?.user?.profile
                          ? {
                            uri: correctPath(
                              `https://newapi.odhpay.com/${user?.user?.profile}`
                            ),
                          }
                          : require("../../assets/Profilee.png")
                      }
                      style={styles.bankIcon}
                    />
                  )}
                  <View style={styles.debitedDetails}>
                    <Text style={[styles.accountNumber, isWalletPayment && styles.textBW]}>
                      {isWalletPayment ? "ODH Wallet" : transactionDetails.debitedFrom}
                    </Text>
                    <Text style={styles.utrNumber}>
                      {isWalletPayment 
                        ? `Ref: ${transactionDetails?.referenceId}` 
                        : `UTR: ${transactionDetails?.referenceId}`}
                    </Text>
                  </View>
                  <Text style={[styles.debitedAmount, isWalletPayment && styles.debitedAmountBW]}>
                    ₹{transactionDetails?.amount}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.shareButton,
              {
                backgroundColor: isWalletPayment 
                  ? "#000000"
                  : (isSuccessful ? Theme.colors.primary : Theme.colors.danger),
              },
              isSharing && styles.shareButtonDisabled
            ]}
            onPress={handleShare}
            disabled={isSharing}
            activeOpacity={0.8}
          >
            <Share2 size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>
              {isSharing ? "Preparing..." : "Share Receipt"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.copyRefButton,
              isWalletPayment && styles.copyRefButtonBW
            ]}
            onPress={() => copyToClipboard(transactionDetails.referenceId, "Reference ID")}
            activeOpacity={0.8}
          >
            <Copy size={18} color={isWalletPayment ? "#000000" : Theme.colors.primary} />
            <Text style={[
              styles.copyRefButtonText,
              isWalletPayment && styles.copyRefButtonTextBW
            ]}>
              Copy Ref ID
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer with Home button */}
      <View style={[styles.footerNav, { paddingBottom: 15 }]}>
        <TouchableOpacity 
          style={[styles.homeBtn, isWalletPayment && styles.homeBtnBW]} 
          onPress={goHome} 
          activeOpacity={0.85}
        >
          <Home size={20} color="#fff" />
          <Text style={styles.homeBtnText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f8",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f8",
  },
  bcassured: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  headerPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  patternCircle1: {
    width: 200,
    height: 200,
    top: -80,
    right: -60,
  },
  patternCircle2: {
    width: 150,
    height: 150,
    bottom: -50,
    left: -40,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  statusPillSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  statusPillFailed: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  statusPillText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  statusPillTextSuccess: {
    color: "#FFFFFF",
  },
  statusPillTextFailed: {
    color: "#FFFFFF",
  },
  successIconContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
    zIndex: 1,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  failedCircle: {
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  amountBlock: {
    marginTop: 20,
    alignItems: "center",
    gap: 8,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "700",
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timestamp: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  amountValue: {
    fontSize: 42,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: -1,
  },
  amountLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  section: {
    backgroundColor: "white",
    padding: 18,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  rechargeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  providerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  providerDetails: {
    marginLeft: 12,
    gap: 2,
  },
  providerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtleText: {
    fontSize: 13,
    color: "#6b7280",
  },
  badgeMuted: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#eef2ff",
    borderRadius: 999,
  },
  badgeText: {
    color: Theme.colors.primary,
    fontWeight: "700",
  },
  phoneNumber: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: "600",
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  paymentHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  receiptIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  paymentHeaderText: {
    fontSize: 18,
    fontWeight: "500",
  },
  paymentDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  idSection: {
    marginTop: 24,
  },
  idLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  idValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  debitedSection: {
    marginTop: 16,
  },
  debitedLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  debitedInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  debitedDetails: {
    flex: 1,
    marginLeft: 12,
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: "500",
  },
  utrNumber: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  debitedAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonDisabled: {
    opacity: 0.7,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  copyRefButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  copyRefButtonBW: {
    borderColor: "#000000",
    shadowColor: "#000000",
  },
  copyRefButtonText: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  copyRefButtonTextBW: {
    color: "#000000",
  },

  // --- New footer styles ---
  footerNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  homeBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    width: "100%",
    borderRadius: 12,
    elevation: 2,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  homeBtnBW: {
    backgroundColor: "#000000",
    shadowColor: "#000000",
  },
  homeBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // --- Wallet Payment Black & White Styles ---
  walletBalanceCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    padding: 20,
    borderWidth: 2,
    borderColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceItem: {
    flex: 1,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 6,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  balanceAfterValue: {
    color: "#000000",
  },
  balanceArrow: {
    paddingHorizontal: 16,
  },
  arrowText: {
    fontSize: 24,
    color: "#000000",
    fontWeight: "300",
  },
  sectionBW: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textBW: {
    color: "#000000",
  },
  badgeBW: {
    backgroundColor: "#000000",
  },
  badgeTextBW: {
    color: "#FFFFFF",
  },
  idValueBW: {
    color: "#000000",
    fontWeight: "600",
  },
  walletBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000000",
    alignSelf: "flex-start",
  },
  walletBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  freeText: {
    color: "#000000",
    fontWeight: "700",
  },
  walletIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  debitedSectionBW: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 16,
  },
  debitedInfoBW: {
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  debitedAmountBW: {
    color: "#000000",
    fontWeight: "700",
  },
});

export default BbpsTransactionSuccess;





