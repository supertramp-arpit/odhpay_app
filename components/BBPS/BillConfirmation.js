import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Theme from "../Theme";

const { width } = Dimensions.get("window");

const BillConfirmation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { top: safeTop, bottom: safeBottom } = useSafeAreaInsets();

  const {
    data,
    paymentBnak,
    tagName,
    biller_id,
    billerCategory,
    billerName,
    paymentChannels = [],
    infoData = {}
  } = route.params || {};

  // Must be declared with the other hooks, BEFORE the `if (!data) return` below —
  // a useState after a conditional return violates the Rules of Hooks and can
  // crash the screen.
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: tagName || billerCategory || "Pay Bill",
      headerRight: () => (
        <Image
          source={require("../../assets/BharatConnectReverseLogo.png")}
          style={{ width: 80, height: 28, marginRight: 8 }}
          resizeMode="contain"
        />
      ),
    });
  }, [navigation, tagName, billerCategory]);

  if (!data) {
    return (
      <View style={[styles.container, { paddingTop: safeTop }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bill Payment</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Theme.colors.danger} />
          <Text style={styles.errorText}>No bill data found</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  let minAmountDue = paymentChannels?.[0]?.minAmount ? parseFloat(paymentChannels[0].minAmount) : null;
  let maxAmount = paymentChannels?.[0]?.maxAmount ? parseFloat(paymentChannels[0].maxAmount) : null;

  const billDetails = {
    customerName: data?.customer_name || "N/A",
    billDate: data?.bill_date ? moment(data.bill_date).format("DD MMM YYYY") : "N/A",
    minAmountDue: minAmountDue,
    maxAmount: maxAmount,
    totalAmount: data?.bill_amount ? data.bill_amount / 100 : 0,
    cardNumber: data?.card_number || "XXXXXXXXXXXXX8768",
    dueDate: data?.due_date ? moment(data.due_date).format("DD MMM YYYY") : "N/A",
    billNumber: data?.bill_number || "N/A",
    billPeriod: data?.bill_period || "N/A",
    referenceNo: data?.reference_no || "N/A",
  };

  const handleProceed = async () => {
    const finalAmount = billDetails.totalAmount;

    if (!finalAmount || finalAmount <= 0) {
      Alert.alert('Error', 'Invalid amount for payment');
      return;
    }

    try {
      setPaymentLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      const bbpsPayload = {
        amount: billDetails.totalAmount,
        purpose: "bbps_payment",
        bbps_data: {
          biller_id: biller_id,
          biller_name: billerName,
          category: billerCategory,
          customer_params: {},
          service_type: 'BBPS',
          purpose: `${tagName} Payment`,
          fetch_reference_id: billDetails.referenceNo || '',
          bill_info: {
            bill_amount: billDetails.totalAmount,
            bill_number: billDetails.billNumber,
            bill_date: data?.bill_date,
            due_date: data?.due_date,
            customer_name: billDetails?.customerName || "",
            bill_period: billDetails.billPeriod,
          },
        }
      };

      navigation.navigate('PayFromWallet', {
        autoStart: false,
        origin: 'BillFetch2',
        returnTo: 'HomeScreen',
        amount: finalAmount,
        payload: bbpsPayload,
      });

    } catch (err) {
      console.error('Payment Error:', err);
      if (axios.isAxiosError(err)) {
        Alert.alert('Error', err.response?.data?.message || 'Failed to initiate payment');
      } else {
        Alert.alert('Error', 'Failed to initiate payment. Please try again.');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const isDueSoon = () => {
    if (billDetails.dueDate === "N/A") return false;
    const dueDate = moment(data?.due_date);
    const daysUntilDue = dueDate.diff(moment(), 'days');
    return daysUntilDue <= 7 && daysUntilDue >= 0;
  };

  const isOverdue = () => {
    if (billDetails.dueDate === "N/A") return false;
    return moment().isAfter(moment(data?.due_date));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: safeBottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Bill Details with Biller Header */}
        <View style={styles.card}>
          {/* Biller as Header */}
          <View style={styles.billerHeader}>
            <View style={styles.billerIcon}>
              <Text style={styles.billerInitials}>
                {paymentBnak?.substring(0, 2).toUpperCase() || "BL"}
              </Text>
            </View>
            <View style={styles.billerInfo}>
              <Text style={styles.billerName} numberOfLines={2}>
                {paymentBnak || billerName || "Biller"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {billDetails.customerName && billDetails.customerName !== "N/A" && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer Name</Text>
              <Text style={styles.detailValue}>{billDetails.customerName}</Text>
            </View>
          )}

          {billDetails.billNumber !== "N/A" && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bill Number</Text>
              <Text style={styles.detailValue}>{billDetails.billNumber}</Text>
            </View>
          )}

          {billDetails.billDate !== "N/A" && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bill Date</Text>
              <Text style={styles.detailValue}>{billDetails.billDate}</Text>
            </View>
          )}

          {billDetails.billPeriod && billDetails.billPeriod !== "N/A" && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bill Period</Text>
              <Text style={styles.detailValue}>{billDetails.billPeriod}</Text>
            </View>
          )}

          {infoData && Object.keys(infoData).length > 0 && (
            Object.entries(infoData).map(([key, value], index) => (
              <View style={styles.detailRow} key={index}>
                <Text style={styles.detailLabel}>{key}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ))
          )}

          {/* Total Amount - aligned row */}
          <View style={styles.amountSection}>
            <View style={styles.amountRowMain}>
              <Text style={styles.amountBoxLabel}>Total Amount</Text>
              <View style={styles.amountBoxRow}>
                <Text style={styles.amountBoxCurrency}>₹</Text>
                <Text style={styles.amountBoxValue}>
                  {billDetails.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
            {billDetails.dueDate !== "N/A" && (
              <View style={styles.dueRow}>
                <View style={[
                  styles.dueBadgeInline,
                  isOverdue() && styles.dueBadgeOverdue,
                  isDueSoon() && !isOverdue() && styles.dueBadgeSoon
                ]}>
                  <Ionicons
                    name={isOverdue() ? "alert-circle" : "calendar-outline"}
                    size={12}
                    color={isOverdue() ? "#DC2626" : isDueSoon() ? "#B45309" : "#047857"}
                  />
                  <Text style={[
                    styles.dueTextInline,
                    isOverdue() && styles.dueTextOverdue,
                    isDueSoon() && !isOverdue() && styles.dueTextSoon
                  ]}>
                    {isOverdue() ? "Overdue" : "Due"}: {billDetails.dueDate}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={18} color={Theme.colors.warning} />
          <Text style={styles.noteText}>
            Payment will be processed instantly. It may take up to 30 minutes to reflect in your account.
          </Text>
        </View>

        {/* Security */}
        <View style={styles.securityRow}>
          <MaterialIcons name="lock" size={14} color="rgba(255,255,255,0.5)" />
          <Text style={styles.securityText}>Secured by 256-bit SSL encryption</Text>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(safeBottom, 16) }]}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalAmount}>
            ₹{billDetails.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, paymentLoading && styles.payButtonDisabled]}
          onPress={handleProceed}
          disabled={paymentLoading}
          activeOpacity={0.8}
        >
          {paymentLoading ? (
            <ActivityIndicator size="small" color={Theme.colors.secondary} />
          ) : (
            <>
              <Text style={styles.payButtonText}>Pay Now</Text>
              <Ionicons name="arrow-forward" size={18} color={Theme.colors.secondary} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: 12,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: Theme.colors.secondary,
    fontWeight: "600",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Amount Section - Realistic Glass Lens
  amountSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  // Total amount - plain aligned row
  amountRowMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountBoxLabel: {
    fontSize: 15,
    color: Theme.colors.text,
    fontWeight: "700",
  },
  amountBoxRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  amountBoxCurrency: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
    marginRight: 2,
  },
  amountBoxValue: {
    fontSize: 26,
    fontWeight: "800",
    color: Theme.colors.text,
    letterSpacing: -0.5,
  },
  dueRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  dueBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(16,185,129,0.12)",
    gap: 4,
  },
  dueBadgeSoon: {
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  dueBadgeOverdue: {
    backgroundColor: "rgba(239,68,68,0.12)",
  },
  dueTextInline: {
    fontSize: 11,
    fontWeight: "600",
    color: "#047857",
  },
  dueTextSoon: {
    color: "#B45309",
  },
  dueTextOverdue: {
    color: "#DC2626",
  },

  // Card - Glassy White
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },

  // Biller Header (inside Bill Details card)
  billerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  billerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  billerInitials: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.colors.secondary,
  },
  billerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  billerName: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginBottom: 12,
  },

  // Detail Row
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  detailLabel: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.text,
    flex: 1,
    textAlign: "right",
  },

  // Note - Glassy
  noteCard: {
    flexDirection: "row",
    backgroundColor: "rgba(254,243,199,0.85)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    marginLeft: 10,
    lineHeight: 18,
  },

  // Security
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  securityText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginLeft: 6,
  },

  // Bottom Bar - Glassy
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.92)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  totalSection: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.secondary,
  },
});

export default BillConfirmation;
