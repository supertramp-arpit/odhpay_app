import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import LottieView from "lottie-react-native";
import { useRegisterStore } from "../../store";
import Theme from "../../components/Theme";

const OTP_LENGTH = 6;

const ProfileOtpVerification = ({ navigation, route }) => {
  const { updateType, updateData, phone } = route.params;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const inputRefs = useRef([]);
  const { verifyProfileUpdateOtp, sendProfileUpdateOtp, loading, resetOtpState } =
    useRegisterStore();

  const shakeAnim = useSharedValue(0);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Auto-focus first input
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnim.value }],
  }));

  const triggerShake = () => {
    shakeAnim.value = withSequence(
      withSpring(-10, { damping: 2, stiffness: 500 }),
      withSpring(10, { damping: 2, stiffness: 500 }),
      withSpring(-10, { damping: 2, stiffness: 500 }),
      withSpring(0, { damping: 2, stiffness: 500 })
    );
  };

  const handleOtpChange = (value, index) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, OTP_LENGTH).split("");
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedOtp.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    try {
      resetOtpState();
      await sendProfileUpdateOtp(phone);
      setTimer(30);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      Alert.alert("Success", "OTP has been resent to your mobile number.");
    } catch (error) {
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== OTP_LENGTH) {
      Alert.alert("Error", "Please enter complete OTP.");
      triggerShake();
      return;
    }

    Keyboard.dismiss();
    setVerifying(true);

    try {
      const result = await verifyProfileUpdateOtp(phone, otpString, updateData);
      
      if (result?.verified) {
        setVerified(true);
        // Wait for animation then navigate
        setTimeout(() => {
          navigation.navigate("UserInformation", { refreshData: true });
        }, 2000);
      } else {
        throw new Error("Verification failed");
      }
    } catch (error) {
      setVerifying(false);
      triggerShake();
      Alert.alert("Error", "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const getUpdateTypeLabel = () => {
    switch (updateType) {
      case "occupation":
        return "Occupation";
      case "education":
        return "Education Qualification";
      case "communication_address":
        return "Communication Address";
      case "permanent_address":
        return "Permanent Address";
      default:
        return "Profile";
    }
  };

  const maskedPhone = phone
    ? phone.slice(0, 2) + "XXXXXX" + phone.slice(-2)
    : "XXXXXXXXXX";

  if (verified) {
    return (
      <SafeAreaView style={styles.successContainer} edges={[]}>
        <View style={styles.successContent}>
          <LottieView
            source={require("../../Animation/success.json")}
            autoPlay
            loop={false}
            style={styles.successAnimation}
          />
          <Text style={styles.successTitle}>Updated Successfully!</Text>
          <Text style={styles.successSubtitle}>
            Your {getUpdateTypeLabel().toLowerCase()} has been updated.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Verify OTP</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={48} color={Theme.colors.primary} />
        </View>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit OTP to your registered mobile number{"\n"}
          <Text style={styles.phoneText}>{maskedPhone}</Text>
        </Text>

        {/* OTP Input */}
        <Animated.View style={[styles.otpContainer, shakeStyle]}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                verifying && styles.otpInputDisabled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value.replace(/[^0-9]/g, ""), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              editable={!verifying}
              selectTextOnFocus
            />
          ))}
        </Animated.View>

        {/* Timer / Resend */}
        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
              <Text style={styles.resendText}>
                Didn't receive OTP?{" "}
                <Text style={styles.resendLink}>Resend</Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              Resend OTP in <Text style={styles.timerCount}>{timer}s</Text>
            </Text>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={Theme.colors.primary} />
          <Text style={styles.infoText}>
            Updating: <Text style={styles.infoHighlight}>{getUpdateTypeLabel()}</Text>
          </Text>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            otp.join("").length !== OTP_LENGTH && styles.verifyButtonDisabled,
          ]}
          onPress={handleVerify}
          disabled={verifying || otp.join("").length !== OTP_LENGTH}
        >
          {verifying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Update</Text>
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
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  phoneText: {
    fontWeight: "600",
    color: "#374151",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  otpInputFilled: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + "08",
  },
  otpInputDisabled: {
    backgroundColor: "#F3F4F6",
  },
  resendContainer: {
    marginBottom: 24,
  },
  timerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  timerCount: {
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  resendText: {
    fontSize: 14,
    color: "#6B7280",
  },
  resendLink: {
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.primary + "10",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 32,
    width: "100%",
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
  },
  infoHighlight: {
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  verifyButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  verifyButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Success Screen
  successContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  successContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  successAnimation: {
    width: 180,
    height: 180,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#10B981",
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
  },
});

export default ProfileOtpVerification;
