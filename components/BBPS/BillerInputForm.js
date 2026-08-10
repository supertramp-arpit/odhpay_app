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
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Theme from "../../components/Theme";
import { useRegisterStore } from "../../store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import SweetAlert from "../miscellaneous/SweetAlert";
import { logBBPSFlow } from "../../utils/apiLogger";
import { normalizeIndianMobile } from "../../utils/helper";



const VehicleRegistration = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);


  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [messageTitle, setMessageTitle] = useState("Bill Fetch Failed");


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

  // ---------------------------------------------------------------------------
  // BBPS / BPCL compliance: "Registered Contact Number"
  //
  // Per the BPCL LPG circular issued via BBPS, for these billers the registered
  // contact number must be taken from the customer's APP LOGIN mobile number and
  // must NOT be editable — booking is permitted only when the number is
  // registered against the LPG ID. Letting the customer type an arbitrary number
  // here would breach that.
  //
  // Matched on the MDM parameter NAME rather than a hard-coded biller list, so
  // any biller BillAvenue publishes with this parameter is covered automatically.
  // ---------------------------------------------------------------------------
  const isRegisteredContactParam = (paramName) => {
    const n = (paramName || "").trim().toLowerCase().replace(/[^a-z]/g, "");
    return n === "registeredcontactnumber" || n === "registeredmobilenumber";
  };


  // =====================================================
  // Getting User info From Redux
  // =====================================================

  const route = useRoute();
  const {
    billerCategory = "",
    billerName = "",
    registrationCond = [],
    paymentBnak = "",
    reminder = "",
    biller_id = "",
    tagName = "",
    iconImage = "",
    shouldNaviagteToManualInput = false,
    doesSupportEnterBillAmount = false,
    doesSupportUserInput = false,
    doesSupportBillFetch = true,
    isEnterBillAmountMandatory = false,
    paymentChannels = [],
    allDiscomsList = [],
  } = route.params || {};

  const registrationFields = Array.isArray(registrationCond)
    ? registrationCond
    : Array.isArray(registrationCond)
      ? registrationCond
      : [];

  const [inputs, setInputs] = useState({});
  const [errors, setErrors] = useState({});

  // Force the login mobile into the form state so it is what actually gets
  // submitted — not merely what is displayed.
  useEffect(() => {
    if (!mobile) return;
    const locked = normalizeIndianMobile(String(mobile));
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
  }, [mobile, registrationFields]);

  useEffect(() => {
    console.log("=== VehicleRegistration Params ===");
    console.log("registrationFields:", registrationFields);
    console.log("allDiscomsList:", allDiscomsList);
    console.log("allDiscomsList length:", allDiscomsList?.length);
    console.log("allDiscomsList is array:", Array.isArray(allDiscomsList));
  }, [allDiscomsList, registrationFields]);

  const handleInputChange = (paramName, value) => {
    setInputs((prev) => ({ ...prev, [paramName]: value }));
    setErrors((prev) => ({ ...prev, [paramName]: "" }));
  };

  // ---- Electricity State -> District-Discom picker (PhonePe-style) ----
  const [discomStates, setDiscomStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [discomOptions, setDiscomOptions] = useState([]);
  const [loadingDiscoms, setLoadingDiscoms] = useState(false);

  const hasDiscomField = registrationFields.some((f) => {
    const n = (f?.paramName || "").trim().toLowerCase();
    return n === "district-discom" || (n.includes("district") && n.includes("discom"));
  });

  const fetchDiscoms = async (state) => {
    if (!state) {
      setDiscomOptions([]);
      return;
    }
    try {
      setLoadingDiscoms(true);
      const access_token = await AsyncStorage.getItem("access_token");
      const res = await axios.get(
        `https://newapi.odhpay.com/api/v1/bbps/discoms?state=${encodeURIComponent(state)}`,
        { headers: { Accept: "application/json", Authorization: `Bearer ${access_token}` } }
      );
      setDiscomOptions(res?.data?.data?.discoms || []);
    } catch (e) {
      console.log("discoms fetch failed:", e?.message);
      setDiscomOptions([]);
    } finally {
      setLoadingDiscoms(false);
    }
  };

  useEffect(() => {
    if (!hasDiscomField) return;
    (async () => {
      try {
        const access_token = await AsyncStorage.getItem("access_token");
        const res = await axios.get(
          "https://newapi.odhpay.com/api/v1/bbps/discoms/states",
          { headers: { Accept: "application/json", Authorization: `Bearer ${access_token}` } }
        );
        const states = res?.data?.data?.states || [];
        setDiscomStates(states);
        // Auto-select when there's only one state (e.g. UP today)
        if (states.length === 1) {
          setSelectedState(states[0]);
          fetchDiscoms(states[0]);
        }
      } catch (e) {
        console.log("discom states fetch failed:", e?.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDiscomField]);

  // Some billers (all DTH incl. TATA Play, and ~137 others) have
  // billerFetchRequirement = NOT_SUPPORTED — BillAvenue rejects a fetch with
  // "Fetch Request not supported, only QuickPay permitted". For those we skip the
  // fetch and send the user straight to amount entry (QuickPay).
  const isQuickPayOnlyMessage = (msg = "") =>
    /quick\s*pay/i.test(msg) || /fetch\s*(request)?\s*(is\s*)?not\s*support/i.test(msg);

  const goToQuickPay = (urlData) => {
    setLoading(false);
    navigation.navigate("EnterBillAmount", {
      data: {}, // no bill fetched — the user enters the amount
      paymentBnak,
      tagName,
      IsAmountEditable: true,
      biller_id,
      urlData,
      billerfetchId: "",
      iconImage,
      billerCategory,
      billerName,
      paymentChannels,
      infoData: {},
    });
  };

  const handleSubmit = async () => {
    let newErrors = {};

    // Only validate mandatory fields
    registrationFields.forEach((field) => {
      const key = field.paramName;
      const value = inputs[key];
      const isOptional =
        field?.isOptional === true || field?.isOptional === "true";

      if (!isOptional && (!value || value.toString().trim() === "")) {
        newErrors[key] = "This field is required";
        return;
      }

      if (value) {
        if (field?.minLength && value.toString().length < Number(field.minLength)) {
          newErrors[key] = `Minimum ${field.minLength} characters required`;
        }
        if (field?.maxLength && value.toString().length > Number(field.maxLength)) {
          newErrors[key] = `Maximum ${field.maxLength} characters allowed`;
        }
      }
    });

    // If there are errors, show them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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

    const urlData = buildInputParams(registrationFields, inputs);

    setErrors(newErrors);

    // QuickPay-only biller: don't call bill/fetch at all, go straight to payment.
    if (doesSupportBillFetch === false) {
      logBBPSFlow("FETCH_BILL", { biller_id, skipped: "biller does not support fetch (QuickPay only)" });
      goToQuickPay(urlData);
      return;
    }

    try {
      setLoading(true);
      const access_token = await AsyncStorage.getItem("access_token");

      const TransactionData = {
        biller_id: biller_id,
        input_params: urlData,
        fetched_by_user: mobile ? String(mobile) : "",
        amount: "",
      };

      logBBPSFlow("FETCH_BILL", { biller_id, input_params: urlData });

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      };
      const response = await axios.post(
        `https://newapi.odhpay.com/api/v1/bbps/bill/fetch`,
        TransactionData,
        { headers }
      );
      console.log(`/api/v1/bbps/bill/fetch------>`, response.data);

      logBBPSFlow("FETCH_BILL", { success: response.data?.data?.success, bill_amount: response.data?.data?.bill_amount });


      setLoading(false);

      // Transform info into { infoName: infoValue }. BillAvenue returns a single <info>
      // as an object and multiple as an array, so normalise to an array first.
      const rawInfo = response?.data?.data?.additional_info?.info;
      const infoArray = Array.isArray(rawInfo) ? rawInfo : rawInfo ? [rawInfo] : [];
      const infoData = infoArray.reduce((acc, curElm) => {
        if (curElm?.infoName) acc[curElm.infoName] = curElm.infoValue;
        return acc;
      }, {});

      console.log("this is info --->infoData", infoData)

      const fetchedData = response?.data?.data || response?.data || {};

      // A bill fetch is successful ONLY when the backend says success === true with no
      // error_message. A failed fetch (wrong card/details, biller error, etc.) returns
      // success=false + error_message — surface it as an ERROR and do NOT navigate.
      const fetchSucceeded =
        fetchedData?.success === true && !fetchedData?.error_message;

      if (!fetchSucceeded) {
        const failMessage =
          fetchedData?.error_message ||
          response?.data?.message ||
          "Unable to fetch bill. Please check the details and try again.";
        console.log("Bill fetch failed:", failMessage);
        if (isQuickPayOnlyMessage(failMessage)) {
          goToQuickPay(urlData);
          return;
        }
        setAlertMessage(failMessage);
        setMessageType("error");
        setMessageTitle("Bill Fetch Failed");
        setAlertVisible(true);
        return;
      }

      // Prepare data for BillConfirmation - pass flat data structure directly
      const EnterBillAmountData = {
        bill_amount: fetchedData?.bill_amount,
        bill_date: fetchedData?.bill_date,
        bill_number: fetchedData?.bill_number,
        customer_name: fetchedData?.customer_name,
        due_date: fetchedData?.due_date,
        biller_id: fetchedData?.biller_id,
        reference_no: fetchedData?.reference_no,
        fetch_id: fetchedData?.fetch_id,
        bill_period: fetchedData?.bill_period,
        card_number: fetchedData?.card_number,
        additional_info: fetchedData?.additional_info,
        amount_options: fetchedData?.amount_options,
      };

      console.log("this is EnterBillAmount", EnterBillAmountData);
      console.log("Navigating with doesSupportUserInput:", doesSupportUserInput, "doesSupportEnterBillAmount:", doesSupportEnterBillAmount);

      if (doesSupportUserInput) {
        navigation.navigate("EnterBillAmount", {
          data: fetchedData,
          paymentBnak,
          tagName,
          IsAmountEditable: true,
          biller_id,
          urlData,
          billerfetchId: fetchedData["fetch_id"],
          iconImage,
          billerCategory,
          billerName,
          paymentChannels,
          infoData,
        });
      } else {
        // Default to BillConfirmation when bill fetch succeeds
        navigation.navigate("BillConfirmation", {
          data: EnterBillAmountData,
          paymentBnak,
          tagName,
          IsAmountEditable: false,
          biller_id,
          urlData,
          billerfetchId: fetchedData["fetch_id"],
          iconImage,
          billerCategory,
          billerName,
          paymentChannels,
          infoData,
        });
      }
    } catch (error) {
      setLoading(false);
      let failMessage = "Something went wrong while fetching the bill. Please try again.";
      if (axios.isAxiosError(error)) {
        console.error("Axios Error:", error.response?.status, error.response?.data);
        const detail = error.response?.data?.detail;
        failMessage =
          (typeof detail === "string" && detail) ||
          detail?.error_message ||
          detail?.message ||
          error.response?.data?.message ||
          (error.response?.status === 404
            ? "Requested resource not found."
            : "Unable to fetch bill. Please check the details and try again.");
      } else {
        console.error("Unexpected Error:", error);
      }
      if (isQuickPayOnlyMessage(failMessage)) {
        goToQuickPay(urlData);
        return;
      }
      // Always surface failures as an error modal (consistent with the success path).
      setAlertMessage(failMessage);
      setMessageType("error");
      setMessageTitle("Bill Fetch Failed");
      setAlertVisible(true);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: paymentBnak
        /*  ? `${paymentBnak}` */

        ? paymentBnak.length > 15
          ? paymentBnak.substring(0, 15) + "..."
          : paymentBnak

        : "Vehicle Registration",
    });
  }, [navigation, paymentBnak]);

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {iconImage && (<Image style={{ width: 37, height: 37 }} source={{ uri: iconImage }} />)}
        <Text style={styles.header}>{paymentBnak}</Text>
      </View>

      {registrationFields.map((field, index) => {
        const fieldName = field?.paramName?.trim() || "";
        // Check multiple variations for "District-Discom"
        const isDiscomField =
          fieldName === "District-Discom" ||
          fieldName === "district-discom" ||
          fieldName.toLowerCase().includes("district") && fieldName.toLowerCase().includes("discom");
        const hasDiscomList = Array.isArray(allDiscomsList) && allDiscomsList.length > 0;

        console.log(`Field: "${fieldName}" | IsDiscom: ${isDiscomField} | HasList: ${hasDiscomList} | ListLength: ${allDiscomsList?.length}`);

        return (
          <View key={index}>
            <Text style={styles.subHeader}>
              {field?.paramName || "Enter Value"}
              {!(field?.isOptional === true || field?.isOptional === "true") && (
                <Text style={{ color: "red" }}> *</Text>
              )}
            </Text>

            {isDiscomField && discomStates.length > 0 ? (
              <>
                {/* State picker (PhonePe-style) */}
                <Text style={styles.pickerLabel}>State</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedState}
                    onValueChange={(value) => {
                      setSelectedState(value);
                      handleInputChange(field.paramName, ""); // reset discom on state change
                      fetchDiscoms(value);
                    }}
                    style={styles.picker}
                    mode="dialog"
                  >
                    <Picker.Item label="Select State" value="" />
                    {discomStates.map((st, i) => (
                      <Picker.Item key={i} label={st} value={st} />
                    ))}
                  </Picker>
                </View>

                {/* District / Discom picker */}
                <Text style={styles.pickerLabel}>District / Discom</Text>
                <View
                  style={[
                    styles.pickerContainer,
                    errors[field.paramName] ? styles.errorBorder : null,
                  ]}
                >
                  <Picker
                    selectedValue={inputs[field.paramName] || ""}
                    enabled={!!selectedState && !loadingDiscoms}
                    onValueChange={(value) =>
                      handleInputChange(field.paramName, value)
                    }
                    style={styles.picker}
                    mode="dialog"
                  >
                    <Picker.Item
                      label={
                        loadingDiscoms
                          ? "Loading..."
                          : selectedState
                            ? "Select District / Discom"
                            : "Select State first"
                      }
                      value=""
                    />
                    {discomOptions.map((d, i) => (
                      <Picker.Item
                        key={i}
                        label={`${d.district} — ${d.discom}`}
                        value={d.value}
                      />
                    ))}
                  </Picker>
                </View>
              </>
            ) : isDiscomField && hasDiscomList ? (
              <View
                style={[
                  styles.pickerContainer,
                  errors[field.paramName] ? styles.errorBorder : null,
                ]}
              >
                <Picker
                  selectedValue={inputs[field.paramName] || ""}
                  onValueChange={(value) =>
                    handleInputChange(field.paramName, value)
                  }
                  style={styles.picker}
                  mode="dialog"
                >
                  <Picker.Item label="Select a District" value="" />
                  {allDiscomsList.map((discom, idx) => (
                    <Picker.Item key={idx} label={discom} value={discom} />
                  ))}
                </Picker>
              </View>
            ) : isRegisteredContactParam(fieldName) ? (
              /* Locked to the app login mobile — see the BPCL circular note above.
                 editable={false} plus no onChangeText: the value cannot be altered
                 from the UI by any means. */
              <View>
                <TextInput
                  style={[styles.input, styles.inputLocked]}
                  value={inputs[field.paramName] || ""}
                  editable={false}
                  selectTextOnFocus={false}
                  keyboardType="numeric"
                  accessibilityLabel={`Registered contact number ${inputs[field.paramName] || ""}, not editable`}
                />
                <Text style={styles.lockedHint}>
                  Your registered mobile number is used automatically and cannot be
                  changed. Booking is allowed only for the number registered with
                  this LPG ID.
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
                value={inputs[field.paramName] || ""}
                autoCapitalize={field?.dataType !== "NUMERIC" ? "characters" : "none"}
              />
            )}

            {errors[field.paramName] && (
              <Text style={styles.errorText}>{errors[field.paramName]}</Text>
            )}
            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
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

      <TouchableOpacity style={styles.confirmButton} onPress={handleSubmit}>
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
        type={messageType}
        title={messageTitle}
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
    marginRight: 20,
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
  // Read-only "Registered Contact Number" — visually distinct so it is obvious
  // to the customer (and to a reviewer) that the value is fixed, not just
  // coincidentally pre-typed.
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  pickerLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
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

export default VehicleRegistration;
