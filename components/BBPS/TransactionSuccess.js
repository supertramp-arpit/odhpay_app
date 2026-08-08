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
  Easing,
  ActivityIndicator,
  Dimensions,
  InteractionManager,
} from "react-native";
import {
  ChevronDown,
  Home,
  CheckCircle2,
  XCircle,
  Clock,
  Share2,
  Copy,
  Calendar,
  CreditCard,
  Receipt,
  Check,
  X,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import moment from "moment";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Theme from "../Theme";

import ViewShot from "react-native-view-shot";
import Share from "react-native-share";
import RNFS from "react-native-fs";
import { useRegisterStore } from "../../store";
import { correctPath } from "../../utils/helper";
import { Audio } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { watchRechargeStatus } from "../../utils/rechargeStatusWatcher";

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
    category = "",
    client_txn_id,
    payment_method = "wallet",
    payment_id,
    reference_id,
    balance_before,
    balance_after,
    status,
    service_request_id,
    access_token: tokenFromParams,
  } = route.params || {};

  const isWalletPayment = useMemo(() => payment_method === "wallet", [payment_method]);

  // ---------------------------------------------------------------------------
  // Live status
  // ---------------------------------------------------------------------------
  // A wallet bill payment returns status "paid" the instant the wallet is
  // debited — but the bill is still being dispatched to the biller in a backend
  // background task. So we land here in a "pending" (processing) state and let
  // watchRechargeStatus resolve it to completed/failed via WebSocket push (with
  // a /service-status poll fallback). Only wallet payments that carry a real
  // service reference_id are "live"; the gateway caller (Razorpay — no
  // reference_id) keeps the old terminal rendering, so it's never stuck pending.
  const liveEligible = isWalletPayment && !!reference_id;
  const rawStatus = (status || "").toLowerCase();
  const initialStatus =
    rawStatus === "completed" ? "completed" :
    rawStatus === "failed" ? "failed" :
    liveEligible ? "pending" :
    rawStatus === "paid" ? "completed" : "failed"; // legacy (non-wallet) path

  const [liveStatus, setLiveStatus] = useState(initialStatus);
  const [liveMessage, setLiveMessage] = useState(successResponse?.message || "");

  const isCompleted = liveStatus === "completed";
  const isFailed = liveStatus === "failed";
  const isPending = liveStatus === "pending";

  // Subscribe to live status updates (WS + poll fallback) only while pending.
  useEffect(() => {
    if (!liveEligible || !isPending) return undefined;
    let token = tokenFromParams;
    const stopRef = { current: null };

    (async () => {
      if (!token) {
        try { token = await AsyncStorage.getItem("access_token"); } catch {}
      }
      stopRef.current = watchRechargeStatus({
        referenceId: reference_id,
        token,
        onUpdate: (snap) => {
          if (!snap) return;
          if (snap.message) setLiveMessage(snap.message);
          if (snap.status === "completed" || snap.status === "failed") {
            setLiveStatus(snap.status);
          }
        },
      });
    })();

    return () => { stopRef.current && stopRef.current(); };
  }, [liveEligible, isPending, reference_id, tokenFromParams]);

  // --- Transaction sound: play success sound once the payment is confirmed ---
  const soundRef = useRef(null);
  const hasPlayedSound = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const playTransactionSound = async () => {
      if (!isCompleted || hasPlayedSound.current) return;
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

    const timer = setTimeout(playTransactionSound, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [isCompleted]);
  // --- end transaction sound ---

  // Navigate home - reset stack to prevent back-navigation into the pay flow.
  const goHome = useCallback(() => {
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
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [goHome]);

  // Hide native back arrow / disable swipe-back so the flow can't be re-entered.
  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null, gestureEnabled: false });
  }, [navigation]);

  const transactionDetails = useMemo(() => ({
    timestamp: moment(successResponse?.transaction_date || new Date()).format(
      "hh:mm a on DD MMM YYYY"
    ),
    provider: biller_name === "N/A" ? "BBPS" : biller_name || recipient_name || "Bill Payment",
    amount: Number(amount || successResponse?.amount || 0).toFixed(2),
    referenceId: reference_id || client_txn_id || successResponse?.bbps_reference_no || "--",
    debitedFrom: `XXX${user?.user?.MobileNumber?.slice(-4) || "****"}`,
    payment_id: payment_id || "--",
    service_request_id: service_request_id || "--",
  }), [
    successResponse, biller_name, recipient_name, amount,
    reference_id, client_txn_id, user?.user?.MobileNumber, payment_id, service_request_id,
  ]);

  // ---------------------------------------------------------------------------
  // Hero appearance
  // ---------------------------------------------------------------------------
  const hero = isCompleted
    ? { colors: ["#10B981", "#047857"], label: "Payment successful", glyphColor: "#10B981" }
    : isFailed
    ? { colors: ["#EF4444", "#B91C1C"], label: "Payment failed", glyphColor: "#EF4444" }
    : { colors: ["#1F2937", "#000000"], label: "Processing payment…", glyphColor: Theme.colors.primary || "#111" };

  // ---------------------------------------------------------------------------
  // Progress timeline — Wallet debited → Sending to biller → Payment confirmed
  // ---------------------------------------------------------------------------
  const steps = [
    {
      key: "debited",
      title: "Wallet debited",
      sub: `₹${transactionDetails.amount} held from your wallet`,
      state: "done",
    },
    {
      key: "dispatch",
      title: isCompleted ? "Sent to biller" : isFailed ? "Dispatch failed" : "Sending to biller",
      sub: isPending
        ? "Submitting to BBPS…"
        : isFailed
        ? (liveMessage || "Payment could not be processed")
        : "Biller accepted the request",
      state: isPending ? "active" : isFailed ? "error" : "done",
    },
    {
      key: "confirmed",
      title: isCompleted ? "Payment confirmed" : isFailed ? "Refund pending" : "Awaiting confirmation",
      sub: isCompleted
        ? "Your bill has been paid"
        : isFailed
        ? "Amount will be refunded automatically"
        : "We'll update this in real time",
      state: isCompleted ? "done" : "pending",
    },
  ];

  // Indeterminate shimmer for the "active" step's progress bar.
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isPending) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isPending, shimmer]);
  const shimmerLeft = shimmer.interpolate({ inputRange: [0, 1], outputRange: ["0%", "60%"] });

  // ---------------------------------------------------------------------------
  // Mount animation for the hero icon
  // ---------------------------------------------------------------------------
  const viewShotRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const interactionHandle = InteractionManager.runAfterInteractions(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    });
    return () => interactionHandle.cancel();
  }, [scaleAnim, fadeAnim]);

  // ---------------------------------------------------------------------------
  // Share receipt (screenshot) — disabled while the payment is still pending.
  // ---------------------------------------------------------------------------
  const handleShare = useCallback(async () => {
    if (isPending) {
      Alert.alert("Please wait", "Your payment is still being confirmed.");
      return;
    }
    if (isSharing || !viewShotRef.current) return;
    setIsSharing(true);

    try {
      const uri = await viewShotRef.current.capture();
      if (!uri) throw new Error("Failed to capture screenshot");

      const timestamp = moment().format("YYYYMMDD_HHmmss");
      const statusText = isCompleted ? "Success" : "Failed";
      const fileName = `ODH_Pay_Receipt_${statusText}_${timestamp}.png`;
      const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

      const oldFileExists = await RNFS.exists(filePath);
      if (oldFileExists) await RNFS.unlink(filePath);

      await RNFS.copyFile(uri, filePath);
      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        Alert.alert("Error", "Failed to create receipt image");
        return;
      }

      const shareMessage = isCompleted
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
      if (error?.message !== "User did not share" &&
          !error?.message?.includes("cancelled") &&
          !error?.message?.includes("dismissed")) {
        console.error("Sharing failed:", error);
        Alert.alert("Share Failed", "Unable to share receipt. Please try again.");
      }
    } finally {
      setIsSharing(false);
    }
  }, [isPending, isSharing, transactionDetails, isCompleted]);

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

  const StatusPillIcon = isCompleted ? CheckCircle2 : isFailed ? XCircle : Clock;
  const statusPillText = isCompleted ? "Success" : isFailed ? "Failed" : "Processing";

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={hero.colors[1]} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 + Math.max(insets.bottom, 8) }}
        showsVerticalScrollIndicator={false}
      >
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1.0 }}
          style={{ backgroundColor: Theme.colors.background || "#f5f5f8" }}
        >
          {/* Hero */}
          <LinearGradient
            colors={hero.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerPattern}>
              <View style={[styles.patternCircle, styles.patternCircle1]} />
              <View style={[styles.patternCircle, styles.patternCircle2]} />
            </View>

            <View style={styles.headerTopRow}>
              <Image
                source={require("../../assets/BAssuredLogoReversePNG.png")}
                style={styles.bcassured}
              />
              <View style={styles.statusPill}>
                <StatusPillIcon size={16} color="#FFFFFF" />
                <Text style={styles.statusPillText}>{statusPillText}</Text>
              </View>
            </View>

            <Animated.View
              style={[
                styles.successIconContainer,
                { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
              ]}
            >
              <View style={styles.successCircle}>
                {isPending ? (
                  <ActivityIndicator size="small" color={hero.glyphColor} />
                ) : isCompleted ? (
                  <CheckCircle2 size={44} color="#FFFFFF" strokeWidth={2.5} />
                ) : (
                  <XCircle size={44} color="#FFFFFF" strokeWidth={2.5} />
                )}
              </View>
            </Animated.View>

            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>{hero.label}</Text>
              <Text style={styles.amountValue}>₹{transactionDetails.amount}</Text>
              <View style={styles.timestampContainer}>
                <Calendar size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.timestamp}>{transactionDetails.timestamp}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Progress timeline */}
          <View style={styles.section}>
            <Text style={styles.cardLabel}>Payment progress</Text>
            {steps.map((s, i) => {
              const isLast = i === steps.length - 1;
              const dotColor =
                s.state === "done" ? (Theme.colors.success || "#10B981") :
                s.state === "error" ? (Theme.colors.danger || "#EF4444") :
                s.state === "active" ? (Theme.colors.primary || "#111") :
                "#D1D5DB";
              return (
                <View key={s.key} style={styles.stepRow}>
                  <View style={styles.stepRail}>
                    <View style={[styles.stepDot, { backgroundColor: dotColor }]}>
                      {s.state === "done" && <Check size={13} color="#FFF" strokeWidth={3} />}
                      {s.state === "error" && <X size={13} color="#FFF" strokeWidth={3} />}
                      {s.state === "active" && <View style={styles.stepActiveCore} />}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.stepLine,
                          { backgroundColor: s.state === "done" ? dotColor : "#E5E7EB" },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.stepBody}>
                    <Text style={[styles.stepTitle, s.state === "pending" && { color: "#9CA3AF" }]}>
                      {s.title}
                    </Text>
                    <Text style={styles.stepSub}>{s.sub}</Text>
                    {s.state === "active" && (
                      <View style={styles.progressTrack}>
                        <View style={styles.progressFill} />
                        <Animated.View style={[styles.progressShimmer, { left: shimmerLeft }]} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Service details */}
          <View style={styles.section}>
            <View style={styles.rechargeInfo}>
              <View style={styles.providerInfo}>
                <View style={styles.providerIconWrap}>
                  <Receipt size={20} color={Theme.colors.primary || "#000"} />
                </View>
                <View style={styles.providerDetails}>
                  <Text style={styles.providerName}>{transactionDetails.provider}</Text>
                  <Text style={styles.subtleText}>
                    {(category || service_type || "Bill Payment").toString().replace(/_/g, " ")}
                  </Text>
                </View>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>₹{transactionDetails.amount}</Text>
              </View>
            </View>
          </View>

          {/* Payment details */}
          <View style={styles.section}>
            <View style={styles.paymentHeader}>
              <View style={styles.paymentHeaderLeft}>
                <Receipt size={22} color="#000" />
                <Text style={styles.paymentHeaderText}>Payment details</Text>
              </View>
              <ChevronDown size={20} color="#666" />
            </View>

            <View style={styles.idSection}>
              <Text style={styles.idLabel}>Reference ID</Text>
              <Text style={styles.idValue} numberOfLines={1}>
                {transactionDetails.referenceId}
              </Text>
            </View>

            {!!service_type && (
              <View style={styles.idSection}>
                <Text style={styles.idLabel}>Service Type</Text>
                <Text style={styles.idValue}>
                  {service_type?.replace(/_/g, " ").toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.idSection}>
              <Text style={styles.idLabel}>Payment Method</Text>
              <View style={styles.walletBadge}>
                <CreditCard size={14} color="#000000" />
                <Text style={styles.walletBadgeText}>
                  {transactionDetails?.paymentMode || "Card / UPI / Net Banking"}
                </Text>
              </View>
            </View>

            <View style={styles.idSection}>
              <Text style={styles.idLabel}>Transaction Fee</Text>
              <Text style={styles.freeText}>FREE</Text>
            </View>

            <View style={styles.debitedSection}>
              <Text style={styles.debitedLabel}>
                {isFailed ? "Amount will be refunded in case of debit" : "Paid via payment gateway"}
              </Text>
              <View style={styles.debitedInfo}>
                <View style={styles.walletIconCircle}>
                  <CreditCard size={20} color="#FFFFFF" />
                </View>
                <View style={styles.debitedDetails}>
                  <Text style={styles.accountNumber}>
                    {transactionDetails?.paymentMode || "Card / UPI / Net Banking"}
                  </Text>
                  <Text style={styles.utrNumber}>Ref: {transactionDetails.referenceId}</Text>
                </View>
                <Text style={styles.debitedAmount}>₹{transactionDetails.amount}</Text>
              </View>
            </View>

            {isFailed && (
              <View style={styles.refundBanner}>
                <Text style={styles.refundText}>
                  ₹{transactionDetails.amount} will be auto-refunded to your wallet.
                </Text>
              </View>
            )}
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.shareButton,
              (isSharing || isPending) && styles.shareButtonDisabled,
            ]}
            onPress={handleShare}
            disabled={isSharing || isPending}
            activeOpacity={0.8}
          >
            <Share2 size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>
              {isSharing ? "Preparing..." : "Share Receipt"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.copyRefButton}
            onPress={() => copyToClipboard(transactionDetails.referenceId, "Reference ID")}
            activeOpacity={0.8}
          >
            <Copy size={18} color="#000000" />
            <Text style={styles.copyRefButtonText}>Copy Ref ID</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer with Home button */}
      <View style={[styles.footerNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[styles.homeBtn, isPending && styles.homeBtnMuted]}
          onPress={goHome}
          activeOpacity={0.85}
        >
          <Home size={20} color="#fff" />
          <Text style={styles.homeBtnText}>{isPending ? "Got it" : "Go to Home"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background || "#f5f5f8",
  },
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background || "#f5f5f8",
  },
  bcassured: {
    width: 56,
    height: 56,
    resizeMode: "contain",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 44,
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
  patternCircle1: { width: 200, height: 200, top: -80, right: -60 },
  patternCircle2: { width: 150, height: 150, bottom: -50, left: -40 },
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
  statusPillText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  successIconContainer: {
    alignItems: "center",
    marginTop: 22,
    marginBottom: 6,
    zIndex: 1,
  },
  successCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  amountBlock: { marginTop: 18, alignItems: "center", gap: 8, zIndex: 1 },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timestamp: { fontSize: 13, color: "rgba(255, 255, 255, 0.9)", fontWeight: "500" },
  amountValue: { fontSize: 42, color: "#fff", fontWeight: "800", letterSpacing: -1 },
  amountLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  section: {
    backgroundColor: "white",
    padding: 18,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border || "#EDEFF3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.colors.textSecondary || "#6B7280",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 16,
  },

  // ---- Progress timeline ----
  stepRow: { flexDirection: "row", alignItems: "stretch" },
  stepRail: { width: 28, alignItems: "center" },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
  stepActiveCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFF" },
  stepLine: { width: 2, flex: 1, marginVertical: 4, alignSelf: "center" },
  stepBody: { flex: 1, paddingBottom: 16, marginLeft: 8 },
  stepTitle: { fontSize: 14, fontWeight: "700", color: Theme.colors.text || "#111" },
  stepSub: { fontSize: 12, color: Theme.colors.textSecondary || "#6B7280", marginTop: 2 },
  progressTrack: {
    marginTop: 10, height: 4, borderRadius: 2,
    backgroundColor: "#E5E7EB", overflow: "hidden",
  },
  progressFill: { ...StyleSheet.absoluteFillObject, backgroundColor: Theme.colors.primary || "#111" },
  progressShimmer: {
    position: "absolute", top: 0, bottom: 0,
    width: "40%",
    backgroundColor: "rgba(255,255,255,0.45)",
  },

  rechargeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  providerInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  providerIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Theme.colors.inputBg || "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  providerDetails: { marginLeft: 12, gap: 2, flex: 1 },
  providerName: { fontSize: 16, fontWeight: "700", color: Theme.colors.text || "#111" },
  subtleText: { fontSize: 13, color: "#6b7280", textTransform: "capitalize" },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
  },
  badgeText: { color: Theme.colors.text || "#111", fontWeight: "800" },

  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  paymentHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  paymentHeaderText: { fontSize: 16, fontWeight: "700", color: Theme.colors.text || "#111" },

  idSection: { marginTop: 18 },
  idLabel: { fontSize: 13, color: "#6B7280", marginBottom: 4 },
  idValue: { fontSize: 15, fontWeight: "700", color: "#000" },

  debitedSection: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#EFF1F4",
    paddingTop: 16,
  },
  debitedLabel: { fontSize: 14, color: "#6B7280", marginBottom: 12 },
  debitedInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF0F3",
  },
  walletIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#000000",
    justifyContent: "center", alignItems: "center",
  },
  debitedDetails: { flex: 1, marginLeft: 12 },
  accountNumber: { fontSize: 15, fontWeight: "700", color: "#000" },
  utrNumber: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  debitedAmount: { fontSize: 16, fontWeight: "800", color: "#000" },

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
  walletBadgeText: { fontSize: 14, fontWeight: "700", color: "#000000" },
  freeText: { color: "#10B981", fontWeight: "800", fontSize: 15 },

  refundBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  refundText: { color: "#92400E", fontSize: 12, fontWeight: "600", flex: 1 },

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
    backgroundColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonDisabled: { opacity: 0.5 },
  shareButtonText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
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
    borderColor: "#000000",
  },
  copyRefButtonText: { color: "#000000", fontSize: 14, fontWeight: "700" },

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
    backgroundColor: Theme.colors.primary || "#000",
    paddingVertical: 16,
    width: "100%",
    borderRadius: 12,
    elevation: 2,
    shadowColor: Theme.colors.primary || "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  homeBtnMuted: { opacity: 0.6 },
  homeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
});

export default BbpsTransactionSuccess;
