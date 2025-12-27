import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Theme from "../../components/Theme";

const { width } = Dimensions.get("window");
const isSmall = width < 375;

const PassengerDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bus, searchParams, selectedSeats, totalPrice } = route.params || {};
  
  const [passengers, setPassengers] = useState(
    (selectedSeats || []).map((seat, index) => ({
      seatId: seat.id,
      name: "",
      age: "",
      gender: "male",
      phone: index === 0 ? "" : null, // Only first passenger needs phone
    }))
  );
  const [email, setEmail] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");

  const handleBack = () => navigation.goBack();

  const updatePassenger = (index, field, value) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const isFormValid = () => {
    return (
      primaryPhone.length === 10 &&
      email.includes("@") &&
      passengers.every((p) => p.name.length >= 2 && p.age.length > 0)
    );
  };

  const handleProceed = () => {
    navigation.navigate("TravelPayment", {
      bus,
      searchParams,
      selectedSeats,
      totalPrice,
      passengerDetails: {
        passengers,
        email,
        phone: primaryPhone,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Theme.colors.surface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Passenger Details</Text>
          <Text style={styles.headerSubtitle}>
            {selectedSeats.length} Passenger{selectedSeats.length > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Journey Summary */}
          <View style={styles.journeyCard}>
            <View style={styles.journeyHeader}>
              <MaterialIcons name="train" size={20} color={Theme.colors.primary} />
              <Text style={styles.journeyTitle}>{bus.name}</Text>
            </View>
            <View style={styles.journeyRoute}>
              <Text style={styles.journeyLocation}>{searchParams.from_loc}</Text>
              <MaterialIcons name="arrow-forward" size={16} color={Theme.colors.textSecondary} />
              <Text style={styles.journeyLocation}>{searchParams.to_loc}</Text>
            </View>
            <Text style={styles.journeyDate}>
              {searchParams.selectedDate} • {bus.departure} - {bus.arrival}
            </Text>
            <View style={styles.seatsInfo}>
              <Text style={styles.seatsLabel}>Selected Seats:</Text>
              <Text style={styles.seatsValue}>{selectedSeats.map((s) => s.id).join(", ")}</Text>
            </View>
          </View>

          {/* Contact Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Details</Text>
            <Text style={styles.sectionSubtitle}>Ticket will be sent to this email & phone</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color={Theme.colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialIcons name="phone" size={20} color={Theme.colors.textSecondary} />
                <Text style={styles.phonePrefix}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number"
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={primaryPhone}
                  onChangeText={setPrimaryPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          {/* Passenger Details */}
          {passengers.map((passenger, index) => (
            <View key={passenger.seatId} style={styles.section}>
              <View style={styles.passengerHeader}>
                <Text style={styles.sectionTitle}>Passenger {index + 1}</Text>
                <View style={styles.seatBadge}>
                  <MaterialIcons name="airline-seat-flat" size={14} color={Theme.colors.primary} />
                  <Text style={styles.seatBadgeText}>{passenger.seatId}</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="person" size={20} color={Theme.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name (as per ID)"
                    placeholderTextColor={Theme.colors.textSecondary}
                    value={passenger.name}
                    onChangeText={(value) => updatePassenger(index, "name", value)}
                  />
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <MaterialIcons name="cake" size={20} color={Theme.colors.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Age"
                      placeholderTextColor={Theme.colors.textSecondary}
                      value={passenger.age}
                      onChangeText={(value) => updatePassenger(index, "age", value)}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  </View>

                  <View style={styles.genderSelector}>
                    <TouchableOpacity
                      style={[
                        styles.genderBtn,
                        passenger.gender === "male" && styles.genderBtnActive,
                      ]}
                      onPress={() => updatePassenger(index, "gender", "male")}
                    >
                      <MaterialIcons
                        name="male"
                        size={18}
                        color={passenger.gender === "male" ? Theme.colors.surface : Theme.colors.text}
                      />
                      <Text
                        style={[
                          styles.genderText,
                          passenger.gender === "male" && styles.genderTextActive,
                        ]}
                      >
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderBtn,
                        passenger.gender === "female" && styles.genderBtnActive,
                      ]}
                      onPress={() => updatePassenger(index, "gender", "female")}
                    >
                      <MaterialIcons
                        name="female"
                        size={18}
                        color={passenger.gender === "female" ? Theme.colors.surface : Theme.colors.text}
                      />
                      <Text
                        style={[
                          styles.genderText,
                          passenger.gender === "female" && styles.genderTextActive,
                        ]}
                      >
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceSection}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalPrice}>₹{totalPrice.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.proceedBtn, !isFormValid() && styles.proceedBtnDisabled]}
          onPress={handleProceed}
          disabled={!isFormValid()}
        >
          <Text style={styles.proceedBtnText}>Proceed to Payment</Text>
          <MaterialIcons name="arrow-forward" size={20} color={Theme.colors.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    backgroundColor: Theme.colors.primary,
    paddingTop: Platform.OS === "android" ? 20 : 25,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: Theme.colors.surface,
    fontSize: isSmall ? 17 : 19,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  journeyCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 16,
  },
  journeyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  journeyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  journeyRoute: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  journeyLocation: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  journeyDate: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 12,
  },
  seatsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  seatsLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  seatsValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  section: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 16,
  },
  passengerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Theme.colors.primary}10`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  seatBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  inputGroup: {
    gap: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  phonePrefix: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.text,
    fontWeight: "500",
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  genderSelector: {
    flexDirection: "row",
    gap: 8,
  },
  genderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.background,
  },
  genderBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  genderText: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  genderTextActive: {
    color: Theme.colors.surface,
  },
  bottomBar: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 12 : 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceSection: {},
  totalLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  proceedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  proceedBtnDisabled: {
    opacity: 0.5,
  },
  proceedBtnText: {
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
});

export default PassengerDetailsScreen;
