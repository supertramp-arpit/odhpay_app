import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  RefreshControl,
  Modal,
  Alert,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import {
  ArrowDownLeft,
  ArrowUpRight,
  AtSign,
  Award,
  Eye,
  EyeOff,
  Inbox,
  Landmark,
  Lock,
  Phone,
  Plus,
  Send,
  TrendingUp,
  UserRound,
  Wallet as WalletIcon,
  X,
} from "lucide-react-native";
import Theme from "./Theme";
import {
  color,
  space,
  radius,
  type,
  tabularNums,
  elevation,
  hitSlop8,
} from "../theme/tokens";
import { formatINR } from "../utils/helper";
import { useWalletStore, useUserStore } from "../store";
import { ActivityIndicator } from "react-native";

const { width, height } = Dimensions.get("window");

// Quick Action Button - Consistent black theme
const QuickActionButton = ({ icon: Icon, label, sublabel, onPress, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, delay, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, delay, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${sublabel}`}
    >
      <Animated.View style={[styles.quickActionBtn, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.quickActionIcon}>
          <Icon size={22} color={color.textInverse} strokeWidth={1.8} />
        </View>
        <Text style={styles.quickActionLabel}>{label}</Text>
        <Text style={styles.quickActionSub}>{sublabel}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Transaction Item
const TransactionItem = ({ transaction, index }) => {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const isCredit = transaction.transaction_type === "credit";
  const statusColor = transaction.status === "success" || transaction.status === "completed" ? Theme.colors.success :
                      transaction.status === "pending" ? Theme.colors.warning : Theme.colors.danger;

  const formatDate = (d) => {
    const date = new Date(d);
    return `${date.getDate()}-${date.toLocaleString('en-US', { month: 'short' })}-${date.getFullYear()}`;
  };
  const formatTime = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <Animated.View style={[styles.txnItem, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Debit is ink, never red — red is reserved for failed status */}
      <View style={[styles.txnIcon, { backgroundColor: isCredit ? color.successBg : color.gray150 }]}>
        {isCredit ? (
          <ArrowDownLeft size={18} color={color.successFg} strokeWidth={1.8} />
        ) : (
          <ArrowUpRight size={18} color={color.text} strokeWidth={1.8} />
        )}
      </View>
      <View style={styles.txnDetails}>
        <Text style={styles.txnTitle} numberOfLines={1}>{transaction.purpose || (isCredit ? "Money Added" : "Payment")}</Text>
        <Text style={styles.txnDate}>{formatDate(transaction.transaction_date)} • {formatTime(transaction.transaction_date)}</Text>
      </View>
      <View style={styles.txnRight}>
        <Text style={[styles.txnAmount, { color: isCredit ? color.successFg : color.text }]}>
          {isCredit ? "+" : "−"}{formatINR(transaction.amount)}
        </Text>
        <View style={[styles.txnStatus, { backgroundColor: `${statusColor}15` }]}>
          <View style={[styles.txnDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.txnStatusText, { color: statusColor }]}>{transaction.status}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Add Money Modal
const AddMoneyModal = ({ visible, onClose, onSubmit, loading }) => {
  const [vpa, setVpa] = useState("");
  const [amount, setAmount] = useState("");
  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const handleSubmit = () => {
    if (!vpa || !amount || parseFloat(amount) < 1) {
      Alert.alert("Invalid Input", "Please enter valid UPI ID and amount");
      return;
    }
    onSubmit(vpa, amount);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Money</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalClose}
              hitSlop={hitSlop8}
              accessibilityRole="button"
              accessibilityLabel="Close add money"
            >
              <X size={22} color={color.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountDisplayWrap}>
            <Text style={styles.amountDisplayLabel}>Enter Amount</Text>
            <View style={styles.amountDisplay}>
              <Text style={styles.amountRupee}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Theme.colors.textLight}
              />
            </View>
          </View>

          <View style={styles.quickAmountsWrap}>
            {quickAmounts.map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.quickAmountChip, amount === val.toString() && styles.quickAmountChipActive]}
                onPress={() => setAmount(val.toString())}
              >
                <Text style={[styles.quickAmountText, amount === val.toString() && styles.quickAmountTextActive]}>₹{val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.upiInputWrap}>
            <Text style={styles.upiLabel}>Your UPI ID</Text>
            <View style={styles.upiInputBox}>
              <AtSign size={18} color={color.textSecondary} strokeWidth={1.8} />
              <TextInput
                style={styles.upiInput}
                placeholder="yourname@upi"
                placeholderTextColor={Theme.colors.textLight}
                value={vpa}
                onChangeText={(t) => setVpa(t.toLowerCase())}
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (!vpa || !amount) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!vpa || !amount || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Add ₹{amount || "0"}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.secureNote}>
            <Lock size={12} color={color.textSecondary} strokeWidth={1.8} />
            <Text style={styles.secureNoteText}>Secured with 256-bit encryption</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Main Component
const Wallet = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [walletBalance, setWalletBalance] = useState(null);
  const [hideBalance, setHideBalance] = useState(false);

  const navigation = useNavigation();
  const { transactionHistory, fetchWalletHistory, initiateTopup, fetchBalance, loading } = useWalletStore();

  useEffect(() => {
    loadBalance();
    loadHistory();
  }, []);

  useEffect(() => { loadHistory(); }, [activeFilter]);

  const loadBalance = async () => {
    try {
      const res = await fetchBalance();
      if (res.success) setWalletBalance(res);
    } catch (e) { console.error(e); }
  };

  const loadHistory = async (page = 1) => {
    try {
      await fetchWalletHistory(page, 20, activeFilter === "all" ? null : activeFilter);
    } catch (e) { console.error(e); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadHistory(1), loadBalance()]);
    setRefreshing(false);
  }, [activeFilter]);

  const handleAddMoney = async (vpa, amount) => {
    try {
      const res = await initiateTopup(vpa, amount);
      if (res.success) {
        setShowAddModal(false);
        Alert.alert("Success", "Payment request sent to your UPI app");
        loadBalance();
        loadHistory(1);
      } else {
        Alert.alert("Error", res.message || "Failed");
      }
    } catch (e) {
      Alert.alert("Error", e.response?.data?.detail || "Something went wrong");
    }
  };

  const balance = parseFloat(walletBalance?.available_balance || walletBalance?.balance || 0);
  const odhMoney = parseFloat(walletBalance?.lcr_money_balance || 0);
  const transactions = transactionHistory?.transactions || [];

  const quickActions = [
    { icon: Phone, label: "To Mobile", sublabel: "Number", screen: "ToMobile" },
    { icon: Landmark, label: "To Bank", sublabel: "UPI ID", screen: "ToBank" },
    { icon: UserRound, label: "To Self", sublabel: "Account", screen: "ToSelf" },
    { icon: TrendingUp, label: "Investment", sublabel: "7.5% p.a.", screen: "ProjectInvestment" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.text} />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.walletIconWrap}>
              <WalletIcon size={20} color={color.textInverse} strokeWidth={1.8} />
            </View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <TouchableOpacity
              onPress={() => setHideBalance((v) => !v)}
              hitSlop={hitSlop8}
              accessibilityRole="button"
              accessibilityLabel={hideBalance ? "Show balance" : "Hide balance"}
            >
              {hideBalance ? (
                <EyeOff size={18} color={color.textSecondary} strokeWidth={1.8} />
              ) : (
                <Eye size={18} color={color.textSecondary} strokeWidth={1.8} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.balanceAmount} accessibilityLabel={hideBalance ? "Balance hidden" : `Balance ${formatINR(balance)}`}>
            {hideBalance ? "₹ ••••••" : formatINR(balance)}
          </Text>

          {odhMoney > 0 && (
            <View style={styles.odhMoneyPill}>
              <Award size={14} color={color.successFg} strokeWidth={1.8} />
              <Text style={styles.odhMoneyText}>ODH Money</Text>
              <Text style={styles.odhMoneyValue}>{hideBalance ? "₹ ••••" : formatINR(odhMoney)}</Text>
            </View>
          )}

          <View style={styles.actionBtns}>
            <TouchableOpacity
              style={styles.addMoneyBtn}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Add money to wallet"
            >
              <Plus size={18} color={color.textInverse} strokeWidth={2} />
              <Text style={styles.addMoneyText}>Add Money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => navigation.navigate("ToBank")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Withdraw to bank"
            >
              <Send size={16} color={color.text} strokeWidth={1.8} />
              <Text style={styles.withdrawText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Investment banner */}
        <TouchableOpacity
          style={styles.investBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("ProjectInvestment")}
          accessibilityRole="button"
          accessibilityLabel="Project Investment. Grow at 7.5 percent per annum, starting from ten thousand rupees. Open"
        >
          <Svg
            style={styles.investCurve}
            width="100%"
            height={56}
            viewBox="0 0 320 56"
            preserveAspectRatio="none"
            pointerEvents="none"
            aria-hidden
          >
            <Path
              d="M0,52 C80,50 160,40 224,26 C264,17 296,8 320,2 L320,56 L0,56 Z"
              fill={color.white}
              opacity={0.05}
            />
            <Path
              d="M0,52 C80,50 160,40 224,26 C264,17 296,8 320,2"
              stroke={color.white}
              strokeWidth={1.5}
              opacity={0.25}
              fill="none"
            />
          </Svg>
          <View style={styles.investIcon}>
            <TrendingUp size={20} color={color.textInverse} strokeWidth={1.8} />
          </View>
          <View style={styles.investBody}>
            <Text style={styles.investKicker}>Project Investment</Text>
            <Text style={styles.investTitle}>Grow at 7.5% p.a.</Text>
            <Text style={styles.investSub}>ODH Pay project • from ₹10,000</Text>
          </View>
          <View style={styles.investPill}>
            <Text style={styles.investPillText}>Invest</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action, idx) => (
              <QuickActionButton
                key={idx}
                icon={action.icon}
                label={action.label}
                sublabel={action.sublabel}
                onPress={() => navigation.navigate(action.screen)}
                delay={idx * 60}
              />
            ))}
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            {transactionHistory?.total_count > 0 && (
              <Text style={styles.txnCount}>{transactionHistory.total_count}</Text>
            )}
          </View>

          <View style={styles.filterRow}>
            {[{ key: "all", label: "All" }, { key: "credit", label: "Credits" }, { key: "debit", label: "Debits" }].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading && !refreshing ? (
            <View style={styles.txnList}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.skeletonRow}>
                  <View style={styles.skeletonIcon} />
                  <View style={styles.skeletonBody}>
                    <View style={styles.skeletonLine} />
                    <View style={styles.skeletonLineShort} />
                  </View>
                  <View style={styles.skeletonAmount} />
                </View>
              ))}
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Inbox size={36} color={color.textTertiary} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySub}>Add money to get started</Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => setShowAddModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Add money"
              >
                <Text style={styles.emptyActionText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.txnList}>
              {transactions.map((txn, idx) => (
                <TransactionItem key={txn.id || idx} transaction={txn} index={idx} />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <AddMoneyModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddMoney}
        loading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: color.border,
    ...elevation.level1,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  walletIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: color.ink900,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  balanceLabel: {
    ...type.bodySm,
    color: color.textSecondary,
    flex: 1,
  },
  balanceAmount: {
    ...type.display,
    ...tabularNums,
    color: color.text,
    marginBottom: 12,
  },
  odhMoneyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.successBg,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  odhMoneyText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  odhMoneyValue: {
    fontSize: 13,
    fontWeight: "700",
    ...tabularNums,
    color: color.successFg,
  },
  actionBtns: {
    flexDirection: "row",
    gap: 12,
  },
  addMoneyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.ink900,
    borderRadius: radius.md,
    paddingVertical: 14,
    gap: 8,
  },
  addMoneyText: {
    ...type.buttonSm,
    fontSize: 15,
    color: color.textInverse,
  },
  withdrawBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 14,
    gap: 8,
  },
  withdrawText: {
    ...type.buttonSm,
    fontSize: 15,
    color: color.text,
  },

  // Sections
  section: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: color.border,
    ...elevation.level1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 12,
  },
  txnCount: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    backgroundColor: Theme.colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  // Quick Actions
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionBtn: {
    alignItems: "center",
    width: (width - 64) / 4,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: color.ink900,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.text,
    textAlign: "center",
  },
  quickActionSub: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    textAlign: "center",
  },

  // Investment banner
  investBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.ink900,
    borderRadius: radius.lg,
    padding: space.base,
    marginBottom: 16,
    gap: space.md,
    minHeight: 88,
    overflow: "hidden",
  },
  investCurve: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  investIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: color.ink700,
    alignItems: "center",
    justifyContent: "center",
  },
  investBody: {
    flex: 1,
  },
  investKicker: {
    ...type.micro,
    color: color.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  investTitle: {
    ...type.h3,
    ...tabularNums,
    color: color.textInverse,
    marginTop: 2,
  },
  investSub: {
    ...type.caption,
    ...tabularNums,
    color: color.gray400,
    marginTop: 2,
  },
  investPill: {
    paddingHorizontal: space.base,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.white,
  },
  investPillText: {
    ...type.buttonSm,
    color: color.ink900,
  },

  // Filters
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Theme.colors.inputBg,
  },
  filterChipActive: {
    backgroundColor: Theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: Theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: "#fff",
  },

  // Transactions
  txnList: {
    gap: 10,
  },
  txnItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.inputBg,
    borderRadius: 14,
    padding: 12,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txnDetails: {
    flex: 1,
  },
  txnTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: 2,
  },
  txnDate: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  txnRight: {
    alignItems: "flex-end",
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: "700",
    ...tabularNums,
    marginBottom: 4,
  },
  txnStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  txnDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  txnStatusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  // Loading skeleton & Empty
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.surfaceMuted,
    borderRadius: radius.md,
    padding: 12,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: color.gray200,
    marginRight: 12,
  },
  skeletonBody: {
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    width: "70%",
    borderRadius: radius.xs,
    backgroundColor: color.gray200,
    marginBottom: 8,
  },
  skeletonLineShort: {
    height: 10,
    width: "45%",
    borderRadius: radius.xs,
    backgroundColor: color.gray150,
  },
  skeletonAmount: {
    height: 12,
    width: 56,
    borderRadius: radius.xs,
    backgroundColor: color.gray200,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: color.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: color.textSecondary,
    marginTop: 4,
  },
  emptyAction: {
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: color.ink900,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyActionText: {
    ...type.buttonSm,
    color: color.textInverse,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Theme.colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginVertical: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  amountDisplayWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  amountDisplayLabel: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginBottom: 8,
  },
  amountDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountRupee: {
    fontSize: 32,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "800",
    color: Theme.colors.text,
    minWidth: 80,
    textAlign: "center",
  },
  quickAmountsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  quickAmountChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Theme.colors.inputBg,
  },
  quickAmountChipActive: {
    backgroundColor: Theme.colors.primary,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  quickAmountTextActive: {
    color: "#fff",
  },
  upiInputWrap: {
    marginBottom: 24,
  },
  upiLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: 8,
  },
  upiInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  upiInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Theme.colors.text,
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  submitBtnDisabled: {
    backgroundColor: Theme.colors.border,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secureNoteText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
});

export default Wallet;
