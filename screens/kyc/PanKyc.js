import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, TouchableOpacity, Dimensions,StyleSheet} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Theme from "../../components/Theme";
import { Shield } from "lucide-react-native";
import { apiRequest } from "../../utils/api";
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import sucessAni from '../../Animation/success.json'

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;

/* ---------- helpers ---------- */
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/; // e.g., ABCDE1234F

export default function PanKyc() {
  const navigation  = useNavigation();
  const COLORS = Theme.colors;

  const [pan, setPan] = useState("");
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [panDetails, setPanDetails] = useState();



  const panUpper = useMemo(() => pan.toUpperCase().replace(/\s+/g, ""), [pan]);
  const panValid = useMemo(() => PAN_REGEX.test(panUpper), [panUpper]);
  const canSubmit = panValid && consent && !loading;

  const onChangePan = useCallback((t) => {
    setErrorMsg(null)
    const cleaned = t.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    setPan(cleaned);
  }, []);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack?.()) navigation.goBack();
    else navigation.replace("/"); // or "/onboarding"
  }, [navigation]);

  const onSubmit = useCallback(async () => {
    setTouched(true);
    if (!canSubmit) return;
    try {
      setLoading(true);

      const result = await apiRequest({
        method: "post",
        endpoint: "api/v1/kyc/pan/verify",
        data: {
          "pan": panUpper
        }
      });
      if (result?.ok) {
        setPanVerified(true);
        setPanDetails(result);
        setErrorMsg(null);
      }
      else {
        setErrorMsg("PAN verification failed. Please check and try again.");
      }
    } catch (error) {
      console.log("Pan status error:", error);
      setErrorMsg("Network error while checking status.");
    } finally {
      setLoading(false);
    }
  }, [canSubmit, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>


      {
        panVerified ? <PanSuccessScreen pan={panDetails?.pan} name={panDetails?.full_name} /> : (
          <KeyboardAvoidingView
            style={styles.flex1}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
           

            {/* Body */}
            <View style={styles.body}>
              <Text style={[styles.title, { color: COLORS.text }]}>
                Verify Your PAN
              </Text>
              <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                Secure & Instant PAN Verification
              </Text>

              {/* PAN */}
              <View style={styles.inputSection}>
                {/* <Text style={[styles.inputLabel, { color: COLORS.accent }]}>
                  PAN (AAAAA9999A)
                </Text> */}
                <View
                  style={[styles.inputContainer, { borderColor: COLORS.border }]}
                >
                  <TextInput
                    value={panUpper}
                    onChangeText={onChangePan}
                    onBlur={() => setTouched(true)}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    keyboardType="default"
                    placeholder="Enter PAN ABCDE1234F"
                    placeholderTextColor={COLORS.textLight}
                    style={[styles.textInput, { color: COLORS.text }]}
                    selectionColor={COLORS.primary}
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                  />
                </View>
                {touched && !panValid ? (
                  <Text style={[styles.errorText, { color: COLORS.danger }]}>
                    Enter a valid PAN (e.g., ABCDE1234F).
                  </Text>
                ) : null}

                {errorMsg && (
                  <Text style={[styles.errorTextJustify, { color: COLORS.danger }]}>
                    {/* {errorMsg} */}
                    We could not verify your PAN. Please check your PAN and try again.
                  </Text>
                )}
              </View>

              <Text style={[styles.helperText, { color: COLORS.textSecondary }]}>
                Enter your 10-digit PAN to get started
              </Text>

              {/* Consent */}
              <Pressable 
              onPress={() => setConsent((v) => !v)} 
              style={styles.consentContainer}>
                <View
                  style={[styles.checkbox, {
                    backgroundColor: consent ? COLORS.primary : COLORS.secondary,
                    borderColor: consent ? COLORS.primary : COLORS.border,
                  }]}
                >
                  {consent ? <Ionicons name="checkmark" size={14} color={COLORS.secondary} /> : null}
                </View>
                <Text
                  style={[styles.consentText, { color: COLORS.textSecondary }]}
                >
                  By clicking, I authorize ODH Developers to verify my PAN details with authorized
                  agencies for identity validation and compliance purposes. I confirm that the PAN
                  provided belongs to me and{" "}
                  <Text
                    accessibilityRole="link"
                    style={styles.consentBold}
                  >
                    consent
                  </Text>{" "}
                  to its use for verification, as per applicable laws and regulations.
                </Text>

              </Pressable>

              {/* Note */}
              <View
                style={[styles.noteCard, {
                  borderColor: COLORS.border,
                }]}
              >
                <Text
                  style={[styles.noteText, { color: COLORS.textSecondary }]}
                >
                  Ensure your PAN details are correct. Your PAN details are safe and
                  encrypted. PAN helps us verify your identity quickly and securely.
                </Text>
              </View>

            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Pressable
                onPress={onSubmit}
                disabled={!canSubmit}
                style={[styles.submitButton, {
                  backgroundColor: canSubmit ? COLORS.primary : COLORS.border,
                  borderColor: canSubmit ? COLORS.primary : COLORS.border,
                }]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSubmit, busy: loading }}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.secondary} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: COLORS.secondary }]}>
                    Verify PAN
                  </Text>
                )}
              </Pressable>

             
            </View>
          </KeyboardAvoidingView>
        )
      }


    </View>
  );
}




// --------------------------------Extra Components ---------------------------------------



function PanSuccessScreen({ pan = "XXXXX1234X", name = "Your Name" }) {
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
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.secondary }]}>
      <View style={styles.successContainer}>
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <LottieView
            ref={animation}
            source={sucessAni}
            style={styles.lottieAnimation}
            autoPlay
            loop={false}
          />
        </View>

        {/* Title */}
        <Text style={[styles.successTitle, { color: COLORS.text }]}>
          PAN Verified Successfully!
        </Text>

        {/* Subtitle */}
        <Text style={[styles.successSubtitle, { color: COLORS.textSecondary }]}>
          Your PAN details have been successfully verified.
          {"\n"}You’re all set to continue.
        </Text>

        {/* Details card */}
        <View
          style={[styles.detailsCard, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}
        >
          <View style={styles.detailsHeader}>
            <Shield size={18} color={COLORS.text} />
            <Text style={[styles.detailsHeaderText, { color: COLORS.text }]}>Verification Summary</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={[styles.detailsLabel, { color: COLORS.textSecondary }]}>Name (as per PAN)</Text>
            <Text style={[styles.detailsValue, { color: COLORS.text }]}>{name}</Text>
          </View>

          <View style={styles.detailsRowLast}>
            <Text style={[styles.detailsLabel, { color: COLORS.textSecondary }]}>PAN</Text>
            <Text style={[styles.detailsValue, { color: COLORS.text }]}>{pan}</Text>
          </View>
        </View>

        {/* Continue */}
        <TouchableOpacity
          onPress={() => navigation.replace("PanDetails")}
          activeOpacity={0.85}
          style={[styles.continueButton, { backgroundColor: COLORS.primary }]}
        >
          <Text style={[styles.continueButtonText, { color: COLORS.secondary }]}>Continue</Text>
        </TouchableOpacity>

       
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  header: {
    paddingHorizontal: isSmallDevice ? 16 : 20,
    paddingTop: isSmallDevice ? 12 : 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  title: {
    fontSize: isSmallDevice ? 26 : 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: isSmallDevice ? 13 : 14,
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 20,
    fontWeight: '400',
  },
  inputSection: {
    marginTop: isSmallDevice ? 20 : 24,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    backgroundColor: Theme.colors.surface,
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
  textInput: {
    height: 56,
    fontSize: isSmallDevice ? 15 : 16,
    letterSpacing: 1,
    fontWeight: '700',
  },
  errorText: {
    fontSize: isSmallDevice ? 12 : 13,
    marginTop: 6,
    marginHorizontal: 20,
    fontWeight: '600',
  },
  errorTextJustify: {
    fontSize: isSmallDevice ? 12 : 13,
    marginTop: 6,
    marginHorizontal: 20,
    textAlign: 'justify',
    fontWeight: '600',
  },
  helperText: {
    fontSize: isSmallDevice ? 12 : 13,
    marginTop: 6,
    marginHorizontal: 20,
    fontWeight: '500',
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: isSmallDevice ? 20 : 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  consentText: {
    fontSize: 12,
    lineHeight: 19,
    marginRight: 20,
    paddingRight: 16,
    textAlign: 'justify',
    flex: 1,
    fontWeight: '400',
  },
  consentBold: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  noteCard: {
    marginTop: isSmallDevice ? 18 : 20,
    padding: isSmallDevice ? 14 : 16,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: Theme.colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  noteText: {
    fontSize: isSmallDevice ? 12 : 13,
    textAlign: 'justify',
    lineHeight: isSmallDevice ? 18 : 20,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: isSmallDevice ? 20 : 24,
    paddingBottom: isSmallDevice ? 20 : 24,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  submitButtonText: {
    fontWeight: '800',
    fontSize: isSmallDevice ? 16 : 17,
    letterSpacing: 0.3,
  },
  // Success Screen Styles
  successContainer: {
    flex: 1,
    marginTop: isSmallDevice ? 40 : 48,
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
    letterSpacing: -0.3,
  },
  successSubtitle: {
    textAlign: 'center',
    marginBottom: isSmallDevice ? 20 : 24,
    lineHeight: 24,
    fontSize: isSmallDevice ? 14 : 15,
  },
  detailsCard: {
    width: '100%',
    padding: isSmallDevice ? 16 : 20,
    borderRadius: 16,
    marginBottom: isSmallDevice ? 28 : 32,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsHeaderText: {
    marginLeft: 8,
    fontSize: isSmallDevice ? 14 : 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 4,
  },
  detailsRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailsLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailsValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  continueButtonText: {
    fontWeight: '700',
    fontSize: isSmallDevice ? 17 : 18,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
