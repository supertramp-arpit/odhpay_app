import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import useUserStore from "../../store/useUserStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getIntegrityToken } from "../../utils/integrity";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import Theme from "../Theme";

const DIGITS = 6;
const { width } = Dimensions.get("window");
const isSmall = width < 375;

const WalletTransactionPin = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get payment details from navigation params
  const { amount, payload, walletBalance } = route.params || {};

  const [pin, setPin] = useState(Array(DIGITS).fill(""));
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [focusedInput, setFocusedInput] = useState(0);

  const user = useUserStore((s) => s.user);
  const userData = user?.user ? user.user : user;

  const inputRefs = useRef(Array.from({ length: DIGITS }, () => React.createRef()));

  const focusNextInput = useCallback((currentIndex) => {
    if (currentIndex < DIGITS - 1) {
      inputRefs.current[currentIndex + 1]?.focus();
      setFocusedInput(currentIndex + 1);
    } else {
      Keyboard.dismiss();
    }
  }, []);

  const focusPreviousInput = useCallback((currentIndex) => {
    if (currentIndex > 0) {
      inputRefs.current[currentIndex - 1]?.focus();
      setFocusedInput(currentIndex - 1);
    }
  }, []);

  const handlePinChange = useCallback((text, index) => {
    setErrorMessage(""); // Clear error on input

    if (text.length > 1) {
      const digits = text.split("").slice(0, DIGITS);
      setPin((prevPin) => {
        const newPin = [...prevPin];
        digits.forEach((digit, i) => {
          if (index + i < DIGITS) newPin[index + i] = digit;
        });
        return newPin;
      });

      if (text.length === DIGITS) {
        Keyboard.dismiss();
        setTimeout(() => {
          setPin((prevPin) => {
            const fullPin = prevPin.join("");
            if (fullPin.length === DIGITS) {
              handlePinSubmit(fullPin);
            }
            return prevPin;
          });
        }, 100);
      }
      return;
    }

    if (text.match(/^[0-9]$/)) {
      setPin((prevPin) => {
        const newPin = [...prevPin];
        newPin[index] = text;
        return newPin;
      });

      if (text !== "") {
        focusNextInput(index);
      }

      setPin((prevPin) => {
        if (prevPin.every((digit) => digit !== "")) {
          setTimeout(() => handlePinSubmit(prevPin.join("")), 100);
        }
        return prevPin;
      });
    }
  }, [focusNextInput]);

  const handleKeyPress = useCallback((e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      setPin((prevPin) => {
        const newPin = [...prevPin];
        if (newPin[index] === "") {
          if (index > 0) {
            newPin[index - 1] = "";
            focusPreviousInput(index);
          }
        } else {
          newPin[index] = "";
        }
        return newPin;
      });
    }
  }, [focusPreviousInput]);

  // Call wallet pay API after PIN verification
  const processWalletPayment = async () => {
    try {
      const access_token = await AsyncStorage.getItem('access_token');
      if (!access_token) {
        Alert.alert("Error", "Authentication token missing. Please login again.");
        return;
      }

      // Get integrity token with error handling
      let token = "";
      let nonce = "";

      {
        try {
          const integrityResult = await getIntegrityToken();
          token = integrityResult.token;
          nonce = integrityResult.nonce;
        } catch (integrityError) {
          console.error("Integrity Token Error:", integrityError);

          // There is deliberately NO "proceed anyway" option here. This screen
          // used to offer one on network errors, which shipped a user-tappable
          // bypass of a payment security control in production builds. A failed
          // integrity check must end the payment, not become a choice.
          const isNetwork =
            integrityError?.message?.includes("NETWORK_ERROR") ||
            integrityError?.message?.includes("Network error") ||
            integrityError?.message?.includes("-3");

          if (isNetwork) {
            Alert.alert(
              "Network Error",
              "Unable to verify device security. Please check your internet connection and try again.",
              [
                { text: "Retry", onPress: () => processWalletPayment() },
                { text: "Cancel", style: "cancel" },
              ]
            );
          } else {
            Alert.alert(
              "Verification Failed",
              "Unable to verify device security. Please try again later."
            );
          }
          setPin(Array(DIGITS).fill(""));
          setFocusedInput(0);
          inputRefs.current[0]?.focus();
          setLoading(false);
          return;
        }
      }

      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
        ...(token && { 'x-integrity-token': token }),
        ...(nonce && { 'x-integrity-nonce': nonce }),
      };

     
      console.log("Wallet Pay Payload:", payload);

      const response = await axios.post(
        'https://newapi.odhpay.com/api/v1/wallet/pay',
        payload,
        { headers }
      );

      console.log("Wallet Pay Response:", response?.data);

      if (response?.data?.success) {
        // Navigate to transaction success screen IMMEDIATELY. The wallet is
        // debited (status "paid") but the bill is still being dispatched to the
        // biller in a backend background task. The success screen subscribes to
        // live status (WebSocket push + poll fallback) and auto-updates from
        // "processing" → "completed"/"failed". We pass the access_token + the
        // service reference_id so it can watch without an extra round-trip.
        navigation.replace("TransactionSuccess", {
          payment_id: response?.data?.payment_id,
          reference_id: response?.data?.reference_id,
          amount: response?.data?.amount,
          balance_before: response?.data?.balance_before,
          balance_after: response?.data?.balance_after,
          biller_name: payload?.biller_name || payload?.bbps_data?.biller_name || "N/A",
          service_type: payload?.service_type || "Payment",
          category: payload?.category || payload?.bbps_data?.category || "",
          status: response?.data?.status,
          service_request_id: response?.data?.service_request_id,
          payment_method: "wallet",
          access_token,
        });
      } else {
        Alert.alert("Payment Failed", response?.data?.message || "Unable to process payment.");
        setPin(Array(DIGITS).fill(""));
        setFocusedInput(0);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("Wallet Payment Error:", error);
      
      // Parse error message
      let errorMsg = "Something went wrong. Please try again.";
      
      // Check for network/axios errors
      if (error?.message === "Network Error") {
        errorMsg = "Network error. Please check your internet connection.";
      } else if (error?.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          const first = error.response.data.detail[0];
          errorMsg = first?.msg || errorMsg;
        } else {
          errorMsg = error.response.data.detail;
        }
      } else if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      Alert.alert("Payment Failed", errorMsg);
      setPin(Array(DIGITS).fill(""));
      setFocusedInput(0);
      inputRefs.current[0]?.focus();
      setLoading(false);
    }
  };

  const handlePinSubmit = async (pinString) => {
    try {
      console.log("✅ handlePinSubmit called with:", pinString, "Length:", pinString.length);

      setLoading(true);
      setErrorMessage("");

      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("Error", "Authentication token missing. Please login again.");
        setLoading(false);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log("📤 Verifying PIN:", pinString);

      const response = await axios.post(
        "https://newapi.odhpay.com/register/verify_transaction_pin",
        { pincode: pinString },
        { headers }
      );

      console.log("📥 Verify Response:", response.data);

      if (response.data.status) {
        // PIN verified successfully, now process wallet payment
        await processWalletPayment();
      } else {
        setErrorMessage(response.data.message || "Incorrect PIN. Try again.");
        setPin(Array(DIGITS).fill(""));
        setFocusedInput(0);
        inputRefs.current[0]?.focus();
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Verify Error:", error);
      setErrorMessage("Something went wrong during PIN verification.");
      setPin(Array(DIGITS).fill(""));
      setFocusedInput(0);
      inputRefs.current[0]?.focus();
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <Text style={styles.headerSubtitle}>Wallet Payment</Text>
            <Text style={styles.bankName}>Pay ₹{Number(amount).toFixed(2)}</Text>
            <Text style={styles.accountNumber}>
              Wallet Balance: ₹{Number(walletBalance || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.headerIconBg}>
            <Image source={require("../../assets/LogoN.png")} style={styles.upiLogo} />
          </View>
        </View>

        {/* PIN Description */}
        <View style={styles.descriptionBox}>
          <Text style={styles.pinPrompt}>Enter your 6-digit Transaction PIN</Text>
          <Text style={styles.descriptionText}>
            This PIN is required to authorize your wallet payment securely
          </Text>
        </View>

        {/* PIN Input Section */}
        <View style={styles.pinSection}>
          <View style={styles.pinInputContainer}>
            {pin.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.pinInputBox,
                  focusedInput === index && styles.pinInputBoxFocused,
                  errorMessage && styles.pinInputBoxError,
                ]}
              >
                <TextInput
                  ref={(el) => (inputRefs.current[index] = el)}
                  style={styles.pinInput}
                  keyboardType="numeric"
                  maxLength={1}
                  secureTextEntry
                  value={digit}
                  onChangeText={(text) => handlePinChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  onFocus={() => setFocusedInput(index)}
                  caretHidden
                  editable={!loading}
                />
                {digit === "" && <Text style={styles.pinPlaceholder}>●</Text>}
              </View>
            ))}
          </View>
          
          {/* Error Message */}
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </View>

        {/* Payment Info Box */}
        <View style={styles.paymentInfoBox}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Service</Text>
            <Text style={styles.paymentValue}>
              {payload?.service_type || payload?.biller_name || "Payment"}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Amount</Text>
            <Text style={styles.paymentAmount}>₹{Number(amount).toFixed(2)}</Text>
          </View>
        </View>

        {/* Security Alert Box */}
        <View style={styles.securityBox}>
          <View style={styles.securityIconBg}>
            <Text style={styles.securityIcon}>🔒</Text>
          </View>
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Keep Your PIN Secure</Text>
            <Text style={styles.securityText}>
              Never share your Transaction PIN with anyone. We will never ask for it.
            </Text>
          </View>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Theme.colors.primary}/>
              <Text style={styles.loadingText}>
                {pin.every((d) => d !== "") ? "Processing Payment..." : "Verifying PIN..."}
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default WalletTransactionPin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    justifyContent: "space-between",
  },

  /* Header Section */
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 16,
    marginBottom: 32,
  },
  headerContent: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  bankName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#10b981",
    marginTop: 8,
  },
  headerIconBg: {
    width: 70,
    height: 70,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  upiLogo: {
    width: 60,
    height: 50,
    resizeMode: "contain",
  },

  /* Description Box */
  descriptionBox: {
    backgroundColor: "#F5F0FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
  },
  pinPrompt: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.primary,
    marginBottom: 8,
    lineHeight: 20,
  },
  descriptionText: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 18,
    fontWeight: "500",
  },

  /* PIN Section */
  pinSection: {
    alignItems: "center",
    marginVertical: 24,
  },
  pinInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: isSmall ? 8 : 12,
  },
  pinInputBox: {
    width: isSmall ? 42 : 48,
    height: isSmall ? 52 : 60,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    position: "relative",
  },
  pinInputBoxFocused: {
    borderColor: Theme.colors.primary,
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
  },
  pinInputBoxError: {
    borderColor: "#ef4444",
  },
  pinInput: {
    width: "100%",
    height: "100%",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#000000",
    padding: 0,
  },
  pinPlaceholder: {
    position: "absolute",
    fontSize: 18,
    color: "#CCCCCC",
    fontWeight: "600",
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    color: "#ef4444",
    fontWeight: "600",
    textAlign: "center",
  },

  /* Payment Info Box */
  paymentInfoBox: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  paymentValue: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
  },
  paymentAmount: {
    fontSize: 18,
    color: Theme.colors.primary,
    fontWeight: "700",
  },

  /* Security Box */
  securityBox: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
    marginTop: "auto",
    marginBottom: 20,
  },
  securityIconBg: {
    width: 48,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  securityIcon: {
    fontSize: 24,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  securityText: {
    fontSize: 12,
    color: "#666666",
    lineHeight: 16,
    fontWeight: "500",
  },

  /* Loading Overlay */
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingBox: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.primary,
    marginTop: 12,
  },
});
