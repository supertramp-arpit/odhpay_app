import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Clipboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Theme from "../../components/Theme";

const { width } = Dimensions.get("window");
const isSmall = width < 375;

// All Bus Offers Data
const ALL_OFFERS = [
  { 
    id: 1, 
    title: "Flat ₹100 OFF", 
    subtitle: "on first bus booking", 
    description: "Get flat ₹100 off on your first bus booking with ODH Pay. Valid for new users only.",
    code: "NEWBUS100", 
    icon: "local-offer", 
    color: "#FF6B6B",
    minAmount: 500,
    maxDiscount: 100,
    validTill: "31 Dec 2025",
    terms: ["Valid for new users only", "Minimum booking amount ₹500", "Cannot be combined with other offers"]
  },
  { 
    id: 2, 
    title: "Save up to ₹250", 
    subtitle: "on sleeper buses", 
    description: "Book any sleeper bus and save up to ₹250 on your journey. Perfect for overnight travel.",
    code: "SLEEPER250", 
    icon: "airline-seat-flat", 
    color: "#4ECDC4",
    minAmount: 1000,
    maxDiscount: 250,
    validTill: "31 Dec 2025",
    terms: ["Valid on sleeper buses only", "Minimum booking amount ₹1000", "Maximum discount ₹250"]
  },
  { 
    id: 3, 
    title: "20% Cashback", 
    subtitle: "on weekend travel", 
    description: "Get 20% cashback when you travel on weekends. Cashback will be credited to your wallet.",
    code: "WEEKEND20", 
    icon: "percent", 
    color: "#FFB800",
    minAmount: 800,
    maxDiscount: 200,
    validTill: "31 Dec 2025",
    terms: ["Valid on Saturday & Sunday bookings", "Maximum cashback ₹200", "Cashback credited within 24 hours"]
  },
  { 
    id: 4, 
    title: "₹50 OFF", 
    subtitle: "on AC buses", 
    description: "Travel in comfort with AC buses and get ₹50 off on every booking.",
    code: "COOL50", 
    icon: "ac-unit", 
    color: "#2196F3",
    minAmount: 400,
    maxDiscount: 50,
    validTill: "31 Dec 2025",
    terms: ["Valid on AC buses only", "Minimum booking amount ₹400", "One time use per user"]
  },
  { 
    id: 5, 
    title: "15% OFF", 
    subtitle: "on Volvo buses", 
    description: "Experience luxury travel with Volvo buses and enjoy 15% discount.",
    code: "VOLVO15", 
    icon: "directions-bus", 
    color: "#9C27B0",
    minAmount: 1200,
    maxDiscount: 300,
    validTill: "31 Dec 2025",
    terms: ["Valid on Volvo buses only", "Minimum booking amount ₹1200", "Maximum discount ₹300"]
  },
  { 
    id: 6, 
    title: "Buy 1 Get 1", 
    subtitle: "free on selected routes", 
    description: "Book one ticket and get another one absolutely free on selected popular routes.",
    code: "BOGO", 
    icon: "people", 
    color: "#E91E63",
    minAmount: 1500,
    maxDiscount: 1500,
    validTill: "25 Dec 2025",
    terms: ["Valid on selected routes", "Both passengers must travel together", "Subject to seat availability"]
  },
  { 
    id: 7, 
    title: "₹75 Wallet Bonus", 
    subtitle: "on first wallet payment", 
    description: "Pay using ODH Wallet for your bus booking and get ₹75 bonus credited instantly.",
    code: "WALLET75", 
    icon: "account-balance-wallet", 
    color: "#00BCD4",
    minAmount: 600,
    maxDiscount: 75,
    validTill: "31 Dec 2025",
    terms: ["Pay using ODH Wallet", "First wallet transaction only", "Bonus credited instantly"]
  },
  { 
    id: 8, 
    title: "Student Special", 
    subtitle: "10% extra discount", 
    description: "Students get an additional 10% discount on all bus bookings. Valid ID required.",
    code: "STUDENT10", 
    icon: "school", 
    color: "#FF9800",
    minAmount: 300,
    maxDiscount: 150,
    validTill: "31 Dec 2025",
    terms: ["Valid student ID required", "Age 16-25 years", "Can be combined with other offers"]
  },
];

const OffersScreen = () => {
  const navigation = useNavigation();
  const [expandedOffer, setExpandedOffer] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleBack = () => navigation.goBack();

  const handleCopyCode = (code) => {
    Clipboard.setString(code);
    setCopiedCode(code);
    Alert.alert("Code Copied!", `${code} has been copied to clipboard.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleExpand = (id) => {
    setExpandedOffer(expandedOffer === id ? null : id);
  };

  const renderOfferCard = (offer) => {
    const isExpanded = expandedOffer === offer.id;
    const isCopied = copiedCode === offer.code;

    return (
      <TouchableOpacity 
        key={offer.id} 
        style={styles.offerCard} 
        activeOpacity={0.9}
        onPress={() => toggleExpand(offer.id)}
      >
        {/* Main Content */}
        <View style={styles.offerMain}>
          <View style={[styles.offerIconContainer, { backgroundColor: `${offer.color}15` }]}>
            <MaterialIcons name={offer.icon} size={28} color={offer.color} />
          </View>
          
          <View style={styles.offerContent}>
            <Text style={styles.offerTitle}>{offer.title}</Text>
            <Text style={styles.offerSubtitle}>{offer.subtitle}</Text>
            <View style={styles.validityRow}>
              <MaterialIcons name="event" size={12} color={Theme.colors.textSecondary} />
              <Text style={styles.validityText}>Valid till {offer.validTill}</Text>
            </View>
          </View>

          <View style={styles.offerRight}>
            <MaterialIcons 
              name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={24} 
              color={Theme.colors.textSecondary} 
            />
          </View>
        </View>

        {/* Code Section */}
        <View style={styles.codeSection}>
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Use Code:</Text>
            <View style={[styles.codeBox, { borderColor: offer.color }]}>
              <Text style={[styles.codeText, { color: offer.color }]}>{offer.code}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.copyBtn, isCopied && styles.copiedBtn]}
            onPress={() => handleCopyCode(offer.code)}
          >
            <MaterialIcons 
              name={isCopied ? "check" : "content-copy"} 
              size={16} 
              color={isCopied ? "#4CAF50" : Theme.colors.primary} 
            />
            <Text style={[styles.copyText, isCopied && styles.copiedText]}>
              {isCopied ? "Copied" : "Copy"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.divider} />
            
            <Text style={styles.description}>{offer.description}</Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Min. Amount</Text>
                <Text style={styles.detailValue}>₹{offer.minAmount}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Max. Discount</Text>
                <Text style={styles.detailValue}>₹{offer.maxDiscount}</Text>
              </View>
            </View>

            <View style={styles.termsSection}>
              <Text style={styles.termsTitle}>Terms & Conditions:</Text>
              {offer.terms.map((term, idx) => (
                <View key={idx} style={styles.termRow}>
                  <View style={styles.termBullet} />
                  <Text style={styles.termText}>{term}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.applyBtn, { backgroundColor: offer.color }]}
              onPress={() => {
                handleCopyCode(offer.code);
                navigation.goBack();
              }}
            >
              <Text style={styles.applyBtnText}>Apply & Book Now</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Theme.colors.surface} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Bus Offers</Text>
          <Text style={styles.headerSubtitle}>{ALL_OFFERS.length} exclusive deals for you</Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialIcons name="local-offer" size={24} color={Theme.colors.surface} />
        </View>
      </View>

     

      {/* Offers List */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {ALL_OFFERS.map(renderOfferCard)}
        
        {/* Footer Note */}
        <View style={styles.footerNote}>
          <MaterialIcons name="info-outline" size={16} color={Theme.colors.textSecondary} />
          <Text style={styles.footerText}>
            Offers are subject to availability. T&C apply.
          </Text>
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
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    backgroundColor: Theme.colors.primary,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    color: Theme.colors.surface,
    fontSize: 18,
    fontWeight: "700",
  },
  bannerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginTop: 4,
  },
  bannerDecoration: {
    position: "absolute",
    right: 20,
    opacity: 0.5,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  offerCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  offerMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  offerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  offerContent: {
    flex: 1,
    marginLeft: 12,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  offerSubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  validityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  validityText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  offerRight: {
    padding: 4,
  },
  codeSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderStyle: "dashed",
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  codeLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  codeBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  codeText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: `${Theme.colors.primary}10`,
  },
  copiedBtn: {
    backgroundColor: "#E8F5E9",
  },
  copyText: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  copiedText: {
    color: "#4CAF50",
  },
  expandedSection: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Theme.colors.text,
    lineHeight: 20,
  },
  detailsGrid: {
    flexDirection: "row",
    marginTop: 16,
    gap: 16,
  },
  detailItem: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  termsSection: {
    marginTop: 16,
  },
  termsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: 8,
  },
  termRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  termBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Theme.colors.textSecondary,
    marginTop: 6,
    marginRight: 8,
  },
  termText: {
    flex: 1,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  applyBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
});

export default OffersScreen;
