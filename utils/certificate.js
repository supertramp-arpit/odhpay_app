// Download + share the PIP investment certificate PDF for an active investment.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const BASE_URL = "https://newapi.odhpay.com";

export async function downloadInvestmentCertificate(referenceId) {
  const token = await AsyncStorage.getItem("access_token");
  const dest = `${FileSystem.cacheDirectory}ODHPAY_PIP_${referenceId}.pdf`;
  const res = await FileSystem.downloadAsync(
    `${BASE_URL}/api/v1/investment/certificate/${referenceId}`,
    dest,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status !== 200) {
    throw new Error("Certificate isn't available yet — try again shortly");
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(res.uri, {
      mimeType: "application/pdf",
      dialogTitle: "Investment certificate",
    });
  }
  return res.uri;
}
