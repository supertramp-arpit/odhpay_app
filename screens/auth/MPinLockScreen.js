import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image, Dimensions, Animated, Alert, Platform, TextInput, Keyboard, } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from "expo-local-authentication";

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width >= 768;

const MPinLockScreen = ({ navigation: navProp }) => {
  const navigationHook = useNavigation();
  const navigation = navProp || navigationHook;
  const [activeTab, setActiveTab] = useState('security');
  const [securityCode, setSecurityCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);


  useEffect(() => {
    if (activeTab === 'security') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [activeTab]);

  const getCurrentTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 20) return 'Good Evening';
    return 'Good Night';
  };

  const handleCodeChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 6) {
      setSecurityCode(numericText);

      if (numericText.length === 6) {
        Keyboard.dismiss();
        setTimeout(() => {
          handleVerify(numericText);
        }, 100);
      }
    }
  };

  const handleVerify = async (code = securityCode) => {
    if (code.length !== 6) {
      shake();
      Alert.alert("Invalid PIN", "Please enter a 6-digit security code");
      return;
    }

    try {
      setIsVerifying(true);

      let headers = { "Content-Type": "application/json" }
      const token = await AsyncStorage.getItem("access_token");
      if (!token) throw new Error("No access token found");
      headers["Authorization"] = `Bearer ${token}`;

      const resp = await axios.post(
        "https://newapi.odhpay.com/register/verify_pin",       // if your router isn't prefixed, use "/verify_pin"
        { pincode: code },
        { headers }
      );


      console.log("PIN verification response:",resp);

      console.log(resp.data)

      // Your FastAPI response (from earlier) looked like: { status: true/false, message, user_id, updated_at }
      const ok = resp?.data?.status === true;

      if (!ok) {
        shake();
        Alert.alert("Incorrect PIN", resp?.data?.message ?? "Please try again");
        return;
      }

      // success
      navigation.replace("MainApp", { screen: "HomeTab" });
    } catch (err) {
      // common causes: token missing/expired, 401 from Depends(authenticate_user), network/cors
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong while verifying your PIN.";
      shake();
      Alert.alert("Verification failed", String(msg));
    } finally {
      setIsVerifying(false);
    }
  };


  // const handleFingerprint = () => {
  //   console.log('Fingerprint authentication triggered');
  //   navigation.replace('HomeScreen');
  // };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const handlePinBoxPress = () => {
    inputRef.current?.focus();
  };

  const isPinComplete = securityCode.length === 6;




  // ======================================================
  // Get the FingerPrintStatus 
  // ======================================================
  const [fingerStatus, setFingerStatus] = useState(null);
  const [hasHW, setHasHW] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authing, setAuthing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const autoPromptedRef = useRef(false);


  useEffect(() => {
    (async () => {
      try {
        await GetFingerPrintStatus();   // gets fingerprint_status from your API
        await readState();              // detects hardware + enrollment
      } finally {
        setLoading(false);
      }
    })();
  }, []);



  // ✅ safe header creation
  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) throw new Error("No access token found");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // ✅ use getAuthHeaders; avoid implicit global "headers"
  const GetFingerPrintStatus = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        "https://newapi.odhpay.com/misc/get_fingerprint_status",
        { headers }
      );
      setFingerStatus(response.data?.fingerprint_status);
    } catch (error) {
      console.log(error);
    }
  };

  // ✅ read device capability
  const readState = useCallback(async () => {
    const hw = await LocalAuthentication.hasHardwareAsync();
    const en = hw ? await LocalAuthentication.isEnrolledAsync() : false;
    setHasHW(hw);
    setEnrolled(en);
  }, []);



  // ✅ biometric auth (deps include navigation)
  const doAuth = useCallback(async () => {
    setAuthing(true);
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock with biometrics",
        cancelLabel: "Use PIN instead",
        requireConfirmation: Platform.OS === "android",
        disableDeviceFallback: true, // only biometrics
      });

      if (res.success) {
        navigation.replace("MainApp", { screen: "HomeTab" });
      } else if (res.error !== "user_cancel" && res.error !== "system_cancel") {
        Alert.alert("Authentication failed", "Please try again.");
      }
    } catch (e) {
      console.log("Biometric auth error:", e);
      Alert.alert("Authentication error", String(e?.message ?? e));
    } finally {
      setAuthing(false);
    }
  }, [navigation]);


  // ✅ only auto-prompt on the Biometric tab, once
  useEffect(() => {
    if (
      activeTab === "fingerprint" &&
      !loading &&
      Number(fingerStatus) === 1 &&
      hasHW &&
      enrolled &&
      !autoPromptedRef.current
    ) {
      autoPromptedRef.current = true;
      doAuth();
    }
  }, [activeTab, loading, fingerStatus, hasHW, enrolled, doAuth]);


  const ConditionalButton = async () => {
    console.log('fingerStatus:', fingerStatus, 'hasHW:', hasHW, 'enrolled:', enrolled, 'loading:', loading);

    if (loading) {
      setErrorMsg("Checking device status…");
      Alert.alert("Please wait", "Checking biometric availability.");
      return;
    }

    if (Number(fingerStatus) !== 1) {
      setErrorMsg("Biometric login is disabled in your profile.");
      Alert.alert("Disabled", "Biometric login is disabled in your profile.");
      return;
    }
    if (!hasHW) {
      setErrorMsg("This device does not support biometrics.");
      Alert.alert("Unavailable", "This device does not support biometrics.");
      return;
    }
    if (!enrolled) {
      setErrorMsg("Add a fingerprint in device Settings to use this option.");
      Alert.alert("Not enrolled", "Add a fingerprint in device Settings first.");
      return;
    }

    // ✅ All good — prompt OS dialog
    doAuth();
  };



  return (
    <View style={styles.container}>

      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>{getCurrentTime()}</Text>
          <TouchableOpacity style={styles.helpButton}>
            <MaterialIcons name="help-outline" size={isSmallDevice ? 20 : 24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.logoWrapper}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/odh.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appName}>ODHPAY</Text>
        </View>
      </View>

      <View style={styles.contentCard}>
        <View style={styles.securityHeader}>
          <View style={styles.lockIconWrapper}>
            <MaterialCommunityIcons name="shield-lock" size={isSmallDevice ? 20 : 22} color="#000000" />
          </View>
          <View style={styles.securityTextContainer}>
            <Text style={styles.securityTitle}>Secure Login</Text>
            <Text style={styles.securitySubtitle}>
              Enter your 6-digit security code to continue
            </Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'security' && styles.activeTab]}
            onPress={() => setActiveTab('security')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="key-variant"
              size={isSmallDevice ? 16 : 18}
              color={activeTab === 'security' ? '#000000' : '#9CA3AF'}
            />
            <Text style={[styles.tabText, activeTab === 'security' && styles.activeTabText]}>
              Security Code
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'fingerprint' && styles.activeTab]}
            onPress={() => setActiveTab('fingerprint')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="fingerprint"
              size={isSmallDevice ? 16 : 18}
              color={activeTab === 'fingerprint' ? '#000000' : '#9CA3AF'}
            />
            <Text style={[styles.tabText, activeTab === 'fingerprint' && styles.activeTabText]}>
              Biometric
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'security' && (
          <View style={styles.securitySection}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={handlePinBoxPress}
            >
              <Animated.View
                style={[
                  styles.pinDisplay,
                  { transform: [{ translateX: shakeAnimation }] }
                ]}
              >
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <View key={index} style={styles.pinBox}>
                    {securityCode[index] ? (
                      <View style={styles.pinDot} />
                    ) : (
                      <View style={styles.pinEmpty} />
                    )}
                  </View>
                ))}
              </Animated.View>
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={securityCode}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              autoFocus={true}
              caretHidden={true}
            />

            <View style={styles.instructionContainer}>
              <MaterialCommunityIcons name="information-outline" size={16} color="#6B7280" />
              <Text style={styles.instructionText}>
                Tap above to enter your 6-digit PIN
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isPinComplete ? styles.submitButtonActive : styles.submitButtonDisabled
              ]}
              onPress={() => handleVerify()}
              disabled={!isPinComplete || isVerifying}
              activeOpacity={0.8}
            >
              {isVerifying ? (
                <View style={styles.verifyingContainer}>
                  <MaterialCommunityIcons name="loading" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Verifying...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footerActions}>
              <TouchableOpacity onPress={() => shake()}>
                <Text style={styles.footerLink}>Forgot Security Code?</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'fingerprint' && (
          <View style={styles.biometricSection}>
            <View style={styles.biometricContent}>
              <TouchableOpacity
                style={styles.fingerprintCircle}
                // onPress={handleFingerprint}

                onPress={ConditionalButton}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={isSmallDevice ? 60 : isTablet ? 100 : 80}
                  color="#000000"
                />
              </TouchableOpacity>
              <Text style={styles.biometricTitle}>{authing ? (
                <Text style={{ marginTop: 8, color: "#6B7280" }}>Authenticating…</Text>
              ) : errorMsg ? (
                <Text style={{ marginTop: 8, color: "#ef4444" }}>{errorMsg}</Text>
              ) : null}</Text>
              <Text style={styles.biometricSubtitle}>
                Touch the fingerprint sensor to unlock
              </Text>
            </View>
          </View>
        )}

        {/* // ✅ optional: surface authing state somewhere */}
        {/* ✅ optional: surface authing state somewhere */}



      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerSection: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: isSmallDevice ? 16 : isTablet ? 40 : 24,
    paddingBottom: isSmallDevice ? 20 : isTablet ? 40 : 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallDevice ? 20 : isTablet ? 40 : 30,
  },
  greeting: {
    fontSize: isSmallDevice ? 14 : isTablet ? 18 : 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  helpButton: {
    width: isSmallDevice ? 32 : isTablet ? 40 : 36,
    height: isSmallDevice ? 32 : isTablet ? 40 : 36,
    borderRadius: isSmallDevice ? 16 : isTablet ? 20 : 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? 12 : isTablet ? 24 : 20,
  },
  logoCircle: {
    width: isSmallDevice ? 80 : isTablet ? 120 : 100,
    height: isSmallDevice ? 80 : isTablet ? 120 : 100,
    borderRadius: isSmallDevice ? 40 : isTablet ? 60 : 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logo: {
    width: isSmallDevice ? 50 : isTablet ? 75 : 65,
    height: isSmallDevice ? 50 : isTablet ? 75 : 65,
    borderRadius: isSmallDevice ? 25 : isTablet ? 37.5 : 32.5,
  },
  welcomeSection: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: isSmallDevice ? 12 : isTablet ? 16 : 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  appName: {
    fontSize: isSmallDevice ? 22 : isTablet ? 32 : 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: isSmallDevice ? 16 : isTablet ? 32 : 24,
    paddingHorizontal: isSmallDevice ? 16 : isTablet ? 60 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isSmallDevice ? 16 : isTablet ? 24 : 20,
    paddingHorizontal: 4,
  },
  lockIconWrapper: {
    width: isSmallDevice ? 40 : isTablet ? 48 : 44,
    height: isSmallDevice ? 40 : isTablet ? 48 : 44,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    fontSize: isSmallDevice ? 16 : isTablet ? 22 : 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  securitySubtitle: {
    fontSize: isSmallDevice ? 11 : isTablet ? 14 : 12,
    color: '#6B7280',
    lineHeight: isSmallDevice ? 14 : isTablet ? 18 : 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 4,
    marginBottom: isSmallDevice ? 20 : isTablet ? 40 : 30,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallDevice ? 10 : isTablet ? 14 : 12,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: isSmallDevice ? 12 : isTablet ? 15 : 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#000000',
  },
  securitySection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: isSmallDevice ? 8 : isTablet ? 20 : 12,
    marginBottom: isSmallDevice ? 16 : isTablet ? 32 : 24,
    paddingHorizontal: isSmallDevice ? 10 : isTablet ? 40 : 20,
  },
  pinBox: {
    width: isSmallDevice ? 42 : isTablet ? 64 : 48,
    height: isSmallDevice ? 50 : isTablet ? 72 : 56,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDot: {
    width: isSmallDevice ? 10 : isTablet ? 14 : 12,
    height: isSmallDevice ? 10 : isTablet ? 14 : 12,
    borderRadius: isSmallDevice ? 5 : isTablet ? 7 : 6,
    backgroundColor: '#000000',
  },
  pinEmpty: {
    width: isSmallDevice ? 6 : isTablet ? 10 : 8,
    height: isSmallDevice ? 6 : isTablet ? 10 : 8,
    borderRadius: isSmallDevice ? 3 : isTablet ? 5 : 4,
    backgroundColor: '#D1D5DB',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: isSmallDevice ? 20 : isTablet ? 40 : 30,
  },
  instructionText: {
    fontSize: isSmallDevice ? 12 : isTablet ? 15 : 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallDevice ? 14 : isTablet ? 18 : 16,
    borderRadius: 14,
    marginBottom: isSmallDevice ? 12 : isTablet ? 20 : 16,
    gap: 8,
    marginHorizontal: isTablet ? 60 : 0,
  },
  submitButtonActive: {
    backgroundColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: isSmallDevice ? 15 : isTablet ? 18 : 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  footerActions: {
    alignItems: 'center',
    paddingVertical: isSmallDevice ? 8 : isTablet ? 16 : 12,
    paddingBottom: isSmallDevice ? 16 : isTablet ? 24 : 20,
  },
  footerLink: {
    fontSize: isSmallDevice ? 12 : isTablet ? 15 : 13,
    fontWeight: '600',
    color: '#000000',
  },
  biometricSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: isSmallDevice ? 40 : isTablet ? 80 : 60,
  },
  biometricContent: {
    alignItems: 'center',
  },
  fingerprintCircle: {
    width: isSmallDevice ? 120 : isTablet ? 180 : 140,
    height: isSmallDevice ? 120 : isTablet ? 180 : 140,
    borderRadius: isSmallDevice ? 60 : isTablet ? 90 : 70,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallDevice ? 20 : isTablet ? 32 : 24,
    borderWidth: 3,
    borderColor: '#E9D5FF',
  },
  biometricTitle: {
    fontSize: isSmallDevice ? 18 : isTablet ? 24 : 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  biometricSubtitle: {
    fontSize: isSmallDevice ? 13 : isTablet ? 16 : 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: isSmallDevice ? 20 : isTablet ? 40 : 20,
  },
});

export default MPinLockScreen;