import React, { useState, useEffect, useMemo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRegisterStore } from "../../store/useRegisterStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Theme from "../Theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { normalizeIndianMobile } from "../../utils/helper";

// Operator logos shipped locally — used for the header chip. Falls back to the
// brand-coloured circle below if none matches.
const OPERATOR_LOGOS = {
  jio: require("../../assets/jio.png"),
  airtel: require("../../assets/airtel.png"),
  vi: require("../../assets/vi.png"),
  vodafone: require("../../assets/vi.png"),
  bsnl: require("../../assets/bsnl2.png"),
};
const OPERATOR_GRADIENTS = {
  jio: ["#1F3A8A", "#1E40AF"],
  airtel: ["#E11D48", "#9F1239"],
  vi: ["#7C3AED", "#DB2777"],
  vodafone: ["#7C3AED", "#DB2777"],
  bsnl: ["#0EA5E9", "#0369A1"],
  default: [Theme.colors.primary, Theme.colors.primary],
};
const operatorKey = (name) => {
  const s = (name || "").toLowerCase();
  if (s.includes("jio")) return "jio";
  if (s.includes("airtel")) return "airtel";
  if (s.includes("bsnl")) return "bsnl";
  if (s.includes("vi") || s.includes("vodafone") || s.includes("idea")) return "vi";
  return "default";
};

const RechargeTrxPin = () => {
  const navigation = useNavigation();
  const route = useRoute();


  const { user } = useRegisterStore();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);

  const { amount, mobile_number, recipient_name, circle, operator_code, circle_code } = route.params.payload || {};
  const [commission, setCommission] = useState();

  const opKey = useMemo(() => operatorKey(recipient_name), [recipient_name]);
  const opLogo = OPERATOR_LOGOS[opKey];
  const opGradient = OPERATOR_GRADIENTS[opKey] || OPERATOR_GRADIENTS.default;

  const fetchWalletBalance = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return;
      const { data } = await axios.get(
        "https://newapi.odhpay.com/api/v1/wallet/balance",
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      const bal = data?.available_balance ?? data?.total_balance ?? data?.balance ?? null;
      if (bal != null) setWalletBalance(parseFloat(bal));
    } catch (e) {
      // Silent — balance display is best-effort.
    }
  };

  useEffect(() => {
    fetchWalletBalance();
  }, []);


  const getCommission = async () => {
    // Face-value fallback so a flaky/missing commission lookup never blocks
    // the proceed-to-pay flow. The user always sees a usable `commission.total`.
    const faceValue = {
      status: "fallback",
      platformFee: 0,
      discount: 0,
      lcrMoney: 0,
      total: parseFloat(amount) || 0,
    };
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        Alert.alert("Error", "Authentication token missing. Please login again.");
        return;
      }
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const { data } = await axios.post(
        "https://newapi.odhpay.com/recharge/get_commision",
        { amount: amount, provider: recipient_name },
        { headers }
      );
      setLoading(false);
      setCommission(
        data && typeof data.total !== "undefined" ? data : faceValue
      );
    } catch (error) {
      console.log(
        "commission lookup failed, using face value",
        error?.response?.data || error?.message
      );
      setLoading(false);
      setCommission(faceValue);
    }
  };

  useEffect(() => {
    getCommission();
  }, [])


  const OperatorMap = {
    "Jio Prepaid": "Jio",
    "Airtel Prepaid": "Airtel",
    "BSNL Prepaid": "BSNL",
    "Vi Prepaid": "Vodafone",
  }


  // Poll /wallet/service-status until the background recharge resolves.
  // Returns the last seen status payload — caller decides what to show.
  // Bounded so a stuck BillAvenue call doesn't hang the UI forever; the
  // backend will keep processing and FCM will surface the final outcome.
  const pollRechargeStatus = async (referenceId, headers) => {
    if (!referenceId) return { service_status: "pending" };
    const STATUS_URL = `https://newapi.odhpay.com/api/v1/wallet/service-status/${referenceId}`;
    const TERMINAL = new Set(["completed", "failed"]);
    const MAX_ATTEMPTS = 12; // ~12s total at 1s spacing
    const SLEEP_MS = 1000;

    let last = { service_status: "pending" };
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const { data } = await axios.get(STATUS_URL, { headers });
        last = data || last;
        if (TERMINAL.has((data?.service_status || "").toLowerCase())) return data;
      } catch (e) {
        // Transient errors are fine — keep polling until budget runs out.
        console.log("status poll attempt failed", attempt, e?.message);
      }
      await new Promise((r) => setTimeout(r, SLEEP_MS));
    }
    return last;
  };

  const handlePaymentGateway = async () => {
    // For now we pay every recharge from the wallet — the gateway flow is
    // disabled until we re-enable Razorpay/SabPaisa for this surface. The
    // backend's /wallet/pay-service endpoint debits the wallet AND triggers
    // the BBPS recharge dispatch (via the new /recharge/initiate path) in
    // one call, so we can navigate straight to the success screen on 200.
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        setLoading(false);
        return;
      }

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const payload = {
        amount: parseFloat(amount),
        service_type: "MobileRecharge",
        purpose: "Payment",
        recharge_data: {
          mobile_number: normalizeIndianMobile(mobile_number),
          operator_name: OperatorMap[recipient_name] || recipient_name,
          operator_code: operator_code ? String(operator_code) : undefined,
          circle: circle || undefined,
          circle_code: circle_code || undefined,
          recharge_type: "prepaid",
        },
      };

      const { data } = await axios.post(
        "https://newapi.odhpay.com/api/v1/wallet/pay-service",
        payload,
        { headers }
      );

      // /pay-service returns as soon as the wallet is debited; the actual
      // BillAvenue recharge runs in a background task. Poll the per-request
      // status endpoint until it resolves so the success screen reflects the
      // real recharge outcome, not just "money moved".
      const referenceId = data?.reference_id;
      const finalStatus = await pollRechargeStatus(referenceId, headers);
      setLoading(false);

      const isSuccess = finalStatus.service_status === "completed";
      const isFailure = finalStatus.service_status === "failed";
      const rechargeStatus = isSuccess ? "success" : (isFailure ? "failed" : "pending");

      navigation.navigate("RechargeSuccess", {
        amount: parseFloat(amount),
        mobile_number: normalizeIndianMobile(mobile_number),
        recipient_name: OperatorMap[recipient_name] || recipient_name,
        RechargeStatus: rechargeStatus,
        responseData: {
          bbps_reference_no: referenceId,
          transaction_date: new Date().toISOString(),
          message:
            finalStatus.error_message ||
            data?.message ||
            (isSuccess
              ? "Recharge successful"
              : isFailure
              ? "Recharge failed"
              : "Recharge in process. We'll notify you once it's done."),
          balance_after: data?.balance_after,
        },
      });
    } catch (error) {
      console.error("Wallet pay error:", error?.response?.data || error?.message);
      setLoading(false);
      const detail = error?.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : detail?.message ||
            error?.response?.data?.message ||
            "Recharge failed. Please try again.";
      Alert.alert("Recharge failed", msg);
    }
  };

  if (!amount || !mobile_number || !recipient_name) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Invalid recharge details. Please try again{route.params?.payload?.amount}.
        </Text>
      </View>
    );
  }

  const finalAmount = commission?.total ? parseFloat(commission.total) : parseFloat(amount);
  const lowBalance = walletBalance != null && walletBalance < finalAmount;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero: operator gradient with logo + mobile */}
        <LinearGradient
          colors={opGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroRow}>
            <View style={styles.heroLogoWrap}>
              {opLogo ? (
                <Image source={opLogo} style={styles.heroLogo} />
              ) : (
                <MaterialIcons name="phone-android" size={28} color="#FFF" />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.heroOperator}>{recipient_name || "Mobile Recharge"}</Text>
              <Text style={styles.heroNumber}>
                +91 {mobile_number ? `${mobile_number.slice(0, 5)} ${mobile_number.slice(5)}` : ""}
              </Text>
              {!!circle && <Text style={styles.heroCircle}>{circle}</Text>}
            </View>
          </View>

          <View style={styles.heroAmountRow}>
            <Text style={styles.heroAmountLabel}>Recharge amount</Text>
            <Text style={styles.heroAmount}>₹{Number(amount).toFixed(0)}</Text>
          </View>
        </LinearGradient>

        {/* Bill / commission breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill summary</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Plan amount</Text>
            <Text style={styles.rowValue}>₹{Number(amount).toFixed(2)}</Text>
          </View>
          {commission?.discount > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Discount</Text>
              <Text style={[styles.rowValue, { color: "#10B981" }]}>
                − ₹{(commission.discount).toFixed(2)}
              </Text>
            </View>
          )}
          {commission?.lcrMoney > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>LCR Money</Text>
              <Text style={[styles.rowValue, { color: "#10B981" }]}>
                − ₹{(commission.lcrMoney).toFixed(2)}
              </Text>
            </View>
          )}
          {commission?.platformFee > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Platform fee</Text>
              <Text style={[styles.rowValue, { color: "#B45309" }]}>
                + ₹{(commission.platformFee).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total payable</Text>
            <Text style={styles.totalValue}>₹{finalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pay using</Text>
          <View style={styles.payMethodRow}>
            <View style={styles.payMethodIcon}>
              <Ionicons name="wallet" size={22} color="#FFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.payMethodName}>ODH Wallet</Text>
              <Text style={styles.payMethodSub}>
                {walletBalance != null
                  ? `Balance: ₹${walletBalance.toFixed(2)}`
                  : "Fetching balance…"}
              </Text>
            </View>
            <View style={styles.selectedDot} />
          </View>
          {lowBalance && (
            <View style={styles.warnRow}>
              <Ionicons name="alert-circle" size={14} color="#B45309" />
              <Text style={styles.warnText}>
                Insufficient wallet balance for this recharge.
              </Text>
            </View>
          )}
        </View>

        {/* Safety note */}
        <View style={styles.safetyRow}>
          <Ionicons name="shield-checkmark" size={14} color="#10B981" />
          <Text style={styles.safetyText}>
            100% secure recharge via BBPS. Refunded if it fails.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerLeftLabel}>Pay</Text>
          <Text style={styles.footerLeftAmount}>₹{finalAmount.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, (loading || lowBalance) && styles.payBtnDisabled]}
          onPress={handlePaymentGateway}
          disabled={loading || lowBalance}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.payBtnText}>Confirm & Pay</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F6FA" },
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  errorText: { color: "#d9534f", textAlign: "center", marginTop: 20, fontSize: 16 },

  /* Hero */
  hero: {
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroLogoWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
    overflow: "hidden",
  },
  heroLogo: { width: 40, height: 40, resizeMode: "contain" },
  heroOperator: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  heroNumber: { color: "#FFF", fontSize: 15, fontWeight: "600", marginTop: 2, letterSpacing: 0.4 },
  heroCircle: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  heroAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  heroAmountLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },
  heroAmount: { color: "#FFF", fontSize: 28, fontWeight: "900" },

  /* Cards */
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    ...Platform.select({ android: { elevation: 1 } }),
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#64748B", marginBottom: 12, letterSpacing: 0.3, textTransform: "uppercase" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  rowLabel: { fontSize: 14, color: "#475569" },
  rowValue: { fontSize: 14, color: "#0F172A", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 8 },
  totalLabel: { fontSize: 15, color: "#0F172A", fontWeight: "700" },
  totalValue: { fontSize: 18, color: Theme.colors.primary, fontWeight: "900" },

  /* Payment method */
  payMethodRow: { flexDirection: "row", alignItems: "center" },
  payMethodIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Theme.colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  payMethodName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  payMethodSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  selectedDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Theme.colors.primary,
    borderWidth: 4, borderColor: "#FFF",
    shadowColor: Theme.colors.primary, shadowOpacity: 0.4, shadowRadius: 4,
  },
  warnRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FEF3C7", padding: 10, borderRadius: 10, marginTop: 12,
    gap: 8,
  },
  warnText: { color: "#92400E", fontSize: 12, fontWeight: "600", flex: 1 },

  /* Safety note */
  safetyRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center",
    marginTop: 16, gap: 6,
  },
  safetyText: { color: "#475569", fontSize: 12, fontWeight: "500" },

  /* Sticky footer */
  footer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  footerLeft: { flex: 1 },
  footerLeftLabel: { fontSize: 11, color: "#64748B", fontWeight: "600", textTransform: "uppercase" },
  footerLeftAmount: { fontSize: 22, color: "#0F172A", fontWeight: "900", marginTop: 2 },
  payBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 22, paddingVertical: 14,
    borderRadius: 14, gap: 8,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  payBtnDisabled: { backgroundColor: "#94A3B8", shadowOpacity: 0 },
  payBtnText: { color: "#FFF", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
});

export default RechargeTrxPin;
