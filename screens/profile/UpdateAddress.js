import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRegisterStore } from "../../store";
import useUserStore from "../../store/useUserStore";
import Theme from "../../components/Theme";

const DUMMY_PHONE = "7048986551";

const UpdateAddress = ({ navigation, route }) => {
  const addressType = route?.params?.addressType || "communication"; // "communication" or "permanent"
  const currentAddress = route?.params?.currentAddress || "";

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState("");

  const { sendProfileUpdateOtp, loading, resetOtpState } = useRegisterStore();
  const user = useUserStore((s) => s.user);
  const phone = user?.user?.mobile || user?.mobile || DUMMY_PHONE;

  const validateFields = () => {
    if (!addressLine1.trim()) {
      Alert.alert("Error", "Please enter address line 1.");
      return false;
    }
    if (!city.trim()) {
      Alert.alert("Error", "Please enter city.");
      return false;
    }
    if (!state.trim()) {
      Alert.alert("Error", "Please enter state.");
      return false;
    }
    if (!pincode.trim() || pincode.length !== 6) {
      Alert.alert("Error", "Please enter valid 6-digit pincode.");
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!validateFields()) return;

    if (!phone) {
      Alert.alert("Error", "Phone number not found. Please try again.");
      return;
    }

    const fullAddress = [
      addressLine1.trim(),
      addressLine2.trim(),
      landmark.trim(),
      city.trim(),
      state.trim(),
      pincode.trim(),
    ]
      .filter(Boolean)
      .join(", ");

    const updateData =
      addressType === "permanent"
        ? { permanent_address: fullAddress }
        : { communication_address: fullAddress };

    try {
      resetOtpState();
      await sendProfileUpdateOtp(phone);
      navigation.navigate("ProfileOtpVerification", {
        updateType: addressType === "permanent" ? "permanent_address" : "communication_address",
        updateData: updateData,
        phone: phone,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Update {addressType === "permanent" ? "Permanent" : "Communication"} Address
        </Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            Enter your {addressType === "permanent" ? "permanent" : "communication"} address details
          </Text>

          {/* Address Line 1 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Address Line 1 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="House/Flat No., Building Name"
              value={addressLine1}
              onChangeText={setAddressLine1}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Address Line 2 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address Line 2</Text>
            <TextInput
              style={styles.input}
              placeholder="Street, Area, Colony"
              value={addressLine2}
              onChangeText={setAddressLine2}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Landmark */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Landmark</Text>
            <TextInput
              style={styles.input}
              placeholder="Near Hospital, School, etc."
              value={landmark}
              onChangeText={setLandmark}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* City & State Row */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>
                City <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={city}
                onChangeText={setCity}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>
                State <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                value={state}
                onChangeText={setState}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Pincode */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Pincode <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit Pincode"
              value={pincode}
              onChangeText={(text) => setPincode(text.replace(/[^0-9]/g, "").slice(0, 6))}
              keyboardType="numeric"
              maxLength={6}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!addressLine1 || !city || !state || pincode.length !== 6) &&
                styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={loading || !addressLine1 || !city || !state || pincode.length !== 6}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1a1a1a",
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  continueButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UpdateAddress;
