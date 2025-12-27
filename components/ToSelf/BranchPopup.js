import React from "react";
import {
    View,
    Text,
    Modal,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useAppStore } from "../../store/useAppStore";

const BranchPopup = ({ visible, onClose, onSelectBranch, city, BranchData }) => {
    const uniqueBranches = [
        ...new Map(
            BranchData?.filter(item => item.city1 === city).map((item) => [
                item.ifsc, { branch: item.branch, ifsc_code: item.ifsc }
            ])
        ).values(),
    ];


    const { setSelectedIFSC } = useAppStore();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.modalTitle}>Select Branch</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={uniqueBranches}
                        keyExtractor={(item) => item.ifsc_code.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.circleItem}
                                onPress={() => {
                                    onSelectBranch(item.branch);
                                    setSelectedIFSC(item)
                                }}
                            >
                                <Text style={styles.circleText}>{item.branch}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
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

export default BranchPopup;
