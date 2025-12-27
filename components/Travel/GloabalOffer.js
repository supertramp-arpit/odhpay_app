import React, { useEffect, useState } from "react";
import {
    FlatList,
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Theme from '../Theme';

const { width } = Dimensions.get("window");
const isSmall = width < 375;

// Dummy Data
const PresentOffer = [
    { id: 1, type: "bus", Title: "Save up to ₹250 on bus tickets", valid: "31 Dec", code: "BUS30", icon: "directions-bus" },
    { id: 2, type: "bus", Title: "Flat ₹100 off on first booking", valid: "15 Jan", code: "NEWBUS100", icon: "local-offer" },
    { id: 3, type: "train", Title: "Save up to ₹500 on train tickets", valid: "31 Dec", code: "TRAIN500", icon: "train" },
    { id: 4, type: "train", Title: "20% cashback on train bookings", valid: "28 Feb", code: "CASHBACK20", icon: "percent" },
];

// Single Offer Card
const OfferCard = ({ title, valid, code, type, icon, navigation }) => (
    <TouchableOpacity
        onPress={() => navigation.navigate("aboutOffer", { title, valid, code, type })}
        style={styles.card}
        activeOpacity={0.8}
    >
        <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
                <MaterialIcons name={icon} size={24} color={Theme.colors.primary} />
            </View>
            <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{type}</Text>
            </View>
        </View>
        
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        
        <View style={styles.cardFooter}>
            <View style={styles.codeContainer}>
                <MaterialIcons name="confirmation-number" size={14} color={Theme.colors.primary} />
                <Text style={styles.codeText}>{code}</Text>
            </View>
            <Text style={styles.validText}>Valid: {valid}</Text>
        </View>
    </TouchableOpacity>
);

const GlobalOffer = () => {
    const navigation = useNavigation();
    const [selectedBtn, setSelectedBtn] = useState("All");
    const [selectedData, setSelectedData] = useState(PresentOffer);

    const filterOffers = () => {
        if (selectedBtn.toLowerCase() === "bus") {
            setSelectedData(PresentOffer.filter((item) => item.type === "bus"));
        } else if (selectedBtn.toLowerCase() === "train") {
            setSelectedData(PresentOffer.filter((item) => item.type === "train"));
        } else {
            setSelectedData(PresentOffer);
        }
    };

    useEffect(() => {
        filterOffers();
    }, [selectedBtn]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.heading}>Offers</Text>
                    <Text style={styles.subHeading}>Get best deals with great offers</Text>
                </View>
                <TouchableOpacity style={styles.seeAllBtn}>
                    <Text style={styles.seeAllText}>See All</Text>
                    <MaterialIcons name="arrow-forward" size={16} color={Theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                {["All", "Bus", "Train"].map((btn) => (
                    <TouchableOpacity
                        key={btn}
                        onPress={() => setSelectedBtn(btn)}
                        style={[
                            styles.filterButton,
                            selectedBtn === btn && styles.selectedFilterButton,
                        ]}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            selectedBtn === btn && styles.selectedFilterText,
                        ]}>
                            {btn}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Offer List */}
            <FlatList
                data={selectedData}
                renderItem={({ item }) => (
                    <OfferCard
                        title={item.Title}
                        valid={item.valid}
                        code={item.code}
                        type={item.type}
                        icon={item.icon}
                        navigation={navigation}
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    heading: {
        fontSize: isSmall ? 18 : 20,
        fontWeight: "700",
        color: Theme.colors.text,
    },
    subHeading: {
        fontSize: 13,
        color: Theme.colors.textSecondary,
        marginTop: 2,
    },
    seeAllBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    seeAllText: {
        fontSize: 13,
        fontWeight: "600",
        color: Theme.colors.primary,
    },
    filterContainer: {
        flexDirection: "row",
        marginBottom: 16,
        gap: 10,
    },
    filterButton: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Theme.colors.border,
        backgroundColor: Theme.colors.surface,
    },
    selectedFilterButton: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: Theme.colors.text,
    },
    selectedFilterText: {
        color: Theme.colors.surface,
    },
    listContent: {
        paddingRight: 16,
    },
    card: {
        width: isSmall ? 260 : 280,
        backgroundColor: Theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        marginRight: 14,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: `${Theme.colors.primary}10`,
        alignItems: "center",
        justifyContent: "center",
    },
    typeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: `${Theme.colors.primary}10`,
    },
    typeText: {
        fontSize: 11,
        fontWeight: "600",
        color: Theme.colors.primary,
        textTransform: "capitalize",
    },
    title: {
        fontSize: 15,
        fontWeight: "700",
        color: Theme.colors.text,
        lineHeight: 22,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    codeContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Theme.colors.background,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    codeText: {
        fontSize: 12,
        fontWeight: "700",
        color: Theme.colors.text,
    },
    validText: {
        fontSize: 11,
        color: Theme.colors.textSecondary,
        fontWeight: "500",
    },
});

export default GlobalOffer;
