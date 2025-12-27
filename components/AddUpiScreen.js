import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Theme from "./Theme";

const { width, height } = Dimensions.get("window");
const scale = width / 375;
const normalize = (size) => Math.round(size * Math.min(scale, 1.3));
const wp = (percentage) => (width * percentage) / 100;
const hp = (percentage) => (height * percentage) / 100;

// Dummy UPI validation data
const DUMMY_UPI_DATA = {
  "rahul@okaxis": { name: "Rahul Sharma", bank: "Axis Bank" },
  "priya@ybl": { name: "Priya Patel", bank: "Yes Bank" },
  "amit@oksbi": { name: "Amit Kumar", bank: "State Bank of India" },
  "sneha@paytm": { name: "Sneha Gupta", bank: "Paytm Payments Bank" },
  "test@upi": { name: "Test User", bank: "HDFC Bank" },
};

const AddUpiScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const existingUpi = route.params?.upiData;

  const [upiId, setUpiId] = useState(existingUpi?.upi || "");
  const [isValidating, setIsValidating] = useState(false);
  const [isValidUpi, setIsValidUpi] = useState(false);
  const [nickname, setNickname] = useState(existingUpi?.name || "");
  const [registeredName, setRegisteredName] = useState("");
  const [bankName, setBankName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (existingUpi) {
      setIsValidUpi(true);
      setRegisteredName(existingUpi.name);
    }
  }, [existingUpi]);

  const validateUpiFormat = (upi) => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    return upiRegex.test(upi);
  };

  const handleValidateUpi = () => {
    setError("");
    
    if (!upiId.trim()) {
      setError("Please enter a UPI ID");
      return;
    }

    if (!validateUpiFormat(upiId)) {
      setError("Invalid UPI ID format. Example: name@upi");
      return;
    }

    setIsValidating(true);

    // Simulate API call with dummy data
    setTimeout(() => {
      const lowerUpi = upiId.toLowerCase();
      const userData = DUMMY_UPI_DATA[lowerUpi];
      
      if (userData) {
        setIsValidUpi(true);
        setRegisteredName(userData.name);
        setBankName(userData.bank);
        setNickname(userData.name);
      } else {
        // Accept any valid format UPI as valid for demo
        setIsValidUpi(true);
        setRegisteredName("Verified User");
        setBankName("UPI Bank");
        setNickname("");
      }
      setIsValidating(false);
    }, 1000);
  };

  const handleSave = () => {
    if (!isValidUpi) {
      Alert.alert("Error", "Please verify the UPI ID first");
      return;
    }

    Alert.alert(
      "Success",
      `UPI ID ${upiId} has been saved successfully!`,
      [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleReset = () => {
    setUpiId("");
    setIsValidUpi(false);
    setRegisteredName("");
    setBankName("");
    setNickname("");
    setError("");
  };

  return (
    <View style={styles.container} >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
         

          {/* Info Card */}
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={normalize(20)} color={Theme.colors.primary} />
            <Text style={styles.infoText}>
              Enter the UPI ID of your contact. We'll verify and fetch the registered name.
            </Text>
          </View>

          {/* UPI Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>UPI ID</Text>
            <View style={[
              styles.inputContainer,
              isValidUpi && styles.inputValid,
              error && styles.inputError
            ]}>
              <MaterialIcons
                name="alternate-email"
                size={normalize(20)}
                color={isValidUpi ? Theme.colors.success : Theme.colors.textSecondary}
              />
              <TextInput
                style={styles.input}
                value={upiId}
                onChangeText={(text) => {
                  setUpiId(text);
                  setError("");
                  if (isValidUpi) {
                    setIsValidUpi(false);
                    setRegisteredName("");
                  }
                }}
                placeholder="example@upi"
                placeholderTextColor={Theme.colors.textLight}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isValidUpi}
              />
              {isValidUpi && (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="check-circle" size={normalize(20)} color={Theme.colors.success} />
                </View>
              )}
            </View>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </View>

          {/* Verify Button */}
          {!isValidUpi && (
            <TouchableOpacity
              style={[styles.verifyButton, isValidating && styles.buttonDisabled]}
              onPress={handleValidateUpi}
              disabled={isValidating}
              activeOpacity={0.8}
            >
              {isValidating ? (
                <Text style={styles.verifyButtonText}>Verifying...</Text>
              ) : (
                <>
                  <MaterialIcons name="verified-user" size={normalize(20)} color={Theme.colors.secondary} />
                  <Text style={styles.verifyButtonText}>Verify UPI ID</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Verified Details */}
          {isValidUpi && (
            <View style={styles.verifiedSection}>
              <View style={styles.verifiedCard}>
                <View style={styles.verifiedHeader}>
                  <MaterialIcons name="check-circle" size={normalize(24)} color={Theme.colors.success} />
                  <Text style={styles.verifiedTitle}>UPI Verified</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Registered Name</Text>
                  <Text style={styles.detailValue}>{registeredName}</Text>
                </View>

                {bankName ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank</Text>
                    <Text style={styles.detailValue}>{bankName}</Text>
                  </View>
                ) : null}

                <View style={styles.nicknameSection}>
                  <Text style={styles.label}>Nickname (Optional)</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="person" size={normalize(20)} color={Theme.colors.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter a nickname"
                      placeholderTextColor={Theme.colors.textLight}
                      value={nickname}
                      onChangeText={setNickname}
                    />
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="refresh" size={normalize(20)} color={Theme.colors.primary} />
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="check" size={normalize(20)} color={Theme.colors.secondary} />
                  <Text style={styles.saveButtonText}>Save UPI</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },

  // Header
  headerSection: {
    alignItems: "center",
    paddingTop: hp(3),
    paddingBottom: hp(2),
  },
  iconBox: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(20),
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: normalize(16),
    ...Theme.shadows.md,
  },
  headerTitle: {
    fontSize: normalize(24),
    fontWeight: "800",
    color: Theme.colors.text,
    marginBottom: normalize(8),
  },
  headerSubtitle: {
    fontSize: normalize(14),
    color: Theme.colors.textSecondary,
    textAlign: "center",
  },

  // Info Card
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Theme.colors.inputBg,
    padding: normalize(16),
    borderRadius: normalize(12),
    marginBottom: hp(3),
    gap: normalize(12),
    marginTop:10
  },
  infoText: {
    flex: 1,
    fontSize: normalize(13),
    color: Theme.colors.textSecondary,
    lineHeight: normalize(20),
  },

  // Input Section
  inputSection: {
    marginBottom: hp(2),
  },
  label: {
    fontSize: normalize(14),
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: normalize(8),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.secondary,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    paddingVertical: Platform.OS === "ios" ? normalize(14) : normalize(10),
    gap: normalize(12),
  },
  inputValid: {
    borderColor: Theme.colors.success,
    backgroundColor: `${Theme.colors.success}08`,
  },
  inputError: {
    borderColor: Theme.colors.danger,
  },
  input: {
    flex: 1,
    fontSize: normalize(16),
    color: Theme.colors.text,
    paddingVertical: 0,
  },
  verifiedBadge: {
    marginLeft: normalize(8),
  },
  errorText: {
    fontSize: normalize(12),
    color: Theme.colors.danger,
    marginTop: normalize(8),
    marginLeft: normalize(4),
  },

  // Verify Button
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary,
    paddingVertical: normalize(16),
    borderRadius: normalize(12),
    gap: normalize(8),
    ...Theme.shadows.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: Theme.colors.secondary,
  },

  // Verified Section
  verifiedSection: {
    marginTop: hp(1),
  },
  verifiedCard: {
    backgroundColor: Theme.colors.secondary,
    borderRadius: normalize(16),
    padding: normalize(20),
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  verifiedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(10),
    marginBottom: normalize(20),
    paddingBottom: normalize(16),
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  verifiedTitle: {
    fontSize: normalize(18),
    fontWeight: "700",
    color: Theme.colors.success,
  },
  detailRow: {
    marginBottom: normalize(16),
  },
  detailLabel: {
    fontSize: normalize(12),
    color: Theme.colors.textSecondary,
    marginBottom: normalize(4),
  },
  detailValue: {
    fontSize: normalize(16),
    fontWeight: "600",
    color: Theme.colors.text,
  },
  nicknameSection: {
    marginTop: normalize(8),
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    gap: normalize(12),
    marginTop: hp(3),
  },
  resetButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.secondary,
    paddingVertical: normalize(16),
    borderRadius: normalize(12),
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    gap: normalize(8),
  },
  resetButtonText: {
    fontSize: normalize(16),
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary,
    paddingVertical: normalize(16),
    borderRadius: normalize(12),
    gap: normalize(8),
    ...Theme.shadows.md,
  },
  saveButtonText: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: Theme.colors.secondary,
  },
});

export default AddUpiScreen;