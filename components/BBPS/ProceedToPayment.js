import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import Theme from "../../components/Theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import SweetAlert from "../miscellaneous/SweetAlert";
import { useRegisterStore } from "../../store/useRegisterStore";
import { logBBPSFlow } from "../../utils/apiLogger";
import { normalizeIndianMobile } from "../../utils/helper";
import { getLoginMobile } from "../../utils/secureRequest";

// Operators database
const ALL_OPERATORS = [
  { "id": 11, "name": "Airtel", "category": "Prepaid" },
  { "id": 12, "name": "Airtel DTH", "category": "DTH" },
  { "id": 13, "name": "BSNL", "category": "Prepaid" },
  { "id": 14, "name": "Dish TV", "category": "DTH" },
  { "id": 4, "name": "Idea", "category": "Prepaid" },
  { "id": 18, "name": "Jio", "category": "Prepaid" },
  { "id": 33, "name": "MTNL Delhi", "category": "Prepaid" },
  { "id": 34, "name": "MTNL Mumbai", "category": "Prepaid" },
  { "id": 27, "name": "Sun Direct TV", "category": "DTH" },
  { "id": 27, "name": "Sun Direct TV (Flexi Plans)", "category": "DTH" },
  { "id": 8, "name": "TATA Play", "category": "DTH" },
  { "id": 10, "name": "DTH", "category": "DTH" },
  { "id": 22, "name": "Vodafone", "category": "Prepaid" },
];

const getOperatorCode = (operatorName) => {
  const operator = ALL_OPERATORS.find(
    op => op.name?.toLowerCase() === operatorName?.toLowerCase()
  );
  return operator?.id?.toString();
};

const ProceedToPayment = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // =====================================================
  // Getting User info From Zustand Store
  // =====================================================

  const [mobile, setMobile] = useState("");

  const user = useRegisterStore((state) => state.user);
  useEffect(() => {
    if (user?.user?.MobileNumber) {
      setMobile(user.user.MobileNumber);
    }
  }, [user]);

  // =====================================================
  // Getting User info From Zustand Store
  // =====================================================

  const route = useRoute();
  const {
    registrationCond = [],
    paymentBnak = "",
    reminder = "",
    biller_id = "",
    tagName = "",
    iconImage = "",
    shouldNaviagteToManualInput = false,
    doesSupportBillFetch = false,
    doesSupportUserInput = false,
    isBillFetchMandatory = false,
    billerName = "",
    billerCategory = "",
    paymentChannels = []
  } = route.params || {};

  const registrationFields = Array.isArray(registrationCond)
    ? registrationCond
    : Array.isArray(registrationCond)
      ? registrationCond
      : [];

  // Separate Amount field from other fields
  const amountField = registrationFields.find(field => field?.paramName?.toLowerCase() === "amount");
  const otherFields = registrationFields.filter(field => field?.paramName?.toLowerCase() !== "amount");

  // Create default Amount field if it doesn't exist
  const defaultAmountField = {
    paramName: "Amount",
    dataType: "NUMERIC",
    isOptional: false,
    minLength: 1,
    maxLength: 10,
    regEx: "^[0-9.]+$",
    visibility: true
  };

  // Reorder: other fields first, then amount field (use existing or default)
  const orderedFields = amountField
    ? [...otherFields, amountField]
    : [...otherFields, defaultAmountField];

  const [inputs, setInputs] = useState({});

  // ---------------------------------------------------------------------------
  // BBPS / BPCL compliance: "Registered Contact Number" (see BillerInputForm.js)
  //
  // This screen is a SECOND place biller parameters can be entered, so the same
  // lock must apply here — otherwise a customer could simply edit the number on
  // this screen and defeat the control.
  // ---------------------------------------------------------------------------
  const isRegisteredContactParam = (paramName) => {
    const n = (paramName || "").trim().toLowerCase().replace(/[^a-z]/g, "");
    return n === "registeredcontactnumber" || n === "registeredmobilenumber";
  };

  // Authoritative login mobile for the locked field. The store may not be
  // hydrated on this screen (it renders empty when it isn't), so fall back to the
  // authenticated session — this value is compliance-relevant and must be right.
  const [loginMobile, setLoginMobile] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const num = await getLoginMobile(mobile);
      if (!cancelled) setLoginMobile(num);
    })();
    return () => {
      cancelled = true;
    };
  }, [mobile]);

  useEffect(() => {
    if (!loginMobile) return;
    const locked = normalizeIndianMobile(String(loginMobile));
    const lockedFields = registrationFields.filter((f) =>
      isRegisteredContactParam(f?.paramName)
    );
    if (lockedFields.length === 0) return;
    setInputs((prev) => {
      const next = { ...prev };
      let changed = false;
      lockedFields.forEach((f) => {
        if (next[f.paramName] !== locked) {
          next[f.paramName] = locked;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [loginMobile, registrationFields]);
  const [errors, setErrors] = useState({});
  const [minAmount, setMinAmount] = useState(1);
  const [maxAmount, setMaxAmount] = useState(Infinity);

  // Extract min/max amount from paymentChannels - default to UPI
  useEffect(() => {
    if (paymentChannels && paymentChannels.length > 0) {
      // Find UPI channel, fallback to first channel
      const upiChannel = paymentChannels.find(
        (channel) => channel?.paymentChannelName?.toUpperCase() === "UPI" || channel?.paymentChannelName?.toUpperCase() === "MOB"
      ) || paymentChannels[0];

      if (upiChannel) {
        setMinAmount(upiChannel.minAmount || 1);
        setMaxAmount(upiChannel.maxAmount || Infinity);
      }
    }
  }, [paymentChannels]);

  const handleInputChange = (paramName, value) => {
    setInputs((prev) => ({ ...prev, [paramName]: value }));
    setErrors((prev) => ({ ...prev, [paramName]: "" }));
  };





  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("");

  // =======================================================
  // handle Submit 
  // =======================================================
  const handleSubmit = async () => {
    let newErrors = {};

    // =======================================================
    // If Does not Support the BillFetch
    // =======================================================
    let optionalFields = registrationFields.filter(
      (field) => field?.isOptional === true || field?.isOptional === "true"
    );

    let isAnyOptionalFieldFilled = optionalFields.some(
      (field) => inputs[field.paramName]
    );

    if (optionalFields.length > 1 && !isAnyOptionalFieldFilled) {
      optionalFields.forEach((field) => {
        newErrors[field.paramName] = "At least one field is required";
      });
    }

    // Use orderedFields for validation to include dynamically created Amount field
    orderedFields.forEach((field) => {
      const key = field.paramName;
      const value = inputs[key];
      const isOptional =
        field?.isOptional === true || field?.isOptional === "true";

      if (!isOptional && !value) {
        newErrors[key] = "This field is required";
        return;
      }

      if (value) {
        // Special validation for Amount field
        if (key.toLowerCase() === "amount") {
          const numAmount = parseFloat(value);
          if (isNaN(numAmount)) {
            newErrors[key] = "Please enter a valid amount";
          } else if (numAmount < minAmount) {
            newErrors[key] = `Minimum amount is ₹${minAmount}`;
          } else if (numAmount > maxAmount) {
            newErrors[key] = `Maximum amount is ₹${maxAmount}`;
          }
        } else {
          // Regular validation for other fields
          if (field?.minLength && value.length < Number(field.minLength)) {
            newErrors[key] = `Minimum ${field.minLength} characters required`;
          }
          if (field?.maxLength && value.length > Number(field.maxLength)) {
            newErrors[key] = `Maximum ${field.maxLength} characters allowed`;
          }
        }
      }
    });

    const buildInputParams = (fields, values) => {
      const payload = {};
      fields.forEach((field) => {
        const key = field.paramName;
        const value = values[key];
        if (value !== undefined && value !== null && value !== "") {
          payload[key] = value.toString().trim();
        }
      });
      return payload;
    };

    const urlData = buildInputParams(orderedFields, inputs);

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
    } else {
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");

      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        setLoading(false);
        return;
      }

     
  

      // Get amount from inputs
      const amount = inputs.Amount || inputs.amount || urlData.Amount || urlData.amount;

      if (!amount) {
        Alert.alert("Error", "Amount is required");
        setLoading(false);
        return;
      }

      // Define supported service types
      const SUPPORTED_SERVICES = {
        MOBILE_RECHARGE: "MobileRecharge",
        PRIME_ACTIVATION: "Prime_Activation",
        DTH: "DTH",
        BBPS: "BBPS"
      };

      // Get actual category from biller data or fallback to tagName
      const actualCategory = billerCategory?.toUpperCase() || tagName?.toUpperCase();

      // Validate service type
      const isValidService = Object.values(SUPPORTED_SERVICES).some(
        svc => svc.toUpperCase() === actualCategory
      );

      if (!isValidService) {
        Alert.alert("Error", `Service type '${actualCategory}' is not supported`);
        setLoading(false);
        return;
      }

      // If service does NOT support bill fetch, directly go to payment
      if (!doesSupportBillFetch) {

        // Get actual amount as number fixed to 2 decimal places
        const finalAmount = parseFloat(parseFloat(amount).toFixed(2));

        // Build service-specific payload based on actual biller category
        let paymentPayload = {
          amount: finalAmount,
          service_type: actualCategory?.toLowerCase() === "dth" ? "dth" : actualCategory?.toLowerCase() === "bbps" ? "bbps" : actualCategory?.toLowerCase(),
          purpose: `${billerName || actualCategory} Payment`,
          service_metadata: {},
        };

        // Add service-specific fields based on actual biller category
        if (actualCategory === "DTH") {
          // DTH Payload Structure
          const operatorCode = getOperatorCode(billerName);
          paymentPayload = {
            ...paymentPayload,
            service_type: "DTH",
            subscriber_id_or_mobile_number: urlData?.["Customer Id"] || urlData?.["Mobile Number"] || urlData?.["Subscriber Number"] || urlData?.["Viewing Card Number"] || "",
            operator_code: operatorCode,
            operator_name: billerName,
            dth_data: {
              subscriber_id_or_mobile_number: urlData?.["Customer Id"] || urlData?.["Mobile Number"] || urlData?.["Subscriber Number"] || urlData?.["Viewing Card Number"] || "",
              operator_name: billerName,
              operator_code: operatorCode,
              amount: finalAmount,
              recharge_type: "topup",
              pack_code: urlData?.pack_code || "",
            }
          };
        }
        else if (actualCategory === "BBPS") {
          // BBPS Payload Structure
          paymentPayload = {
            ...paymentPayload,
            service_type: "BBPS",
            biller_id: biller_id,
            biller_name: billerName,
            category: billerCategory,
            customer_reference: urlData?.["Customer Id"] || urlData?.customer_reference || urlData?.bill_number || "",
            bbps_data: {
              biller_id: biller_id,
              biller_name: billerName,
              category: billerCategory,
              customer_params: urlData,
              fetch_reference_id: "",
              bill_info: {
                bill_amount: finalAmount,
                bill_number: urlData?.["Customer Id"] || "",
                bill_date: "",
                due_date: "",
                customer_name: billerName,
                bill_period: "",
              },
              payment_mode: "Online",
              quick_pay: false,
              partial_pay: false,
            }
          };
        }

        // Navigate directly to PayFromWallet without bill fetch
        navigation.navigate("PayFromWallet", {
          payload: paymentPayload,
          amount: finalAmount,
          tagName: actualCategory,
          biller_id,
          billerName,
          mobile,
          iconImage,
        });

        setLoading(false);
        return;
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        console.error(
          "Axios Error:",
          error.response?.status,
          error.response?.data
        );

        if (error.response?.status === 404) {
          Alert.alert("Error", "Bill not found. Please check your details and try again.");
        } else if (error.response?.status === 401) {
          Alert.alert("Error", "Your session has expired. Please login again.");
        } else {
          Alert.alert("Error", error.response?.data?.message || "Failed to fetch bill details");
        }
      } else {
        console.error("Unexpected Error:", error);
        Alert.alert("Error", "Something went wrong! Please try again.");
      }
    }
  };

  // =======================================================
  // Validate the Inputs Values
  // =======================================================
  const CheckAndValidate = async () => {
    let newErrors = {};

    let optionalFields = registrationFields.filter(
      (field) => field?.isOptional === true || field?.isOptional === "true"
    );

    let isAnyOptionalFieldFilled = optionalFields.some(
      (field) => inputs[field.paramName]
    );

    if (optionalFields.length > 1 && !isAnyOptionalFieldFilled) {
      optionalFields.forEach((field) => {
        newErrors[field.paramName] = "At least one field is required";
      });
    }

    orderedFields.forEach((field) => {
      const key = field.paramName;
      const value = inputs[key];
      const isOptional =
        field?.isOptional === true || field?.isOptional === "true";

      if (!isOptional && !value) {
        newErrors[key] = "This field is required";
        return;
      }

      if (value) {
        // Special validation for Amount field
        if (key.toLowerCase() === "amount") {
          const numAmount = parseFloat(value);
          if (isNaN(numAmount)) {
            newErrors[key] = "Please enter a valid amount";
          } else if (numAmount < minAmount) {
            newErrors[key] = `Minimum amount is ₹${minAmount}`;
          } else if (numAmount > maxAmount) {
            newErrors[key] = `Maximum amount is ₹${maxAmount}`;
          }
        } else {
          // Regular validation for other fields
          if (field?.minLength && value.length < Number(field.minLength)) {
            newErrors[key] = `Minimum ${field.minLength} characters required`;
          }
          if (field?.maxLength && value.length > Number(field.maxLength)) {
            newErrors[key] = `Maximum ${field.maxLength} characters allowed`;
          }
        }
      }
    });

    const buildInputParams = (fields, values) => {
      const payload = {};
      fields.forEach((field) => {
        const key = field.paramName;
        const value = values[key];
        if (value !== undefined && value !== null && value !== "") {
          payload[key] = value.toString().trim();
        }
      });
      return payload;
    };

    const urlData = buildInputParams(orderedFields, inputs);

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
    } else {
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");

      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        setLoading(false);
        return;
      }

      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const req_payload = urlData


      if ("Amount" in req_payload) {
        delete req_payload.Amount;
      }


      console.log("Validation payload:", {
        biller_id: biller_id,
        input_params: req_payload,
      });


      logBBPSFlow("VALIDATE_BILL", { biller_id, input_params: req_payload });

      const response = await axios.post(
        'https://newapi.odhpay.com/api/v1/bbps/bill/validate',
        {
          biller_id: biller_id,
          input_params: req_payload,
        },
        { headers }
      );
      console.log("header:", {
        biller_id: biller_id,
        input_params: req_payload,
      });
      console.log(`/api/v1/bbps/bill/validate response------>`, response?.data);

      logBBPSFlow("VALIDATE_BILL", { valid: response?.data?.valid, message: response?.data?.message });

      


      if(response?.data?.valid){
        handleSubmit();
      }else{
        setAlertTitle("Validation Failed");
        setAlertMessage(response?.data?.message || "Bill validated successfully.");
        setAlertVisible(true);
      }
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        console.error(
          "Axios Error:",
          error.response?.status,
          error.response?.data
        );

        if (error.response?.status === 404) {
          Alert.alert("Error", "Validation failed. Please check your details and try again.");
        } else if (error.response?.status === 401) {
          Alert.alert("Error", "Your session has expired. Please login again.");
        } else {
          Alert.alert("Error", error.response?.data?.message || "Failed to fetch bill details");
        }
      } else {
        console.error("Unexpected Error:", error);
        Alert.alert("Error", "Something went wrong! Please try again.");
      }
    }
  };


  useEffect(() => {
    navigation.setOptions({
      title: paymentBnak
        /*  ? `${paymentBnak}` */

        ? paymentBnak.length > 15
          ? "Pay " + paymentBnak.substring(0, 15) + "..."
          : "Pay " + paymentBnak

        : "Vehicle Registration",
    });
  }, [navigation, paymentBnak]);

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {iconImage && (<Image style={{ width: 37, height: 37 }} source={{ uri: iconImage }} />)}
        <Text style={styles.header}>{paymentBnak}</Text>
      </View>

      {orderedFields.map((field, index) => {
        const isAmountField = field?.paramName?.toLowerCase() === "amount";
        const fieldValue = inputs[field.paramName] || "";

        return (
          <View key={index}>
            <Text style={styles.subHeader}>
              {field?.paramName || "Enter Value"} {!field?.isOptional && <Text style={{ color: 'red' }}>*</Text>}
            </Text>

            {isAmountField ? (
              <TextInput
                style={[
                  styles.input,
                  errors[field.paramName] ? styles.errorBorder : null,
                ]}
                placeholder={`Min: ₹${minAmount} | Max: ₹${maxAmount}`}
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                onChangeText={(value) => {
                  // Allow only numbers and decimal point
                  let numericValue = value.replace(/[^0-9.]/g, "");
                  const parts = numericValue.split('.');
                  if (parts.length > 2) {
                    numericValue = parts[0] + '.' + parts[1];
                  }
                  handleInputChange(field.paramName, numericValue);
                }}
                value={fieldValue}
                autoCapitalize="none"
              />
            ) : isRegisteredContactParam(field?.paramName) ? (
              /* Locked to the app login mobile — BPCL LPG circular. */
              <View>
                <TextInput
                  style={[styles.input, styles.inputLocked]}
                  value={fieldValue}
                  editable={false}
                  selectTextOnFocus={false}
                  keyboardType="numeric"
                  accessibilityLabel={`Registered contact number ${fieldValue}, not editable`}
                />
                <Text style={styles.lockedHint}>
                  Your registered mobile number is used automatically and cannot be
                  changed.
                </Text>
              </View>
            ) : (
              <TextInput
                style={[
                  styles.input,
                  errors[field.paramName] ? styles.errorBorder : null,
                ]}
                placeholder={`Enter ${field.paramName}`}
                placeholderTextColor="#999"
                maxLength={field?.maxLength ? parseInt(field.maxLength) : 50}
                keyboardType={field?.dataType === "NUMERIC" ? "numeric" : "default"}
                onChangeText={(value) => handleInputChange(field.paramName, value)}
                value={fieldValue}
                autoCapitalize={field?.dataType !== "NUMERIC" ? "characters" : "none"}
              />
            )}

            {errors[field.paramName] && (
              <Text style={styles.errorText}>{errors[field.paramName]}</Text>
            )}
            {errorMessage && index === 0 && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}
          </View>
        );
      })}

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          By proceeding further, you allow {Theme.Text.Company} to fetch
          your current and future balances and remind you.
        </Text>
      </View>

      <View style={styles.card}>
        <Image
          source={require("../../assets/odh.png")}
          style={styles.cardImage}
        />
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{reminder}</Text>
          <Text style={styles.cardDescription}>
            If you need a reminder just click on the Allow button.
          </Text>
          <TouchableOpacity>
            <Text style={styles.readMore}>Read More</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.allowButton}>
          <Text style={styles.allowText}>Allow</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.confirmButton} onPress={CheckAndValidate}>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator
              size="small"
              color={Theme.colors.secondary}
              style={{ transform: [{ scale: 1 }] }}
            />
          </View>
        ) : (
          <Text style={styles.confirmText}>CONFIRM</Text>
        )}
      </TouchableOpacity>


      <SweetAlert
        visible={alertVisible}
        type="error"
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.primary,
    marginBottom: 16,
  },
  subHeader: {
    fontSize: 16,
    color: "#000",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  inputLocked: {
    backgroundColor: "#F4F5F7",
    color: "#6B7280",
    borderColor: "#E4E7EC",
    marginBottom: 4,
  },
  lockedHint: {
    fontSize: 12,
    lineHeight: 16,
    color: "#6B7280",
    marginBottom: 8,
  },
  errorBorder: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
  },
  infoContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#555",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    marginBottom: 16,
  },
  cardImage: {
    width: 50,
    height: 50,
    resizeMode: "contain",
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  cardDescription: {
    fontSize: 14,
    color: "#555",
    marginVertical: 4,
  },
  readMore: {
    fontSize: 14,
    color: Theme.colors.primary,
    textDecorationLine: "underline",
  },
  allowButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  allowText: {
    fontSize: 14,
    color: Theme.colors.primary,
  },
  confirmButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ProceedToPayment;
