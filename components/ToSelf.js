import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Animated,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Theme from "./Theme";

const { width, height } = Dimensions.get("window");
const scale = width / 375;
const normalize = (size) => Math.round(size * Math.min(scale, 1.3));
const wp = (percentage) => (width * percentage) / 100;
const hp = (percentage) => (height * percentage) / 100;

// Dummy Bank Data
const DUMMY_BANKS = [
  { id: "1", bankName: "State Bank of India", bankImage: "https://logo.clearbit.com/sbi.co.in", ifscPrefix: "SBIN" },
  { id: "2", bankName: "HDFC Bank", bankImage: "https://logo.clearbit.com/hdfcbank.com", ifscPrefix: "HDFC" },
  { id: "3", bankName: "ICICI Bank", bankImage: "https://logo.clearbit.com/icicibank.com", ifscPrefix: "ICIC" },
  { id: "4", bankName: "Axis Bank", bankImage: "https://logo.clearbit.com/axisbank.com", ifscPrefix: "UTIB" },
  { id: "5", bankName: "Kotak Mahindra Bank", bankImage: "https://logo.clearbit.com/kotak.com", ifscPrefix: "KKBK" },
  { id: "6", bankName: "Punjab National Bank", bankImage: "https://logo.clearbit.com/pnbindia.in", ifscPrefix: "PUNB" },
  { id: "7", bankName: "Bank of Baroda", bankImage: "https://logo.clearbit.com/bankofbaroda.in", ifscPrefix: "BARB" },
  { id: "8", bankName: "Canara Bank", bankImage: "https://logo.clearbit.com/canarabank.com", ifscPrefix: "CNRB" },
  { id: "9", bankName: "Union Bank of India", bankImage: "https://logo.clearbit.com/unionbankofindia.co.in", ifscPrefix: "UBIN" },
  { id: "10", bankName: "Yes Bank", bankImage: "https://logo.clearbit.com/yesbank.in", ifscPrefix: "YESB" },
  { id: "11", bankName: "IndusInd Bank", bankImage: "https://logo.clearbit.com/indusind.com", ifscPrefix: "INDB" },
  { id: "12", bankName: "Federal Bank", bankImage: "https://logo.clearbit.com/federalbank.co.in", ifscPrefix: "FDRL" },
];

// Dummy Branches Data
const DUMMY_BRANCHES = {
  "State Bank of India": [
    { id: "1", branch: "Mumbai Main Branch", ifsc: "SBIN0000001", city: "Mumbai", state: "Maharashtra" },
    { id: "2", branch: "Delhi Connaught Place", ifsc: "SBIN0000002", city: "New Delhi", state: "Delhi" },
    { id: "3", branch: "Bangalore MG Road", ifsc: "SBIN0000003", city: "Bangalore", state: "Karnataka" },
  ],
  "HDFC Bank": [
    { id: "1", branch: "Mumbai Bandra", ifsc: "HDFC0000001", city: "Mumbai", state: "Maharashtra" },
    { id: "2", branch: "Delhi Saket", ifsc: "HDFC0000002", city: "New Delhi", state: "Delhi" },
    { id: "3", branch: "Chennai T Nagar", ifsc: "HDFC0000003", city: "Chennai", state: "Tamil Nadu" },
  ],
  "ICICI Bank": [
    { id: "1", branch: "Mumbai Andheri", ifsc: "ICIC0000001", city: "Mumbai", state: "Maharashtra" },
    { id: "2", branch: "Pune Camp", ifsc: "ICIC0000002", city: "Pune", state: "Maharashtra" },
  ],
  "Axis Bank": [
    { id: "1", branch: "Mumbai Worli", ifsc: "UTIB0000001", city: "Mumbai", state: "Maharashtra" },
    { id: "2", branch: "Hyderabad Banjara Hills", ifsc: "UTIB0000002", city: "Hyderabad", state: "Telangana" },
  ],
};

const ToSelf = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insID = route.params?.insID || "default";

  const [searchText, setSearchText] = useState("");
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [reEnterAccountNumber, setReEnterAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Branch Popup State
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const filteredBanks = DUMMY_BANKS.filter((bank) =>
    bank.bankName.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setIfscCode(bank.ifscPrefix + "0");
    setBranchName("");
    
    // Animate form appearance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleChangeBank = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedBank(null);
      setAccountNumber("");
      setReEnterAccountNumber("");
      setIfscCode("");
      setBranchName("");
      setAccountHolderName("");
      setErrors({});
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!accountNumber || accountNumber.length < 9) {
      newErrors.accountNumber = "Enter valid account number (min 9 digits)";
    }
    if (accountNumber !== reEnterAccountNumber) {
      newErrors.reEnterAccountNumber = "Account numbers do not match";
    }
    if (!ifscCode || ifscCode.length !== 11) {
      newErrors.ifscCode = "Enter valid 11-character IFSC code";
    }
    if (!accountHolderName || accountHolderName.length < 3) {
      newErrors.accountHolderName = "Enter valid account holder name";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Simulate API call
      setTimeout(() => {
        setIsSubmitting(false);
        Alert.alert(
          "✓ Account Added",
          `Your ${selectedBank.bankName} account ending with ****${accountNumber.slice(-4)} has been added successfully.`,
          [
            {
              text: "Done",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }, 1500);
    }
  };

  // Get branches for selected bank
  const getBranches = () => {
    if (!selectedBank) return [];
    const branches = DUMMY_BRANCHES[selectedBank.bankName] || [];
    if (!branchSearch) return branches;
    return branches.filter(
      (b) =>
        b.branch.toLowerCase().includes(branchSearch.toLowerCase()) ||
        b.city.toLowerCase().includes(branchSearch.toLowerCase()) ||
        b.ifsc.toLowerCase().includes(branchSearch.toLowerCase())
    );
  };

  const handleBranchSelect = (branch) => {
    setIfscCode(branch.ifsc);
    setBranchName(`${branch.branch}, ${branch.city}`);
    setBranchModalVisible(false);
    setBranchSearch("");
  };

  const renderBankItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.bankItem, { marginTop: index === 0 ? normalize(12) : normalize(10) }]}
      onPress={() => handleBankSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.bankLogoContainer}>
        <Image
          source={{ uri: item.bankImage }}
          style={styles.bankLogo}
          defaultSource={require("../assets/LogoN.png")}
        />
      </View>
      <View style={styles.bankInfo}>
        <Text style={styles.bankName} numberOfLines={1}>{item.bankName}</Text>
        <Text style={styles.bankSubtext}>IFSC: {item.ifscPrefix}XXXXXXX</Text>
      </View>
      <MaterialIcons name="chevron-right" size={normalize(24)} color={Theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  // Branch Selection Modal
  const renderBranchModal = () => (
    <Modal
      visible={branchModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setBranchModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Branch</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setBranchModalVisible(false)}
            >
              <MaterialIcons name="close" size={normalize(24)} color={Theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearchContainer}>
            <MaterialIcons name="search" size={normalize(20)} color={Theme.colors.textSecondary} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search by branch, city or IFSC"
              placeholderTextColor={Theme.colors.textLight}
              value={branchSearch}
              onChangeText={setBranchSearch}
            />
          </View>

          <FlatList
            data={getBranches()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.branchItem}
                onPress={() => handleBranchSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.branchIconContainer}>
                  <MaterialIcons name="location-on" size={normalize(20)} color={Theme.colors.primary} />
                </View>
                <View style={styles.branchDetails}>
                  <Text style={styles.branchName}>{item.branch}</Text>
                  <Text style={styles.branchCity}>{item.city}, {item.state}</Text>
                  <Text style={styles.branchIfsc}>IFSC: {item.ifsc}</Text>
                </View>
                <MaterialIcons name="check-circle-outline" size={normalize(22)} color={Theme.colors.success} />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.branchListContent}
            ListEmptyComponent={
              <View style={styles.emptyBranchContainer}>
                <MaterialIcons name="account-balance" size={normalize(48)} color={Theme.colors.textLight} />
                <Text style={styles.emptyBranchText}>No branches found</Text>
                <Text style={styles.emptyBranchSubtext}>Try a different search term</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container} >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {!selectedBank ? (
          // Bank Selection View
          <View style={styles.bankListContainer}>
            {/* Header */}
            <View style={styles.headerSection}>
              <View style={styles.iconBox}>
                <MaterialIcons name="account-balance-wallet" size={normalize(32)} color={Theme.colors.secondary} />
              </View>
              <Text style={styles.headerTitle}>Add Your Account</Text>
              <Text style={styles.headerSubtitle}>Link your own bank account for transfers</Text>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={normalize(22)} color={Theme.colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search bank name"
                placeholderTextColor={Theme.colors.textLight}
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <MaterialIcons name="close" size={normalize(20)} color={Theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Popular Banks */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {searchText ? `Results (${filteredBanks.length})` : "Popular Banks"}
              </Text>
            </View>

            {/* Bank List */}
            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.id}
              renderItem={renderBankItem}
              contentContainerStyle={styles.bankListContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="search-off" size={normalize(48)} color={Theme.colors.textLight} />
                  <Text style={styles.emptyText}>No banks found</Text>
                </View>
              }
            />
          </View>
        ) : (
          // Account Details Form
          <Animated.ScrollView
            contentContainerStyle={styles.formContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ opacity: fadeAnim }}
          >
            {/* Selected Bank Header */}
            <TouchableOpacity
              style={styles.selectedBankCard}
              onPress={handleChangeBank}
              activeOpacity={0.8}
            >
              <View style={styles.selectedBankLogoContainer}>
                <Image
                  source={{ uri: selectedBank.bankImage }}
                  style={styles.selectedBankLogo}
                />
              </View>
              <View style={styles.selectedBankInfo}>
                <Text style={styles.selectedBankName}>{selectedBank.bankName}</Text>
                <Text style={styles.changeBankText}>Tap to change bank</Text>
              </View>
              <MaterialIcons name="swap-horiz" size={normalize(24)} color={Theme.colors.primary} />
            </TouchableOpacity>

            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <MaterialIcons name="info-outline" size={normalize(18)} color={Theme.colors.primary} />
              <Text style={styles.infoBannerText}>
                Adding your own account allows you to transfer funds to yourself
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              {/* Account Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Number</Text>
                <View style={[styles.inputContainer, errors.accountNumber && styles.inputError]}>
                  <MaterialIcons name="account-balance-wallet" size={normalize(20)} color={Theme.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your account number"
                    placeholderTextColor={Theme.colors.textLight}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="numeric"
                    maxLength={18}
                    secureTextEntry={true}
                  />
                </View>
                {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
              </View>

              {/* Re-enter Account Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Account Number</Text>
                <View style={[styles.inputContainer, errors.reEnterAccountNumber && styles.inputError]}>
                  <MaterialIcons name="verified" size={normalize(20)} color={Theme.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter account number"
                    placeholderTextColor={Theme.colors.textLight}
                    value={reEnterAccountNumber}
                    onChangeText={setReEnterAccountNumber}
                    keyboardType="numeric"
                    maxLength={18}
                  />
                  {accountNumber && accountNumber === reEnterAccountNumber && (
                    <MaterialIcons name="check-circle" size={normalize(20)} color={Theme.colors.success} />
                  )}
                </View>
                {errors.reEnterAccountNumber && <Text style={styles.errorText}>{errors.reEnterAccountNumber}</Text>}
              </View>

              {/* IFSC Code */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>IFSC Code</Text>
                <View style={styles.ifscRow}>
                  <View style={[styles.inputContainer, styles.ifscInput, errors.ifscCode && styles.inputError]}>
                    <MaterialIcons name="pin" size={normalize(20)} color={Theme.colors.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter IFSC"
                      placeholderTextColor={Theme.colors.textLight}
                      value={ifscCode}
                      onChangeText={(text) => setIfscCode(text.toUpperCase())}
                      autoCapitalize="characters"
                      maxLength={11}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.findIfscButton}
                    onPress={() => setBranchModalVisible(true)}
                  >
                    <MaterialIcons name="search" size={normalize(18)} color={Theme.colors.secondary} />
                    <Text style={styles.findIfscText}>Find</Text>
                  </TouchableOpacity>
                </View>
                {errors.ifscCode && <Text style={styles.errorText}>{errors.ifscCode}</Text>}
              </View>

              {/* Branch Name Display */}
              {branchName ? (
                <View style={styles.branchDisplay}>
                  <MaterialIcons name="location-on" size={normalize(18)} color={Theme.colors.success} />
                  <Text style={styles.branchDisplayText}>{branchName}</Text>
                </View>
              ) : null}

              {/* Account Holder Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Holder Name</Text>
                <View style={[styles.inputContainer, errors.accountHolderName && styles.inputError]}>
                  <MaterialIcons name="person" size={normalize(20)} color={Theme.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name as per bank records"
                    placeholderTextColor={Theme.colors.textLight}
                    value={accountHolderName}
                    onChangeText={setAccountHolderName}
                    autoCapitalize="words"
                  />
                </View>
                {errors.accountHolderName && <Text style={styles.errorText}>{errors.accountHolderName}</Text>}
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.continueButton, isSubmitting && styles.continueButtonDisabled]}
              onPress={handleContinue}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.continueButtonText}>Adding Account...</Text>
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Add Account</Text>
                  <MaterialIcons name="arrow-forward" size={normalize(20)} color={Theme.colors.secondary} />
                </>
              )}
            </TouchableOpacity>

            {/* Security Note */}
            <View style={styles.securityNote}>
              <MaterialIcons name="lock" size={normalize(14)} color={Theme.colors.textLight} />
              <Text style={styles.securityNoteText}>
                Your account details are encrypted and secure
              </Text>
            </View>
          </Animated.ScrollView>
        )}

        {/* Branch Selection Modal */}
        {renderBranchModal()}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },

  // Bank List View
  bankListContainer: {
    flex: 1,
  },
  headerSection: {
    alignItems: "center",
    paddingTop: hp(3),
    paddingBottom: hp(2),
    paddingHorizontal: wp(5),
    backgroundColor: Theme.colors.secondary,
  },
  iconBox: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(20),
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: normalize(16),
    ...Theme.shadows.md,
  },
  headerTitle: {
    fontSize: normalize(24),
    fontWeight: "800",
    color: Theme.colors.text,
    marginBottom: normalize(8),
  },
  headerSubtitle: {
    fontSize: normalize(14),
    color: Theme.colors.textSecondary,
    textAlign: "center",
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.secondary,
    marginHorizontal: wp(5),
    marginTop: hp(2),
    marginBottom: hp(1),
    paddingHorizontal: normalize(16),
    paddingVertical: Platform.OS === "ios" ? normalize(14) : normalize(10),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: normalize(12),
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(15),
    color: Theme.colors.text,
    paddingVertical: 0,
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
  },
  sectionTitle: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: Theme.colors.text,
  },

  // Bank List
  bankListContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.secondary,
    padding: normalize(16),
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  bankLogoContainer: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: normalize(14),
  },
  bankLogo: {
    width: normalize(30),
    height: normalize(30),
    borderRadius: normalize(6),
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: normalize(15),
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: normalize(4),
  },
  bankSubtext: {
    fontSize: normalize(12),
    color: Theme.colors.textSecondary,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    paddingTop: hp(10),
  },
  emptyText: {
    fontSize: normalize(16),
    color: Theme.colors.textLight,
    marginTop: normalize(12),
  },

  // Form View
  formContainer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },
  selectedBankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.secondary,
    padding: normalize(16),
    borderRadius: normalize(16),
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    marginBottom: hp(2),
    ...Theme.shadows.sm,
  },
  selectedBankLogoContainer: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(14),
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedBankLogo: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(8),
  },
  selectedBankInfo: {
    flex: 1,
    marginLeft: normalize(14),
  },
  selectedBankName: {
    fontSize: normalize(16),
    fontWeight: "700",
    color: Theme.colors.text,
  },
  changeBankText: {
    fontSize: normalize(12),
    color: Theme.colors.primary,
    marginTop: normalize(4),
  },

  // Info Banner
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.inputBg,
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(12),
    borderRadius: normalize(10),
    marginBottom: hp(2),
    gap: normalize(10),
  },
  infoBannerText: {
    flex: 1,
    fontSize: normalize(13),
    color: Theme.colors.textSecondary,
    lineHeight: normalize(18),
  },

  // Form Section
  formSection: {
    gap: normalize(16),
  },
  inputGroup: {
    marginBottom: normalize(4),
  },
  label: {
    fontSize: normalize(14),
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: normalize(8),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.secondary,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    paddingVertical: Platform.OS === "ios" ? normalize(14) : normalize(10),
    gap: normalize(12),
  },
  inputError: {
    borderColor: Theme.colors.danger,
  },
  input: {
    flex: 1,
    fontSize: normalize(16),
    color: Theme.colors.text,
    paddingVertical: 0,
  },
  errorText: {
    fontSize: normalize(12),
    color: Theme.colors.danger,
    marginTop: normalize(6),
    marginLeft: normalize(4),
  },

  // IFSC Row
  ifscRow: {
    flexDirection: "row",
    gap: normalize(12),
  },
  ifscInput: {
    flex: 1,
  },
  findIfscButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: normalize(16),
    borderRadius: normalize(12),
    gap: normalize(6),
  },
  findIfscText: {
    fontSize: normalize(14),
    fontWeight: "600",
    color: Theme.colors.secondary,
  },

  // Branch Display
  branchDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(10),
    borderRadius: normalize(8),
    marginTop: -normalize(8),
    gap: normalize(8),
  },
  branchDisplayText: {
    flex: 1,
    fontSize: normalize(13),
    color: Theme.colors.success,
    fontWeight: "500",
  },

  // Continue Button
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary,
    paddingVertical: normalize(18),
    borderRadius: normalize(14),
    marginTop: hp(3),
    gap: normalize(10),
    ...Theme.shadows.md,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    fontSize: normalize(17),
    fontWeight: "700",
    color: Theme.colors.secondary,
  },

  // Security Note
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(2),
    gap: normalize(6),
  },
  securityNoteText: {
    fontSize: normalize(12),
    color: Theme.colors.textLight,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Theme.colors.secondary,
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    maxHeight: hp(70),
    paddingBottom: hp(4),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1),
  },
  modalTitle: {
    fontSize: normalize(20),
    fontWeight: "700",
    color: Theme.colors.text,
  },
  modalCloseBtn: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.inputBg,
    marginHorizontal: wp(5),
    marginVertical: hp(1.5),
    paddingHorizontal: normalize(14),
    paddingVertical: Platform.OS === "ios" ? normalize(12) : normalize(8),
    borderRadius: normalize(10),
    gap: normalize(10),
  },
  modalSearchInput: {
    flex: 1,
    fontSize: normalize(15),
    color: Theme.colors.text,
    paddingVertical: 0,
  },
  branchListContent: {
    paddingHorizontal: wp(5),
  },
  branchItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.secondary,
    padding: normalize(14),
    borderRadius: normalize(12),
    marginBottom: normalize(10),
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  branchIconContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: normalize(12),
  },
  branchDetails: {
    flex: 1,
  },
  branchName: {
    fontSize: normalize(14),
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: normalize(2),
  },
  branchCity: {
    fontSize: normalize(12),
    color: Theme.colors.textSecondary,
    marginBottom: normalize(2),
  },
  branchIfsc: {
    fontSize: normalize(11),
    color: Theme.colors.primary,
    fontWeight: "500",
  },
  emptyBranchContainer: {
    alignItems: "center",
    paddingTop: hp(6),
    paddingBottom: hp(4),
  },
  emptyBranchText: {
    fontSize: normalize(16),
    fontWeight: "600",
    color: Theme.colors.textSecondary,
    marginTop: normalize(12),
  },
  emptyBranchSubtext: {
    fontSize: normalize(13),
    color: Theme.colors.textLight,
    marginTop: normalize(4),
  },
});

export default ToSelf;
