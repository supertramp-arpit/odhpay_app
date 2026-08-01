// Investment QR payment screen — shown after POST /invest {payment_method:"icici_qr"}.
// Renders the ICICI UPI QR + app intent buttons, polls /status/{reference_id}
// every 5s, and flips to the success state once the UPI poller activates the
// investment. Route params: { invest, planName, monthlyPayout }.
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import { CheckCircle2, ChevronLeft, FileDown, Info, XCircle } from "lucide-react-native";
import {
  color,
  space,
  radius,
  type,
  tabularNums,
  elevation,
  hitSlop8,
} from "../../theme/tokens";
import { formatINR } from "../../utils/helper";
import { downloadInvestmentCertificate } from "../../utils/certificate";

const BASE_URL = "https://newapi.odhpay.com";

// Investment promo palette — shared visual language with the investment feature
const PROMO = {
  deepGreen: "#03170F",
  mint: "#8CE0BE",
  gold: "#F5B63F",
};

// UPI intent options — app-specific schemes carry the same upi:// query.
// "More apps" fires the generic intent, so MobiKwik & co. appear in the chooser.
const UPI_APPS = [
  { key: "phonepe", name: "PhonePe", scheme: "phonepe://pay", logo: require("../../assets/upi_phonepe.png") },
  { key: "gpay", name: "GPay", scheme: "tez://upi/pay", logo: require("../../assets/upi_gpay.png") },
  { key: "paytm", name: "Paytm", scheme: "paytmmp://pay", logo: require("../../assets/upi_paytm.png") },
  { key: "other", name: "More apps", scheme: null, logo: require("../../assets/upi_upi.png") },
];

const authHeaders = async () => {
  const token = await AsyncStorage.getItem("access_token");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const dateLabel = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const InvestmentQRScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { invest, planName, monthlyPayout } = route.params || {};

  const [phase, setPhase] = useState("paying"); // paying | success | failed
  const [statusData, setStatusData] = useState(null);
  const [certBusy, setCertBusy] = useState(false);
  const pollRef = useRef(null);

  const onDownloadCertificate = async () => {
    if (certBusy) return;
    setCertBusy(true);
    try {
      await downloadInvestmentCertificate(referenceId);
    } catch (e) {
      Alert.alert("Certificate", e?.message || "Download failed — try again");
    } finally {
      setCertBusy(false);
    }
  };

  const amount = Number(invest?.amount || 0);
  const qrString = invest?.qr?.qr_string || null;
  const referenceId = invest?.reference_id;

  useEffect(() => {
    if (!referenceId) return undefined;
    pollRef.current = setInterval(async () => {
      try {
        const headers = await authHeaders();
        const res = await axios.get(
          `${BASE_URL}/api/v1/investment/status/${referenceId}`,
          { headers }
        );
        const status = res.data?.status;
        if (status === "active") {
          clearInterval(pollRef.current);
          setStatusData(res.data);
          setPhase("success");
        } else if (status === "failed" || status === "expired") {
          clearInterval(pollRef.current);
          setPhase("failed");
        }
      } catch (e) {
        // transient — keep polling
      }
    }, 5000);
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [referenceId]);

  const openUpiApp = useCallback(
    async (app) => {
      if (!qrString) return;
      const query = qrString.split("?")[1] || "";
      const url = app.scheme ? `${app.scheme}?${query}` : qrString;
      try {
        await Linking.openURL(url);
      } catch (e) {
        if (app.scheme) {
          try {
            await Linking.openURL(qrString); // fall back to the system UPI chooser
            return;
          } catch (e2) {
            // fall through
          }
        }
        Alert.alert(
          "Couldn't open UPI app",
          `${app.name} doesn't appear to be installed. Scan the QR from another device or choose a different app.`
        );
      }
    },
    [qrString]
  );

  const cancelPayment = () => {
    Alert.alert(
      "Cancel this payment?",
      "If you've already paid, stay on this screen — your investment activates automatically.",
      [
        { text: "Stay", style: "cancel" },
        { text: "Cancel payment", style: "destructive", onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={color.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={phase === "paying" ? cancelPayment : () => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={hitSlop8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={color.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {phase === "success" ? "Investment active" : "Complete payment"}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {phase === "paying" && (
          <>
            {/* Pay card */}
            <View style={styles.payCard}>
              <Text style={styles.payLabel}>Scan to pay</Text>
              <Text style={styles.payAmount}>{formatINR(amount, { decimals: 0 })}</Text>
              <Text style={styles.payPlan}>{planName || "ODH Pay project"}</Text>

              {qrString ? (
                <View style={styles.qrWrap}>
                  <QRCode value={qrString} size={216} />
                </View>
              ) : (
                <View style={styles.errorBox}>
                  <Info size={16} color={color.errorFg} />
                  <Text style={styles.errorBoxText}>
                    QR could not be generated. Go back and pay from wallet balance.
                  </Text>
                </View>
              )}

              <Text style={styles.referenceText}>Ref: {referenceId}</Text>
            </View>

            {/* UPI intent options */}
            {qrString && (
              <>
                <Text style={styles.upiAppsLabel}>Or pay directly using</Text>
                <View style={styles.upiAppsRow}>
                  {UPI_APPS.map((app) => (
                    <TouchableOpacity
                      key={app.key}
                      style={styles.upiAppTile}
                      onPress={() => openUpiApp(app)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Pay using ${app.name}`}
                    >
                      <Image source={app.logo} style={styles.upiAppLogo} resizeMode="contain" />
                      <Text style={styles.upiAppName}>{app.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Waiting */}
            <View style={styles.waitPill}>
              <ActivityIndicator size="small" color={PROMO.mint} />
              <Text style={styles.waitText}>Waiting for payment confirmation…</Text>
            </View>
            <Text style={styles.keepOpenNote}>
              Keep this screen open — your investment activates automatically once
              the payment is confirmed.
            </Text>

            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={cancelPayment}
              accessibilityRole="button"
              accessibilityLabel="Cancel payment"
            >
              <Text style={styles.ghostBtnText}>Cancel payment</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === "success" && (
          <>
            <View style={styles.successCard}>
              <CheckCircle2 size={52} color={PROMO.mint} strokeWidth={1.5} />
              <Text style={styles.successTitle}>Investment active</Text>
              <Text style={styles.successAmount}>
                {formatINR(amount, { decimals: 0 })}
              </Text>
              <Text style={styles.successPlan}>{planName || "ODH Pay project"}</Text>

              <View style={styles.successDivider} />

              {[
                ["Reference", referenceId],
                ["Maturity date", dateLabel(statusData?.maturity_date)],
                monthlyPayout
                  ? ["Monthly payout", formatINR(Number(invest?.monthly_payout || 0))]
                  : [
                      "Maturity value",
                      statusData?.maturity_amount
                        ? formatINR(Number(statusData.maturity_amount))
                        : formatINR(Number(invest?.maturity_amount || 0)),
                    ],
              ].map(([k, v]) => (
                <View key={k} style={styles.successRow}>
                  <Text style={styles.successKey}>{k}</Text>
                  <Text style={styles.successValue} numberOfLines={1}>
                    {v}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.certBtn}
              onPress={onDownloadCertificate}
              disabled={certBusy}
              accessibilityRole="button"
              accessibilityLabel="Download investment certificate PDF"
              accessibilityState={{ busy: certBusy }}
            >
              {certBusy ? (
                <ActivityIndicator size="small" color={color.text} />
              ) : (
                <FileDown size={18} color={color.text} strokeWidth={1.8} />
              )}
              <Text style={styles.certBtnText}>Download certificate (PDF)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate("Wallet")}
              accessibilityRole="button"
              accessibilityLabel="Done, go to wallet"
            >
              <Text style={styles.primaryBtnText}>Done</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === "failed" && (
          <>
            <View style={styles.failCard}>
              <XCircle size={52} color={color.error} strokeWidth={1.5} />
              <Text style={styles.failTitle}>Payment not completed</Text>
              <Text style={styles.failSub}>
                The payment failed or expired. No money was invested. If you were
                charged, it will be reversed by your bank.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <Text style={styles.primaryBtnText}>Try again</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { ...type.h3, color: color.text },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: space.base,
    paddingBottom: space.giant,
  },

  /* paying */
  payCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.lg,
    alignItems: "center",
    marginTop: space.sm,
    ...elevation.level1,
  },
  payLabel: {
    ...type.micro,
    color: color.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  payAmount: {
    ...type.display,
    ...tabularNums,
    color: color.text,
    marginTop: space.xs,
  },
  payPlan: {
    ...type.bodySm,
    color: color.textSecondary,
    marginTop: space.xxs,
  },
  qrWrap: {
    padding: space.base,
    backgroundColor: color.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    marginTop: space.lg,
  },
  referenceText: {
    ...type.caption,
    ...tabularNums,
    color: color.textTertiary,
    marginTop: space.md,
  },

  upiAppsLabel: {
    ...type.micro,
    color: color.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
    marginTop: space.xl,
  },
  upiAppsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: space.sm,
    marginTop: space.sm,
  },
  upiAppTile: {
    minWidth: 72,
    minHeight: 56,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.white,
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
  },
  upiAppLogo: { width: 56, height: 20 },
  upiAppName: { ...type.micro, color: color.textSecondary },

  waitPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: space.sm,
    marginTop: space.xl,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.pill,
    backgroundColor: PROMO.deepGreen,
  },
  waitText: { ...type.bodySm, color: PROMO.mint },
  keepOpenNote: {
    ...type.caption,
    color: color.textTertiary,
    textAlign: "center",
    marginTop: space.md,
    paddingHorizontal: space.xl,
  },

  ghostBtn: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.lg,
  },
  ghostBtnText: { ...type.buttonSm, color: color.textSecondary },

  /* success */
  successCard: {
    backgroundColor: PROMO.deepGreen,
    borderRadius: radius.lg,
    padding: space.xl,
    alignItems: "center",
    marginTop: space.xl,
  },
  successTitle: {
    ...type.h2,
    color: color.textInverse,
    marginTop: space.md,
  },
  successAmount: {
    ...type.display,
    ...tabularNums,
    color: color.textInverse,
    marginTop: space.sm,
  },
  successPlan: {
    ...type.bodySm,
    color: PROMO.mint,
    marginTop: space.xxs,
  },
  successDivider: {
    alignSelf: "stretch",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginVertical: space.lg,
  },
  successRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: space.sm,
    gap: space.lg,
  },
  successKey: { ...type.bodySm, color: "rgba(255,255,255,0.6)" },
  successValue: {
    ...type.label,
    ...tabularNums,
    color: color.textInverse,
    flexShrink: 1,
  },

  /* failed */
  failCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.xl,
    alignItems: "center",
    marginTop: space.xl,
  },
  failTitle: { ...type.h3, color: color.text, marginTop: space.md },
  failSub: {
    ...type.bodySm,
    color: color.textSecondary,
    textAlign: "center",
    marginTop: space.sm,
  },

  certBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.borderStrong,
    backgroundColor: color.surface,
    marginTop: space.xl,
  },
  certBtnText: { ...type.buttonSm, color: color.text },
  primaryBtn: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: color.ink900,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.md,
  },
  primaryBtnText: { ...type.button, color: color.textInverse },

  errorBox: {
    flexDirection: "row",
    gap: space.sm,
    backgroundColor: color.errorBg,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.lg,
    alignItems: "flex-start",
  },
  errorBoxText: { ...type.bodySm, color: color.errorFg, flex: 1 },
});

export default InvestmentQRScreen;
