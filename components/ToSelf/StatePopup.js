import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Modal,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import CityPopup from "./CityPopup";

const StatePopup = ({ visible, onClose, onSelectBranch, selectedBank }) => {

    const [selectedState, setSelectedState] = useState(null);


    const [StatePopupVisible, setStatePopupVisible] = useState(false);
    const [BranchData, setBranchData] = useState([])
    const [loading, setLoading] = useState(false)

    // const uniqueCities = [...new Set(BranchData?.map(item => item.city1))];
    const uniqueState = [...new Set(BranchData?.map(item => item.state))];
    // const uniquebranch = [...new Set(BranchData?.map(item => item.branch))];








    const FetchBankDetails = async (selectedBank) => {
        try {
            setLoading(true)
            const token = await AsyncStorage.getItem("access_token");

            if (!token) {
                console.error("Token is missing!");
                return;
            }

            const headers = {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            const response = await axios.post(
                "https://newapi.odhpay.com/payments/get-all-branchs", {
                bankName: selectedBank
            },
                { headers }
            );
            setLoading(false);
            console.log("API Response:", response.data); // 🔹 Debug API response



            // ✅ Extract the 'records' array properly
            const bankData = response.data.records || []; // Ensure it's an array

            if (Array.isArray(bankData)) {
                setBranchData(bankData); // ✅ Correctly setting state
            } else {
                console.warn("Invalid API response format", response.data);
                setBranchData([]); // ✅ Prevents crashes
            }
        } catch (error) {
            setLoading(false);
            console.error("Error fetching data:", error.message);
            setBranchData([]);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        console.log(`this is selected Bank===================================**`, selectedBank.bankName)
        if (selectedBank && selectedBank?.bankName) {
            FetchBankDetails(selectedBank?.bankName);
        }
    }, [selectedBank])





    const handleStateSelect = (branch) => {
        onSelectBranch(branch); // Pass the selected logo to RechargeScreen
        setSelectedState(branch)
        onClose();
        setTimeout(() => {
            setStatePopupVisible(true);
        }, 300);
    };

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                onRequestClose={onClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.header}>
                            <Text style={styles.modalTitle}>Select State</Text>
                            <TouchableOpacity onPress={onClose}>
                                <MaterialIcons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        {loading ? (
                            <ActivityIndicator size="large" color="green" style={styles.loader} />
                        ) : (<FlatList
                            data={uniqueState}
                            keyExtractor={(item) => item.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.operatorItem}
                                    onPress={() => handleStateSelect(item)}
                                >
                                    <Text style={styles.operatorText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />)}

                    </View>
                </View>
            </Modal>

            <CityPopup
                visible={StatePopupVisible}
                onClose={() => setStatePopupVisible(false)}
                onSelectCircle={(circle) => {
                    setStatePopupVisible(false);
                    console.log("Selected Circle:", circle);
                }}

                BranchData={BranchData}
                state={selectedState}

            />
        </>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        padding: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    operatorItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    operatorLogo: {
        width: 40,
        height: 40,
        marginRight: 15,
    },
    operatorText: {
        fontSize: 18,
        color: "#333",
        fontWeight: "500",
    },
    loader: {
        marginVertical: 20,
        alignSelf: "center",
    },
});

export default StatePopup;