// Project Investment — plans, APY, and limits come from the backend
// (GET /api/v1/investment/plans, admin-managed). Funding paths:
//   • wallet balance  → PIN verify → POST /invest {payment_method:"wallet"}
//   • ICICI UPI QR    → POST /invest {payment_method:"icici_qr"} → render QR,
//     poll GET /status/{reference_id} until the UPI poller activates it.
// QR is only offered for amounts ≤ ₹1,00,000 (ICICI UPI limit, server-enforced).
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Info,
  QrCode,
  Wallet as WalletIcon,
  X,
} from "lucide-react-native";
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
import { getIntegrityToken } from "../../utils/integrity";
import { useWalletStore } from "../../store";

const BASE_URL = "https://newapi.odhpay.com";
const QR_LIMIT = 100000; // ≤ ₹1L may pay via UPI QR (ICICI limit)

// Fallbacks while the plan loads; real values come from the backend
const DEFAULT_PLAN = {
  id: null,
  name: "ODH Pay project",
  apy_rate: 7.5,
  min_amount: 10000,
  max_amount: 100000000,
  tenure_options: [1, 2, 3, 5],
};

// Investment promo palette — shared visual language with the wallet banner
// (emerald ground + gold growth accents; contained to this feature only)
const PROMO = {
  deepGreen: "#03170F",
  mint: "#8CE0BE",
  gold: "#F5B63F",
};

const REINVEST_OPTIONS = [
  "Re-invest capital & returns",
  "Re-invest capital only",
  "No re-investment",
];
const PAYOUT_OPTIONS = ["On maturity", "Monthly payout"];

/* ---------------- helpers ---------------- */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty",
  "Ninety",
];

const twoDigits = (n) =>
  n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;

const threeDigits = (n) => {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
};

const amountInWords = (value) => {
  const n = Math.floor(Math.abs(Number(value) || 0));
  if (n === 0) return "";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const below = n % 1000;
  const parts = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (below) parts.push(threeDigits(below));
  return `${parts.join(" ")} Rupees`;
};

const snapAmount = (raw, min, max) => {
  let step;
  if (raw < 100000) step = 5000;
  else if (raw < 1000000) step = 25000;
  else if (raw < 10000000) step = 100000;
  else step = 2500000;
  const snapped = Math.round(raw / step) * step;
  return Math.min(max, Math.max(min, snapped));
};

const maturityDateLabel = (years) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const compactINR = (n) =>
  n >= 10000000
    ? `₹${(n / 10000000).toLocaleString("en-IN")} Cr`
    : formatINR(n, { decimals: 0 });

const useCountUp = (target, duration = 450) => {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const frame = useRef(null);
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      reduceMotion.current = !!v;
    });
  }, []);

  useEffect(() => {
    if (reduceMotion.current) {
      displayRef.current = target;
      setDisplay(target);
      return undefined;
    }
    const from = displayRef.current;
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (target - from) * eased;
      displayRef.current = value;
      setDisplay(value);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => frame.current && cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return display;
};

const authHeaders = async () => {
  const token = await AsyncStorage.getItem("access_token");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

/* ---------------- slider ---------------- */

const THUMB = 28;

const AmountSlider = ({ amount, min, max, onChange, disabled }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const startPosRef = useRef(null);

  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const toPosition = useCallback(
    (a) => (Math.log(Math.min(max, Math.max(min, a))) - logMin) / (logMax - logMin),
    [min, max, logMin, logMax]
  );
  const toAmount = useCallback(
    (pos) => Math.exp(logMin + Math.min(1, Math.max(0, pos)) * (logMax - logMin)),
    [logMin, logMax]
  );

  // PanResponder is created once; refs keep the latest values readable inside it
  const latest = useRef({});
  latest.current = { amount, min, max, onChange, toPosition, toAmount, disabled };

  const position = toPosition(amount);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !latest.current.disabled,
      onMoveShouldSetPanResponder: () => !latest.current.disabled,
      onPanResponderGrant: () => {
        startPosRef.current = latest.current.toPosition(latest.current.amount);
      },
      onPanResponderMove: (_, gesture) => {
        const w = trackWidthRef.current;
        if (!w) return;
        const { toAmount: ta, onChange: oc, min: mn, max: mx } = latest.current;
        const pos = startPosRef.current + gesture.dx / w;
        oc(snapAmount(ta(pos), mn, mx));
      },
    })
  ).current;

  const onTrackPress = (e) => {
    if (disabled) return;
    const w = trackWidthRef.current;
    if (!w) return;
    const pos = e.nativeEvent.locationX / w;
    onChange(snapAmount(toAmount(pos), min, max));
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Investment amount slider"
      accessibilityValue={{ text: formatINR(amount, { decimals: 0 }) }}
      accessibilityActions={[
        { name: "increment", label: "Increase amount" },
        { name: "decrement", label: "Decrease amount" },
      ]}
      onAccessibilityAction={(e) => {
        const pos = toPosition(amount);
        const delta = e.nativeEvent.actionName === "increment" ? 0.04 : -0.04;
        onChange(snapAmount(toAmount(pos + delta), min, max));
      }}
    >
      <Pressable
        style={styles.sliderHitArea}
        onPress={onTrackPress}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setTrackWidth(w);
          trackWidthRef.current = w;
        }}
      >
        <View style={styles.sliderTrack}>
          <View
            style={[styles.sliderFill, { width: Math.max(THUMB / 2, position * trackWidth) }]}
          />
        </View>
        <View
          {...responder.panHandlers}
          hitSlop={hitSlop8}
          style={[
            styles.sliderThumb,
            { left: Math.max(0, position * trackWidth - THUMB / 2) },
          ]}
        >
          <View style={styles.sliderThumbRing} />
        </View>
      </Pressable>
      <View style={styles.sliderRange}>
        <Text style={styles.sliderRangeText}>{compactINR(min)}</Text>
        <Text style={styles.sliderRangeText}>{compactINR(max)}</Text>
      </View>
    </View>
  );
};

/* ---------------- option sheet ---------------- */

const OptionSheet = ({ visible, title, options, selected, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.sheetOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.sheetClose}
            hitSlop={hitSlop8}
            accessibilityRole="button"
            accessibilityLabel={`Close ${title}`}
          >
            <X size={18} color={color.text} />
          </TouchableOpacity>
        </View>
        {options.map((option) => {
          const active = option === selected;
          return (
            <TouchableOpacity
              key={option}
              style={styles.sheetOption}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option}
            >
              <Text style={[styles.sheetOptionText, active && styles.sheetOptionTextActive]}>
                {option}
              </Text>
              {active && <Check size={18} color={color.text} strokeWidth={2.5} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  </Modal>
);

const SelectRow = ({ label, value, onPress }) => (
  <TouchableOpacity
    style={styles.selectRow}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={`${label}: ${value}. Change`}
  >
    <View style={styles.selectRowBody}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.selectRowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
    <ChevronDown size={18} color={color.textSecondary} />
  </TouchableOpacity>
);

/* ---------------- screen ---------------- */

const ProjectInvestment = () => {
  const navigation = useNavigation();
  const { fetchBalance } = useWalletStore();

  // Plan (dynamic, admin-managed)
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState(null);
  const [plan, setPlan] = useState(null);

  const active = plan || DEFAULT_PLAN;
  const apy = Number(active.apy_rate);
  const minAmount = Math.round(Number(active.min_amount));
  const maxAmount = Math.round(Number(active.max_amount));
  const tenures = (active.tenure_options || []).map((y) => ({
    years: y,
    label: y === 1 ? "1 year" : `${y} years`,
  }));

  const [amount, setAmount] = useState(DEFAULT_PLAN.min_amount);
  const [amountText, setAmountText] = useState(String(DEFAULT_PLAN.min_amount));
  const [amountFocused, setAmountFocused] = useState(false);
  const [tenureYears, setTenureYears] = useState(DEFAULT_PLAN.tenure_options[0]);
  const [reinvest, setReinvest] = useState(REINVEST_OPTIONS[0]);
  const [payout, setPayout] = useState(PAYOUT_OPTIONS[0]);
  const [sheet, setSheet] = useState(null); // 'reinvest' | 'payout' | 'apy' | 'pay'

  // Payment flow
  const [payStep, setPayStep] = useState("review"); // review|pin|processing|qr|success
  const [payMethod, setPayMethod] = useState("wallet"); // 'wallet' | 'icici_qr'
  const [payError, setPayError] = useState(null);
  const [pinText, setPinText] = useState("");
  const [walletAvailable, setWalletAvailable] = useState(null);
  const [investResult, setInvestResult] = useState(null);
  const pollRef = useRef(null);

  const loadPlan = useCallback(async () => {
    setPlanLoading(true);
    setPlanError(null);
    try {
      const headers = await authHeaders();
      const res = await axios.get(`${BASE_URL}/api/v1/investment/plans`, { headers });
      const first = res.data?.plans?.[0];
      if (!first) throw new Error("no-plan");
      setPlan(first);
      const mn = Math.round(Number(first.min_amount));
      setAmount((a) => Math.min(Math.round(Number(first.max_amount)), Math.max(mn, a)));
      setAmountText((t) => {
        const n = Number(t) || 0;
        return String(Math.min(Math.round(Number(first.max_amount)), Math.max(mn, n)));
      });
      setTenureYears((y) =>
        (first.tenure_options || []).includes(y) ? y : first.tenure_options?.[0]
      );
    } catch (e) {
      setPlanError("Couldn't load investment plans");
    } finally {
      setPlanLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [loadPlan]);

  const monthlyPayout = payout === "Monthly payout";

  const projection = useMemo(() => {
    const years = tenureYears;
    if (monthlyPayout) {
      const monthly = (amount * (apy / 100)) / 12;
      return { maturity: amount, returns: monthly * years * 12, monthly };
    }
    const maturity = amount * Math.pow(1 + apy / 100, years);
    return { maturity, returns: maturity - amount, monthly: 0 };
  }, [amount, tenureYears, monthlyPayout, apy]);

  const animatedMaturity = useCountUp(projection.maturity);

  const setAmountEverywhere = useCallback((next) => {
    setAmount(next);
    setAmountText(String(next));
  }, []);

  const onInputChange = (text) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, 9);
    setAmountText(digits);
    const n = Number(digits);
    if (n >= minAmount && n <= maxAmount) setAmount(n);
  };

  const onInputBlur = () => {
    const n = Number(amountText) || 0;
    setAmountEverywhere(Math.min(maxAmount, Math.max(minAmount, n)));
  };

  const amountValid =
    Number(amountText) >= minAmount && Number(amountText) <= maxAmount;
  const qrEligible = amount <= QR_LIMIT;

  const words = useMemo(() => amountInWords(Number(amountText)), [amountText]);

  /* ---------- payment flow ---------- */

  const openPaySheet = async () => {
    setPayError(null);
    setPinText("");
    setInvestResult(null);
    setPayStep("review");
    setSheet("pay");
    try {
      const res = await fetchBalance();
      const bal = parseFloat(res?.available_balance ?? res?.balance ?? 0);
      setWalletAvailable(Number.isFinite(bal) ? bal : 0);
      setPayMethod(bal >= amount ? "wallet" : qrEligible ? "icici_qr" : "wallet");
    } catch (e) {
      setWalletAvailable(null);
    }
  };

  const closePaySheet = () => {
    if (payStep === "processing") return; // don't dismiss mid-flight
    if (pollRef.current) clearInterval(pollRef.current);
    setSheet(null);
  };

  const doInvest = async (method) => {
    setPayStep("processing");
    setPayError(null);
    try {
      let integrity = { token: "", nonce: "" };
      try {
        integrity = await getIntegrityToken();
      } catch (e) {
        // Backend enforces integrity in prod; proceed and let it decide
      }
      const headers = {
        ...(await authHeaders()),
        ...(integrity.token && { "x-integrity-token": integrity.token }),
        ...(integrity.nonce && { "x-integrity-nonce": integrity.nonce }),
      };
      const res = await axios.post(
        `${BASE_URL}/api/v1/investment/invest`,
        {
          plan_id: active.id,
          amount,
          tenure_years: tenureYears,
          reinvest_instruction: reinvest,
          payout_mode: monthlyPayout ? "monthly" : "on_maturity",
          payment_method: method,
        },
        { headers }
      );
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");
      setInvestResult(res.data);
      if (method === "wallet") {
        setPayStep("success");
      } else {
        setPayStep("qr");
        startPolling(res.data.reference_id);
      }
    } catch (e) {
      setPayError(
        e?.response?.data?.detail || e?.message || "Something went wrong — try again"
      );
      setPayStep("review");
    }
  };

  const startPolling = (referenceId) => {
    if (pollRef.current) clearInterval(pollRef.current);
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
          setInvestResult((prev) => ({ ...prev, ...res.data, status: "active" }));
          setPayStep("success");
        } else if (status === "failed" || status === "expired") {
          clearInterval(pollRef.current);
          setPayError("Payment was not completed. No money was invested.");
          setPayStep("review");
        }
      } catch (e) {
        // keep polling; transient errors are fine
      }
    }, 5000);
  };

  const verifyPinAndInvest = async () => {
    if (pinText.length < 4) return;
    setPayStep("processing");
    setPayError(null);
    try {
      const headers = await authHeaders();
      const res = await axios.post(
        `${BASE_URL}/register/verify_transaction_pin`,
        { pincode: pinText },
        { headers }
      );
      if (res.data?.success === false) throw new Error("Incorrect transaction PIN");
      await doInvest("wallet");
    } catch (e) {
      setPayError(
        e?.response?.data?.detail || e?.message || "PIN verification failed"
      );
      setPayStep("pin");
    } finally {
      setPinText("");
    }
  };

  const walletInsufficient =
    walletAvailable !== null && walletAvailable < amount;

  /* ---------- render ---------- */

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.ink900} />

      {/* Ink hero — the app's root SafeAreaView already consumes the status-bar inset */}
      <View style={[styles.hero, { paddingTop: space.md }]}>
        <View style={styles.heroNav}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={hitSlop8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color={color.textInverse} />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>{active.name || "Project Investment"}</Text>
        </View>

        {/* Amount plate — gives the stage content a surface instead of a void */}
        <View style={styles.stagePlate}>
          {planLoading ? (
            <View style={styles.planLoadingWrap}>
              <View style={styles.skelLineSm} />
              <View style={styles.skelLineLg} />
              <View style={styles.skelLineMd} />
            </View>
          ) : planError ? (
            <View style={styles.planLoadingWrap}>
              <Text style={styles.planErrorText}>{planError}</Text>
              <TouchableOpacity
                style={styles.planRetryBtn}
                onPress={loadPlan}
                accessibilityRole="button"
                accessibilityLabel="Retry loading plans"
              >
                <Text style={styles.planRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.stageLabel}>Investment amount</Text>
              <View style={styles.stageAmountRow}>
                <Text style={styles.stageRupee}>₹</Text>
                <TextInput
                  style={styles.stageInput}
                  value={
                    amountFocused
                      ? amountText
                      : amountText
                        ? Number(amountText).toLocaleString("en-IN")
                        : ""
                  }
                  onChangeText={onInputChange}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => {
                    setAmountFocused(false);
                    onInputBlur();
                  }}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  accessibilityLabel="Investment amount in rupees"
                  placeholder={String(minAmount)}
                  placeholderTextColor="rgba(255,255,255,0.35)"
                />
              </View>
              {words ? (
                <Text style={styles.stageWords} numberOfLines={1}>
                  {words}
                </Text>
              ) : null}
              {!amountValid && (
                <Text style={styles.stageError}>
                  Enter between {formatINR(minAmount, { decimals: 0 })} and{" "}
                  {compactINR(maxAmount)}
                </Text>
              )}
              <AmountSlider
                amount={amount}
                min={minAmount}
                max={maxAmount}
                onChange={setAmountEverywhere}
                disabled={planLoading}
              />
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.apyInline}
          onPress={() => setSheet("apy")}
          activeOpacity={0.7}
          hitSlop={hitSlop8}
          accessibilityRole="button"
          accessibilityLabel={`Earns ${apy} percent per annum annual percentage yield. Learn more`}
        >
          <Text style={styles.apyInlineText}>Earns {apy}% p.a. APY</Text>
          <Info size={13} color={PROMO.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form card */}
        <View style={styles.card}>
          {/* Tenure */}
          <Text style={styles.fieldLabel}>Tenure</Text>
          <View style={styles.tenureRow}>
            {tenures.map((t) => {
              const isActive = t.years === tenureYears;
              return (
                <TouchableOpacity
                  key={t.years}
                  style={[styles.tenureChip, isActive && styles.tenureChipActive]}
                  onPress={() => setTenureYears(t.years)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Tenure ${t.label}`}
                >
                  <Text
                    style={[styles.tenureChipText, isActive && styles.tenureChipTextActive]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          <SelectRow
            label="Re-investment instruction"
            value={reinvest}
            onPress={() => setSheet("reinvest")}
          />
          <SelectRow
            label="Receive returns"
            value={payout}
            onPress={() => setSheet("payout")}
          />
        </View>

        {/* Projection card */}
        <View style={styles.projectionCard}>
          <Text style={styles.projectionLabel}>
            {monthlyPayout ? "Capital back on maturity" : "On maturity, you'd get"}
          </Text>
          <Text style={styles.projectionValue}>{formatINR(animatedMaturity)}</Text>

          {monthlyPayout && (
            <View style={styles.monthlyPill}>
              <Text style={styles.monthlyPillText}>
                {formatINR(projection.monthly)} paid to you every month
              </Text>
            </View>
          )}

          <View style={styles.projectionDivider} />

          <View style={styles.projectionGrid}>
            <View style={styles.projectionCell}>
              <Text style={styles.projectionCellLabel}>Invested</Text>
              <Text style={styles.projectionCellValue}>
                {formatINR(amount, { decimals: 0 })}
              </Text>
            </View>
            <View style={[styles.projectionCell, styles.projectionCellRight]}>
              <Text style={styles.projectionCellLabel}>Total returns</Text>
              <Text style={[styles.projectionCellValue, styles.projectionReturns]}>
                +{formatINR(projection.returns, { decimals: 0 })}
              </Text>
            </View>
            <View style={styles.projectionCell}>
              <Text style={styles.projectionCellLabel}>APY rate</Text>
              <Text style={styles.projectionCellValue}>{apy}% p.a.</Text>
            </View>
            <View style={[styles.projectionCell, styles.projectionCellRight]}>
              <Text style={styles.projectionCellLabel}>Maturity date</Text>
              <Text style={styles.projectionCellValue}>
                {maturityDateLabel(tenureYears)}
              </Text>
            </View>
          </View>

          <Text style={styles.projectionNote}>
            Projection at {apy}% p.a. — indicative, not a guarantee
          </Text>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.ctaBar, { paddingBottom: space.base }]}>
        <TouchableOpacity
          style={[
            styles.ctaButton,
            (!amountValid || planLoading || !!planError) && styles.ctaButtonDisabled,
          ]}
          onPress={openPaySheet}
          disabled={!amountValid || planLoading || !!planError}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue to payment"
          accessibilityState={{ disabled: !amountValid || planLoading || !!planError }}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* Sheets */}
      <OptionSheet
        visible={sheet === "reinvest"}
        title="Re-investment instruction"
        options={REINVEST_OPTIONS}
        selected={reinvest}
        onSelect={setReinvest}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === "payout"}
        title="Receive returns"
        options={PAYOUT_OPTIONS}
        selected={payout}
        onSelect={setPayout}
        onClose={() => setSheet(null)}
      />

      {/* APY explainer */}
      <Modal
        visible={sheet === "apy"}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet(null)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheet(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>APY — Annual Percentage Yield</Text>
            <Text style={styles.sheetBody}>
              APY is the yearly return on your investment with annual compounding
              included. At {apy}% p.a., {formatINR(10000, { decimals: 0 })} grows to{" "}
              {formatINR(10000 * (1 + apy / 100), { decimals: 0 })} in one year.
              Returns are indicative and depend on project performance.
            </Text>
            <TouchableOpacity
              style={styles.sheetPrimaryBtn}
              onPress={() => setSheet(null)}
              accessibilityRole="button"
              accessibilityLabel="Close APY explanation"
            >
              <Text style={styles.sheetPrimaryBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment sheet: review → pin/qr → success */}
      <Modal
        visible={sheet === "pay"}
        transparent
        animationType="slide"
        onRequestClose={closePaySheet}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePaySheet} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            {payStep === "review" && (
              <>
                <Text style={styles.sheetTitle}>Review your investment</Text>
                {[
                  ["Project", active.name],
                  ["Amount", formatINR(amount, { decimals: 0 })],
                  ["Tenure", tenureYears === 1 ? "1 year" : `${tenureYears} years`],
                  [
                    monthlyPayout ? "Monthly payout" : "Value on maturity",
                    monthlyPayout
                      ? formatINR(projection.monthly)
                      : formatINR(projection.maturity),
                  ],
                ].map(([k, v]) => (
                  <View key={k} style={styles.reviewRow}>
                    <Text style={styles.reviewKey}>{k}</Text>
                    <Text style={styles.reviewValue} numberOfLines={1}>
                      {v}
                    </Text>
                  </View>
                ))}

                <Text style={[styles.fieldLabel, { marginTop: space.lg }]}>Pay using</Text>

                <TouchableOpacity
                  style={[
                    styles.methodRow,
                    payMethod === "wallet" && styles.methodRowActive,
                    walletInsufficient && styles.methodRowDisabled,
                  ]}
                  disabled={walletInsufficient}
                  onPress={() => setPayMethod("wallet")}
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: payMethod === "wallet",
                    disabled: walletInsufficient,
                  }}
                  accessibilityLabel={`Pay from wallet balance${
                    walletAvailable !== null
                      ? `, ${formatINR(walletAvailable)} available`
                      : ""
                  }`}
                >
                  <View style={styles.methodIcon}>
                    <WalletIcon size={18} color={color.text} strokeWidth={1.8} />
                  </View>
                  <View style={styles.methodBody}>
                    <Text style={styles.methodTitle}>Wallet balance</Text>
                    <Text
                      style={[
                        styles.methodSub,
                        walletInsufficient && { color: color.errorFg },
                      ]}
                    >
                      {walletAvailable === null
                        ? "Checking balance…"
                        : walletInsufficient
                          ? `Insufficient — ${formatINR(walletAvailable)} available`
                          : `${formatINR(walletAvailable)} available`}
                    </Text>
                  </View>
                  {payMethod === "wallet" && !walletInsufficient && (
                    <Check size={18} color={color.text} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>

                {qrEligible && (
                  <TouchableOpacity
                    style={[
                      styles.methodRow,
                      payMethod === "icici_qr" && styles.methodRowActive,
                    ]}
                    onPress={() => setPayMethod("icici_qr")}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: payMethod === "icici_qr" }}
                    accessibilityLabel="Pay via UPI QR, scan with any UPI app"
                  >
                    <View style={styles.methodIcon}>
                      <QrCode size={18} color={color.text} strokeWidth={1.8} />
                    </View>
                    <View style={styles.methodBody}>
                      <Text style={styles.methodTitle}>UPI QR</Text>
                      <Text style={styles.methodSub}>Scan & pay from any UPI app</Text>
                    </View>
                    {payMethod === "icici_qr" && (
                      <Check size={18} color={color.text} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                )}
                {!qrEligible && (
                  <Text style={styles.methodNote}>
                    UPI QR is available for amounts up to {formatINR(QR_LIMIT, { decimals: 0 })}
                  </Text>
                )}

                {payError && (
                  <View style={styles.errorBox}>
                    <Info size={16} color={color.errorFg} />
                    <Text style={styles.errorBoxText}>{payError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.sheetPrimaryBtn,
                    payMethod === "wallet" && walletInsufficient && styles.ctaButtonDisabled,
                  ]}
                  disabled={payMethod === "wallet" && walletInsufficient}
                  onPress={() =>
                    payMethod === "wallet" ? setPayStep("pin") : doInvest("icici_qr")
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Confirm investment"
                >
                  <Text style={styles.sheetPrimaryBtnText}>
                    {payMethod === "wallet" ? "Confirm & Pay" : "Show QR to pay"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {payStep === "pin" && (
              <>
                <Text style={styles.sheetTitle}>Enter transaction PIN</Text>
                <Text style={styles.sheetBody}>
                  Confirm paying {formatINR(amount, { decimals: 0 })} from your wallet.
                </Text>
                <TextInput
                  style={styles.pinInput}
                  value={pinText}
                  onChangeText={(t) => setPinText(t.replace(/[^0-9]/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                  autoFocus
                  accessibilityLabel="Transaction PIN"
                  placeholder="••••••"
                  placeholderTextColor={color.textTertiary}
                />
                {payError && (
                  <View style={styles.errorBox}>
                    <Info size={16} color={color.errorFg} />
                    <Text style={styles.errorBoxText}>{payError}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.sheetPrimaryBtn,
                    pinText.length < 4 && styles.ctaButtonDisabled,
                  ]}
                  disabled={pinText.length < 4}
                  onPress={verifyPinAndInvest}
                  accessibilityRole="button"
                  accessibilityLabel="Verify PIN and pay"
                >
                  <Text style={styles.sheetPrimaryBtnText}>Verify & Pay</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sheetGhostBtn}
                  onPress={() => {
                    setPayError(null);
                    setPayStep("review");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Back to review"
                >
                  <Text style={styles.sheetGhostBtnText}>Back</Text>
                </TouchableOpacity>
              </>
            )}

            {payStep === "processing" && (
              <View style={styles.processingWrap}>
                <ActivityIndicator size="large" color={color.ink900} />
                <Text style={styles.processingText}>Processing your investment…</Text>
              </View>
            )}

            {payStep === "qr" && (
              <>
                <Text style={styles.sheetTitle}>Scan to pay {formatINR(amount, { decimals: 0 })}</Text>
                {investResult?.qr?.qr_string ? (
                  <>
                    <View style={styles.qrWrap}>
                      <QRCode value={investResult.qr.qr_string} size={200} />
                    </View>
                    <Text style={styles.qrHint}>
                      Scan with any UPI app. Your investment activates automatically
                      once the payment is confirmed.
                    </Text>
                    <View style={styles.qrWaitRow}>
                      <ActivityIndicator size="small" color={color.textSecondary} />
                      <Text style={styles.qrWaitText}>Waiting for payment…</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.errorBox}>
                    <Info size={16} color={color.errorFg} />
                    <Text style={styles.errorBoxText}>
                      QR could not be generated. Please pay from wallet balance instead.
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.sheetGhostBtn}
                  onPress={() => {
                    if (pollRef.current) clearInterval(pollRef.current);
                    setPayStep("review");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel QR payment"
                >
                  <Text style={styles.sheetGhostBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {payStep === "success" && (
              <>
                <View style={styles.successWrap}>
                  <CheckCircle2 size={48} color={color.success} strokeWidth={1.5} />
                  <Text style={styles.successTitle}>Investment active</Text>
                  <Text style={styles.successSub}>
                    {formatINR(Number(investResult?.amount || amount))} in {active.name}
                  </Text>
                </View>
                {[
                  ["Reference", investResult?.reference_id],
                  [
                    "Maturity date",
                    investResult?.maturity_date
                      ? new Date(investResult.maturity_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : maturityDateLabel(tenureYears),
                  ],
                  monthlyPayout
                    ? ["Monthly payout", formatINR(Number(investResult?.monthly_payout || projection.monthly))]
                    : ["Maturity value", formatINR(Number(investResult?.maturity_amount || projection.maturity))],
                  ...(investResult?.balance_after
                    ? [["Wallet balance", formatINR(Number(investResult.balance_after))]]
                    : []),
                ].map(([k, v]) => (
                  <View key={k} style={styles.reviewRow}>
                    <Text style={styles.reviewKey}>{k}</Text>
                    <Text style={styles.reviewValue} numberOfLines={1}>
                      {v}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.sheetPrimaryBtn}
                  onPress={() => {
                    setSheet(null);
                    navigation.goBack();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                >
                  <Text style={styles.sheetPrimaryBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ---------------- styles ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  /* hero */
  hero: {
    backgroundColor: color.ink900,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  heroNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    ...type.h3,
    color: color.textInverse,
  },
  stagePlate: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: radius.xl,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    marginTop: space.md,
  },
  planLoadingWrap: {
    alignItems: "center",
    paddingVertical: space.lg,
    gap: space.md,
  },
  skelLineSm: {
    width: 120,
    height: 10,
    borderRadius: radius.xs,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  skelLineLg: {
    width: 200,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  skelLineMd: {
    width: "100%",
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  planErrorText: {
    ...type.body,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  planRetryBtn: {
    minHeight: 44,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: color.white,
    alignItems: "center",
    justifyContent: "center",
  },
  planRetryText: {
    ...type.buttonSm,
    color: color.ink900,
  },
  stageLabel: {
    ...type.micro,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  stageAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    marginTop: space.sm,
  },
  stageRupee: {
    ...type.display,
    ...tabularNums,
    color: "rgba(255,255,255,0.55)",
    includeFontPadding: false,
  },
  stageInput: {
    ...type.display,
    ...tabularNums,
    color: color.textInverse,
    textAlign: "center",
    minWidth: 90,
    padding: 0,
    includeFontPadding: false,
  },
  stageWords: {
    ...type.bodySm,
    color: PROMO.mint,
    textAlign: "center",
  },
  stageError: {
    ...type.bodySm,
    color: "#FF9B9B",
    textAlign: "center",
    marginTop: space.xs,
  },
  apyInline: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: space.xs,
    marginTop: space.md,
  },
  apyInlineText: {
    ...type.label,
    ...tabularNums,
    color: PROMO.gold,
  },

  /* layout */
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: space.base },

  card: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    // Overlap must stay smaller than the card padding or the first field label
    // slides under the hero's black curve
    marginTop: -space.base,
    borderWidth: 1,
    borderColor: color.border,
    ...elevation.level2,
  },
  divider: {
    height: 1,
    backgroundColor: color.divider,
    marginVertical: space.lg,
  },
  fieldLabel: {
    ...type.micro,
    color: color.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: space.sm,
  },

  /* slider — lives on the dark stage: gold fill, white puck */
  sliderHitArea: {
    height: 44,
    justifyContent: "center",
    marginTop: space.base,
  },
  sliderTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
  },
  sliderFill: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: PROMO.gold,
  },
  sliderThumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: color.white,
    alignItems: "center",
    justifyContent: "center",
    ...elevation.level2,
  },
  sliderThumbRing: {
    width: THUMB - 6,
    height: THUMB - 6,
    borderRadius: (THUMB - 6) / 2,
    borderWidth: 2,
    borderColor: PROMO.gold,
  },
  sliderRange: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: space.xs,
  },
  sliderRangeText: {
    ...type.caption,
    ...tabularNums,
    color: "rgba(255,255,255,0.45)",
  },

  /* tenure */
  tenureRow: { flexDirection: "row", gap: space.sm },
  tenureChip: {
    flex: 1,
    minHeight: 44,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: color.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  tenureChipActive: {
    backgroundColor: color.ink900,
  },
  tenureChipText: { ...type.buttonSm, color: color.textSecondary },
  tenureChipTextActive: { color: color.textInverse },

  /* select rows */
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space.md,
    minHeight: 48,
  },
  selectRowBody: { flex: 1, marginRight: space.md },
  selectRowValue: { ...type.bodyLg, color: color.text },

  /* projection card — emerald wealth card, mirrors the wallet banner */
  projectionCard: {
    backgroundColor: PROMO.deepGreen,
    borderRadius: radius.lg,
    padding: space.lg,
    marginTop: space.base,
    overflow: "hidden",
  },
  projectionLabel: {
    ...type.bodySm,
    color: PROMO.mint,
    textAlign: "center",
  },
  projectionValue: {
    ...type.display,
    ...tabularNums,
    color: color.textInverse,
    textAlign: "center",
    marginTop: space.xs,
  },
  monthlyPill: {
    alignSelf: "center",
    marginTop: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  monthlyPillText: {
    ...type.bodySm,
    ...tabularNums,
    color: "rgba(255,255,255,0.85)",
  },
  projectionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginVertical: space.lg,
  },
  projectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: space.base,
  },
  projectionCell: { width: "50%" },
  projectionCellRight: { alignItems: "flex-end" },
  projectionCellLabel: {
    ...type.micro,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: space.xxs,
  },
  projectionCellValue: {
    ...type.label,
    ...tabularNums,
    color: color.textInverse,
  },
  projectionReturns: { color: PROMO.gold },
  projectionNote: {
    ...type.caption,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    marginTop: space.lg,
  },

  /* CTA */
  ctaBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.base,
    paddingTop: space.md,
    backgroundColor: color.background,
    borderTopWidth: 1,
    borderTopColor: color.divider,
  },
  ctaButton: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: color.ink900,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonDisabled: { backgroundColor: color.gray300 },
  ctaText: { ...type.button, color: color.textInverse },

  /* sheets */
  sheetOverlay: {
    flex: 1,
    backgroundColor: color.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: color.gray300,
    alignSelf: "center",
    marginVertical: space.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.sm,
  },
  sheetTitle: { ...type.h3, color: color.text },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: color.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBody: {
    ...type.body,
    color: color.textSecondary,
    marginTop: space.md,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: space.base,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: color.divider,
  },
  sheetOptionText: { ...type.bodyLg, color: color.textSecondary, flex: 1 },
  sheetOptionTextActive: { color: color.text, fontWeight: "600" },
  sheetPrimaryBtn: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: color.ink900,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.lg,
  },
  sheetPrimaryBtnText: { ...type.button, color: color.textInverse },
  sheetGhostBtn: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.sm,
  },
  sheetGhostBtnText: { ...type.buttonSm, color: color.textSecondary },

  /* review + payment */
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: color.divider,
    gap: space.lg,
  },
  reviewKey: { ...type.bodySm, color: color.textSecondary },
  reviewValue: {
    ...type.label,
    ...tabularNums,
    color: color.text,
    flexShrink: 1,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    marginBottom: space.sm,
  },
  methodRowActive: {
    borderColor: color.ink900,
    backgroundColor: color.surfaceMuted,
  },
  methodRowDisabled: { opacity: 0.55 },
  methodIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: color.gray150,
    alignItems: "center",
    justifyContent: "center",
  },
  methodBody: { flex: 1 },
  methodTitle: { ...type.label, color: color.text },
  methodSub: {
    ...type.caption,
    ...tabularNums,
    color: color.textSecondary,
    marginTop: 2,
  },
  methodNote: {
    ...type.caption,
    color: color.textTertiary,
    marginBottom: space.sm,
  },
  errorBox: {
    flexDirection: "row",
    gap: space.sm,
    backgroundColor: color.errorBg,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.sm,
    alignItems: "flex-start",
  },
  errorBoxText: { ...type.bodySm, color: color.errorFg, flex: 1 },
  pinInput: {
    ...type.h1,
    ...tabularNums,
    color: color.text,
    textAlign: "center",
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: color.borderStrong,
    borderRadius: radius.md,
    paddingVertical: space.md,
    marginTop: space.lg,
  },
  processingWrap: {
    alignItems: "center",
    paddingVertical: space.giant,
    gap: space.base,
  },
  processingText: { ...type.body, color: color.textSecondary },
  qrWrap: {
    alignSelf: "center",
    padding: space.base,
    backgroundColor: color.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    marginTop: space.lg,
  },
  qrHint: {
    ...type.bodySm,
    color: color.textSecondary,
    textAlign: "center",
    marginTop: space.md,
    paddingHorizontal: space.lg,
  },
  qrWaitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    marginTop: space.md,
  },
  qrWaitText: { ...type.bodySm, color: color.textSecondary },
  successWrap: {
    alignItems: "center",
    paddingVertical: space.lg,
    gap: space.xs,
  },
  successTitle: { ...type.h2, color: color.text, marginTop: space.sm },
  successSub: { ...type.body, ...tabularNums, color: color.textSecondary },
});

export default ProjectInvestment;
