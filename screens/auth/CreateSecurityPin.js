import React, { useState, useRef, useEffect, createRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Switch,
  TextInput,
  Keyboard,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import useUserStore from '../../store/useUserStore';
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const PIN_LEN = 6;

const CreateSecurityPin = () => {
  const navigation = useNavigation();
  const userdata = useUserStore(s => s.user);

  const [pin, setPin] = useState(Array(PIN_LEN).fill(""));
  const [confirmPin, setConfirmPin] = useState(Array(PIN_LEN).fill(""));
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // ✅ DO NOT call hooks in a loop; build plain refs once:
  const pinRefs = useRef(Array(PIN_LEN).fill(null).map(() => createRef()));
  const confirmPinRefs = useRef(Array(PIN_LEN).fill(null).map(() => createRef()));

  const blob1Anim = useRef(new Animated.Value(0)).current;
  const blob2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blob1Anim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(blob1Anim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blob2Anim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(blob2Anim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handlePinChange = (value, index, isConfirmPin = false) => {
    const onlyDigit = value.replace(/[^0-9]/g, "").slice(0, 1);

    const next = (isConfirmPin ? [...confirmPin] : [...pin]);
    next[index] = onlyDigit;
    isConfirmPin ? setConfirmPin(next) : setPin(next);

    // Move forward when a digit is entered
    if (onlyDigit && index < PIN_LEN - 1) {
      const nextRef = isConfirmPin
        ? confirmPinRefs.current[index + 1]
        : pinRefs.current[index + 1];
      nextRef.current?.focus();
    }
  };

  const handleKeyPress = (e, index, isConfirmPin = false) => {
    const list = isConfirmPin ? confirmPin : pin;

    // On backspace in an empty box, move back
    if (e.nativeEvent.key === "Backspace" && !list[index] && index > 0) {
      const prevRef = isConfirmPin
        ? confirmPinRefs.current[index - 1]
        : pinRefs.current[index - 1];
      prevRef.current?.focus();
    }
  };

  const allFilled = (arr) => arr.every((d) => d !== "");
  const canSubmit = allFilled(pin) && allFilled(confirmPin) && !loading;

  const handleSet = async () => {
    const pinString = pin.join("");
    const confirmPinString = confirmPin.join("");

    if (pinString.length !== PIN_LEN || confirmPinString.length !== PIN_LEN) {
      Alert.alert("Incomplete PIN", `Please enter all ${PIN_LEN} digits in both fields.`);
      return;
    }

    if (pinString !== confirmPinString) {
      Alert.alert("PIN mismatch", "PINs do not match. Please try again.");
      setPin(Array(PIN_LEN).fill(""));
      setConfirmPin(Array(PIN_LEN).fill(""));
      pinRefs.current[0].current?.focus();
      return;
    }

    const token = await AsyncStorage.getItem("access_token");
    if (!token) {
      Alert.alert("Auth error", "Please log in again.");
      return;
    }

    try {
      setLoading(true);

      // ✅ keep it as string to preserve leading zeros
      const response = await axios.post(
        "https://newapi.odhpay.com/register/create_pin",
        { enter_pin: pinString },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(response.data)

      if (response?.data?.status === 1 || response?.data?.status === true) {
        Alert.alert("Success", "PIN set successfully!");
        if (response?.data?.isReferrer) {
          navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
        }else{
          navigation.reset({ index: 0, routes: [{ name: "ReferralCode" }] });
        }
      } else {
        Alert.alert("Failed", response?.data?.message || "Failed to set PIN");
      }
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.message || "Something went wrong.";
      console.log("create_pin error:", error);
      Alert.alert("Error", String(msg));
    } finally {
      setLoading(false);
    }
  };

  const renderPinInputs = (values, refs, isConfirmPin = false) => {
    return (
      <View style={styles.pinContainer}>
        {values.map((digit, index) => (
          <TextInput
            key={index}
            ref={refs[index]}
            style={styles.pinInput}
            value={digit}
            onChangeText={(v) => handlePinChange(v, index, isConfirmPin)}
            onKeyPress={(e) => handleKeyPress(e, index, isConfirmPin)}
            keyboardType="number-pad"
            maxLength={1}
            secureTextEntry
            selectTextOnFocus
            returnKeyType="done"
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* Background blobs */}
      <View style={styles.backgroundDecor}>
        <Animated.View
          style={[
            styles.blob,
            styles.blob1,
            {
              opacity: blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.25] }),
              transform: [
                { scale: blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
                { rotate: blob1Anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.blob,
            styles.blob2,
            {
              opacity: blob2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.25] }),
              transform: [
                { scale: blob2Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
                { rotate: blob2Anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-30deg"] }) },
              ],
            },
          ]}
        />
      </View>

      {/* Purple header */}
      <View style={styles.purpleSection}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} />
          <View style={styles.headerTitleContainer} />
          <View style={styles.placeholder} />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>Set Security for ODH account</Text>
          <Text style={styles.subtitle}>
            Create a secure {PIN_LEN}-digit PIN to protect your transactions
          </Text>
        </View>
      </View>

      {/* White card */}
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.pinSection}>
            <Text style={styles.inputLabel}>Enter a {PIN_LEN}-digit mPIN</Text>
            {renderPinInputs(pin, pinRefs.current)}

            <Text style={styles.inputLabel}>Re-enter mPIN</Text>
            {renderPinInputs(confirmPin, confirmPinRefs.current, true)}
          </View>



          <TouchableOpacity
            style={[styles.setButton, canSubmit ? styles.setButtonActive : styles.setButtonInactive]}
            onPress={handleSet}
            disabled={!canSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.setButtonText}>{loading ? "Setting..." : "Set Security Pin"}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Your PIN will be used to authorize all transactions</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CreateSecurityPin;

/* ---- styles unchanged except copy from your file ---- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  backgroundDecor: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blob: { position: "absolute", borderRadius: 9999, opacity: 0.15 },
  blob1: { width: width * 0.8, height: width * 0.8, backgroundColor: "#fff", top: -width * 0.4, right: -width * 0.3 },
  blob2: { width: width * 0.6, height: width * 0.6, backgroundColor: "#fff", bottom: -width * 0.2, left: -width * 0.25 },
  purpleSection: { height: height * 0.3, paddingTop: Platform.OS === "ios" ? 50 : 40, paddingBottom: 20 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 20 },
  backButton: { padding: 8 },
  headerTitleContainer: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  placeholder: { width: 40 },
  titleSection: { paddingHorizontal: 24, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 8, textAlign: "center", letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: "rgba(255, 255, 255, 0.9)", textAlign: "center", lineHeight: 20 },
  card: { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 32, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  cardContent: { flex: 1, justifyContent: "space-between" },
  pinSection: { marginTop: 10 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12, letterSpacing: 0.3 },
  pinContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, paddingHorizontal: 8 },
  pinInput: { width: 48, height: 48, borderWidth: 2, borderColor: "#000000", borderRadius: 12, fontSize: 20, textAlign: "center", backgroundColor: "#fff", fontWeight: "600" },
  setButton: { height: 54, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 16, shadowColor: "#000000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  setButtonActive: { backgroundColor: "#000000" },
  setButtonInactive: { backgroundColor: "#D1D5DB", shadowOpacity: 0, elevation: 0 },
  setButtonText: { color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  footer: { paddingBottom: 20, alignItems: "center" },
  footerText: { fontSize: 12, color: "#6B7280", textAlign: "center" },
});
