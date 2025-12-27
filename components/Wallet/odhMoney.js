import React from "react";
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  FlatList,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import Theme from "../Theme";

const { width } = Dimensions.get("window");
const isSmall = width < 375;

// Dummy transaction data
const TRANSACTIONS = [
  {
    id: "1",
    type: "credit",
    title: "Wallet Top Up",
    description: "Added via UPI",
    amount: 2000,
    date: "Today, 2:30 PM",
    icon: "add-circle",
  },
  {
    id: "2",
    type: "debit",
    title: "Mobile Recharge",
    description: "Jio Prepaid - 9876543210",
    amount: 299,
    date: "Today, 11:15 AM",
    icon: "phone-portrait",
  },
  {
    id: "3",
    type: "debit",
    title: "Money Sent",
    description: "To Rahul Sharma",
    amount: 500,
    date: "Yesterday, 6:45 PM",
    icon: "arrow-up-circle",
  },
  {
    id: "4",
    type: "credit",
    title: "Cashback Received",
    description: "Recharge Offer",
    amount: 25,
    date: "Yesterday, 11:00 AM",
    icon: "gift",
  },
  {
    id: "5",
    type: "debit",
    title: "Electricity Bill",
    description: "MSEDCL - Consumer No. 123456",
    amount: 1250,
    date: "Dec 12, 2025",
    icon: "flash",
  },
  {
    id: "6",
    type: "credit",
    title: "Wallet Top Up",
    description: "Added via Debit Card",
    amount: 5000,
    date: "Dec 10, 2025",
    icon: "add-circle",
  },
  {
    id: "7",
    type: "debit",
    title: "DTH Recharge",
    description: "Tata Play - ID 987654321",
    amount: 449,
    date: "Dec 8, 2025",
    icon: "tv",
  },
  {
    id: "8",
    type: "debit",
    title: "Money Sent",
    description: "To Priya Patel",
    amount: 1500,
    date: "Dec 5, 2025",
    icon: "arrow-up-circle",
  },
];

const OdhMoney = () => {
  const route = useRoute();
  const amount = route?.params?.amount ?? 0;
  const navigation = useNavigation();

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
        { backgroundColor: item.type === "credit" ? "#E8F5E9" : "#FFEBEE" }
      ]}>
        <Ionicons
          name={item.icon}
          size={22}
          color={item.type === "credit" ? "#4CAF50" : "#F44336"}
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
        <Text style={styles.headerTitle}>ODH Wallet</Text>
        <TouchableOpacity style={styles.backBtn}>
          <MaterialIcons name="more-vert" size={24} color={Theme.colors.text} />
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
              <MaterialIcons name="account-balance-wallet" size={28} color="#FFF" />
            </View>
            <Text style={styles.walletLabel}>ODH Wallet Balance</Text>
          </View>
          <Text style={styles.amount}>₹{amount.toLocaleString()}</Text>
          <Text style={styles.subLabel}>Available for payments</Text>
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

export default OdhMoney;

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
    backgroundColor: Theme.colors.primary,
    borderRadius: 24,
    padding: isSmall ? 20 : 24,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
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
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  walletLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  amount: {
    fontSize: isSmall ? 36 : 44,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -1,
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
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
    backgroundColor: "#000",
    borderRadius: 14,
    paddingVertical: 18,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
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
    borderColor: "#000",
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
    color: "#000",
  },
  transactionSection: {
    marginTop: 28,
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
