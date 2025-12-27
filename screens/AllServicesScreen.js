import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Theme from "../components/Theme";


const AllServices = () => {
  const navigation = useNavigation();

  // Modern color palette
  const colors = {
    blue: "#2196F3",
    green: "#4CAF50",
    orange: "#FF9800",
    purple: "#9C27B0",
    red: "#F44336",
    teal: "#009688",
    indigo: "#3F51B5",
    pink: "#E91E63",
  };

  // Color mapping for each service
  const serviceColors = {
    // Recharge & Bill Pay
    mobilePrepaid: colors.blue,
    mobilePostpaid: colors.indigo,
    fastag: colors.orange,
    landline: colors.green,

    // Housing & Utilities
    electricity: colors.orange,
    lpg: colors.red,
    gas: colors.pink,
    rental: colors.purple,
    municipal: colors.teal,
    society: colors.blue,
    water: colors.indigo,
    clubs: colors.green,

    // Finance
    credit: colors.orange,
    loan: colors.red,
    insurance: colors.green,
    deposit: colors.purple,
    education: colors.blue,

    // Entertainment
    broadband: colors.indigo,
    cable: colors.purple,
    dth: colors.orange,
    subscription: colors.pink,

    // Health
    hospital: colors.red,

    // Transport & Vehicle
    echallan: colors.red,
    evRecharge: colors.green,
    fleetCard: colors.orange,
    ncmc: colors.blue,

    // Other Services
    donation: colors.pink,
    agentCollection: colors.teal,
    municipalServices: colors.indigo,
    nps: colors.purple,
    prepaidMeter: colors.orange,
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <ScrollView contentContainerStyle={{ paddingBottom: 70 }}>
          <View style={styles.rechargeContainer}>
            <Text style={styles.sectionTitle}>Recharge & Bill Pay</Text>
            <View style={styles.rechargeOptionsContainer}>
              <ServiceOption
                iconName="phone-android"
                text="Mobile Prepaid"
                iconColor={serviceColors.mobilePrepaid}
                onPress={() =>
                  navigation.navigate("MobilePrepaid")
                }
              />
              <ServiceOption
                iconName="phone-in-talk"
                text="Mobile Postpaid"
                iconColor={serviceColors.mobilePostpaid}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Mobile Postpaid", name: "Postpaid Recharge", btnName: "PostPaid Recharge", reminder: "pay Postpaid Recharge" })
                }
              />
              <ServiceOption
                iconName="directions-car"
                text="FASTag"
                iconColor={serviceColors.fastag}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Fastag", name: "FASTAG Recharge", btnName: "Add New Vehicle", reminder: "Zip through toll Plazas" })
                }
              />
              <ServiceOption
                iconName="phone"
                text="Landline"
                iconColor={serviceColors.landline}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Landline Postpaid", name: "Landline Postpaid Recharge", btnName: "Add New Landline", reminder: "Pay Landline Plans" })
                }
              />
            </View>
          </View>

          <View style={styles.housingContainer}>
            <Text style={styles.sectionTitle}>Housing & Utilities</Text>
            <View style={styles.housingOptionsContainer}>
              <ServiceOption
                iconName="bolt"
                text="Electricity"
                iconColor={serviceColors.electricity}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Electricity", name: "Electricity Recharge", btnName: "Pay Electricity Bill", reminder: "Pay Electricity Plans" })
                }
              />
              <ServiceOption
                iconName="local-fire-department"
                text="LPG"
                iconColor={serviceColors.lpg}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "LPG Gas", name: "LPG Recharge", btnName: "Pay LPG Bill", reminder: "Pay LPG Bill" })
                }
              />
              <ServiceOption
                iconName="fireplace"
                text="Piped Gas"
                iconColor={serviceColors.gas}
                onPress={() => navigation.navigate("ServiceCategory", { endpoint: "Gas", name: "piped Gas Recharge", btnName: "Pay Gas Bill", reminder: "Pay Gas Bill" })}
              />
              <ServiceOption
                iconName="home"
                text="Rental"
                iconColor={serviceColors.rental}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Rental", name: "Rent payment", btnName: "Pay Rent", reminder: "Pay Rent payment" })
                }
              />
              <ServiceOption
                iconName="local-offer"
                text="Municipal Taxes"
                iconColor={serviceColors.municipal}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Municipal Taxes", name: "Municipal Taxes payment", btnName: "Pay Municipal Taxes", reminder: "Pay Municipal Taxes" })
                }
              />
              <ServiceOption
                iconName="location-city"
                text="Municipal Services"
                iconColor={serviceColors.municipalServices}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Municipal Services", name: "Municipal Services payment", btnName: "Pay Municipal Services", reminder: "Pay Municipal Services" })
                }
              />
              <ServiceOption
                iconName="apartment"
                text="Housing Society"
                iconColor={serviceColors.society}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Housing Society", name: "Housing Society payment", btnName: "Pay Housing Society", reminder: "Pay Housing Society" })
                }
              />
              <ServiceOption
                iconName="water"
                text="Water Bill"
                iconColor={serviceColors.water}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Water", name: "Water Bill payment", btnName: "Pay Water Bill", reminder: "Pay Water Bill" })
                }
              />
              <ServiceOption
                iconName="speed"
                text="Prepaid Meter"
                iconColor={serviceColors.prepaidMeter}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Prepaid Meter", name: "Prepaid Meter Recharge", btnName: "Recharge Prepaid Meter", reminder: "Recharge Prepaid Meter" })
                }
              />
              <ServiceOption
                iconName="groups"
                text="Clubs and Associations"
                iconColor={serviceColors.clubs}
                onPress={() =>
                  navigation.navigate("ServiceCategory", {
                    endpoint: "Clubs and Associations", name: "Clubs and Associations payment", btnName: "Pay Clubs & AssociationsBill", reminder: "Pay AssociationsBill"
                  })
                }
              />
            </View>
          </View>

          <View style={styles.financeContainer}>
            <Text style={styles.sectionTitle}>Finance</Text>
            <View style={styles.financeOptionsContainer}>
              <ServiceOption
                iconName="credit-card"
                text="Credit Card"
                iconColor={serviceColors.credit}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Credit Card", name: "Credit card Bill", btnName: "Pay Credit card Bill", reminder: "Pay Credit card Bill" })
                }
              />
              <ServiceOption
                iconName="payments"
                text="Loan Repayment"
                iconColor={serviceColors.loan}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Loan Repayment", name: "Loan Repayment", btnName: "Pay Loan premium", reminder: "Pay Loan premium" })
                }
              />
              <ServiceOption
                iconName="health-and-safety"
                text="Insurance"
                iconColor={serviceColors.insurance}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Insurance", name: "Insurance premium", btnName: "Pay Insurance premium", reminder: "Pay Insurance premium" })
                }
              />
              <ServiceOption
                iconName="currency-exchange"
                text="Recurring Deposit"
                iconColor={serviceColors.deposit}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Recurring Deposit", name: "Recurring Deposit", btnName: "Pay Recurring Deposit", reminder: "Pay Recurring Deposit" })
                }
              />
            </View>
            <View style={styles.financeOptionsContainer}>
              <ServiceOption
                iconName="school"
                text="Education Fees"
                iconColor={serviceColors.education}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Education Fees", name: "Education payment", btnName: "Pay Education Fees", reminder: "Pay Education Fees" })
                }
              />
              <ServiceOption
                iconName="account-balance"
                text="National Pension"
                iconColor={serviceColors.nps}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "National Pension System", name: "NPS payment", btnName: "Pay NPS", reminder: "Pay National Pension" })
                }
              />
              <ServiceOption
                iconName="volunteer-activism"
                text="Donation"
                iconColor={serviceColors.donation}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Donation", name: "Donation", btnName: "Make Donation", reminder: "Make Donation" })
                }
              />
              <ServiceOption
                iconName="support-agent"
                text="Agent Collection"
                iconColor={serviceColors.agentCollection}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Agent Collection", name: "Agent Collection", btnName: "Pay Agent Collection", reminder: "Pay Agent Collection" })
                }
              />
            </View>
          </View>

          <View style={styles.entertainmentContainer}>
            <Text style={styles.sectionTitle}>Entertainment</Text>
            <View style={styles.entertainmentOptionsContainer}>
              <ServiceOption
                iconName="router"
                text="Broadband Postpaid"
                iconColor={serviceColors.broadband}
                onPress={() =>
                  navigation.navigate("ServiceCategory", {
                    endpoint: "Broadband Postpaid", name: "Broadband Recharge", btnName: "Broadband Recharge", reminder: "Pay Broadband Recharge"
                  })
                }
              />
              <ServiceOption
                iconName="live-tv"
                text="Cable TV"
                iconColor={serviceColors.cable}
                onPress={() =>
                  navigation.navigate("ServiceCategory", {
                    endpoint: "Cable TV", name: "Cable TV Recharge", btnName: "Recharge Cable TV", reminder: "Pay Cable TV Recharge"
                  })
                }
              />
              <ServiceOption
                iconName="tv"
                text="DTH"
                iconColor={serviceColors.dth}
                onPress={() => navigation.navigate("ServiceCategory", { endpoint: "DTH", name: "DTH Recharge", btnName: "Recharge DTH", reminder: "Pay DTH Recharge" })}
              />
              <ServiceOption
                iconName="subscriptions"
                text="Subscription"
                iconColor={serviceColors.subscription}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Subscription", name: "Subscription Recharge", btnName: "Recharge Subscription", reminder: "Pay Subscription Fees" })
                }
              />
            </View>
          </View>

          <View style={styles.transportContainer}>
            <Text style={styles.sectionTitle}>Transport & Vehicle</Text>
            <View style={styles.transportOptionsContainer}>
              <ServiceOption
                iconName="receipt-long"
                text="eChallan"
                iconColor={serviceColors.echallan}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "eChallan", name: "eChallan Payment", btnName: "Pay eChallan", reminder: "Pay eChallan" })
                }
              />
              <ServiceOption
                iconName="ev-station"
                text="EV Recharge"
                iconColor={serviceColors.evRecharge}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "EV Recharge", name: "EV Recharge", btnName: "Recharge EV", reminder: "Recharge EV" })
                }
              />
              <ServiceOption
                iconName="local-gas-station"
                text="Fleet Card"
                iconColor={serviceColors.fleetCard}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Fleet Card Recharge", name: "Fleet Card Recharge", btnName: "Recharge Fleet Card", reminder: "Recharge Fleet Card" })
                }
              />
              <ServiceOption
                iconName="contactless"
                text="NCMC Recharge"
                iconColor={serviceColors.ncmc}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "NCMC Recharge", name: "NCMC Recharge", btnName: "Recharge NCMC", reminder: "Recharge NCMC Card" })
                }
              />
            </View>
          </View>

          <View style={styles.healthContainer}>
            <Text style={styles.sectionTitle}>Health</Text>
            <View style={styles.healthSingleOptionContainer}>
              <ServiceOption
                iconName="local-hospital"
                text="Hospital & Pathology"
                iconColor={serviceColors.hospital}
                onPress={() =>
                  navigation.navigate("ServiceCategory", {
                    endpoint: "Hospital and Pathology", name: "Hospital and Pathology payment", btnName: "Pay Hospital Fees", reminder: "Pay Hospital"
                  })
                }
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const ServiceOption = ({ iconName, text, iconColor, onPress }) => (
  <TouchableOpacity style={styles.option} onPress={onPress}>
    <View style={styles.iconContainer}>
      <MaterialIcons name={iconName} size={24} color={iconColor} />
    </View>
    <Text style={styles.optionText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  contentContainer: {
    backgroundColor: Theme.colors.secondary,
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 10,
    marginTop: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    paddingTop: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    color: Theme.colors.primary,
    textAlign: "left",
    letterSpacing: 0.3,
  },
  rechargeOptionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  housingOptionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  financeOptionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  entertainmentOptionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  healthSingleOptionContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  option: {
    alignItems: "center",
    width: "25%",
    marginBottom: 18,
  },
  iconContainer: {
    backgroundColor: "#F5F5F5",
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    color: Theme.colors.primary,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 14,
  },
  rechargeContainer: {
    paddingBottom: 8,
  },
  housingContainer: {
    paddingBottom: 8,
  },
  financeContainer: {
    paddingBottom: 8,
  },
  entertainmentContainer: {
    paddingBottom: 8,
  },
  transportContainer: {
    paddingBottom: 8,
  },
  transportOptionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  healthContainer: {
    paddingBottom: 16,
  },
});

export default AllServices;