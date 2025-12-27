import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    Image,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import useUserStore from '../../store/useUserStore';
import { useWalletStore } from "../../store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Theme from "../Theme";

const ScanPayScreenPin = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const [predefinedPin, setPredefinedPin] = useState();
    const user = useUserStore(s => s.user);
    const payload = user?.user ? user.user : user;
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { amount, mobile_number, recipient_name } = route.params;


    const { transactionHistory, fetchHistory } = useWalletStore();

    useEffect(() => {
        fetchHistory();
        console.log(payload);
        console.log(transactionHistory);
        setPredefinedPin(payload?.TransactionPIN);
    }, [user]);

    const [pin, setPin] = useState(["", "", "", ""]);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [showError, setShowError] = useState(false);

    // Create refs for each input
    const inputRefs = useRef([
        React.createRef(),
        React.createRef(),
        React.createRef(),
        React.createRef(),
    ]);

    // Reset error when user starts typing again
    useEffect(() => {
        if (pin.some(digit => digit !== "")) {
            setShowError(false);
        }
    }, [pin]);

    // Handle input change for each digit
    const handlePinChange = (text, index) => {
        if (text.length > 1) {
            // If pasting multiple digits, handle it
            const digits = text.split("").slice(0, 4);
            const newPin = [...pin];

            digits.forEach((digit, i) => {
                if (index + i < 4) {
                    newPin[index + i] = digit;
                }
            });

            setPin(newPin);

            // Focus on appropriate input after paste
            const focusIndex = Math.min(index + digits.length, 3);
            if (focusIndex < 3) {
                inputRefs.current[focusIndex + 1].focus();
            } else {
                Keyboard.dismiss();
                if (newPin.join("").length === 4) {
                    setTimeout(() => handlePinSubmit(newPin.join("")), 300);
                }
            }
        } else {
            // Handle single digit input
            const newPin = [...pin];
            newPin[index] = text;
            setPin(newPin);

            // Auto-focus next input if a digit was entered
            if (text !== "" && index < 3) {
                inputRefs.current[index + 1].focus();
            }

            // Check if PIN is complete
            if (index === 3 && text !== "") {
                Keyboard.dismiss();
                setTimeout(() => handlePinSubmit(newPin.join("")), 300);
            }
        }
    };

    // Handle backspace key press
    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && index > 0 && pin[index] === '') {
            // Move to previous input when backspace is pressed on an empty input
            inputRefs.current[index - 1].focus();
        }
    };

    // ========================================================================================
    // Make a Transaction API call
    // ========================================================================================
    const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ""));
    const makePayment = async (amount, mobile_number) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("access_token");

            if (!token) {
                console.error("Token is missing!");
                Alert.alert("Error", "Authentication token is missing. Please login again.");
                setLoading(false);
                return;
            }

            console.log("Making payment...", amount);

            const headers = {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            const response = await axios.post(
                "https://newapi.odhpay.com/transaction/p2ptransaction",
                {
                    "amount": numericAmount,
                    "mobile_number": mobile_number
                },
                { headers }
            );

            if (response.status === 200) {
                console.log("Transaction successful!");
                navigation.navigate("TransactionSuccessScreen", {
                    amount: amount,
                    recipientNumber: mobile_number,
                    recipientName: recipient_name,
                });
            }


        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Axios Error:", error.response?.status, error.response?.data);

                if (error.response?.status === 404) {
                    Alert.alert("Error", "Requested resource not found (404)");
                }
            } else {
                console.error("Unexpected Error:", error);
                Alert.alert("Error", "Something went wrong!");
            }
        } finally {
            setLoading(false);
        }
    };


    const handlePinSubmit = (fullPin) => {
        if (fullPin.length === 4) {
            if (fullPin === predefinedPin) {
                setError("");
                setShowError(false);

                makePayment(amount, mobile_number);
            } else {
                setError("Incorrect PIN. Please try again.");
                setShowError(true);
                // Clear the PIN fields
                setPin(["", "", "", ""]);
                // Focus on the first input after a short delay
                setTimeout(() => {
                    if (inputRefs.current[0]) {
                        inputRefs.current[0].focus();
                    }
                }, 100);

                // Show alert for incorrect PIN
                Alert.alert(
                    "Incorrect PIN",
                    "The PIN you entered is incorrect. Please try again.",
                    [{ text: "OK" }]
                );
            }
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.bankName}>{Theme.Text.Company}  WAllet</Text>
                        <Text style={styles.accountNumber}>XXXXXX{payload?.MobileNumber?.slice(-4)}</Text>
                    </View>
                    <Image
                        source={require("../../assets/LogoN.png")}
                        style={styles.upiLogo}
                    />
                </View>

                <View style={styles.detailsContainer}>
                    <View style={styles.row}>
                        <Text style={styles.toText}>To:</Text>
                        <TouchableOpacity
                            style={styles.dropdownButton}
                            onPress={() => setDropdownVisible(!isDropdownVisible)}
                        >
                            <Text style={styles.recipient}>{mobile_number}</Text>
                            <AntDesign
                                name={isDropdownVisible ? "up" : "down"}
                                size={14}
                                color="black"
                                style={{ marginLeft: 5 }}
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.sendingText}>Sending:</Text>
                        <Text style={styles.amount}>{amount}</Text>
                    </View>

                    {isDropdownVisible && (
                        <View style={styles.dropdownContainer}>
                            <Text style={styles.detailText}>PAYING TO: {mobile_number}</Text>
                            <Text style={styles.detailText}>AMOUNT: {amount}</Text>
                            <Text style={styles.detailText}>ACCOUNT: XXXXXX{mobile_number.slice(-4)}</Text>
                            <Text style={styles.detailText}>REF ID: XXXXXXXXXXXXXXXXXX</Text>
                            <Text style={styles.detailText}>REF URL: https://ODHPay.com</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.pinPrompt}>ENTER 4-DIGIT UPI PIN</Text>

                {showError && (
                    <Text style={styles.errorText}>{error}</Text>
                )}

                <View style={styles.pinInputContainer}>
                    {pin.map((digit, index) => (
                        <View key={index} style={[
                            styles.pinInputBox,
                            showError && styles.pinInputBoxError
                        ]}>
                            <TextInput
                                ref={el => inputRefs.current[index] = el}
                                style={styles.pinInput}
                                keyboardType="numeric"
                                maxLength={4} // Allow paste of multiple digits
                                secureTextEntry={digit !== ""}
                                value={digit}
                                onChangeText={(text) => handlePinChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                autoFocus={index === 0}
                                caretHidden={true}
                            />
                            {digit === "" && <Text style={styles.pinPlaceholder}>_</Text>}
                        </View>
                    ))}
                </View>

                <View style={styles.alertBox}>
                    <Text style={styles.alertIcon}>⚠️</Text>
                    <Text style={styles.alertText}>
                        You are transferring money{"\n"} from your Canara Bank account{"\n"}{" "}
                        to XYZ
                    </Text>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
    },
    bankName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000",
    },
    accountNumber: {
        fontSize: 14,
        color: "#666",
    },
    upiLogo: {
        width: 70,
        height: 60,
        resizeMode: "contain",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    detailsContainer: {
        marginVertical: 10,
        backgroundColor: "#FFF",
        padding: 12,
        borderRadius: 8,
        elevation: 2,
    },
    toText: {
        fontSize: 12,
        color: "#666",
    },
    recipient: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#000",
    },
    dropdownButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    sendingText: {
        fontSize: 12,
        color: "#666",
        marginTop: 5,
    },
    amount: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#000",
    },
    dropdownContainer: {
        marginTop: 10,
        backgroundColor: "#f8f8f8",
        padding: 12,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    detailText: {
        fontSize: 14,
        color: "#444",
        marginBottom: 5,
    },
    pinPrompt: {
        textAlign: "center",
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 20,
    },
    errorText: {
        color: "#d9534f",
        textAlign: "center",
        marginTop: 5,
        marginBottom: 5,
        fontSize: 14,
        fontWeight: "500",
    },
    pinInputContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginVertical: 20,
    },
    pinInputBox: {
        width: 50,
        height: 60,
        borderBottomWidth: 2,
        borderBottomColor: "#333",
        marginHorizontal: 10,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    pinInputBoxError: {
        borderBottomColor: "#d9534f",
    },
    pinInput: {
        width: "100%",
        height: "100%",
        fontSize: 24,
        textAlign: "center",
        color: "#000",
    },
    pinPlaceholder: {
        position: "absolute",
        fontSize: 30,
        color: "#888",
    },
    alertBox: {
        flexDirection: "row",
        backgroundColor: "#FFF3CD",
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
        marginVertical: 15,
    },
    alertIcon: {
        fontSize: 16,
        marginRight: 5,
    },
    alertText: {
        fontSize: 14,
        color: "#666",
        flex: 1,
        textAlign: "center",
    },
});

export default ScanPayScreenPin;