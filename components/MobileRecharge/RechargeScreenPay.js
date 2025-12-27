import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import JioLogo from "../../assets/jio.png";
import g5 from "../../assets/g5.png";
import Music from "../../assets/music.png";
import Movie from "../../assets/movie.png";
import { useAppStore } from "../../store/useAppStore";
import Theme from "../Theme";
import { SafeAreaView } from "react-native-safe-area-context";

const RechargeScreenPay = ({ route }) => {
  const navigation = useNavigation();
  const { operatorCircle } = useAppStore();
  const { contactNumber, pack, img,circle,operator_code } = route.params || {};
  console.log("RechargeScreenPay route params", route.params);
  


  return (
    <View style={styles.safeArea} >
       <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <Image source={img || JioLogo} style={styles.logo} />
              <View>
                <Text style={styles.contactText}>{contactNumber}</Text>
                <Text style={styles.subText}>
                  {operatorCircle.operator} • {operatorCircle.circle}
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.priceRow}>
              <Text style={styles.price}>₹ {pack.price}</Text>
              <TouchableOpacity
                style={styles.changePlanButton}
                onPress={() => navigation.navigate("")}
              >
                <Text style={styles.changePlanText}>Change Plan</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Validity</Text>
                <Text style={styles.detailsText}>{pack.validity}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Data</Text>
                <Text style={styles.detailsText}>{pack.data}</Text>
              </View>
            </View>

            <Text style={styles.planDetails}>{pack.description}</Text>

            <View style={styles.iconsRow}>
              {[Movie, g5, Music].map((icon, index) => (
                <View key={index} style={styles.iconCard}>
                  <Image source={icon} style={styles.icon} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        </View>

      {/* Fixed Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.proceedButton]}
          onPress={() =>
            navigation.navigate("RechargeTrxPin", {
              payload: {
                amount: pack.price,
                mobile_number: contactNumber,
                recipient_name: operatorCircle.operator,
                circle,operator_code 
              }
            })
          }
        >
          <Text style={styles.proceedText}>PROCEED TO PAY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "white",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
    resizeMode: "contain",
  },
  contactText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  subText: {
    color: "#6B7280",
    fontSize: 13,
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: Theme.colors.primary,
  },
  changePlanButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 25,
    elevation: 2,
  },
  changePlanText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  detailsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginVertical: 8,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  detailsLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  detailsText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  planDetails: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
    marginTop: 10,
  },
  iconsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  iconCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 10,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },
  icon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
    tintColor: Theme.colors.primary,
  },
  footer: {
    backgroundColor: "white",
    paddingBottom: Platform.OS === "android" ? 10 : 25,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -3 },
  },
  proceedButton: {
    backgroundColor: Theme.colors.primary,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 15,
  },
  proceedText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.4,
  },
});

export default RechargeScreenPay;


