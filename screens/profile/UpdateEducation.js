import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRegisterStore } from "../../store";
import useUserStore from "../../store/useUserStore";
import Theme from "../../components/Theme";

const EDUCATION_OPTIONS = [
  "Below 10th",
  "10th Pass",
  "12th Pass",
  "Diploma",
  "Under Graduate",
  "Graduate",
  "Post Graduate",
  "PhD / Doctorate",
  "Professional Degree (CA, CS, etc.)",
  "Technical Certification",
  "Other",
];

const DUMMY_PHONE = "7048986551";

const UpdateEducation = ({ navigation }) => {
  const [selectedEducation, setSelectedEducation] = useState("");
  const { sendProfileUpdateOtp, loading, resetOtpState } = useRegisterStore();
  const user = useUserStore((s) => s.user);
  const phone = user?.user?.mobile || user?.mobile || DUMMY_PHONE;

  const handleContinue = async () => {
    if (!selectedEducation) {
      Alert.alert("Error", "Please select your educational qualification.");
      return;
    }

    if (!phone) {
      Alert.alert("Error", "Phone number not found. Please try again.");
      return;
    }

    try {
      resetOtpState();
      await sendProfileUpdateOtp(phone);
      navigation.navigate("ProfileOtpVerification", {
        updateType: "education",
        updateData: { education_qualification: selectedEducation },
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
        <Text style={styles.headerTitle}>Add Education</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Select your highest educational qualification
        </Text>

        <View style={styles.optionsContainer}>
          {EDUCATION_OPTIONS.map((education) => (
            <TouchableOpacity
              key={education}
              style={[
                styles.optionCard,
                selectedEducation === education && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedEducation(education)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.radioCircle,
                    selectedEducation === education && styles.radioCircleSelected,
                  ]}
                >
                  {selectedEducation === education && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    selectedEducation === education && styles.optionTextSelected,
                  ]}
                >
                  {education}
                </Text>
              </View>
              {selectedEducation === education && (
                <Ionicons name="checkmark-circle" size={22} color={Theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedEducation && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={loading || !selectedEducation}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
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
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24,
    lineHeight: 22,
  },
  optionsContainer: {
    
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  optionCardSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + "08",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: Theme.colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.primary,
  },
  optionText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  optionTextSelected: {
    color: Theme.colors.primary,
    fontWeight: "600",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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

export default UpdateEducation;
