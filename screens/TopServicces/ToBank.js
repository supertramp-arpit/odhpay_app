import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Theme from "../../components/Theme";

const { width, height } = Dimensions.get("window");
const scale = width / 375;

// Responsive sizing helpers
const normalize = (size) => Math.round(size * Math.min(scale, 1.3));
const wp = (percentage) => (width * percentage) / 100;
const hp = (percentage) => (height * percentage) / 100;

// Dummy Data
const DUMMY_BANK_ACCOUNTS = [
  {
    id: "1",
    name: "Rahul Sharma",
    bank: "Axis Bank",
    accountNo: "••••4521",
    lastSent: "₹5,000",
    date: "15 Dec 2024",
    logo: "https://logo.clearbit.com/axisbank.com",
    color: "#97144D",
  },
  {
    id: "2",
    name: "Priya Patel",
    bank: "HDFC Bank",
    accountNo: "••••8734",
    lastSent: "₹12,500",
    date: "10 Dec 2024",
    logo: "https://logo.clearbit.com/hdfcbank.com",
    color: "#004C8F",
  },
  {
    id: "3",
    name: "Amit Kumar",
    bank: "State Bank of India",
    accountNo: "••••2156",
    lastSent: "₹3,200",
    date: "05 Dec 2024",
    logo: "https://logo.clearbit.com/sbi.co.in",
    color: "#22409A",
  },
  {
    id: "4",
    name: "Sneha Gupta",
    bank: "ICICI Bank",
    accountNo: "••••6789",
    lastSent: "₹8,750",
    date: "01 Dec 2024",
    logo: "https://logo.clearbit.com/icicibank.com",
    color: "#F58220",
  },
  {
    id: "5",
    name: "Vikram Singh",
    bank: "Kotak Mahindra",
    accountNo: "••••3421",
    lastSent: "₹15,000",
    date: "28 Nov 2024",
    logo: "https://logo.clearbit.com/kotak.com",
    color: "#ED1C24",
  },
];

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

  const filteredData = useMemo(() => {
    const data = selectedTab === "Bank Accounts" ? DUMMY_BANK_ACCOUNTS : DUMMY_UPI_IDS;
    if (!searchQuery.trim()) return data;
    return data.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.bank?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.upi?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [selectedTab, searchQuery]);

  const renderBankItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.bankCard, { marginTop: index === 0 ? 0 : normalize(12) }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate("NewBank", { beneficiary: item })}
    >
      <View style={styles.bankCardContent}>
        {/* Bank Logo */}
        <View style={[styles.bankLogoContainer, { backgroundColor: `${item.color}15` }]}>
          <Image
            source={{ uri: item.logo }}
            style={styles.bankLogo}
            defaultSource={require("../../assets/LogoN.png")}
          />
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
          <View style={styles.lastTransactionRow}>
            <MaterialIcons name="history" size={normalize(12)} color="#10b981" />
            <Text style={styles.lastSentText}>
              Last sent <Text style={styles.amountText}>{item.lastSent}</Text>
            </Text>
            <Text style={styles.dateText}>• {item.date}</Text>
          </View>
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBox}>
        <MaterialIcons
          name={selectedTab === "Bank Accounts" ? "account-balance" : "qr-code"}
          size={normalize(48)}
          color={Theme.colors.primary}
        />
      </View>
      <Text style={styles.emptyTitle}>
        No {selectedTab === "Bank Accounts" ? "Bank Accounts" : "UPI IDs"} Found
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? "Try searching with a different name"
          : `Add a new ${selectedTab === "Bank Accounts" ? "bank account" : "UPI ID"} to start transferring money`}
      </Text>
    </View>
  );

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

      {/* Recent Label */}
      {filteredData.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Beneficiaries</Text>
          <Text style={styles.sectionCount}>{filteredData.length}</Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={selectedTab === "Bank Accounts" ? renderBankItem : renderUpiItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

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
