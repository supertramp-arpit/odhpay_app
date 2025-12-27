import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import ViewShot from "react-native-view-shot";
import Share from "react-native-share";
import Theme from "../../components/Theme";

const { width } = Dimensions.get("window");
const isSmall = width < 375;

const BoardingPassScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bus, searchParams, selectedSeats = [], passengerDetails } = route.params || {};
  
  const { from_loc, to_loc, selectedDate, passengers = 1, travelClass = "economy" } = searchParams || {};
  const ticketNumber = `ODH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const seatNumbers = selectedSeats.length > 0 ? selectedSeats.map(s => s.id).join(", ") : `${Math.floor(Math.random() * 20) + 1}-${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`;
  const barcodeNumber = `${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
  const passengerName = passengerDetails?.passengers?.[0]?.name || "Guest";

  const ticketRef = useRef();

  const handleShare = async () => {
    try {
      const uri = await ticketRef.current.capture();
      await Share.open({
        url: uri,
        title: "My Bus Ticket",
        message: `Bus Ticket: ${from_loc} to ${to_loc} on ${selectedDate}`,
        type: "image/png",
      });
    } catch (error) {
      if (error?.message !== "User did not share") {
        Alert.alert("Error", "Failed to share ticket. Please try again.");
      }
    }
  };

  const handleBack = () => {
    // Navigate back to the Travel tab (home of travel)
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }],
    });
  };

  const getClassLabel = () => {
    const labels = { economy: "Economy", business: "Business", first: "First Class" };
    return labels[travelClass] || "Economy";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Boarding Pass</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <MaterialIcons name="share" size={20} color={Theme.colors.surface} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Route Card */}
        <View style={styles.routeCard}>
          <View style={styles.routeHeader}>
            <View style={styles.routeInfo}>
              <Text style={styles.routeFrom}>{from_loc}</Text>
              <View style={styles.routeArrow}>
                <View style={styles.routeLine} />
                <MaterialIcons name="flight" size={20} color={Theme.colors.primary} style={styles.planeIcon} />
                <View style={styles.routeLine} />
              </View>
              <Text style={styles.routeTo}>{to_loc}</Text>
            </View>
          </View>
          <View style={styles.routeDetails}>
            <Text style={styles.routeDate}>{selectedDate}</Text>
            <Text style={styles.routeDot}>•</Text>
            <Text style={styles.routePax}>{passengers} Passenger{passengers > 1 ? 's' : ''}</Text>
            <Text style={styles.routeDot}>•</Text>
            <Text style={styles.routeClass}>{getClassLabel()}</Text>
          </View>
        </View>

        {/* Bus Info Card */}
        <View style={styles.busCard}>
          <View style={styles.busHeader}>
            <View>
              <Text style={styles.busName}>{bus.name}</Text>
              <Text style={styles.busCode}>{bus.class}</Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>₹{(bus.price * passengers).toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.journeySection}>
            <View style={styles.journeyBlock}>
              <Text style={styles.journeyStation}>{from_loc}</Text>
              <Text style={styles.journeyTime}>{bus.departure}</Text>
              <Text style={styles.journeyDate}>{selectedDate}</Text>
            </View>

            <View style={styles.journeyMiddle}>
              <View style={styles.journeyLine} />
              <View style={styles.durationBadge}>
                <MaterialIcons name="schedule" size={14} color={Theme.colors.textSecondary} />
                <Text style={styles.durationText}>{bus.duration}</Text>
              </View>
              <View style={styles.journeyLine} />
            </View>

            <View style={[styles.journeyBlock, { alignItems: "flex-end" }]}>
              <Text style={styles.journeyStation}>{to_loc}</Text>
              <Text style={styles.journeyTime}>{bus.arrival}</Text>
              <Text style={styles.journeyDate}>{selectedDate}</Text>
            </View>
          </View>

          {/* Amenities */}
          <View style={styles.amenitiesSection}>
            <Text style={styles.sectionLabel}>Amenities</Text>
            <View style={styles.amenitiesList}>
              {bus.amenities.map((amenity, idx) => (
                <View key={idx} style={styles.amenityTag}>
                  <MaterialIcons name="check" size={12} color={Theme.colors.success} />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Boarding Pass Ticket */}
        <ViewShot
          ref={ticketRef}
          options={{ format: "png", quality: 1.0 }}
          style={styles.ticketShotContainer}
        >
          <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <MaterialIcons name="confirmation-number" size={20} color={Theme.colors.primary} />
              <Text style={styles.ticketHeaderText}>Your Ticket</Text>
            </View>

          {/* Ticket Top Section */}
          <View style={styles.ticketTop}>
            <View style={styles.ticketRow}>
              <View style={styles.ticketCol}>
                <Text style={styles.ticketLabel}>Passenger Name</Text>
                <Text style={styles.ticketValue}>{passengerName}</Text>
              </View>
              <View style={styles.ticketCol}>
                <Text style={styles.ticketLabel}>Ticket Number</Text>
                <Text style={styles.ticketValue}>{ticketNumber}</Text>
              </View>
            </View>

            <View style={styles.ticketRow}>
              <View style={styles.ticketCol}>
                <Text style={styles.ticketLabel}>Seat Number</Text>
                <Text style={styles.ticketValue}>{seatNumbers}</Text>
              </View>
              <View style={styles.ticketCol}>
                <Text style={styles.ticketLabel}>Passengers</Text>
                <Text style={styles.ticketValue}>{selectedSeats.length || passengers} Adult{(selectedSeats.length || passengers) > 1 ? 's' : ''}</Text>
              </View>
            </View>

            <View style={styles.ticketRow}>
              <View style={styles.ticketCol}>
                <Text style={styles.ticketLabel}>Class</Text>
                <Text style={styles.ticketValue}>{getClassLabel()}</Text>
              </View>
              <View style={styles.ticketCol}>
                <Text style={styles.ticketLabel}>Baggage</Text>
                <Text style={styles.ticketValue}>15kg</Text>
              </View>
            </View>
          </View>

          {/* Dashed Divider */}
          <View style={styles.dashedDivider}>
            <View style={styles.circleLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.circleRight} />
          </View>

          {/* Barcode Section */}
          <View style={styles.barcodeSection}>
            <View style={styles.barcode}>
              <Text style={styles.barcodeLines}>|||||||||||||||||||||||||||||||</Text>
              <Text style={styles.barcodeNumber}>{barcodeNumber}</Text>
            </View>
          </View>
        </View>
        </ViewShot>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.downloadBtn}>
          <MaterialIcons name="download" size={20} color={Theme.colors.surface} />
          <Text style={styles.downloadBtnText}>Download Ticket</Text>
        </TouchableOpacity>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpText}>Any Question?</Text>
          <TouchableOpacity style={styles.faqBtn}>
            <Text style={styles.faqBtnText}>View FAQ</Text>
            <MaterialIcons name="arrow-forward" size={16} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: Theme.colors.surface,
    fontSize: isSmall ? 16 : 18,
    fontWeight: "700",
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  ticketShotContainer: {
    backgroundColor: Theme.colors.background,
    borderRadius: 16,
  },
  routeCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  routeHeader: {
    marginBottom: 16,
  },
  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeFrom: {
    fontSize: isSmall ? 16 : 18,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  routeArrow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
  },
  routeLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.border,
  },
  planeIcon: {
    marginHorizontal: 8,
    transform: [{ rotate: "90deg" }],
  },
  routeTo: {
    fontSize: isSmall ? 16 : 18,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  routeDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  routeDate: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: "500",
  },
  routeDot: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginHorizontal: 8,
  },
  routePax: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: "500",
  },
  routeClass: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: "600",
  },
  busCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  busHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  busName: {
    fontSize: isSmall ? 16 : 18,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  busCode: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  priceBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  priceText: {
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  journeySection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  journeyBlock: {
    flex: 1,
  },
  journeyStation: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 4,
  },
  journeyTime: {
    fontSize: isSmall ? 18 : 20,
    fontWeight: "700",
    color: Theme.colors.primary,
  },
  journeyDate: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  journeyMiddle: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  journeyLine: {
    width: 1,
    height: 20,
    backgroundColor: Theme.colors.border,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginVertical: 8,
  },
  durationText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: "600",
  },
  amenitiesSection: {},
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 10,
  },
  amenitiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amenityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Theme.colors.success}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  amenityText: {
    fontSize: 12,
    color: Theme.colors.text,
    fontWeight: "500",
  },
  ticketCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  ticketHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  ticketTop: {
    padding: 16,
  },
  ticketRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  ticketCol: {
    flex: 1,
  },
  ticketLabel: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ticketValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  dashedDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: -1,
  },
  circleLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.background,
    marginLeft: -10,
  },
  dashedLine: {
    flex: 1,
    borderTopWidth: 2,
    borderTopColor: Theme.colors.border,
    borderStyle: "dashed",
  },
  circleRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.background,
    marginRight: -10,
  },
  barcodeSection: {
    padding: 20,
    alignItems: "center",
  },
  barcode: {
    alignItems: "center",
  },
  barcodeLines: {
    fontSize: 28,
    fontFamily: "monospace",
    color: Theme.colors.text,
    letterSpacing: -2,
  },
  barcodeNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.colors.text,
    marginTop: 8,
    letterSpacing: 2,
  },
  downloadBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  downloadBtnText: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  helpSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  helpText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  faqBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  faqBtnText: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});

export default BoardingPassScreen;
