import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Theme from "../../components/Theme";

const AboutUs = ({ navigation }) => {
  return (
    <View style={styles.container}>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* App Version Section */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Current version: 1.2.31</Text>
          <TouchableOpacity>
            <Text style={styles.updateText}>1.2.31 Update Now</Text>
          </TouchableOpacity>
        </View>

        {/* Introduction */}
        <Text style={styles.paragraph}>
          India's Recharge & Payment App! Online Shopping, Hotel Booking, Bus
          Booking, Money Transfer, Electricity Bill Payment, Mobile Recharge,
          Fast Tag, DTH, Investment Insurance Payment, Secure payments transfer
          from your bank account, and much more.
        </Text>

        {/* About {Theme.Text.Company} */}
        <Text style={styles.paragraph}>
          {Theme.Text.Company}, India's trusted Recharge & Payment App developed by
          Vyaspatial Info India Pvt. Ltd. Download {Theme.Text.Company} for online shopping,
          hotel bookings, bus bookings, money transfer, electricity bill
          payment, mobile recharge, mobile postpaid, water bill payment, fast
          tag, DTH, investment insurance payment, loan repayment, credit card
          bill payment, and secure payments transfer from your bank account in
          just a few taps.
        </Text>

        <Text style={styles.heading}>Things you can do on {Theme.Text.Company} app:</Text>

        {/* Features List */}
        <Text style={styles.subHeading}>
          Transfer money via {Theme.Text.Company} wallet
        </Text>
        <Text style={styles.bulletPoint}>
          • Send and request money from your contacts anytime, anywhere.
        </Text>
        <Text style={styles.bulletPoint}>
          • Instantly transfer money to any mobile number with {Theme.Text.Company} wallet
          using a unique ID.
        </Text>

        <Text style={styles.subHeading}>Add money to {Theme.Text.Company} wallet</Text>
        <Text style={styles.bulletPoint}>
          • Add money to your {Theme.Text.Company} wallet directly from your bank account via
          UPI/IMPS, Visa, Mastercard, RuPay, and Maestro Debit/Credit Cards.
        </Text>
        <Text style={styles.bulletPoint}>
          • Wallet KYC is mandatory for large transactions.
        </Text>

        <Text style={styles.subHeading}>Mobile & DTH Recharge</Text>
        <Text style={styles.bulletPoint}>
          • Browse latest prepaid recharge plans.
        </Text>
        <Text style={styles.bulletPoint}>
          • Recharge your DTH connections.
        </Text>

        <Text style={styles.subHeading}>Book Hotels & Bus Tickets</Text>
        <Text style={styles.bulletPoint}>
          • Book hotels and check real-time availability for buses.
        </Text>

        {/* Additional Features */}
        <Text style={styles.subHeading}>
          Pay Utilities Bill Payments, Credit Card Bills, Loan Repayment
        </Text>
        <Text style={styles.bulletPoint}>
          • Electricity, Water, Gas, and many more services supported.
        </Text>

        {/* Permissions */}
        <Text style={styles.heading}>Permissions for {Theme.Text.Company} App:</Text>
        <Text style={styles.bulletPoint}>
          • SMS: To verify OTPs and mobile numbers for registration.
        </Text>
        <Text style={styles.bulletPoint}>
          • Location: To fetch relevant services for your region.
        </Text>
        <Text style={styles.bulletPoint}>
          • Camera: For document and photo uploads.
        </Text>
      </ScrollView>
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    backgroundColor: "#00aaff",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Theme.colors.secondary,
    marginLeft: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  versionContainer: {
    marginBottom: 15,
    alignItems: "center",
  },
  versionText: {
    fontSize: 14,
    color: "#333",
  },
  updateText: {
    fontSize: 14,
    color: "#007bff",
    textDecorationLine: "underline",
    marginTop: 5,
  },
  paragraph: {
    fontSize: 14,
    color: "#333",
    marginBottom: 15,
    lineHeight: 22,
    textAlign: "justify",
  },
  heading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 10,
  },
  subHeading: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#007bff",
    marginVertical: 5,
  },
  bulletPoint: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
    marginLeft: 10,
  },
});

export default AboutUs;
