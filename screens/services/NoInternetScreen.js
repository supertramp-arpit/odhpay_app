import React from "react";
import { View, Text, StyleSheet } from "react-native";

const NoInternetScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>No Internet Connection</Text>
            <Text style={styles.subText}>Please check your network settings.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    text: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#d9534f",
    },
    subText: {
        fontSize: 16,
        color: "#555",
        marginTop: 5,
    },
});

export default NoInternetScreen;
