import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Theme from "../../components/Theme";

const { width, height } = Dimensions.get("window");
const isSmall = width < 375;

// Filter Constants
const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended", icon: "star" },
  { id: "price_low", label: "Price: Low to High", icon: "arrow-upward" },
  { id: "price_high", label: "Price: High to Low", icon: "arrow-downward" },
  { id: "duration", label: "Shortest Duration", icon: "timer" },
  { id: "departure", label: "Earliest Departure", icon: "schedule" },
  { id: "rating", label: "Highest Rating", icon: "thumb-up" },
];

const BUS_TYPES = [
  { id: "all", label: "All", icon: "directions-bus" },
  { id: "ac", label: "AC", icon: "ac-unit" },
  { id: "non-ac", label: "Non-AC", icon: "wb-sunny" },
  { id: "sleeper", label: "Sleeper", icon: "airline-seat-flat" },
  { id: "seater", label: "Seater", icon: "event-seat" },
];

const TIME_SLOTS = [
  { id: "any", label: "Any", icon: "schedule", range: null },
  { id: "morning", label: "Morning", icon: "wb-sunny", range: [6, 12], desc: "6AM - 12PM" },
  { id: "afternoon", label: "Afternoon", icon: "wb-twilight", range: [12, 18], desc: "12PM - 6PM" },
  { id: "evening", label: "Evening", icon: "nights-stay", range: [18, 24], desc: "6PM - 12AM" },
  { id: "night", label: "Night", icon: "bedtime", range: [0, 6], desc: "12AM - 6AM" },
];

const AMENITIES = [
  { id: "ac", label: "AC", icon: "ac-unit" },
  { id: "wifi", label: "WiFi", icon: "wifi" },
  { id: "toilet", label: "Toilet", icon: "wc" },
  { id: "usb", label: "USB Charging", icon: "usb" },
  { id: "meals", label: "Meals", icon: "restaurant" },
  { id: "blanket", label: "Blanket", icon: "bed" },
];

const RATING_OPTIONS = [
  { id: "any", label: "Any Rating", value: 0 },
  { id: "4plus", label: "4+ ⭐", value: 4 },
  { id: "4.5plus", label: "4.5+ ⭐", value: 4.5 },
];

const generateDummyBuses = (travelClass) => {
  const classLabels = {
    economy: "Economy",
    business: "Business",
    first: "First Class",
  };
  
  return [
    {
      id: 1,
      name: "Rajdhani Express",
      code: "RDH254",
      departure: "08:10",
      arrival: "09:30",
      from: "DEL",
      to: "MUM",
      duration: "1h 20m",
      price: travelClass === "first" ? 2500 : travelClass === "business" ? 1800 : 1200,
      availableSeats: 15,
      totalSeats: 45,
      class: classLabels[travelClass] || "Economy",
      rating: 4.5,
      reviews: 234,
      amenities: ["AC", "WiFi", "Toilet"],
    },
    {
      id: 2,
      name: "Shatabdi Express",
      code: "SHT102",
      departure: "08:30",
      arrival: "09:50",
      from: "DEL",
      to: "MUM",
      duration: "1h 20m",
      price: travelClass === "first" ? 2200 : travelClass === "business" ? 1600 : 1000,
      availableSeats: 2,
      totalSeats: 45,
      class: classLabels[travelClass] || "Economy",
      rating: 4.2,
      reviews: 156,
      amenities: ["AC", "Toilet"],
      status: "3Left",
    },
    {
      id: 3,
      name: "Duronto Express",
      code: "DRT008",
      departure: "09:00",
      arrival: "10:20",
      from: "DEL",
      to: "MUM",
      duration: "1h 30m",
      price: travelClass === "first" ? 2800 : travelClass === "business" ? 2000 : 1500,
      availableSeats: 20,
      totalSeats: 50,
      class: classLabels[travelClass] || "Economy",
      rating: 4.6,
      reviews: 312,
      amenities: ["AC", "WiFi", "Toilet", "USB"],
    },
    {
      id: 4,
      name: "Garib Rath",
      code: "GRR045",
      departure: "10:15",
      arrival: "13:45",
      from: "DEL",
      to: "MUM",
      duration: "3h 30m",
      price: travelClass === "first" ? 1800 : travelClass === "business" ? 1200 : 800,
      availableSeats: 8,
      totalSeats: 45,
      class: classLabels[travelClass] || "Economy",
      rating: 4.3,
      reviews: 198,
      amenities: ["AC"],
    },
    {
      id: 5,
      name: "Tejas Express",
      code: "TJS156",
      departure: "12:00",
      arrival: "15:30",
      from: "DEL",
      to: "MUM",
      duration: "3h 30m",
      price: travelClass === "first" ? 3000 : travelClass === "business" ? 2200 : 1800,
      availableSeats: 25,
      totalSeats: 50,
      class: classLabels[travelClass] || "Economy",
      rating: 4.7,
      reviews: 421,
      amenities: ["AC", "WiFi", "Toilet", "USB", "Meals"],
    },
  ];
};

const ResultsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const searchParams = route.params || {};
  const { from_loc, to_loc, selectedDate, passengers = 1, travelClass = "economy" } = searchParams;
  
  // Filter States
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedBusTypes, setSelectedBusTypes] = useState(["all"]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("any");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [minRating, setMinRating] = useState(0);
  
  const buses = generateDummyBuses(travelClass);

  const handleBack = () => navigation.goBack();

  const handleSelectBus = (bus) => {
    navigation.navigate("TravelSeatSelection", {
      bus: { ...bus, passengers },
      searchParams,
    });
  };

  // Toggle Bus Type
  const toggleBusType = (typeId) => {
    if (typeId === "all") {
      setSelectedBusTypes(["all"]);
    } else {
      let newTypes = selectedBusTypes.filter(t => t !== "all");
      if (newTypes.includes(typeId)) {
        newTypes = newTypes.filter(t => t !== typeId);
        if (newTypes.length === 0) newTypes = ["all"];
      } else {
        newTypes.push(typeId);
      }
      setSelectedBusTypes(newTypes);
    }
  };

  // Toggle Amenity
  const toggleAmenity = (amenityId) => {
    if (selectedAmenities.includes(amenityId)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenityId));
    } else {
      setSelectedAmenities([...selectedAmenities, amenityId]);
    }
  };

  // Reset Filters
  const resetFilters = () => {
    setSortBy("recommended");
    setSelectedBusTypes(["all"]);
    setSelectedTimeSlot("any");
    setSelectedAmenities([]);
    setPriceRange({ min: 0, max: 5000 });
    setMinRating(0);
  };

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sortBy !== "recommended") count++;
    if (!selectedBusTypes.includes("all")) count++;
    if (selectedTimeSlot !== "any") count++;
    if (selectedAmenities.length > 0) count++;
    if (priceRange.min > 0 || priceRange.max < 5000) count++;
    if (minRating > 0) count++;
    return count;
  }, [sortBy, selectedBusTypes, selectedTimeSlot, selectedAmenities, priceRange, minRating]);

  const filteredBuses = useMemo(() => {
    let result = [...buses];

    // Filter by bus type
    if (!selectedBusTypes.includes("all")) {
      result = result.filter(bus => {
        const busType = bus.class.toLowerCase();
        return selectedBusTypes.some(type => {
          if (type === "ac") return bus.amenities.includes("AC");
          if (type === "sleeper") return busType.includes("sleeper");
          if (type === "seater") return busType.includes("seater") || busType.includes("economy");
          return true;
        });
      });
    }

    // Filter by time slot
    if (selectedTimeSlot !== "any") {
      const slot = TIME_SLOTS.find(s => s.id === selectedTimeSlot);
      if (slot?.range) {
        result = result.filter(bus => {
          const hour = parseInt(bus.departure.split(":")[0]);
          return hour >= slot.range[0] && hour < slot.range[1];
        });
      }
    }

    // Filter by amenities
    if (selectedAmenities.length > 0) {
      result = result.filter(bus => {
        return selectedAmenities.every(amenity => 
          bus.amenities.map(a => a.toLowerCase()).includes(amenity.toLowerCase())
        );
      });
    }

    // Filter by price range
    result = result.filter(bus => bus.price >= priceRange.min && bus.price <= priceRange.max);

    // Filter by rating
    if (minRating > 0) {
      result = result.filter(bus => bus.rating >= minRating);
    }

    // Apply sorting
    switch (sortBy) {
      case "price_low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "duration":
        result.sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
        break;
      case "departure":
        result.sort((a, b) => {
          const aTime = parseInt(a.departure.replace(":", ""));
          const bTime = parseInt(b.departure.replace(":", ""));
          return aTime - bTime;
        });
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // Recommended - show highest rated first with availability
        result.sort((a, b) => {
          if (a.availableSeats <= 5 && b.availableSeats > 5) return 1;
          if (b.availableSeats <= 5 && a.availableSeats > 5) return -1;
          return b.rating - a.rating;
        });
    }

    // Legacy filter tabs
    if (selectedFilter === "Cheapest") {
      result.sort((a, b) => a.price - b.price);
    } else if (selectedFilter === "Fastest") {
      result.sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
    } else if (selectedFilter === "Available") {
      result = result.filter((b) => b.availableSeats > 5);
    }

    return result;
  }, [selectedFilter, buses, sortBy, selectedBusTypes, selectedTimeSlot, selectedAmenities, priceRange, minRating]);

  const renderBusCard = ({ item: bus }) => (
    <TouchableOpacity
      style={styles.busCard}
      onPress={() => handleSelectBus(bus)}
      activeOpacity={0.7}
    >
      {/* Header Row - Name and Price */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.busName}>{bus.name} ({bus.code})</Text>
          <Text style={styles.classLabel}>{bus.class}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={styles.priceText}>₹{bus.price.toLocaleString()}</Text>
          <View style={[styles.statusBadge, bus.availableSeats <= 5 && styles.statusBadgeLow]}>
            <Text style={[styles.statusText, bus.availableSeats <= 5 && styles.statusTextLow]}>
              {bus.availableSeats <= 5 ? `${bus.availableSeats} Left` : "Available"}
            </Text>
          </View>
        </View>
      </View>

      {/* Journey Details */}
      <View style={styles.journeySection}>
        {/* Departure */}
        <View style={styles.stationBlock}>
          <Text style={styles.stationName}>{from_loc} ({bus.from})</Text>
          <Text style={styles.journeyTime}>{bus.departure}</Text>
          <Text style={styles.journeyDate}>{selectedDate}</Text>
        </View>

        {/* Duration Line */}
        <View style={styles.durationSection}>
          <View style={styles.dottedLine} />
          <View style={styles.durationIconContainer}>
            <MaterialIcons name="train" size={16} color={Theme.colors.textSecondary} />
          </View>
          <View style={styles.dottedLine} />
          <Text style={styles.durationText}>Duration {bus.duration}</Text>
        </View>

        {/* Arrival */}
        <View style={[styles.stationBlock, styles.stationBlockRight]}>
          <Text style={styles.stationName}>{to_loc} ({bus.to})</Text>
          <Text style={styles.journeyTime}>{bus.arrival}</Text>
          <Text style={styles.journeyDate}>{selectedDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Theme.colors.surface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {from_loc} → {to_loc}
          </Text>
          <Text style={styles.headerSubtitle}>
            {selectedDate} • {passengers} Pax • {travelClass.charAt(0).toUpperCase() + travelClass.slice(1)}
          </Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <MaterialIcons name="edit" size={20} color={Theme.colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["All", "Recommended", "Cheapest", "Fastest"]}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item: filter }) => (
            <TouchableOpacity
              style={[styles.filterBtn, selectedFilter === filter && styles.filterBtnActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterBtnText, selectedFilter === filter && styles.filterBtnTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

    

      {/* Bus List */}
      <FlatList
        data={filteredBuses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBusCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={48} color={Theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No buses found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
              <Text style={styles.resetBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Filter FAB */}
      <TouchableOpacity style={styles.filterFab} onPress={() => setShowFilterModal(true)}>
        <MaterialIcons name="tune" size={20} color={Theme.colors.surface} />
        <Text style={styles.filterFabText}>Filters</Text>
        {activeFilterCount > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle}>Filters</Text>
                {activeFilterCount > 0 && (
                  <View style={styles.modalBadge}>
                    <Text style={styles.modalBadgeText}>{activeFilterCount} applied</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.modalCloseBtn}>
                <MaterialIcons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
              {/* Sort By Section */}
              <View style={styles.filterSection2}>
                <Text style={styles.filterSectionTitle}>Sort By</Text>
                <View style={styles.sortGrid}>
                  {SORT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.sortOption, sortBy === option.id && styles.sortOptionActive]}
                      onPress={() => setSortBy(option.id)}
                    >
                      <MaterialIcons
                        name={option.icon}
                        size={18}
                        color={sortBy === option.id ? Theme.colors.surface : Theme.colors.textSecondary}
                      />
                      <Text style={[styles.sortOptionText, sortBy === option.id && styles.sortOptionTextActive]}>
                        {option.label}
                      </Text>
                      {sortBy === option.id && (
                        <MaterialIcons name="check" size={16} color={Theme.colors.surface} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Bus Type Section */}
              <View style={styles.filterSection2}>
                <Text style={styles.filterSectionTitle}>Bus Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
                  {BUS_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.filterChip, selectedBusTypes.includes(type.id) && styles.filterChipActive]}
                      onPress={() => toggleBusType(type.id)}
                    >
                      <MaterialIcons
                        name={type.icon}
                        size={16}
                        color={selectedBusTypes.includes(type.id) ? Theme.colors.surface : Theme.colors.textSecondary}
                      />
                      <Text style={[styles.filterChipText, selectedBusTypes.includes(type.id) && styles.filterChipTextActive]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Departure Time Section */}
              <View style={styles.filterSection2}>
                <Text style={styles.filterSectionTitle}>Departure Time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
                  {TIME_SLOTS.map((slot) => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[styles.timeChip, selectedTimeSlot === slot.id && styles.timeChipActive]}
                      onPress={() => setSelectedTimeSlot(slot.id)}
                    >
                      <MaterialIcons
                        name={slot.icon}
                        size={20}
                        color={selectedTimeSlot === slot.id ? Theme.colors.surface : Theme.colors.primary}
                      />
                      <Text style={[styles.timeChipLabel, selectedTimeSlot === slot.id && styles.timeChipLabelActive]}>
                        {slot.label}
                      </Text>
                      {slot.desc && (
                        <Text style={[styles.timeChipDesc, selectedTimeSlot === slot.id && styles.timeChipDescActive]}>
                          {slot.desc}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Amenities Section */}
              <View style={styles.filterSection2}>
                <Text style={styles.filterSectionTitle}>Amenities</Text>
                <View style={styles.amenitiesGrid}>
                  {AMENITIES.map((amenity) => (
                    <TouchableOpacity
                      key={amenity.id}
                      style={[styles.amenityChip, selectedAmenities.includes(amenity.id) && styles.amenityChipActive]}
                      onPress={() => toggleAmenity(amenity.id)}
                    >
                      <MaterialIcons
                        name={amenity.icon}
                        size={16}
                        color={selectedAmenities.includes(amenity.id) ? Theme.colors.surface : Theme.colors.textSecondary}
                      />
                      <Text style={[styles.amenityChipText, selectedAmenities.includes(amenity.id) && styles.amenityChipTextActive]}>
                        {amenity.label}
                      </Text>
                      {selectedAmenities.includes(amenity.id) && (
                        <MaterialIcons name="check" size={14} color={Theme.colors.surface} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range Section */}
              <View style={styles.filterSection2}>
                <View style={styles.priceHeader}>
                  <Text style={styles.filterSectionTitle}>Price Range</Text>
                  <Text style={styles.priceValue}>₹{priceRange.min} - ₹{priceRange.max}</Text>
                </View>
                <View style={styles.priceGrid}>
                  {[
                    { label: "All", min: 0, max: 5000 },
                    { label: "Under ₹1000", min: 0, max: 1000 },
                    { label: "₹1000 - ₹2000", min: 1000, max: 2000 },
                    { label: "₹2000 - ₹3000", min: 2000, max: 3000 },
                    { label: "Above ₹3000", min: 3000, max: 5000 },
                  ].map((range, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.priceChip,
                        priceRange.min === range.min && priceRange.max === range.max && styles.priceChipActive
                      ]}
                      onPress={() => setPriceRange({ min: range.min, max: range.max })}
                    >
                      <Text style={[
                        styles.priceChipText,
                        priceRange.min === range.min && priceRange.max === range.max && styles.priceChipTextActive
                      ]}>
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Rating Section */}
              <View style={styles.filterSection2}>
                <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                <View style={styles.ratingGrid}>
                  {RATING_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.ratingChip, minRating === option.value && styles.ratingChipActive]}
                      onPress={() => setMinRating(option.value)}
                    >
                      <Text style={[styles.ratingChipText, minRating === option.value && styles.ratingChipTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooterContainer}>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.resetFilterBtn} onPress={resetFilters}>
                  <MaterialIcons name="refresh" size={18} color={Theme.colors.error} />
                  <Text style={styles.resetFilterText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyFilterBtn} 
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={styles.applyFilterText}>
                    Show {filteredBuses.length} Result{filteredBuses.length !== 1 ? 's' : ''}
                  </Text>
                  <MaterialIcons name="arrow-forward" size={18} color={Theme.colors.surface} />
                </TouchableOpacity>
              </View>
            </View>
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
    paddingTop: Platform.OS === "android" ? 20 : 25,
    paddingBottom: 14,
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
    fontSize: isSmall ? 15 : 17,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: isSmall ? 11 : 12,
    marginTop: 2,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterSection: {
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  filterBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  filterBtnTextActive: {
    color: Theme.colors.surface,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
  },
  listContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 80,
    gap: 14,
  },
  busCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardHeaderRight: {
    alignItems: "flex-end",
  },
  busName: {
    fontSize: isSmall ? 14 : 15,
    fontWeight: "700",
    color: Theme.colors.primary,
  },
  classLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  priceText: {
    fontSize: isSmall ? 16 : 18,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#E8F5E9",
  },
  statusBadgeLow: {
    backgroundColor: "#FFEBEE",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2E7D32",
  },
  statusTextLow: {
    color: "#C62828",
  },
  journeySection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  stationBlock: {
    flex: 1,
  },
  stationBlockRight: {
    alignItems: "flex-end",
  },
  stationName: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginBottom: 6,
  },
  journeyTime: {
    fontSize: isSmall ? 18 : 20,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  journeyDate: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  durationSection: {
    flex: 1.2,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },
  dottedLine: {
    width: "80%",
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginVertical: 2,
  },
  durationIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  durationText: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
  filterFab: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  filterFabText: {
    color: Theme.colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  fabBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Theme.colors.surface,
  },
  fabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Theme.colors.surface,
  },
  emptyContainer: {
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
    marginTop: 4,
  },
  resetBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: Theme.colors.primary,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.colors.surface,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.75,
    overflow: "hidden",
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
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  modalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: `${Theme.colors.primary}15`,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  filterSection2: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sortGrid: {
    gap: 8,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  sortOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  sortOptionTextActive: {
    color: Theme.colors.surface,
  },
  chipContainer: {
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: Theme.colors.surface,
  },
  timeChip: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Theme.colors.background,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    minWidth: 95,
  },
  timeChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  timeChipLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.colors.text,
    marginTop: 6,
  },
  timeChipLabelActive: {
    color: Theme.colors.surface,
  },
  timeChipDesc: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  timeChipDescActive: {
    color: "rgba(255,255,255,0.8)",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  amenityChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  amenityChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
  },
  amenityChipTextActive: {
    color: Theme.colors.surface,
  },
  priceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.colors.primary,
  },
  priceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priceChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  priceChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  priceChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
  },
  priceChipTextActive: {
    color: Theme.colors.surface,
  },
  ratingGrid: {
    flexDirection: "row",
    gap: 10,
  },
  ratingChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: "center",
  },
  ratingChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  ratingChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
  },
  ratingChipTextActive: {
    color: Theme.colors.surface,
  },
  modalFooterContainer: {
    backgroundColor: Theme.colors.surface,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 100 : 60,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  resetFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  resetFilterText: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.colors.error,
  },
  applyFilterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Theme.colors.primary,
  },
  applyFilterText: {
    fontSize: 15,
    fontWeight: "700",
    color: Theme.colors.surface,
  },
});

export default ResultsScreen;
