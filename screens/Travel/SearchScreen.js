import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
  Modal,
  Alert,
  Dimensions,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import moment from "moment";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Theme from "../../components/Theme";
import { useTravelStore } from "../../store";

const { width, height } = Dimensions.get("window");
const isSmall = width < 375;
const isMedium = width >= 375 && width < 414;
const bottomSafeArea = Platform.OS === "ios" ? 40 : 50;
const bottomTabHeight = Platform.OS === "ios" ? 150 : 120;

// Bus Offers Data
const BUS_OFFERS = [
  { id: 1, title: "Flat ₹100 OFF", subtitle: "on first bus booking", code: "NEWBUS100", icon: "local-offer", color: "#FF6B6B" },
  { id: 2, title: "Save up to ₹250", subtitle: "on sleeper buses", code: "SLEEPER250", icon: "airline-seat-flat", color: "#4ECDC4" },
  { id: 3, title: "20% Cashback", subtitle: "on weekend travel", code: "WEEKEND20", icon: "percent", color: "#FFB800" },
];

// Recent Bookings Data
const RECENT_BOOKINGS = [
  { 
    id: 1, 
    from: "Delhi", 
    to: "Mumbai", 
    date: "15 Dec 2025", 
    busName: "Volvo Multi-Axle",
    status: "confirmed",
    pnr: "BUS123456",
    price: 1850
  },
  { 
    id: 2, 
    from: "Bangalore", 
    to: "Chennai", 
    date: "20 Dec 2025", 
    busName: "Mercedes Sleeper",
    status: "upcoming",
    pnr: "BUS789012",
    price: 1200
  },
];

const CITIES = [
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
];

const CLASSES = [
  { id: "economy", label: "Economy", icon: "airline-seat-recline-normal" },
  { id: "business", label: "Business", icon: "airline-seat-recline-extra" },
  { id: "first", label: "First Class", icon: "airline-seat-flat" },
];

const SearchScreen = () => {
  const navigation = useNavigation();
  const { from_loc, to_loc, selectedDate, setSelectedDate, setFromLoc, setToLoc } =
    useTravelStore();

  // Alias functions to match existing usage
  const onChangeFrom_loc = setFromLoc;
  const onChangeTo_loc = setToLoc;

  const [tripType, setTripType] = useState("one-way");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showReturnCalendar, setShowReturnCalendar] = useState(false);
  const [returnDate, setReturnDate] = useState(null);
  const [showCityPicker, setShowCityPicker] = useState(null);
  const [showPassengerPicker, setShowPassengerPicker] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [passengers, setPassengers] = useState(1);
  const [travelClass, setTravelClass] = useState("economy");
  const [isWomenBooking, setIsWomenBooking] = useState(false);

  const handleSearch = () => {
    if (!from_loc || !to_loc || !selectedDate) {
      Alert.alert("Missing Information", 'Please select "From", "To" locations and date.');
    } else {
      navigation.navigate("TravelResults", { 
        from_loc, 
        to_loc, 
        selectedDate, 
        returnDate,
        tripType, 
        passengers,
        travelClass,
        isWomenBooking 
      });
    }
  };

  const handleSelectCity = (city, type) => {
    if (type === "from") {
      onChangeFrom_loc(city);
    } else {
      onChangeTo_loc(city);
    }
    setShowCityPicker(null);
  };

  const SwapDestination = () => {
    const temp = from_loc;
    onChangeFrom_loc(to_loc);
    onChangeTo_loc(temp);
  };

  const onDateSelect = (date) => {
    const formattedDate = moment(date.dateString).format("D MMM YYYY");
    setSelectedDate(formattedDate);
    setShowCalendar(false);
  };

  const onReturnDateSelect = (date) => {
    const formattedDate = moment(date.dateString).format("D MMM YYYY");
    setReturnDate(formattedDate);
    setShowReturnCalendar(false);
  };

  const getClassLabel = () => {
    const cls = CLASSES.find(c => c.id === travelClass);
    return cls ? cls.label : "Economy";
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <Image
                source={require("../../assets/Images/women.jpg")}
                style={styles.avatar}
              />
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Hello Traveler! 👋</Text>
              <Text style={styles.question}>Where are you going?</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <MaterialIcons name="notifications-none" size={22} color={Theme.colors.surface} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Trip Type Selection */}
        <View style={styles.tripTypeContainer}>
          <View style={styles.tripTypeWrapper}>
            <TouchableOpacity
              style={[styles.tripTypeBtn, tripType === "one-way" && styles.tripTypeBtnActive]}
              onPress={() => setTripType("one-way")}
            >
              <MaterialIcons 
                name="arrow-forward" 
                size={16} 
                color={tripType === "one-way" ? Theme.colors.surface : Theme.colors.textSecondary} 
              />
              <Text style={[styles.tripTypeText, tripType === "one-way" && styles.tripTypeTextActive]}>
                One-way
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tripTypeBtn, tripType === "round-trip" && styles.tripTypeBtnActive]}
              onPress={() => setTripType("round-trip")}
            >
              <MaterialIcons 
                name="sync-alt" 
                size={16} 
                color={tripType === "round-trip" ? Theme.colors.surface : Theme.colors.textSecondary} 
              />
              <Text style={[styles.tripTypeText, tripType === "round-trip" && styles.tripTypeTextActive]}>
                Round trip
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Card */}
        <View style={styles.searchCard}>
          {/* Location Section */}
          <View style={styles.locationSection}>
            {/* From Location */}
            <TouchableOpacity
              style={styles.locationField}
              onPress={() => setShowCityPicker("from")}
            >
              <View style={styles.locationIconWrapper}>
                <View style={[styles.locationDot, styles.locationDotFrom]} />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>FROM</Text>
                <Text style={styles.inputValue}>{from_loc || "Select departure"}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={Theme.colors.textSecondary} />
            </TouchableOpacity>

            {/* Connection Line */}
            <View style={styles.connectionLine}>
              <View style={styles.dashedLine} />
            </View>

            {/* Swap Button */}
            <TouchableOpacity style={styles.swapBtn} onPress={SwapDestination}>
              <MaterialIcons name="swap-vert" size={18} color={Theme.colors.surface} />
            </TouchableOpacity>

            {/* To Location */}
            <TouchableOpacity
              style={styles.locationField}
              onPress={() => setShowCityPicker("to")}
            >
              <View style={styles.locationIconWrapper}>
                <View style={[styles.locationDot, styles.locationDotTo]} />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>TO</Text>
                <Text style={styles.inputValue}>{to_loc || "Select destination"}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Date Row */}
          {tripType === "one-way" ? (
            <TouchableOpacity
              style={styles.dateField}
              onPress={() => setShowCalendar(true)}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="event" size={20} color={Theme.colors.primary} />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Departure</Text>
                <Text style={styles.inputValue}>
                  {selectedDate || "Select date"}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.twoColumnRow}>
              <TouchableOpacity
                style={styles.halfField}
                onPress={() => setShowCalendar(true)}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name="event" size={20} color={Theme.colors.primary} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={styles.inputLabel}>Depart</Text>
                  <Text style={styles.inputValue}>
                    {selectedDate || "Select date"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.halfField}
                onPress={() => setShowReturnCalendar(true)}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name="event" size={20} color={Theme.colors.primary} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={styles.inputLabel}>Return</Text>
                  <Text style={styles.inputValue}>
                    {returnDate || "Select date"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Passengers & Class Row */}
          <View style={styles.twoColumnRow}>
            <TouchableOpacity 
              style={styles.halfField}
              onPress={() => setShowPassengerPicker(true)}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="people" size={20} color={Theme.colors.primary} />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Passengers</Text>
                <Text style={styles.inputValue}>{passengers} {passengers === 1 ? "Adult" : "Adults"}</Text>
              </View>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={Theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.halfField}
              onPress={() => setShowClassPicker(true)}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="airline-seat-recline-extra" size={20} color={Theme.colors.primary} />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Class</Text>
                <Text style={styles.inputValue}>{getClassLabel()}</Text>
              </View>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Women's Booking Toggle */}
        <View style={styles.womenCard}>
          <View style={styles.womenIcon}>
            <MaterialIcons name="female" size={24} color={Theme.colors.primary} />
          </View>
          <View style={styles.womenInfo}>
            <Text style={styles.womenTitle}>Women-only Seats</Text>
            <Text style={styles.womenDesc}>Book seats reserved for women</Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsWomenBooking(!isWomenBooking)}
            style={[styles.toggleSwitch, isWomenBooking && styles.toggleSwitchActive]}
          >
            <View style={[styles.toggleCircle, isWomenBooking && styles.toggleCircleActive]} />
          </TouchableOpacity>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.searchBtn, (!from_loc || !to_loc || !selectedDate) && styles.searchBtnDisabled]}
          onPress={handleSearch}
          disabled={!from_loc || !to_loc || !selectedDate}
        >
          <View style={styles.searchBtnContent}>
            <View style={styles.searchBtnIconWrapper}>
              <MaterialIcons name="directions-bus" size={20} color={Theme.colors.surface} />
            </View>
            <Text style={styles.searchBtnText}>Search Buses</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={20} color={Theme.colors.surface} />
        </TouchableOpacity>

        {/* Booking Details Section */}
        <View style={styles.bookingSection}>
          <View style={styles.bookingSectionHeader}>
            <View>
              <Text style={styles.bookingSectionTitle}>📋 Your Bookings</Text>
              <Text style={styles.bookingSectionSubtitle}>Track your upcoming journeys</Text>
            </View>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate("TravelBookingHistory")}>
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="arrow-forward-ios" size={12} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {RECENT_BOOKINGS.length > 0 ? (
            RECENT_BOOKINGS.map((booking) => (
              <TouchableOpacity key={booking.id} style={styles.bookingCard} activeOpacity={0.8}>
                <View style={styles.bookingCardHeader}>
                  <View style={styles.bookingRoute}>
                    <Text style={styles.bookingCity}>{booking.from}</Text>
                    <View style={styles.bookingRouteIcon}>
                      <MaterialIcons name="arrow-forward" size={14} color={Theme.colors.textSecondary} />
                    </View>
                    <Text style={styles.bookingCity}>{booking.to}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    booking.status === "confirmed" && styles.statusConfirmed,
                    booking.status === "upcoming" && styles.statusUpcoming,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      booking.status === "confirmed" && styles.statusTextConfirmed,
                      booking.status === "upcoming" && styles.statusTextUpcoming,
                    ]}>
                      {booking.status === "confirmed" ? "Confirmed" : "Upcoming"}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetailItem}>
                    <MaterialIcons name="directions-bus" size={16} color={Theme.colors.textSecondary} />
                    <Text style={styles.bookingDetailText}>{booking.busName}</Text>
                  </View>
                  <View style={styles.bookingDetailItem}>
                    <MaterialIcons name="event" size={16} color={Theme.colors.textSecondary} />
                    <Text style={styles.bookingDetailText}>{booking.date}</Text>
                  </View>
                </View>

                <View style={styles.bookingCardFooter}>
                  <View style={styles.pnrContainer}>
                    <Text style={styles.pnrLabel}>PNR:</Text>
                    <Text style={styles.pnrValue}>{booking.pnr}</Text>
                  </View>
                  <Text style={styles.bookingPrice}>₹{booking.price.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noBookingsCard}>
              <MaterialIcons name="event-busy" size={48} color={Theme.colors.textSecondary} />
              <Text style={styles.noBookingsText}>No bookings yet</Text>
              <Text style={styles.noBookingsSubtext}>Your booking history will appear here</Text>
            </View>
          )}
        </View>

        {/* Bus Offers Section */}
        <View style={styles.offersSection}>
          <View style={styles.offerHeader}>
            <View>
              <Text style={styles.offerTitle}>🚌 Bus Offers</Text>
              <Text style={styles.offerSubtitle}>Exclusive deals for your journey</Text>
            </View>
            <TouchableOpacity style={styles.seeAllBtn} onPress={() => navigation.navigate("TravelOffers")}>
              <Text style={styles.seeAllText}>See All</Text>
              <MaterialIcons name="arrow-forward-ios" size={12} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.offerScrollContent}
          >
            {BUS_OFFERS.map((offer) => (
              <TouchableOpacity key={offer.id} style={styles.offerCard} activeOpacity={0.8}>
                <View style={[styles.offerIconContainer, { backgroundColor: `${offer.color}15` }]}>
                  <MaterialIcons name={offer.icon} size={24} color={offer.color} />
                </View>
                <View style={styles.offerContent}>
                  <Text style={styles.offerCardTitle}>{offer.title}</Text>
                  <Text style={styles.offerCardSubtitle}>{offer.subtitle}</Text>
                </View>
                <View style={styles.offerCodeContainer}>
                  <Text style={styles.offerCode}>{offer.code}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Why Book with Us?</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: "#E8F5E9" }]}>
                <MaterialIcons name="verified" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.featureText}>Safe Travel</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: "#E3F2FD" }]}>
                <MaterialIcons name="support-agent" size={20} color="#2196F3" />
              </View>
              <Text style={styles.featureText}>24/7 Support</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: "#FFF3E0" }]}>
                <MaterialIcons name="local-offer" size={20} color="#FF9800" />
              </View>
              <Text style={styles.featureText}>Best Prices</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: "#FCE4EC" }]}>
                <MaterialIcons name="event-available" size={20} color="#E91E63" />
              </View>
              <Text style={styles.featureText}>Easy Booking</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing for Tab Bar */}
        <View style={{ height: bottomTabHeight }} />
      </ScrollView>

      {/* City Picker Modal */}
      <Modal
        visible={showCityPicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCityPicker(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {showCityPicker === "from" ? "Departure" : "Destination"}
              </Text>
              <TouchableOpacity onPress={() => setShowCityPicker(null)} style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.cityList} showsVerticalScrollIndicator={false}>
              {CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.cityItem,
                    ((showCityPicker === "from" && city === from_loc) ||
                      (showCityPicker === "to" && city === to_loc)) && styles.cityItemActive
                  ]}
                  onPress={() => handleSelectCity(city, showCityPicker)}
                >
                  <MaterialIcons name="location-city" size={20} color={Theme.colors.primary} />
                  <Text style={styles.cityItemText}>{city}</Text>
                  {((showCityPicker === "from" && city === from_loc) ||
                    (showCityPicker === "to" && city === to_loc)) && (
                    <MaterialIcons name="check-circle" size={20} color={Theme.colors.success} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Passenger Picker Modal */}
      <Modal
        visible={showPassengerPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPassengerPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Passengers</Text>
              <TouchableOpacity onPress={() => setShowPassengerPicker(false)} style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.passengerContent}>
              <View style={styles.passengerRow}>
                <View style={styles.passengerInfo}>
                  <Text style={styles.passengerLabel}>Adults</Text>
                  <Text style={styles.passengerDesc}>12 years and above</Text>
                </View>
                <View style={styles.passengerControls}>
                  <TouchableOpacity
                    style={[styles.passengerBtn, passengers <= 1 && styles.passengerBtnDisabled]}
                    onPress={() => passengers > 1 && setPassengers(passengers - 1)}
                    disabled={passengers <= 1}
                  >
                    <MaterialIcons name="remove" size={20} color={passengers <= 1 ? Theme.colors.textSecondary : Theme.colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.passengerCount}>{passengers}</Text>
                  <TouchableOpacity
                    style={[styles.passengerBtn, passengers >= 9 && styles.passengerBtnDisabled]}
                    onPress={() => passengers < 9 && setPassengers(passengers + 1)}
                    disabled={passengers >= 9}
                  >
                    <MaterialIcons name="add" size={20} color={passengers >= 9 ? Theme.colors.textSecondary : Theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowPassengerPicker(false)}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Class Picker Modal */}
      <Modal
        visible={showClassPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClassPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class</Text>
              <TouchableOpacity onPress={() => setShowClassPicker(false)} style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.classContent}>
              {CLASSES.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  style={[styles.classItem, travelClass === cls.id && styles.classItemActive]}
                  onPress={() => {
                    setTravelClass(cls.id);
                    setShowClassPicker(false);
                  }}
                >
                  <MaterialIcons name={cls.icon} size={24} color={travelClass === cls.id ? Theme.colors.surface : Theme.colors.primary} />
                  <Text style={[styles.classItemText, travelClass === cls.id && styles.classItemTextActive]}>
                    {cls.label}
                  </Text>
                  {travelClass === cls.id && (
                    <MaterialIcons name="check" size={20} color={Theme.colors.surface} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Departure Date</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)} style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={onDateSelect}
              minDate={moment().format("YYYY-MM-DD")}
              markedDates={{
                [moment(selectedDate, "D MMM YYYY").format("YYYY-MM-DD")]: {
                  selected: true,
                  marked: true,
                  selectedColor: Theme.colors.primary,
                },
              }}
              theme={{
                selectedDayBackgroundColor: Theme.colors.primary,
                selectedDayTextColor: Theme.colors.surface,
                todayTextColor: Theme.colors.primary,
                todayBackgroundColor: `${Theme.colors.primary}20`,
                arrowColor: Theme.colors.primary,
                monthTextColor: Theme.colors.text,
                textDayFontWeight: "500",
                textMonthFontWeight: "700",
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Return Calendar Modal */}
      <Modal
        visible={showReturnCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReturnCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Return Date</Text>
              <TouchableOpacity onPress={() => setShowReturnCalendar(false)} style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={onReturnDateSelect}
              minDate={selectedDate ? moment(selectedDate, "D MMM YYYY").format("YYYY-MM-DD") : moment().format("YYYY-MM-DD")}
              markedDates={{
                [moment(returnDate, "D MMM YYYY").format("YYYY-MM-DD")]: {
                  selected: true,
                  marked: true,
                  selectedColor: Theme.colors.primary,
                },
              }}
              theme={{
                selectedDayBackgroundColor: Theme.colors.primary,
                selectedDayTextColor: Theme.colors.surface,
                todayTextColor: Theme.colors.primary,
                todayBackgroundColor: `${Theme.colors.primary}20`,
                arrowColor: Theme.colors.primary,
                monthTextColor: Theme.colors.text,
                textDayFontWeight: "500",
                textMonthFontWeight: "700",
              }}
            />
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: isSmall ? 16 : 20,
    paddingTop: Platform.OS === "android" ? 40 : 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: isSmall ? 44 : 50,
    height: isSmall ? 44 : 50,
    borderRadius: 25,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    color: "rgba(255,255,255,0.85)",
    fontSize: isSmall ? 12 : 13,
    fontWeight: "500",
  },
  question: {
    color: Theme.colors.surface,
    fontSize: isSmall ? 18 : 20,
    fontWeight: "700",
    marginTop: 3,
    letterSpacing: -0.3,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
  },
  tripTypeContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  tripTypeWrapper: {
    flexDirection: "row",
    backgroundColor: Theme.colors.surface,
    borderRadius: 30,
    padding: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  tripTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 26,
    gap: 6,
  },
  tripTypeBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  tripTypeText: {
    fontSize: isSmall ? 12 : 13,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
  },
  tripTypeTextActive: {
    color: Theme.colors.surface,
  },
  searchCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  // Location Section Styles
  locationSection: {
    position: "relative",
    marginBottom: 12,
  },
  locationField: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: Theme.colors.background,
    borderRadius: 14,
    marginBottom: 8,
  },
  locationIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  locationDotFrom: {
    backgroundColor: "#22C55E",
  },
  locationDotTo: {
    backgroundColor: "#EF4444",
  },
  connectionLine: {
    position: "absolute",
    left: 27,
    top: 52,
    bottom: 52,
    width: 2,
    zIndex: 1,
  },
  dashedLine: {
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: Theme.colors.border,
    borderStyle: "dashed",
  },
  swapBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Theme.colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContent: {
    marginLeft: 12,
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inputValue: {
    fontSize: isSmall ? 14 : 15,
    fontWeight: "600",
    color: Theme.colors.text,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 8,
  },
  dateField: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: Theme.colors.background,
    borderRadius: 14,
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 10,
  },
  halfField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: Theme.colors.background,
    borderRadius: 14,
  },
  womenCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${Theme.colors.primary}20`,
  },
  womenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FDF2F8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  womenInfo: {
    flex: 1,
  },
  womenTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  womenDesc: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.border,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: Theme.colors.primary,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.surface,
  },
  toggleCircleActive: {
    alignSelf: "flex-end",
  },
  searchBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  searchBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchBtnIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnDisabled: {
    opacity: 0.5,
  },
  searchBtnText: {
    color: Theme.colors.surface,
    fontSize: isSmall ? 15 : 16,
    fontWeight: "700",
  },
  bookingSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  bookingSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  bookingSectionTitle: {
    fontSize: isSmall ? 17 : 19,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  bookingSectionSubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: "600",
  },
  bookingCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bookingRoute: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookingCity: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  bookingRouteIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusConfirmed: {
    backgroundColor: "#E8F5E9",
  },
  statusUpcoming: {
    backgroundColor: "#E3F2FD",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusTextConfirmed: {
    color: "#4CAF50",
  },
  statusTextUpcoming: {
    color: "#2196F3",
  },
  bookingDetails: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  bookingDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bookingDetailText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: "500",
  },
  bookingCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pnrContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pnrLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  pnrValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.colors.primary,
  },
  bookingPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  noBookingsCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  noBookingsText: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.text,
    marginTop: 12,
  },
  noBookingsSubtext: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  offersSection: {
    marginTop: 24,
    paddingBottom: 16,
  },
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  offerTitle: {
    fontSize: isSmall ? 17 : 19,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  offerSubtitle: {
    fontSize: 12,
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
    color: Theme.colors.primary,
    fontWeight: "600",
  },
  offerScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  offerCard: {
    width: width * 0.75,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  offerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  offerContent: {
    marginBottom: 12,
  },
  offerCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  offerCardSubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  offerCodeContainer: {
    backgroundColor: `${Theme.colors.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: `${Theme.colors.primary}20`,
    borderStyle: "dashed",
  },
  offerCode: {
    fontSize: 12,
    fontWeight: "700",
    color: Theme.colors.primary,
    letterSpacing: 1,
  },
  featuresSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  featuresTitle: {
    fontSize: isSmall ? 17 : 19,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 14,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureItem: {
    width: (width - 44) / 2,
    backgroundColor: Theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  featureText: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.75,
    paddingBottom: bottomSafeArea,
  },
  calendarContainer: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: bottomSafeArea,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  cityList: {
    maxHeight: height * 0.5,
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  cityItemActive: {
    backgroundColor: `${Theme.colors.primary}08`,
  },
  cityItemText: {
    fontSize: 15,
    color: Theme.colors.text,
    fontWeight: "600",
    flex: 1,
    marginLeft: 14,
  },
  passengerContent: {
    padding: 20,
    paddingBottom: 20,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  passengerDesc: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  passengerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  passengerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  passengerBtnDisabled: {
    borderColor: Theme.colors.border,
  },
  passengerCount: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
    minWidth: 30,
    textAlign: "center",
  },
  modalDoneBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  modalDoneBtnText: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  classContent: {
    padding: 20,
    paddingBottom: 20,
    gap: 12,
  },
  classItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    gap: 14,
  },
  classItemActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  classItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.colors.text,
    flex: 1,
  },
  classItemTextActive: {
    color: Theme.colors.surface,
  },
});

export default SearchScreen;
