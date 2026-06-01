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

      // Transform array into object with infoName as key and infoValue as value
      const additionalInfoArray = response?.data?.data?.additional_info?.info;
      const infoData = Array.isArray(additionalInfoArray)
        ? additionalInfoArray.reduce((acc, curElm) => {
          acc[curElm["infoName"]] = curElm["infoValue"];
          return acc;
        }, {})
        : {};

      console.log("this is info --->infoData", infoData)

      const fetchedData = response?.data?.data || response?.data || {};


      if (response?.data?.data?.error_message) {
        fetchedData.success = false;
        setAlertMessage(response?.data?.data?.error_message);
        setAlertVisible(true);
        setMessageType("success");
        setMessageTitle("Alert");

        return;
      }

      if (fetchedData && fetchedData.success) {

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

        console.log("this is EnterBillAmount", EnterBillAmountData)


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
      } else {

        console.log("Bill fetch failed:", fetchedData?.error_message || "Unable to fetch bill.");
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
        // setAlertMessage(fetchedData?.error_message || "Unable to fetch bill.");
        // setAlertVisible(true);
      }
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        console.error(
          "Axios Error:",
          error.response?.status,
          error.response?.data
        );

        if (error.response?.status === 404) {
          Alert.alert("Error", "Requested resource not found (404)");
        }
      } else {
        console.error("Unexpected Error:", error);
        Alert.alert("Error", "Something went wrong!");
      }
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
