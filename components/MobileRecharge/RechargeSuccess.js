import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRegisterStore } from "../../store/useRegisterStore";
import moment from "moment";
import Theme from "../Theme";
import { watchRechargeStatus } from "../../utils/rechargeStatusWatcher";
// import ViewShot from "react-native-view-shot";
// import Share from "react-native-share";
// import RNFS from "react-native-fs";

const RechargeSuccess = () => {
  const navigation = useNavigation();
  const { user } = useRegisterStore();

  // The recharge flow is done — clear it out so the user cannot navigate
  // back through RechargeTrxPin → RechargeScreenPay → Recharge plans and
  // accidentally re-initiate. Reset the stack to MainApp (bottom tabs).
  const goHome = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
  }, [navigation]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        goHome();
        return true;
      }
    );
    return () => backHandler.remove();
  }, [goHome]);

  // Hide the native header back arrow so swipe-back / arrow can't escape.
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
      gestureEnabled: false,
    });
  }, [navigation]);

  const route = useRoute();

  const {
    amount = 0,
    mobile_number = "",
    recipient_name = "",
    responseData = {},
    RechargeStatus = "",
    access_token: tokenFromParams,
  } = route.params || {};

  // Three observable states for the recharge:
  //   pending   → wallet debited, dispatch in flight (initial state when we
  //                land here from /pay-service)
  //   completed → BillAvenue confirmed (WS push or poll catches it)
  //   failed    → terminal failure (wallet auto-refunded by the backend)
  //
  // The initial value comes from the route param so deep links / future
  // entries with a known terminal state still render correctly.
  const initialKey = (RechargeStatus || "pending").toLowerCase();
  const initial =
    initialKey === "success" ? "completed" :
    initialKey === "failed" ? "failed" : "pending";
  const [liveStatus, setLiveStatus] = useState(initial);
  const [liveMessage, setLiveMessage] = useState(responseData?.message || "");

  const isCompleted = liveStatus === "completed";
  const isFailed = liveStatus === "failed";
  const isPending = !isCompleted && !isFailed;

  const referenceId = responseData?.bbps_reference_no || responseData?.reference_id;

  // Subscribe to live status updates (WS + poll fallback) only while pending.
  useEffect(() => {
    if (!isPending || !referenceId) return undefined;
    let token = tokenFromParams;
    const stopRef = { current: null };

    (async () => {
      if (!token) {
        try { token = await AsyncStorage.getItem("access_token"); } catch {}
      }
      stopRef.current = watchRechargeStatus({
        referenceId,
        token,
        onUpdate: (snap) => {
          if (!snap) return;
          setLiveMessage((m) => snap.message || m);
          if (snap.status === "completed" || snap.status === "failed") {
            setLiveStatus(snap.status);
          }
        },
      });
    })();

    return () => { stopRef.current && stopRef.current(); };
  }, [isPending, referenceId, tokenFromParams]);

  const statusUI = isCompleted
    ? { label: "Recharge successful", bg: Theme.colors.success || "#10B981", glyph: "✓" }
    : isFailed
    ? { label: "Recharge failed", bg: Theme.colors.danger, glyph: "✗" }
    : { label: "Processing recharge…", bg: Theme.colors.primary || "#111", glyph: "⏱" };

  const transactionDetails = {
    status: statusUI.label,
    timestamp: moment(responseData.transaction_date).format(
      "hh:mm a on DD MMM YYYY"
    ),
    provider: recipient_name,
    number: mobile_number,
    amount: amount,
    referenceId: referenceId || "N/A",
    debitedFrom: `XXX${user?.user?.MobileNumber?.slice(-4) || "XXXX"}`,
  };

  // ---- Progress timeline ----
  // 3 steps: 1) Payment debited (done immediately) 2) Sending to operator
  // (in-progress while pending, done when terminal) 3) Recharge confirmed
  // (done on success, error on failure).
  const steps = [
    {
      key: "debited",
      title: "Wallet debited",
      sub: `₹${amount} held from your wallet`,
      state: "done",
    },
    {
      key: "dispatch",
      title: isCompleted || isFailed ? (isFailed ? "Dispatch failed" : "Sent to operator") : "Sending to operator",
      sub: isPending ? "Talking to BillAvenue…" : isFailed ? (liveMessage || "Recharge could not be processed") : "Operator accepted the request",
      state: isPending ? "active" : isFailed ? "error" : "done",
    },
    {
      key: "confirmed",
      title: isCompleted ? "Recharge confirmed" : isFailed ? "Refund pending" : "Awaiting confirmation",
      sub: isCompleted
        ? "Your number has been topped up"
        : isFailed
        ? "Amount will be refunded automatically"
        : "We'll update this in real time",
      state: isCompleted ? "done" : isFailed ? "pending" : isPending ? "pending" : "done",
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

  const handleShare = async () => {
    // Simple share using react-native Share API
    try {
      const { Share } = require('react-native');
      await Share.share({
        message: `Recharge ${RechargeStatus === "success" ? "Successful" : "Failed"}
Amount: ₹${amount}
Mobile: ${mobile_number}
Operator: ${recipient_name}
Reference: ${responseData.bbps_reference_no || "N/A"}
Date: ${moment(responseData.transaction_date).format("DD MMM YYYY hh:mm a")}`,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero status card */}
        <LinearGradient
          colors={
            isCompleted ? ["#10B981", "#047857"] :
            isFailed ? ["#EF4444", "#B91C1C"] :
            ["#1F2937", "#000000"]
          }
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIconWrap}>
            {isPending ? (
              <ActivityIndicator size="small" color={Theme.colors.primary || "#111"} />
            ) : (
              <Text style={[styles.heroGlyph, { color: isCompleted ? "#10B981" : "#EF4444" }]}>
                {statusUI.glyph}
              </Text>
            )}
          </View>
          <Text style={styles.heroTitle}>{statusUI.label}</Text>
          <Text style={styles.heroTime}>{transactionDetails.timestamp}</Text>
          {!!liveMessage && isPending && (
            <Text style={styles.heroSub}>{liveMessage}</Text>
          )}
        </LinearGradient>

        {/* Progress timeline */}
        <View style={styles.card}>
          {steps.map((s, i) => {
            const isLast = i === steps.length - 1;
            const dotColor =
              s.state === "done" ? Theme.colors.success || "#10B981" :
              s.state === "error" ? Theme.colors.danger || "#EF4444" :
              s.state === "active" ? Theme.colors.primary || "#111" :
              "#D1D5DB";
            return (
              <View key={s.key} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View style={[styles.stepDot, { backgroundColor: dotColor }]}>
                    {s.state === "done" && (
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    )}
                    {s.state === "error" && (
                      <Ionicons name="close" size={14} color="#FFF" />
                    )}
                    {s.state === "active" && (
                      <View style={styles.stepActiveCore} />
                    )}
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

        {/* Recipient details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mobile recharged</Text>
          <View style={styles.recipientRow}>
            <View style={styles.recipientIcon}>
              <Ionicons name="phone-portrait-outline" size={20} color={Theme.colors.primary || "#111"} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.recipientName}>{transactionDetails.provider}</Text>
              <Text style={styles.recipientNumber}>{transactionDetails.number}</Text>
            </View>
            <Text style={styles.recipientAmount}>₹{transactionDetails.amount}</Text>
          </View>
        </View>

        {/* Payment details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment details</Text>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Recharge amount</Text>
            <Text style={styles.kvValue}>₹{transactionDetails.amount}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Paid via</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="card" size={14} color={Theme.colors.text} style={{ marginRight: 6 }} />
              {/* Recharges are charged to the payment gateway, not the wallet.
                  Show the real instrument when the backend reports one. */}
              <Text style={styles.kvValue}>
                {transactionDetails?.paymentMode || "Card / UPI / Net Banking"}
              </Text>
            </View>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Reference ID</Text>
            <Text style={[styles.kvValue, { fontSize: 12 }]} numberOfLines={1}>
              {transactionDetails.referenceId}
            </Text>
          </View>
          {isFailed && (
            <View style={styles.refundBanner}>
              <Ionicons name="refresh" size={14} color="#92400E" style={{ marginRight: 6 }} />
              <Text style={styles.refundText}>
                ₹{transactionDetails.amount} will be auto-refunded to your wallet.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnSecondary]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Ionicons name="share-social-outline" size={18} color={Theme.colors.primary} />
          <Text style={styles.btnSecondaryText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, isPending && styles.btnPrimaryMuted]}
          onPress={goHome}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>
            {isPending ? "Got it" : "Back to Home"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background || "#F8F9FE" },
  scroll: { padding: 16, paddingBottom: 32 },

  // ---- Hero status card ----
  hero: {
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  heroIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#FFF",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroGlyph: { fontSize: 30, fontWeight: "900" },
  heroTitle: { color: "#FFF", fontSize: 20, fontWeight: "800", marginTop: 4 },
  heroTime: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 4 },
  heroSub: {
    color: "rgba(255,255,255,0.9)", fontSize: 12, marginTop: 10,
    textAlign: "center", paddingHorizontal: 12, lineHeight: 18,
  },

  // ---- Generic card ----
  card: {
    backgroundColor: Theme.colors.surface || "#FFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border || "#E5E7EB",
  },
  cardTitle: {
    fontSize: 12, fontWeight: "700",
    color: Theme.colors.textSecondary || "#6B7280",
    letterSpacing: 0.5, textTransform: "uppercase",
    marginBottom: 14,
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

  // ---- Recipient row ----
  recipientRow: { flexDirection: "row", alignItems: "center" },
  recipientIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Theme.colors.inputBg || "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  recipientName: { fontSize: 15, fontWeight: "700", color: Theme.colors.text || "#111" },
  recipientNumber: { fontSize: 13, color: Theme.colors.textSecondary || "#6B7280", marginTop: 2 },
  recipientAmount: { fontSize: 17, fontWeight: "900", color: Theme.colors.text || "#111" },

  // ---- Key/value rows ----
  kvRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  kvLabel: { fontSize: 13, color: Theme.colors.textSecondary || "#6B7280" },
  kvValue: { fontSize: 13, fontWeight: "700", color: Theme.colors.text || "#111", maxWidth: "60%" },

  refundBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FEF3C7", padding: 10, borderRadius: 10, marginTop: 4,
  },
  refundText: { color: "#92400E", fontSize: 12, fontWeight: "600", flex: 1 },

  // ---- Sticky footer ----
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Theme.colors.surface || "#FFF",
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border || "#E5E7EB",
    gap: 10,
  },
  btnSecondary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary || "#111",
    gap: 6,
    backgroundColor: "#FFF",
  },
  btnSecondaryText: { color: Theme.colors.primary || "#111", fontWeight: "700", fontSize: 14 },
  btnPrimary: {
    flex: 1,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary || "#111",
    gap: 8,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnPrimaryMuted: { opacity: 0.6 },
  btnPrimaryText: { color: "#FFF", fontWeight: "800", fontSize: 15, letterSpacing: 0.2 },
});

export default RechargeSuccess;
