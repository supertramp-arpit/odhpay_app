import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Keyboard,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRegisterStore } from "../../store";
import { useNavigation } from "@react-navigation/native";
import Theme from "../Theme";

const SetTransactionPin = () => {
  const navigation = useNavigation();
  const userdata = useRegisterStore((state) => state.user);

  useEffect(() => {
    console.log("Stored Transaction PIN:", userdata?.user?.TransactionPIN);
  }, [userdata]);

  // ✅ Now 6-digit arrays
  const [oldPin, setOldPin] = useState(["", "", "", "", "", ""]);
  const [newPin, setNewPin] = useState(["", "", "", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    oldPin: "",
    newPin: "",
    confirmPin: "",
  });

  // Refs for inputs
  const oldPinRefs = useRef([...Array(6)].map(() => useRef()));
  const newPinRefs = useRef([...Array(6)].map(() => useRef()));
  const confirmPinRefs = useRef([...Array(6)].map(() => useRef()));

  // Handle PIN input
  const handlePinChange = (value, index, type) => {
    const newValue = value.replace(/[^0-9]/g, "").slice(0, 1);
    const pins =
      type === "old"
        ? [...oldPin]
        : type === "new"
        ? [...newPin]
        : [...confirmPin];
    pins[index] = newValue;

    if (type === "old") setOldPin(pins);
    if (type === "new") setNewPin(pins);
    if (type === "confirm") setConfirmPin(pins);

    // Move to next input (✅ now index < 5)
    if (newValue && index < 5) {
      const nextRef =
        type === "old"
          ? oldPinRefs.current[index + 1]
          : type === "new"
          ? newPinRefs.current[index + 1]
          : confirmPinRefs.current[index + 1];
      nextRef.current?.focus();
    }
  };

  const handleKeyPress = (e, index, type) => {
    if (e.nativeEvent.key === "Backspace" && index > 0) {
      const pins =
        type === "old"
          ? oldPin
          : type === "new"
          ? newPin
          : confirmPin;

      if (!pins[index]) {
        const prevRef =
          type === "old"
            ? oldPinRefs.current[index - 1]
            : type === "new"
            ? newPinRefs.current[index - 1]
            : confirmPinRefs.current[index - 1];
        prevRef.current?.focus();
      }
    }
  };

  // ✅ Validation for 6 digits
  const validatePins = async () => {
    setErrors({ oldPin: "", newPin: "", confirmPin: "" });

    const oldPinString = oldPin.join("");
    const newPinString = newPin.join("");
    const confirmPinString = confirmPin.join("");

    console.log(oldPinString,newPinString,confirmPinString)

    if (oldPinString.length !== 6) {
      setErrors((prev) => ({ ...prev, oldPin: "Enter your current 6-digit PIN" }));
      return false;
    }

    if (newPinString.length !== 6) {
      setErrors((prev) => ({ ...prev, newPin: "Enter a 6-digit new PIN" }));
      return false;
    }

    if (confirmPinString !== newPinString) {
      setErrors((prev) => ({ ...prev, confirmPin: "PINs do not match" }));
      return false;
    }
    return true;
  };

  const handleSet = async () => {
    if (!(await validatePins())) return;

    setLoading(true);
    const token = await AsyncStorage.getItem("access_token");
    if (!token) {
      alert("Authentication error. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const data = { oldPin: oldPin.join(""), newPin: newPin.join("") };

      const response = await axios.post(
        "https://newapi.odhpay.com/register/update_transaction_pin",
        data,
        { headers }
      );

      console.log(response.data)

      if (response.data.status) {
        alert("Transaction PIN updated successfully!");
        navigation.navigate("HomeScreen");
      } else {
        alert(response.data.message || "Failed to update Transaction PIN");
      }
    } catch (error) {
      console.error("Error updating PIN:", error.response?.data || error.message);
      Alert.alert("Error", "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const renderPinInputs = (values, refs, type, error) => (
    <View>
      <View style={styles.pinContainer}>
        {values.map((digit, index) => (
          <TextInput
            key={index}
            ref={refs.current[index]}
            style={[styles.pinInput, error ? styles.pinInputError : null]}
            value={digit}
            onChangeText={(value) => handlePinChange(value, index, type)}
            onKeyPress={(e) => handleKeyPress(e, index, type)}
            keyboardType="numeric"
            maxLength={1}
            secureTextEntry
            selectTextOnFocus
          />
        ))}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content} onTouchStart={Keyboard.dismiss}>
        <Text style={styles.title}>Update Transaction PIN</Text>

        <Text style={styles.subtitle}>Enter Old Transaction PIN</Text>
        {renderPinInputs(oldPin, oldPinRefs, "old", errors.oldPin)}

        <Text style={styles.subtitle}>Enter New Transaction PIN</Text>
        {renderPinInputs(newPin, newPinRefs, "new", errors.newPin)}

        <Text style={styles.subtitle}>Confirm New Transaction PIN</Text>
        {renderPinInputs(confirmPin, confirmPinRefs, "confirm", errors.confirmPin)}

        <TouchableOpacity
          style={[
            styles.setButton,
            loading ? styles.setButtonInactive : styles.setButtonActive,
          ]}
          onPress={handleSet}
          disabled={loading}
        >
          <Text style={styles.setButtonText}>
            {loading ? "Updating..." : "Update"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SetTransactionPin;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 32 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 8 },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pinInput: {
    width: 48,
    height: 55,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    borderRadius: 10,
    fontSize: 22,
    textAlign: "center",
  },
  pinInputError: { borderColor: "red" },
  errorText: { color: "red", fontSize: 14, marginBottom: 10 },
  setButton: {
    marginTop: 20,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  setButtonActive: { backgroundColor: Theme.colors.primary },
  setButtonInactive: { backgroundColor: "gray" },
  setButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
