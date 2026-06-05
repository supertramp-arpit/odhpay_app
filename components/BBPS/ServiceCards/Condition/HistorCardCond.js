import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Alert } from "react-native";

const NUMBER_TOKENS = ["number", "no", "num"];

const normalizeParamKey = (value, stripNumberTokens = false) => {
  if (!value) return "";

  const tokens = value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const filtered = stripNumberTokens
    ? tokens.filter((token) => !NUMBER_TOKENS.includes(token))
    : tokens;

  return filtered.join("");
};

const buildInputParamsFromHistory = (rawInputParams, uiInputParams) => {
  if (
    !rawInputParams ||
    typeof rawInputParams !== "object" ||
    Array.isArray(rawInputParams)
  ) {
    return {};
  }

  const rawEntries = Object.entries(rawInputParams).filter(([, value]) => {
    if (value === undefined || value === null) return false;
    return value.toString().trim() !== "";
  });

  if (!Array.isArray(uiInputParams) || uiInputParams.length === 0) {
    return rawEntries.reduce((acc, [key, value]) => {
      acc[key] = value.toString().trim();
      return acc;
    }, {});
  }

  const rawIndex = new Map();
  rawEntries.forEach(([key, value]) => {
    rawIndex.set(normalizeParamKey(key, false), value);
    rawIndex.set(normalizeParamKey(key, true), value);
  });

  const mapped = {};
  uiInputParams.forEach((field) => {
    const paramName = field?.paramName;
    if (!paramName) return;

    const directKey = normalizeParamKey(paramName, false);
    const strippedKey = normalizeParamKey(paramName, true);
    const value = rawIndex.get(directKey) ?? rawIndex.get(strippedKey);

    if (value !== undefined && value !== null && value.toString().trim() !== "") {
      mapped[paramName] = value.toString().trim();
    }
  });

  if (Object.keys(mapped).length > 0) {
    return mapped;
  }

  return rawEntries.reduce((acc, [key, value]) => {
    acc[key] = value.toString().trim();
    return acc;
  }, {});
};

const buildBillerNavParams = (uiInfo, { endpoint, reminder, billerId }) => {
  const resolvedBillerId = billerId || uiInfo?.billerId || uiInfo?.biller_id || "";

  return {
    registrationCond: uiInfo?.inputParams || [],
    paymentBnak: uiInfo?.billerName,
    reminder,
    biller_id: resolvedBillerId,
    tagName: endpoint,
    iconImage: resolvedBillerId
      ? `https://assetcdn.odhpay.com/biller-assets/${resolvedBillerId}.png?v=2`
      : "",
    doesSupportBillFetch: uiInfo?.doesSupportBillFetch,
    doesSupportUserInput: uiInfo?.doesSupportUserInput,
    isBillFetchMandatory: uiInfo?.isBillFetchMandatory,
    shouldNaviagteToManualInput: uiInfo?.shouldNaviagteToManualInput,
    paymentChannels: uiInfo?.paymentChannels || [],
    billerName: uiInfo?.billerName,
    billerCategory: uiInfo?.billerCategory,
    allDiscomsList: uiInfo?.allDiscomsList || [],
  };
};

const buildEnterBillAmountData = (fetchedData) => ({
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
});

export const handleRecentTransactionPress = async ({
  item,
  navigation,
  endpoint,
  reminder,
  mobile,
  setLoading,
}) => {
  if (!item?.biller_id) {
    Alert.alert("Error", "Missing biller details.");
    return;
  }

  try {
    if (setLoading) setLoading(true);

    const access_token = await AsyncStorage.getItem("access_token");
    if (!access_token) {
      Alert.alert("Error", "Please sign in to view billers.");
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    };

    const uiInfoResponse = await axios.get(
      `https://newapi.odhpay.com/api/v1/bbps/billers/ui-info/${item.biller_id}`,
      { headers }
    );

    const uiInfo = uiInfoResponse?.data?.data || {};
    const billerId = uiInfo?.billerId || item?.biller_id;
    const navParams = buildBillerNavParams(uiInfo, {
      endpoint,
      reminder,
      billerId,
    });

    if (uiInfo?.shouldNaviagteToManualInput) {
      navigation.navigate("ProceedToPayment", navParams);
      return;
    }

    const rawInputParams =
      item?.raw_input_params &&
      typeof item.raw_input_params === "object" &&
      !Array.isArray(item.raw_input_params)
        ? item.raw_input_params
        : item?.input_params &&
          typeof item.input_params === "object" &&
          !Array.isArray(item.input_params)
        ? item.input_params
        : null;

    const inputParams = buildInputParamsFromHistory(
      rawInputParams,
      uiInfo?.inputParams
    );

    if (!inputParams || Object.keys(inputParams).length === 0) {
      navigation.navigate("BillerInputForm", navParams);
      return;
    }

    const transactionData = {
      biller_id: billerId,
      input_params: inputParams,
      fetched_by_user: mobile ? String(mobile) : "",
      amount: "",
    };

    const fetchResponse = await axios.post(
      "https://newapi.odhpay.com/api/v1/bbps/bill/fetch",
      transactionData,
      { headers }
    );

    const fetchedData = fetchResponse?.data?.data || fetchResponse?.data || {};

    if (fetchResponse?.data?.data?.error_message || fetchedData?.error_message) {
      Alert.alert(
        "Alert",
        fetchedData?.error_message || "Unable to fetch bill."
      );
      return;
    }

    if (fetchedData?.success) {
      const EnterBillAmountData = buildEnterBillAmountData(fetchedData);

      if (uiInfo?.doesSupportUserInput) {
        navigation.navigate("EnterBillAmount", {
          data: fetchedData,
          paymentBnak: uiInfo?.billerName,
          tagName: endpoint,
          IsAmountEditable:true,
          biller_id: billerId,
          urlData: inputParams,
          billerfetchId: fetchedData?.fetch_id,
          iconImage: navParams.iconImage,
          billerCategory: uiInfo?.billerCategory,
          billerName: uiInfo?.billerName,
          paymentChannels: uiInfo?.paymentChannels || [],
        });
      } else {
        navigation.navigate("BillConfirmation", {
          data: EnterBillAmountData,
          paymentBnak: uiInfo?.billerName,
          tagName: endpoint,
          IsAmountEditable:false,
          biller_id: billerId,
          urlData: inputParams,
          billerfetchId: fetchedData?.fetch_id,
          iconImage: navParams.iconImage,
          billerCategory: uiInfo?.billerCategory,
          billerName: uiInfo?.billerName,
          paymentChannels: uiInfo?.paymentChannels || [],
        });
      }
      return;
    }

    Alert.alert("Alert", fetchedData?.error_message || "Unable to fetch bill.");
  } catch (error) {
    console.error("Recent bill fetch error:", error);
    Alert.alert("Error", "Unable to fetch bill details right now.");
  } finally {
    if (setLoading) setLoading(false);
  }
};
