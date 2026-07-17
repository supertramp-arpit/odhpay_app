// Project Investment — lumpsum investment in the ODH Pay project.
// Token-native (theme/tokens.js), lucide-only, money via shared formatINR.
// Projection math: annual compounding FV = P × (1 + APY)^years; monthly-payout
// mode pays simple interest monthly and returns capital at maturity.
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
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
import { useNavigation } from "@react-navigation/native";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Info,
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

const APY = 7.5; // % p.a. — indicative, single source for every figure on screen

// Investment promo palette — shared visual language with the wallet banner
// (emerald ground + gold growth accents; contained to this feature only)
const PROMO = {
  deepGreen: "#03170F",
  mint: "#8CE0BE",
  gold: "#F5B63F",
};
const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 100000000; // ₹10 Cr
const TENURES = [
  { years: 1, label: "1 year" },
  { years: 2, label: "2 years" },
  { years: 3, label: "3 years" },
  { years: 5, label: "5 years" },
];
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

// Indian-system amount in words, e.g. 10000 -> "Ten Thousand Rupees"
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

// Snap slider output to a clean step for its magnitude
const snapAmount = (raw) => {
  let step;
  if (raw < 100000) step = 5000;
  else if (raw < 1000000) step = 25000;
  else if (raw < 10000000) step = 100000;
  else step = 2500000;
  const snapped = Math.round(raw / step) * step;
  return Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, snapped));
};

const LOG_MIN = Math.log(MIN_AMOUNT);
const LOG_MAX = Math.log(MAX_AMOUNT);
const amountToPosition = (amount) =>
  (Math.log(Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, amount))) - LOG_MIN) /
  (LOG_MAX - LOG_MIN);
const positionToAmount = (pos) =>
  Math.exp(LOG_MIN + Math.min(1, Math.max(0, pos)) * (LOG_MAX - LOG_MIN));

const maturityDate = (years) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Count-up that respects reduce-motion; animates only the displayed number
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
    // Resume from whatever is currently on screen so rapid slider drags stay smooth
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

/* ---------------- slider ---------------- */

const THUMB = 28;

const AmountSlider = ({ amount, onChange }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const startPosRef = useRef(null);

  // PanResponder is created once; refs keep the latest values readable inside it
  const latestAmount = useRef(amount);
  latestAmount.current = amount;
  const latestOnChange = useRef(onChange);
  latestOnChange.current = onChange;

  const position = amountToPosition(amount);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startPosRef.current = amountToPosition(latestAmount.current);
      },
      onPanResponderMove: (_, gesture) => {
        const w = trackWidthRef.current;
        if (!w) return;
        const pos = startPosRef.current + gesture.dx / w;
        latestOnChange.current(snapAmount(positionToAmount(pos)));
      },
    })
  ).current;

  const onTrackPress = (e) => {
    const w = trackWidthRef.current;
    if (!w) return;
    const pos = e.nativeEvent.locationX / w;
    onChange(snapAmount(positionToAmount(pos)));
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
        const pos = amountToPosition(amount);
        const delta = e.nativeEvent.actionName === "increment" ? 0.04 : -0.04;
        onChange(snapAmount(positionToAmount(pos + delta)));
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
        <Text style={styles.sliderRangeText}>
          {formatINR(MIN_AMOUNT, { decimals: 0 })}
        </Text>
        <Text style={styles.sliderRangeText}>₹10 Cr</Text>
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

/* ---------------- field row (select look-alike) ---------------- */

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

  const [amount, setAmount] = useState(MIN_AMOUNT);
  const [amountText, setAmountText] = useState(String(MIN_AMOUNT));
  const [tenure, setTenure] = useState(TENURES[0]);
  const [reinvest, setReinvest] = useState(REINVEST_OPTIONS[0]);
  const [payout, setPayout] = useState(PAYOUT_OPTIONS[0]);
  const [sheet, setSheet] = useState(null); // 'reinvest' | 'payout' | 'apy' | 'review'
  const [reviewNoticed, setReviewNoticed] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);

  const monthlyPayout = payout === "Monthly payout";

  const projection = useMemo(() => {
    const years = tenure.years;
    if (monthlyPayout) {
      const monthly = (amount * (APY / 100)) / 12;
      return {
        maturity: amount,
        returns: monthly * years * 12,
        monthly,
      };
    }
    const maturity = amount * Math.pow(1 + APY / 100, years);
    return { maturity, returns: maturity - amount, monthly: 0 };
  }, [amount, tenure, monthlyPayout]);

  const animatedMaturity = useCountUp(projection.maturity);

  const setAmountEverywhere = useCallback((next) => {
    setAmount(next);
    setAmountText(String(next));
  }, []);

  const onInputChange = (text) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, 9);
    setAmountText(digits);
    const n = Number(digits);
    if (n >= MIN_AMOUNT && n <= MAX_AMOUNT) setAmount(n);
  };

  const onInputBlur = () => {
    const n = Number(amountText) || 0;
    const clamped = Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, n));
    setAmountEverywhere(clamped);
  };

  const amountValid =
    Number(amountText) >= MIN_AMOUNT && Number(amountText) <= MAX_AMOUNT;

  const words = useMemo(() => amountInWords(Number(amountText)), [amountText]);

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
          <Text style={styles.heroTitle}>Project Investment</Text>
        </View>
        {/* Amount plate — gives the stage content a surface instead of a void */}
        <View style={styles.stagePlate}>
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
            placeholder="10,000"
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
            Enter between {formatINR(MIN_AMOUNT, { decimals: 0 })} and ₹10 Cr
          </Text>
        )}

        <AmountSlider amount={amount} onChange={setAmountEverywhere} />
        </View>

        <TouchableOpacity
          style={styles.apyInline}
          onPress={() => setSheet("apy")}
          activeOpacity={0.7}
          hitSlop={hitSlop8}
          accessibilityRole="button"
          accessibilityLabel={`Earns ${APY} percent per annum annual percentage yield. Learn more`}
        >
          <Text style={styles.apyInlineText}>Earns {APY}% p.a. APY</Text>
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
            {TENURES.map((t) => {
              const active = t.years === tenure.years;
              return (
                <TouchableOpacity
                  key={t.years}
                  style={[styles.tenureChip, active && styles.tenureChipActive]}
                  onPress={() => setTenure(t)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Tenure ${t.label}`}
                >
                  <Text style={[styles.tenureChipText, active && styles.tenureChipTextActive]}>
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
              <Text style={styles.projectionCellValue}>{APY}% p.a.</Text>
            </View>
            <View style={[styles.projectionCell, styles.projectionCellRight]}>
              <Text style={styles.projectionCellLabel}>Maturity date</Text>
              <Text style={styles.projectionCellValue}>{maturityDate(tenure.years)}</Text>
            </View>
          </View>

          <Text style={styles.projectionNote}>
            Projection at {APY}% p.a. — indicative, not a guarantee
          </Text>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.ctaBar, { paddingBottom: space.base }]}>
        <TouchableOpacity
          style={[styles.ctaButton, !amountValid && styles.ctaButtonDisabled]}
          onPress={() => {
            setReviewNoticed(false);
            setSheet("review");
          }}
          disabled={!amountValid}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue to review investment"
          accessibilityState={{ disabled: !amountValid }}
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
              included. At {APY}% p.a., {formatINR(10000, { decimals: 0 })} grows to{" "}
              {formatINR(10000 * (1 + APY / 100), { decimals: 0 })} in one year.
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

      {/* Review sheet */}
      <Modal
        visible={sheet === "review"}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet(null)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSheet(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Review your investment</Text>

            {[
              ["Project", "ODH Pay"],
              ["Amount", formatINR(amount, { decimals: 0 })],
              ["Tenure", tenure.label],
              ["Re-investment", reinvest],
              ["Returns", payout],
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

            {reviewNoticed && (
              <View style={styles.noticeBox}>
                <Info size={16} color={color.infoFg} />
                <Text style={styles.noticeText}>
                  Investment booking opens soon. Nothing has been debited from
                  your wallet yet.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.sheetPrimaryBtn}
              onPress={() =>
                reviewNoticed ? setSheet(null) : setReviewNoticed(true)
              }
              accessibilityRole="button"
              accessibilityLabel={reviewNoticed ? "Close review" : "Confirm investment"}
            >
              <Text style={styles.sheetPrimaryBtnText}>
                {reviewNoticed ? "Got it" : "Confirm investment"}
              </Text>
            </TouchableOpacity>
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

  /* review */
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
  noticeBox: {
    flexDirection: "row",
    gap: space.sm,
    backgroundColor: color.infoBg,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.base,
    alignItems: "flex-start",
  },
  noticeText: { ...type.bodySm, color: color.infoFg, flex: 1 },
});

export default ProjectInvestment;
