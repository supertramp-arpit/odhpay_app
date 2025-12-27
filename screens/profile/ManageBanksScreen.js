import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Modal,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import Theme from '../../components/Theme';
import { useBankStore } from '../../store/useBankStore';

const { width } = Dimensions.get('window');

// Available banks for adding
const AVAILABLE_BANKS = [
  { id: 'sbi', name: 'State Bank of India', shortName: 'SBI', color: '#22409A', logo: 'https://logo.clearbit.com/sbi.co.in' },
  { id: 'hdfc', name: 'HDFC Bank', shortName: 'HDFC', color: '#004C8F', logo: 'https://logo.clearbit.com/hdfcbank.com' },
  { id: 'icici', name: 'ICICI Bank', shortName: 'ICICI', color: '#F37920', logo: 'https://logo.clearbit.com/icicibank.com' },
  { id: 'axis', name: 'Axis Bank', shortName: 'AXIS', color: '#97144D', logo: 'https://logo.clearbit.com/axisbank.com' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', shortName: 'KOTAK', color: '#ED1C24', logo: 'https://logo.clearbit.com/kotak.com' },
  { id: 'bob', name: 'Bank of Baroda', shortName: 'BOB', color: '#F15A22', logo: 'https://logo.clearbit.com/bankofbaroda.in' },
  { id: 'pnb', name: 'Punjab National Bank', shortName: 'PNB', color: '#D71920', logo: 'https://logo.clearbit.com/pnbindia.in' },
  { id: 'canara', name: 'Canara Bank', shortName: 'CANARA', color: '#FFD700', logo: 'https://logo.clearbit.com/canarabank.com' },
];

const ManageBanksScreen = () => {
  const navigation = useNavigation();
  const { banks, setPrimaryBank, addBank, removeBank } = useBankStore();
  
  const [selectedBankToAdd, setSelectedBankToAdd] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSetPrimary = (bankId) => {
    setPrimaryBank(bankId);
  };

  const handleRemoveBank = (bank) => {
    Alert.alert(
      'Remove Bank Account',
      `Are you sure you want to remove ${bank.bankName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeBank(bank.id)
        },
      ]
    );
  };

  const handleAddBank = () => {
    if (!selectedBankToAdd || !upiId.trim()) {
      Alert.alert('Error', 'Please select a bank and enter UPI ID');
      return;
    }

    const newBank = {
      bankName: selectedBankToAdd.name,
      shortName: selectedBankToAdd.shortName,
      accountNumber: '••••••' + Math.floor(1000 + Math.random() * 9000),
      ifscCode: selectedBankToAdd.shortName.substring(0, 4).toUpperCase() + '0001234',
      accountHolderName: 'User',
      upiId: upiId.trim(),
      bankLogo: selectedBankToAdd.logo,
      bankColor: selectedBankToAdd.color,
    };

    addBank(newBank);
    setSelectedBankToAdd(null);
    setUpiId('');
  };

  const filteredAvailableBanks = AVAILABLE_BANKS.filter(bank =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderBankCard = (bank, index) => (
    <View key={bank.id} style={[styles.bankCard, bank.isPrimary && styles.bankCardPrimary]}>
      <TouchableOpacity 
        style={styles.bankCardContent}
        activeOpacity={0.7}
        onPress={() => handleSetPrimary(bank.id)}
      >
        {/* Bank Logo */}
        <View style={[styles.bankLogoContainer, { backgroundColor: bank.bankColor + '15' }]}>
          <Image 
            source={{ uri: bank.bankLogo }} 
            style={styles.bankLogo}
            resizeMode="contain"
          />
        </View>

        {/* Bank Details */}
        <View style={styles.bankDetails}>
          <Text style={styles.bankName} numberOfLines={1}>{bank.bankName}</Text>
          <Text style={styles.upiHandle}>{bank.upiId}</Text>
        </View>

        {/* Right Section - Primary Badge or Radio */}
        <View style={styles.bankRightSection}>
          {bank.isPrimary ? (
            <View style={styles.primaryBadge}>
              <MaterialIcons name="check" size={14} color="#FFF" />
              <Text style={styles.primaryBadgeText}>Primary</Text>
            </View>
          ) : (
            <View style={styles.radioOuter}>
              <View style={styles.radioInner} />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Bottom Actions */}
      <View style={styles.bankCardActions}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => handleRemoveBank(bank)}
        >
          <Feather name="trash-2" size={16} color="#EF4444" />
          <Text style={styles.actionBtnTextDelete}>Remove</Text>
        </TouchableOpacity>
        
        {!bank.isPrimary && (
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => handleSetPrimary(bank.id)}
          >
            <MaterialIcons name="star-outline" size={16} color={Theme.colors.primary} />
            <Text style={styles.actionBtnText}>Set as Primary</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container} >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Accounts</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bank List */}
        <View style={styles.bankListSection}>
          <Text style={styles.sectionTitle}>Your Banks</Text>
          
          {banks.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="account-balance-wallet" size={64} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>No Bank Accounts</Text>
              <Text style={styles.emptySubtitle}>Add a bank account to start making payments</Text>
            </View>
          ) : (
            banks.map((bank, index) => renderBankCard(bank, index))
          )}
        </View>
      </ScrollView>

      {/* Add Bank Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.addBankBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("NewBank")}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FFF" />
          <Text style={styles.addBankBtnText}>Add New Bank Account</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  bankListSection: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bankCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  bankCardPrimary: {
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  bankCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  bankLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bankLogo: {
    width: 28,
    height: 28,
  },
  bankDetails: {
    flex: 1,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  upiHandle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  bankRightSection: {
    marginLeft: 12,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 0,
    height: 0,
    borderRadius: 5,
    backgroundColor: Theme.colors.primary,
  },
  bankCardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 16,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.colors.primary,
  },
  actionBtnTextDelete: {
    fontSize: 13,
    fontWeight: '500',
    color: '#EF4444',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addBankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  addBankBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    paddingBottom:35
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 10,
    fontSize: 15,
    color: '#1a1a1a',
  },
  bankListModal: {
    maxHeight: 250,
  },
  bankSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  bankSelectItemActive: {
    backgroundColor: Theme.colors.primary + '08',
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  bankSelectLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankSelectLogoImg: {
    width: 24,
    height: 24,
  },
  bankSelectName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  upiInputContainer: {
    marginTop: 20,
  },
  upiLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  upiInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1a1a1a',
  },
  modalAddBtn: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  modalAddBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  modalAddBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default ManageBanksScreen;
