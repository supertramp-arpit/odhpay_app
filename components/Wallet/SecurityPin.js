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

const DIGITS = 6;
const { width } = Dimensions.get("window");
const isSmall = width < 375;

const SecurityPin = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { screenName, title } = route.params || {};
  const targetScreen = typeof screenName === "string" ? screenName : null;

  const [pin, setPin] = useState(Array(DIGITS).fill(""));
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(0);

  const user = useUserStore((s) => s.user);
  const payload = user?.user ? user.user : user;

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

  const fetchCoinBalance = async (pinString) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");

      if (!token) {
        Alert.alert("Error", "Authentication token missing. Please login again.");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log("📤 Fetching balance with PIN:", pinString);

      const response = await axios.post(
        "https://newapi.odhpay.com/transaction/gettotalcoins",
        { userpin: pinString },
        { headers }
      );

      console.log("📥 Balance Response:", response.data);

      if (response.data.status === "success") {
        if (!targetScreen) {
          Alert.alert("Navigation error", "Destination screen is missing.");
          return;
        }

        navigation.navigate({
          name: targetScreen,
          params: { amount: response.data.final_amount },
        });
      } else {
        Alert.alert("Error", response.data.message || "Failed to fetch balance.");
      }
    } catch (error) {
      console.error("❌ Balance Fetch Error:", error);
      Alert.alert("Error", "Something went wrong while fetching balance.");
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (pinString) => {
    try {
      console.log("✅ handlePinSubmit called with:", pinString, "Length:", pinString.length);

      setLoading(true);

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
        await fetchCoinBalance(pinString);
      } else {
        Alert.alert("Error", response.data.message || "Incorrect PIN. Try again.");
        setPin(Array(DIGITS).fill(""));
        setFocusedInput(0);
        inputRefs.current[0]?.focus();
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Verify Error:", error);
      Alert.alert("Error", "Something went wrong during PIN verification.");
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <Text style={styles.headerSubtitle}>Verify Your PIN</Text>
            <Text style={styles.bankName}>{title}</Text>
            <Text style={styles.accountNumber}>●●●●● {payload?.MobileNumber?.slice(-4)}</Text>
          </View>
          <View style={styles.headerIconBg}>
            <Image source={require("../../assets/LogoN.png")} style={styles.upiLogo} />
          </View>
        </View>

        {/* PIN Description */}
        <View style={styles.descriptionBox}>
          <Text style={styles.pinPrompt}>Enter your 6-digit Transaction PIN</Text>
          <Text style={styles.descriptionText}>This PIN is required to authorize your transaction securely</Text>
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
                />
                {digit === "" && <Text style={styles.pinPlaceholder}>●</Text>}
              </View>
            ))}
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
              <ActivityIndicator size="large" color="#000000" />
              <Text style={styles.loadingText}>Verifying PIN...</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SecurityPin;

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
    color: "#888888",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  bankName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
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
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#000000",
  },
  pinPrompt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
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
    borderColor: "#000000",
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
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
    color: "#000000",
    marginTop: 12,
  },
});
