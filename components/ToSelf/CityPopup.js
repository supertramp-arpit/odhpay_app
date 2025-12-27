import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Modal,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import BranchPopup from "./BranchPopup";

const CityPopup = ({ visible, onClose, onSelectCircle, state, BranchData }) => {
    const [selectedCity, setSelectedCity] = useState(null);
    const [CityPopupVisible, setCityPopupVisible] = useState(false);
    const [selectedIFSC, setSelectedIFSC] = useState("");

    const uniqueCities = [...new Set(BranchData?.filter(item => item.state === state).map(item => item.city1))];

    const handleCitySelect = (city) => {
        setSelectedCity(city);
        onSelectCircle(city);
        onClose();
        setTimeout(() => {
            setCityPopupVisible(true);
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
                            <Text style={styles.modalTitle}>Select city</Text>
                            <TouchableOpacity onPress={onClose}>
                                <MaterialIcons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={uniqueCities}
                            keyExtractor={(item) => item.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.circleItem}
                                    onPress={() => handleCitySelect(item)}
                                >
                                    <Text style={styles.circleText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <BranchPopup
                visible={CityPopupVisible}
                onClose={() => setCityPopupVisible(false)}
                onSelectIFSC={setSelectedIFSC} // Update IFSC in CityPopup
                onSelectBranch={(branch) => {
                    setCityPopupVisible(false);
                    console.log("Selected Branch:", branch);
                }}
                BranchData={BranchData}
                city={selectedCity}
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
        maxHeight: "80%",
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
    circleItem: {
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    circleText: {
        fontSize: 18,
        color: "#333",
        fontWeight: "500",
    },
});

export default CityPopup;
