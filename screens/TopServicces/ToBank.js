import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Theme from "../../components/Theme";
import { apiRequest } from "../../utils/api";

const { width, height } = Dimensions.get("window");
const scale = width / 375;

// Responsive sizing helpers
const normalize = (size) => Math.round(size * Math.min(scale, 1.3));
const wp = (percentage) => (width * percentage) / 100;
const hp = (percentage) => (height * percentage) / 100;

// Bank type for this "send money to (a beneficiary's) bank account" screen.
// "other" = saved beneficiaries; the To-Self screen uses "self".
const BANK_TYPE = "other";

const BANK_COLORS = ["#22409A", "#004C8F", "#F37920", "#97144D", "#ED1C24", "#0F9D58", "#6D28D9", "#0EA5E9"];

// Deterministic color + initials so each saved bank renders consistently
// without depending on an external logo service.
const bankColorFor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return BANK_COLORS[h % BANK_COLORS.length];
};

const bankInitials = (name = "") =>
  name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "BK";

const maskAccount = (acc = "") => {
  const s = String(acc || "");
  return s.length > 4 ? `••••${s.slice(-4)}` : s;
};

const DUMMY_UPI_IDS = [
  {
    id: "u1",
    name: "Rahul Sharma",
    upi: "rahul.sharma@okaxis",
    lastUsed: "Today",
    color: Theme.colors.primary,
  },
  {
    id: "u2",
    name: "Priya Patel",
    upi: "priya.patel@ybl",
    lastUsed: "Yesterday",
    color: Theme.colors.primary,
  },
  {
    id: "u3",
    name: "Amit Kumar",
    upi: "amit.kumar@oksbi",
    lastUsed: "3 days ago",
    color: Theme.colors.primary,
  },
  {
    id: "u4",
    name: "Sneha Gupta",
    upi: "sneha.g@paytm",
    lastUsed: "1 week ago",
    color: Theme.colors.primary,
  },
];

const TransferMoneyScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("Bank Accounts");

  // Live beneficiary bank accounts (from the backend), replacing the old dummy list.
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchBankAccounts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await apiRequest({
        method: "get",
        endpoint: `payments/get_all_user_accounts?banktype=${BANK_TYPE}`,
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      setBankAccounts(
        list.map((b) => ({
          id: String(b.id),
          regBankID: b.id, // used by /payments/withdraw_fund
          name: b.bankACHolder || "Beneficiary",
          bank: b.bankName || "Bank",
          accountNo: maskAccount(b.bankACNumber),
          accountNumber: b.bankACNumber,
          ifsc: b.bankIFSC,
          color: bankColorFor(b.bankName || b.bankACHolder || ""),
          initials: bankInitials(b.bankName || b.bankACHolder || ""),
        }))
      );
    } catch (e) {
      setError("Couldn't load your bank accounts. Pull down to retry.");
      setBankAccounts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch each time the screen gains focus (e.g. after adding a new bank).
  useFocusEffect(
    useCallback(() => {
      fetchBankAccounts();
    }, [fetchBankAccounts])
  );

  const filteredData = useMemo(() => {
    const data = selectedTab === "Bank Accounts" ? bankAccounts : DUMMY_UPI_IDS;
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      (item.bank?.toLowerCase().includes(q)) ||
      (item.ifsc?.toLowerCase().includes(q)) ||
      (item.upi?.toLowerCase().includes(q))
    );
  }, [selectedTab, searchQuery, bankAccounts]);

  const renderBankItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.bankCard, { marginTop: index === 0 ? 0 : normalize(12) }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate("NewBank", { beneficiary: item })}
    >
      <View style={styles.bankCardContent}>
        {/* Bank avatar (initials) */}
        <View style={[styles.bankLogoContainer, { backgroundColor: `${item.color}15` }]}>
          <Text style={[styles.bankInitials, { color: item.color }]}>{item.initials}</Text>
        </View>

        {/* Details */}
        <View style={styles.bankDetails}>
          <Text style={styles.beneficiaryName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.bankInfoRow}>
            <Text style={styles.bankName}>{item.bank}</Text>
            <View style={styles.dotSeparator} />
            <Text style={styles.accountNo}>{item.accountNo}</Text>
          </View>
          {item.ifsc ? (
            <View style={styles.lastTransactionRow}>
              <MaterialIcons name="account-balance" size={normalize(12)} color={Theme.colors.textSecondary} />
              <Text style={styles.lastSentText}>IFSC {item.ifsc}</Text>
            </View>
          ) : null}
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <MaterialIcons name="chevron-right" size={normalize(24)} color="#94a3b8" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUpiItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.upiCard, { marginTop: index === 0 ? 0 : normalize(12) }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate("AddUpiScreen", { upiData: item })}
    >
      <View style={styles.upiCardContent}>
        {/* Avatar */}
        <View style={styles.upiAvatar}>
          <Text style={styles.upiAvatarText}>
            {item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.upiDetails}>
          <Text style={styles.upiName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.upiId} numberOfLines={1}>
            {item.upi}
          </Text>
          <View style={styles.lastUsedRow}>
            <MaterialIcons name="access-time" size={normalize(11)} color={Theme.colors.textSecondary} />
            <Text style={styles.lastUsedText}>{item.lastUsed}</Text>
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <MaterialIcons name="chevron-right" size={normalize(24)} color={Theme.colors.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    const isBank = selectedTab === "Bank Accounts";
    const showError = isBank && !!error;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <MaterialIcons
            name={showError ? "error-outline" : isBank ? "account-balance" : "qr-code"}
            size={normalize(48)}
            color={Theme.colors.primary}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {showError ? "Couldn't load accounts" : `No ${isBank ? "Bank Accounts" : "UPI IDs"} Found`}
        </Text>
        <Text style={styles.emptySubtitle}>
          {showError
            ? error
            : searchQuery
            ? "Try searching with a different name"
            : `Add a new ${isBank ? "bank account" : "UPI ID"} to start transferring money`}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.secondary} />

     

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={normalize(22)} color={Theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, bank or UPI ID"
          placeholderTextColor={Theme.colors.textSecondary}
          onChangeText={setSearchQuery}
          value={searchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <MaterialIcons name="close" size={normalize(18)} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabContainer}>
        {["Bank Accounts", "UPI ID"].map((tab) => {
          const isActive = selectedTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={tab === "Bank Accounts" ? "account-balance" : "alternate-email"}
                size={normalize(18)}
                color={isActive ? Theme.colors.secondary : Theme.colors.textSecondary}
              />
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Section Label */}
      {filteredData.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedTab === "Bank Accounts" ? "Saved Beneficiaries" : "Recent UPI IDs"}
          </Text>
          <Text style={styles.sectionCount}>{filteredData.length}</Text>
        </View>
      )}

      {/* List */}
      {selectedTab === "Bank Accounts" && loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your bank accounts…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={selectedTab === "Bank Accounts" ? renderBankItem : renderUpiItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            selectedTab === "Bank Accounts" ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchBankAccounts(true)}
                tintColor={Theme.colors.primary}
                colors={[Theme.colors.primary]}
              />
            ) : undefined
          }
        />
      )}

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => {
          if (selectedTab === "UPI ID") {
            navigation.navigate("AddUpiScreen");
          } else {
            navigation.navigate("NewBank");
          }
        }}
      >
        <MaterialIcons name="add" size={normalize(22)} color={Theme.colors.secondary} />
        <Text style={styles.fabText}>
          Add New {selectedTab === "Bank Accounts" ? "Account" : "UPI"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },

  // Header
  headerSection: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
    backgroundColor: Theme.colors.secondary,
  },
  headerTitle: {
    fontSize: normalize(24),
    fontWeight: "800",
    color: Theme.colors.text,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: normalize(14),
    color: Theme.colors.textSecondary,
    marginTop: normalize(4),
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.secondary,
    marginHorizontal: wp(5),
    marginTop: hp(2),
    paddingHorizontal: normalize(16),
    paddingVertical: Platform.OS === "ios" ? normalize(14) : normalize(6),
    borderRadius: normalize(14),
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(15),
    color: Theme.colors.text,
    marginLeft: normalize(12),
    paddingVertical: 0,
  },
  clearButton: {
    padding: normalize(4),
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: wp(5),
    marginTop: hp(2),
    backgroundColor: Theme.colors.border,
    borderRadius: normalize(12),
    padding: normalize(4),
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: normalize(12),
    borderRadius: normalize(10),
    gap: normalize(6),
  },
  activeTab: {
    backgroundColor: Theme.colors.primary,
    ...Theme.shadows.md,
  },
  tabText: {
    fontSize: normalize(13),
    fontWeight: "600",
    color: Theme.colors.textSecondary,
  },
  activeTabText: {
    color: Theme.colors.secondary,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: wp(5),
    marginTop: hp(2.5),
    marginBottom: hp(1),
  },
  sectionTitle: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: Theme.colors.text,
  },
  sectionCount: {
    fontSize: normalize(13),
    fontWeight: "600",
    color: Theme.colors.primary,
    backgroundColor: Theme.colors.inputBg,
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    borderRadius: normalize(8),
  },

  // List
  listContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(12),
    flexGrow: 1,
  },

  // Bank Card
  bankCard: {
    backgroundColor: Theme.colors.secondary,
    borderRadius: normalize(16),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  bankCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: normalize(16),
  },
  bankLogoContainer: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(14),
    justifyContent: "center",
    alignItems: "center",
  },
  bankLogo: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(6),
  },
  bankInitials: {
    fontSize: normalize(18),
    fontWeight: "800",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: hp(12),
    gap: normalize(12),
  },
  loadingText: {
    fontSize: normalize(14),
    color: Theme.colors.textSecondary,
  },
  bankDetails: {
    flex: 1,
    marginLeft: normalize(14),
  },
  beneficiaryName: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: normalize(4),
  },
  bankInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: normalize(6),
  },
  bankName: {
    fontSize: normalize(13),
    color: Theme.colors.textSecondary,
    fontWeight: "500",
  },
  dotSeparator: {
    width: normalize(4),
    height: normalize(4),
    borderRadius: normalize(2),
    backgroundColor: Theme.colors.border,
    marginHorizontal: normalize(8),
  },
  accountNo: {
    fontSize: normalize(13),
    color: Theme.colors.textSecondary,
  },
  lastTransactionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastSentText: {
    fontSize: normalize(12),
    color: Theme.colors.textSecondary,
    marginLeft: normalize(4),
  },
  amountText: {
    color: Theme.colors.success,
    fontWeight: "600",
  },
  dateText: {
    fontSize: normalize(12),
    color: Theme.colors.textLight,
    marginLeft: normalize(6),
  },
  arrowContainer: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },

  // UPI Card
  upiCard: {
    backgroundColor: Theme.colors.secondary,
    borderRadius: normalize(16),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  upiCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: normalize(16),
  },
  upiAvatar: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(14),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.primary,
  },
  upiAvatarText: {
    fontSize: normalize(18),
    fontWeight: "700",
    color: Theme.colors.secondary,
  },
  upiDetails: {
    flex: 1,
    marginLeft: normalize(14),
  },
  upiName: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: normalize(4),
  },
  upiId: {
    fontSize: normalize(13),
    color: Theme.colors.primary,
    fontWeight: "500",
    marginBottom: normalize(6),
  },
  lastUsedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(4),
  },
  lastUsedText: {
    fontSize: normalize(12),
    color: Theme.colors.textSecondary,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: hp(10),
    paddingHorizontal: wp(10),
  },
  emptyIconBox: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(50),
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: normalize(24),
  },
  emptyTitle: {
    fontSize: normalize(18),
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: normalize(8),
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: normalize(14),
    color: Theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: normalize(22),
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: hp(3),
    left: wp(5),
    right: wp(5),
    borderRadius: normalize(16),
    overflow: "hidden",
    backgroundColor: Theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: normalize(16),
    gap: normalize(8),
    ...Theme.shadows.lg,
  },
  fabText: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: Theme.colors.secondary,
  },
});

export default TransferMoneyScreen;
