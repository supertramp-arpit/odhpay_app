import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
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

const NewBank = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const existingBeneficiary = route.params?.beneficiary;

  const [searchText, setSearchText] = useState("");
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [reEnterAccountNumber, setReEnterAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [errors, setErrors] = useState({});

  const filteredBanks = DUMMY_BANKS.filter((bank) =>
    bank.bankName.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setIfscCode(bank.ifscPrefix + "0");
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
      Alert.alert(
        "Success",
        `Bank account for ${accountHolderName} has been added successfully!`,
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const handleFindIfsc = () => {
    Alert.alert(
      "Find IFSC",
      "Enter your bank branch details to find IFSC code",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Use Sample", 
          onPress: () => setIfscCode(selectedBank?.ifscPrefix + "0001234") 
        },
      ]
    );
  };

  const renderBankItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bankItem}
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
      <Text style={styles.bankName} numberOfLines={1}>{item.bankName}</Text>
      <MaterialIcons name="chevron-right" size={normalize(24)} color={Theme.colors.textSecondary} />
    </TouchableOpacity>
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
          <ScrollView
            contentContainerStyle={styles.formContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Selected Bank Header */}
            <TouchableOpacity
              style={styles.selectedBankCard}
              onPress={() => setSelectedBank(null)}
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

            {/* Form Fields */}
            <View style={styles.formSection}>
              {/* Account Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Number</Text>
                <View style={[styles.inputContainer, errors.accountNumber && styles.inputError]}>
                  <MaterialIcons name="account-balance-wallet" size={normalize(20)} color={Theme.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter account number"
                    placeholderTextColor={Theme.colors.textLight}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="numeric"
                    maxLength={18}
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
                  <TouchableOpacity style={styles.findIfscButton} onPress={handleFindIfsc}>
                    <MaterialIcons name="search" size={normalize(18)} color={Theme.colors.secondary} />
                    <Text style={styles.findIfscText}>Find</Text>
                  </TouchableOpacity>
                </View>
                {errors.ifscCode && <Text style={styles.errorText}>{errors.ifscCode}</Text>}
              </View>

              {/* Account Holder Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Holder Name</Text>
                <View style={[styles.inputContainer, errors.accountHolderName && styles.inputError]}>
                  <MaterialIcons name="person" size={normalize(20)} color={Theme.colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter name as per bank records"
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
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Add Beneficiary</Text>
              <MaterialIcons name="arrow-forward" size={normalize(20)} color={Theme.colors.secondary} />
            </TouchableOpacity>
          </ScrollView>
        )}
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
    marginTop: normalize(10),
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.sm,
  },
  bankLogoContainer: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: normalize(14),
  },
  bankLogo: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(6),
  },
  bankName: {
    flex: 1,
    fontSize: normalize(15),
    fontWeight: "600",
    color: Theme.colors.text,
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
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    marginBottom: hp(3),
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

  // Continue Button
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary,
    paddingVertical: normalize(18),
    borderRadius: normalize(14),
    marginTop: hp(4),
    gap: normalize(10),
    ...Theme.shadows.md,
  },
  continueButtonText: {
    fontSize: normalize(17),
    fontWeight: "700",
    color: Theme.colors.secondary,
  },
});

export default NewBank;
