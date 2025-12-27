import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Theme from "../../Theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallDevice = SCREEN_WIDTH < 375;

const formatAmount = (amount) => {
  if (!amount) return "₹0";
  const rupees = amount / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
};

// DTH Recharge Card
export const DTHItem = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.9}
      onPress={() => onPress(item)}
    >
      <LinearGradient
        colors={["#7B1FA2", "#9C27B0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        <View style={styles.topSection}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="tv" size={28} color="#7B1FA2" />
          </View>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName} numberOfLines={1}>{item.biller_name}</Text>
            <Text style={styles.subscriberId}>{item.input_params}</Text>
          </View>
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceAmount}>{formatAmount(item.amount)}</Text>
          </View>
        </View>
        {item.customer_name && (
          <Text style={styles.customerName}>{item.customer_name}</Text>
        )}
        <TouchableOpacity style={styles.rechargeBtn} onPress={() => onPress(item)}>
          <Text style={styles.rechargeBtnText}>Recharge Now</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#7B1FA2" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Broadband Card
export const BroadbandItem = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.9}
      onPress={() => onPress(item)}
    >
      <LinearGradient
        colors={["#1565C0", "#1E88E5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        <View style={styles.topSection}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="router" size={28} color="#1565C0" />
          </View>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName} numberOfLines={1}>{item.biller_name}</Text>
            <Text style={styles.subscriberId}>{item.input_params}</Text>
          </View>
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Due</Text>
            <Text style={styles.balanceAmount}>{formatAmount(item.amount)}</Text>
          </View>
        </View>
        {item.customer_name && (
          <Text style={styles.customerName}>{item.customer_name}</Text>
        )}
        <TouchableOpacity style={[styles.rechargeBtn, { borderColor: "#1565C0" }]} onPress={() => onPress(item)}>
          <Text style={[styles.rechargeBtnText, { color: "#1565C0" }]}>Pay Now</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#1565C0" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Cable TV Card
export const CableTVItem = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.9}
      onPress={() => onPress(item)}
    >
      <LinearGradient
        colors={["#6A1B9A", "#8E24AA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        <View style={styles.topSection}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="live-tv" size={28} color="#6A1B9A" />
          </View>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName} numberOfLines={1}>{item.biller_name}</Text>
            <Text style={styles.subscriberId}>{item.input_params}</Text>
          </View>
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Amount</Text>
            <Text style={styles.balanceAmount}>{formatAmount(item.amount)}</Text>
          </View>
        </View>
        {item.customer_name && (
          <Text style={styles.customerName}>{item.customer_name}</Text>
        )}
        <TouchableOpacity style={[styles.rechargeBtn, { borderColor: "#6A1B9A" }]} onPress={() => onPress(item)}>
          <Text style={[styles.rechargeBtnText, { color: "#6A1B9A" }]}>Recharge</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#6A1B9A" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Subscription Card
export const SubscriptionItem = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.simpleCard}
      activeOpacity={0.8}
      onPress={() => onPress(item)}
    >
      <View style={[styles.simpleIconBox, { backgroundColor: "#FCE4EC" }]}>
        <MaterialIcons name="subscriptions" size={26} color="#E91E63" />
      </View>
      <View style={styles.simpleInfo}>
        <Text style={styles.simpleBillerName} numberOfLines={1}>{item.biller_name}</Text>
        <Text style={styles.simpleSubText}>{item.input_params}</Text>
      </View>
      <View style={styles.simpleAmountSection}>
        <Text style={styles.simpleAmount}>{formatAmount(item.amount)}</Text>
        <TouchableOpacity style={[styles.simplePayBtn, { backgroundColor: "#E91E63" }]} onPress={() => onPress(item)}>
          <Text style={styles.simplePayBtnText}>Pay</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 14,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  subscriberId: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  balanceSection: {
    alignItems: "flex-end",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  customerName: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginBottom: 10,
  },
  rechargeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 20,
  },
  rechargeBtnText: {
    color: "#7B1FA2",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  // Simple card styles
  simpleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  simpleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  simpleInfo: {
    flex: 1,
    marginRight: 8,
  },
  simpleBillerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  simpleSubText: {
    fontSize: 12,
    color: "#888",
  },
  simpleAmountSection: {
    alignItems: "flex-end",
  },
  simpleAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  simplePayBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  simplePayBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
