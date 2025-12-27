import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Dimensions,
    Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Theme from "../../Theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallDevice = SCREEN_WIDTH < 375;

const formatAmount = (amount) => {
    if (!amount) return "₹0";
    const rupees = amount / 100;
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(rupees);
};

const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    return `${day} ${month}`;
};

// Electricity Bill Card
export const ElectricityBillItem = ({ item, onPress }) => {
    return (
        <TouchableOpacity
            style={styles.utilityCard}
            activeOpacity={0.8}
            onPress={() => onPress(item)}
        >
            <View style={[styles.iconBox, { backgroundColor: "#FFF3E0" }]}>
                <MaterialIcons name="bolt" size={28} color="#FF9800" />
            </View>
            <View style={styles.billInfo}>
                <Text style={styles.billerName} numberOfLines={1}>{item.biller_name}</Text>
                <Text style={styles.consumerNumber}>{item.input_params}</Text>
                {item.customer_name && (
                    <Text style={styles.customerName}>{item.customer_name}</Text>
                )}
            </View>
            <View style={styles.amountSection}>
                <Text style={styles.billAmount}>{formatAmount(item.amount)}</Text>
                {item.due_date && (
                    <Text style={styles.dueText}>Due: {formatDate(item.due_date)}</Text>
                )}
                <TouchableOpacity style={[styles.payBtn, { backgroundColor: "#FF9800" }]} onPress={() => onPress(item)}>
                    <Text style={styles.payBtnText}>Pay</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

// Water Bill Card
export const WaterBillItem = ({ item, onPress }) => {
    return (
        <TouchableOpacity
            style={styles.utilityCard}
            activeOpacity={0.8}
            onPress={() => onPress(item)}
        >
            <View style={[styles.iconBox, { backgroundColor: "#E3F2FD" }]}>
                <MaterialIcons name="water-drop" size={28} color="#2196F3" />
            </View>
            <View style={styles.billInfo}>
                <Text style={styles.billerName} numberOfLines={1}>{item.biller_name}</Text>
                <Text style={styles.consumerNumber}>{item.input_params}</Text>
                {item.customer_name && (
                    <Text style={styles.customerName}>{item.customer_name}</Text>
                )}
            </View>
            <View style={styles.amountSection}>
                <Text style={styles.billAmount}>{formatAmount(item.amount)}</Text>
                {item.due_date && (
                    <Text style={styles.dueText}>Due: {formatDate(item.due_date)}</Text>
                )}
                <TouchableOpacity style={[styles.payBtn, { backgroundColor: "#2196F3" }]} onPress={() => onPress(item)}>
                    <Text style={styles.payBtnText}>Pay</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

// Gas Bill Card
export const GasBillItem = ({ item, onPress }) => {
    return (
        <TouchableOpacity
            style={styles.utilityCard}
            activeOpacity={0.8}
            onPress={() => onPress(item)}
        >
            <View style={[styles.iconBox, { backgroundColor: "#FCE4EC" }]}>
                <MaterialIcons name="local-fire-department" size={28} color="#E91E63" />
            </View>
            <View style={styles.billInfo}>
                <Text style={styles.billerName} numberOfLines={1}>{item.biller_name}</Text>

                {item.due_date && (
                    <Text style={styles.dueText}>Due: {formatDate(item.due_date)}</Text>
                )}

                <Text style={styles.consumerNumber}>
                    {/* {item.input_params} */}
                </Text>
            </View>
            <View style={styles.amountSection}>
                <Text style={styles.billAmount}>{formatAmount(item.amount)}</Text>
               
                <TouchableOpacity style={[styles.payBtn, { backgroundColor: "#E91E63" }]} onPress={() => onPress(item)}>
                    <Text style={styles.payBtnText}>Pay</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

// LPG Gas Card
export const LPGBillItem = ({ item, onPress }) => {
    return (
        <TouchableOpacity
            style={styles.utilityCard}
            activeOpacity={0.8}
            onPress={() => onPress(item)}
        >
            <View style={[styles.iconBox, { backgroundColor: "#FFEBEE" }]}>
                <MaterialIcons name="propane-tank" size={28} color="#F44336" />
            </View>
            <View style={styles.billInfo}>
                <Text style={styles.billerName} numberOfLines={1}>{item.biller_name}</Text>
                <Text style={styles.consumerNumber}>{item.input_params}</Text>
                {item.customer_name && (
                    <Text style={styles.customerName}>{item.customer_name}</Text>
                )}
            </View>
            <View style={styles.amountSection}>
                <Text style={styles.billAmount}>{formatAmount(item.amount)}</Text>
                <TouchableOpacity style={[styles.payBtn, { backgroundColor: "#F44336" }]} onPress={() => onPress(item)}>
                    <Text style={styles.payBtnText}>Book</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    utilityCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: isSmallDevice ? 14 : 16,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    iconBox: {
        width: isSmallDevice ? 48 : 54,
        height: isSmallDevice ? 48 : 54,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    billInfo: {
        flex: 1,
        marginRight: 8,
    },
    billerName: {
        fontSize: isSmallDevice ? 14 : 15,
        fontWeight: "600",
        color: "#1a1a1a",
        marginBottom: 2,
    },
    consumerNumber: {
        fontSize: isSmallDevice ? 12 : 13,
        color: "#666",
        marginBottom: 2,
    },
    customerName: {
        fontSize: isSmallDevice ? 11 : 12,
        color: "#888",
    },
    amountSection: {
        alignItems: "flex-end",
    },
    billAmount: {
        fontSize: isSmallDevice ? 15 : 16,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 2,
    },
    dueText: {
        fontSize: 11,
        color: "#888",
        marginBottom: 6,
    },
    payBtn: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 14,
    },
    payBtnText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
});
