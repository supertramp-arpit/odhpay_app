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
  Platform,
  StatusBar,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRegisterStore } from "../../store";
import { getIntegrityToken } from "../utils/integrity";


const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

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
  };

  const iconByType = {
    success: <Ionicons name="checkmark-circle" size={48} color={colorByType.success} />,
    warning: <Ionicons name="warning" size={48} color={colorByType.warning} />,
    error: <Ionicons name="close-circle" size={48} color={colorByType.error} />,
    info: <Ionicons name="information-circle" size={48} color={colorByType.info} />,
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

function RazorpayPayScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const route = useRoute();

  const autoStart = route.params?.autoStart ?? false;
  const origin = route.params?.origin || null;
  const returnTo = route.params?.returnTo || null;
  const payload = route.params?.payload || null;
  const amount = route.params?.amount;

  const user = useRegisterStore((state) => state.user);
  // console.log(user.user.MobileNumber)

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const openModal = (type, title, message) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message || "");
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const parseError = (e) => {
    console.log("RAW ERROR ===>", JSON.stringify(e?.response?.data || e));

    // Razorpay cancelled
    if (e?.description === "Payment Cancelled" || e?.reason === "payment_cancelled") {
      return { cancelled: true, message: "Payment cancelled by user." };
    }


    // Axios validation error (FastAPI style)
    if (e?.response?.status === 422 && Array.isArray(e.response?.data?.detail)) {
      const first = e.response.data.detail[0];

      // Build readable field name
      let field = "";
      if (Array.isArray(first.loc)) {
        field = first.loc[first.loc.length - 1]; // last element
      }

      return {
        cancelled: false,
        message: `${field?.replace(/_/g, " ")}: ${first.msg}` // "subscriber id: Field required"
      };
    }

    // Other Axios server errors
    if (e?.response?.data) {
      return {
        cancelled: false,
        message:
          e.response.data.message ||
          e.response.data.error ||
          JSON.stringify(e.response.data)
      };
    }

    // Network error
    if (e?.message === "Network Error") {
      return { cancelled: false, message: "Network error, please check your internet." };
    }

    // Unknown error
    return {
      cancelled: false,
      message: e?.message || "Something went wrong. Please try again."
    };
  };


  /**
   * Build dynamic payload based on service_type and provided data
   * Only includes fields that are passed in the navigation params
   */
  const buildDynamicPayload = useCallback(() => {
    if (!payload) {
      return {
        amount: Number(amount),
        service_type: "BBPS",
        service_metadata: {}
      };
    }

    const serviceType = String(payload?.service_type || "BBPS");
    const basedPayload = {
      amount: Number(payload?.amount || amount),
      service_type: serviceType,
    };

    // Add service-specific fields based on service_type
    switch (serviceType.toLowerCase()) {
      case "MobileRecharge":
        return {
          ...basedPayload,
          ...(payload?.operator_code && { operator_code: String(payload.operator_code) }),
          ...(payload?.mobile_number && { mobile_number: String(payload.mobile_number) }),
          ...(payload?.UserMobileNumber && { mobile_number: String(payload.UserMobileNumber) }),
          ...(payload?.recharge_data && { recharge_data: payload.recharge_data }),
          ...(payload?.purpose && { purpose: String(payload.purpose) }),
          service_metadata: payload?.service_metadata || {}
        };

      case "DTH":
        return {
          ...basedPayload,
          ...(payload?.subscriber_id && { subscriber_id: String(payload.subscriber_id) }),
          ...(payload?.operator_code && { operator_code: String(payload.operator_code) }),
          ...(payload?.dth_data && { dth_data: payload.dth_data }),
          ...(payload?.purpose && { purpose: String(payload.purpose) }),
          service_metadata: payload?.service_metadata || {}
        };

      case "BBPS":
        return {
          ...basedPayload,
          ...(payload?.biller_id && { biller_id: String(payload.biller_id) }),
          ...(payload?.category && { category: String(payload.category) }),
          ...(payload?.customer_reference && { customer_reference: String(payload.customer_reference) }),
          ...(payload?.bbps_data && { bbps_data: payload.bbps_data }),
          ...(payload?.purpose && { purpose: String(payload.purpose) }),
          service_metadata: payload?.service_metadata || {}
        };

      case "Prime_Activation":
        return {
          ...basedPayload,
          ...(payload?.user_id && { user_id: String(payload.user_id) }),
          ...(payload?.plan_id && { plan_id: String(payload.plan_id) }),
          ...(payload?.purpose && { purpose: String(payload.purpose) }),
          service_metadata: payload?.service_metadata || {}
        };


      default:
        // Generic structure for unknown service types
        return {
          ...basedPayload,
          // Include all additional fields from payload that aren't already set
          ...Object.keys(payload).reduce((acc, key) => {
            if (!['amount', 'service_type', 'service_metadata'].includes(key)) {
              acc[key] = payload[key];
            }
            return acc;
          }, {}),
          service_metadata: payload?.service_metadata || {}
        };
    }
  }, [payload, amount]);

  const openRazorpay = useCallback(async () => {
    if (loading) return;

    const access_token = await AsyncStorage.getItem('access_token');
    if (!access_token) {
      return;
    }

    const { token  , nonce } = await getIntegrityToken();

    try {
      setLoading(true);

      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
        "X-Integrity-Token": token,
        "X-Integrity-Nonce": nonce,
      };

      // Build dynamic payload based on service type
      const Payload_data = buildDynamicPayload();

      console.log("Dynamic Payload being sent:", Payload_data);
      const orderRes = await axios.post('https://newapi.odhpay.com/v2/payments/create', Payload_data, { headers });

      console.log("order creation response received is", orderRes?.data)

      const options = {
        key: orderRes?.data?.key_id,
        amount: orderRes?.data?.amount,
        currency: "INR",
        name: "ODHPAY",
        order_id: orderRes?.data?.gateway_order_id,
        description: `Payment of ₹${amount}`,
        image: require('../assets/odh.png'),
        prefill: orderRes?.data?.prefill,
        theme: { color: "#5F259F" },
        retry: { enabled: true, max_count: 1 },
        modal: { confirm_close: true },
      };

      const razorpayRes = await RazorpayCheckout.open(options);
      console.log("Payment Success:", razorpayRes);

      // Navigate to transaction success screen with transaction details
      navigation.navigate("TransactionSuccess", {
        razorpay_payment_id: razorpayRes?.razorpay_payment_id,
        razorpay_order_id: razorpayRes?.razorpay_order_id,
        gateway_order_id: orderRes?.data?.gateway_order_id,
        amount: orderRes?.data?.amount,
        biller_name: payload?.biller_name || "N/A",
        service_type: payload?.service_type || "Payment",
        client_txn_id: orderRes?.data?.client_txn_id,
      });
    } catch (e) {
      const info = parseError(e);
      if (info.cancelled) {
        openModal("warning", "Payment Cancelled", "You closed the checkout before completing.");
      } else {
        openModal("error", "Payment Failed", info.message || "Please try again.");
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [loading, buildDynamicPayload, payload, amount]);




  const onPrimary = () => {
    const isSuccess = modalType === "success";
    closeModal();
    if (isSuccess) navigation.goBack();
  };

  return (
    <View style={styles.container}>

      <View style={styles.backgroundDecor}>
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
      </View>

      <Animated.View style={[styles.purpleSection, { opacity: fadeAnim }]}>


        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="wallet" size={isSmallDevice ? 28 : 32} color="#fff" />
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>Secure Payment</Text>
          <Text style={styles.subtitle}>Complete your payment securely with Razorpay</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <View style={styles.amountDisplay}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <Text style={styles.amountText}>{amount.toFixed(2)}</Text>
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

        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={openRazorpay}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="wallet-outline" size={18} color="#fff" />
              <Text style={styles.payButtonText}>Pay ₹{amount.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.agreementText}>
          Your payment is encrypted and secure
        </Text>
      </Animated.View>

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

export default RazorpayPayScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5F259F",
  },
  backgroundDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.15,
  },
  blob1: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: "#fff",
    top: -width * 0.4,
    right: -width * 0.3,
  },
  blob2: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: "#fff",
    bottom: -width * 0.2,
    left: -width * 0.25,
  },
  purpleSection: {
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
    marginTop: Platform.OS === "ios" ? 50 : 16,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },
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
  titleSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: isSmallDevice ? 22 : 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: isSmallDevice ? 12 : 13,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 18,
  },

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

  amountSection: {
    alignItems: "center",
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  amountDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  rupeeSymbol: {
    fontSize: 22,
    fontWeight: "700",
    color: "#5F259F",
    marginRight: 3,
  },
  amountText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.5,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  securityText: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 14,
  },

  detailsSection: {
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "700",
  },
  detailValueGreen: {
    fontSize: 13,
    color: "#10b981",
    fontWeight: "800",
  },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  methodText: {
    fontSize: 11,
    color: "#5F259F",
    fontWeight: "600",
  },

  featuresSection: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
    justifyContent: "center",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  featureText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },

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
  payButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },

  agreementText: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 15,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
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
  iconBadge: {
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  modalMessage: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});