import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Keyboard,
  Alert,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Theme from "../Theme";
import useUserStore from "../../store/useUserStore";

const DIGITS = 6;
const { width } = Dimensions.get("window");
const isSmall = width < 375;
const isMedium = width >= 375 && width < 768;

const TransactionPin = () => {
  const navigation = useNavigation();
  const fetchUser = useUserStore((s) => s.fetchUser);

  const [pin, setPin] = useState(Array(DIGITS).fill(""));
  const [confirmPin, setConfirmPin] = useState(Array(DIGITS).fill(""));
  const [loading, setLoading] = useState(false);

  const pinRefs = useRef(Array.from({ length: DIGITS }, () => React.createRef()));
  const confirmPinRefs = useRef(Array.from({ length: DIGITS }, () => React.createRef()));

  const isComplete = useMemo(
    () => pin.every(Boolean) && confirmPin.every(Boolean),
    [pin, confirmPin]
  );

  const fillFromString = (s, setter) => {
    const only = s.replace(/\D/g, "").slice(0, DIGITS).split("");
    const arr = Array(DIGITS).fill("");
    for (let i = 0; i < only.length; i++) arr[i] = only[i];
    setter(arr);
    return only.length;
  };

  const focusNext = (refs, index) => {
    if (index < DIGITS - 1) refs.current[index + 1]?.current?.focus();
  };
  const focusPrev = (refs, index) => {
    if (index > 0) refs.current[index - 1]?.current?.focus();
  };

  const handlePinChange = (value, index, isConfirm = false) => {
    const v = value.replace(/[^0-9]/g, "");
    const arr = isConfirm ? [...confirmPin] : [...pin];

    if (v.length > 1) {
      const wrote = fillFromString(v, isConfirm ? setConfirmPin : setPin);
      const refs = isConfirm ? confirmPinRefs : pinRefs;
      const nextIndex = Math.min(wrote - 1, DIGITS - 1);
      refs.current[nextIndex]?.current?.focus();
      return;
    }

    arr[index] = v.slice(0, 1);
    (isConfirm ? setConfirmPin : setPin)(arr);
    if (v) focusNext(isConfirm ? confirmPinRefs : pinRefs, index);
  };

  const handleKeyPress = (e, index, isConfirm = false) => {
    if (e.nativeEvent.key !== "Backspace") return;
    const arr = isConfirm ? confirmPin : pin;
    if (!arr[index]) {
      focusPrev(isConfirm ? confirmPinRefs : pinRefs, index);
    }
  };

  const handleSet = async () => {
    const pinString = pin.join("");
    const confirmPinString = confirmPin.join("");

    if (!/^\d{6}$/.test(pinString)) {
      Alert.alert("Invalid PIN", "Transaction PIN must be exactly 6 digits.");
      return;
    }
    if (pinString !== confirmPinString) {
      Alert.alert("Mismatch", "Transaction PINs do not match.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("Auth error", "Please log in again.");
        return;
      }

      setLoading(true);
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const resp = await axios.post(
        "https://newapi.odhpay.com/register/create_transaction_pin",
        { enter_pin: pinString },
        { headers }
      );

      console.log(resp?.data)

      if (resp?.data?.status) {
        await fetchUser({ force: true });
        Alert.alert("Success", resp?.data?.message);
        navigation.reset({
          index: 0,
          routes: [{ name: "CheckWalletBalance" }],
        });
      }
    } catch (err) {
      console.log("PIN set error:", err?.response?.data || err?.message);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderPinInputs = (values, refs, isConfirm = false) => (
    <View style={styles.pinContainer}>
      {values.map((digit, index) => (
        <TextInput
          key={index}
          ref={refs.current[index]}
          style={[styles.pinInput, digit && styles.pinInputFilled]}
          value={digit}
          onChangeText={(v) => handlePinChange(v, index, isConfirm)}
          onKeyPress={(e) => handleKeyPress(e, index, isConfirm)}
          keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
          maxLength={1}
          secureTextEntry
          textContentType="oneTimeCode"
          selectTextOnFocus
          placeholderTextColor="#D1D5DB"
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="lock" size={isSmall ? 28 : 32} color={Theme.colors.surface} />
            </View>
            <Text style={styles.title}>Create Transaction PIN</Text>
            <Text style={styles.subtitle}>Set a 6-digit PIN for secure transactions</Text>
          </View>

          {/* PIN Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Enter PIN</Text>
            {renderPinInputs(pin, pinRefs)}

            <Text style={styles.label}>Confirm PIN</Text>
            {renderPinInputs(confirmPin, confirmPinRefs, true)}
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, !isComplete && styles.buttonDisabled]}
            onPress={handleSet}
            disabled={!isComplete || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? "Please wait..." : "Set PIN"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TransactionPin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: isSmall ? 20 : isMedium ? 24 : 28,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    paddingTop: isSmall ? 32 : isMedium ? 40 : 48,
    paddingBottom: isSmall ? 36 : isMedium ? 44 : 52,
  },
  iconCircle: {
    width: isSmall ? 70 : isMedium ? 80 : 90,
    height: isSmall ? 70 : isMedium ? 80 : 90,
    borderRadius: isSmall ? 35 : isMedium ? 40 : 45,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: isSmall ? 20 : isMedium ? 24 : 28,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: isSmall ? 26 : isMedium ? 30 : 34,
    fontWeight: "800",
    color: Theme.colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: isSmall ? 14 : isMedium ? 15 : 16,
    color: Theme.colors.textSecondary,
    letterSpacing: 0.2,
    fontWeight: "500",
    textAlign: "center",
  },
  section: {
    marginBottom: isSmall ? 28 : isMedium ? 36 : 44,
  },
  label: {
    fontSize: isSmall ? 14 : isMedium ? 15 : 16,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: isSmall ? 16 : isMedium ? 18 : 20,
    letterSpacing: 0.3,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: isSmall ? 24 : isMedium ? 28 : 32,
    gap: isSmall ? 10 : isMedium ? 12 : 14,
  },
  pinInput: {
    width: isSmall ? 48 : isMedium ? 54 : 60,
    height: isSmall ? 56 : isMedium ? 62 : 68,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: isSmall ? 14 : isMedium ? 16 : 18,
    fontSize: isSmall ? 24 : isMedium ? 26 : 28,
    fontWeight: "700",
    textAlign: "center",
    backgroundColor: Theme.colors.surface,
    color: Theme.colors.text,
  },
  pinInputFilled: {
    borderColor: Theme.colors.primary,
    borderWidth: 2.5,
    backgroundColor: Theme.colors.surface,
  },
  button: {
    height: isSmall ? 56 : isMedium ? 60 : 64,
    borderRadius: isSmall ? 16 : isMedium ? 18 : 20,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: isSmall ? 12 : isMedium ? 16 : 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.5,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonText: {
    color: Theme.colors.surface,
    fontSize: isSmall ? 17 : isMedium ? 18 : 19,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
