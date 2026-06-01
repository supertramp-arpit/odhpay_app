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
import * as Clipboard from "expo-clipboard";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Theme from "./Theme";
import { useWalletStore, useUserStore } from "../store";
import { ActivityIndicator } from "react-native";

const { width, height } = Dimensions.get("window");

// Quick Action Button - Consistent black theme
const QuickActionButton = ({ icon, label, sublabel, onPress, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, delay, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, delay, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Animated.View style={[styles.quickActionBtn, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.quickActionIcon}>
          <Ionicons name={icon} size={24} color="#fff" />
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
      <View style={[styles.txnIcon, { backgroundColor: isCredit ? "#E8F5E9" : "#FFEBEE" }]}>
        <Feather name={isCredit ? "arrow-down-left" : "arrow-up-right"} size={18} color={isCredit ? Theme.colors.success : Theme.colors.danger} />
      </View>
      <View style={styles.txnDetails}>
        <Text style={styles.txnTitle} numberOfLines={1}>{transaction.purpose || (isCredit ? "Money Added" : "Payment")}</Text>
        <Text style={styles.txnDate}>{formatDate(transaction.transaction_date)} • {formatTime(transaction.transaction_date)}</Text>
      </View>
      <View style={styles.txnRight}>
        <Text style={[styles.txnAmount, { color: isCredit ? Theme.colors.success : Theme.colors.danger }]}>
          {isCredit ? "+" : "-"}₹{parseFloat(transaction.amount).toFixed(2)}
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
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Feather name="x" size={22} color={Theme.colors.text} />
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
              <Feather name="at-sign" size={18} color={Theme.colors.textSecondary} />
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
            <Feather name="lock" size={12} color={Theme.colors.textSecondary} />
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
    { icon: "call-outline", label: "To Mobile", sublabel: "Number", screen: "ToMobile" },
    { icon: "card-outline", label: "To Bank", sublabel: "UPI ID", screen: "ToBank" },
    { icon: "person-outline", label: "To Self", sublabel: "Account", screen: "ToSelf" },
    { icon: "wallet-outline", label: "Balance", sublabel: "Check", screen: "CheckWalletBalance" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.primary} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.walletIconWrap}>
              <MaterialCommunityIcons name="wallet" size={24} color="#fff" />
            </View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>

          <Text style={styles.balanceAmount}>
            ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>

          {odhMoney > 0 && (
            <View style={styles.odhMoneyPill}>
              <Feather name="award" size={14} color={Theme.colors.success} />
              <Text style={styles.odhMoneyText}>ODH Money</Text>
              <Text style={styles.odhMoneyValue}>₹{odhMoney.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.actionBtns}>
            <TouchableOpacity style={styles.addMoneyBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
              <Feather name="plus" size={20} color={Theme.colors.primary} />
              <Text style={styles.addMoneyText}>Add Money</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.withdrawBtn} onPress={() => navigation.navigate("ToBank")} activeOpacity={0.8}>
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.withdrawText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

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
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={40} color={Theme.colors.textLight} />
              <Text style={styles.emptyTitle}>No Transactions</Text>
              <Text style={styles.emptySub}>Your activity will appear here</Text>
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
    backgroundColor: Theme.colors.primary,
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
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Theme.shadows.md,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  walletIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: Theme.colors.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  odhMoneyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Theme.colors.success}10`,
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
    color: Theme.colors.success,
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
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  addMoneyText: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  withdrawBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  withdrawText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },

  // Sections
  section: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...Theme.shadows.sm,
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
    borderRadius: 16,
    backgroundColor: Theme.colors.primary,
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

  // Loading & Empty
  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.colors.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 4,
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
