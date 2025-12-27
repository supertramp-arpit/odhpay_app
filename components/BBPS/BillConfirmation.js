import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Theme from "../Theme";

const BillFetch2 = () => {
  const navigation = useNavigation();
  // Get data from route data or use default values
  const route = useRoute();
  const { data, paymentBnak, tagName, biller_id, billerCategory, billerName, paymentChannels = [], activeGateway = "" } = route.params || {};



  // Handle case where data might be undefined
  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay Bill</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 16 }}>Error: No bill data found</Text>
        </View>
      </View>
    );
  }

  // Extract min and max from paymentChannels - purely dynamic, no static values
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

  const handleBack = () => {
    navigation?.goBack();
  };

  const [paymentLoading, setPaymentLoading] = useState(false);

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



      // Build BBPS-specific payload with all required fields
      const bbpsPayload = {

        bbps_data: {
          biller_id: biller_id,
          biller_name: billerName,
          category: billerCategory,
          customer_params: {},
          service_type: 'BBPS',
          purpose: `${tagName} Payment`,
          fetch_reference_id: billDetails.billNumber || '',
          bill_info: {
            bill_amount: billDetails.totalAmount,
            bill_number: billDetails.referenceNo,
            bill_date: data?.bill_date,
            due_date: data?.due_date,
            customer_name: billDetails?.customerName || "",
            bill_period: billDetails.billPeriod,
          },
        }
      };

      // Navigate to appropriate payment gateway

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

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay {tagName || "Bill"}</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >


        {/* Card Details */}
        <View style={styles.cardDetails}>
          <View style={styles.bankInfo}>
            <View style={styles.initialsCircle}>
              <Text style={styles.initials}>{paymentBnak?.substring(0, 2).toUpperCase() || "BL"}</Text>
            </View>
            <View style={styles.bankTextContainer}>
              <Text style={styles.bankName}>
                {paymentBnak || "Biller"}
              </Text>
            </View>
          </View>

          {/* Bill Details Section */}
          <View style={styles.billDetails}>
            <View style={styles.billHeader}>
              <Text style={styles.billDetailsTitle}>Bill Details:</Text>
            </View>

            {billDetails.customerName !== "N/A" && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer Name</Text>
                <Text style={styles.detailValue}>{billDetails.customerName}</Text>
              </View>
            )}

            {billDetails.billDate !== "N/A" && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bill Date</Text>
                <Text style={styles.detailValue}>{billDetails.billDate}</Text>
              </View>
            )}

            {billDetails.billNumber !== "N/A" && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bill Number</Text>
                <Text style={styles.detailValue}>{billDetails.billNumber}</Text>
              </View>
            )}

           
          </View>

          {/* Amount Display */}
          <View style={styles.amountDisplay}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <Text style={styles.amount}>{billDetails.totalAmount.toFixed(2)}</Text>
          </View>

          {billDetails.dueDate !== "N/A" && (
            <Text style={styles.dueDate}>Due Date: {billDetails.dueDate}</Text>
          )}

          
          {/* Note */}
          <View style={styles.noteContainer}>
            <View style={styles.noteLine} />
            <Text style={styles.noteText}>
              Note: {paymentBnak || "Biller"} will consider today's date as payment date. It may take upto 30 minutes to reflect in account.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Proceed Button */}
      <TouchableOpacity
        style={[styles.proceedButton, paymentLoading && { opacity: 0.6 }]}
        onPress={handleProceed}
        disabled={paymentLoading}
      >
        {paymentLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.proceedButtonText}>PROCEED TO PAY</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: StatusBar.currentHeight + 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    flex: 1,
  },
  helpButton: {
    marginLeft: 8,
  },
  banner: {
    backgroundColor: Theme.colors.primary,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    overflow: "hidden",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerImage: {
    width: 80,
    height: 80,
    marginRight: 16,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    color: "white",
    fontSize: 16,
  },
  bannerAmount: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 4,
  },
  bannerSubtitle: {
    color: "white",
    fontSize: 14,
  },
  payNowButton: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  payNowText: {
    color: Theme.colors.primary,
    fontWeight: "500",
  },
  termsText: {
    color: "white",
    fontSize: 12,
    alignSelf: "flex-end",
    marginTop: 8,
  },
  cardDetails: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  initialsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E57373",
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "white",
    fontSize: 20,
    fontWeight: "500",
  },
  bankTextContainer: {
    marginLeft: 12,
  },
  bankName: {
    color: "black",
    fontSize: 16,
    fontWeight: "500",
    marginRight: 30,

  },
  cardNumber: {
    color: "#9E9E9E",
    marginTop: 4,
  },
  billDetails: {
    marginBottom: 24,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  billDetailsTitle: {
    color: "black",
    fontSize: 14,
  },
  hideButton: {
    color: Theme.colors.primary,
    fontSize: 14,
  },


   detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  detailLabel: {
    width: 120,
    color: "#9E9E9E",
    fontSize: 14,
    marginRight: 12,
  },
  detailValue: {
    flex: 1,
    color: "#9E9E9E",
    fontSize: 14,
    flexWrap: "wrap",
    textAlign: "right",
  },
  amountDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  rupeeSymbol: {
    color: "black",
    fontSize: 24,
    marginRight: 4,
  },
  amount: {
    color: "black",
    fontSize: 32,
    fontWeight: "500",
  },
  dueDate: {
    color: "#FF8A65",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  amountOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  amountOption: {
    borderWidth: 1,
    borderColor: "#B388FF",
    borderRadius: 12,
    padding: 12,
    flex: 0.48,
  },
  amountOptionLabel: {
    color: "#9E9E9E",
    fontSize: 12,
    marginBottom: 4,
  },
  amountOptionValue: {
    color: "#B388FF",
    fontSize: 16,
    fontWeight: "500",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  noteLine: {
    width: 4,
    height: "100%",
    backgroundColor: "#FF8A65",
    marginRight: 12,
    borderRadius: 2,
  },
  noteText: {
    color: "#9E9E9E",
    fontSize: 12,
    flex: 1,
  },
  proceedButton: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  proceedButtonText: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default BillFetch2;
