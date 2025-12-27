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

const FasTagItem = ({ item, onPress }) => {
  const vehicleNumber = item.input_params || "XX XX XX XXXX";

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.9}
      onPress={() => onPress(item)}
    >
      <LinearGradient
        colors={["#FF6B35", "#F7931E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        {/* Top Row */}
       

        {/* Vehicle Info */}
        <View style={styles.vehicleSection}>
          <View style={styles.vehicleIconBox}>
            <MaterialIcons name="directions-car" size={32} color="#FF6B35" />
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
            <Text style={styles.billerName} numberOfLines={1}>{item.biller_name}</Text>
          </View>
        </View>

        {/* Bottom Row */}
        <View style={styles.bottomRow}>
          {item.customer_name && (
            <Text style={styles.ownerName}>{item.customer_name}</Text>
          )}
          <TouchableOpacity style={styles.rechargeBtn} onPress={() => onPress(item)}>
            <Text style={styles.rechargeBtnText}>Recharge</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  card: {
    borderRadius: 16,
    padding: 18,
    minHeight: 160,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  fastagBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fastagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  balanceContainer: {
    alignItems: "flex-end",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  vehicleSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  vehicleIconBox: {
    width: 50,
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 2,
  },
  billerName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ownerName: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    flex: 1,
  },
  rechargeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  rechargeBtnText: {
    color: "#FF6B35",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 4,
  },
});

export default FasTagItem;
