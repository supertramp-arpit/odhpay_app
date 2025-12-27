import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
  Alert,
  Share,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Theme from "../../components/Theme";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';

const { width, height } = Dimensions.get("window");
const isSmall = width < 375;
const bottomTabHeight = Platform.OS === "ios" ? 90 : 70;

// All Bookings Data
const ALL_BOOKINGS = [
  { 
    id: 1, 
    from: "Delhi", 
    fromCode: "DEL",
    to: "Mumbai", 
    toCode: "MUM",
    date: "15 Dec 2025",
    departureTime: "21:30",
    arrivalTime: "08:45",
    duration: "11h 15m",
    busName: "Volvo Multi-Axle A/C Sleeper",
    busNumber: "DL-01-AB-1234",
    operator: "IntrCity SmartBus",
    status: "confirmed",
    pnr: "BUS123456",
    price: 1850,
    seatNumber: "L12, L13",
    boardingPoint: "Kashmere Gate ISBT",
    droppingPoint: "Dadar TT Circle",
    passengerName: "Rahul Sharma",
    passengerAge: 28,
    passengerGender: "Male",
    phone: "9876543210",
    email: "rahul@email.com",
    bookingDate: "10 Dec 2025",
    paymentMethod: "UPI",
    month: "December",
    year: "2025"
  },
  { 
    id: 2, 
    from: "Bangalore", 
    fromCode: "BLR",
    to: "Chennai", 
    toCode: "CHN",
    date: "20 Dec 2025",
    departureTime: "22:00",
    arrivalTime: "05:30",
    duration: "7h 30m",
    busName: "Mercedes Sleeper",
    busNumber: "KA-01-CD-5678",
    operator: "VRL Travels",
    status: "upcoming",
    pnr: "BUS789012",
    price: 1200,
    seatNumber: "U5",
    boardingPoint: "Majestic Bus Stand",
    droppingPoint: "Koyambedu Terminal",
    passengerName: "Priya Patel",
    passengerAge: 25,
    passengerGender: "Female",
    phone: "9123456780",
    email: "priya@email.com",
    bookingDate: "12 Dec 2025",
    paymentMethod: "Card",
    month: "December",
    year: "2025"
  },
  { 
    id: 3, 
    from: "Pune", 
    fromCode: "PUN",
    to: "Goa", 
    toCode: "GOA",
    date: "05 Nov 2025",
    departureTime: "20:00",
    arrivalTime: "06:00",
    duration: "10h",
    busName: "Scania Multi-Axle",
    busNumber: "MH-12-EF-9012",
    operator: "Paulo Travels",
    status: "completed",
    pnr: "BUS345678",
    price: 1500,
    seatNumber: "L8",
    boardingPoint: "Pune Station",
    droppingPoint: "Panjim Bus Stand",
    passengerName: "Amit Kumar",
    passengerAge: 32,
    passengerGender: "Male",
    phone: "9988776655",
    email: "amit@email.com",
    bookingDate: "01 Nov 2025",
    paymentMethod: "Wallet",
    month: "November",
    year: "2025"
  },
  { 
    id: 4, 
    from: "Hyderabad", 
    fromCode: "HYD",
    to: "Bangalore", 
    toCode: "BLR",
    date: "25 Oct 2025",
    departureTime: "23:00",
    arrivalTime: "07:30",
    duration: "8h 30m",
    busName: "Volvo Sleeper",
    busNumber: "TS-01-GH-3456",
    operator: "Orange Travels",
    status: "cancelled",
    pnr: "BUS901234",
    price: 1100,
    seatNumber: "L2, L3",
    boardingPoint: "Ameerpet",
    droppingPoint: "Electronic City",
    passengerName: "Sneha Reddy",
    passengerAge: 27,
    passengerGender: "Female",
    phone: "9876123450",
    email: "sneha@email.com",
    bookingDate: "20 Oct 2025",
    paymentMethod: "UPI",
    refundStatus: "Refunded",
    refundAmount: 990,
    month: "October",
    year: "2025"
  },
  { 
    id: 5, 
    from: "Jaipur", 
    fromCode: "JAI",
    to: "Delhi", 
    toCode: "DEL",
    date: "15 Sep 2025",
    departureTime: "06:00",
    arrivalTime: "11:30",
    duration: "5h 30m",
    busName: "AC Seater",
    busNumber: "RJ-14-IJ-7890",
    operator: "RSRTC",
    status: "completed",
    pnr: "BUS567890",
    price: 650,
    seatNumber: "A15",
    boardingPoint: "Sindhi Camp",
    droppingPoint: "ISBT Kashmere Gate",
    passengerName: "Vikram Singh",
    passengerAge: 35,
    passengerGender: "Male",
    phone: "9012345678",
    email: "vikram@email.com",
    bookingDate: "12 Sep 2025",
    paymentMethod: "Net Banking",
    month: "September",
    year: "2025"
  },
  { 
    id: 6, 
    from: "Mumbai", 
    fromCode: "MUM",
    to: "Ahmedabad", 
    toCode: "AMD",
    date: "10 Jan 2024",
    departureTime: "22:30",
    arrivalTime: "06:00",
    duration: "7h 30m",
    busName: "Volvo B11R Sleeper",
    busNumber: "MH-02-KL-1234",
    operator: "Neeta Travels",
    status: "completed",
    pnr: "BUS112233",
    price: 1300,
    seatNumber: "U10",
    boardingPoint: "Borivali",
    droppingPoint: "Paldi",
    passengerName: "Ravi Patel",
    passengerAge: 40,
    passengerGender: "Male",
    phone: "9876501234",
    email: "ravi@email.com",
    bookingDate: "08 Jan 2024",
    paymentMethod: "UPI",
    month: "January",
    year: "2024"
  },
];

const MONTHS = [
  "All Months", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = ["All Years", "2025", "2024", "2023"];

const STATUS_FILTERS = [
  { id: "all", label: "All", icon: "list" },
  { id: "confirmed", label: "Active", icon: "check-circle" },
  { id: "upcoming", label: "Upcoming", icon: "schedule" },
  { id: "completed", label: "Completed", icon: "done-all" },
  { id: "cancelled", label: "Cancelled", icon: "cancel" },
];

const BookingHistoryScreen = () => {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("All Months");
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const ticketRef = useRef();

  const handleBack = () => navigation.goBack();

  const filteredBookings = ALL_BOOKINGS.filter((booking) => {
    // Status filter
    if (activeFilter !== "all" && booking.status !== activeFilter) {
      return false;
    }
    // Month filter
    if (selectedMonth !== "All Months" && booking.month !== selectedMonth) {
      return false;
    }
    // Year filter
    if (selectedYear !== "All Years" && booking.year !== selectedYear) {
      return false;
    }
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "#4CAF50";
      case "upcoming": return "#2196F3";
      case "completed": return "#9E9E9E";
      case "cancelled": return "#F44336";
      default: return Theme.colors.textSecondary;
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "confirmed": return "#E8F5E9";
      case "upcoming": return "#E3F2FD";
      case "completed": return "#F5F5F5";
      case "cancelled": return "#FFEBEE";
      default: return Theme.colors.background;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "confirmed": return "Confirmed";
      case "upcoming": return "Upcoming";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  const handleViewTicket = (booking) => {
    setSelectedBooking(booking);
    setShowTicketModal(true);
  };

  const handleDownloadTicket = async () => {
    try {
      Alert.alert(
        "Download Ticket",
        "Your ticket has been saved to your device.",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to download ticket. Please try again.");
    }
  };

  const handleShareTicket = async () => {
    try {
      await Share.share({
        message: `Bus Ticket - PNR: ${selectedBooking.pnr}\n${selectedBooking.from} → ${selectedBooking.to}\nDate: ${selectedBooking.date}\nDeparture: ${selectedBooking.departureTime}\nSeat: ${selectedBooking.seatNumber}\nPassenger: ${selectedBooking.passengerName}`,
        title: "Bus Ticket",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share ticket.");
    }
  };

  const renderTicketModal = () => {
    if (!selectedBooking) return null;

    return (
      <Modal
        visible={showTicketModal}
        animationType="slide"
        onRequestClose={() => setShowTicketModal(false)}
      >
        <View style={styles.ticketModalContainer}>
          {/* Ticket Header */}
          <View style={styles.ticketHeader}>
            <TouchableOpacity onPress={() => setShowTicketModal(false)} style={styles.ticketBackBtn}>
              <MaterialIcons name="arrow-back" size={24} color={Theme.colors.surface} />
            </TouchableOpacity>
            <Text style={styles.ticketHeaderTitle}>Boarding Pass</Text>
            <View style={styles.ticketHeaderActions}>
              <TouchableOpacity onPress={handleShareTicket} style={styles.ticketActionBtn}>
                <MaterialIcons name="share" size={22} color={Theme.colors.surface} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDownloadTicket} style={styles.ticketActionBtn}>
                <MaterialIcons name="download" size={22} color={Theme.colors.surface} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.ticketContent} showsVerticalScrollIndicator={false}>
            {/* Status Banner */}
            <View style={[styles.statusBanner, { backgroundColor: getStatusBgColor(selectedBooking.status) }]}>
              <MaterialIcons 
                name={selectedBooking.status === "cancelled" ? "cancel" : "check-circle"} 
                size={24} 
                color={getStatusColor(selectedBooking.status)} 
              />
              <Text style={[styles.statusBannerText, { color: getStatusColor(selectedBooking.status) }]}>
                Booking {getStatusLabel(selectedBooking.status)}
              </Text>
            </View>

            {/* Ticket Card */}
            <View style={styles.ticketCard} ref={ticketRef}>
              {/* Operator Info */}
              <View style={styles.operatorSection}>
                <View style={styles.operatorIcon}>
                  <MaterialIcons name="directions-bus" size={28} color={Theme.colors.primary} />
                </View>
                <View style={styles.operatorInfo}>
                  <Text style={styles.operatorName}>{selectedBooking.operator}</Text>
                  <Text style={styles.busName}>{selectedBooking.busName}</Text>
                  <Text style={styles.busNumber}>{selectedBooking.busNumber}</Text>
                </View>
              </View>

              <View style={styles.ticketDivider}>
                <View style={styles.dividerCircleLeft} />
                <View style={styles.dividerLine} />
                <View style={styles.dividerCircleRight} />
              </View>

              {/* Route Info */}
              <View style={styles.routeSection}>
                <View style={styles.routePoint}>
                  <Text style={styles.routeCode}>{selectedBooking.fromCode}</Text>
                  <Text style={styles.routeCity}>{selectedBooking.from}</Text>
                  <Text style={styles.routeTime}>{selectedBooking.departureTime}</Text>
                  <Text style={styles.routeDate}>{selectedBooking.date}</Text>
                </View>
                <View style={styles.routeCenter}>
                  <View style={styles.routeLine}>
                    <View style={styles.routeDot} />
                    <View style={styles.routeDashed} />
                    <MaterialIcons name="directions-bus" size={18} color={Theme.colors.primary} />
                    <View style={styles.routeDashed} />
                    <View style={styles.routeDot} />
                  </View>
                  <Text style={styles.duration}>{selectedBooking.duration}</Text>
                </View>
                <View style={[styles.routePoint, styles.routePointRight]}>
                  <Text style={styles.routeCode}>{selectedBooking.toCode}</Text>
                  <Text style={styles.routeCity}>{selectedBooking.to}</Text>
                  <Text style={styles.routeTime}>{selectedBooking.arrivalTime}</Text>
                  <Text style={styles.routeDate}>{selectedBooking.date}</Text>
                </View>
              </View>

              <View style={styles.ticketDivider}>
                <View style={styles.dividerCircleLeft} />
                <View style={styles.dividerLine} />
                <View style={styles.dividerCircleRight} />
              </View>

              {/* Passenger & Seat Info */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Passenger</Text>
                  <Text style={styles.detailValue}>{selectedBooking.passengerName}</Text>
                  <Text style={styles.detailSub}>{selectedBooking.passengerAge} yrs, {selectedBooking.passengerGender}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Seat Number</Text>
                  <Text style={styles.detailValueLarge}>{selectedBooking.seatNumber}</Text>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Boarding Point</Text>
                  <Text style={styles.detailValue}>{selectedBooking.boardingPoint}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Dropping Point</Text>
                  <Text style={styles.detailValue}>{selectedBooking.droppingPoint}</Text>
                </View>
              </View>

              <View style={styles.ticketDivider}>
                <View style={styles.dividerCircleLeft} />
                <View style={styles.dividerLine} />
                <View style={styles.dividerCircleRight} />
              </View>

              {/* PNR & QR Section */}
              <View style={styles.pnrSection}>
                <View style={styles.pnrInfo}>
                  <Text style={styles.pnrLabel}>PNR Number</Text>
                  <Text style={styles.pnrNumber}>{selectedBooking.pnr}</Text>
                </View>
                <View style={styles.qrCode}>
                  <MaterialIcons name="qr-code-2" size={80} color={Theme.colors.text} />
                </View>
              </View>

              {/* Payment Info */}
              <View style={styles.paymentSection}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Amount Paid</Text>
                  <Text style={styles.paymentValue}>₹{selectedBooking.price.toLocaleString()}</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Payment Method</Text>
                  <Text style={styles.paymentMethod}>{selectedBooking.paymentMethod}</Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Booking Date</Text>
                  <Text style={styles.paymentMethod}>{selectedBooking.bookingDate}</Text>
                </View>
                {selectedBooking.status === "cancelled" && (
                  <>
                    <View style={styles.paymentDivider} />
                    <View style={styles.paymentRow}>
                      <Text style={styles.refundLabel}>Refund Status</Text>
                      <Text style={styles.refundValue}>{selectedBooking.refundStatus}</Text>
                    </View>
                    <View style={styles.paymentRow}>
                      <Text style={styles.refundLabel}>Refund Amount</Text>
                      <Text style={styles.refundValue}>₹{selectedBooking.refundAmount?.toLocaleString()}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Contact Info */}
            <View style={styles.contactCard}>
              <Text style={styles.contactTitle}>Contact Information</Text>
              <View style={styles.contactRow}>
                <MaterialIcons name="phone" size={18} color={Theme.colors.textSecondary} />
                <Text style={styles.contactText}>{selectedBooking.phone}</Text>
              </View>
              <View style={styles.contactRow}>
                <MaterialIcons name="email" size={18} color={Theme.colors.textSecondary} />
                <Text style={styles.contactText}>{selectedBooking.email}</Text>
              </View>
            </View>

            {/* Help Section */}
            <View style={styles.helpCard}>
              <MaterialIcons name="support-agent" size={24} color={Theme.colors.primary} />
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>Need Help?</Text>
                <Text style={styles.helpText}>Contact us at 1800-xxx-xxxx</Text>
              </View>
              <TouchableOpacity style={styles.helpBtn}>
                <Text style={styles.helpBtnText}>Call</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Theme.colors.surface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>{filteredBookings.length} bookings found</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabsContainer}
        contentContainerStyle={styles.filterTabs}
      >
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterTab, activeFilter === filter.id && styles.filterTabActive]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <MaterialIcons 
              name={filter.icon} 
              size={16} 
              color={activeFilter === filter.id ? Theme.colors.surface : Theme.colors.textSecondary} 
            />
            <Text style={[styles.filterTabText, activeFilter === filter.id && styles.filterTabTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Date Filters */}
      <View style={styles.dateFilters}>
        <TouchableOpacity 
          style={styles.dateFilterBtn}
          onPress={() => setShowMonthPicker(true)}
        >
          <MaterialIcons name="event" size={18} color={Theme.colors.primary} />
          <Text style={styles.dateFilterText}>{selectedMonth}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dateFilterBtn}
          onPress={() => setShowYearPicker(true)}
        >
          <MaterialIcons name="calendar-today" size={18} color={Theme.colors.primary} />
          <Text style={styles.dateFilterText}>{selectedYear}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView style={styles.bookingsList} showsVerticalScrollIndicator={false}>
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <TouchableOpacity 
              key={booking.id} 
              style={styles.bookingCard}
              onPress={() => handleViewTicket(booking)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardRoute}>
                  <Text style={styles.cardCity}>{booking.from}</Text>
                  <View style={styles.cardRouteIcon}>
                    <MaterialIcons name="arrow-forward" size={14} color={Theme.colors.textSecondary} />
                  </View>
                  <Text style={styles.cardCity}>{booking.to}</Text>
                </View>
                <View style={[styles.cardStatus, { backgroundColor: getStatusBgColor(booking.status) }]}>
                  <Text style={[styles.cardStatusText, { color: getStatusColor(booking.status) }]}>
                    {getStatusLabel(booking.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.cardDetailRow}>
                  <MaterialIcons name="directions-bus" size={16} color={Theme.colors.textSecondary} />
                  <Text style={styles.cardDetailText}>{booking.busName}</Text>
                </View>
                <View style={styles.cardDetailRow}>
                  <MaterialIcons name="event" size={16} color={Theme.colors.textSecondary} />
                  <Text style={styles.cardDetailText}>{booking.date}</Text>
                </View>
                <View style={styles.cardDetailRow}>
                  <MaterialIcons name="schedule" size={16} color={Theme.colors.textSecondary} />
                  <Text style={styles.cardDetailText}>{booking.departureTime} - {booking.arrivalTime}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.cardPnr}>
                  <Text style={styles.cardPnrLabel}>PNR:</Text>
                  <Text style={styles.cardPnrValue}>{booking.pnr}</Text>
                </View>
                <View style={styles.cardPriceSection}>
                  <Text style={styles.cardPrice}>₹{booking.price.toLocaleString()}</Text>
                  <View style={styles.viewTicketBtn}>
                    <Text style={styles.viewTicketText}>View Ticket</Text>
                    <MaterialIcons name="arrow-forward-ios" size={12} color={Theme.colors.primary} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="event-busy" size={64} color={Theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Bookings Found</Text>
            <Text style={styles.emptySubtitle}>
              Try changing your filters to see more bookings
            </Text>
          </View>
        )}
        <View style={{ height: bottomTabHeight }} />
      </ScrollView>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <MaterialIcons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.pickerList}
              contentContainerStyle={styles.pickerListContent}
              showsVerticalScrollIndicator={true}
            >
              {MONTHS.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[styles.pickerItem, selectedMonth === month && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedMonth(month);
                    setShowMonthPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, selectedMonth === month && styles.pickerItemTextActive]}>
                    {month}
                  </Text>
                  {selectedMonth === month && (
                    <MaterialIcons name="check" size={20} color={Theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <MaterialIcons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.pickerList}
              contentContainerStyle={styles.pickerListContent}
              showsVerticalScrollIndicator={true}
            >
              {YEARS.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[styles.pickerItem, selectedYear === year && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedYear(year);
                    setShowYearPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, selectedYear === year && styles.pickerItemTextActive]}>
                    {year}
                  </Text>
                  {selectedYear === year && (
                    <MaterialIcons name="check" size={20} color={Theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Ticket Modal */}
      {renderTicketModal()}
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
    fontSize: isSmall ? 18 : 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  filterTabsContainer: {
    maxHeight: 60,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  filterTabs: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterTabActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
  },
  filterTabTextActive: {
    color: Theme.colors.surface,
  },
  dateFilters: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Theme.colors.surface,
  },
  dateFilterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  dateFilterText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  bookingsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardRoute: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardCity: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  cardRouteIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  cardStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cardStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardDetails: {
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    marginBottom: 12,
  },
  cardDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardDetailText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardPnr: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardPnrLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  cardPnrValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.colors.primary,
  },
  cardPriceSection: {
    alignItems: "flex-end",
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  viewTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  viewTicketText: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerContent: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  pickerList: {
    flexGrow: 0,
  },
  pickerListContent: {
    paddingBottom: 20,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  pickerItemActive: {
    backgroundColor: `${Theme.colors.primary}10`,
  },
  pickerItemText: {
    fontSize: 15,
    color: Theme.colors.text,
    fontWeight: "500",
  },
  pickerItemTextActive: {
    color: Theme.colors.primary,
    fontWeight: "700",
  },
  // Ticket Modal Styles
  ticketModalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  ticketHeader: {
    backgroundColor: Theme.colors.primary,
    paddingTop: Platform.OS === "android" ? 40 : 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ticketBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  ticketHeaderTitle: {
    color: Theme.colors.surface,
    fontSize: 18,
    fontWeight: "700",
  },
  ticketHeaderActions: {
    flexDirection: "row",
    gap: 8,
  },
  ticketActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  ticketContent: {
    flex: 1,
    padding: 16,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusBannerText: {
    fontSize: 15,
    fontWeight: "700",
  },
  ticketCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  operatorSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  operatorIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: `${Theme.colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  busName: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  busNumber: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  ticketDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerCircleLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.background,
    marginLeft: -30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginHorizontal: 10,
  },
  dividerCircleRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.background,
    marginRight: -30,
  },
  routeSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  routePoint: {
    flex: 1,
  },
  routePointRight: {
    alignItems: "flex-end",
  },
  routeCode: {
    fontSize: 24,
    fontWeight: "800",
    color: Theme.colors.text,
  },
  routeCity: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  routeTime: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.primary,
    marginTop: 8,
  },
  routeDate: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  routeCenter: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  routeLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
  },
  routeDashed: {
    width: 20,
    height: 2,
    backgroundColor: Theme.colors.border,
  },
  duration: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 6,
  },
  detailsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  detailValueLarge: {
    fontSize: 20,
    fontWeight: "800",
    color: Theme.colors.primary,
  },
  detailSub: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  pnrSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pnrInfo: {},
  pnrLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pnrNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: Theme.colors.primary,
    letterSpacing: 2,
  },
  qrCode: {
    padding: 8,
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  paymentSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  paymentValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: 8,
  },
  refundLabel: {
    fontSize: 13,
    color: "#4CAF50",
  },
  refundValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4CAF50",
  },
  contactCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: Theme.colors.text,
  },
  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  helpText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  helpBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  helpBtnText: {
    color: Theme.colors.surface,
    fontSize: 13,
    fontWeight: "700",
  },
});

export default BookingHistoryScreen;
