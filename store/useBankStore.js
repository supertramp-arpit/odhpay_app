import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Masked display form of an account number — never show the full number.
const maskAccount = (acc) => {
  const digits = String(acc || '').replace(/\D/g, '');
  return digits.length >= 4 ? `•••••• ${digits.slice(-4)}` : '——';
};

// Real accounts come from the backend (user_added_bank_details, type "self",
// KYC-verified only). This store used to ship a persisted hardcoded
// "John Doe" demo list — dropping `persist` also orphans that cached data.
export const useBankStore = create((set, get) => ({
  banks: [],
  isLoading: false,
  error: null,

  fetchBanks: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(
        'https://newapi.odhpay.com/payments/get_all_user_accounts',
        {
          params: { banktype: 'self' },
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      set({
        banks: rows.map((row, index) => ({
          id: row.id,
          bankName: row.bankName || 'Bank account',
          accountHolderName: row.bankACHolder || '',
          ifscCode: row.bankIFSC || '',
          accountNumber: maskAccount(row.bankACNumber),
          isPrimary: index === 0,
        })),
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false, error: 'Could not load bank accounts' });
    }
  },

  // Get primary bank
  getPrimaryBank: () => {
    const { banks } = get();
    return banks.find(bank => bank.isPrimary) || banks[0] || null;
  },

  // Set a bank as primary (display preference; local only)
  setPrimaryBank: (bankId) => {
    set((state) => ({
      banks: state.banks.map(bank => ({
        ...bank,
        isPrimary: bank.id === bankId,
      })),
    }));
  },

  // Local-only helpers kept for ManageBanksScreen compatibility.
  // NOTE: a real add-bank must go through POST /payments/add_new_bank
  // (OTP + KYC verification) — not yet wired in the app.
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

  removeBank: (bankId) => {
    set((state) => {
      const updatedBanks = state.banks.filter(bank => bank.id !== bankId);
      if (updatedBanks.length > 0 && !updatedBanks.some(b => b.isPrimary)) {
        updatedBanks[0].isPrimary = true;
      }
      return { banks: updatedBanks };
    });
  },
}));
