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

// Bank color mappings for credit cards
const BANK_COLORS = {
  ICICI: ["#F35815", "#B8410F"],
  HDFC: ["#004C8F", "#002D5A"],
  SBI: ["#1E88E5", "#0D47A1"],
  AXIS: ["#6B2C70", "#4A1D4E"],
  KOTAK: ["#ED1C24", "#B91318"],
  RBL: ["#F9A825", "#F57F17"],
  INDUSIND: ["#005BAC", "#003D73"],
  YES: ["#0066B3", "#004080"],
  CITI: ["#003DA5", "#002766"],
  AMEX: ["#006FCF", "#004C99"],
  DEFAULT: ["#667eea", "#764ba2"],
};

const getBankGradient = (billerName) => {
  const name = billerName?.toUpperCase() || "";
  for (const [bank, colors] of Object.entries(BANK_COLORS)) {
    if (name.includes(bank)) {
      return colors;
    }
  }
  return BANK_COLORS.DEFAULT;
};

const getBankAbbreviation = (billerName) => {
  const name = billerName?.toUpperCase() || "";
  if (name.includes("ICICI")) return "ICICI";
  if (name.includes("HDFC")) return "HDFC";
  if (name.includes("SBI")) return "SBI";
  if (name.includes("AXIS")) return "AXIS";
  if (name.includes("KOTAK")) return "KOTAK";
  if (name.includes("RBL")) return "RBL";
  if (name.includes("INDUSIND")) return "INDUSIND";
  if (name.includes("YES")) return "YES";
  if (name.includes("CITI")) return "CITI";
  if (name.includes("AMEX")) return "AMEX";
  return billerName?.split(" ")[0] || "BANK";
};

const formatAmount = (amount) => {
  if (!amount) return "₹0";
  // Amount comes in paise, convert to rupees
  const rupees = amount / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(rupees);
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day}${getDaySuffix(day)} ${month}`;
};

const getDaySuffix = (day) => {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
};

const getCardLastFour = (inputParams) => {
  if (!inputParams) return "XXXX";

  let values = [];

  // ✅ If object (raw_input_params)
  if (typeof inputParams === "object") {
    values = Object.values(inputParams);
  }

  // ✅ If string ("9648505106, 3103")
  if (typeof inputParams === "string") {
    values = inputParams.split(",").map(v => v.trim());
  }

  console.log("Input parameters for card number extraction:", values);

  const cardNum = values.find(
    v => v && v.toString().replace(/\D/g, "").length === 4
  );

  console.log("Extracted card number value:", cardNum);

  if (cardNum) {
    return cardNum.toString().replace(/\D/g, "").slice(-4);
  }

  return "XXXX";
};


const CreditCardItem = ({ item, onPress }) => {
  const gradientColors = getBankGradient(item.biller_name);
  const bankName = getBankAbbreviation(item.biller_name);
  const cardLastFour = getCardLastFour(item.input_params);

  console.log("Rendering CreditCardItem for:", item);

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.9}
      onPress={() => onPress(item)}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.bankInfo}>
            <MaterialIcons name="credit-card" size={18} color="#fff" />
            <Text style={styles.bankName}>{item.biller_name}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>{formatAmount(item.amount)}</Text>
            {item.due_date && (
              <Text style={styles.dueDate}>Due on {formatDate(item.due_date)}</Text>
            )}
          </View>
        </View>

        {/* Card Chip & Number */}
        <View style={styles.cardMiddle}>
          <View style={styles.chipContainer}>
            <View style={styles.chip}>
              <View style={styles.chipLine} />
              <View style={styles.chipLine} />
              <View style={styles.chipLine} />
            </View>
          </View>
          <Text style={styles.cardNumber}>XX {cardLastFour}</Text>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customer_name || "Card Holder"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => onPress(item)}
          >
            <Text style={styles.payButtonText}>Pay Now</Text>
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  card: {
    borderRadius: 16,
    padding: 20,
    minHeight: 180,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bankName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    opacity: 0.95,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  dueDate: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  cardMiddle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  chipContainer: {
    marginRight: 12,
  },
  chip: {
    width: 40,
    height: 30,
    backgroundColor: "#D4AF37",
    borderRadius: 4,
    padding: 4,
    justifyContent: "space-between",
  },
  chipLine: {
    height: 3,
    backgroundColor: "#B8960C",
    borderRadius: 1,
  },
  cardNumber: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  payButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  payButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default CreditCardItem;
