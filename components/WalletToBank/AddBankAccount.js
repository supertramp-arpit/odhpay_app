import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CircleAlert, Landmark, ShieldCheck } from "lucide-react-native";
import { color, space, radius, type, tabularNums } from "../../theme/tokens";
import { useBankStore, apiErrorMessage } from "../../store/useBankStore";
import WalletGate from "../Wallet/WalletGate";

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// Public IFSC directory — shows the user which branch they typed before saving.
// The backend re-validates; this is a convenience only.
async function lookupIfsc(ifsc, signal) {
  const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`, { signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("lookup failed");
  return res.json();
}

const Field = ({ label, error, hint, children }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {children}
    {error ? <Text style={styles.errorText}>{error}</Text> : hint ? hint : null}
  </View>
);

function AddBankAccountForm() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const addBank = useBankStore((s) => s.addBank);

  const [holder, setHolder] = useState("");
  const [account, setAccount] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [ifscInfo, setIfscInfo] = useState({ state: "idle" }); // idle | loading | found | notfound | error
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    abortRef.current?.abort();
    if (!IFSC_RE.test(ifsc)) {
      setIfscInfo({ state: "idle" });
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIfscInfo({ state: "loading" });
    lookupIfsc(ifsc, ctrl.signal)
      .then((info) =>
        setIfscInfo(info ? { state: "found", bank: info.BANK, branch: info.BRANCH } : { state: "notfound" })
      )
      .catch((e) => {
        if (e?.name !== "AbortError") setIfscInfo({ state: "error" });
      });
    return () => ctrl.abort();
  }, [ifsc]);

  const validate = () => {
    const next = {};
    if (holder.trim().length < 3) next.holder = "Enter the name exactly as on your bank account";
    if (!/^\d{9,18}$/.test(account)) next.account = "Account number must be 9 to 18 digits";
    if (confirm !== account) next.confirm = "Account numbers don't match";
    if (!IFSC_RE.test(ifsc)) next.ifsc = "Enter a valid 11-character IFSC";
    else if (ifscInfo.state === "notfound") next.ifsc = "IFSC not found. Please check and try again";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    setSubmitError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await addBank({
        accountHolder: holder.trim(),
        accountNumber: account,
        confirmAccountNumber: confirm,
        ifsc,
      });
      navigation.goBack();
    } catch (e) {
      setSubmitError(apiErrorMessage(e, "Couldn't add this account. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const ifscHint =
    ifscInfo.state === "loading" ? (
      <Text style={styles.hintText}>Checking IFSC…</Text>
    ) : ifscInfo.state === "found" ? (
      <View style={styles.ifscFound}>
        <Landmark size={14} color={color.successFg} strokeWidth={1.8} />
        <Text style={styles.ifscFoundText} numberOfLines={2}>
          {ifscInfo.bank} · {ifscInfo.branch}
        </Text>
      </View>
    ) : ifscInfo.state === "notfound" ? (
      <Text style={styles.errorText}>IFSC not found. Please check and try again</Text>
    ) : (
      <Text style={styles.hintText}>Printed on your cheque book or passbook</Text>
    );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.notice}>
          <ShieldCheck size={18} color={color.text} strokeWidth={1.8} />
          <Text style={styles.noticeText}>
            Add an account in your own name. Withdrawals are paid only to saved accounts.
          </Text>
        </View>

        <Field label="Account holder name" error={errors.holder}>
          <TextInput
            style={[styles.input, errors.holder && styles.inputError]}
            value={holder}
            onChangeText={setHolder}
            placeholder="As printed in your passbook"
            placeholderTextColor={color.textTertiary}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={100}
            accessibilityLabel="Account holder name"
          />
        </Field>

        <Field label="Account number" error={errors.account}>
          <TextInput
            style={[styles.input, styles.mono, errors.account && styles.inputError]}
            value={account}
            onChangeText={(t) => setAccount(t.replace(/\D/g, ""))}
            placeholder="9 to 18 digits"
            placeholderTextColor={color.textTertiary}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={18}
            contextMenuHidden
            accessibilityLabel="Account number"
          />
        </Field>

        <Field label="Confirm account number" error={errors.confirm}>
          <TextInput
            style={[styles.input, styles.mono, errors.confirm && styles.inputError]}
            value={confirm}
            onChangeText={(t) => setConfirm(t.replace(/\D/g, ""))}
            placeholder="Re-enter account number"
            placeholderTextColor={color.textTertiary}
            keyboardType="number-pad"
            maxLength={18}
            contextMenuHidden
            accessibilityLabel="Confirm account number"
          />
        </Field>

        <Field label="IFSC" error={errors.ifsc} hint={ifscHint}>
          <TextInput
            style={[styles.input, styles.mono, errors.ifsc && styles.inputError]}
            value={ifsc}
            onChangeText={(t) => setIfsc(t.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            placeholder="e.g. HDFC0001234"
            placeholderTextColor={color.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={11}
            accessibilityLabel="IFSC code"
          />
        </Field>

        {submitError ? (
          <View style={styles.submitError} accessibilityLiveRegion="polite">
            <CircleAlert size={16} color={color.errorFg} strokeWidth={1.8} />
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.base) }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.btnDisabled]}
          onPress={onSubmit}
          disabled={submitting}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Save bank account"
        >
          {submitting ? (
            <ActivityIndicator color={color.textInverse} />
          ) : (
            <Text style={styles.primaryBtnText}>Save bank account</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function AddBankAccount() {
  return (
    <WalletGate>
      <AddBankAccountForm />
    </WalletGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  content: { padding: space.base, paddingBottom: space.xxl },
  notice: {
    flexDirection: "row",
    gap: space.sm,
    alignItems: "flex-start",
    backgroundColor: color.surfaceMuted,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.lg,
  },
  noticeText: { ...type.bodySm, color: color.textSecondary, flex: 1 },
  field: { marginBottom: space.lg },
  label: { ...type.label, color: color.text, marginBottom: space.sm },
  input: {
    ...type.bodyLg,
    color: color.text,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: space.base,
    minHeight: 52,
  },
  mono: { ...tabularNums, letterSpacing: 0.5 },
  inputError: { borderColor: color.error },
  errorText: { ...type.caption, color: color.errorFg, marginTop: space.xs },
  hintText: { ...type.caption, color: color.textSecondary, marginTop: space.xs },
  ifscFound: { flexDirection: "row", alignItems: "center", gap: space.xs, marginTop: space.xs },
  ifscFoundText: { ...type.caption, color: color.successFg, flex: 1 },
  submitError: {
    flexDirection: "row",
    gap: space.sm,
    alignItems: "flex-start",
    backgroundColor: color.errorBg,
    borderRadius: radius.md,
    padding: space.md,
  },
  submitErrorText: { ...type.bodySm, color: color.errorFg, flex: 1 },
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
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { ...type.button, color: color.textInverse },
});
