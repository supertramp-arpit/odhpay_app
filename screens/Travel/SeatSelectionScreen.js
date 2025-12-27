import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Theme from "../../components/Theme";

const { width } = Dimensions.get("window");
const isSmall = width < 375;

// Generate seat layout - Lower and Upper berths
const generateSeatLayout = () => {
  const lowerBerths = [];
  const upperBerths = [];
  
  // Lower berths (6 rows, 6 seats each - 2 left, 2 middle aisle, 2 right)
  for (let row = 1; row <= 6; row++) {
    lowerBerths.push([
      { id: `L${row}A`, type: "sleeper", position: "window", status: row === 2 || row === 4 ? "booked" : "available" },
      { id: `L${row}B`, type: "sleeper", position: "aisle", status: row === 3 ? "booked" : "available" },
      { id: `L${row}C`, type: "sleeper", position: "aisle", status: "available" },
      { id: `L${row}D`, type: "sleeper", position: "window", status: row === 5 ? "booked" : "available" },
    ]);
  }
  
  // Upper berths (6 rows, 4 seats each)
  for (let row = 1; row <= 6; row++) {
    upperBerths.push([
      { id: `U${row}A`, type: "sleeper", position: "window", status: row === 1 || row === 3 ? "booked" : "available" },
      { id: `U${row}B`, type: "sleeper", position: "aisle", status: "available" },
      { id: `U${row}C`, type: "sleeper", position: "aisle", status: row === 4 ? "booked" : "available" },
      { id: `U${row}D`, type: "sleeper", position: "window", status: "available" },
    ]);
  }
  
  return { lowerBerths, upperBerths };
};

const SeatSelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bus, searchParams } = route.params || {};
  const { passengers = 1 } = searchParams || {};
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeDeck, setActiveDeck] = useState("lower");
  const seatLayout = generateSeatLayout();

  const handleBack = () => navigation.goBack();

  const handleProceed = () => {
    navigation.navigate("TravelPassengerDetails", {
      bus,
      searchParams,
      selectedSeats,
      totalPrice,
    });
  };

  const handleSeatPress = (seat) => {
    if (seat.status === "booked") return;

    if (selectedSeats.find((s) => s.id === seat.id)) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length < passengers) {
        setSelectedSeats([...selectedSeats, seat]);
      }
    }
  };

  const getSeatStyle = (seat) => {
    if (seat.status === "booked") return styles.seatBooked;
    if (selectedSeats.find((s) => s.id === seat.id)) return styles.seatSelected;
    return styles.seatAvailable;
  };

  const getSeatTextStyle = (seat) => {
    if (seat.status === "booked") return styles.seatTextBooked;
    if (selectedSeats.find((s) => s.id === seat.id)) return styles.seatTextSelected;
    return styles.seatTextAvailable;
  };

  const renderSeat = (seat) => (
    <TouchableOpacity
      key={seat.id}
      style={[styles.seat, getSeatStyle(seat)]}
      onPress={() => handleSeatPress(seat)}
      disabled={seat.status === "booked"}
      activeOpacity={0.7}
    >
      <MaterialIcons 
        name="airline-seat-flat" 
        size={20} 
        color={
          seat.status === "booked" 
            ? Theme.colors.textSecondary 
            : selectedSeats.find((s) => s.id === seat.id) 
              ? Theme.colors.surface 
              : Theme.colors.primary
        } 
      />
      <Text style={[styles.seatText, getSeatTextStyle(seat)]}>{seat.id}</Text>
    </TouchableOpacity>
  );

  const renderBerthRow = (row, index) => (
    <View key={index} style={styles.berthRow}>
      <View style={styles.berthSide}>
        {renderSeat(row[0])}
        {renderSeat(row[1])}
      </View>
      <View style={styles.aisle} />
      <View style={styles.berthSide}>
        {renderSeat(row[2])}
        {renderSeat(row[3])}
      </View>
    </View>
  );

  const totalPrice = selectedSeats.length * bus.price;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Theme.colors.surface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Select Seats</Text>
          <Text style={styles.headerSubtitle}>{bus.name} • {bus.class}</Text>
        </View>
      </View>

      {/* Bus Info Card */}
      <View style={styles.busInfoCard}>
        <View style={styles.busInfoRow}>
          <View style={styles.busInfoItem}>
            <Text style={styles.busInfoLabel}>From</Text>
            <Text style={styles.busInfoValue}>{searchParams.from_loc}</Text>
            <Text style={styles.busInfoTime}>{bus.departure}</Text>
          </View>
          <View style={styles.busInfoDivider}>
            <MaterialIcons name="arrow-forward" size={20} color={Theme.colors.textSecondary} />
          </View>
          <View style={[styles.busInfoItem, styles.busInfoItemRight]}>
            <Text style={styles.busInfoLabel}>To</Text>
            <Text style={styles.busInfoValue}>{searchParams.to_loc}</Text>
            <Text style={styles.busInfoTime}>{bus.arrival}</Text>
          </View>
        </View>
      </View>

      {/* Deck Selector */}
      <View style={styles.deckSelector}>
        <TouchableOpacity
          style={[styles.deckBtn, activeDeck === "lower" && styles.deckBtnActive]}
          onPress={() => setActiveDeck("lower")}
        >
          <MaterialIcons 
            name="layers" 
            size={18} 
            color={activeDeck === "lower" ? Theme.colors.surface : Theme.colors.text} 
          />
          <Text style={[styles.deckBtnText, activeDeck === "lower" && styles.deckBtnTextActive]}>
            Lower Deck
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deckBtn, activeDeck === "upper" && styles.deckBtnActive]}
          onPress={() => setActiveDeck("upper")}
        >
          <MaterialIcons 
            name="layers" 
            size={18} 
            color={activeDeck === "upper" ? Theme.colors.surface : Theme.colors.text} 
          />
          <Text style={[styles.deckBtnText, activeDeck === "upper" && styles.deckBtnTextActive]}>
            Upper Deck
          </Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendAvailable]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendSelected]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendBooked]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
      </View>

      {/* Seat Layout */}
      <ScrollView style={styles.seatContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.busLayout}>
          {/* Driver Section */}
          <View style={styles.driverSection}>
            <View style={styles.steeringWheel}>
              <MaterialIcons name="radio-button-checked" size={24} color={Theme.colors.textSecondary} />
            </View>
            <Text style={styles.driverText}>Front</Text>
          </View>

          {/* Seats */}
          <View style={styles.seatsSection}>
            {(activeDeck === "lower" ? seatLayout.lowerBerths : seatLayout.upperBerths).map(
              (row, index) => renderBerthRow(row, index)
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.selectionInfo}>
          <Text style={styles.selectedCount}>
            {selectedSeats.length}/{passengers} seats selected
          </Text>
          {selectedSeats.length > 0 && (
            <Text style={styles.selectedSeats}>
              {selectedSeats.map((s) => s.id).join(", ")}
            </Text>
          )}
        </View>
        <View style={styles.priceSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>₹{totalPrice.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.proceedBtn, selectedSeats.length === 0 && styles.proceedBtnDisabled]}
          onPress={handleProceed}
          disabled={selectedSeats.length === 0}
        >
          <Text style={styles.proceedBtnText}>Continue</Text>
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
    paddingTop: Platform.OS === "android" ? 20 :25,
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
  busInfoCard: {
    backgroundColor: Theme.colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  busInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  busInfoItem: {
    flex: 1,
  },
  busInfoItemRight: {
    alignItems: "flex-end",
  },
  busInfoLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  busInfoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  busInfoTime: {
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  busInfoDivider: {
    paddingHorizontal: 16,
  },
  deckSelector: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  deckBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  deckBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  deckBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  deckBtnTextActive: {
    color: Theme.colors.surface,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendAvailable: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
  },
  legendSelected: {
    backgroundColor: Theme.colors.primary,
  },
  legendBooked: {
    backgroundColor: Theme.colors.border,
  },
  legendText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: "500",
  },
  seatContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  busLayout: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 16,
  },
  driverSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    marginBottom: 16,
    gap: 8,
  },
  steeringWheel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  driverText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: "500",
  },
  seatsSection: {
    gap: 12,
  },
  berthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  berthSide: {
    flexDirection: "row",
    gap: 8,
  },
  aisle: {
    width: 40,
  },
  seat: {
    width: 60,
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  seatAvailable: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.primary,
  },
  seatSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  seatBooked: {
    backgroundColor: Theme.colors.border,
    borderColor: Theme.colors.border,
  },
  seatText: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
  },
  seatTextAvailable: {
    color: Theme.colors.primary,
  },
  seatTextSelected: {
    color: Theme.colors.surface,
  },
  seatTextBooked: {
    color: Theme.colors.textSecondary,
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
    gap: 12,
  },
  selectionInfo: {
    flex: 1,
  },
  selectedCount: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: "500",
  },
  selectedSeats: {
    fontSize: 13,
    color: Theme.colors.text,
    fontWeight: "600",
    marginTop: 2,
  },
  priceSection: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
  },
  totalPrice: {
    fontSize: 18,
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

export default SeatSelectionScreen;
