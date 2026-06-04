import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Theme from "../Theme";

const BillFetch = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState("0");
  const [errorMessage, setErrorMessge] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const currencySymbol = "₹";

  const route = useRoute();
  const {
    data,
    paymentBnak = "",
    tagName = "",
    billerCategory = "",
    IsAmountEditable = null,
    biller_id = "",
    urlData = "",
    iconImage = "",
    paymentChannels = [],
    infoData = {},
  } = route.params || {};


  const additionalInfoList = data?.additional_info?.info || [];
  console.log("BillFetch - additionalInfoList:", additionalInfoList);
  console.log("BillFetch - infoData:", infoData);


  const amounts = ["500", "1000", "2000", "3000"];
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleBack = () => {
    navigation?.goBack();
  };



  const baseDetails = [
    { label: "Customer Name", value: data?.customer_name },
    // { label: "Reference No", value: data?.reference_no },
    { label: "Bill Period", value: data?.bill_period },
    { label: "Bill Date", value: data?.bill_date },
    { label: "Due Date", value: data?.due_date },
  ];

  // Convert infoData object to array format for display
  const infoDataArray = infoData && Object.keys(infoData).length > 0
    ? Object.entries(infoData).map(([key, value]) => ({ label: key, value: value }))
    : [];

  const filteredBillDetails = [
    ...baseDetails,
    ...(additionalInfoList || []).map((item) => ({
      label: item?.infoName || "",
      value: item?.infoValue,
    })),
    ...infoDataArray,
  ].filter(
    (item) =>
      item.value !== "NA" &&
      item.value !== "N/A" &&
      item.value !== null &&
      item.value !== undefined &&
      item.value !== "" &&
      item.label &&
      !item.label.toLowerCase().includes("current outstanding") &&
      !item.label.toLowerCase().includes("maximum")
  );

  const hasBillAmount = !!data?.bill_amount || !!data?.amount;

  // Amount in Rupees (convert from paise if needed)
  const resolvedAmount = data?.bill_amount ? parseFloat(data?.bill_amount) / 100 : (data?.amount ? parseFloat(data?.amount) / 100 : 0);

  // let minAmount = additionalInfoList.map((item) => ({
  //     label: item?.infoName || "",
  //     value: item?.infoValue,
  //   })).find((item) => item.label.toLowerCase() === "minimum amount due")?.value;

  // if (minAmount) {
  //   minAmount = parseFloat(minAmount);
  // } else {
  //   minAmount = null;
  // };
  let minAmount = paymentChannels?.[0]?.minAmount ? parseFloat(paymentChannels[0].minAmount) : null;
  let maxAmount = paymentChannels?.[0]?.maxAmount ? parseFloat(paymentChannels[0].maxAmount) : null;

  // Credit-card bills: allow any amount — skip the biller's min/max channel limits.
  // Every other category keeps the limits enforced. (billerCategory is the reliable
  // signal; tagName is the endpoint/category label and also reads "Credit Card" here.)
  const isCreditCard = /credit\s*card/i.test(`${billerCategory || ""} ${tagName || ""}`);


  const [errorMessge, setErrorMessage] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);



  const handleProceed = async () => {
    const numAmount = parseFloat(amount) || 0;

    // Always require a positive amount (incl. credit cards).
    if (numAmount <= 0) {
      setErrorMessge("Please enter a valid amount");
      return;
    }

    // Validate min/max only if defined — but credit-card bills allow any amount.
    if (!isCreditCard && minAmount !== null && numAmount < minAmount) {
      setErrorMessge(`Minimum amount should be ₹${minAmount}`);
      return;
    }

    if (!isCreditCard && maxAmount !== null && numAmount > maxAmount) {
      setErrorMessge(`Maximum amount should be ₹${maxAmount}`);
      return;
    }



    setErrorMessage('');
    try {
      const finalAmount = Number(amount); // final amount

      // Build BBPS-specific payload with all required fields
      const bbpsPayload = {
        amount: (finalAmount).toString(), // amount in paise
        service_type: 'BBPS',
        purpose: "bbps_payment",
        bbps_data: {

          biller_name: paymentBnak,
          biller_id: biller_id,
          category: tagName,
          customer_params: urlData,
          fetch_reference_id: data?.reference_no,

          bill_info: {
            bill_amount: data?.bill_amount,
            customer_name: data?.customer_name,
            bill_period: data?.bill_period,
            bill_date: data?.bill_date,
            due_date: data?.due_date,
          },
        }
      };

      console.log("Proceeding to Pay with payload:", bbpsPayload);

      navigation.navigate('PayFromWallet', {
        autoStart: false,
        origin: 'BillFetch',
        returnTo: 'HomeScreen',
        amount: finalAmount,
        payload: bbpsPayload,
      });

    } catch (err) {
      console.warn('ProceedToPay error', err);
      Alert.alert('Error', 'Failed to initiate payment.');
    } finally {
      setPaymentLoading(false);
    }


  };

  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;

    if (numAmount === 0 || isNaN(numAmount)) {
      setErrorMessge("");
      return;
    }

    // Credit-card bills allow any amount — no min/max enforcement.
    if (isCreditCard) {
      setErrorMessge("");
      return;
    }

    // Validate min/max only if they are defined
    if (minAmount !== null && numAmount < minAmount) {
      setErrorMessge(`Minimum amount should be ₹${minAmount}`);
      return;
    }

    if (maxAmount !== null && numAmount > maxAmount) {
      setErrorMessge(`Maximum amount should be ₹${maxAmount}`);
      return;
    }

    setErrorMessge("");
  }, [amount, minAmount, maxAmount, isCreditCard]);

  useEffect(() => {
    if (resolvedAmount !== undefined && resolvedAmount !== null) {
      setAmount(String(resolvedAmount));
    }
  }, []);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{tagName} Recharge</Text>


            <Image
              source={require("../../assets/BharatConnectReverseLogo.png")}
              style={{
                width: 80,
                height: 30,
                marginRight: 10,
                resizeMode: "contain",
              }}
            />
          </View>

          {/* Bill Details Card */}

          <View style={styles.card}>
            <View style={styles.bankDetails}>
              <Image
                source={{
                  uri: iconImage ? iconImage : "https://play-lh.googleusercontent.com/DTzWtkxfnKwFO3ruybY1SKjJQnLYeuK3KmQmwV5OQ3dULr5iXxeEtzBLceultrKTIUTr",
                }}
                style={styles.bankLogo}
              />
              <View style={styles.bankTextContainer}>
                <Text style={styles.bankName}>{paymentBnak}</Text>
              </View>
            </View>

            {/* Details */}

            <View style={styles.billDetails}>
              <View style={styles.billHeader}>
                <Text style={styles.billDetailsTitle}>
                  {filteredBillDetails.length === 0 ? "Enter the Amount" : "Bill Details"}
                </Text>
              </View>
              {filteredBillDetails.map(({ label, value }) => (
                <View style={styles.detailRow} key={label}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text numberOfLines={2} ellipsizeMode="tail" style={styles.detailValue}>{value}</Text>
                </View>
              ))}

              {hasBillAmount && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bill Amount </Text>
                  <Text style={styles.detailValue}>{resolvedAmount}</Text>
                </View>
              )}
            </View>

            {/* =============================================================================== */}
            {/* Amount Input */}
            {/* =============================================================================== */}
            <View style={{ display: "flex" }}>
              <View style={styles.amountContainer}>
                <Text style={styles.rupeeSymbol}>{currencySymbol}</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  style={styles.amountText}
                  value={amount}
                  onChangeText={(value) => {
                    // Allow only numbers and single decimal point
                    let numericValue = value.replace(/[^0-9.]/g, "");

                    // Prevent multiple decimal points
                    const parts = numericValue.split('.');
                    if (parts.length > 2) {
                      numericValue = parts[0] + '.' + parts[1];
                    }

                    setAmount(numericValue);
                  }}
                  editable={IsAmountEditable}
                  placeholder="0.00"
                />
                {/* <Text style={styles.amountText}>{amount}</Text> */}
              </View>
              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}
            </View>

            {/* =============================================================================== */}
            {/* Amount Options */}
            {/* =============================================================================== */}

            {IsAmountEditable && (
              <View style={styles.amountOptions}>
                {amounts.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.amountButton,
                      amount === amt && styles.selectedAmount,
                    ]}
                    onPress={() => setAmount(amt)}
                  >
                    <Text
                      style={[
                        styles.amountButtonText,
                        amount === amt && styles.selectedAmountText,
                      ]}
                    >
                      ₹{amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Proceed Button (fixed footer, lifted above the system nav bar) */}
        {!keyboardVisible && (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={[styles.proceedButton, paymentLoading && styles.proceedButtonDisabled]}
              onPress={handleProceed}
              disabled={paymentLoading}
              activeOpacity={0.8}
            >
              {paymentLoading ? (
                <ActivityIndicator size="small" color={Theme.colors.primary} />
              ) : (
                <Text style={styles.proceedButtonText}>PROCEED TO PAY</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

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
  bharatConnectLogo: {
    width: 30,
    height: 30,
    marginRight: 8,
  },
  helpButton: {
    marginLeft: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  bankDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  bankLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  bankTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  bankName: {
    color: "black",
    fontSize: 16,
    fontWeight: "500",
    flexWrap: "wrap",
  },
  tagId: {
    color: "#9E9E9E",
    marginTop: 4,
  },
  billDetails: {
    marginTop: 16,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  billDetailsTitle: {
    color: "#9E9E9E",
    fontSize: 16,
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
  amountContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  rupeeSymbol: {
    color: "black",
    fontSize: 30,
    marginRight: 4,
  },
  amountText: {
    color: "black",
    fontSize: 30,
    fontWeight: "500",
  },
  amountOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  amountButton: {
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectedAmount: {
    backgroundColor: Theme.colors.primary,
  },
  amountButtonText: {
    color: Theme.colors.primary,
    fontSize: 14,
  },
  selectedAmountText: {
    color: "white",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Theme.colors.primary,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  proceedButton: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  proceedButtonDisabled: {
    opacity: 0.6,
  },
  proceedButtonText: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginTop: -10,
    marginBottom: 10,
  },
});

export default BillFetch;



