// stores/useWalletStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://newapi.odhpay.com';

// Get auth token
const getToken = async () => {
  return await AsyncStorage.getItem('access_token');
};

/**
 * Zustand store for wallet transactions
 * Replaces walletSlice from Redux
 */
export const useWalletStore = create((set, get) => ({
  transactionHistory: [],
  transactionData: [],
  loading: false,
  error: null,

  // Credit balance
  creditAmount: async (data) => {
    set({ loading: true, error: null });

    try {
      const access_token = await getToken();
      const session_id = await AsyncStorage.getItem('session_id');

      const formData = new FormData();
      formData.append('transaction_amount', data.transaction_amount);
      formData.append('utr_no', data.utr_no);
      formData.append('remark', data.remark || '');

      if (data.payment_screenshot) {
        const uri = data.payment_screenshot;
        const fileName = uri.split('/').pop();
        const fileType = fileName.split('.').pop();

        formData.append('payment_screenshot', {
          uri,
          name: fileName,
          type: `image/${fileType}`,
        });
      }

      const response = await axios.post(
        `${BASE_URL}/transaction/credit/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${access_token}`,
            session_id: session_id || '',
          },
        }
      );

      set({ loading: false, transactionData: response.data });
      return response.data;
    } catch (error) {
      console.error('Error crediting amount:', error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Get transaction history
  fetchHistory: async () => {
    set({ loading: true, error: null });

    try {
      const access_token = await getToken();
      const session_id = await AsyncStorage.getItem('session_id');

      const response = await axios.get(`${BASE_URL}/transaction/history/`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          session_id: session_id || '',
        },
      });

      set({ loading: false, transactionHistory: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching history:', error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Get final amount / balance
  getFinalAmount: () => {
    const { transactionHistory } = get();
    return transactionHistory?.final_amount || 0;
  },

  // Fetch wallet history with new API
  fetchWalletHistory: async (page = 1, pageSize = 20, transactionType = null) => {
    set({ loading: true, error: null });

    try {
      const access_token = await getToken();
      let url = `${BASE_URL}/api/v1/wallet/history?page=${page}&page_size=${pageSize}`;
      if (transactionType) {
        url += `&transaction_type=${transactionType}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      set({ loading: false, transactionHistory: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet history:', error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Initiate wallet topup via UPI
  initiateTopup: async (payerVpa, amount, integrityToken = '', integrityNonce = '') => {
    set({ loading: true, error: null });

    try {
      const access_token = await getToken();

      const response = await axios.post(
        `${BASE_URL}/api/v1/wallet/topup`,
        {
          payer_vpa: payerVpa,
          amount: parseFloat(amount),
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'x-integrity-token': integrityToken,
            'x-integrity-nonce': integrityNonce,
          },
        }
      );

      set({ loading: false, transactionData: response.data });
      return response.data;
    } catch (error) {
      console.error('Error initiating topup:', error);
      set({ loading: false, error: error.response?.data?.detail || error.message });
      throw error;
    }
  },

  // Check topup status
  checkTopupStatus: async (clientTxnId, merchantTranId) => {
    set({ loading: true, error: null });

    try {
      const access_token = await getToken();

      const response = await axios.post(
        `${BASE_URL}/api/v1/wallet/topup/status`,
        {
          client_txn_id: clientTxnId,
          merchant_tran_id: merchantTranId,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      set({ loading: false });
      return response.data;
    } catch (error) {
      console.error('Error checking topup status:', error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Fetch wallet balance
  fetchBalance: async () => {
    try {
      const access_token = await getToken();

      const response = await axios.get(
        `${BASE_URL}/api/v1/wallet/balance`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  },

  // Reset wallet state
  resetWallet: () => set({
    transactionHistory: [],
    transactionData: [],
    loading: false,
    error: null,
  }),
}));
