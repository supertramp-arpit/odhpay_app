// stores/useAadharStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { integrityHeaders } from '../utils/secureRequest';

const BASE_URL = 'https://newapi.odhpay.com';

// Get auth token
const getToken = async () => {
  return await AsyncStorage.getItem('access_token');
};

/**
 * Zustand store for Aadhar KYC
 * Replaces AadharSlice from Redux
 */
export const useAadharStore = create(
  persist(
    (set, get) => ({
      captchData: [],
      AadharData: [],
      AadharDetail: [],
      PanDetail: [],
      PanData: false,
      loading: false,
      otpSent: false,
      error: null,

      // Set OTP sent state
      setOtpSent: (value) => set({ otpSent: value ?? false, PanData: false }),

      // Initiate Aadhar KYC session
      initiateAadharKyc: async () => {
        set({ loading: true, error: null });

        try {
          const access_token = await getToken();
          const session_id = await AsyncStorage.getItem('session_id');

          const response = await axios.get(`${BASE_URL}/InitiateSession/`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access_token}`,
              session_id: session_id || '',
              // Guarded by require_fresh_integrity on the backend.
              ...(await integrityHeaders()),
            },
          });

          // Store session_id
          if (response.data?.session_id) {
            await AsyncStorage.setItem('session_id', response.data.session_id);
          }

          set({ captchData: response.data, loading: false });
          return response.data;
        } catch (error) {
          console.error('Error initiating Aadhar KYC:', error);
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Generate OTP
      generateOtp: async (data) => {
        set({ loading: true, error: null });

        try {
          const access_token = await getToken();
          const session_id = await AsyncStorage.getItem('session_id');

          const response = await axios.post(`${BASE_URL}/otp_generate/`, data, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access_token}`,
              session_id: session_id || '',
              // Guarded by require_fresh_integrity on the backend.
              ...(await integrityHeaders()),
            },
          });

          set({ loading: false, otpSent: true });
          return response.data;
        } catch (error) {
          console.error('Error generating OTP:', error);
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Verify Aadhar OTP
      verifyAadharOtp: async (data) => {
        set({ loading: true, error: null });

        try {
          const access_token = await getToken();
          const session_id = await AsyncStorage.getItem('session_id');

          const response = await axios.post(`${BASE_URL}/verify-otp/`, data, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access_token}`,
              session_id: session_id || '',
              // Guarded by require_fresh_integrity on the backend.
              ...(await integrityHeaders()),
            },
          });

          set({ 
            loading: false, 
            otpSent: false, 
            AadharData: response.data 
          });
          return response.data;
        } catch (error) {
          console.error('Error verifying OTP:', error);
          set({ loading: false, error: error.message || 'OTP verification failed' });
          throw error;
        }
      },

      // Get Aadhar Detail
      getAadharDetail: async () => {
        set({ loading: true, error: null });

        try {
          const access_token = await getToken();
          const session_id = await AsyncStorage.getItem('session_id');

          const response = await axios.get(`${BASE_URL}/userAadharDetail/`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access_token}`,
              session_id: session_id || '',
            },
          });

          set({ 
            loading: false, 
            otpSent: false, 
            AadharDetail: response.data 
          });
          return response.data;
        } catch (error) {
          console.error('Error getting Aadhar detail:', error);
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Get PAN Detail
      getPanDetail: async () => {
        set({ loading: true, error: null });

        try {
          const access_token = await getToken();
          const session_id = await AsyncStorage.getItem('session_id');

          const response = await axios.get(`${BASE_URL}/getPanDetails/`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access_token}`,
              session_id: session_id || '',
            },
          });

          set({ 
            loading: false, 
            otpSent: false, 
            PanDetail: response.data 
          });
          return response.data;
        } catch (error) {
          console.error('Error getting PAN detail:', error);
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Verify PAN
      verifyPan: async (data) => {
        set({ loading: true, error: null });

        try {
          const access_token = await getToken();
          const session_id = await AsyncStorage.getItem('session_id');

          const response = await axios.post(`${BASE_URL}/verify-pan`, data, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access_token}`,
              session_id: session_id || '',
              // Guarded by require_fresh_integrity on the backend.
              ...(await integrityHeaders()),
            },
          });

          set({ 
            loading: false, 
            otpSent: false, 
            PanData: true 
          });
          return response.data;
        } catch (error) {
          console.error('Error verifying PAN:', error);
          set({ loading: false, error: error.message || 'PAN verification failed' });
          throw error;
        }
      },

      // Test API (for development)
      testApi: async () => {
        set({ loading: true, error: null });

        try {
          const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
          const data = await response.json();

          set({ 
            loading: false, 
            otpSent: true, 
            PanData: true,
            AadharData: { success: 'success' }
          });
          return data;
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Reset Aadhar state
      resetAadhar: () => set({
        captchData: [],
        AadharData: [],
        AadharDetail: [],
        PanDetail: [],
        PanData: false,
        loading: false,
        otpSent: false,
        error: null,
      }),
    }),
    {
      name: 'aadhar-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        AadharDetail: state.AadharDetail,
        PanDetail: state.PanDetail,
      }),
    }
  )
);
