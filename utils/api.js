// utils/api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";



const BASE_URL = "https://newapi.odhpay.com/" // adjust your path

export async function apiRequest({
    method = "get",
    endpoint = "",
    data = null,
}) {
    try {
       const access_token = await AsyncStorage.getItem("access_token");
        const headers = {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${access_token}`,
        };

        const response = await axios({
            method,
            url: `${BASE_URL}/${endpoint}`,
            data,
            headers,
            withCredentials: true,
        });

        console.log(endpoint,"===>",response.data)

        return response.data; // only return useful data
    } catch (error) {
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
}
