import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Keyboard, Alert, Animated, Easing, Dimensions, Platform } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useRegisterStore } from "../../store/useRegisterStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Theme from "../Theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { normalizeIndianMobile } from "../../utils/helper";

const GREEN_TICK = "#22C55E"; // success tick

const RechargeTrxPin = () => {
  const navigation = useNavigation();
  const route = useRoute();


  const { user } = useRegisterStore();
  const [loading, setLoading] = useState(false);
  const [isDropdownVisible, setDropdownVisible] = useState(false);



  const { amount, mobile_number, recipient_name, circle, operator_code, circle_code } = route.params.payload || {};
  console.log("RechargeTrxPin route params", route.params.payload);
  const [commission, setCommission] = useState();


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

      setLoading(false);

      navigation.navigate("RechargeSuccess", {
        amount: parseFloat(amount),
        mobile_number: normalizeIndianMobile(mobile_number),
        recipient_name: OperatorMap[recipient_name] || recipient_name,
        RechargeStatus: data?.status === "completed" ? "success" : (data?.processing_status || "queued"),
        responseData: {
          bbps_reference_no: data?.reference_id,
          transaction_date: new Date().toISOString(),
          message: data?.message,
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.bankName}>ODHPAY</Text>
            <Text style={styles.accountNumber}>XXXXXX{user?.user?.MobileNumber?.slice(-4)}</Text>
          </View>
          <Image source={require("../../assets/LogoN.png")} style={styles.upiLogo} />
        </View>

        {/* Details Card */}
        <View style={styles.detailsContainer}>
          <View style={styles.row}>
            <Text style={styles.toText}>To:</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setDropdownVisible(!isDropdownVisible)}
            >
              <Text style={styles.recipient}>{recipient_name}</Text>
              <AntDesign
                name={isDropdownVisible ? "up" : "down"}
                size={14}
                color={Theme.colors.primary}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.row, { marginTop: 6 }]}>
            <Text style={styles.sendingText}>Sending:</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.amount}>₹{amount}</Text>
              {commission?.discount > 0 && (
                <Text style={styles.discountText}>
                  Discount: -₹{(commission?.discount || 0).toFixed(2)}
                </Text>
              )}
              {commission?.platformFee > 0 && (
                <Text style={styles.feeText}>
                  Platform Fee: +₹{(commission?.platformFee || 0).toFixed(2)}
                </Text>
              )}
              {commission?.lcrMoney > 0 && (
                <Text style={styles.discountText}>
                  LCR Money: -₹{(commission?.lcrMoney || 0).toFixed(2)}
                </Text>
              )}
              <Text style={styles.finalAmount}>
                Final Amount: ₹{commission?.total ? commission.total.toFixed(2) : amount}
              </Text>
            </View>
          </View>

          {isDropdownVisible && (
            <View style={styles.dropdownContainer}>
              <Text style={styles.detailText}>PAYING TO: {recipient_name}</Text>
              <Text style={styles.detailText}>Amount: ₹{amount}</Text>
              <Text style={styles.detailText}>Recharge: {mobile_number}</Text>
              <Text style={styles.detailText}>REF ID: XXXXXXXXXXXXXXXXXX</Text>
              <Text style={styles.detailText}>REF URL: https://odhpay.com</Text>
            </View>
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.paymentButton} onPress={handlePaymentGateway} disabled={loading}>
          <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
        </TouchableOpacity>

      </View>
    </TouchableWithoutFeedback>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  errorText: { color: "#d9534f", textAlign: "center", marginTop: 20, fontSize: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  bankName: { fontSize: 18, fontWeight: "800", color: "#000" },
  accountNumber: { fontSize: 13, color: "#666", marginTop: 2 },
  upiLogo: { width: 70, height: 60, resizeMode: "contain" },

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  detailsContainer: {
    marginVertical: 12,
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    ...Platform.select({ android: { elevation: 2 } }),
  },
  toText: { fontSize: 12, color: "#666" },
  recipient: { fontSize: 14, fontWeight: "bold", color: "#000" },
  dropdownButton: { flexDirection: "row", alignItems: "center" },
  sendingText: { fontSize: 12, color: "#666", marginTop: 5 },
  amountContainer: { alignItems: "flex-end" },
  amount: { fontSize: 22, fontWeight: "800", color: "#000" },
  discountText: { fontSize: 12, color: "#e74c3c", marginTop: 2 },
  feeText: { fontSize: 12, color: "#b45309", marginTop: 2 },
  finalAmount: { fontSize: 13, fontWeight: "bold", color: "#059669", marginTop: 4 },
  dropdownContainer: {
    marginTop: 10,
    backgroundColor: "#FFF9E6",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFE08A",
  },
  detailText: { fontSize: 14, color: "#444", marginBottom: 5 },

  paymentButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  paymentButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // ===== Overlay (full screen) =====
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  progressHeader: {
    marginBottom: 8,
  },
  progressTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  progressSub: { fontSize: 12, color: "#64748B", marginTop: 2 },

  // ===== Cards stack =====
  cardsStack: { gap: 12, marginTop: 8 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    ...Platform.select({ android: { elevation: 2 } }),
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#111827", flex: 1, paddingRight: 12 },
  tickCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: GREEN_TICK,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCaption: { fontSize: 12, color: "#6B7280", marginTop: 6 },

  progressTrack: {
    height: 8,
    backgroundColor: "#EEF2F7",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Theme.colors.primary,
    borderRadius: 999,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  footerHintRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  footerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.primary },
  footerHintText: { marginLeft: 8, color: "#64748B", fontSize: 12 },
});

export default RechargeTrxPin;
