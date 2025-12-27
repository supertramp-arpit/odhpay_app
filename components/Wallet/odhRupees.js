import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import Theme from "../Theme";
import { apiRequest } from "../../utils/api";

const { width } = Dimensions.get("window");
const isSmall = width < 375;

// Dummy transaction data
const TRANSACTIONS = [
  {
    id: "1",
    type: "credit",
    title: "Rupees Added",
    description: "Earned from cashback",
    amount: 150,
    date: "Today, 3:45 PM",
    icon: "cash",
  },
  {
    id: "2",
    type: "debit",
    title: "Bill Payment",
    description: "Electricity Bill - MSEDCL",
    amount: 500,
    date: "Today, 10:30 AM",
    icon: "flash",
  },
  {
    id: "3",
    type: "credit",
    title: "Referral Bonus",
    description: "Friend joined via your link",
    amount: 100,
    date: "Yesterday, 8:00 PM",
    icon: "people",
  },
  {
    id: "4",
    type: "debit",
    title: "Mobile Recharge",
    description: "Airtel - 9988776655",
    amount: 199,
    date: "Yesterday, 2:15 PM",
    icon: "phone-portrait",
  },
  {
    id: "5",
    type: "credit",
    title: "Cashback Reward",
    description: "Special offer bonus",
    amount: 75,
    date: "Dec 13, 2025",
    icon: "gift",
  },
  {
    id: "6",
    type: "debit",
    title: "Water Bill",
    description: "Municipal Corporation",
    amount: 320,
    date: "Dec 11, 2025",
    icon: "water",
  },
  {
    id: "7",
    type: "credit",
    title: "Quiz Reward",
    description: "Daily quiz winner",
    amount: 50,
    date: "Dec 9, 2025",
    icon: "trophy",
  },
  {
    id: "8",
    type: "debit",
    title: "Gas Bill",
    description: "Indraprastha Gas",
    amount: 890,
    date: "Dec 7, 2025",
    icon: "flame",
  },
];

const OdhRupees = () => {
  const route = useRoute();
  const navigation = useNavigation();

  // Wallet balance states
  const [walletData, setWalletData] = useState({
    balance: "0.00",
    available_balance: "0.00",
    pending_locks: "0.00",
    reward_balance: "0.00",
    lcr_money_balance: "0.00",
  });
  const [loading, setLoading] = useState(true);

  // Fetch wallet balance from API
  const fetchWalletBalance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest({
        method: "get",
        endpoint: "api/v1/wallet/balance",
      });
      
      if (response?.success) {
        setWalletData({
          balance: response.balance || "0.00",
          available_balance: response.available_balance || "0.00",
          pending_locks: response.pending_locks || "0.00",
          reward_balance: response.reward_balance || "0.00",
          lcr_money_balance: response.lcr_money_balance || "0.00",
        });
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch balance on component mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchWalletBalance();
    }, [fetchWalletBalance])
  );

  const handleBackPress = React.useCallback(() => {
    const state = navigation.getState();
    const routeCount = state?.routes?.length ?? 1;

    if (routeCount >= 3 && navigation.canGoBack()) {
      navigation.pop(2);
    } else {
      navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
    }
  }, [navigation]);

  React.useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBackPress();
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [handleBackPress])
  );

  const renderTransaction = ({ item }) => (
    <TouchableOpacity style={styles.transactionItem} activeOpacity={0.7}>
      <View style={[
        styles.transactionIcon,
        { backgroundColor: item.type === "credit" ? "#E3F2FD" : "#FFF3E0" }
      ]}>
        <Ionicons
          name={item.icon}
          size={22}
          color={item.type === "credit" ? "#2196F3" : "#FF9800"}
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>{item.title}</Text>
        <Text style={styles.transactionDesc}>{item.description}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.type === "credit" ? "#4CAF50" : "#F44336" }
      ]}>
        {item.type === "credit" ? "+" : "-"}₹{item.amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ODH Rupees</Text>
        <TouchableOpacity style={styles.backBtn}>
          <MaterialIcons name="info-outline" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="currency-rupee" size={28} color="#000" />
            </View>
            <View>
              <Text style={styles.walletLabel}>ODH Rupees Balance</Text>
              <Text style={styles.earnLabel}>Earn & Save More!</Text>
            </View>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#FFF" style={styles.balanceLoader} />
          ) : (
            <Text style={styles.amount}>₹{parseFloat(walletData.balance).toLocaleString()}</Text>
          )}
          
          {/* Additional Balance Info */}
          {!loading && (
            <View style={styles.balanceDetails}>
              <View style={styles.balanceDetailRow}>
                <Text style={styles.balanceDetailLabel}>Available Balance</Text>
                <Text style={styles.balanceDetailValue}>₹{parseFloat(walletData.available_balance).toLocaleString()}</Text>
              </View>
              {parseFloat(walletData.pending_locks) > 0 && (
                <View style={styles.balanceDetailRow}>
                  <Text style={styles.balanceDetailLabel}>Pending Locks</Text>
                  <Text style={styles.balanceDetailValue}>₹{parseFloat(walletData.pending_locks).toLocaleString()}</Text>
                </View>
              )}
            </View>
          )}
         
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.sendButton} activeOpacity={0.85}>
            <Ionicons name="paper-plane" size={22} color="#FFF" />
            <Text style={styles.sendButtonText}>Send Money</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.topupButton} activeOpacity={0.85}>
            <Ionicons name="wallet-outline" size={22} color={Theme.colors.primary} />
            <Text style={styles.topupButtonText}>Top Up Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="wallet" size={24} color="#4CAF50" />
            <Text style={styles.statAmount}>
              {loading ? "--" : `₹${parseFloat(walletData.lcr_money_balance).toLocaleString()}`}
            </Text>
            <Text style={styles.statLabel}>LCR Money</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Ionicons name="gift" size={24} color="#9C27B0" />
            <Text style={styles.statAmount}>
              {loading ? "--" : `₹${parseFloat(walletData.reward_balance).toLocaleString()}`}
            </Text>
            <Text style={styles.statLabel}>Rewards</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Ionicons name="lock-closed" size={24} color="#FF9800" />
            <Text style={styles.statAmount}>
              {loading ? "--" : `₹${parseFloat(walletData.pending_locks).toLocaleString()}`}
            </Text>
            <Text style={styles.statLabel}>Locked</Text>
          </View>
        </View>

        {/* Transaction History Section */}
        <View style={styles.transactionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction List */}
          <View style={styles.transactionList}>
            {TRANSACTIONS.map((item) => (
              <View key={item.id}>
                {renderTransaction({ item })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OdhRupees;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  balanceCard: {
    backgroundColor: "#000000",
    borderRadius: 24,
    padding: isSmall ? 20 : 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  walletLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  earnLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginTop: 2,
  },
  amount: {
    fontSize: isSmall ? 36 : 44,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -1,
    marginBottom: 12,
  },
  balanceLoader: {
    marginVertical: 20,
  },
  balanceDetails: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  balanceDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  balanceDetailLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },
  balanceDetailValue: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
  },
  balanceFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 24,
    gap: 14,
  },
  sendButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  topupButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingVertical: 18,
    gap: 10,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  topupButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.primary,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    marginTop: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  statDivider: {
    width: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 4,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  transactionSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  transactionList: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  transactionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: 2,
  },
  transactionDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: Theme.colors.textLight,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
});
