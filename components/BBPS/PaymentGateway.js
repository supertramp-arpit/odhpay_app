import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  BackHandler,
  Linking,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { getQueryParam } from "../../utils/helper";

const { width } = Dimensions.get("window");
const isSmallDevice = width < 375;

/** ---- Reusable Notice Modal ---- */
const NoticeModal = ({
  visible,
  type = "info",
  title,
  message,
  primaryText = "OK",
  secondaryText,
  onPrimary,
  onSecondary,
  onRequestClose,
}) => {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.9);
    }
  }, [visible]);

  const colorByType = {
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#5F259F",
    pending: "#6366f1",
  };

  const iconByType = {
    success: <Ionicons name="checkmark-circle" size={48} color={colorByType.success} />,
    warning: <Ionicons name="warning" size={48} color={colorByType.warning} />,
    error: <Ionicons name="close-circle" size={48} color={colorByType.error} />,
    info: <Ionicons name="information-circle" size={48} color={colorByType.info} />,
    pending: <Ionicons name="time-outline" size={48} color={colorByType.pending} />,
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onRequestClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={styles.backdrop} onPress={onRequestClose} />
      </Animated.View>

      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View style={[styles.modalCard, { transform: [{ scale }] }]}>
          <View style={styles.iconBadge}>{iconByType[type]}</View>
          <Text style={styles.modalTitle}>{title}</Text>
          {message ? <Text style={styles.modalMessage}>{message}</Text> : null}

          <View style={styles.actionsRow}>
            {!!secondaryText && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={onSecondary}>
                <Text style={styles.secondaryText}>{secondaryText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colorByType[type] }]}
              onPress={onPrimary}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryText}>{primaryText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

/** ---- Screen ---- */
function PayWithSabpaisa() {
  const navigation = useNavigation();
  const route = useRoute();

  const webviewRef = useRef(null);
  const [confirmBackVisible, setConfirmBackVisible] = useState(false);
  const [wvCanGoBack, setWvCanGoBack] = useState(false);

  const [loading, setLoading] = useState(false);

  // Notice modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // WebView (SabPaisa) state
  const [payVisible, setPayVisible] = useState(false);
  const [spPost, setSpPost] = useState({ clientCode: "", encData: "", paymentUrl: "" });
  const [wvLoading, setWvLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const verifyTimerRef = useRef(null);

  // Params
  const autoStart = !!route.params?.autoStart;
  const origin = route.params?.origin || null;
  const returnTo = route.params?.returnTo || null;
  const payload = route.params?.payload || null;
  const amount = route.params?.amount;


  const InitialAMount = route.params?.InitialAMount;
  const ServiceType = route.params?.payload?.service_type;
  const Purpose = route.params?.payload?.purpose;
  const operatorName = route.params?.payload?.recipient_name;
  const mobileNumber = route.params?.payload?.mobile_number;

  console.log("this is amt", InitialAMount, amount, ServiceType, Purpose, operatorName, mobileNumber)

  // ================================================================================
  // Fetch Status 
  // ================================================================================

  const fetchStatusResponse = async (reference_id) => {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) {
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const { data } = await axios.get(
        `https://newapi.odhpay.com/service/status/${reference_id}`,
        { headers }
      );

      console.log(data);

      // normalize
      const state = String(data?.status || "").toLowerCase(); // "success" | "pending" | "failed" etc.

      if (state === "completed") {
        setModalType("success");
        setModalTitle("Payment Successful");
        setModalMessage(`Txn Ref: ${reference_id}`);
      } else if (state === "paid") {
        setModalType("pending");
        setModalTitle("Payment Processing");
        setModalMessage("We're still waiting for confirmation.");
      } else {
        setModalType("pending");
        setModalTitle("Payment Not Completed");
        setModalMessage("Your payment is Pending.");
      }
      setModalVisible(true);

    } catch (error) {
      setModalType("error");
      setModalTitle("Status Check Failed");
      setModalMessage(error?.response?.data?.detail || error.message || "Please try again.");
      setModalVisible(true);
    }
  }


  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // Cleanup verify timer on unmount
  useEffect(() => {
    return () => {
      if (verifyTimerRef.current) {
        clearTimeout(verifyTimerRef.current);
      }
    };
  }, []);

  // Auto-start guard (only once)
  const didAutoStart = useRef(false);
  useEffect(() => {
    if (!autoStart || didAutoStart.current) return;
    didAutoStart.current = true;
    setTimeout(() => openSabPaisa(), 0);
    navigation.setParams?.({ autoStart: false }); // prevent reopen on back/refresh
  }, [autoStart, navigation]);

  // Android back button closes the WebView modal first
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (payVisible) {
        setConfirmBackVisible(true);  // show confirm dialog
        return true;                  // we handled it
      }
      return false;
    });
    return () => sub.remove();
  }, [payVisible]);

  const openModal = (type, title, message) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message || "");
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);
  const onPrimary = () => {
    const isSuccess = modalType === "success";
    closeModal();
    if (isSuccess) {
      if (returnTo) navigation.navigate(returnTo, { paid: true, origin, payload });
      else navigation.goBack();
    }
  };


  // Build HTML that auto-POSTs to SabPaisa
  const buildSabPaisaFormHTML = (clientCode, encData, paymentUrl) => `
<!doctype html><html><head><meta charset="utf-8"/></head>
<body>
  <form id="sp" method="POST" action=${JSON.stringify(paymentUrl)}>
    <input type="hidden" name="clientCode" value=${JSON.stringify(clientCode)} />
    <input type="hidden" name="encData"   value=${JSON.stringify(encData)} />
  </form>
  <script>document.getElementById('sp').submit();</script>
</body></html>`;


  // Detect success/cancel
  const CALLBACK_PATH = "success";           // <-- match backend callback
  const CANCEL_REGEX = /(cancel|failed|failure)/i;      // tweak if needed

  const handledRef = useRef(false);

  const handleNavChange = async (nav) => {
    const url = nav?.url || "";
    if (!url || handledRef.current) return;

    if (url.includes(CALLBACK_PATH)) {
      handledRef.current = true;
      const trxReference = getQueryParam(url, "trx") || getQueryParam(url, "txn");
      setPayVisible(false);
      // Show loader for 3 seconds, then fetch status
      setVerifying(true);
      verifyTimerRef.current = setTimeout(async () => {
        try {
          await fetchStatusResponse(trxReference);
        } finally {
          setVerifying(false);
        }
      }, 3000);
      return;
      openModal("info", "Processing payment…", "Please wait while we verify the transaction.");
      await fetchStatusResponse(trxReference);
      return;
    }

    if (CANCEL_REGEX.test(url)) {
      handledRef.current = true;
      setPayVisible(false);
      openModal("warning", "Payment Not Completed", "You cancelled the payment.");
    }
  };


  /** --- MAIN: Open SabPaisa (called on button press or guarded auto-start) --- */
  const openSabPaisa = useCallback(async () => {
    handledRef.current = false;
    if (loading) return;
    setLoading(true);

    const showInitError = (msg = "Could not start payment. Please try again.") =>
      openModal("error", "Payment Init Failed", msg);

    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        showInitError("You are not logged in. Please re-login.");
        return;
      }


      let ContentBody;
      if (ServiceType === "Prime_Activation") {
        const amtNum = Number(amount);
        const amt = Math.round(amtNum * 100) / 100;

        ContentBody = {
          amount: amt,
          service_type: ServiceType,
          "toBePaidAmount": amt,
        }
      } else if (ServiceType === "MobileRecharge") {


        const InitialAMount1 = Number(InitialAMount);
        const formatInital = Math.round(InitialAMount1 * 100) / 100;

        const amount1 = Number(amount);
        const formatAmount = Math.round(amount1 * 100) / 100;


        ContentBody = {
          "amount": formatInital,
          "toBePaidAmount": formatAmount,
          "service_type": ServiceType,
          "purpose": Purpose,
          "operator_code": operatorName,
          "mobile_number": mobileNumber,
          "service_metadata": {}
        }
      }

      console.log(ContentBody)

      const authHeaders = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };

      // ensure numeric with two decimals but send as NUMBER, not string
      // const amtNum = Number(amount);
      // const amt = Math.round(amtNum * 100) / 100; // 21.91
      // 1) Try JSON first
      let response;
      try {
        response = await axios.post(
          "https://newapi.odhpay.com/payment/create", ContentBody
          ,
          { headers: { "Content-Type": "application/json", ...authHeaders } }
        );
      } catch (jsonErr) {
        // 2) If JSON failed, try application/x-www-form-urlencoded (many FastAPI handlers expect this)
        const urlEncoded = new URLSearchParams();
        urlEncoded.append("amount", String(amount));

        try {
          response = await axios.post(
            "https://newapi.odhpay.com/payment/create",
            urlEncoded.toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded", ...authHeaders } }
          );
        } catch (formErr) {
          const serverMsg =
            formErr?.response?.data?.detail ||
            formErr?.response?.data?.message ||
            formErr?.response?.data?.error ||
            formErr?.message;
          console.log("Create-payment (both attempts) failed:", serverMsg, formErr?.response?.data);
          showInitError(typeof serverMsg === "string" ? serverMsg : "Network or server error.");
          return;
        }
      }

      // Inspect the raw data
      console.log("Create-payment response:", response?.status, response?.data);

      // 3) Accept flexible shapes:
      //    { status: "success", clientCode, encData, paymentUrl }
      //    { data: { clientCode, encData, paymentUrl }, status: "success" }
      //    { clientCode, encData, paymentUrl } (no status)
      const data = response?.data || {};
      const status = data?.status || data?.result || data?.success; // try a few keys
      const payload =
        data?.data && (data?.data?.clientCode || data?.data?.encData)
          ? data.data
          : data;

      const clientCode = payload?.clientCode || payload?.client_code;
      const encData = payload?.encData || payload?.enc_data || payload?.enc;
      const paymentUrl = payload?.paymentUrl || payload?.payment_url || payload?.url;

      const looksOk =
        (status === "success" || typeof status === "undefined") && clientCode && encData;

      if (!looksOk) {
        // Surface specific backend message if available
        const serverMsg =
          data?.detail || data?.message || data?.error || "Server didn’t return expected fields.";
        console.log("Init not OK. Parsed:", { status, clientCode, encData, paymentUrl }, "Raw:", data);
        showInitError(typeof serverMsg === "string" ? serverMsg : undefined);
        return;
      }

      setSpPost({
        clientCode,
        encData,
        paymentUrl: paymentUrl || "https://securepay.sabpaisa.in/sabPaisa/sabPaisaInit?v=1",
      });
      setPayVisible(true); // open WebView modal

    } catch (e) {
      console.log("Create-payment unexpected error:", e);
      const serverMsg =
        e?.response?.data?.detail || e?.response?.data?.message || e?.message;
      showInitError(typeof serverMsg === "string" ? serverMsg : undefined);
    } finally {
      setLoading(false);
    }
  }, [loading, amount]);


  return (
    <View style={styles.container}>

      {/* BG */}
      <View style={styles.backgroundDecor}>
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
      </View>

      {/* Header */}
      <Animated.View style={[styles.purpleSection, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="wallet" size={isSmallDevice ? 28 : 32} color="#fff" />
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>Secure Payment</Text>
          <Text style={styles.subtitle}>Complete your payment securely with SabPaisa</Text>
        </View>
      </Animated.View>

      {/* Card */}
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <View style={styles.amountDisplay}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <Text style={styles.amountText}>{Number(amount).toFixed(2)}</Text>
          </View>
          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#10b981" />
            <Text style={styles.securityText}>Secured Payment</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <View style={styles.methodBadge}>
              <MaterialCommunityIcons name="credit-card-outline" size={13} color="#5F259F" />
              <Text style={styles.methodText}>Cards, UPI</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Merchant</Text>
            <Text style={styles.detailValue}>ODHPAY</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction Fee</Text>
            <Text style={styles.detailValueGreen}>FREE</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <Ionicons name="lock-closed" size={14} color="#5F259F" />
            <Text style={styles.featureText}>Encrypted</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={14} color="#5F259F" />
            <Text style={styles.featureText}>PCI Compliant</Text>
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={openSabPaisa}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="wallet-outline" size={18} color="#fff" />
              <Text style={styles.payButtonText}>Pay ₹{Number(amount).toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>


        <Text style={styles.agreementText}>Your payment is encrypted and secure</Text>
      </Animated.View>

      {/* SabPaisa WebView Modal */}
      <Modal visible={payVisible} animationType="slide" onRequestClose={() => setConfirmBackVisible(true)}>
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <WebView
            ref={webviewRef}
            originWhitelist={["*"]}
            source={{ html: buildSabPaisaFormHTML(spPost.clientCode, spPost.encData, spPost.paymentUrl) }}
            onLoadStart={() => setWvLoading(true)}
            onLoadEnd={() => setWvLoading(false)}
            onNavigationStateChange={handleNavChange}
            startInLoadingState


            // ⬇️ THIS IS THE FIX: UPI INTENT HANDLER
            onShouldStartLoadWithRequest={(request) => {
              const url = request?.url ?? "";

              if (
                url.startsWith("upi://") ||
                url.startsWith("gpay://") ||
                url.startsWith("phonepe://") ||
                url.startsWith("paytmmp://") ||
                url.startsWith("credpay://") ||
                url.startsWith("mobikwik://")
              ) {
                console.log("Opening external UPI app:", url);
                Linking.openURL(url).catch(() => {
                  openModal("error", "Unable to open app", "Please install a valid UPI app.");
                });
                return false; // STOP WebView — let the app handle now
              }

              

              return true; // allow normal pages (HTML, JS, redirects, etc.)
            }}
          />
          {wvLoading && (
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: "#5F259F" }} />
          )}

        </View>
      </Modal>


      {/* Are You sure to Exit confirmBackVisible */}
      <Modal
        visible={confirmBackVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmBackVisible(false)}
      >
        <View style={[styles.backdrop, { justifyContent: "center", alignItems: "center", }]}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Cancel this payment?</Text>
            <Text style={styles.confirmText}>
              Do you want to go back in the payment flow? This may cancel the current attempt.
            </Text>

            <View style={{ flexDirection: "row",justifyContent:"center", gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.secondaryBtn]}
                onPress={() => setConfirmBackVisible(false)}
              >
                <Text style={styles.secondaryText}>No, stay</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, {  backgroundColor: "#ef4444" }]}
                onPress={() => {
                  setConfirmBackVisible(false);
                  setPayVisible(false); // <-- Always close the WebView modal
                  openModal("warning", "Payment Not Completed", "You cancelled the payment.");
                }}
              >
                <Text style={styles.primaryText}>Yes, go back</Text>
              </TouchableOpacity>
              
            </View>
          </View>
        </View>
      </Modal>



      {/* Verifying overlay loader */}
      <Modal visible={verifying} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.backdrop} />
        <View style={styles.centerWrap}>
          <View style={styles.modalCard}>
            <ActivityIndicator size="large" color="#5F259F" />
            <Text style={{ marginTop: 12, fontSize: 16, fontWeight: "700", color: "#111827",textAlign:"center" }}>Verifying Payment…</Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: "#6b7280",textAlign:"center" }}>This may take a few seconds</Text>
          </View>
        </View>
      </Modal>

      {/* Notice modal  modalVisible */}
      <NoticeModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        primaryText={modalType === "success" ? "Done" : "OK"}
        secondaryText={modalType === "success" ? undefined : "Close"}
        onPrimary={onPrimary}
        onSecondary={closeModal}
        onRequestClose={closeModal}
      />
    </View>
  );
}

export default PayWithSabpaisa;

/** ---- styles (unchanged from yours) ---- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#5F259F" },
  backgroundDecor: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blob: { position: "absolute", borderRadius: 9999, opacity: 0.15 },
  blob1: { width: width * 0.8, height: width * 0.8, backgroundColor: "#fff", top: -width * 0.4, right: -width * 0.3 },
  blob2: { width: width * 0.6, height: width * 0.6, backgroundColor: "#fff", bottom: -width * 0.2, left: -width * 0.25 },
  purpleSection: { paddingBottom: 16 },
  logoContainer: { alignItems: "center", marginTop: 16, marginBottom: 12 },
  logoCircle: {
    width: isSmallDevice ? 70 : 80,
    height: isSmallDevice ? 70 : 80,
    borderRadius: isSmallDevice ? 35 : 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  titleSection: { paddingHorizontal: 24, marginBottom: 24 },
  title: { fontSize: isSmallDevice ? 22 : 26, fontWeight: "800", color: "#fff", marginBottom: 6, textAlign: "center", letterSpacing: 0.5 },
  subtitle: { fontSize: isSmallDevice ? 12 : 13, color: "rgba(255, 255, 255, 0.9)", textAlign: "center", lineHeight: 18 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: "space-between",
  },
  amountSection: { alignItems: "center", marginBottom: 12 },
  amountLabel: { fontSize: 12, color: "#6b7280", fontWeight: "600", marginBottom: 8, letterSpacing: 0.3 },
  amountDisplay: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  rupeeSymbol: { fontSize: 22, fontWeight: "700", color: "#5F259F", marginRight: 3 },
  amountText: { fontSize: 28, fontWeight: "900", color: "#111827", letterSpacing: -0.5 },
  securityBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#ecfdf5", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  securityText: { fontSize: 11, color: "#059669", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 14 },
  detailsSection: { marginBottom: 4 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  detailLabel: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  detailValue: { fontSize: 13, color: "#111827", fontWeight: "700" },
  detailValueGreen: { fontSize: 13, color: "#10b981", fontWeight: "800" },
  methodBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#f3f4f6", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  methodText: { fontSize: 11, color: "#5F259F", fontWeight: "600" },
  featuresSection: { flexDirection: "row", gap: 14, marginBottom: 14, justifyContent: "center" },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  featureText: { fontSize: 11, color: "#6b7280", fontWeight: "500" },
  payButton: {
    backgroundColor: "#5F259F",
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#5F259F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },
  payButtonDisabled: { backgroundColor: "#D1D5DB", shadowOpacity: 0, elevation: 0 },
  payButtonText: { fontSize: 16, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  agreementText: { fontSize: 11, color: "#6B7280", textAlign: "center", lineHeight: 15 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  centerWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  iconBadge: { alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827", textAlign: "center", marginBottom: 10, letterSpacing: 0.3 },
  modalMessage: { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  actionsRow: { flexDirection: "row", justifyContent: "center",alignItems:"center", gap: 10 },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryText: { color: "#374151", fontSize: 14, fontWeight: "700", textAlign: "center" },
  primaryBtn: { paddingHorizontal:20,paddingVertical:10,borderRadius:10 },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 0.3, textAlign: "center" },
  debugText: { fontSize: 11, color: "#6B7280", textAlign: "center", marginBottom: 6 },





  // ⬇️ Add to your StyleSheet at the bottom
  confirmBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmCard: {
    width: "90%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.3,

  },
  confirmText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal:20
  },

  // Optional: unify button row spacing for older RN versions where `gap` is flaky
  confirmActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
  },
  confirmBtnSpacer: { width: 10 },

});

