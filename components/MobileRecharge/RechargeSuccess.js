import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  BackHandler,
} from "react-native";
import { ChevronDown, Smartphone } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useRegisterStore } from "../../store/useRegisterStore";
import { correctPath } from "../../utils/helper";
import moment from "moment";
import { Wallet } from "lucide-react-native";

import Theme from "../Theme";
import { useAppStore } from "../../store/useAppStore";
// import ViewShot from "react-native-view-shot";
// import Share from "react-native-share";
// import RNFS from "react-native-fs";

const RechargeSuccess = () => {
  const navigation = useNavigation();
  const { user } = useRegisterStore();

  // The recharge flow is done — clear it out so the user cannot navigate
  // back through RechargeTrxPin → RechargeScreenPay → Recharge plans and
  // accidentally re-initiate. Reset the stack to MainApp (bottom tabs).
  const goHome = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: "MainApp" }] });
  }, [navigation]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        goHome();
        return true;
      }
    );
    return () => backHandler.remove();
  }, [goHome]);

  // Hide the native header back arrow so swipe-back / arrow can't escape.
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
      gestureEnabled: false,
    });
  }, [navigation]);

  const route = useRoute();

  const {
    amount = 0,
    mobile_number = "",
    recipient_name = "",
    responseData = {},
    RechargeStatus = "",
  } = route.params || {};

  // Recharge can land in three states from the polling loop in RechargeTrxPin:
  //   success  → BillAvenue confirmed completed
  //   failed   → terminal failure, wallet refunded
  //   pending  → background dispatch hasn't finalized within the poll window;
  //              will be confirmed via FCM/status check shortly. Treat this as
  //              an OK-ish state, NOT failed — the user paid and the recharge
  //              is likely already done at the operator's end.
  const statusKey = (RechargeStatus || "").toLowerCase();
  const isSuccess = statusKey === "success";
  const isFailed = statusKey === "failed";
  const isPending = !isSuccess && !isFailed;

  const statusUI = isSuccess
    ? { label: "Recharge successful", bg: Theme.colors.success || "#10B981", glyph: "✓", glyphColor: "green" }
    : isFailed
    ? { label: "Recharge Failed", bg: Theme.colors.danger, glyph: "✗", glyphColor: "red" }
    : { label: "Recharge in process", bg: "#F59E0B", glyph: "⏱", glyphColor: "#92400E" };

  const transactionDetails = {
    status: statusUI.label,
    timestamp: moment(responseData.transaction_date).format(
      "hh:mm a on DD MMM YYYY"
    ),
    provider: recipient_name,
    number: mobile_number,
    amount: amount,
    platformFee: 3,
    transactionId: "NX250302122516459444463321",
    referenceId: responseData.bbps_reference_no || "N/A",
    debitedFrom: `XXX${user?.user?.MobileNumber?.slice(-4) || "XXXX"}`,
    utr: "598867981302",
  };

  const handleShare = async () => {
    // Simple share using react-native Share API
    try {
      const { Share } = require('react-native');
      await Share.share({
        message: `Recharge ${RechargeStatus === "success" ? "Successful" : "Failed"}
Amount: ₹${amount}
Mobile: ${mobile_number}
Operator: ${recipient_name}
Reference: ${responseData.bbps_reference_no || "N/A"}
Date: ${moment(responseData.transaction_date).format("DD MMM YYYY hh:mm a")}`,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View
        style={{ backgroundColor: "#fff" }}
      >
        <View style={[styles.header, { backgroundColor: statusUI.bg }]}>
          <View style={styles.iconCircle}>
            <Text style={[styles.checkmark, { color: statusUI.glyphColor }]}>
              {statusUI.glyph}
            </Text>
          </View>
          <Text style={styles.headerTitle}>{transactionDetails.status}</Text>
          <Text style={styles.timestamp}>{transactionDetails.timestamp}</Text>
          {isPending && (
            <Text style={styles.pendingNote}>
              Your wallet was debited and the recharge is being processed.
              We'll notify you once it's done.
            </Text>
          )}
        </View>

        {/* Mobile Recharge Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mobile recharged</Text>
          <View style={styles.rechargeInfo}>
            <View style={styles.providerInfo}>
              <Smartphone size={24} color="#5B21B6" />
              <View style={styles.providerDetails}>
                <Text style={styles.providerName}>
                  {transactionDetails.provider}
                </Text>
                <Text style={styles.phoneNumber}>
                  {transactionDetails.number}
                </Text>
              </View>
            </View>
            <Text style={styles.amount}>₹{transactionDetails.amount}</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.paymentHeader} onPress={() => {}}>
            <View style={styles.paymentHeaderLeft}>
              <Wallet size={25} color="black" />
              <Text style={styles.paymentHeaderText}>Payment details</Text>
            </View>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>

          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recharge Amount</Text>
              <Text style={styles.detailValue}>
                ₹{transactionDetails.amount}
              </Text>
            </View>

            <View style={styles.idSection}>
              <Text style={styles.idLabel}>
                {transactionDetails.recipient_name} Prepaid Reference ID
              </Text>
              <Text style={styles.idValue}>
                {transactionDetails.referenceId}
              </Text>
            </View>

            <View style={styles.debitedSection}>
              <Text style={styles.debitedLabel}>
                {" "}
                {isSuccess
                  ? "Debited from"
                  : isPending
                  ? "Debited from (recharge in process)"
                  : "Amount will be refunded if debited"}
              </Text>
              <View style={styles.debitedInfo}>
                <Image
                  source={
                    user?.user?.profile
                      ? {
                          uri: correctPath(
                            `https://newapi.odhpay.com/${user?.user?.profile}`
                          ),
                        }
                      : require("../../assets/Profilee.png")
                  }
                  style={styles.bankIcon}
                />
                <View style={styles.debitedDetails}>
                  <Text style={styles.accountNumber}>
                    {transactionDetails.debitedFrom}
                  </Text>
                  <Text style={styles.utrNumber}>
                    UTR: {transactionDetails.utr}
                  </Text>
                </View>
                <Text style={styles.debitedAmount}>
                  ₹{transactionDetails.amount}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Share Button */}
      <TouchableOpacity
        style={[styles.shareButton, { backgroundColor: statusUI.bg }]}
        onPress={handleShare}
      >
        <Text style={styles.shareButtonText}>Share receipt</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.homeButton} onPress={goHome} activeOpacity={0.85}>
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 32,
    color: "#5B21B6",
  },
  headerTitle: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  pendingNote: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  section: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: "#f5f5f5",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  rechargeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  providerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  providerDetails: {
    marginLeft: 12,
  },
  providerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  phoneNumber: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: "600",
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  paymentHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  receiptIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  paymentHeaderText: {
    fontSize: 18,
    fontWeight: "500",
  },
  paymentDetails: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  idSection: {
    marginTop: 24,
  },
  idLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  idValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  debitedSection: {
    marginTop: 24,
  },
  debitedLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  debitedInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  debitedDetails: {
    flex: 1,
    marginLeft: 12,
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: "500",
  },
  utrNumber: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  debitedAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  shareButton: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  homeButton: {
    marginHorizontal: 16,
    marginTop: -4,
    marginBottom: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    backgroundColor: "#FFF",
  },
  homeButtonText: {
    color: Theme.colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    marginBottom: 24,
  },
  poweredBy: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  bankLogo: {
    width: 100,
    height: 24,
  },
});

export default RechargeSuccess;
