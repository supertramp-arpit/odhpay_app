import { create } from 'zustand';
import axios from 'axios';
import { WALLET_API as BASE_URL, apiErrorMessage, authHeaders, signedAuthHeaders } from '../utils/walletApi';

export { apiErrorMessage };

const toBank = (row) => ({
  id: row.id,
  bankName: row.bank_name || 'Bank account',
  accountHolderName: row.account_holder || '',
  ifscCode: row.ifsc || '',
  accountNumber: row.account_number_masked, // server only ever sends the masked form
});

// Saved withdrawal accounts — /api/v1/wallet/banks (wallet-enabled users only).
export const useBankStore = create((set, get) => ({
  banks: [],
  maxAccounts: 5,
  isLoading: false,
  loaded: false,
  error: null,

  fetchBanks: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await axios.get(`${BASE_URL}/banks`, { headers: await authHeaders() });
      const rows = Array.isArray(res.data?.banks) ? res.data.banks : [];
      set({
        banks: rows.map(toBank),
        maxAccounts: res.data?.max_accounts || 5,
        isLoading: false,
        loaded: true,
      });
    } catch (e) {
      set({ isLoading: false, loaded: true, error: apiErrorMessage(e, 'Could not load bank accounts') });
    }
  },

  // Throws on failure so the form can show the server's message.
  addBank: async ({ accountHolder, accountNumber, confirmAccountNumber, ifsc }) => {
    const res = await axios.post(
      `${BASE_URL}/banks`,
      {
        account_holder: accountHolder,
        account_number: accountNumber,
        confirm_account_number: confirmAccountNumber,
        ifsc,
      },
      { headers: await signedAuthHeaders() }
    );
    const bank = toBank(res.data.bank);
    set((state) => ({ banks: [bank, ...state.banks.filter((b) => b.id !== bank.id)] }));
    return bank;
  },

  removeBank: async (bankId) => {
    await axios.delete(`${BASE_URL}/banks/${bankId}`, {
      headers: await signedAuthHeaders(),
    });
    set((state) => ({ banks: state.banks.filter((bank) => bank.id !== bankId) }));
  },

  getPrimaryBank: () => get().banks[0] || null,
}));
