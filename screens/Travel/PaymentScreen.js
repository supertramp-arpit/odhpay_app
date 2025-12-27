import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Theme from "../../components/Theme";

const { width } = Dimensions.get("window");
const isSmall = width < 375;

const PAYMENT_METHODS = [
  { id: "upi", name: "UPI", icon: "account-balance", description: "Pay using any UPI app" },
  { id: "card", name: "Credit/Debit Card", icon: "credit-card", description: "Visa, Mastercard, Rupay" },
  { id: "netbanking", name: "Net Banking", icon: "account-balance", description: "All major banks supported" },
  { id: "wallet", name: "Wallet", icon: "account-balance-wallet", description: "Paytm, PhonePe, etc." },
];

const COUPONS = [
  { code: "FIRST50", discount: 50, description: "₹50 off on first booking", minAmount: 500 },
  { code: "TRAVEL100", discount: 100, description: "₹100 off on bookings above ₹1000", minAmount: 1000 },
  { code: "SUMMER20", discount: 20, description: "20% off (max ₹200)", percentage: true, maxDiscount: 200, minAmount: 300 },
];

const PaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bus, searchParams, selectedSeats, passengerDetails, totalPrice } = route.params || {};
  
  const [selectedPayment, setSelectedPayment] = useState("upi");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [showCouponInput, setShowCouponInput] = useState(false);

  const handleBack = () => navigation.goBack();

  const applyCoupon = () => {
    const coupon = COUPONS.find((c) => c.code.toLowerCase() === couponCode.toLowerCase());
    
    if (!coupon) {
      Alert.alert("Invalid Coupon", "The coupon code you entered is not valid.");
      return;
    }
    
    if (totalPrice < coupon.minAmount) {
      Alert.alert("Not Applicable", `Minimum order amount should be ₹${coupon.minAmount}`);
      return;
    }
    
    setAppliedCoupon(coupon);
    setShowCouponInput(false);
    Alert.alert("Coupon Applied!", coupon.description);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.percentage) {
      const discount = (totalPrice * appliedCoupon.discount) / 100;
      return Math.min(discount, appliedCoupon.maxDiscount);
    }
    
    return appliedCoupon.discount;
  };

  const discount = calculateDiscount();
  const convenienceFee = 25;
  const finalAmount = totalPrice - discount + convenienceFee;

  const handlePayment = () => {
    // Simulate payment processing
    Alert.alert(
      "Confirm Payment",
      `Pay ₹${finalAmount.toLocaleString()} using ${PAYMENT_METHODS.find((p) => p.id === selectedPayment)?.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay Now",
          onPress: () => {
            // Simulate payment success
            setTimeout(() => {
              navigation.navigate("TravelBoardingPass", {
                bus,
                searchParams,
                selectedSeats,
                passengerDetails,
                paymentInfo: {
                  transactionId: `TXN${Date.now()}`,
                  amount: finalAmount,
                  paymentMethod: selectedPayment,
                  discount,
                },
              });
            }, 1000);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Theme.colors.surface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Payment</Text>
          <Text style={styles.headerSubtitle}>Secure checkout</Text>
        </View>
        <View style={styles.secureIcon}>
          <MaterialIcons name="lock" size={20} color={Theme.colors.surface} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Journey Summary */}
        <View style={styles.journeyCard}>
          <View style={styles.journeyRow}>
            <View style={styles.journeyInfo}>
              <Text style={styles.journeyTitle}>{bus.name}</Text>
              <Text style={styles.journeyRoute}>
                {searchParams.from_loc} → {searchParams.to_loc}
              </Text>
              <Text style={styles.journeyDetails}>
                {searchParams.selectedDate} • {selectedSeats.length} Passenger(s)
              </Text>
            </View>
            <View style={styles.journeyPrice}>
              <Text style={styles.journeyPriceValue}>₹{totalPrice.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.seatsRow}>
            <MaterialIcons name="airline-seat-flat" size={16} color={Theme.colors.primary} />
            <Text style={styles.seatsText}>Seats: {selectedSeats.map((s) => s.id).join(", ")}</Text>
          </View>
        </View>

        {/* Coupon Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="local-offer" size={20} color={Theme.colors.primary} />
            <Text style={styles.sectionTitle}>Apply Coupon</Text>
          </View>

          {appliedCoupon ? (
            <View style={styles.appliedCoupon}>
              <View style={styles.appliedCouponInfo}>
                <Text style={styles.appliedCouponCode}>{appliedCoupon.code}</Text>
                <Text style={styles.appliedCouponDiscount}>-₹{discount.toLocaleString()} applied</Text>
              </View>
              <TouchableOpacity onPress={removeCoupon}>
                <MaterialIcons name="close" size={20} color={Theme.colors.error} />
              </TouchableOpacity>
            </View>
          ) : showCouponInput ? (
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
                placeholderTextColor={Theme.colors.textSecondary}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.applyBtn} onPress={applyCoupon}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addCouponBtn}
              onPress={() => setShowCouponInput(true)}
            >
              <Text style={styles.addCouponText}>Add Coupon Code</Text>
              <MaterialIcons name="chevron-right" size={20} color={Theme.colors.primary} />
            </TouchableOpacity>
          )}

          {/* Available Coupons */}
          {!appliedCoupon && (
            <View style={styles.availableCoupons}>
              <Text style={styles.availableCouponsTitle}>Available Coupons</Text>
              {COUPONS.map((coupon) => (
                <TouchableOpacity
                  key={coupon.code}
                  style={styles.couponCard}
                  onPress={() => {
                    setCouponCode(coupon.code);
                    applyCoupon();
                  }}
                >
                  <View style={styles.couponLeft}>
                    <Text style={styles.couponCode}>{coupon.code}</Text>
                    <Text style={styles.couponDesc}>{coupon.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.tapToApply}
                    onPress={() => {
                      setCouponCode(coupon.code);
                      setTimeout(applyCoupon, 100);
                    }}
                  >
                    <Text style={styles.tapToApplyText}>Apply</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="payment" size={20} color={Theme.colors.primary} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <View style={styles.paymentMethods}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPayment === method.id && styles.paymentMethodActive,
                ]}
                onPress={() => setSelectedPayment(method.id)}
              >
                <View style={styles.paymentMethodIcon}>
                  <MaterialIcons
                    name={method.icon}
                    size={22}
                    color={selectedPayment === method.id ? Theme.colors.primary : Theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodName}>{method.name}</Text>
                  <Text style={styles.paymentMethodDesc}>{method.description}</Text>
                </View>
                <View style={[styles.radioBtn, selectedPayment === method.id && styles.radioBtnActive]}>
                  {selectedPayment === method.id && <View style={styles.radioBtnInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="receipt" size={20} color={Theme.colors.primary} />
            <Text style={styles.sectionTitle}>Price Details</Text>
          </View>

          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Ticket Fare ({selectedSeats.length} × ₹{bus.price})</Text>
              <Text style={styles.priceValue}>₹{totalPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Convenience Fee</Text>
              <Text style={styles.priceValue}>₹{convenienceFee}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, styles.discountLabel]}>Coupon Discount</Text>
                <Text style={[styles.priceValue, styles.discountValue]}>-₹{discount.toLocaleString()}</Text>
              </View>
            )}
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{finalAmount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.finalPrice}>
          <Text style={styles.finalPriceLabel}>Total</Text>
          <Text style={styles.finalPriceValue}>₹{finalAmount.toLocaleString()}</Text>
          {discount > 0 && <Text style={styles.savedText}>You save ₹{discount}</Text>}
        </View>
        <TouchableOpacity style={styles.payBtn} onPress={handlePayment}>
          <MaterialIcons name="lock" size={18} color={Theme.colors.surface} />
          <Text style={styles.payBtnText}>Pay ₹{finalAmount.toLocaleString()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    backgroundColor: Theme.colors.primary,
    paddingTop: Platform.OS === "android" ? 20 : 25,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: Theme.colors.surface,
    fontSize: isSmall ? 17 : 19,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  secureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  journeyCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 16,
  },
  journeyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  journeyInfo: {
    flex: 1,
  },
  journeyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 4,
  },
  journeyRoute: {
    fontSize: 13,
    color: Theme.colors.text,
    fontWeight: "500",
    marginBottom: 2,
  },
  journeyDetails: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  journeyPrice: {},
  journeyPriceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.primary,
  },
  seatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  seatsText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: "500",
  },
  section: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  appliedCoupon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E8F5E9",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#A5D6A7",
    borderStyle: "dashed",
  },
  appliedCouponInfo: {},
  appliedCouponCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E7D32",
  },
  appliedCouponDiscount: {
    fontSize: 12,
    color: "#388E3C",
    marginTop: 2,
  },
  couponInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  couponInput: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Theme.colors.text,
    fontWeight: "600",
  },
  applyBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: "center",
  },
  applyBtnText: {
    color: Theme.colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  addCouponBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.background,
    padding: 14,
    borderRadius: 10,
  },
  addCouponText: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  availableCoupons: {
    marginTop: 16,
  },
  availableCouponsTitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: "600",
    marginBottom: 10,
  },
  couponCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: Theme.colors.background,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderStyle: "dashed",
  },
  couponLeft: {},
  couponCode: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  couponDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  tapToApply: {
    backgroundColor: `${Theme.colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tapToApplyText: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  paymentMethods: {
    gap: 10,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  paymentMethodActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: `${Theme.colors.primary}05`,
  },
  paymentMethodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  paymentMethodDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  radioBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioBtnActive: {
    borderColor: Theme.colors.primary,
  },
  radioBtnInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.primary,
  },
  priceBreakdown: {
    gap: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  discountLabel: {
    color: "#2E7D32",
  },
  discountValue: {
    color: "#2E7D32",
  },
  priceDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.primary,
  },
  bottomBar: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 12 : 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  finalPrice: {},
  finalPriceLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  finalPriceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  savedText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "600",
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  payBtnText: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
});

export default PaymentScreen;
