import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Theme from "../../components/Theme";
import { MaterialIcons } from '@expo/vector-icons';
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppStore } from "../../store/useAppStore";

const ReferralCode = () => {
  const [referralCode, setReferralCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [referrer, setReferrer] = useState(null);
  const navigation = useNavigation();
  const { setScratchCards } = useAppStore();

  // Validate referral code format (ODH + 8 digits)
  const validateReferralFormat = (code) => {
    const regex = /^ODHP\d{9}$/;
    return regex.test(code);
  };

  const handleValidateReferral = async () => {
    if (!referralCode.trim()) {
      setErrorMessage("Please enter a referral code");
      return;
    }

    if (!validateReferralFormat(referralCode.trim())) {
      setErrorMessage(
        "Referral code must be ODHP followed by 9 digits (e.g., ODHP00000001)"
      );
      return;
    }

    setValidating(true);
    setErrorMessage("");
    setReferrer(null);

    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.get(
        `https://newapi.odhpay.com/referral/validate-referral?member_id=${referralCode.trim()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === 1) {
        setReferrer({
          mobileNumber: response.data.user.MobileNumber,
          memberId: response.data.user.member_id,
        });
      } else {
          setErrorMessage(response.data.detail || "Invalid referral code");
      }
    } catch (error) {
      console.error("Validation error:", error);
      setErrorMessage(
        error.response?.data?.detail || "Failed to validate referral code"
      );
    } finally {
      setValidating(false);
    }
  };

  const handleReferralCode = async (sendData) => {
    if (sendData === 1 && !referrer) {
      setErrorMessage("Please validate the referral code first");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log(sendData===1 ? referralCode : "ODHP00000001");
      // Step 1: Register the referral relationship
      const response = await axios.post(
        "https://newapi.odhpay.com/register/set-referral/",
        {
         "refererID":sendData===1 ? referralCode:"ODHP00000001"
        },
        { headers }
      );

      console.log(response.data)

      if (response.data.status !== 1) {
        throw new Error(response.data.message || "Failed to register referral");
      }


      navigation.navigate("MainApp", { screen: "HomeTab" },{showWelcome: true,lcrReceived: 100,});
    } catch (error) {

      if (axios.isAxiosError(error)) {
        console.error(
          "Axios Error:",
          error.response?.status,
          error.response?.data
        );

        if (error.response?.status === 404) {
          Alert.alert("Error", "Requested resource not found (404)");
        }
      } else {
        console.error("Unexpected Error:", error);
        Alert.alert("Error", "Something went wrong!");
      }

      
      console.error("Referral submission error:", error);

      let errorMessage = "Something went wrong";
      if (error.response) {
        // Server responded with error status
        errorMessage =
          error.response.data?.message ||
          error.response.data?.detail ||
          `Server error (${error.response.status})`;
      } else if (error.request) {
        // Request was made but no response
        errorMessage = "Network error - please check your connection";
      } else {
        // Other errors
        errorMessage = error.message || "Failed to process referral";
      }

      setErrorMessage(errorMessage);

      // Optionally show an alert for critical errors
      if (!error.response || error.response.status >= 500) {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Referral Code</Text>
      <Text style={styles.subtitle}>Ask your referrer for their Member ID (e.g., ODHP00000001)</Text>

      <View style={[styles.inputCard, styles.inputContainer]}>
        <MaterialIcons name="confirmation-number" size={22} color={Theme.colors.primary} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.input}
          placeholder="e.g., ODHP00000001"
          placeholderTextColor="#888"
          value={referralCode}
          onChangeText={(text) => {
            setReferralCode(text.toUpperCase());
            setErrorMessage("");
            setReferrer(null);
          }}
          editable={!loading}
          autoCapitalize="characters"
          maxLength={12}
          returnKeyType="done"
          onSubmitEditing={handleValidateReferral}
        />
        {!referrer ? (
          <TouchableOpacity
            style={[styles.validateButton, validating && styles.disabledButton]}
            onPress={handleValidateReferral}
            disabled={validating || loading}
          >
            {validating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.validateButtonText}>Validate</Text>}
          </TouchableOpacity>
        ) : (
          <View style={styles.validateSuccess}>
            <MaterialIcons name="check-circle" size={18} color="#0f9d58" />
            <Text style={{ marginLeft: 6, color: '#166534', fontWeight: '600' }}>Verified</Text>
          </View>
        )}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <TouchableOpacity onPress={() => Alert.alert('How to get referral ID', 'Ask the person who referred you for their Member ID (e.g., LCR00000001). It is found under their profile in the app.')}
        style={{ marginTop: 4, marginBottom: 10 }}>
        <Text style={{ color: Theme.colors.primary, fontSize: 13 }}>How do I get a referral ID?</Text>
      </TouchableOpacity>

      {referrer && (
        <View style={styles.referrerCard}>
          <View style={styles.refLeft}>
            <View style={styles.avatarCircle}><Text style={styles.avatarInitial}>{(referrer?.memberId || 'U').slice(0, 2)}</Text></View>
          </View>
          <View style={styles.refCenter}>
            <Text style={styles.refName}>Referrer</Text>
            <Text style={styles.refDetail}>{referrer.memberId}</Text>
            <Text style={styles.refDetail}>XX-XXXXX-{String(referrer?.mobileNumber || '').slice(-4)}</Text>
          </View>
          <View style={styles.refRight}>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="check-circle" size={20} color="#0f9d58" />
            </View>
          </View>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.skipButton, loading && styles.disabledButton]}
          onPress={() => handleReferralCode(0)}
          disabled={loading}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, (!referrer || loading) && styles.disabledButton]}
          onPress={() => handleReferralCode(1)}
          disabled={!referrer || loading}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>Apply Code</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Theme.colors.secondary,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 50,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  validateButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  validateSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 10,
  },
  validateButtonText: {
    color: Theme.colors.secondary,
    fontSize: 14,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 5,
    marginBottom: 10,
  },
  referrerInfo: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
    inputCard: {
      backgroundColor: '#fff',
      borderRadius: 10,
      paddingHorizontal: 10,
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E6EAF2',
      marginBottom: 12,
    },
    referrerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      ...Platform.select({ android: { elevation: 2 }, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 } }),
    },
    refLeft: { marginRight: 12 },
    avatarCircle: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontWeight: '700', color: Theme.colors.text },
    refCenter: { flex: 1 },
    refName: { fontSize: 12, color: Theme.colors.textSecondary },
    refDetail: { fontSize: 14, fontWeight: '600', color: Theme.colors.text },
    refRight: { marginLeft: 8 },
    verifiedBadge: { alignItems: 'center', justifyContent: 'center' },
  referrerText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  referrerDetail: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  skipButton: {
    flex: 1,
    backgroundColor: Theme.colors.secondary,
    padding: 12,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    marginRight: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.primary,
  },
  button: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    padding: 12,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: Theme.colors.secondary,
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default ReferralCode;
