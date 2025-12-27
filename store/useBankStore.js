import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dummy bank data
const DUMMY_BANKS = [
  {
    id: '1',
    bankName: 'State Bank of India',
    shortName: 'SBI',
    accountNumber: '••••••5678',
    ifscCode: 'SBIN0001234',
    accountHolderName: 'John Doe',
    upiId: 'johndoe@sbi',
    isPrimary: true,
    bankLogo: 'https://logo.clearbit.com/sbi.co.in',
    bankColor: '#22409A',
  },
  {
    id: '2',
    bankName: 'HDFC Bank',
    shortName: 'HDFC',
    accountNumber: '••••••4321',
    ifscCode: 'HDFC0001234',
    accountHolderName: 'John Doe',
    upiId: 'johndoe@hdfcbank',
    isPrimary: false,
    bankLogo: 'https://logo.clearbit.com/hdfcbank.com',
    bankColor: '#004C8F',
  },
  {
    id: '3',
    bankName: 'ICICI Bank',
    shortName: 'ICICI',
    accountNumber: '••••••9876',
    ifscCode: 'ICIC0001234',
    accountHolderName: 'John Doe',
    upiId: 'johndoe@icici',
    isPrimary: false,
    bankLogo: 'https://logo.clearbit.com/icicibank.com',
    bankColor: '#F37920',
  },
  {
    id: '4',
    bankName: 'Axis Bank',
    shortName: 'AXIS',
    accountNumber: '••••••2468',
    ifscCode: 'UTIB0001234',
    accountHolderName: 'John Doe',
    upiId: 'johndoe@axisbank',
    isPrimary: false,
    bankLogo: 'https://logo.clearbit.com/axisbank.com',
    bankColor: '#97144D',
  },
  {
    id: '5',
    bankName: 'Kotak Mahindra Bank',
    shortName: 'KOTAK',
    accountNumber: '••••••1357',
    ifscCode: 'KKBK0001234',
    accountHolderName: 'John Doe',
    upiId: 'johndoe@kotak',
    isPrimary: false,
    bankLogo: 'https://logo.clearbit.com/kotak.com',
    bankColor: '#ED1C24',
  },
];

export const useBankStore = create(
  persist(
    (set, get) => ({
      banks: DUMMY_BANKS,
      isLoading: false,
      
      // Get primary bank
      getPrimaryBank: () => {
        const { banks } = get();
        return banks.find(bank => bank.isPrimary) || banks[0] || null;
      },
      
      // Set a bank as primary
      setPrimaryBank: (bankId) => {
        set((state) => ({
          banks: state.banks.map(bank => ({
            ...bank,
            isPrimary: bank.id === bankId,
          })),
        }));
      },
      
      // Add a new bank
      addBank: (bankData) => {
        const newBank = {
          ...bankData,
          id: Date.now().toString(),
          isPrimary: get().banks.length === 0,
        };
        set((state) => ({
          banks: [...state.banks, newBank],
        }));
      },
      
      // Remove a bank
      removeBank: (bankId) => {
        set((state) => {
          const updatedBanks = state.banks.filter(bank => bank.id !== bankId);
          // If removed bank was primary, make first bank primary
          if (updatedBanks.length > 0 && !updatedBanks.some(b => b.isPrimary)) {
            updatedBanks[0].isPrimary = true;
          }
          return { banks: updatedBanks };
        });
      },
      
      // Reset to dummy data
      resetBanks: () => {
        set({ banks: DUMMY_BANKS });
      },
    }),
    {
      name: 'bank-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useBankStore;
