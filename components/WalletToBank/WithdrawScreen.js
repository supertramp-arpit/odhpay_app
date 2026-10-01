import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Landmark,
  Plus,
  X,
  XCircle,
} from "lucide-react-native";
import { color, space, radius, type, tabularNums, elevation, hitSlop8 } from "../../theme/tokens";
import { formatINR } from "../../utils/helper";
import { useWalletStore } from "../../store";
import { useBankStore } from "../../store/useBankStore";
import { apiErrorMessage, getWithdrawConfig, getWithdrawals, requestWithdrawal } from "../../utils/walletApi";
import WalletGate from "../Wallet/WalletGate";

const toNum = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n) => Math.round(n * 100) / 100;

// Status → how we talk about it. Red only for failure; in-flight is amber.
const STATUS = {
  pending: { label: "Processing", fg: color.warningFg, bg: color.warningBg, Icon: Clock3 },
  approved: { label: "Processing", fg: color.warningFg, bg: color.warningBg, Icon: Clock3 },
  processing: { label: "Processing", fg: color.warningFg, bg: color.warningBg, Icon: Clock3 },
  success: { label: "Paid", fg: color.successFg, bg: color.successBg, Icon: CheckCircle2 },
  rejected: { label: "Refunded", fg: color.errorFg, bg: color.errorBg, Icon: XCircle },
  failed: { label: "Refunded", fg: color.errorFg, bg: color.errorBg, Icon: XCircle },
};

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
        ", " +
        d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

function BankRow({ bank, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.bankRow, selected && styles.bankRowSelected]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${bank.bankName}, account ending ${String(bank.accountNumber).slice(-4)}`}
    >
      <View style={styles.bankIcon}>
        <Landmark size={18} color={color.text} strokeWidth={1.8} />
      </View>
      <View style={styles.flex1}>
        <Text style={styles.bankName} numberOfLines={1}>{bank.bankName}</Text>
        <Text style={styles.bankMeta} numberOfLines={1}>
          {bank.accountNumber} · {bank.ifscCode}
        </Text>
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected && <Check size={14} color={color.textInverse} strokeWidth={2.5} />}
      </View>
    </TouchableOpacity>
  );
}

function WithdrawalItem({ item }) {
  const s = STATUS[item.status] || STATUS.pending;
  const refunded = item.status === "rejected" || item.status === "failed";
  return (
    <View style={styles.histRow}>
      <View style={styles.flex1}>
        <Text style={styles.histAmount}>{formatINR(toNum(item.amount))}</Text>
        <Text style={styles.histMeta} numberOfLines={1}>
          {item.bank ? `${item.bank.bank_name} ${item.bank.account_number_masked}` : "Bank account"} ·{" "}
          {fmtDate(item.created_at)}
        </Text>
        {item.utr ? <Text style={styles.histMeta}>UTR {item.utr}</Text> : null}
        {refunded ? <Text style={styles.histMeta}>Amount returned to your wallet</Text> : null}
      </View>
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <s.Icon size={12} color={s.fg} strokeWidth={2} />
        <Text style={[styles.badgeText, { color: s.fg }]}>{s.label}</Text>
      </View>
    </View>
  );
}

function PinSheet({ visible, onClose, onConfirm, submitting, error, summary }) {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState("");
  useEffect(() => {
    if (!visible) setPin("");
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.sheetOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={submitting ? undefined : onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.base) }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Enter transaction PIN</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              hitSlop={hitSlop8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={color.text} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sheetSummary}>{summary}</Text>
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, ""))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            autoFocus
            contextMenuHidden
            placeholder="••••••"
            placeholderTextColor={color.textDisabled}
            accessibilityLabel="Transaction PIN"
          />
          {error ? (
            <View style={styles.inlineError} accessibilityLiveRegion="polite">
              <CircleAlert size={16} color={color.errorFg} strokeWidth={1.8} />
              <Text style={styles.inlineErrorText}>{error}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.primaryBtn, (pin.length < 4 || submitting) && styles.btnDisabled]}
            disabled={pin.length < 4 || submitting}
            onPress={() => onConfirm(pin)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Confirm withdrawal"
          >
            {submitting ? (
              <ActivityIndicator color={color.textInverse} />
            ) : (
              <Text style={styles.primaryBtnText}>Confirm withdrawal</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function WithdrawContent() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const fetchBalance = useWalletStore((s) => s.fetchBalance);
  const { banks, maxAccounts, fetchBanks, isLoading: banksLoading, loaded: banksLoaded, error: banksError } =
    useBankStore();

  const [balance, setBalance] = useState(null);
  const [config, setConfig] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [amount, setAmount] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pinError, setPinError] = useState("");
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const [bal, cfg, hist] = await Promise.all([fetchBalance(), getWithdrawConfig(), getWithdrawals(1, 10)]);
      setBalance(toNum(bal?.available_balance ?? bal?.balance));
      setConfig(cfg);
      setHistory(hist?.withdrawals || []);
    } catch (e) {
      setLoadError(apiErrorMessage(e, "Couldn't load your wallet. Please try again."));
    }
  }, [fetchBalance]);

  // Refresh on focus — picks up a bank account added on the next screen.
  useFocusEffect(
    useCallback(() => {
      load();
      fetchBanks();
    }, [load, fetchBanks])
  );

  useEffect(() => {
    if (!banks.length) setSelectedId(null);
    else if (!banks.some((b) => b.id === selectedId)) setSelectedId(banks[0].id);
  }, [banks, selectedId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), fetchBanks()]);
    setRefreshing(false);
  }, [load, fetchBanks]);

  const min = toNum(config?.min_amount);
  const max = toNum(config?.max_amount);
  const feePct = toNum(config?.fee_percent);
  const value = toNum(amount);
  const fee = round2((value * feePct) / 100);
  const payout = round2(value - fee);
  const maxAllowed = balance == null ? max : Math.min(max, balance);

  const amountError = useMemo(() => {
    if (!amount) return "";
    if (value < min) return `Minimum withdrawal is ${formatINR(min)}`;
    if (value > max) return `Maximum per withdrawal is ${formatINR(max)}`;
    if (balance != null && value > balance) return "Amount is more than your wallet balance";
    return "";
  }, [amount, value, min, max, balance]);

  const selectedBank = banks.find((b) => b.id === selectedId);
  const canContinue = !!selectedBank && value > 0 && !amountError && !!config;

  const onAmountChange = (t) => {
    let clean = t.replace(/[^0-9.]/g, "");
    const [whole, ...rest] = clean.split(".");
    if (rest.length) clean = `${whole}.${rest.join("").slice(0, 2)}`;
    setAmount(clean);
  };

  const onConfirm = async (pin) => {
    setPinError("");
    setSubmitting(true);
    try {
      const res = await requestWithdrawal({ bankAccountId: selectedId, amount: value, pin });
      setPinOpen(false);
      setResult(res);
      setAmount("");
      load();
    } catch (e) {
      setPinError(apiErrorMessage(e, "Withdrawal failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const w = result.withdrawal;
    return (
      <View style={[styles.container, styles.resultWrap, { paddingBottom: Math.max(insets.bottom, space.base) }]}>
        <View style={styles.resultBody}>
          <View style={styles.resultIcon}>
            <Clock3 size={28} color={color.text} strokeWidth={1.8} />
          </View>
          <Text style={styles.resultTitle}>Withdrawal requested</Text>
          <Text style={styles.resultAmount}>{formatINR(toNum(w.payout_amount))}</Text>
          <Text style={styles.resultSub}>
            will be sent to {w.bank?.bank_name} {w.bank?.account_number_masked}
          </Text>
          <View style={styles.resultCard}>
            <View style={styles.kv}>
              <Text style={styles.kvKey}>Debited from wallet</Text>
              <Text style={styles.kvVal}>{formatINR(toNum(w.amount))}</Text>
            </View>
            <View style={styles.kv}>
              <Text style={styles.kvKey}>Processing fee</Text>
              <Text style={styles.kvVal}>{formatINR(toNum(w.fee))}</Text>
            </View>
            <View style={styles.kv}>
              <Text style={styles.kvKey}>Reference</Text>
              <Text style={[styles.kvVal, styles.mono]} selectable>{w.reference_id}</Text>
            </View>
          </View>
          <Text style={styles.resultNote}>
            Usually credited within 24 working hours. If it can't be paid, the full amount comes back to your
            wallet.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => setResult(null)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Done"
        >
          <Text style={styles.primaryBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initialLoading = (balance == null && !loadError) || (!banksLoaded && banksLoading);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.text} />}
      >
        {loadError ? (
          <View style={styles.inlineError}>
            <CircleAlert size={16} color={color.errorFg} strokeWidth={1.8} />
            <Text style={styles.inlineErrorText}>{loadError}</Text>
            <TouchableOpacity onPress={onRefresh} hitSlop={hitSlop8} accessibilityRole="button">
              <Text style={styles.retry}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.balanceStrip}>
          <Text style={styles.balanceLabel}>Wallet balance</Text>
          {balance == null ? (
            <View style={styles.skelLine} />
          ) : (
            <Text style={styles.balanceValue}>{formatINR(balance)}</Text>
          )}
        </View>

        {/* Destination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Withdraw to</Text>
          {initialLoading ? (
            <>
              <View style={styles.skelRow} />
              <View style={styles.skelRow} />
            </>
          ) : banksError && !banks.length ? (
            <View style={styles.inlineError}>
              <CircleAlert size={16} color={color.errorFg} strokeWidth={1.8} />
              <Text style={styles.inlineErrorText}>{banksError}</Text>
              <TouchableOpacity onPress={fetchBanks} hitSlop={hitSlop8} accessibilityRole="button">
                <Text style={styles.retry}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : banks.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.bankIcon}>
                <Landmark size={18} color={color.text} strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyTitle}>Add a bank account</Text>
              <Text style={styles.emptyBody}>Withdrawals are paid to a bank account saved in your name.</Text>
            </View>
          ) : (
            banks.map((b) => (
              <BankRow key={b.id} bank={b} selected={b.id === selectedId} onPress={() => setSelectedId(b.id)} />
            ))
          )}
          {!initialLoading && banks.length < maxAccounts && (
            <TouchableOpacity
              style={styles.addRow}
              onPress={() => navigation.navigate("NewBank")}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add bank account"
            >
              <Plus size={18} color={color.text} strokeWidth={2} />
              <Text style={styles.addRowText}>Add bank account</Text>
              <ChevronRight size={18} color={color.textTertiary} strokeWidth={1.8} />
            </TouchableOpacity>
          )}
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={[styles.amountBox, amountError && styles.amountBoxError]}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={onAmountChange}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={color.textDisabled}
              maxLength={9}
              accessibilityLabel="Withdrawal amount in rupees"
            />
          </View>
          {amountError ? (
            <Text style={styles.errorText}>{amountError}</Text>
          ) : config ? (
            <Text style={styles.hintText}>
              {formatINR(min)} to {formatINR(max)} per withdrawal
            </Text>
          ) : null}

          <View style={styles.chips}>
            {[500, 1000, 2000].map((v) => (
              <TouchableOpacity
                key={v}
                style={styles.chip}
                onPress={() => setAmount(String(v))}
                accessibilityRole="button"
                accessibilityLabel={`Withdraw ${v} rupees`}
              >
                <Text style={styles.chipText}>{formatINR(v, { decimals: 0 })}</Text>
              </TouchableOpacity>
            ))}
            {maxAllowed >= min && (
              <TouchableOpacity
                style={styles.chip}
                onPress={() => setAmount(String(round2(maxAllowed)))}
                accessibilityRole="button"
                accessibilityLabel="Withdraw maximum"
              >
                <Text style={styles.chipText}>Max</Text>
              </TouchableOpacity>
            )}
          </View>

          {value > 0 && !amountError && (
            <View style={styles.breakdown}>
              <View style={styles.kv}>
                <Text style={styles.kvKey}>Processing fee ({feePct}%)</Text>
                <Text style={styles.kvVal}>{formatINR(fee)}</Text>
              </View>
              <View style={[styles.kv, styles.kvTotal]}>
                <Text style={styles.kvKeyStrong}>You'll receive</Text>
                <Text style={styles.kvValStrong}>{formatINR(payout)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* History */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent withdrawals</Text>
            {history.map((h) => (
              <WithdrawalItem key={h.id} item={h} />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.base) }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, !canContinue && styles.btnDisabled]}
          disabled={!canContinue}
          onPress={() => {
            setPinError("");
            setPinOpen(true);
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={value > 0 ? `Withdraw ${formatINR(value)}` : "Withdraw"}
        >
          <Text style={styles.primaryBtnText}>{value > 0 ? `Withdraw ${formatINR(value)}` : "Withdraw"}</Text>
        </TouchableOpacity>
      </View>

      <PinSheet
        visible={pinOpen}
        onClose={() => setPinOpen(false)}
        onConfirm={onConfirm}
        submitting={submitting}
        error={pinError}
        summary={
          selectedBank
            ? `${formatINR(payout)} to ${selectedBank.bankName} ${selectedBank.accountNumber}`
            : ""
        }
      />
    </View>
  );
}

export default function WithdrawScreen() {
  return (
    <WalletGate>
      <WithdrawContent />
    </WalletGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  content: { padding: space.base, paddingBottom: space.xxl },
  flex1: { flex: 1 },
  mono: { ...tabularNums },

  balanceStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.xs,
    marginBottom: space.md,
  },
  balanceLabel: { ...type.bodySm, color: color.textSecondary },
  balanceValue: { ...type.h3, ...tabularNums, color: color.text },

  section: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    padding: space.base,
    marginBottom: space.base,
    borderWidth: 1,
    borderColor: color.border,
    ...elevation.level1,
  },
  sectionTitle: { ...type.label, color: color.textSecondary, marginBottom: space.md },

  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    marginBottom: space.sm,
    minHeight: 64,
  },
  bankRowSelected: { borderColor: color.ink900, backgroundColor: color.surfaceMuted },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  bankName: { ...type.label, color: color.text },
  bankMeta: { ...type.caption, ...tabularNums, color: color.textSecondary, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: color.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { backgroundColor: color.ink900, borderColor: color.ink900 },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: 48,
    paddingHorizontal: space.xs,
  },
  addRowText: { ...type.label, color: color.text, flex: 1 },

  empty: { alignItems: "center", paddingVertical: space.base, gap: space.sm },
  emptyTitle: { ...type.label, color: color.text },
  emptyBody: { ...type.bodySm, color: color.textSecondary, textAlign: "center" },

  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: space.base,
    minHeight: 64,
  },
  amountBoxError: { borderColor: color.error },
  rupee: { ...type.h1, color: color.textSecondary, marginRight: space.xs },
  amountInput: { ...type.h1, ...tabularNums, color: color.text, flex: 1, paddingVertical: space.sm },
  errorText: { ...type.caption, color: color.errorFg, marginTop: space.xs },
  hintText: { ...type.caption, ...tabularNums, color: color.textSecondary, marginTop: space.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.md },
  chip: {
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.borderStrong,
    justifyContent: "center",
  },
  chipText: { ...type.buttonSm, ...tabularNums, color: color.text },

  breakdown: {
    marginTop: space.base,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: color.divider,
  },
  kv: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: space.xs },
  kvTotal: { marginTop: space.xs },
  kvKey: { ...type.bodySm, color: color.textSecondary },
  kvVal: { ...type.bodySm, ...tabularNums, color: color.text },
  kvKeyStrong: { ...type.label, color: color.text },
  kvValStrong: { ...type.h3, ...tabularNums, color: color.text },

  histRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: color.divider,
  },
  histAmount: { ...type.label, ...tabularNums, color: color.moneyDebit },
  histMeta: { ...type.caption, ...tabularNums, color: color.textSecondary, marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
  },
  badgeText: { ...type.micro },

  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: color.errorBg,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.md,
  },
  inlineErrorText: { ...type.bodySm, color: color.errorFg, flex: 1 },
  retry: { ...type.buttonSm, color: color.errorFg },

  skelLine: { width: 96, height: 20, borderRadius: radius.xs, backgroundColor: color.surfaceSunken },
  skelRow: { height: 64, borderRadius: radius.md, backgroundColor: color.surfaceSunken, marginBottom: space.sm },

  footer: {
    paddingHorizontal: space.base,
    paddingTop: space.md,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: color.ink900,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.4 },
  primaryBtnText: { ...type.button, ...tabularNums, color: color.textInverse },

  sheetOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: color.overlay },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.lg,
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { ...type.h3, color: color.text },
  sheetSummary: { ...type.bodySm, ...tabularNums, color: color.textSecondary, marginTop: space.xs },
  pinInput: {
    ...type.h2,
    ...tabularNums,
    letterSpacing: 8,
    textAlign: "center",
    color: color.text,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    minHeight: 60,
    marginVertical: space.lg,
  },

  resultWrap: { padding: space.base, justifyContent: "space-between" },
  resultBody: { flex: 1, alignItems: "center", justifyContent: "center" },
  resultIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: color.warningBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.base,
  },
  resultTitle: { ...type.h3, color: color.text },
  resultAmount: { ...type.display, ...tabularNums, color: color.text, marginTop: space.sm },
  resultSub: { ...type.bodySm, ...tabularNums, color: color.textSecondary, marginTop: space.xs },
  resultCard: {
    alignSelf: "stretch",
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.base,
    marginTop: space.xl,
  },
  resultNote: { ...type.caption, color: color.textSecondary, textAlign: "center", marginTop: space.base },
});
