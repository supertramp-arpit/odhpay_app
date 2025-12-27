import { WebView } from "react-native-webview";
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  StyleSheet, Alert,
  BackHandler,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Theme from "../../components/Theme";
import { Lock, X } from "lucide-react-native";
import { apiRequest } from "../../utils/api";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import sucessAni from '../../Animation/success.json'
import LottieView from "lottie-react-native";


const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;


export default function AadharKyc() {
  const navigation = useNavigation();
  const COLORS = Theme.colors;

  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showWeb, setShowWeb] = useState(false);
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);
  const [url, setUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const isCheckingRef = React.useRef(false); // prevents concurrent calls

 

  const [showIntro, setShowIntro] = useState(false);
  // open on focus (already present in your code)
  useFocusEffect(
    useCallback(() => {
      getUserKycStatus();
      if (!isAadhaarVerified) setShowIntro(true);
    }, [getUserKycStatus, isAadhaarVerified])
  );

  // OK handler
  const handleYes = useCallback(() => {
    // setConsent(true);     // enable main CTA
    setShowIntro(false);  // close modal
  }, []);

  const handleLater = useCallback(() => {
    if (Platform.OS === "android") {
      BackHandler.exitApp();           // ✅ exit app on Android
    } else {
      Alert.alert(
        "Close App",
        "Please close the app from the app switcher on iPhone.",
        [{ text: "OK", onPress: () => navigation.replace("/") }]
      );
    }
  }, [navigation]);


  // inside AadhaarVerification compornent
  useEffect(() => {
    if (!showIntro) return;

    const onBack = () => true; // swallow back press
    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);

    return () => sub.remove(); // ✅ correct way to remove
  }, [showIntro]);


  // ✅ canSubmit is true only when user has given consent and not loading
  const canSubmit = consent && !loading;

  // Start Aadhaar verification flow
  const onSubmit = useCallback(async () => {
    setErrorMsg(null);

    if (!canSubmit) return;

    try {
      setLoading(true);
      const result = await apiRequest({
        method: "post",
        endpoint: "api/v1/kyc/aadhaar/start",
      });

      if (result?.url) {
        setUrl(result.url);
        setShowWeb(true);
      } else {
        setErrorMsg("Something went wrong.");
      }
    } catch (error) {
      console.log("Aadhaar start error:", error);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [canSubmit]);

  // getting the final response after getting  kyc status and entry the response in datatbase
  const refreshStatus = useCallback(async () => {
    try {
      const result = await apiRequest({
        method: "post",
        endpoint: "api/v1/kyc/aadhaar/refresh",
      });

    } catch (error) {
      console.log("Aadhaar status error:", error);
      setErrorMsg("Network error while checking status.");
    }
  }, []);

  // Fetch Aadhaar KYC status
  const getUserKycStatus = useCallback(async () => {

    if (isCheckingRef.current) return;          // guard
    isCheckingRef.current = true;
    setStatusLoading(true);

    try {
      const result = await apiRequest({
        method: "get",
        endpoint: "api/v1/kyc/aadhaar/status",
      });
      if (result.aadhaar_verified) {
        // await refreshStatus();
        setIsAadhaarVerified(true);
        setErrorMsg(null);
      }
    } catch (error) {
      console.log("Aadhaar status error:", error);
      setErrorMsg("Network error while checking status.");
    } finally {
      setStatusLoading(false);
      isCheckingRef.current = false;
    }
  }, []);


  // Call the GetUserKycStatus if userAddhar is Already Verified
  useFocusEffect(
    useCallback(() => {
      getUserKycStatus();
    }, [getUserKycStatus])
  );


  const handleWebViewClose = useCallback(() => {
    getUserKycStatus();
    setShowWeb(false);
  }, [getUserKycStatus]);

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>


      {statusLoading && !showWeb && (
        <View pointerEvents="auto" style={styles.absOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={COLORS.text} />
            <Text style={styles.loaderText}>Checking KYC status…</Text>
          </View>
        </View>
      )}


      {showWeb ? (
        <DigiLockerScreen url={url} handlePress={handleWebViewClose} />
      ) : isAadhaarVerified ? (
        <AadhaarSuccessScreen />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          
        

          {/* Body */}
          <View style={styles.body}>
            <Text style={[styles.title, { color: COLORS.text }]}>
              Verify Your Aadhaar
            </Text>
            <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
              We use DigiLocker (a secure UIDAI-approved service) to verify your Aadhaar.
              This ensures your identity is validated safely and quickly.
            </Text>

            {/* CTA Button */}
            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              style={[styles.ctaButton, {
                backgroundColor: canSubmit ? COLORS.primary : COLORS.border,
                borderColor: canSubmit ? COLORS.primary : COLORS.border,
              }]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit, busy: loading }}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.secondary} />
              ) : (
                <Text style={[styles.ctaButtonText, { color: COLORS.secondary }]}>
                  Continue with DigiLocker
                </Text>
              )}
            </Pressable>

            {/* Error message */}
            {errorMsg && (
              <View style={[styles.errorBox, { borderColor: COLORS.danger, backgroundColor: COLORS.inputBg }]}>
                <Text style={[styles.errorText, { color: COLORS.danger }]}>
                  {errorMsg}
                </Text>
              </View>
            )}

            {/* Consent */}
            <View style={styles.consentSection}>
              {/* Checkbox */}
              <Pressable
                onPress={() => setConsent((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: consent }}
                hitSlop={8}
                style={styles.checkboxPressable}
              >
                <View
                  style={[styles.checkbox, {
                    backgroundColor: consent ? COLORS.primary : "transparent",
                    borderColor: consent ? COLORS.primary : COLORS.border,
                  }]}
                >
                  {consent ? (
                    <Ionicons name="checkmark" size={14} color={COLORS.secondary} />
                  ) : null}
                </View>
              </Pressable>

              {/* Label + links */}
              <Text style={styles.consentText}>
                I agree to this
                {" "}
                <Text
                  style={[styles.disclaimerLink, { color: COLORS.primary }]}
                  accessibilityRole="link"
                >
                  disclaimer
                </Text>
                {" "}
                and provide my Aadhaar details{" "}
              </Text>
            </View>


            {/* Info box */}
            <View
              style={[styles.infoBox, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}
            >
              <Text style={styles.infoText}>
                🔒 Your Aadhaar number will not be stored on this device. The verification process is secure and handled directly with DigiLocker/UIDAI.
                For your safety, avoid using public Wi-Fi while completing KYC.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>

      )}


      <IntroModal
        visible={showIntro && !showWeb && !isAadhaarVerified && !consent}
        onYes={handleYes}
        onLater={handleLater}
        COLORS={COLORS}
      />




    </View>
  );
}

/* ------------------ Extra Components ------------------ */

function DigiLockerScreen({ handlePress, url }) {
  const COLORS = Theme.colors;
  
  return (
    <View style={[styles.digiLockerContainer, { backgroundColor: COLORS.background }]}>
      {/* Header */}
     
      <View style={styles.flex1}>
        <WebView
          source={{ uri: url || "" }}
          style={styles.flex1}
          onNavigationStateChange={(navState) => {
            if (navState.url.startsWith("https://newapi.odhpay.com/api/v1/kyc/aadhaar/redirect")) {
              // TODO: extract token and call backend
              handlePress();
            }
          }}
        />
      </View>
    </View>
  );
}

function AadhaarSuccessScreen() {
  const animation = React.useRef(null);
  const navigation = useNavigation();
  const COLORS = Theme.colors;

  useEffect(() => {
    // Play animation on mount
    if (animation.current) {
      animation.current.play();
    }
  }, []);
  
  return (
    <View style={[styles.successContainer, { backgroundColor: COLORS.background }]}>
      <View style={styles.successIconContainer}>
        <LottieView
          ref={animation}
          source={sucessAni}
          style={styles.lottieAnimation}
          autoPlay
          loop={false}
        />
      </View>
      <Text style={[styles.successTitle, { color: COLORS.text }]}>Aadhaar Verified!</Text>
      <Text style={[styles.successSubtitle, { color: COLORS.textSecondary }]}>
        Your Aadhaar has been successfully verified.{"\n"}You can now continue with your registration.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate("AadharDetails")}
        activeOpacity={0.85}
        style={[styles.successContinueButton, { backgroundColor: COLORS.primary }]}
      >
        <Text style={[styles.successContinueText, { color: COLORS.secondary }]}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}


function IntroModal({
  visible,
  onYes,
  onLater,
  COLORS,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={() => { /* prevent dismiss */ }}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalCard,
            { borderColor: COLORS.border, backgroundColor: COLORS.secondary },
          ]}
        >
          <Text style={[styles.modalTitle, { color: COLORS.text }]}>
            Complete your KYC
          </Text>
          <Text style={[styles.modalSubtitle, { color: COLORS.accent }]}>
            Review & complete your KYC details easily.
          </Text>

          <Text style={[styles.modalLead, { color: COLORS.text }]}>
            If “yes” is your answer to the points below, then let’s begin KYC:
          </Text>

          <View style={styles.bullets}>
            <Bullet text="I'm above 18 years old" />
            <Bullet text="I have my Aadhaar Number and PAN Card handy to complete KYC" />
            <Bullet text="I have my Aadhaar-registered mobile number handy for OTP verification" />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity

              onPress={onLater}
              activeOpacity={0.9}
              style={[styles.altBtn, { borderColor: COLORS.border, backgroundColor: COLORS.secondary }]}
            >
              <Text style={{ color: COLORS.text, fontWeight: "600" }}>
                I’ll do it later
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onYes}
              activeOpacity={0.9}
              style={[styles.ctaBtn, { backgroundColor: COLORS.primary }]}
            >
              <Text style={{ color: COLORS.secondary, fontWeight: "700" }}>
                Yes, I have
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}



function Bullet({ text }) {
  const COLORS = Theme.colors;
  
  return (
    <View style={styles.bulletContainer}>
      <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={styles.bulletIcon} />
      <Text style={[styles.bulletText, { color: COLORS.textSecondary }]}>{text}</Text>
    </View>
  );
}






const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  absOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Theme.colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  loaderCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: Theme.colors.secondary,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  loaderText: {
    marginTop: 10,
    color: Theme.colors.text,
    fontWeight: "600",
  },
  header: {
    paddingHorizontal: isSmallDevice ? 16 : 20,
    paddingTop: isSmallDevice ? 12 : 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: isSmallDevice ? 20 : 24,
    paddingTop: isSmallDevice ? 16 : 20,
    paddingBottom: isSmallDevice ? 16 : 20,
  },
  title: {
    fontSize: isSmallDevice ? 26 : 30,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: isSmallDevice ? 14 : 15,
    marginBottom: isSmallDevice ? 28 : 32,
    lineHeight: 24,
  },
  ctaButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ctaButtonText: {
    fontWeight: '700',
    fontSize: isSmallDevice ? 16 : 18,
    letterSpacing: 0.3,
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  consentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: isSmallDevice ? 20 : 24,
    paddingHorizontal: 8,
  },
  checkboxPressable: {
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  consentText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: Theme.colors.textSecondary,
    fontWeight: '400',
  },
  disclaimerLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  infoBox: {
    marginTop: isSmallDevice ? 20 : 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  // DigiLockerScreen Styles
  digiLockerContainer: {
    flex: 1,
  },
  digiLockerHeader: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    backgroundColor: Theme.colors.surface,
  },
  digiLockerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  digiLockerCloseButton: {
    padding: 8,
    borderRadius: 12,
  },
  digiLockerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digiLockerTitle: {
    marginLeft: 8,
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  digiLockerSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '400',
  },
  digiLockerExitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  digiLockerExitText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Success Screen Styles
  successContainer: {
    flex: 1,
    paddingHorizontal: isSmallDevice ? 20 : 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconContainer: {
    marginTop: isSmallDevice ? 60 : 80,
  },
  lottieAnimation: {
    width: width * 0.4,
    height: width * 0.4,
    marginTop: 20,
  },
  successTitle: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    color: Theme.colors.text,
    letterSpacing: -0.3,
  },
  successSubtitle: {
    textAlign: 'center',
    marginBottom: isSmallDevice ? 28 : 32,
    lineHeight: 24,
    fontSize: isSmallDevice ? 14 : 15,
    color: Theme.colors.textSecondary,
    fontWeight: '400',
  },
  successContinueButton: {
    width: '100%',
    marginTop: isSmallDevice ? 120 : 160,
    paddingVertical: 18,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  successContinueText: {
    fontWeight: '700',
    fontSize: isSmallDevice ? 17 : 18,
    textAlign: 'center',
    color: Theme.colors.secondary,
    letterSpacing: 0.3,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  modalCard: {
    width: "100%",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Theme.colors.text,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  modalLead: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  bullets: {
    marginTop: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  altBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  bulletIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.textSecondary,
    fontWeight: '400',
  },
});

