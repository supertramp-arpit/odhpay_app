import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Theme from "../../components/Theme";
import { useNavigation } from "@react-navigation/native";

const UpdateNumber = () => {
  const [phone, setPhone] = useState("");
  const [confirmPhone, setConfirmPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigation = useNavigation();

  const normalize = (value) => value.replace(/\D/g, "").slice(0, 10);
  const isValid = (value) => /^[6-9]\d{9}$/.test(value);

  const handleSubmit = () => {
    const primary = normalize(phone);
    const confirm = normalize(confirmPhone);

    if (!primary || !confirm) {
      Alert.alert("Missing info", "Please enter and confirm your phone number.");
      return;
    }

    if (primary !== confirm) {
      Alert.alert("Mismatch", "Phone numbers do not match.");
      return;
    }

    if (!isValid(primary)) {
      Alert.alert("Invalid number", "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    setSubmitting(true);


    navigation.navigate("OtpVerify", {
      phoneNumber: `+91${primary}`,
    });
  };

  const disableSubmit =
    submitting ||
    !normalize(phone) ||
    !normalize(confirmPhone) ||
    normalize(phone) !== normalize(confirmPhone);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Update phone number</Text>
          <Text style={styles.subtitle}>
            Keep your account secure and reachable by keeping your mobile number up to date.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>New mobile number</Text>
          <TextInput
            value={phone}
            onChangeText={(text) => setPhone(normalize(text))}
            keyboardType="phone-pad"
            placeholder="10-digit number"
            placeholderTextColor={Theme.colors.textLight}
            style={styles.input}
            maxLength={10}
          />

          <Text style={styles.label}>Confirm mobile number</Text>
          <TextInput
            value={confirmPhone}
            onChangeText={(text) => setConfirmPhone(normalize(text))}
            keyboardType="phone-pad"
            placeholder="Re-enter number"
            placeholderTextColor={Theme.colors.textLight}
            style={styles.input}
            maxLength={10}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={disableSubmit}
            activeOpacity={0.9}
            style={[styles.button, disableSubmit && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>{submitting ? "Updating..." : "Save number"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.helpText}>
          Need help? Chat with support from the Profile section.
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: Theme.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Theme.colors.text,
    marginBottom: 12,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: Theme.colors.border,
  },
  buttonText: {
    color: Theme.colors.secondary,
    fontWeight: "700",
    fontSize: 16,
  },
  helpText: {
    marginTop: 14,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textAlign: "center",
  },
});

export default UpdateNumber;
