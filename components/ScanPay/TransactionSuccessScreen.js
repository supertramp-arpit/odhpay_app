import { useNavigation, useRoute } from "@react-navigation/native";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const TransactionSuccessScreen = () => {

  const navigation = useNavigation()

  const route = useRoute();

  const { amount, recipientNumber, recipientName } = route.params;


  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.transactionContainer}>
              <Text style={styles.sectionTitle}>Paid to</Text>
              <View style={styles.detailsRow}>
                <View style={styles.recipientContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>L</Text>
                  </View>
                  <View>
                    <Text style={styles.recipientName}>{recipientName}</Text>
                    <Text style={styles.recipientEmail}>
                      {recipientNumber}
                    </Text>
                  </View>
                </View>
                <Text style={styles.amount}>₹{amount}</Text>
              </View>

              <Text style={styles.sectionTitle}>Transfer Details</Text>
              <View style={styles.transferDetails}>
                <View style={styles.row}>
                  <Text style={styles.label}>Transaction ID</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.value}>T2412311742110966786242</Text>
                  <Ionicons
                    name="copy-outline"
                    size={20}
                    color="#007bff"
                    style={styles.icon}
                  />
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Debited from</Text>
                  <View style={styles.rowRight}>
                    <Text style={styles.value}>XX{recipientNumber.slice(-4)}</Text>
                    <Text style={styles.amountDebited}>₹{amount}</Text>
                  </View>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>UTR</Text>
                  <View style={styles.rowRight}>
                    <Text style={styles.value}>493334085971</Text>
                    <Ionicons
                      name="copy-outline"
                      size={20}
                      color="#007bff"
                      style={styles.icon}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.actions}>

                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ChatScreen', {
                  recipientNumber,
                  recipientName
                })}>
                  <Ionicons name="send-outline" size={24} color="#6200ee" />
                  <Text style={styles.actionText}>Send Again</Text>
                </TouchableOpacity>


                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ChatScreen', {
                  recipientNumber,
                  recipientName
                })}>
                  <Ionicons name="time-outline" size={24} color="#6200ee" />
                  <Text style={styles.actionText}>View History</Text>
                </TouchableOpacity>


                <TouchableOpacity style={styles.actionButton} >
                  <Ionicons name="share-outline" size={24} color="#6200ee" />
                  <Text style={styles.actionText}>Share Receipt</Text>
                </TouchableOpacity>


              </View>
            </View>

            <View style={styles.supportContainer}>
              <TouchableOpacity style={styles.supportRow}>
                <Ionicons name="help-circle-outline" size={24} color="#333" />
                <Text style={styles.supportText}>Contact Support</Text>
              </TouchableOpacity>
              <Text style={styles.poweredBy}>Powered by UPI Yes Bank</Text>

              <Image
                source={require("../../assets/LogoN.png")}
                style={styles.upiLogo}
                resizeMode="contain"
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: "#00a651",
    padding: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    marginTop: 5,
  },
  transactionContainer: {
    padding: 20,
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  recipientContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  recipientEmail: {
    fontSize: 14,
    color: "#666",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  rowRight: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  value: {
    fontSize: 14,
    color: "#007bff",
    marginRight: 5,
  },
  amountDebited: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  icon: {
    marginLeft: 5,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  actionButton: {
    alignItems: "center",
    flex: 1,
  },
  actionText: {
    fontSize: 12,
    color: "#6200ee",
    marginTop: 5,
  },
  supportContainer: {
    alignItems: "center",
    marginTop: 20,
    padding: 10,
  },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  supportText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  poweredBy: {
    fontSize: 12,
    color: "#888",
    marginTop: 10,
  },
  upiLogo: {
    width: 150,
    height: 70,
  },
});

export default TransactionSuccessScreen;
